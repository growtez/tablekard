-- ======================================================================================
-- REMOVE SUSPENDED SUB-STATUS
-- 1. Remove Step 2 from suspend_expired_subscriptions (leave as expired)
-- 2. Migrate existing suspended subscriptions back to expired/active
-- ======================================================================================

-- ── 1. Replace the cron function with single-step logic ──
CREATE OR REPLACE FUNCTION public.suspend_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Step 1: Mark subscriptions as 'expired' when subscription_end_at has passed.
    -- The restaurant stays status = 'active' infinitely.
    -- UI logic (comparing grace_period_ends_at < NOW()) will handle pausing the customer web.
    UPDATE public.restaurants
    SET subscription_status = 'expired'
    WHERE status                = 'active'
      AND subscription_status   = 'active'
      AND subscription_end_at  IS NOT NULL
      AND subscription_end_at   < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Migrate existing billing-suspended restaurants ──
-- Convert any restaurant that was suspended due to billing back to active/expired.
UPDATE public.restaurants
SET status = 'active',
    subscription_status = 'expired'
WHERE subscription_status = 'suspended';
