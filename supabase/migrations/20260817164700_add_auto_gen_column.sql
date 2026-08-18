-- ================================================================
-- Migration: Add is_auto_generated column to qr_code_tokens
-- Date: 2026-08-17
-- ================================================================

ALTER TABLE public.qr_code_tokens
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false;
