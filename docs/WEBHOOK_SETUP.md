# Razorpay Webhook & Vercel Setup Guide

This guide will walk you through deploying your Supabase Edge Function configuring Razorpay, and connecting it to your Vercel-hosted frontend (`app.tablekard.com`).

---

## 1. Deploy the Function to Supabase

First, we need to push the code you just merged to your live Supabase project.

1. Open your terminal at the root of the `tablekard` repository.
2. Login to the Supabase CLI (if you haven't already):
   ```bash
   supabase login
   ```
3. Link your local project to your Supabase project (get your `<PROJECT_ID>` from your Supabase dashboard URL: `supabase.com/dashboard/project/<PROJECT_ID>`):
   ```bash
   supabase link --project-ref <PROJECT_ID>
   ```
4. Deploy the `razorpay-webhook` edge function:
   ```bash
   supabase functions deploy razorpay-webhook --no-verify-jwt
   ```
   *(We use `--no-verify-jwt` because Razorpay cannot pass Supabase authentication tokens; it verifies itself using the signature hash instead).*

---

## 2. Generate a Webhook Secret

You need a secure random string that ONLY Supabase and Razorpay know. This is used to prove the webhook is genuinely from Razorpay.

1. Generate a strong secret. You can run this command in your terminal:
   ```bash
   openssl rand -hex 24
   ```
   *Example output: `3a4f1c9...`*
2. Save this secret somewhere safe; you will need it for both Supabase and Razorpay.

---

## 3. Set the Secret in Supabase

Tell your Edge Function what the secret is so it can verify incoming requests.

1. In your terminal, run the following command, replacing `your_generated_secret_here` with the string from step 2:
   ```bash
   supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_generated_secret_here
   ```
2. *(Optional but recommended)* Verify the secret is set by checking your Supabase Dashboard -> Edge Functions -> Secrets.

---

## 4. Configure the Webhook in Razorpay

Finally, tell Razorpay where to send the events.

1. Log in to your **Razorpay Dashboard**.
2. Make sure you are in **Test Mode** (if you are just developing) or **Live Mode** (if you are deploying to production).
3. Navigate to **Account & Settings** (or Settings) -> **Webhooks** -> click **Add New Webhook**.
4. Fill out the form with the following details:
   - **Webhook URL:** `https://sguegujmoawhtstzsdqs.supabase.co/functions/v1/razorpay-webhook`
   - **Secret:** Paste the exact string generated in Step 2.
   - **Alert Email:** Your email address (so Razorpay can notify you if the webhook starts failing).
   - **Active Events:** Check the following boxes (these are what the code currently expects):
     - `payment.captured`
     - `payment.failed`
     - `refund.created` *(Optional: The code handles it)*
     - `refund.processed` *(Optional: The code handles it)*
5. Click **Create Webhook**.

---

## 5. How to Test It (with Vercel)

1. Go to your live Vercel frontend at **app.tablekard.com** and add an item to your cart.
2. Proceed to checkout and select "Pay Online".
3. Complete a test payment (using Razorpay's test card details) in the modal.
4. Check your **Supabase Dashboard**:
   - Go to **Edge Functions** -> **razorpay-webhook** -> **Logs** to see "Webhook received: payment.captured".
   - Go to **Table Editor** -> `payment_logs` to see the new `WEBHOOK_PAYMENT_CAPTURED` row.
   - Go to **Table Editor** -> `payments` to see the payment status change to `PAID`.
   - Go to **Table Editor** -> `payments` to see the payment status change to `PAID`.
