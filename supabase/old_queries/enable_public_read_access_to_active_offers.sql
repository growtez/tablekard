DROP POLICY IF EXISTS "Public can read active offers" ON public.offers;

CREATE POLICY "Public can read active offers"
    ON public.offers
    FOR SELECT
    USING (true);
