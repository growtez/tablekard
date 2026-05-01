# Tablekard – Payment Testing & Integration Guide

This guide is specific to the code already in your project. It covers how to test the full
Razorpay payment flow end-to-end, how to debug each step, and what to verify in Supabase.

---

## How Your Payment System Works

Your payment flow has **3 sequential steps**, each mapped to a file:

```
[Customer clicks "Pay Online"]
        │
        ▼
① create-razorpay-order (Edge Function)
  • Fetches real prices from menu_items (prevents tampering)
  • Calls Razorpay API → gets razorpay_order_id
  • Saves a PENDING row in payments table
  • Stores cart in payment_logs (ORDER_CREATED event)
        │
        ▼
② Razorpay Checkout Popup (Frontend SDK)
  • Customer picks UPI / Card / NetBanking
  • On success → returns razorpay_payment_id + razorpay_signature
        │
        ▼
③ verify-razorpay-payment (Edge Function)
  • Verifies HMAC-SHA256 signature (prevents fake payments)
  • Creates order in orders + order_items tables
  • Updates payments row → status: PAID
  • Logs PAYMENT_SUCCESS event

[Safety net] razorpay-webhook (Edge Function)
  • Runs if the browser crashed before step ③
  • Creates the order from stored cart data
  • Always returns HTTP 200 to prevent Razorpay retries
```

All three steps are orchestrated by `processOnlinePayment()` in
`apps/customer-web/src/services/paymentService.js`.

---

## Prerequisites Before Testing

### 1. Environment Variables
Make sure `apps/customer-web/.env` has:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx   ← must be TEST key, not live
```

### 2. Supabase Edge Function Secrets
Run these once:
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=<your_test_secret>
supabase secrets set RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>
```

### 3. Razorpay SDK in `index.html`
Confirm this script tag exists in `apps/customer-web/index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```
*(Without this, `window.Razorpay` will be undefined and the checkout popup won't open.)*

### 4. Deploy Edge Functions
```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
supabase functions deploy razorpay-webhook --no-verify-jwt
```

---

## Testing the Full Flow (Razorpay Test Mode)

### Step 1 – Open the app in Test Mode

```bash
# From the repo root
npm run dev:customer-web
```

Make sure you are using `rzp_test_` keys — the checkout popup will say **"Test Mode"** in the header.

### Step 2 – Place an order

1. Scan a QR code (or navigate to a restaurant menu directly)
2. Add items to cart
3. Click **"Pay Online"** in the cart/checkout screen

### Step 3 – Use Razorpay Test Credentials

When the Razorpay modal opens, use these test details:

#### ✅ Test UPI (Success)
| Field | Value |
|---|---|
| UPI ID | `success@razorpay` |

#### ✅ Test Card (Success)
| Field | Value |
|---|---|
| Card Number | `4111 1111 1111 1111` |
| Expiry | Any future date (e.g., `12/29`) |
| CVV | Any 3 digits (e.g., `123`) |
| Name | Any name |

#### ❌ Test Card (Failure)
| Field | Value |
|---|---|
| Card Number | `4000 0000 0000 0002` |

> [!TIP]
> Full list of Razorpay test cards: https://razorpay.com/docs/payments/payments/test-card-details/

---

## What to Verify in Supabase After Each Test

Open **Supabase Dashboard → Table Editor** and check these tables in order:

### 1. `payments` table
After **Step ①** (order created):
- New row with `status = PENDING`
- `razorpay_order_id` is set (format: `order_xxxx`)
- `order_id` is `NULL` (not yet created)

After **Step ③** (verified):
- Same row now has `status = PAID`
- `razorpay_payment_id` is filled in (format: `pay_xxxx`)
- `order_id` now links to the new order
- `paid_at` timestamp is set

### 2. `payment_logs` table
You should see these events in order:
| event_type | When it appears |
|---|---|
| `ORDER_CREATED` | After step ① |
| `PAYMENT_SUCCESS` | After step ③ |
| `WEBHOOK_PAYMENT_CAPTURED` | After Razorpay webhook fires |

### 3. `orders` table
- New row with `status = CONFIRMED` and `payment_status = PAID`
- Check `order_number` (format: `ORD-XXXXXX`)

### 4. `order_items` table
- One row per cart item linked to the new `order_id`

---

## Testing the Webhook Independently

Your project has a built-in **Webhook Demo Tool** at:
```
apps/customer-web/src/pages/test_webhook.jsx
```

This page lets you fire a mock `payment.captured` webhook to your live Supabase function **without going through the full payment flow**.

### How to use it:

1. Navigate to `/test-webhook` in the customer-web app  
   *(or add it to your router if not already linked)*

2. Fill in the fields:
   - **Webhook Secret** — the value of `RAZORPAY_WEBHOOK_SECRET` in Supabase
   - **Razorpay Order ID** — copy a real `razorpay_order_id` from your `payments` table that has `status = PENDING`
   - **Mock Payment ID** — any string like `pay_testABC123`

3. Click **"Fire Webhook"** — it will:
   - Build a real `payment.captured` JSON payload
   - Sign it with HMAC-SHA256 using your secret
   - POST it directly to the live Supabase Edge Function

4. Expected result: **HTTP 200** `{"received": true}`

5. Check `payment_logs` for a `WEBHOOK_PAYMENT_CAPTURED` row

> [!IMPORTANT]
> Use a **real** `razorpay_order_id` from your DB (not a fake one) if you want to see the payment status actually update to `PAID`.

---

## Common Errors & Fixes

### ❌ "Razorpay SDK not loaded"
**Cause:** `checkout.js` script is missing from `index.html`  
**Fix:** Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` before `</body>`

---

### ❌ "You must be logged in to make a payment"
**Cause:** `paymentService.js` checks for a valid Supabase session before calling the Edge Function  
**Fix:** Make sure the user is authenticated. Check `supabase.auth.getSession()` in the browser console.

---

### ❌ Edge Function returns 401 "Invalid auth token"
**Cause:** The Supabase JWT has expired or the anon key is wrong  
**Fix:**
1. Check `VITE_SUPABASE_ANON_KEY` in `.env`
2. Sign out and sign back in to get a fresh JWT
3. Confirm the Edge Function is receiving the `Authorization: Bearer <token>` header

---

### ❌ Edge Function returns "Razorpay credentials not configured"
**Cause:** Secrets not set in Supabase  
**Fix:**
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx
supabase secrets set RAZORPAY_KEY_SECRET=xxx
```
Then redeploy the function.

---

### ❌ "Payment verification failed" / Signature mismatch
**Cause:** `RAZORPAY_KEY_SECRET` in Supabase doesn't match the key used during checkout  
**Fix:** Make sure the same key pair (`KEY_ID` + `KEY_SECRET`) is used in both the frontend `.env` and the Supabase secrets.

---

### ❌ Webhook returns 400 "Invalid signature"
**Cause:** The `RAZORPAY_WEBHOOK_SECRET` in Supabase doesn't match what Razorpay is using  
**Fix:**
1. Generate a new secret: `openssl rand -hex 24`
2. Update in Supabase: `supabase secrets set RAZORPAY_WEBHOOK_SECRET=<new_secret>`
3. Update in Razorpay Dashboard → Settings → Webhooks → Edit the webhook secret

---

### ❌ Order created but `order_items` is empty
**Cause:** `itemsError` in `verify-razorpay-payment` is silently caught (doesn't throw)  
**Fix:** Check Supabase → Edge Functions → `verify-razorpay-payment` → Logs for "Order items creation failed"

---

## Go-Live Checklist (Switching to Production)

- [ ] Get **Live** Razorpay keys from `razorpay.com/app/keys`
- [ ] Replace `VITE_RAZORPAY_KEY_ID=rzp_live_xxx` in Vercel environment variables
- [ ] Update Supabase secrets with live keys:
  ```bash
  supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx
  supabase secrets set RAZORPAY_KEY_SECRET=<live_secret>
  ```
- [ ] Generate a new production webhook secret and set it in both Supabase and Razorpay Dashboard
- [ ] In Razorpay Dashboard, switch from **Test Mode** to **Live Mode** before configuring the webhook
- [ ] Confirm the webhook URL in Razorpay is pointing to your production Supabase project
- [ ] Do one real ₹1 transaction to verify end-to-end in production
- [ ] Remove the `/test-webhook` route from production router (it exposes your webhook URL)
