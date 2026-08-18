ALTER TABLE public.qr_code_tokens 
ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMP WITH TIME ZONE;

-- Create a trigger function to auto-set trashed_at when status becomes 'trashed'
CREATE OR REPLACE FUNCTION public.set_qr_token_trashed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'trashed' AND OLD.status != 'trashed' THEN
        NEW.trashed_at = NOW();
    ELSIF NEW.status != 'trashed' THEN
        NEW.trashed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_qr_token_trashed_at
BEFORE UPDATE ON public.qr_code_tokens
FOR EACH ROW
EXECUTE FUNCTION public.set_qr_token_trashed_at();

-- Set trashed_at for existing trashed tokens to now (as fallback)
UPDATE public.qr_code_tokens SET trashed_at = NOW() WHERE status = 'trashed' AND trashed_at IS NULL;

-- Enable pg_cron if not already enabled (Requires superuser/Supabase admin)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to delete tokens that have been in the trash for over 60 days
SELECT cron.schedule('clear_trashed_qr_tokens', '0 0 * * *', $$
    DELETE FROM public.qr_code_tokens 
    WHERE status = 'trashed' 
    AND trashed_at < NOW() - INTERVAL '60 days';
$$);
