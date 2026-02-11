# Restaurant SaaS Platform (QR Only)

A multi-tenant Restaurant SaaS platform focused on **QR-based, on-premise ordering**. This repo keeps the platform lean: **Super Admin**, **Restaurant Admin**, and **Customer Web (QR)**.

---

## Overview

**Multi-tenant structure:**

- **Super Admin** → Manages all restaurants, subscriptions, and platform settings.
- **Restaurant Admin** → Manages menu, orders, tables, and staff for a restaurant.
- **Customer Web (QR)** → Logged-in customers scan a table QR and place dine-in orders.

---

## Apps

| App | Type | Purpose |
|-----|------|---------|
| **Super Admin** | React + Vite | Platform management |
| **Restaurant Admin** | React + Vite | Restaurant operations |
| **Customer Web (QR)** | React + Vite | QR ordering experience |

---

## Tech Stack

| Layer | Technology |
|------|------------|
| Web Apps | React 18/19 + Vite |
| Backend | Supabase (Postgres + Auth + RLS) |
| Auth | Google OAuth + Magic Link (customers), Email/Password (admins) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project

### Environment

Copy `.env.example` → `.env` and fill:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Run Apps

```bash
cd apps/super-admin
npm install
npm run dev
```

```bash
cd apps/restaurant-admin
npm install
npm run dev
```

```bash
cd apps/customer-web
npm install
npm run dev
```

---

## Supabase Schema

SQL for the Supabase schema and RLS policies is in:

```
supabase/schema.sql
```

---

## Notes

- Delivery and mobile apps have been removed in favor of QR-only ordering.
- Payments (Razorpay) are planned but not wired yet.

