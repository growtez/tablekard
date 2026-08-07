ALTER TABLE public.restaurant_payment_settings
ADD COLUMN IF NOT EXISTS razorpay_linked_account_id TEXT;
