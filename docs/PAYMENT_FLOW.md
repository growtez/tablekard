# 💳 Tablekard Payment Flow — Detailed System Guide

> Complete end-to-end flow showing how `orders`, `payments`, and `payment_logs` tables interact with
> the Razorpay Orders API, Webhooks, and your product configuration.

---

## 📋 Table of Contents

1. [Product Configuration (Pre-Requisites)](#1-product-configuration-pre-requisites)
2. [Flow A: Pay Online (Razorpay)](#2-flow-a-pay-online-razorpay)
3. [Flow B: Pay at Counter](#3-flow-b-pay-at-counter)
4. [Flow C: Payment Failed → Retry](#4-flow-c-payment-failed--retry)
5. [Flow D: Refund](#5-flow-d-refund)
6. [Razorpay Orders API — Deep Dive](#6-razorpay-orders-api--deep-dive)
7. [Razorpay Webhooks — Deep Dive](#7-razorpay-webhooks--deep-dive)
8. [Complete Database State at Every Step](#8-complete-database-state-at-every-step)

---

## 1. Product Configuration (Pre-Requisites)

Before any payment can happen, this is what needs to be set up:

### 1.1 Razorpay Dashboard Setup

```
Razorpay Dashboard (https://dashboard.razorpay.com)
│
├── Account Settings
│   ├── Business Name: "Tablekard" (or restaurant name)
│   ├── Business Type: Partnership / Proprietorship / Pvt Ltd
│   └── KYC: PAN, GST, Bank Account verified ✅
│
├── API Keys (Settings → API Keys)
│   ├── Test Mode:
│   │   ├── Key ID:     rzp_test_XXXXXXXXXXXX
│   │   └── Key Secret: XXXXXXXXXXXXXXXXXXXX
│   │
│   └── Live Mode (after KYC approval):
│       ├── Key ID:     rzp_live_XXXXXXXXXXXX
│       └── Key Secret: XXXXXXXXXXXXXXXXXXXX
│
├── Webhooks (Settings → Webhooks → Add New)
│   ├── URL: https://<project>.supabase.co/functions/v1/razorpay-webhook
│   ├── Secret: <your-webhook-secret>
│   └── Events:
│       ├── ✅ payment.captured
│       ├── ✅ payment.failed
│       ├── ✅ payment.authorized
│       ├── ✅ order.paid
│       ├── ✅ refund.created
│       └── ✅ refund.processed
│
└── Payment Methods (Settings → Payment Methods)
    ├── ✅ UPI (GPay, PhonePe, Paytm)
    ├── ✅ Credit/Debit Cards
    ├── ✅ Net Banking
    └── ✅ Wallets
```

### 1.2 Supabase Secrets Configuration

```
Supabase Dashboard → Edge Functions → Secrets
│
├── RAZORPAY_KEY_ID        = rzp_test_XXXXXXXXXXXX
├── RAZORPAY_KEY_SECRET    = XXXXXXXXXXXXXXXXXXXX
├── RAZORPAY_WEBHOOK_SECRET = XXXXXXXXXXXXXXXXXXXX
├── SUPABASE_URL           = https://<project>.supabase.co     (auto-available)
└── SUPABASE_SERVICE_ROLE_KEY = eyJ...                         (auto-available)
```

### 1.3 Restaurant Settings (in `restaurants` table)

```sql
-- The restaurant's settings JSONB field controls payment behavior
UPDATE restaurants
SET settings = '{
  "tax_percentage": 5,           -- 5% GST
  "service_charge": 0,           -- Optional service charge %
  "currency": "INR",             -- Currency
  "enable_online_payment": true  -- Toggle Razorpay on/off per restaurant
}'::jsonb
WHERE slug = 'golden-spoon';
```

### 1.4 Three Supabase Edge Functions

```
supabase/functions/
├── create-razorpay-order/     → Called by frontend when user selects "Pay Online"
│   └── index.ts
├── verify-razorpay-payment/   → Called by frontend after Razorpay checkout completes
│   └── index.ts
└── razorpay-webhook/          → Called by Razorpay servers (background, automatic)
    └── index.ts
```

### 1.5 Frontend Setup

```html
<!-- index.html — Load Razorpay checkout script -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

```
apps/customer-web/src/services/
├── supabaseService.js   → createOrder() — inserts into orders + order_items
└── paymentService.js    → createRazorpayOrder(), openRazorpayCheckout(), verifyRazorpayPayment()
```

---

## 2. Flow A: Pay Online (Razorpay)

> This is the complete happy-path flow when a customer pays online.

### Visual Timeline

```
  CUSTOMER                 FRONTEND               EDGE FUNCTIONS              RAZORPAY              DATABASE
  (Browser)                (React App)            (Supabase)                 (Servers)             (Supabase)
     │                        │                       │                         │                      │
     │                        │                       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │  PHASE 1: CREATE ORDER (in our database)       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │                        │                       │                         │                      │
     │  1. Click "Pay Now"    │                       │                         │                      │
     │ ──────────────────────►│                       │                         │                      │
     │                        │                       │                         │                      │
     │                        │  2. createOrder()     │                         │                      │
     │                        │   (supabaseService)   │                         │   ┌─────────────────┐│
     │                        │ ──────────────────────────────────────────────────►  │ INSERT orders   ││
     │                        │                       │                         │   │  status=PENDING  ││
     │                        │                       │                         │   │  payment_method  ││
     │                        │                       │                         │   │   ='ONLINE'      ││
     │                        │                       │                         │   │  payment_status  ││
     │                        │                       │                         │   │   ='PENDING'     ││
     │                        │                       │                         │   ├─────────────────┤│
     │                        │                       │                         │   │ INSERT           ││
     │                        │                       │                         │   │  order_items     ││
     │                        │  ◄─── returns ────────────────────────────────────  │ (all cart items) ││
     │                        │   orderId,            │                         │   └─────────────────┘│
     │                        │   orderNumber         │                         │                      │
     │                        │                       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │  PHASE 2: CREATE RAZORPAY ORDER (on Razorpay)  │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │                        │                       │                         │                      │
     │                        │  3. POST              │                         │                      │
     │                        │   /create-razorpay-   │                         │                      │
     │                        │    order              │                         │                      │
     │                        │ ─────────────────────►│                         │                      │
     │                        │   { order_id }        │                         │                      │
     │                        │                       │                         │                      │
     │                        │                       │  4. Fetch order from DB │   ┌─────────────────┐│
     │                        │                       │ ──────────────────────────►  │ SELECT orders   ││
     │                        │                       │ ◄──────────────────────────  │ WHERE id=...    ││
     │                        │                       │   total = ₹735          │   └─────────────────┘│
     │                        │                       │                         │                      │
     │                        │                       │  5. POST /v1/orders     │                      │
     │                        │                       │   (Razorpay API)        │                      │
     │                        │                       │ ────────────────────────►│                      │
     │                        │                       │   {                     │                      │
     │                        │                       │     amount: 73500,      │ (paise!)             │
     │                        │                       │     currency: "INR",    │                      │
     │                        │                       │     receipt: "ORD-A1B2" │                      │
     │                        │                       │   }                     │                      │
     │                        │                       │                         │                      │
     │                        │                       │  6. Razorpay returns    │                      │
     │                        │                       │ ◄────────────────────────│                      │
     │                        │                       │   {                     │                      │
     │                        │                       │    id:"order_Rzp123",   │                      │
     │                        │                       │    status:"created"     │                      │
     │                        │                       │   }                     │                      │
     │                        │                       │                         │                      │
     │                        │                       │  7. Save to DB          │   ┌─────────────────┐│
     │                        │                       │ ──────────────────────────►  │ INSERT payments ││
     │                        │                       │                         │   │  razorpay_order  ││
     │                        │                       │                         │   │   _id=           ││
     │                        │                       │                         │   │  "order_Rzp123" ││
     │                        │                       │                         │   │  status=PENDING  ││
     │                        │                       │                         │   ├─────────────────┤│
     │                        │                       │                         │   │ INSERT           ││
     │                        │                       │                         │   │  payment_logs    ││
     │                        │                       │                         │   │  event_type=     ││
     │                        │                       │                         │   │  "ORDER_CREATED" ││
     │                        │                       │                         │   └─────────────────┘│
     │                        │                       │                         │                      │
     │                        │  8. Return to frontend│                         │                      │
     │                        │ ◄─────────────────────│                         │                      │
     │                        │   {                   │                         │                      │
     │                        │    razorpay_order_id,  │                         │                      │
     │                        │    razorpay_key_id,    │                         │                      │
     │                        │    amount: 73500       │                         │                      │
     │                        │   }                   │                         │                      │
     │                        │                       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │  PHASE 3: RAZORPAY CHECKOUT (customer pays)    │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │                        │                       │                         │                      │
     │                        │  9. Open Razorpay     │                         │                      │
     │  ┌──────────────────┐  │     checkout modal    │                         │                      │
     │  │ ┌──────────────┐ │  │                       │                         │                      │
     │  │ │  RAZORPAY    │ │◄─│                       │                         │                      │
     │  │ │  ₹735.00     │ │  │                       │                         │                      │
     │  │ │              │ │  │                       │                         │                      │
     │  │ │  ○ UPI       │ │  │                       │                         │                      │
     │  │ │  ○ Card      │ │  │                       │                         │                      │
     │  │ │  ○ NetBank   │ │  │                       │                         │                      │
     │  │ │              │ │  │                       │                         │                      │
     │  │ │ [PAY ₹735]   │ │  │                       │                         │                      │
     │  │ └──────────────┘ │  │                       │                         │                      │
     │  └──────────────────┘  │                       │                         │                      │
     │                        │                       │                         │                      │
     │  10. Customer selects  │                       │                         │                      │
     │      UPI, enters VPA,  │                       │                         │                      │
     │      and pays          │                       │                         │                      │
     │ ───────────────────────────────────────────────────────────────────────►│                      │
     │                        │                       │                         │                      │
     │  11. Payment processed │                       │                         │                      │
     │ ◄───────────────────────────────────────────────────────────────────────│                      │
     │   {                    │                       │                         │                      │
     │    razorpay_payment_id:│"pay_Rzp789"           │                         │                      │
     │    razorpay_order_id:  │"order_Rzp123"         │                         │                      │
     │    razorpay_signature: │"sig_abc..."           │                         │                      │
     │   }                    │                       │                         │                      │
     │                        │                       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │  PHASE 4: VERIFY PAYMENT (on our server)       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │                        │                       │                         │                      │
     │                        │  12. POST             │                         │                      │
     │                        │   /verify-razorpay-   │                         │                      │
     │                        │    payment            │                         │                      │
     │                        │ ─────────────────────►│                         │                      │
     │                        │   {                   │                         │                      │
     │                        │    razorpay_payment_id│                         │                      │
     │                        │    razorpay_order_id  │                         │                      │
     │                        │    razorpay_signature │                         │                      │
     │                        │    order_id           │                         │                      │
     │                        │   }                   │                         │                      │
     │                        │                       │                         │                      │
     │                        │                       │  13. VERIFY SIGNATURE   │                      │
     │                        │                       │                         │                      │
     │                        │                       │  expected = HMAC-SHA256(│                      │
     │                        │                       │    "order_Rzp123|       │                      │
     │                        │                       │     pay_Rzp789",        │                      │
     │                        │                       │    KEY_SECRET            │                      │
     │                        │                       │  )                      │                      │
     │                        │                       │                         │                      │
     │                        │                       │  expected === sig_abc?   │                      │
     │                        │                       │  YES ✅                 │                      │
     │                        │                       │                         │                      │
     │                        │                       │  14. Update DB          │   ┌─────────────────┐│
     │                        │                       │ ──────────────────────────►  │ UPDATE payments ││
     │                        │                       │                         │   │  razorpay_       ││
     │                        │                       │                         │   │   payment_id=    ││
     │                        │                       │                         │   │  "pay_Rzp789"   ││
     │                        │                       │                         │   │  status='PAID'   ││
     │                        │                       │                         │   │  method='upi'    ││
     │                        │                       │                         │   │  paid_at=now()   ││
     │                        │                       │                         │   ├─────────────────┤│
     │                        │                       │                         │   │ UPDATE orders    ││
     │                        │                       │                         │   │  payment_status  ││
     │                        │                       │                         │   │   ='PAID'        ││
     │                        │                       │                         │   ├─────────────────┤│
     │                        │                       │                         │   │ INSERT           ││
     │                        │                       │                         │   │  payment_logs    ││
     │                        │                       │                         │   │  event_type=     ││
     │                        │                       │                         │   │  "PAYMENT_       ││
     │                        │                       │                         │   │   SUCCESS"       ││
     │                        │                       │                         │   └─────────────────┘│
     │                        │                       │                         │                      │
     │                        │  15. Return success   │                         │                      │
     │                        │ ◄─────────────────────│                         │                      │
     │                        │   { success: true }   │                         │                      │
     │                        │                       │                         │                      │
     │  16. Navigate to       │                       │                         │                      │
     │      Order Success     │                       │                         │                      │
     │ ◄──────────────────────│                       │                         │                      │
     │                        │                       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │  PHASE 5: WEBHOOK CONFIRMATION (background)    │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │                        │                       │                         │                      │
     │                        │                       │  17. Razorpay sends     │                      │
     │                        │                       │      webhook            │                      │
     │                        │                       │ ◄────────────────────────│                      │
     │                        │                       │   POST /razorpay-webhook│                      │
     │                        │                       │   Header:               │                      │
     │                        │                       │    x-razorpay-signature  │                      │
     │                        │                       │   Body:                 │                      │
     │                        │                       │   {                     │                      │
     │                        │                       │    event:"payment.      │                      │
     │                        │                       │           captured",    │                      │
     │                        │                       │    payload: {           │                      │
     │                        │                       │      payment: {         │                      │
     │                        │                       │        entity: {        │                      │
     │                        │                       │          id:"pay_Rzp789"│                      │
     │                        │                       │          order_id:      │                      │
     │                        │                       │           "order_Rzp123"│                      │
     │                        │                       │          method:"upi",  │                      │
     │                        │                       │          amount:73500   │                      │
     │                        │                       │   }}}                   │                      │
     │                        │                       │                         │                      │
     │                        │                       │  18. Verify webhook     │                      │
     │                        │                       │      signature          │                      │
     │                        │                       │                         │                      │
     │                        │                       │  sig = HMAC-SHA256(     │                      │
     │                        │                       │    request_body,        │                      │
     │                        │                       │    WEBHOOK_SECRET       │                      │
     │                        │                       │  )                      │                      │
     │                        │                       │  sig === header sig?    │                      │
     │                        │                       │  YES ✅                 │                      │
     │                        │                       │                         │                      │
     │                        │                       │  19. Update DB          │   ┌─────────────────┐│
     │                        │                       │ ──────────────────────────►  │ UPDATE payments ││
     │                        │                       │                         │   │  webhook_        ││
     │                        │                       │                         │   │   verified=true  ││
     │                        │                       │                         │   ├─────────────────┤│
     │                        │                       │                         │   │ INSERT           ││
     │                        │                       │                         │   │  payment_logs    ││
     │                        │                       │                         │   │  event_type=     ││
     │                        │                       │                         │   │  "WEBHOOK_       ││
     │                        │                       │                         │   │  PAYMENT_        ││
     │                        │                       │                         │   │  CAPTURED"       ││
     │                        │                       │                         │   └─────────────────┘│
     │                        │                       │                         │                      │
     │                        │                       │  20. Return 200 OK      │                      │
     │                        │                       │ ────────────────────────►│                      │
     │                        │                       │                         │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
     │  ✅ DONE — Order is paid, food preparation begins                       │                      │
 ════╪════════════════════════╪═══════════════════════╪═════════════════════════╪══════════════════════╪════
```

---

## 3. Flow B: Pay at Counter

> Simpler flow — no Razorpay involved, no `payments` row created.

```
  CUSTOMER                 FRONTEND                                          DATABASE
     │                        │                                                 │
     │  1. Select "Pay at     │                                                 │
     │     Counter" + Place   │                                                 │
     │ ──────────────────────►│                                                 │
     │                        │  2. createOrder()                               │
     │                        │ ───────────────────────────────────────────────► │
     │                        │                                                 │
     │                        │                      ┌──────────────────────────┐│
     │                        │                      │ INSERT orders            ││
     │                        │                      │   payment_method =       ││
     │                        │                      │     'PAY_AT_COUNTER'     ││
     │                        │                      │   payment_status =       ││
     │                        │                      │     'PENDING'            ││
     │                        │                      │   status = 'PENDING'     ││
     │                        │                      ├──────────────────────────┤│
     │                        │                      │ INSERT order_items       ││
     │                        │                      │   (all cart items)       ││
     │                        │                      └──────────────────────────┘│
     │                        │                                                 │
     │                        │  ◄── orderId, orderNumber ──────────────────────│
     │                        │                                                 │
     │  3. Order Success page │                                                 │
     │ ◄──────────────────────│                                                 │
     │   "Your order has been │                                                 │
     │    placed! Pay ₹735    │                                  NO payments    │
     │    at the counter."    │                                  row created!   │
     │                        │                                                 │
     │                        │                                                 │
     │  ═══ LATER: After meal is served ═══                                    │
     │                        │                                                 │
     │  4. Customer pays      │                 RESTAURANT ADMIN APP            │
     │     cash at counter    │                        │                        │
     │ ──────────────────────────────────────────────► │                        │
     │                        │                        │  5. Staff marks paid   │
     │                        │                        │ ──────────────────────►│
     │                        │                        │                        │
     │                        │                      ┌──────────────────────────┐│
     │                        │                      │ UPDATE orders            ││
     │                        │                      │   payment_status='PAID'  ││
     │                        │                      └──────────────────────────┘│
     │                        │                                                 │
     │  ═══ DONE ═══          │                                                 │
```

### Database snapshot (Pay at Counter):

```
orders table:
┌──────────┬─────────────────┬────────────────┬──────┐
│ status   │ payment_method  │ payment_status │ total│
├──────────┼─────────────────┼────────────────┼──────┤
│ SERVED   │ PAY_AT_COUNTER  │ PAID           │ 735  │
└──────────┴─────────────────┴────────────────┴──────┘

payments table:      (empty — no row for this order)
payment_logs table:  (empty — no row for this order)
```

---

## 4. Flow C: Payment Failed → Retry

```
  CUSTOMER                FRONTEND               EDGE FUNCTIONS              RAZORPAY               DATABASE
     │                       │                       │                         │                       │
     │  ... (Steps 1-10 same as Flow A) ...          │                         │                       │
     │                       │                       │                         │                       │
     │  11. PAYMENT FAILS    │                       │                         │                       │
     │  (insufficient funds, │                       │                         │                       │
     │   network error, etc.)│                       │                         │                       │
     │ ◄──────────────────────────────────────────────────────────────────────│                       │
     │   {                   │                       │                         │                       │
     │    error: {           │                       │                         │                       │
     │      code:            │                       │                         │                       │
     │       "BAD_REQUEST",  │                       │                         │                       │
     │      description:     │                       │                         │                       │
     │       "Payment        │                       │                         │                       │
     │        failed"        │                       │                         │                       │
     │    }                  │                       │                         │                       │
     │   }                   │                       │                         │                       │
     │                       │                       │                         │                       │
     │                       │  12. Razorpay          │                         │                       │
     │                       │   on('payment.failed') │                         │                       │
     │                       │                       │                         │                       │
     │  13. Show error       │                       │                         │                       │
     │ ◄─────────────────────│                       │                         │                       │
     │  ┌──────────────────┐ │                       │                         │                       │
     │  │ ⚠️ Payment Failed │ │                       │                         │                       │
     │  │                  │ │                       │                         │                       │
     │  │ Insufficient     │ │                       │                         │                       │
     │  │ funds            │ │                       │                         │                       │
     │  │                  │ │                       │                         │                       │
     │  │ [Try Again]      │ │                       │                         │                       │
     │  │ [Pay at Counter] │ │                       │                         │                       │
     │  └──────────────────┘ │                       │                         │                       │
     │                       │                       │                         │                       │
     │  OPTION A: "Try Again"│                       │                         │                       │
     │ ──────────────────────►                       │                         │                       │
     │                       │  14. POST             │                         │                       │
     │                       │   /create-razorpay-   │                         │                       │
     │                       │    order (again)      │                         │                       │
     │                       │ ─────────────────────►│                         │                       │
     │                       │                       │  15. Creates NEW        │                       │
     │                       │                       │      Razorpay order     │                       │
     │                       │                       │ ────────────────────────►│                       │
     │                       │                       │                         │                       │
     │                       │                       │  16. NEW payment record │  ┌────────────────────┐│
     │                       │                       │ ─────────────────────────►  │ UPDATE old payment ││
     │                       │                       │                         │  │  status='FAILED'   ││
     │                       │                       │                         │  ├────────────────────┤│
     │                       │                       │                         │  │ INSERT NEW payment ││
     │                       │                       │                         │  │  razorpay_order_id ││
     │                       │                       │                         │  │  ="order_Rzp456"   ││
     │                       │                       │                         │  │  status='PENDING'  ││
     │                       │                       │                         │  ├────────────────────┤│
     │                       │                       │                         │  │ INSERT payment_logs││
     │                       │                       │                         │  │  "PAYMENT_FAILED"  ││
     │                       │                       │                         │  │  "ORDER_CREATED"   ││
     │                       │                       │                         │  └────────────────────┘│
     │                       │                       │                         │                       │
     │  ... (continue from Step 9 of Flow A) ...     │                         │                       │
     │                       │                       │                         │                       │
     │  OPTION B: "Pay at Counter"                   │                         │                       │
     │ ──────────────────────►                       │                         │                       │
     │                       │                       │                         │  ┌────────────────────┐│
     │                       │ ──────────────────────────────────────────────────► │ UPDATE orders     ││
     │                       │                       │                         │  │  payment_method=   ││
     │                       │                       │                         │  │  'PAY_AT_COUNTER'  ││
     │                       │                       │                         │  └────────────────────┘│
     │                       │                       │                         │                       │
     │  Navigate to success  │                       │                         │                       │
     │ ◄─────────────────────│                       │                         │                       │
```

---

## 5. Flow D: Refund

```
  RESTAURANT ADMIN          EDGE FUNCTION            RAZORPAY                  DATABASE
     │                         │                        │                        │
     │  1. Click "Refund"      │                        │                        │
     │     on order            │                        │                        │
     │ ───────────────────────►│                        │                        │
     │   { order_id,           │                        │                        │
     │     amount: 735 }       │                        │                        │
     │                         │                        │                        │
     │                         │  2. Fetch payment      │                        │
     │                         │ ──────────────────────────────────────────────► │
     │                         │ ◄──────────────────────────────────────────────│
     │                         │   razorpay_payment_id  │                        │
     │                         │   = "pay_Rzp789"       │                        │
     │                         │                        │                        │
     │                         │  3. POST /v1/payments/ │                        │
     │                         │     pay_Rzp789/refund  │                        │
     │                         │ ──────────────────────►│                        │
     │                         │   { amount: 73500 }    │                        │
     │                         │                        │                        │
     │                         │  4. Refund initiated   │                        │
     │                         │ ◄──────────────────────│                        │
     │                         │   { id:"rfnd_Rzp999" } │                        │
     │                         │                        │                        │
     │                         │  5. Update DB          │  ┌────────────────────┐│
     │                         │ ──────────────────────────►│ UPDATE payments   ││
     │                         │                        │  │  status='REFUNDED' ││
     │                         │                        │  ├────────────────────┤│
     │                         │                        │  │ UPDATE orders      ││
     │                         │                        │  │  payment_status    ││
     │                         │                        │  │   ='REFUNDED'      ││
     │                         │                        │  ├────────────────────┤│
     │                         │                        │  │ INSERT payment_logs││
     │                         │                        │  │  "REFUND_INITIATED"││
     │                         │                        │  └────────────────────┘│
     │                         │                        │                        │
     │  6. "Refund initiated"  │                        │                        │
     │ ◄───────────────────────│                        │                        │
     │                         │                        │                        │
     │                         │  7. Webhook:            │                        │
     │                         │   refund.processed     │                        │
     │                         │ ◄──────────────────────│                        │
     │                         │                        │  ┌────────────────────┐│
     │                         │ ──────────────────────────►│ INSERT payment_logs││
     │                         │                        │  │  "REFUND_COMPLETED"││
     │                         │                        │  └────────────────────┘│
```

---

## 6. Razorpay Orders API — Deep Dive

### What is a "Razorpay Order"?

A Razorpay Order is **NOT** your app's order. It's a Razorpay concept that:
- Links a specific **amount** to a checkout session
- Prevents the customer from changing the amount
- Gives you a `razorpay_order_id` to track the payment

### API Call

```
POST https://api.razorpay.com/v1/orders
Authorization: Basic base64(KEY_ID:KEY_SECRET)

Request Body:
{
  "amount": 73500,              ← Amount in PAISE (₹735 × 100)
  "currency": "INR",
  "receipt": "ORD-A1B2C3",      ← Your order_number (for reference)
  "notes": {
    "restaurant_id": "a1b2c3d4-...",
    "order_id": "d4e5f6a7-...",
    "table_number": "3"
  }
}

Response:
{
  "id": "order_Rzp123456",      ← This is razorpay_order_id
  "entity": "order",
  "amount": 73500,
  "currency": "INR",
  "receipt": "ORD-A1B2C3",
  "status": "created",          ← Will become "paid" after payment
  "created_at": 1740091200
}
```

### Important Rules

| Rule | Detail |
|------|--------|
| Amount is in **paise** | ₹735 = 73500 paise. Always multiply by 100 |
| Amount comes from **DB** | Never from the frontend request (prevents tampering) |
| One Razorpay Order = One attempt | If payment fails, create a NEW Razorpay Order for retry |
| Order expires in **15 minutes** | If no payment attempt is made |

---

## 7. Razorpay Webhooks — Deep Dive

### What Are Webhooks?

Webhooks are **server-to-server HTTP calls** that Razorpay makes to YOUR server whenever a payment event occurs. They work **independently** of the customer's browser.

### Why Webhooks Matter

```
SCENARIO: Customer pays via UPI. Their phone shows "Payment Successful" ✅
          But then their browser crashes / loses internet.

WITHOUT WEBHOOK:
  Frontend verify call never happens → payment_status stuck at 'PENDING' ❌
  Customer paid but your DB doesn't know!

WITH WEBHOOK:
  Razorpay sends payment.captured → your Edge Function updates DB → status='PAID' ✅
  Everything is consistent even though the browser died.
```

### Webhook Signature Verification

```
Razorpay sends:
  Header:  x-razorpay-signature = "abc123..."
  Body:    { "event": "payment.captured", "payload": { ... } }

Your Edge Function verifies:
  expected = HMAC-SHA256(request_body, WEBHOOK_SECRET)
  
  if (expected === header_signature) → LEGIT ✅ → process it
  if (expected !== header_signature) → FAKE ❌ → reject (return 400)
```

### Webhook Events & Their Meaning

| Event | When It Fires | What You Do |
|-------|--------------|-------------|
| `payment.captured` | Payment received ✅ | `payments.status = 'PAID'`, `payments.webhook_verified = true` |
| `payment.failed` | Payment failed ❌ | `payments.status = 'FAILED'`, log the error |
| `payment.authorized` | Card authorized (auto-capture on) | Usually same as captured for your case |
| `order.paid` | Razorpay Order fully paid | Secondary confirmation (optional) |
| `refund.created` | Refund initiated | `payments.status = 'REFUNDED'` |
| `refund.processed` | Refund credited to customer | Log completion |

### Webhook vs Frontend Verify — Both Needed!

```
┌─────────────────────────────────────────────────────────────────┐
│                    Two-Layer Verification                       │
├─────────────────────────────┬───────────────────────────────────┤
│  Layer 1: Frontend Verify   │  Layer 2: Webhook                │
│  (verify-razorpay-payment)  │  (razorpay-webhook)              │
├─────────────────────────────┼───────────────────────────────────┤
│  Called by: React app       │  Called by: Razorpay servers      │
│  When: Immediately after    │  When: A few seconds later        │
│    checkout completes       │    (async, background)            │
│  Purpose: Instant user      │  Purpose: Safety net              │
│    feedback                 │    if frontend call fails         │
│  Verifies: HMAC signature   │  Verifies: Webhook signature     │
│    of payment               │    of event                      │
│  Updates:                   │  Updates:                        │
│    payments.status = 'PAID' │    payments.webhook_verified     │
│    orders.payment_status    │    = true                         │
│  What if it fails?          │  Catches the miss!               │
│    Webhook catches it ↗     │                                  │
└─────────────────────────────┴───────────────────────────────────┘
```

---

## 8. Complete Database State at Every Step

### Step-by-step snapshot of all 3 tables for a ₹735 online payment:

**After Step 2 (Order Created):**

```
═══ orders ═══
id          │ customer_id │ order_number │ status  │ payment_method │ payment_status │ total
────────────┼─────────────┼──────────────┼─────────┼────────────────┼────────────────┼──────
d4e5f6a7... │ user_123    │ ORD-A1B2     │ PENDING │ ONLINE         │ PENDING        │ 735

═══ payments ═══
(empty — not created yet)

═══ payment_logs ═══
(empty — not created yet)
```

**After Step 7 (Razorpay Order Created):**

```
═══ orders ═══
id          │ status  │ payment_method │ payment_status │ total
────────────┼─────────┼────────────────┼────────────────┼──────
d4e5f6a7... │ PENDING │ ONLINE         │ PENDING        │ 735         (no change)

═══ payments ═══
id          │ order_id    │ amount │ razorpay_order_id  │ razorpay_payment_id │ status  │ method │ webhook │ paid_at
────────────┼─────────────┼────────┼────────────────────┼─────────────────────┼─────────┼────────┼─────────┼────────
e5f6a7b8... │ d4e5f6a7... │ 735    │ order_Rzp123       │ NULL                │ PENDING │ NULL   │ false   │ NULL

═══ payment_logs ═══
id │ payment_id  │ event_type     │ event_data                          │ created_at
───┼─────────────┼────────────────┼─────────────────────────────────────┼───────────
1  │ e5f6a7b8... │ ORDER_CREATED  │ {"razorpay_order_id":"order_Rzp123"}│ 01:50:00
```

**After Step 14 (Payment Verified):**

```
═══ orders ═══
id          │ status  │ payment_method │ payment_status │ total
────────────┼─────────┼────────────────┼────────────────┼──────
d4e5f6a7... │ PENDING │ ONLINE         │ PAID ✅        │ 735         ← UPDATED

═══ payments ═══
id          │ order_id    │ amount │ razorpay_order_id  │ razorpay_payment_id │ status │ method │ webhook │ paid_at
────────────┼─────────────┼────────┼────────────────────┼─────────────────────┼────────┼────────┼─────────┼──────────
e5f6a7b8... │ d4e5f6a7... │ 735    │ order_Rzp123       │ pay_Rzp789 ✅       │ PAID ✅│ upi ✅ │ false   │ 01:50:30 ✅

═══ payment_logs ═══
id │ payment_id  │ event_type       │ event_data                                    │ created_at
───┼─────────────┼──────────────────┼───────────────────────────────────────────────┼───────────
1  │ e5f6a7b8... │ ORDER_CREATED    │ {"razorpay_order_id":"order_Rzp123"}          │ 01:50:00
2  │ e5f6a7b8... │ PAYMENT_SUCCESS  │ {"razorpay_payment_id":"pay_Rzp789"} ✅      │ 01:50:30
```

**After Step 19 (Webhook Confirmed):**

```
═══ orders ═══
(no change from Step 14)

═══ payments ═══
id          │ order_id    │ amount │ razorpay_order_id  │ razorpay_payment_id │ status │ method │ webhook    │ paid_at
────────────┼─────────────┼────────┼────────────────────┼─────────────────────┼────────┼────────┼────────────┼──────────
e5f6a7b8... │ d4e5f6a7... │ 735    │ order_Rzp123       │ pay_Rzp789          │ PAID   │ upi    │ true ✅    │ 01:50:30

═══ payment_logs ═══
id │ payment_id  │ event_type                │ event_data                               │ created_at
───┼─────────────┼───────────────────────────┼──────────────────────────────────────────┼───────────
1  │ e5f6a7b8... │ ORDER_CREATED             │ {"razorpay_order_id":"order_Rzp123"}     │ 01:50:00
2  │ e5f6a7b8... │ PAYMENT_SUCCESS           │ {"razorpay_payment_id":"pay_Rzp789"}     │ 01:50:30
3  │ e5f6a7b8... │ WEBHOOK_PAYMENT_CAPTURED  │ { full razorpay webhook payload } ✅     │ 01:50:35
```

---

## 🎯 Quick Reference Summary

```
┌──────────────────────────────────────────────────────────────────┐
│  orders         = WHAT was ordered     (food, table, status)     │
│  payments       = HOW it was paid      (Razorpay IDs, method)   │
│  payment_logs   = WHAT HAPPENED        (audit trail, debugging) │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pay Online:    orders + payments + payment_logs (all 3)        │
│  Pay at Counter: orders only (no payments/logs row)             │
│                                                                  │
│  Edge Function 1: create-razorpay-order                         │
│    → INSERT payments, INSERT payment_logs                       │
│                                                                  │
│  Edge Function 2: verify-razorpay-payment                       │
│    → UPDATE payments, UPDATE orders, INSERT payment_logs        │
│                                                                  │
│  Edge Function 3: razorpay-webhook                              │
│    → UPDATE payments (webhook_verified), INSERT payment_logs    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
