-- ================================================================
-- Migration: Add trashed status to qr_code_tokens
-- Date: 2026-08-18
-- ================================================================

ALTER TABLE public.qr_code_tokens 
DROP CONSTRAINT IF EXISTS qr_code_tokens_status_check;

ALTER TABLE public.qr_code_tokens 
ADD CONSTRAINT qr_code_tokens_status_check 
CHECK (status IN ('available', 'assigned', 'trashed'));
