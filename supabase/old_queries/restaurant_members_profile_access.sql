CREATE POLICY "Restaurant members can read customer profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.customer_id = profiles.id AND public.is_restaurant_member(o.restaurant_id)
  )
);
