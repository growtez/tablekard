-- Alter the subscription_status column from boolean to text
ALTER TABLE public.restaurants 
ALTER COLUMN subscription_status TYPE text USING (
  CASE 
    WHEN subscription_status = true THEN 'ACTIVE' 
    ELSE 'INACTIVE' 
  END
);

-- Set the new default
ALTER TABLE public.restaurants 
ALTER COLUMN subscription_status SET DEFAULT 'INACTIVE';
