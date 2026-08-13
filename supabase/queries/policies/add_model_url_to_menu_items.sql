-- 1. Allow anyone to VIEW the AR models (so they show up in the app)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ar-files' );

-- 2. Allow logged-in users to UPLOAD models
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ar-files' AND
  auth.role() = 'authenticated'
);

-- 3. Allow logged-in users to DELETE/UPDATE their models
CREATE POLICY "Authenticated Management"
ON storage.objects FOR ALL
USING (
  bucket_id = 'ar-files' AND
  auth.role() = 'authenticated'
);
