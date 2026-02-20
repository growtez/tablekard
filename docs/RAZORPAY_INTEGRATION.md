# 💳 Razorpay Integration — Tablekard

> Complete integration guide for Razorpay payment gateway in the Tablekard QR-based ordering web app.

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [How It Maps to Your State Transition Diagram](#2-how-it-maps-to-your-state-transition-diagram)
3. [Database Changes Required](#3-database-changes-required)
4. [Supabase Edge Functions (Backend)](#4-supabase-edge-functions-backend)
5. [Frontend Integration (React)](#5-frontend-integration-react)
6. [Webhook Handling](#6-webhook-handling)
7. [Security Checklist](#7-security-checklist)
8. [Testing Guide](#8-testing-guide)
9. [Step-by-Step Implementation Plan](#9-step-by-step-implementation-plan)

---

## 1. Overview & Architecture

### Payment Flow Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Customer    │     │  Customer Web    │     │ Supabase Edge    │     │    Razorpay      │
│  (Browser)   │     │  (React App)     │     │ Functions        │     │    Servers        │
└──────┬───────┘     └───────┬──────────┘     └───────┬──────────┘     └───────┬──────────┘
       │                     │                        │                        │
       │  1. Click "Pay Online"                       │                        │
       │ ──────────────────► │                        │                        │
       │                     │                        │                        │
       │                     │  2. POST /create-order │                        │
       │                     │ ──────────────────────►│                        │
       │                     │                        │                        │
       │                     │                        │  3. Create Razorpay    │
       │                     │                        │     Order (API call)   │
       │                     │                        │ ──────────────────────►│
       │                     │                        │                        │
       │                     │                        │  4. Return order_id    │
       │                     │                        │ ◄──────────────────────│
       │                     │                        │                        │
       │                     │  5. Return razorpay_order_id                   │
       │                     │ ◄──────────────────────│                        │
       │                     │                        │                        │
       │  6. Open Razorpay   │                        │                        │
       │     Checkout Modal  │                        │                        │
       │ ◄───────────────────│                        │                        │
       │                     │                        │                        │
       │  7. Customer pays   │                        │                        │
       │ (UPI / Card / etc.) │                        │                        │
       │ ──────────────────────────────────────────────────────────────────────►
       │                     │                        │                        │
       │  8. Payment Success/Failure callback         │                        │
       │ ◄──────────────────────────────────────────────────────────────────────
       │                     │                        │                        │
       │                     │  9. POST /verify-payment (razorpay_payment_id,  │
       │                     │     razorpay_order_id, razorpay_signature)      │
       │                     │ ──────────────────────►│                        │
       │                     │                        │                        │
       │                     │                        │  10. Verify signature  │
       │                     │                        │      (HMAC SHA256)     │
       │                     │                        │                        │
       │                     │                        │  11. Update DB:        │
       │                     │                        │  payment_status='PAID' │
       │                     │                        │                        │
       │                     │  12. Return success    │                        │
       │                     │ ◄──────────────────────│                        │
       │                     │                        │                        │
       │  13. Navigate to    │                        │                        │
       │      Order Success  │                        │                        │
       │ ◄───────────────────│                        │                        │
       │                     │                        │                        │
       │                     │                        │  14. Webhook: payment  │
       │                     │                        │      .captured event   │
       │                     │                        │ ◄──────────────────────│
       │                     │                        │                        │
       │                     │                        │  15. Final DB update   │
       │                     │                        │  (double confirmation) │
```

### Why This Architecture?

| Concern | Solution |
|---------|----------|
| **Never expose Razorpay Key Secret on client** | Edge Functions handle all secret operations |
| **Prevent amount tampering** | Order is created on server; amount comes from DB, not from the browser |
| **Verify payment authenticity** | Signature verification using `HMAC SHA256` on the server |
| **Handle network failures** | Razorpay webhooks provide a secondary confirmation |
| **Multi-tenant (per-restaurant) payments** | Each restaurant can have its own Razorpay account (future) |

---

## 2. How It Maps to Your State Transition Diagram

Your state transition diagram defines **Phase 5: Payment Phase** and **Phase 7: Post-Order Phase**. Here's how Razorpay fits into every state:

```
                        ┌─────────────┐
                        │   Payment   │ ◄── From PlacingOrder (Phase 4)
                        └──────┬──────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             ┌─────────────┐      ┌──────────────┐
             │ Pay Online  │      │Pay at Counter│
             └──────┬──────┘      └──────┬───────┘
                    │                    │
                    ▼                    │  ► Order.payment_method = 'PAY_AT_COUNTER'
         ┌──────────────────┐            │  ► Order.payment_status = 'PENDING'
         │ PaymentGateway   │            │  ► Directly add to Kitchen Queue
         │  (Razorpay)      │            │
         └────────┬─────────┘            ▼
                  │               ┌──────────────┐
           ┌──────┴──────┐       │ KitchenQueue  │
           │             │       └───────────────┘
           ▼             ▼
  ┌──────────────┐  ┌────────────────┐
  │  Payment     │  │  Payment       │
  │  Successful  │  │  Failed        │
  └──────┬───────┘  └───────┬────────┘
         │                  │
         │                  ▼  ► Order.payment_status = 'FAILED'
         │           Retry / Choose "Pay at Counter"
         │
         ▼  ► Order.payment_status = 'PAID'
         ► Order.transaction_id   = razorpay_payment_id
  ┌──────────────┐
  │ KitchenQueue │ → PreparingFood → ReadyToServe → Served
  └──────────────┘

  ──── POST-ORDER PHASE (Phase 7) ────

  Served → ViewInvoice → [If "Not Paid Online"] → PayAtCounter
                        → [If "Paid Online"]    → FeedbackPrompt → SubmitFeedback → Success
```

### State-to-Database Mapping

| STD State | Database Field | Value |
|-----------|---------------|-------|
| `Payment` | `orders.payment_method` | User selects `'ONLINE'` or `'PAY_AT_COUNTER'` |
| `PaymentGateway` | `payments.status` | `'CREATED'` → Razorpay checkout opened |
| `Payment Successful` | `payments.status` | `'CAPTURED'` |
| | `orders.payment_status` | `'PAID'` |
| `Payment Failed` | `payments.status` | `'FAILED'` |
| | `orders.payment_status` | `'FAILED'` |
| `KitchenQueue` | `orders.status` | `'PENDING'` → `'CONFIRMED'` |
| `PreparingFood` | `orders.status` | `'PREPARING'` |
| `ReadyToServe` | `orders.status` | `'READY'` |
| `Served` | `orders.status` | `'SERVED'` |
| `ViewInvoice` | Read from `orders` + `payments` | — |
| `PayAtCounter` (Post-Order) | `orders.payment_status` | Remains `'PENDING'` until staff marks `'PAID'` |

---

## 3. Database Changes Required

### 3.1 New Table: `payments`

> This is the **most important addition**. Your current `orders` table already has `payment_method`, `payment_status`, and `transaction_id`. But for Razorpay, you need a dedicated `payments` table to track the full lifecycle.

```sql
-- ============================================================
-- NEW TABLE: payments
-- Tracks the entire Razorpay payment lifecycle per order
-- ============================================================

create table if not exists payments (
  id                uuid primary key default gen_random_uuid(),

  -- Relations
  order_id          uuid not null references orders(id) on delete cascade,
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  customer_id       uuid references auth.users(id) on delete set null,

  -- Amount
  amount            numeric not null,             -- Amount in RUPEES (e.g., 450.00)
  currency          text not null default 'INR',

  -- Razorpay IDs (filled at different stages)
  razorpay_order_id   text,                       -- From Razorpay Orders API (Step 3)
  razorpay_payment_id text,                       -- From checkout callback (Step 8)
  razorpay_signature  text,                       -- From checkout callback (Step 8)

  -- Payment Method (filled after payment)
  method            text,                         -- 'upi', 'card', 'netbanking', 'wallet'
  method_details    jsonb,                        -- { "vpa": "user@upi" } or { "last4": "1234" }

  -- Status tracking
  status            text not null default 'CREATED'
                    check (status in (
                      'CREATED',      -- Razorpay order created, checkout not yet opened
                      'ATTEMPTED',    -- Customer opened checkout but hasn't paid
                      'AUTHORIZED',   -- Payment authorized (for card auto-capture)
                      'CAPTURED',     -- Payment successfully captured ✅
                      'FAILED',       -- Payment failed ❌
                      'REFUND_INITIATED',  -- Refund started
                      'REFUNDED'      -- Full refund completed
                    )),

  -- Failure tracking
  failure_reason    text,                         -- Razorpay error description
  failure_code      text,                         -- Razorpay error code

  -- Refund tracking
  refund_id         text,                         -- Razorpay refund ID
  refund_amount     numeric,                      -- Partial or full refund amount
  refund_reason     text,

  -- Webhook tracking
  webhook_verified  boolean not null default false,  -- True if webhook confirmed
  webhook_event_id  text,                            -- Razorpay webhook event ID

  -- Timestamps
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  paid_at           timestamptz                    -- When payment was captured
);

-- Indexes for common queries
create index if not exists idx_payments_order_id on payments(order_id);
create index if not exists idx_payments_razorpay_order_id on payments(razorpay_order_id);
create index if not exists idx_payments_restaurant_id on payments(restaurant_id);
create index if not exists idx_payments_status on payments(status);
```

### 3.2 New Table: `restaurant_razorpay_config` (Multi-Tenant Support)

> For future use — allows each restaurant to have its own Razorpay account.

```sql
-- ============================================================
-- NEW TABLE: restaurant_razorpay_config
-- Per-restaurant Razorpay credentials (for multi-tenant)
-- ============================================================

create table if not exists restaurant_razorpay_config (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null unique references restaurants(id) on delete cascade,

  -- Razorpay Credentials (encrypted or stored in Vault)
  razorpay_key_id       text,         -- rzp_live_XXXX or rzp_test_XXXX
  razorpay_key_secret   text,         -- Stored encrypted / in Supabase Vault
  razorpay_webhook_secret text,       -- For webhook signature verification

  -- Account info
  razorpay_account_id   text,         -- Razorpay merchant account ID
  is_active             boolean not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```

### 3.3 Modifications to Existing `orders` Table

Your existing `orders` table already has the right base fields. Here are the **additions** needed:

```sql
-- ============================================================
-- ALTER existing orders table
-- ============================================================

-- Add a reference to the payments table for quick lookups
-- (The payments table already references orders, so this is optional
--  but useful for quick reads)

-- No structural change needed! Your orders table already has:
--   payment_method   → payment_method enum ('ONLINE', 'PAY_AT_COUNTER')  ✅
--   payment_status   → payment_status enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED')  ✅
--   transaction_id   → text (will store razorpay_payment_id for quick lookup)  ✅

-- The detailed payment lifecycle lives in the new 'payments' table.
```

### 3.4 New Table: `payment_logs` (Audit Trail)

```sql
-- ============================================================
-- NEW TABLE: payment_logs (Audit Trail)
-- Immutable log of every payment-related event
-- ============================================================

create table if not exists payment_logs (
  id            uuid primary key default gen_random_uuid(),
  payment_id    uuid references payments(id) on delete set null,
  order_id      uuid references orders(id) on delete set null,
  event_type    text not null,        -- 'ORDER_CREATED', 'CHECKOUT_OPENED',
                                      -- 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
                                      -- 'SIGNATURE_VERIFIED', 'WEBHOOK_RECEIVED',
                                      -- 'REFUND_INITIATED', 'REFUND_COMPLETED'
  event_data    jsonb,                -- Full event payload from Razorpay
  created_at    timestamptz not null default now()
);

create index if not exists idx_payment_logs_payment_id on payment_logs(payment_id);
create index if not exists idx_payment_logs_order_id on payment_logs(order_id);
```

### 3.5 RLS Policies for New Tables

```sql
-- ============================================================
-- RLS Policies
-- ============================================================

-- Enable RLS
alter table payments enable row level security;
alter table payment_logs enable row level security;

-- Payments: Customers can read their own payments
create policy "Customers can view own payments"
  on payments for select
  using (customer_id = auth.uid());

-- Payments: Restaurant members can read their restaurant's payments
create policy "Restaurant members can view restaurant payments"
  on payments for select
  using (is_restaurant_member(restaurant_id) or is_super_admin());

-- Payments: Only Edge Functions (service_role) insert/update payments
-- Regular users cannot directly modify payments
-- Edge Functions bypass RLS via service_role key

-- Payment logs: Restaurant members can read
create policy "Restaurant members can view payment logs"
  on payment_logs for select
  using (exists (
    select 1 from payments p
    where p.id = payment_logs.payment_id
      and (is_restaurant_member(p.restaurant_id) or is_super_admin())
  ));

-- Restaurant Razorpay Config: Only super admins
create policy "Razorpay config managed by super admins"
  on restaurant_razorpay_config for all
  using (is_super_admin())
  with check (is_super_admin());

alter table restaurant_razorpay_config enable row level security;
```

### 3.6 Complete Updated ER Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        UPDATED DATABASE SCHEMA                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  restaurants ◄──────┐                                                     │
│  ├── id (PK)         │                                                    │
│  ├── name            │                                                    │
│  ├── slug            │                                                    │
│  └── ...             │                                                    │
│                      │                                                    │
│  restaurant_razorpay_config  (NEW)                                        │
│  ├── id (PK)         │                                                    │
│  ├── restaurant_id ──┘  (FK, unique)                                      │
│  ├── razorpay_key_id                                                      │
│  ├── razorpay_key_secret                                                  │
│  └── razorpay_webhook_secret                                              │
│                                                                           │
│  orders ◄─────────────┐                                                   │
│  ├── id (PK)          │                                                   │
│  ├── restaurant_id    │                                                   │
│  ├── customer_id      │                                                   │
│  ├── payment_method   │  ('ONLINE' | 'PAY_AT_COUNTER')                    │
│  ├── payment_status   │  ('PENDING' | 'PAID' | 'FAILED' | 'REFUNDED')    │
│  ├── transaction_id   │  (razorpay_payment_id for quick lookup)           │
│  └── ...              │                                                   │
│                       │                                                   │
│  payments  (NEW) ─────┘                                                   │
│  ├── id (PK)                                                              │
│  ├── order_id (FK)                                                        │
│  ├── restaurant_id (FK)                                                   │
│  ├── customer_id (FK)                                                     │
│  ├── amount                                                               │
│  ├── razorpay_order_id                                                    │
│  ├── razorpay_payment_id                                                  │
│  ├── razorpay_signature                                                   │
│  ├── method ('upi', 'card', ...)                                          │
│  ├── status ('CREATED' → 'CAPTURED' / 'FAILED')                          │
│  ├── failure_reason                                                       │
│  ├── webhook_verified                                                     │
│  └── paid_at                                                              │
│                                                                           │
│  payment_logs  (NEW)                                                      │
│  ├── id (PK)                                                              │
│  ├── payment_id (FK)                                                      │
│  ├── order_id (FK)                                                        │
│  ├── event_type                                                           │
│  ├── event_data (jsonb)                                                   │
│  └── created_at                                                           │
│                                                                           │
│  order_items (existing, no changes)                                       │
│  feedback    (existing, no changes)                                       │
│  favorites   (existing, no changes)                                       │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Supabase Edge Functions (Backend)

### 4.1 Environment Variables (Supabase Secrets)

Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
# Razorpay Credentials (use TEST keys for development)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXX

# Supabase service role (already available in Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4.2 Edge Function: `create-razorpay-order`

> **Purpose**: Creates a Razorpay order on the server. The amount is calculated from the DB, NOT from the client (preventing tampering).

**File**: `supabase/functions/create-razorpay-order/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id } = await req.json();

    // 1. Fetch the order from DB (amount comes from server, not client!)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("customer_id", user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Prevent double payment
    if (order.payment_status === "PAID") {
      return new Response(
        JSON.stringify({ error: "Order already paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create Razorpay Order via API
    //    IMPORTANT: amount is in PAISE (₹450 = 45000 paise)
    const amountInPaise = Math.round(order.total * 100);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.order_number,
        notes: {
          restaurant_id: order.restaurant_id,
          order_id: order.id,
          table_number: order.table_number?.toString() || "",
        },
      }),
    });

    const razorpayOrder = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay error:", razorpayOrder);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Create payment record in DB
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        restaurant_id: order.restaurant_id,
        customer_id: user.id,
        amount: order.total,
        currency: "INR",
        razorpay_order_id: razorpayOrder.id,
        status: "CREATED",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Log the event
    await supabase.from("payment_logs").insert({
      payment_id: payment.id,
      order_id: order.id,
      event_type: "ORDER_CREATED",
      event_data: { razorpay_order_id: razorpayOrder.id, amount: amountInPaise },
    });

    // 6. Update order's payment_method to ONLINE
    await supabase
      .from("orders")
      .update({ payment_method: "ONLINE" })
      .eq("id", order.id);

    // 7. Return data needed by frontend
    return new Response(
      JSON.stringify({
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: "INR",
        order_number: order.order_number,
        payment_id: payment.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 4.3 Edge Function: `verify-razorpay-payment`

> **Purpose**: Verifies Razorpay's signature to confirm the payment is authentic, then updates the DB.

**File**: `supabase/functions/verify-razorpay-payment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = await req.json();

    // 1. Verify Razorpay Signature
    //    signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    // 2. Fetch the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("order_id", order_id)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isValid) {
      // ✅ PAYMENT IS VERIFIED

      // 3a. Update payment record
      await supabase
        .from("payments")
        .update({
          razorpay_payment_id,
          razorpay_signature,
          status: "CAPTURED",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // 3b. Update order
      await supabase
        .from("orders")
        .update({
          payment_status: "PAID",
          transaction_id: razorpay_payment_id,
          payment_method: "ONLINE",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      // 3c. Log success
      await supabase.from("payment_logs").insert({
        payment_id: payment.id,
        order_id,
        event_type: "PAYMENT_SUCCESS",
        event_data: { razorpay_payment_id, razorpay_order_id, verified: true },
      });

      return new Response(
        JSON.stringify({ success: true, message: "Payment verified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // ❌ SIGNATURE MISMATCH — possible tampering

      await supabase
        .from("payments")
        .update({
          status: "FAILED",
          failure_reason: "Signature verification failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      await supabase
        .from("orders")
        .update({
          payment_status: "FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      await supabase.from("payment_logs").insert({
        payment_id: payment.id,
        order_id,
        event_type: "SIGNATURE_MISMATCH",
        event_data: { razorpay_payment_id, razorpay_order_id, expected: expectedSignature },
      });

      return new Response(
        JSON.stringify({ success: false, error: "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Verification error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 4.4 Edge Function: `razorpay-webhook`

> **Purpose**: Receives webhook events from Razorpay as a secondary confirmation. This runs independently of the user's browser.

**File**: `supabase/functions/razorpay-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // 1. Verify webhook signature
    const expectedSignature = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Webhook signature mismatch");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    // 2. Handle different webhook events
    switch (eventType) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const razorpayPaymentId = payment.id;
        const method = payment.method;      // 'upi', 'card', etc.

        // Update payment record
        await supabase
          .from("payments")
          .update({
            status: "CAPTURED",
            razorpay_payment_id: razorpayPaymentId,
            method: method,
            method_details: payment.card || payment.upi || payment.wallet || null,
            webhook_verified: true,
            webhook_event_id: event.event_id || null,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", razorpayOrderId);

        // Also update the order
        const { data: paymentRecord } = await supabase
          .from("payments")
          .select("order_id")
          .eq("razorpay_order_id", razorpayOrderId)
          .single();

        if (paymentRecord) {
          await supabase
            .from("orders")
            .update({
              payment_status: "PAID",
              transaction_id: razorpayPaymentId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentRecord.order_id);
        }

        // Log
        await supabase.from("payment_logs").insert({
          payment_id: paymentRecord?.id || null,
          order_id: paymentRecord?.order_id || null,
          event_type: "WEBHOOK_PAYMENT_CAPTURED",
          event_data: event,
        });

        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        await supabase
          .from("payments")
          .update({
            status: "FAILED",
            failure_reason: payment.error_description,
            failure_code: payment.error_code,
            webhook_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", razorpayOrderId);

        const { data: paymentRecord } = await supabase
          .from("payments")
          .select("order_id, id")
          .eq("razorpay_order_id", razorpayOrderId)
          .single();

        if (paymentRecord) {
          await supabase
            .from("orders")
            .update({
              payment_status: "FAILED",
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentRecord.order_id);

          await supabase.from("payment_logs").insert({
            payment_id: paymentRecord.id,
            order_id: paymentRecord.order_id,
            event_type: "WEBHOOK_PAYMENT_FAILED",
            event_data: event,
          });
        }

        break;
      }

      case "refund.created":
      case "refund.processed": {
        const refund = event.payload.refund.entity;
        const razorpayPaymentId = refund.payment_id;

        await supabase
          .from("payments")
          .update({
            status: eventType === "refund.processed" ? "REFUNDED" : "REFUND_INITIATED",
            refund_id: refund.id,
            refund_amount: refund.amount / 100,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_payment_id", razorpayPaymentId);

        break;
      }

      default:
        console.log("Unhandled webhook event:", eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
```

---

## 5. Frontend Integration (React)

### 5.1 Install Razorpay Script Loader

No npm package needed! Razorpay provides a browser script. Add it to `index.html`:

```html
<!-- apps/customer-web/index.html -->
<head>
  <!-- ... existing tags ... -->
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
```

### 5.2 Payment Service Module

**File**: `apps/customer-web/src/services/paymentService.js`

```javascript
import { supabase } from '@restaurant-saas/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Creates a Razorpay order via Edge Function
 */
export const createRazorpayOrder = async (orderId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ order_id: orderId }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create payment order');
  }

  return response.json();
};

/**
 * Verifies payment after Razorpay checkout
 */
export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  order_id,
}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Payment verification failed');
  }

  return response.json();
};

/**
 * Opens the Razorpay checkout modal
 * Returns a promise that resolves on success and rejects on failure
 */
export const openRazorpayCheckout = ({
  razorpay_key_id,
  razorpay_order_id,
  amount,
  currency,
  order_number,
  customerName,
  customerEmail,
  customerPhone,
  restaurantName,
}) => {
  return new Promise((resolve, reject) => {
    const options = {
      key: razorpay_key_id,
      amount: amount,                   // In paise
      currency: currency,
      name: restaurantName || 'Tablekard',
      description: `Order ${order_number}`,
      order_id: razorpay_order_id,      // From create-razorpay-order
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
        contact: customerPhone || '',
      },
      theme: {
        color: '#d9b550',               // Tablekard gold
        backdrop_color: 'rgba(26, 26, 46, 0.8)',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
      handler: (response) => {
        // Payment succeeded — response contains:
        // { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        resolve(response);
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      reject({
        code: response.error.code,
        description: response.error.description,
        reason: response.error.reason,
      });
    });

    rzp.open();
  });
};
```

### 5.3 Updated Cart Page with Payment Flow

> This shows the key changes to `qr/cart.jsx`. The user gets two options: **Pay Online** and **Pay at Counter**.

```jsx
// ====================================================
// KEY CHANGES TO: apps/customer-web/src/pages/qr/cart.jsx
// ====================================================

import { createOrder } from '../../services/supabaseService';
import {
  createRazorpayOrder,
  openRazorpayCheckout,
  verifyRazorpayPayment
} from '../../services/paymentService';

// Inside QRCartPage component, replace handlePlaceOrder:

const [paymentMethod, setPaymentMethod] = useState('PAY_AT_COUNTER');
const [isProcessing, setIsProcessing] = useState(false);
const [paymentError, setPaymentError] = useState(null);

const handlePlaceOrder = async () => {
  if (!isAuthenticated) {
    const currentPath = encodeURIComponent(window.location.pathname);
    navigate(`/login?redirect=${currentPath}`);
    return;
  }

  setIsProcessing(true);
  setPaymentError(null);

  try {
    // Step 1: Create the order in Supabase
    const { orderId, orderNumber } = await createOrder({
      restaurantId: restaurant.id,
      customerId: user.id,       // from useAuth()
      customerName: user.name,
      customerPhone: user.phone,
      tableNumber: tableNumber,
      items: cart,
      paymentMethod: paymentMethod,
    });

    if (paymentMethod === 'ONLINE') {
      // Step 2: Create Razorpay order via Edge Function
      const razorpayData = await createRazorpayOrder(orderId);

      // Step 3: Open Razorpay checkout
      const paymentResponse = await openRazorpayCheckout({
        razorpay_key_id: razorpayData.razorpay_key_id,
        razorpay_order_id: razorpayData.razorpay_order_id,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        order_number: orderNumber,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone,
        restaurantName: restaurant.name,
      });

      // Step 4: Verify payment on server
      await verifyRazorpayPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        order_id: orderId,
      });

      // Step 5: Payment verified! Navigate to success
      sessionStorage.removeItem('qr_cart');
      navigate(`/r/${restaurantSlug}/order-success`, {
        state: { orderId, orderNumber, paymentMethod: 'ONLINE' }
      });

    } else {
      // PAY_AT_COUNTER — directly go to success
      sessionStorage.removeItem('qr_cart');
      navigate(`/r/${restaurantSlug}/order-success`, {
        state: { orderId, orderNumber, paymentMethod: 'PAY_AT_COUNTER' }
      });
    }
  } catch (error) {
    console.error('Order/Payment error:', error);
    setPaymentError(
      error.description || error.message || 'Something went wrong. Please try again.'
    );
  } finally {
    setIsProcessing(false);
  }
};
```

### 5.4 Payment Method Selector UI

Add this above the "Place Order" button in `cart.jsx`:

```jsx
{/* Payment Method Selection */}
<div style={{
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px'
}}>
  <h3 style={{
    fontSize: '14px',
    color: '#fff',
    marginBottom: '12px',
    fontWeight: 600
  }}>
    Payment Method
  </h3>

  {/* Pay Online Option */}
  <label style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: paymentMethod === 'ONLINE'
      ? 'rgba(217, 181, 80, 0.15)'
      : 'transparent',
    borderRadius: '10px',
    border: paymentMethod === 'ONLINE'
      ? '1px solid rgba(217, 181, 80, 0.5)'
      : '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'all 0.2s ease-in-out'
  }}>
    <input
      type="radio"
      name="paymentMethod"
      value="ONLINE"
      checked={paymentMethod === 'ONLINE'}
      onChange={() => setPaymentMethod('ONLINE')}
      style={{ accentColor: '#d9b550' }}
    />
    <div>
      <span style={{ color: '#fff', fontWeight: 500 }}>Pay Online</span>
      <p style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        margin: '2px 0 0'
      }}>
        UPI, Credit/Debit Card, Net Banking
      </p>
    </div>
  </label>

  {/* Pay at Counter Option */}
  <label style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: paymentMethod === 'PAY_AT_COUNTER'
      ? 'rgba(217, 181, 80, 0.15)'
      : 'transparent',
    borderRadius: '10px',
    border: paymentMethod === 'PAY_AT_COUNTER'
      ? '1px solid rgba(217, 181, 80, 0.5)'
      : '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out'
  }}>
    <input
      type="radio"
      name="paymentMethod"
      value="PAY_AT_COUNTER"
      checked={paymentMethod === 'PAY_AT_COUNTER'}
      onChange={() => setPaymentMethod('PAY_AT_COUNTER')}
      style={{ accentColor: '#d9b550' }}
    />
    <div>
      <span style={{ color: '#fff', fontWeight: 500 }}>Pay at Counter</span>
      <p style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        margin: '2px 0 0'
      }}>
        Pay after your meal
      </p>
    </div>
  </label>
</div>

{/* Error Message */}
{paymentError && (
  <div style={{
    background: 'rgba(255, 80, 80, 0.15)',
    border: '1px solid rgba(255, 80, 80, 0.3)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '12px',
    color: '#ff5050',
    fontSize: '14px'
  }}>
    ⚠️ {paymentError}
  </div>
)}

{/* Place Order / Pay Now Button */}
<button
  onClick={handlePlaceOrder}
  disabled={isProcessing}
  style={{
    width: '100%',
    background: isProcessing ? '#888' : '#d9b550',
    color: '#1a1a2e',
    border: 'none',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    opacity: isProcessing ? 0.7 : 1,
    transition: 'all 0.2s ease'
  }}
>
  {isProcessing
    ? 'Processing...'
    : paymentMethod === 'ONLINE'
      ? `Pay Now • ₹${total}`
      : `Place Order • ₹${total}`
  }
</button>
```

---

## 6. Webhook Handling

### 6.1 Configure Webhook in Razorpay Dashboard

1. Go to **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Set the following:
   - **Webhook URL**: `https://<your-supabase-project>.supabase.co/functions/v1/razorpay-webhook`
   - **Secret**: Generate a random string (save this as `RAZORPAY_WEBHOOK_SECRET`)
   - **Active Events**:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `refund.created`
     - ✅ `refund.processed`
     - ✅ `order.paid`

### 6.2 Why Webhooks Matter

| Scenario | Without Webhook | With Webhook |
|---------|----------------|--------------|
| User closes browser after paying | Payment captured but DB not updated ❌ | Webhook updates DB ✅ |
| Network failure during verify | Payment stuck in limbo ❌ | Webhook resolves it ✅ |
| Late UPI payment (user pays after timeout) | Missed payment ❌ | Webhook captures it ✅ |
| Refund tracking | Manual ❌ | Automatic ✅ |

---

## 7. Security Checklist

### ✅ Must-Do Before Going Live

| # | Check | Details |
|---|-------|---------|
| 1 | **Never expose Key Secret** | `RAZORPAY_KEY_SECRET` only lives in Supabase Edge Function secrets |
| 2 | **Server-side amount** | Amount is read from `orders.total` in the DB, NOT from the client request |
| 3 | **Signature verification** | Every payment is verified with `HMAC-SHA256` before marking as PAID |
| 4 | **Webhook signature** | Webhook requests are verified with `x-razorpay-signature` header |
| 5 | **Idempotency** | Check `payment_status !== 'PAID'` before processing to prevent double payments |
| 6 | **HTTPS only** | Supabase Edge Functions are HTTPS by default ✅ |
| 7 | **Switch to Live keys** | Replace `rzp_test_*` with `rzp_live_*` when going to production |
| 8 | **RLS enforced** | Only service_role (Edge Functions) can INSERT/UPDATE payments |
| 9 | **Audit trail** | Every payment event is logged in `payment_logs` |
| 10 | **Handle edge cases** | Timeout, cancel, retry — all handled in the flow |

### ⚠️ Common Mistakes to Avoid

```
❌ DO NOT pass amount from frontend to create Razorpay order
   → Always read from database

❌ DO NOT verify payment on the client
   → Always verify on the server (Edge Function)

❌ DO NOT mark payment as success without signature verification
   → Razorpay signature is the ONLY proof of payment

❌ DO NOT rely only on frontend callback
   → Webhooks are your safety net

❌ DO NOT store Razorpay Key Secret in .env of the React app
   → It goes in Supabase Edge Function secrets ONLY
```

---

## 8. Testing Guide

### 8.1 Razorpay Test Mode

Use **Test Mode** keys from the Razorpay Dashboard for development:

```
Key ID:     rzp_test_XXXXXXXXXXXX
Key Secret: XXXXXXXXXXXXXXXXXXXX
```

### 8.2 Test Card Details

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| `4111 1111 1111 1111` | Any | Any future | ✅ Success |
| `5267 3181 8797 5449` | Any | Any future | ✅ Success (Mastercard) |
| `4000 0000 0000 0002` | Any | Any future | ❌ Failure |

### 8.3 Test UPI

| UPI ID | Result |
|--------|--------|
| `success@razorpay` | ✅ Success |
| `failure@razorpay` | ❌ Failure |

### 8.4 Test Webhook Locally

```bash
# Use Razorpay's webhook testing from dashboard
# Or use a tool like ngrok to tunnel to local Supabase
npx supabase functions serve razorpay-webhook --no-verify-jwt
```

---

## 9. Step-by-Step Implementation Plan

### Phase 1: Database Setup (Day 1)

- [ ] Run the SQL migration to create `payments`, `payment_logs`, and `restaurant_razorpay_config` tables
- [ ] Add RLS policies
- [ ] Verify tables in Supabase Dashboard

### Phase 2: Razorpay Account Setup (Day 1)

- [ ] Create Razorpay account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
- [ ] Get Test Mode API keys
- [ ] Set up webhook URL in Razorpay dashboard
- [ ] Save all keys in Supabase secrets

### Phase 3: Edge Functions (Day 2-3)

- [ ] Create `supabase/functions/create-razorpay-order/index.ts`
- [ ] Create `supabase/functions/verify-razorpay-payment/index.ts`
- [ ] Create `supabase/functions/razorpay-webhook/index.ts`
- [ ] Deploy with `npx supabase functions deploy`
- [ ] Test each function independently

### Phase 4: Frontend Integration (Day 3-4)

- [ ] Add Razorpay script to `index.html`
- [ ] Create `paymentService.js`
- [ ] Update `qr/cart.jsx` with payment method selection
- [ ] Update `qr/cart.jsx` with Razorpay checkout flow
- [ ] Update `qr/order_success.jsx` to show payment status
- [ ] Test the complete flow with test cards

### Phase 5: Polish & Edge Cases (Day 5)

- [ ] Handle payment timeout
- [ ] Handle user closing checkout modal
- [ ] Handle retry after failure
- [ ] Add loading spinners and disabled states
- [ ] Test webhook scenarios
- [ ] Add payment details to order history

### Phase 6: Go Live

- [ ] Switch to Razorpay Live keys
- [ ] Complete Razorpay KYC verification
- [ ] Update webhook URL for production
- [ ] Test with a small real payment (₹1)
- [ ] Monitor `payment_logs` for any issues

---

## 📎 Quick Reference: File Changes Summary

| File | Change |
|------|--------|
| `supabase/schema.sql` | Add `payments`, `payment_logs`, `restaurant_razorpay_config` tables + RLS |
| `supabase/functions/create-razorpay-order/index.ts` | **NEW** — Creates Razorpay order |
| `supabase/functions/verify-razorpay-payment/index.ts` | **NEW** — Verifies payment signature |
| `supabase/functions/razorpay-webhook/index.ts` | **NEW** — Handles webhook events |
| `apps/customer-web/index.html` | Add Razorpay checkout script |
| `apps/customer-web/src/services/paymentService.js` | **NEW** — Frontend payment utilities |
| `apps/customer-web/src/services/supabaseService.js` | Update `createOrder` to accept payment method |
| `apps/customer-web/src/pages/qr/cart.jsx` | Add payment method selector + Razorpay flow |
| `apps/customer-web/src/pages/qr/order_success.jsx` | Show payment status details |

---

## 💡 Future Enhancements

1. **Per-Restaurant Razorpay Accounts** — Use `restaurant_razorpay_config` to let each restaurant connect their own Razorpay account
2. **Split Payments** — Use Razorpay Route to split between platform and restaurant
3. **Partial Refunds** — Edge Function to initiate refunds from admin panel
4. **Payment Analytics** — Dashboard showing daily revenue, payment method distribution
5. **Subscription Billing** — Use Razorpay Subscriptions for restaurant SaaS fees
