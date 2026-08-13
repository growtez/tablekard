DROP POLICY IF EXISTS "Public Read Menu Images" ON storage.objects;
CREATE POLICY "Public Read Menu Images"
  ON storage.objects FOR SELECT USING ( bucket_id = 'menu-images' );

DROP POLICY IF EXISTS "Authenticated Manage Menu Images" ON storage.objects;
CREATE POLICY "Authenticated Manage Menu Images"
  ON storage.objects FOR ALL USING (
    bucket_id = 'menu-images' AND auth.role() = 'authenticated'
  );
