-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads to menu-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');


-- Allow public to read images
CREATE POLICY "Public read menu-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-images');


-- Allow users to update their uploads
CREATE POLICY "Allow authenticated update menu-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images');


-- Allow users to delete images
CREATE POLICY "Allow authenticated delete menu-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
