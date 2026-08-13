-- ======================================================================================
-- SUBSCRIPTION SYSTEM V2 — AUTO-SUSPENSION VIA pg_cron
-- ======================================================================================

-- Enable the pg_cron extension (run once; safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Index to make the daily cron scan fast
CREATE INDEX IF NOT EXISTS idx_restaurants_grace_period
    ON public.restaurants (grace_period_ends_at)
    WHERE status = 'active' AND grace_period_ends_at IS NOT NULL;

-- Function: suspends all 'active' restaurants whose grace period has elapsed.
-- Only ever writes 'active' → 'suspended'. Never touches 'pending', 'approved', or 'rejected'.
CREATE OR REPLACE FUNCTION public.suspend_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.restaurants
    SET
        status              = 'suspended',
        subscription_status = false
    WHERE
        status                  = 'active'
        AND grace_period_ends_at IS NOT NULL
        AND grace_period_ends_at  < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: runs every day at 18:30 UTC (midnight IST).
-- Unschedule first so this file is safe to re-run without duplicate jobs.
SELECT cron.unschedule('suspend-expired-subscriptions');
SELECT cron.schedule(
    'suspend-expired-subscriptions',
    '30 18 * * *',
    $$SELECT public.suspend_expired_subscriptions();$$
);
