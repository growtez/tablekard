# Tablekard - Restaurant SaaS Platform (QR Only)

A comprehensive multi-tenant Restaurant SaaS platform focused on **QR-based, on-premise ordering**. This repository is structured as a monorepo containing multiple frontend applications that interface with a shared Supabase backend.

---

## 🏗️ Architecture & Apps

The platform is designed with a strict multi-tenant architecture, separating concerns between platform administration, restaurant management, and the end-customer experience.

| App | Tech Stack | Purpose |
|-----|------------|---------|
| **Super Admin** (`apps/super-admin`) | React + Vite | Platform-level management, SaaS subscription billing, and overarching restaurant onboarding. |
| **Restaurant Admin** (`apps/restaurant-admin`) | React + Vite | Restaurant operations dashboard. Manages the menu, orders, tables, staff roles, and analytics/revenue. |
| **Customer Web (QR)** (`apps/customer-web`) | React + Vite | The core dine-in experience. Customers scan a table QR code, authenticate, and place orders directly from their mobile devices. |
| **Inhouse Service App** (`apps/inhouse-service-app`) | React + Vite | Internal service application for staff/kitchen operations. |

*(Note: Delivery and native mobile apps have been deprecated in favor of a focused, QR-only ordering flow.)*

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|------------|
| **Web Apps** | React 18/19 + Vite |
| **Package Manager**| NPM Workspaces |
| **Backend & DB** | Supabase (PostgreSQL) |
| **Authentication**| Supabase Auth (Google OAuth, Magic Links for customers; Email/Password for admins) |
| **Storage** | Supabase Storage (for avatars, restaurant logos, and menu item images) |

---

## 🗄️ Database Features (Supabase)

The core logic of the platform resides securely in the Supabase PostgreSQL database (`supabase/schema.sql`). It utilizes advanced PostgreSQL features:

- **Row Level Security (RLS)**: Enforces strict data isolation between tenants. Users only see data belonging to their assigned restaurant. Super Admins have platform-wide access.
- **Realtime Subscriptions**: Live updates for the order queue, revenue changes, and menu updates are powered by Supabase Realtime publications.
- **Trigger-based Aggregations**: 
  - Revenue automatically rolls up into daily summaries.
  - Menu item sales counts are automatically tracked and incremented.
  - Order status cascades intelligently between parent orders and individual order items (e.g., if all items are 'ready', the order becomes 'ready').
- **Multi-tiered Roles**: Custom Enums governing roles (`super_admin`, `restaurant_admin`, `restaurant_staff`, `customer`).

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm 10+
- A configured Supabase project

### Environment Setup

Create a `.env` file at the root or within specific apps by copying from `.env.example`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation & Running Locally

The project utilizes npm workspaces, allowing you to install dependencies once from the root.

```bash
# Install all dependencies across all workspaces
npm install
```

**Run individual apps:**

```bash
# Super Admin
npm run dev:super-admin

# Restaurant Admin
npm run dev:restaurant-admin

# Customer Web
npm run dev:customer-web

# Inhouse Service App
npm run dev:inhouse-service-app
```

### Building for Production

```bash
npm run build:all
```

---

## 📅 Roadmap & Notes

- **Payments Integration**: Integration with Razorpay for SaaS subscriptions and customer checkouts is planned and supported in the schema, but wiring is currently in progress.
- **AR Models**: Support for 3D model URLs (`model_url`) in menu items is included in the schema to support Augmented Reality menu viewing.
