-- Add razorpay_linked_account_id to the restaurant_payment_settings table
ALTER TABLE public.restaurant_payment_settings
ADD COLUMN IF NOT EXISTS razorpay_linked_account_id TEXT;

-- Update the upsert RPC function to support the new column
CREATE OR REPLACE FUNCTION upsert_restaurant_payment_settings(
    p_restaurant_id UUID,
    p_razorpay_key_id TEXT,
    p_razorpay_key_secret TEXT,
    p_razorpay_webhook_secret TEXT,
    p_online_payments_enabled BOOLEAN,
    p_razorpay_linked_account_id TEXT DEFAULT NULL
)
RETURNS public.restaurant_payment_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result public.restaurant_payment_settings;
    v_key_secret_id UUID;
    v_webhook_secret_id UUID;
BEGIN
    IF NOT (public.is_restaurant_member(p_restaurant_id) OR public.is_super_admin()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT razorpay_key_secret_id, razorpay_webhook_secret_id 
    INTO v_key_secret_id, v_webhook_secret_id
    FROM public.restaurant_payment_settings
    WHERE restaurant_id = p_restaurant_id;

    IF p_razorpay_key_secret IS NOT NULL THEN
        IF v_key_secret_id IS NOT NULL THEN
            UPDATE vault.secrets SET secret = p_razorpay_key_secret WHERE id = v_key_secret_id;
        ELSE
            SELECT id INTO v_key_secret_id FROM vault.create_secret(p_razorpay_key_secret, 'razorpay_key_secret for ' || p_restaurant_id);
        END IF;
    END IF;

    IF p_razorpay_webhook_secret IS NOT NULL THEN
        IF v_webhook_secret_id IS NOT NULL THEN
            UPDATE vault.secrets SET secret = p_razorpay_webhook_secret WHERE id = v_webhook_secret_id;
        ELSE
            SELECT id INTO v_webhook_secret_id FROM vault.create_secret(p_razorpay_webhook_secret, 'razorpay_webhook_secret for ' || p_restaurant_id);
        END IF;
    END IF;

    INSERT INTO public.restaurant_payment_settings (
        restaurant_id, 
        provider, 
        razorpay_key_id, 
        online_payments_enabled, 
        razorpay_key_secret_id, 
        razorpay_webhook_secret_id,
        has_razorpay_key_secret,
        has_razorpay_webhook_secret,
        razorpay_linked_account_id
    )
    VALUES (
        p_restaurant_id, 
        'razorpay', 
        p_razorpay_key_id, 
        p_online_payments_enabled, 
        v_key_secret_id, 
        v_webhook_secret_id,
        v_key_secret_id IS NOT NULL,
        v_webhook_secret_id IS NOT NULL,
        p_razorpay_linked_account_id
    )
    ON CONFLICT (restaurant_id) DO UPDATE SET
        razorpay_key_id = EXCLUDED.razorpay_key_id,
        online_payments_enabled = EXCLUDED.online_payments_enabled,
        razorpay_key_secret_id = COALESCE(EXCLUDED.razorpay_key_secret_id, public.restaurant_payment_settings.razorpay_key_secret_id),
        razorpay_webhook_secret_id = COALESCE(EXCLUDED.razorpay_webhook_secret_id, public.restaurant_payment_settings.razorpay_webhook_secret_id),
        has_razorpay_key_secret = COALESCE(EXCLUDED.razorpay_key_secret_id, public.restaurant_payment_settings.razorpay_key_secret_id) IS NOT NULL,
        has_razorpay_webhook_secret = COALESCE(EXCLUDED.razorpay_webhook_secret_id, public.restaurant_payment_settings.razorpay_webhook_secret_id) IS NOT NULL,
        razorpay_linked_account_id = COALESCE(EXCLUDED.razorpay_linked_account_id, public.restaurant_payment_settings.razorpay_linked_account_id),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;
