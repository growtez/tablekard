-- ================================================================
-- Migration: Update Restaurant Admins policy to allow unlinking
-- Date: 2026-08-18
-- ================================================================

DROP POLICY IF EXISTS "Restaurant members can update their own tokens" ON public.qr_code_tokens;

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
    OR
    assigned_restaurant_id IS NULL
);
