-- ================================================================
-- Migration: Add table number and capacity to QR Code Tokens
-- Date: 2026-08-16
-- Description:
--   Adds `table_number` and `capacity` columns to `qr_code_tokens`
--   so tokens can be permanently pre-configured with table details.
-- ================================================================

ALTER TABLE public.qr_code_tokens
ADD COLUMN IF NOT EXISTS table_number INTEGER,
ADD COLUMN IF NOT EXISTS capacity INTEGER;
