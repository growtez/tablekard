CREATE POLICY "Public can read platform settings" ON public.platform_settings FOR SELECT USING (true);
