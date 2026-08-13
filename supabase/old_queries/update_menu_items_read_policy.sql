-- 1. Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Public can read active menu items" ON public.menu_items;

-- 2. Create the new permissive SELECT policy so customer client can read unavailable items
CREATE POLICY "Public can read menu items" ON public.menu_items FOR SELECT USING (true);
