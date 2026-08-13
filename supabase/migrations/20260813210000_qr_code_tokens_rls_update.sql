-- ================================================================
-- Migration: Add QR Code Tokens UPDATE policy for restaurant members
-- Date: 2026-08-13
-- Description:
--   Allows restaurant members to link (claim) available tokens
--   and unlink tokens currently assigned to their restaurant.
-- ================================================================

CREATE POLICY "Restaurant members can update tokens"
ON public.qr_code_tokens
FOR UPDATE
TO authenticated
USING (
    -- They can update tokens that are currently available...
    status = 'available'
    -- ...or tokens that are already assigned to their restaurant.
    OR assigned_restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_users
        WHERE profile_id = auth.uid() AND active = true
    )
)
WITH CHECK (
    -- The updated token must either become available (unlinked)...
    status = 'available'
    -- ...or it must be assigned to their own restaurant.
    OR assigned_restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_users
        WHERE profile_id = auth.uid() AND active = true
    )
);
