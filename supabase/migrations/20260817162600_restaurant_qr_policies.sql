-- ================================================================
-- Migration: Allow Restaurant Admins to manage their own QR tokens
-- Date: 2026-08-17
-- Description:
--   1. Adds policies allowing restaurant admins to INSERT and UPDATE 
--      qr_code_tokens for their own restaurants.
-- ================================================================

-- Restaurant members can INSERT tokens for their own restaurant
CREATE POLICY "Restaurant members can insert tokens"
ON public.qr_code_tokens
FOR INSERT
TO authenticated
WITH CHECK (
    assigned_restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_users
        WHERE profile_id = auth.uid() AND active = true
    )
);

-- Restaurant members can UPDATE their own tokens
CREATE POLICY "Restaurant members can update their own tokens"
ON public.qr_code_tokens
FOR UPDATE
TO authenticated
USING (
    assigned_restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_users
        WHERE profile_id = auth.uid() AND active = true
    )
)
WITH CHECK (
    assigned_restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_users
        WHERE profile_id = auth.uid() AND active = true
    )
);
