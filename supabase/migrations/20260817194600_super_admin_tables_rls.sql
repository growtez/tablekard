-- ================================================================
-- Migration: Explicit Super Admin RLS for restaurant_tables
-- Date: 2026-08-17
-- Description:
--   Explicitly allows super admins to manage restaurant_tables.
--   This ensures unlinking tokens works correctly for super admins.
-- ================================================================

CREATE POLICY "Super admins manage all restaurant_tables"
ON public.restaurant_tables
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
