# Supabase Setup Guide

This project uses Supabase for **Auth + Database (Postgres)**.

## 1. Create Project

- Create a Supabase project.
- Grab `Project URL` and `anon public key` from **Project Settings → API**.

## 2. Apply Schema + RLS

Run the SQL in:

```
supabase/schema.sql
```

You can paste it into the Supabase SQL editor and run it once.

## 3. Configure Auth Providers

Customer web uses:

- Google OAuth
- Magic Link (email OTP)

Enable providers in **Authentication → Providers**.

Set the redirect URL to your app domain (local dev usually):

```
http://localhost:5173
```

## 4. Environment Variables

Copy `.env.example` to `.env` and fill:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173
```

