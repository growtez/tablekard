-- 1. Fix the strict NOT NULL constraints based on your requirements
ALTER TABLE public.landing_leads ALTER COLUMN restaurant_name DROP NOT NULL;
ALTER TABLE public.landing_leads ALTER COLUMN country DROP NOT NULL;

-- 2. Make sure the RLS policies are applied correctly
DROP POLICY IF EXISTS "Super admins can manage leads" ON public.landing_leads;
CREATE POLICY "Super admins can manage leads" 
ON public.landing_leads 
FOR ALL 
USING (public.is_super_admin(auth.uid()));
