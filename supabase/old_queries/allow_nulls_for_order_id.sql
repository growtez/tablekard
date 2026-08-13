-- New table
CREATE TABLE IF NOT EXISTS public.subscription_payments (...);
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Restaurant members can read subscription payments" ...;
CREATE POLICY "Super admins manage subscription payments" ...;
-- New column
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS subscription_end_at TIMESTAMPTZ;
