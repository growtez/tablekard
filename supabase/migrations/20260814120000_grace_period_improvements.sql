-- ======================================================================================
-- GRACE PERIOD IMPROVEMENTS
-- 1. Normalize subscription_status casing to lowercase
-- 2. Two-step cron: active → expired (grace) → suspended (hard block)
-- 3. Add index for expired subscription detection
-- ======================================================================================

-- ── 1. Normalize existing uppercase values to lowercase ──
UPDATE public.restaurants
SET subscription_status = LOWER(subscription_status)
WHERE subscription_status IS DISTINCT FROM LOWER(subscription_status);

-- ── 2. Change column default from 'INACTIVE' to 'inactive' ──
ALTER TABLE public.restaurants
ALTER COLUMN subscription_status SET DEFAULT 'inactive';

-- ── 3. Add partial index for Step 1 (expired subscription detection) ──
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_end
    ON public.restaurants (subscription_end_at)
    WHERE status = 'active' AND subscription_status = 'active' AND subscription_end_at IS NOT NULL;

-- ── 4. Replace the cron function with two-step logic ──
CREATE OR REPLACE FUNCTION public.suspend_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Step 1: Mark subscriptions as 'expired' when subscription_end_at has passed.
    -- The restaurant stays status = 'active' so customers can still order
    -- during the 3-day grace period. The admin sees a warning banner.
    UPDATE public.restaurants
    SET subscription_status = 'expired'
    WHERE status                = 'active'
      AND subscription_status   = 'active'
      AND subscription_end_at  IS NOT NULL
      AND subscription_end_at   < NOW();

    -- Step 2: Fully suspend restaurants whose grace period has elapsed.
    -- Both status and subscription_status change — this triggers RLS block
    -- (customers can't see the restaurant) and StatusGuard block (admin locked out).
    UPDATE public.restaurants
    SET status              = 'suspended',
        subscription_status = 'suspended'
    WHERE status                  = 'active'
      AND subscription_status     = 'expired'
      AND grace_period_ends_at   IS NOT NULL
      AND grace_period_ends_at    < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
