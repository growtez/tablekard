-- Allow restaurant members to read the profiles of all staff
-- in their restaurant(s), enabling the Team page to show names/emails/avatars.
CREATE POLICY "Restaurant members can read co-worker profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.restaurant_users ru_target
    JOIN public.restaurant_users ru_viewer
      ON ru_viewer.restaurant_id = ru_target.restaurant_id
    WHERE ru_target.profile_id = profiles.id
      AND ru_viewer.profile_id = auth.uid()
      AND ru_viewer.active = true
  )
);
