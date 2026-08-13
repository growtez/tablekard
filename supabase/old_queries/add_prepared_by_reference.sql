ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS kitchen_app_enabled BOOLEAN DEFAULT true;
