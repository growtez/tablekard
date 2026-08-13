-- ================================================================
-- Migration: Add QR Code Tokens support
-- Date: 2026-08-13
-- Description:
--   1. Creates the `qr_code_tokens` table for platform-level generic QR tokens
--   2. Adds `qr_token` column to `restaurant_tables` for linking
--   3. Adds RLS policies
-- ================================================================

-- ── 1. Add qr_token column to restaurant_tables ──────────────────
ALTER TABLE public.restaurant_tables
ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- ── 2. Create qr_code_tokens table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_code_tokens (
    id                      UUID DEFAULT extensions.uuid_generate_v4() NOT NULL,
    token                   TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'available',
    assigned_restaurant_id  UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    assigned_table_id       UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    assigned_at             TIMESTAMP WITH TIME ZONE,

    CONSTRAINT qr_code_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT qr_code_tokens_token_key UNIQUE (token),
    CONSTRAINT qr_code_tokens_status_check CHECK (status IN ('available', 'assigned'))
);

ALTER TABLE public.qr_code_tokens OWNER TO postgres;

-- ── 3. Index for fast token lookups (used by the resolver route) ──
CREATE INDEX IF NOT EXISTS idx_qr_code_tokens_token ON public.qr_code_tokens (token);
CREATE INDEX IF NOT EXISTS idx_qr_code_tokens_status ON public.qr_code_tokens (status);

-- ── 4. RLS Policies ──────────────────────────────────────────────
ALTER TABLE public.qr_code_tokens ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins manage qr_code_tokens"
ON public.qr_code_tokens
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Restaurant members can SELECT available tokens (for the dropdown picker in admin panel)
CREATE POLICY "Restaurant members can view available tokens"
ON public.qr_code_tokens
FOR SELECT
TO authenticated
USING (
    status = 'available'
    OR assigned_restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_users
        WHERE profile_id = auth.uid() AND active = true
    )
    OR public.is_super_admin()
);

-- Anonymous users can SELECT a single token by its value (for the resolver)
CREATE POLICY "Anyone can lookup a token by value"
ON public.qr_code_tokens
FOR SELECT
TO anon, authenticated
USING (true);
