# Tablekard – Full Hosting Guide

Tablekard is a **monorepo** with three separate frontend apps and a Supabase backend. Here's how to deploy everything.

---

## Architecture Overview

| Component | Technology | Recommended Host |
|---|---|---|
| `apps/customer-web` | React + Vite | **Vercel** |
| `apps/restaurant-admin` | React + Vite + TS | **Vercel** |
| `apps/super-admin` | React + Vite | **Vercel** |
| Supabase Edge Functions | Deno (TypeScript) | **Supabase** (built-in) |
| Database | PostgreSQL | **Supabase** (built-in) |
| Payments | Razorpay | Razorpay Cloud |

---

## Step 1 – Set Up Supabase (Backend)

> [!IMPORTANT]
> Do this first. All frontend apps depend on Supabase.

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon/public API key** from **Settings → API**
3. Apply the database schema by going to **SQL Editor** and running the contents of:
   ```
   supabase/schema.sql
   ```
4. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you haven't:
   ```bash
   npm install -g supabase
   ```
5. Login and link the project:
   ```bash
   supabase login
   supabase link --project-ref <YOUR_PROJECT_ID>
   ```
   *(Find `<YOUR_PROJECT_ID>` in your Supabase dashboard URL)*

---

## Step 2 – Deploy Edge Functions (Supabase)

Deploy all three Razorpay edge functions from your project root:

```bash
# Deploy the order creation function (requires JWT auth)
supabase functions deploy create-razorpay-order

# Deploy the payment verification function (requires JWT auth)
supabase functions deploy verify-razorpay-payment

# Deploy the webhook listener (NO JWT — Razorpay can't pass tokens)
supabase functions deploy razorpay-webhook --no-verify-jwt
```

Then set the required secrets in Supabase:

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

*(See `docs/WEBHOOK_SETUP.md` for how to generate a webhook secret)*

---

## Step 3 – Deploy Frontend Apps to Vercel

Each app is deployed **separately** as its own Vercel project. You need to do this 3 times.

### Prerequisites
- Push your repo to **GitHub / GitLab / Bitbucket**
- Have a [Vercel account](https://vercel.com)

### For Each App (repeat 3 times):

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Select your `tablekard` repo
3. In **Configure Project**, set the **Root Directory** to the specific app:

| App | Root Directory | Suggested Domain |
|---|---|---|
| `customer-web` | `apps/customer-web` | `tablekard.com` or `app.tablekard.com` |
| `restaurant-admin` | `apps/restaurant-admin` | `admin.tablekard.com` |
| `super-admin` | `apps/super-admin` | `superadmin.tablekard.com` |

4. Set **Framework Preset** → `Vite`
5. Set **Build Command** → `npm run build`
6. Set **Output Directory** → `dist`

> [!WARNING]
> For `restaurant-admin`, the build command is `tsc -b && vite build`. Make sure Vercel uses that.

7. Add **Environment Variables** for each app (under Settings → Environment Variables):

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```

8. Click **Deploy** ✅

> [!NOTE]
> The `customer-web` app already has a `vercel.json` with SPA rewrites configured, so client-side routing will work out of the box. Add a similar `vercel.json` to `restaurant-admin` and `super-admin` if they also use client-side routing.

---

## Step 4 – Configure Razorpay Webhook

1. Go to **Razorpay Dashboard → Settings → Webhooks → Add New Webhook**
2. Set the Webhook URL to:
   ```
   https://<your-project-id>.supabase.co/functions/v1/razorpay-webhook
   ```
3. Set the **Secret** to the same value you used for `RAZORPAY_WEBHOOK_SECRET`
4. Enable these events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created` *(optional)*
   - `refund.processed` *(optional)*
5. Click **Save**

---

## Step 5 – Connect Custom Domains (Optional)

In each Vercel project:

1. Go to **Settings → Domains**
2. Add your custom domain (e.g., `app.tablekard.com`)
3. Add the DNS records shown by Vercel to your domain registrar
4. Wait for SSL to provision (usually < 5 minutes)

---

## Quick Reference – Environment Variables

| Variable | Where Used |
|---|---|
| `VITE_SUPABASE_URL` | All 3 frontend apps |
| `VITE_SUPABASE_ANON_KEY` | All 3 frontend apps |
| `VITE_RAZORPAY_KEY_ID` | `customer-web` (checkout) |
| `RAZORPAY_KEY_ID` | Supabase Edge Functions |
| `RAZORPAY_KEY_SECRET` | Supabase Edge Functions |
| `RAZORPAY_WEBHOOK_SECRET` | Supabase Edge Functions |

---

## Summary

```
GitHub Repo
    ├── apps/customer-web     → Vercel Project #1 (app.tablekard.com)
    ├── apps/restaurant-admin → Vercel Project #2 (admin.tablekard.com)
    ├── apps/super-admin      → Vercel Project #3 (superadmin.tablekard.com)
    └── supabase/
        ├── schema.sql        → Run once in Supabase SQL Editor
        └── functions/        → Deploy via Supabase CLI
```
