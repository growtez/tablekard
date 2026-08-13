CREATE POLICY "Public can read orders for live queue" ON public.orders FOR SELECT USING (true);
