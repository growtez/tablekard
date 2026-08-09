-- Add slug column initially allowing NULL
ALTER TABLE public.restaurants ADD COLUMN slug TEXT;

-- Update existing rows to have a unique slug based on their name and a snippet of their ID
UPDATE public.restaurants
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text FROM 1 FOR 8)
WHERE slug IS NULL;

-- Make slug NOT NULL and UNIQUE
ALTER TABLE public.restaurants ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_slug_key UNIQUE (slug);
