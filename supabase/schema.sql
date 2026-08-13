--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.0

-- Started on 2026-08-13 11:40:00

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 138 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 4237 (class 0 OID 0)
-- Dependencies: 138
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 1317 (class 1247 OID 32310)
-- Name: cash_card; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cash_card AS ENUM (
    'cash',
    'card',
    'online'
);


ALTER TYPE public.cash_card OWNER TO postgres;

--
-- TOC entry 1314 (class 1247 OID 32294)
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'served',
    'completed',
    'cancelled'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- TOC entry 1311 (class 1247 OID 32286)
-- Name: order_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_type AS ENUM (
    'dine_in',
    'takeaway',
    'delivery'
);


ALTER TYPE public.order_type OWNER TO postgres;

--
-- TOC entry 1323 (class 1247 OID 32328)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'card',
    'upi',
    'netbanking',
    'wallet',
    'online'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 1320 (class 1247 OID 32318)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- TOC entry 1308 (class 1247 OID 32274)
-- Name: restaurant_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.restaurant_status AS ENUM (
    'pending',
    'approved',
    'active',
    'suspended',
    'rejected'
);


ALTER TYPE public.restaurant_status OWNER TO postgres;

--
-- TOC entry 1303 (class 1247 OID 32265)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'restaurant_admin',
    'restaurant_staff',
    'customer'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 414 (class 1259 OID 91772)
-- Name: restaurant_payment_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_payment_settings (
    restaurant_id uuid NOT NULL,
    provider text DEFAULT 'razorpay'::text NOT NULL,
    razorpay_key_id text,
    has_razorpay_key_secret boolean DEFAULT false NOT NULL,
    has_razorpay_webhook_secret boolean DEFAULT false NOT NULL,
    online_payments_enabled boolean DEFAULT false NOT NULL,
    razorpay_key_secret_id uuid,
    razorpay_webhook_secret_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    razorpay_linked_account_id text
);


ALTER TABLE public.restaurant_payment_settings OWNER TO postgres;

--
-- TOC entry 455 (class 1255 OID 91794)
-- Name: get_restaurant_payment_settings(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_restaurant_payment_settings(p_restaurant_id uuid) RETURNS SETOF public.restaurant_payment_settings
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT (public.is_restaurant_member(p_restaurant_id) OR public.is_super_admin()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY SELECT * FROM public.restaurant_payment_settings WHERE restaurant_id = p_restaurant_id;
END;
$$;


ALTER FUNCTION public.get_restaurant_payment_settings(p_restaurant_id uuid) OWNER TO postgres;

--
-- TOC entry 442 (class 1255 OID 91795)
-- Name: get_restaurant_razorpay_secret(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_restaurant_razorpay_secret(p_restaurant_id uuid) RETURNS TABLE(razorpay_key_secret text, razorpay_webhook_secret text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.decrypted_secret AS razorpay_key_secret,
        w.decrypted_secret AS razorpay_webhook_secret
    FROM public.restaurant_payment_settings rps
    LEFT JOIN vault.decrypted_secrets k ON k.id = rps.razorpay_key_secret_id
    LEFT JOIN vault.decrypted_secrets w ON w.id = rps.razorpay_webhook_secret_id
    WHERE rps.restaurant_id = p_restaurant_id;
END;
$$;


ALTER FUNCTION public.get_restaurant_razorpay_secret(p_restaurant_id uuid) OWNER TO postgres;

--
-- TOC entry 488 (class 1255 OID 32618)
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    'customer'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- TOC entry 457 (class 1255 OID 92995)
-- Name: handle_user_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_user_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.email <> OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_user_update() OWNER TO postgres;

--
-- TOC entry 492 (class 1255 OID 32621)
-- Name: is_restaurant_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_restaurant_member(rest_id uuid, user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_users
    WHERE restaurant_id = rest_id AND profile_id = user_id AND active = true
  ) OR public.is_super_admin(user_id);
END;
$$;


ALTER FUNCTION public.is_restaurant_member(rest_id uuid, user_id uuid) OWNER TO postgres;

--
-- TOC entry 529 (class 1255 OID 32620)
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$;


ALTER FUNCTION public.is_super_admin(user_id uuid) OWNER TO postgres;

--
-- TOC entry 495 (class 1255 OID 82823)
-- Name: maintain_revenue_aggregation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.maintain_revenue_aggregation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    order_date DATE;
BEGIN
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If order became paid
        IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
            order_date := DATE(NEW.created_at);
            
            INSERT INTO public.revenue (restaurant_id, revenue_date, total_orders, total_revenue, total_tax, total_discount)
            VALUES (NEW.restaurant_id, order_date, 1, NEW.total, NEW.taxes, NEW.discount)
            ON CONFLICT (restaurant_id, revenue_date)
            DO UPDATE SET 
                total_orders = public.revenue.total_orders + 1,
                total_revenue = public.revenue.total_revenue + NEW.total,
                total_tax = public.revenue.total_tax + NEW.taxes,
                total_discount = public.revenue.total_discount + NEW.discount;
                
        -- If order was paid and became unpaid/failed/refunded
        ELSIF OLD.payment_status = 'paid' AND NEW.payment_status != 'paid' THEN
            order_date := DATE(OLD.created_at);
            
            UPDATE public.revenue
            SET total_orders = GREATEST(0, total_orders - 1),
                total_revenue = GREATEST(0::numeric, total_revenue - OLD.total),
                total_tax = GREATEST(0::numeric, total_tax - OLD.taxes),
                total_discount = GREATEST(0::numeric, total_discount - OLD.discount)
            WHERE restaurant_id = OLD.restaurant_id AND revenue_date = order_date;
        END IF;

    -- Handle INSERT
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.payment_status = 'paid' THEN
            order_date := DATE(NEW.created_at);
            
            INSERT INTO public.revenue (restaurant_id, revenue_date, total_orders, total_revenue, total_tax, total_discount)
            VALUES (NEW.restaurant_id, order_date, 1, NEW.total, NEW.taxes, NEW.discount)
            ON CONFLICT (restaurant_id, revenue_date)
            DO UPDATE SET 
                total_orders = public.revenue.total_orders + 1,
                total_revenue = public.revenue.total_revenue + NEW.total,
                total_tax = public.revenue.total_tax + NEW.taxes,
                total_discount = public.revenue.total_discount + NEW.discount;
        END IF;
        
    -- Handle DELETE (if paid order is deleted)
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.payment_status = 'paid' THEN
            order_date := DATE(OLD.created_at);
            
            UPDATE public.revenue
            SET total_orders = GREATEST(0, total_orders - 1),
                total_revenue = GREATEST(0::numeric, total_revenue - OLD.total),
                total_tax = GREATEST(0::numeric, total_tax - OLD.taxes),
                total_discount = GREATEST(0::numeric, total_discount - OLD.discount)
            WHERE restaurant_id = OLD.restaurant_id AND revenue_date = order_date;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.maintain_revenue_aggregation() OWNER TO postgres;

--
-- TOC entry 515 (class 1255 OID 91150)
-- Name: propagate_order_status_to_items(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.propagate_order_status_to_items() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Prevent recursive trigger loops by checking trigger depth
    IF pg_trigger_depth() <= 1 THEN
        -- If parent order status changes, update all its items to match the status
        IF NEW.status = 'preparing' THEN
            UPDATE public.order_items
            SET status = 'preparing'
            WHERE order_id = NEW.id AND status = 'placed';
        ELSIF NEW.status = 'ready' THEN
            UPDATE public.order_items
            SET status = 'ready'
            WHERE order_id = NEW.id AND status != 'ready';
        ELSIF NEW.status = 'pending' OR NEW.status = 'confirmed' THEN
            UPDATE public.order_items
            SET status = 'placed'
            WHERE order_id = NEW.id AND status != 'placed';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.propagate_order_status_to_items() OWNER TO postgres;

--
-- TOC entry 505 (class 1255 OID 32341)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- TOC entry 466 (class 1255 OID 92109)
-- Name: suspend_expired_subscriptions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.suspend_expired_subscriptions() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.restaurants
    SET
        status              = 'suspended',
        subscription_status = 'SUSPENDED'
    WHERE
        status                  = 'active'
        AND grace_period_ends_at IS NOT NULL
        AND grace_period_ends_at  < NOW();
END;
$$;


ALTER FUNCTION public.suspend_expired_subscriptions() OWNER TO postgres;

--
-- TOC entry 461 (class 1255 OID 82874)
-- Name: update_menu_item_sales_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_menu_item_sales_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Handle UPDATE: order became paid
    IF TG_OP = 'UPDATE' THEN
        IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
            -- Increment sales_count for all items in this order
            FOR item_record IN 
                SELECT menu_item_id, quantity 
                FROM public.order_items 
                WHERE order_id = NEW.id AND menu_item_id IS NOT NULL
            LOOP
                UPDATE public.menu_items
                SET sales_count = sales_count + item_record.quantity
                WHERE id = item_record.menu_item_id;
            END LOOP;
            
        -- Handle refund/failed payment: decrement sales_count
        ELSIF OLD.payment_status = 'paid' AND NEW.payment_status != 'paid' THEN
            FOR item_record IN 
                SELECT menu_item_id, quantity 
                FROM public.order_items 
                WHERE order_id = OLD.id AND menu_item_id IS NOT NULL
            LOOP
                UPDATE public.menu_items
                SET sales_count = GREATEST(0, sales_count - item_record.quantity)
                WHERE id = item_record.menu_item_id;
            END LOOP;
        END IF;

    -- Handle INSERT: new order already paid
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.payment_status = 'paid' THEN
            FOR item_record IN 
                SELECT menu_item_id, quantity 
                FROM public.order_items 
                WHERE order_id = NEW.id AND menu_item_id IS NOT NULL
            LOOP
                UPDATE public.menu_items
                SET sales_count = sales_count + item_record.quantity
                WHERE id = item_record.menu_item_id;
            END LOOP;
        END IF;
        
    -- Handle DELETE: paid order is deleted
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.payment_status = 'paid' THEN
            FOR item_record IN 
                SELECT menu_item_id, quantity 
                FROM public.order_items 
                WHERE order_id = OLD.id AND menu_item_id IS NOT NULL
            LOOP
                UPDATE public.menu_items
                SET sales_count = GREATEST(0, sales_count - item_record.quantity)
                WHERE id = item_record.menu_item_id;
            END LOOP;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_menu_item_sales_count() OWNER TO postgres;

--
-- TOC entry 549 (class 1255 OID 91132)
-- Name: update_parent_order_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_parent_order_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_items INT;
    ready_items INT;
BEGIN
    -- Count total items in the order
    SELECT COUNT(*) INTO total_items 
    FROM public.order_items 
    WHERE order_id = NEW.order_id;

    -- Count items that are ready
    SELECT COUNT(*) INTO ready_items 
    FROM public.order_items 
    WHERE order_id = NEW.order_id AND status = 'ready';

    -- If all items are ready, update the main order status to 'ready'
    IF total_items = ready_items THEN
        UPDATE public.orders 
        SET status = 'ready'::order_status 
        WHERE id = NEW.order_id;
    -- If at least one item is preparing, update main order status to 'preparing'
    ELSEIF EXISTS (
        SELECT 1 FROM public.order_items 
        WHERE order_id = NEW.order_id AND status = 'preparing'
    ) THEN
        UPDATE public.orders 
        SET status = 'preparing'::order_status 
        WHERE id = NEW.order_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_parent_order_status() OWNER TO postgres;

--
-- TOC entry 553 (class 1255 OID 91793)
-- Name: upsert_restaurant_payment_settings(uuid, text, text, text, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean) RETURNS public.restaurant_payment_settings
    LANGUAGE plpgsql SECURITY DEFINER
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
        has_razorpay_webhook_secret
    )
    VALUES (
        p_restaurant_id, 
        'razorpay', 
        p_razorpay_key_id, 
        p_online_payments_enabled, 
        v_key_secret_id, 
        v_webhook_secret_id,
        v_key_secret_id IS NOT NULL,
        v_webhook_secret_id IS NOT NULL
    )
    ON CONFLICT (restaurant_id) DO UPDATE SET
        razorpay_key_id = EXCLUDED.razorpay_key_id,
        online_payments_enabled = EXCLUDED.online_payments_enabled,
        razorpay_key_secret_id = COALESCE(EXCLUDED.razorpay_key_secret_id, public.restaurant_payment_settings.razorpay_key_secret_id),
        razorpay_webhook_secret_id = COALESCE(EXCLUDED.razorpay_webhook_secret_id, public.restaurant_payment_settings.razorpay_webhook_secret_id),
        has_razorpay_key_secret = COALESCE(EXCLUDED.razorpay_key_secret_id, public.restaurant_payment_settings.razorpay_key_secret_id) IS NOT NULL,
        has_razorpay_webhook_secret = COALESCE(EXCLUDED.razorpay_webhook_secret_id, public.restaurant_payment_settings.razorpay_webhook_secret_id) IS NOT NULL,
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean) OWNER TO postgres;

--
-- TOC entry 526 (class 1255 OID 92834)
-- Name: upsert_restaurant_payment_settings(uuid, text, text, text, boolean, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean, p_razorpay_linked_account_id text DEFAULT NULL::text) RETURNS public.restaurant_payment_settings
    LANGUAGE plpgsql SECURITY DEFINER
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
            DELETE FROM vault.secrets WHERE id = v_key_secret_id;
        END IF;
        v_key_secret_id := vault.create_secret(p_razorpay_key_secret, 'razorpay_key_secret for ' || p_restaurant_id);
    END IF;

    IF p_razorpay_webhook_secret IS NOT NULL THEN
        IF v_webhook_secret_id IS NOT NULL THEN
            DELETE FROM vault.secrets WHERE id = v_webhook_secret_id;
        END IF;
        v_webhook_secret_id := vault.create_secret(p_razorpay_webhook_secret, 'razorpay_webhook_secret for ' || p_restaurant_id);
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


ALTER FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean, p_razorpay_linked_account_id text) OWNER TO postgres;

--
-- TOC entry 403 (class 1259 OID 32562)
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- TOC entry 404 (class 1259 OID 32581)
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    order_id uuid,
    user_id uuid,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

ALTER TABLE ONLY public.feedback REPLICA IDENTITY FULL;


ALTER TABLE public.feedback OWNER TO postgres;

--
-- TOC entry 421 (class 1259 OID 92808)
-- Name: home_banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    image_url text NOT NULL,
    link_url text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.home_banners OWNER TO postgres;

--
-- TOC entry 413 (class 1259 OID 91410)
-- Name: landing_leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.landing_leads (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_name text,
    owner_name text NOT NULL,
    country text,
    state text,
    district text,
    phone_number text NOT NULL,
    email text,
    status text DEFAULT 'new'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT landing_leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'converted'::text, 'rejected'::text])))
);


ALTER TABLE public.landing_leads OWNER TO postgres;

--
-- TOC entry 397 (class 1259 OID 32417)
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    image_url text,
    sort_order integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.menu_categories REPLICA IDENTITY FULL;


ALTER TABLE public.menu_categories OWNER TO postgres;

--
-- TOC entry 407 (class 1259 OID 50721)
-- Name: menu_item_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_item_images (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    menu_item_id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.menu_item_images REPLICA IDENTITY FULL;


ALTER TABLE public.menu_item_images OWNER TO postgres;

--
-- TOC entry 398 (class 1259 OID 32434)
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    short_description text,
    long_description text,
    price numeric DEFAULT 0 NOT NULL,
    discount_price numeric,
    is_available boolean DEFAULT true,
    is_veg boolean DEFAULT true,
    preparation_time integer,
    tags text[],
    variants jsonb DEFAULT '[]'::jsonb,
    addons jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    serves integer DEFAULT 1,
    model_url text,
    sales_count integer DEFAULT 0,
    CONSTRAINT menu_items_sales_count_check CHECK ((sales_count >= 0)),
    CONSTRAINT menu_items_serves_check CHECK ((serves > 0))
);

ALTER TABLE ONLY public.menu_items REPLICA IDENTITY FULL;


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- TOC entry 412 (class 1259 OID 83008)
-- Name: offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    title text NOT NULL,
    discount_price numeric NOT NULL,
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT offers_discount_price_check CHECK ((discount_price >= (0)::numeric))
);

ALTER TABLE ONLY public.offers REPLICA IDENTITY FULL;


ALTER TABLE public.offers OWNER TO postgres;

--
-- TOC entry 400 (class 1259 OID 32494)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    menu_item_id uuid,
    name text NOT NULL,
    price numeric DEFAULT 0 NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total numeric DEFAULT 0 NOT NULL,
    variant jsonb,
    addons jsonb,
    special_instructions text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'placed'::text NOT NULL,
    prepared_by uuid,
    CONSTRAINT order_items_status_check CHECK ((status = ANY (ARRAY['placed'::text, 'preparing'::text, 'ready'::text])))
);

ALTER TABLE ONLY public.order_items REPLICA IDENTITY FULL;


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 399 (class 1259 OID 32459)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    customer_id uuid,
    table_id uuid,
    order_number text NOT NULL,
    type public.order_type DEFAULT 'dine_in'::public.order_type,
    status public.order_status DEFAULT 'pending'::public.order_status,
    payment_method public.cash_card DEFAULT 'cash'::public.cash_card,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    subtotal numeric DEFAULT 0 NOT NULL,
    taxes numeric DEFAULT 0 NOT NULL,
    discount numeric DEFAULT 0 NOT NULL,
    total numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.orders REPLICA IDENTITY FULL;


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 402 (class 1259 OID 32543)
-- Name: payment_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    payment_id uuid,
    order_id uuid,
    event_type text NOT NULL,
    event_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_logs OWNER TO postgres;

--
-- TOC entry 401 (class 1259 OID 32516)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    order_id uuid,
    restaurant_id uuid NOT NULL,
    user_id uuid,
    amount numeric NOT NULL,
    currency text DEFAULT 'INR'::text,
    method public.payment_method,
    gateway text,
    razorpay_order_id text,
    razorpay_payment_id text,
    razorpay_signature text,
    webhook_verified boolean DEFAULT false,
    status public.payment_status DEFAULT 'pending'::public.payment_status,
    failure_reason text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 405 (class 1259 OID 32601)
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_settings (
    id text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.platform_settings OWNER TO postgres;

--
-- TOC entry 393 (class 1259 OID 32342)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role public.user_role DEFAULT 'customer'::public.user_role,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 419 (class 1259 OID 92417)
-- Name: restaurant_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.restaurant_notifications OWNER TO postgres;

--
-- TOC entry 396 (class 1259 OID 32398)
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_tables (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    table_number integer NOT NULL,
    qr_code_url text,
    capacity integer DEFAULT 4,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.restaurant_tables OWNER TO postgres;

--
-- TOC entry 395 (class 1259 OID 32374)
-- Name: restaurant_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role text DEFAULT 'staff'::text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.restaurant_users OWNER TO postgres;

--
-- TOC entry 394 (class 1259 OID 32359)
-- Name: restaurants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurants (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    status public.restaurant_status DEFAULT 'pending'::public.restaurant_status,
    contact_email text NOT NULL,
    contact_phone text,
    contact_address text,
    logo_url text,
    primary_color text,
    secondary_color text,
    settings jsonb DEFAULT '{}'::jsonb,
    subscription_status text DEFAULT 'INACTIVE',
    subscription_type text,
    latitude numeric,
    longitude numeric,
    allowed_radius integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    opening_date date,
    tagline text,
    manifesto text,
    operating_hours_weekdays text,
    operating_hours_weekends text,
    instagram_url text,
    facebook_url text,
    website_url text,
    subscription_end_at timestamp with time zone,
    pay_online boolean DEFAULT true,
    profile_urls text[] DEFAULT ARRAY[]::text[],
    grace_period_ends_at timestamp with time zone,
    kitchen_app_enabled boolean DEFAULT true,
    slug text NOT NULL
);


ALTER TABLE public.restaurants OWNER TO postgres;

--
-- TOC entry 411 (class 1259 OID 82786)
-- Name: revenue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revenue (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    revenue_date date NOT NULL,
    total_orders integer DEFAULT 0,
    total_revenue numeric DEFAULT 0 NOT NULL,
    total_tax numeric DEFAULT 0,
    total_discount numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.revenue REPLICA IDENTITY FULL;


ALTER TABLE public.revenue OWNER TO postgres;

--
-- TOC entry 410 (class 1259 OID 82762)
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    user_id uuid,
    plan_duration integer NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'INR'::text,
    razorpay_order_id text,
    razorpay_payment_id text,
    razorpay_signature text,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    plan_name text,
    CONSTRAINT subscription_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])))
);


ALTER TABLE public.subscription_payments OWNER TO postgres;

--
-- TOC entry 3925 (class 2606 OID 32568)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- TOC entry 3927 (class 2606 OID 32570)
-- Name: favorites favorites_user_id_menu_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_menu_item_id_key UNIQUE (user_id, menu_item_id);


--
-- TOC entry 3929 (class 2606 OID 32590)
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 3953 (class 2606 OID 92818)
-- Name: home_banners home_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_banners
    ADD CONSTRAINT home_banners_pkey PRIMARY KEY (id);


--
-- TOC entry 3947 (class 2606 OID 91420)
-- Name: landing_leads landing_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landing_leads
    ADD CONSTRAINT landing_leads_pkey PRIMARY KEY (id);


--
-- TOC entry 3910 (class 2606 OID 32428)
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3934 (class 2606 OID 50730)
-- Name: menu_item_images menu_item_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_item_images
    ADD CONSTRAINT menu_item_images_pkey PRIMARY KEY (id);


--
-- TOC entry 3913 (class 2606 OID 32448)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3945 (class 2606 OID 83019)
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- TOC entry 3919 (class 2606 OID 32505)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3915 (class 2606 OID 32476)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3917 (class 2606 OID 32478)
-- Name: orders orders_restaurant_id_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_order_number_key UNIQUE (restaurant_id, order_number);


--
-- TOC entry 3923 (class 2606 OID 32551)
-- Name: payment_logs payment_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_logs
    ADD CONSTRAINT payment_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 32527)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3931 (class 2606 OID 32609)
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3893 (class 2606 OID 32353)
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- TOC entry 3895 (class 2606 OID 32351)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3951 (class 2606 OID 92425)
-- Name: restaurant_notifications restaurant_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_notifications
    ADD CONSTRAINT restaurant_notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3949 (class 2606 OID 91784)
-- Name: restaurant_payment_settings restaurant_payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_payment_settings
    ADD CONSTRAINT restaurant_payment_settings_pkey PRIMARY KEY (restaurant_id);


--
-- TOC entry 3906 (class 2606 OID 32409)
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- TOC entry 3908 (class 2606 OID 32411)
-- Name: restaurant_tables restaurant_tables_restaurant_id_table_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_restaurant_id_table_number_key UNIQUE (restaurant_id, table_number);


--
-- TOC entry 3902 (class 2606 OID 32385)
-- Name: restaurant_users restaurant_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_users
    ADD CONSTRAINT restaurant_users_pkey PRIMARY KEY (id);


--
-- TOC entry 3904 (class 2606 OID 32387)
-- Name: restaurant_users restaurant_users_restaurant_id_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_users
    ADD CONSTRAINT restaurant_users_restaurant_id_profile_id_key UNIQUE (restaurant_id, profile_id);


--
-- TOC entry 3898 (class 2606 OID 32371)
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- TOC entry 3900 (class 2606 OID 92896)
-- Name: restaurants restaurants_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_slug_key UNIQUE (slug);


--
-- TOC entry 3939 (class 2606 OID 82799)
-- Name: revenue revenue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_pkey PRIMARY KEY (id);


--
-- TOC entry 3941 (class 2606 OID 82801)
-- Name: revenue revenue_restaurant_id_revenue_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_restaurant_id_revenue_date_key UNIQUE (restaurant_id, revenue_date);


--
-- TOC entry 3936 (class 2606 OID 82773)
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3932 (class 1259 OID 50741)
-- Name: idx_menu_item_images_menu_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_item_images_menu_item ON public.menu_item_images USING btree (menu_item_id);


--
-- TOC entry 3911 (class 1259 OID 82873)
-- Name: idx_menu_items_sales_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menu_items_sales_count ON public.menu_items USING btree (restaurant_id, sales_count DESC);


--
-- TOC entry 3942 (class 1259 OID 83031)
-- Name: idx_offers_menu_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_menu_item_id ON public.offers USING btree (menu_item_id);


--
-- TOC entry 3943 (class 1259 OID 83030)
-- Name: idx_offers_restaurant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_restaurant_id ON public.offers USING btree (restaurant_id);


--
-- TOC entry 3896 (class 1259 OID 92108)
-- Name: idx_restaurants_grace_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurants_grace_period ON public.restaurants USING btree (grace_period_ends_at) WHERE ((status = 'active'::public.restaurant_status) AND (grace_period_ends_at IS NOT NULL));


--
-- TOC entry 3937 (class 1259 OID 91711)
-- Name: idx_revenue_restaurant_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_revenue_restaurant_date ON public.revenue USING btree (restaurant_id, revenue_date);


--
-- TOC entry 3992 (class 2620 OID 91722)
-- Name: orders trigger_maintain_revenue; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_maintain_revenue AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.maintain_revenue_aggregation();


--
-- TOC entry 3993 (class 2620 OID 91771)
-- Name: orders trigger_propagate_order_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_propagate_order_status AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.propagate_order_status_to_items();


--
-- TOC entry 3996 (class 2620 OID 91770)
-- Name: order_items trigger_update_parent_order; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_parent_order AFTER UPDATE OF status ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_parent_order_status();


--
-- TOC entry 3994 (class 2620 OID 91723)
-- Name: orders trigger_update_sales_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_sales_count AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_menu_item_sales_count();


--
-- TOC entry 3990 (class 2620 OID 91716)
-- Name: menu_categories update_menu_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3991 (class 2620 OID 91717)
-- Name: menu_items update_menu_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3999 (class 2620 OID 91721)
-- Name: offers update_offers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3995 (class 2620 OID 91718)
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3997 (class 2620 OID 91720)
-- Name: platform_settings update_platform_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3986 (class 2620 OID 91712)
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4000 (class 2620 OID 91792)
-- Name: restaurant_payment_settings update_restaurant_payment_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_restaurant_payment_settings_updated_at BEFORE UPDATE ON public.restaurant_payment_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3989 (class 2620 OID 91715)
-- Name: restaurant_tables update_restaurant_tables_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3988 (class 2620 OID 91714)
-- Name: restaurant_users update_restaurant_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_restaurant_users_updated_at BEFORE UPDATE ON public.restaurant_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3987 (class 2620 OID 91713)
-- Name: restaurants update_restaurants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3998 (class 2620 OID 91719)
-- Name: revenue update_revenue_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_revenue_updated_at BEFORE UPDATE ON public.revenue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3972 (class 2606 OID 32576)
-- Name: favorites favorites_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- TOC entry 3973 (class 2606 OID 32571)
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3974 (class 2606 OID 32591)
-- Name: feedback feedback_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 3975 (class 2606 OID 32596)
-- Name: feedback feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 3985 (class 2606 OID 92819)
-- Name: home_banners home_banners_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_banners
    ADD CONSTRAINT home_banners_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3958 (class 2606 OID 32429)
-- Name: menu_categories menu_categories_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3976 (class 2606 OID 50731)
-- Name: menu_item_images menu_item_images_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_item_images
    ADD CONSTRAINT menu_item_images_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- TOC entry 3977 (class 2606 OID 50736)
-- Name: menu_item_images menu_item_images_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_item_images
    ADD CONSTRAINT menu_item_images_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3959 (class 2606 OID 32454)
-- Name: menu_items menu_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id) ON DELETE CASCADE;


--
-- TOC entry 3960 (class 2606 OID 32449)
-- Name: menu_items menu_items_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3981 (class 2606 OID 83025)
-- Name: offers offers_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- TOC entry 3982 (class 2606 OID 83020)
-- Name: offers offers_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3964 (class 2606 OID 32511)
-- Name: order_items order_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;


--
-- TOC entry 3965 (class 2606 OID 32506)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3966 (class 2606 OID 92168)
-- Name: order_items order_items_prepared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 3961 (class 2606 OID 32484)
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 3962 (class 2606 OID 32479)
-- Name: orders orders_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3963 (class 2606 OID 32489)
-- Name: orders orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;


--
-- TOC entry 3970 (class 2606 OID 32557)
-- Name: payment_logs payment_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_logs
    ADD CONSTRAINT payment_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3971 (class 2606 OID 32552)
-- Name: payment_logs payment_logs_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_logs
    ADD CONSTRAINT payment_logs_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- TOC entry 3967 (class 2606 OID 32528)
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3968 (class 2606 OID 32533)
-- Name: payments payments_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3969 (class 2606 OID 32538)
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 3954 (class 2606 OID 32354)
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 3984 (class 2606 OID 92426)
-- Name: restaurant_notifications restaurant_notifications_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_notifications
    ADD CONSTRAINT restaurant_notifications_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3983 (class 2606 OID 91785)
-- Name: restaurant_payment_settings restaurant_payment_settings_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_payment_settings
    ADD CONSTRAINT restaurant_payment_settings_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3957 (class 2606 OID 32412)
-- Name: restaurant_tables restaurant_tables_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3955 (class 2606 OID 32393)
-- Name: restaurant_users restaurant_users_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_users
    ADD CONSTRAINT restaurant_users_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3956 (class 2606 OID 32388)
-- Name: restaurant_users restaurant_users_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_users
    ADD CONSTRAINT restaurant_users_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3980 (class 2606 OID 82802)
-- Name: revenue revenue_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3978 (class 2606 OID 82774)
-- Name: subscription_payments subscription_payments_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- TOC entry 3979 (class 2606 OID 82779)
-- Name: subscription_payments subscription_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 4172 (class 3256 OID 92431)
-- Name: restaurant_notifications Allow all operations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations" ON public.restaurant_notifications USING (true);


--
-- TOC entry 4175 (class 3256 OID 42819)
-- Name: profiles Allow new user profile creation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow new user profile creation" ON public.profiles FOR INSERT WITH CHECK (true);


--
-- TOC entry 4189 (class 3256 OID 91728)
-- Name: profiles Allow profile creation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow profile creation" ON public.profiles FOR INSERT WITH CHECK (true);


--
-- TOC entry 4176 (class 3256 OID 42840)
-- Name: profiles Allow profile creation on signup; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow profile creation on signup" ON public.profiles FOR INSERT WITH CHECK (true);


--
-- TOC entry 4170 (class 3256 OID 92003)
-- Name: restaurants Anyone can read active restaurants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read active restaurants" ON public.restaurants FOR SELECT USING ((status = 'active'::public.restaurant_status));


--
-- TOC entry 4173 (class 3256 OID 92824)
-- Name: home_banners Banners are publicly visible; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Banners are publicly visible" ON public.home_banners FOR SELECT USING (true);


--
-- TOC entry 4207 (class 3256 OID 91747)
-- Name: orders Customers can create orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (((customer_id = auth.uid()) OR (customer_id IS NULL)));


--
-- TOC entry 4213 (class 3256 OID 91753)
-- Name: payments Customers can create payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Customers can create payments" ON public.payments FOR INSERT WITH CHECK (((user_id = auth.uid()) OR (user_id IS NULL)));


--
-- TOC entry 4210 (class 3256 OID 91750)
-- Name: order_items Customers can insert their order items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Customers can insert their order items" ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND ((o.customer_id = auth.uid()) OR (o.customer_id IS NULL))))));


--
-- TOC entry 4209 (class 3256 OID 91749)
-- Name: order_items Customers can read own order items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Customers can read own order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.customer_id = auth.uid())))));


--
-- TOC entry 4205 (class 3256 OID 91745)
-- Name: orders Customers can read own orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Customers can read own orders" ON public.orders FOR SELECT USING ((customer_id = auth.uid()));


--
-- TOC entry 4212 (class 3256 OID 91752)
-- Name: payments Customers can read their payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Customers can read their payments" ON public.payments FOR SELECT USING ((user_id = auth.uid()));


--
-- TOC entry 4221 (class 3256 OID 91421)
-- Name: landing_leads Public can insert leads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can insert leads" ON public.landing_leads FOR INSERT WITH CHECK (true);


--
-- TOC entry 4199 (class 3256 OID 91739)
-- Name: menu_categories Public can read active categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active categories" ON public.menu_categories FOR SELECT USING ((active = true));


--
-- TOC entry 4184 (class 3256 OID 91765)
-- Name: offers Public can read active offers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read active offers" ON public.offers FOR SELECT USING (true);


--
-- TOC entry 4203 (class 3256 OID 91743)
-- Name: menu_item_images Public can read menu item images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read menu item images" ON public.menu_item_images FOR SELECT USING (true);


--
-- TOC entry 4201 (class 3256 OID 91741)
-- Name: menu_items Public can read menu items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read menu items" ON public.menu_items FOR SELECT USING (true);


--
-- TOC entry 4206 (class 3256 OID 91746)
-- Name: orders Public can read orders for live queue; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read orders for live queue" ON public.orders FOR SELECT USING (true);


--
-- TOC entry 4180 (class 3256 OID 91761)
-- Name: platform_settings Public can read platform settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read platform settings" ON public.platform_settings FOR SELECT USING (true);


--
-- TOC entry 4197 (class 3256 OID 91737)
-- Name: restaurant_tables Public can read tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read tables" ON public.restaurant_tables FOR SELECT USING ((active = true));


--
-- TOC entry 4191 (class 3256 OID 91731)
-- Name: restaurants Restaurant admins can read full restaurant row; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant admins can read full restaurant row" ON public.restaurants FOR SELECT USING (public.is_restaurant_member(id));


--
-- TOC entry 4193 (class 3256 OID 91733)
-- Name: restaurants Restaurant admins can update their restaurant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant admins can update their restaurant" ON public.restaurants FOR UPDATE USING (public.is_restaurant_member(id));


--
-- TOC entry 4195 (class 3256 OID 91735)
-- Name: restaurant_users Restaurant admins manage their staff; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant admins manage their staff" ON public.restaurant_users USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4211 (class 3256 OID 91751)
-- Name: order_items Restaurant members can manage order items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can manage order items" ON public.order_items USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND public.is_restaurant_member(o.restaurant_id)))));


--
-- TOC entry 4208 (class 3256 OID 91748)
-- Name: orders Restaurant members can manage restaurant orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can manage restaurant orders" ON public.orders USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4216 (class 3256 OID 91756)
-- Name: revenue Restaurant members can manage revenue; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can manage revenue" ON public.revenue USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4190 (class 3256 OID 91729)
-- Name: profiles Restaurant members can read customer profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can read customer profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.customer_id = profiles.id) AND public.is_restaurant_member(o.restaurant_id)))));


--
-- TOC entry 4179 (class 3256 OID 91760)
-- Name: feedback Restaurant members can read feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can read feedback" ON public.feedback FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = feedback.order_id) AND public.is_restaurant_member(o.restaurant_id)))));


--
-- TOC entry 4215 (class 3256 OID 91755)
-- Name: payment_logs Restaurant members can read payment logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can read payment logs" ON public.payment_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.payments p
  WHERE ((p.id = payment_logs.payment_id) AND public.is_restaurant_member(p.restaurant_id)))));


--
-- TOC entry 4182 (class 3256 OID 91763)
-- Name: subscription_payments Restaurant members can read subscription payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can read subscription payments" ON public.subscription_payments FOR SELECT USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4214 (class 3256 OID 91754)
-- Name: payments Restaurant members can read their payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members can read their payments" ON public.payments FOR SELECT USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4220 (class 3256 OID 91790)
-- Name: restaurant_payment_settings Restaurant members manage payment settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members manage payment settings" ON public.restaurant_payment_settings USING (public.is_restaurant_member(restaurant_id)) WITH CHECK (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4200 (class 3256 OID 91740)
-- Name: menu_categories Restaurant members manage their categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members manage their categories" ON public.menu_categories USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4202 (class 3256 OID 91742)
-- Name: menu_items Restaurant members manage their items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members manage their items" ON public.menu_items USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4204 (class 3256 OID 91744)
-- Name: menu_item_images Restaurant members manage their menu item images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members manage their menu item images" ON public.menu_item_images USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4185 (class 3256 OID 91766)
-- Name: offers Restaurant members manage their offers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members manage their offers" ON public.offers USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4198 (class 3256 OID 91738)
-- Name: restaurant_tables Restaurant members manage their tables; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant members manage their tables" ON public.restaurant_tables USING (public.is_restaurant_member(restaurant_id));


--
-- TOC entry 4174 (class 3256 OID 92825)
-- Name: home_banners Restaurant staff can manage banners; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Restaurant staff can manage banners" ON public.home_banners USING ((restaurant_id IN ( SELECT restaurant_users.restaurant_id
   FROM public.restaurant_users
  WHERE ((restaurant_users.profile_id = auth.uid()) AND (restaurant_users.active = true)))));


--
-- TOC entry 4187 (class 3256 OID 91726)
-- Name: profiles Super admins can manage all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins can manage all profiles" ON public.profiles USING (public.is_super_admin(auth.uid()));


--
-- TOC entry 4192 (class 3256 OID 91732)
-- Name: restaurants Super admins can manage all restaurants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants USING (public.is_super_admin());


--
-- TOC entry 4217 (class 3256 OID 91757)
-- Name: revenue Super admins can manage all revenue; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins can manage all revenue" ON public.revenue USING (public.is_super_admin());


--
-- TOC entry 4178 (class 3256 OID 93044)
-- Name: landing_leads Super admins can manage leads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins can manage leads" ON public.landing_leads USING (public.is_super_admin(auth.uid()));


--
-- TOC entry 4194 (class 3256 OID 91734)
-- Name: restaurant_users Super admins manage all restaurant users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins manage all restaurant users" ON public.restaurant_users USING (public.is_super_admin());


--
-- TOC entry 4181 (class 3256 OID 91762)
-- Name: platform_settings Super admins manage platform settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins manage platform settings" ON public.platform_settings USING (public.is_super_admin());


--
-- TOC entry 4171 (class 3256 OID 91791)
-- Name: restaurant_payment_settings Super admins manage restaurant payment settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins manage restaurant payment settings" ON public.restaurant_payment_settings USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());


--
-- TOC entry 4183 (class 3256 OID 91764)
-- Name: subscription_payments Super admins manage subscription payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Super admins manage subscription payments" ON public.subscription_payments USING (public.is_super_admin());


--
-- TOC entry 4177 (class 3256 OID 42845)
-- Name: profiles Users can create their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- TOC entry 4218 (class 3256 OID 91758)
-- Name: favorites Users can manage own favorites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own favorites" ON public.favorites USING ((user_id = auth.uid()));


--
-- TOC entry 4186 (class 3256 OID 91725)
-- Name: profiles Users can read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- TOC entry 4219 (class 3256 OID 91759)
-- Name: feedback Users can read/write own feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read/write own feedback" ON public.feedback USING ((user_id = auth.uid()));


--
-- TOC entry 4188 (class 3256 OID 91727)
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- TOC entry 4196 (class 3256 OID 91736)
-- Name: restaurant_users Users can view their own assignment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own assignment" ON public.restaurant_users FOR SELECT USING ((profile_id = auth.uid()));


--
-- TOC entry 4159 (class 0 OID 32562)
-- Dependencies: 403
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4160 (class 0 OID 32581)
-- Dependencies: 404
-- Name: feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4169 (class 0 OID 92808)
-- Dependencies: 421
-- Name: home_banners; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4166 (class 0 OID 91410)
-- Dependencies: 413
-- Name: landing_leads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4153 (class 0 OID 32417)
-- Dependencies: 397
-- Name: menu_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4162 (class 0 OID 50721)
-- Dependencies: 407
-- Name: menu_item_images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.menu_item_images ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4154 (class 0 OID 32434)
-- Dependencies: 398
-- Name: menu_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4165 (class 0 OID 83008)
-- Dependencies: 412
-- Name: offers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4156 (class 0 OID 32494)
-- Dependencies: 400
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4155 (class 0 OID 32459)
-- Dependencies: 399
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4158 (class 0 OID 32543)
-- Dependencies: 402
-- Name: payment_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4157 (class 0 OID 32516)
-- Dependencies: 401
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4161 (class 0 OID 32601)
-- Dependencies: 405
-- Name: platform_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4149 (class 0 OID 32342)
-- Dependencies: 393
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4168 (class 0 OID 92417)
-- Dependencies: 419
-- Name: restaurant_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.restaurant_notifications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4167 (class 0 OID 91772)
-- Dependencies: 414
-- Name: restaurant_payment_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.restaurant_payment_settings ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4152 (class 0 OID 32398)
-- Dependencies: 396
-- Name: restaurant_tables; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4151 (class 0 OID 32374)
-- Dependencies: 395
-- Name: restaurant_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4150 (class 0 OID 32359)
-- Dependencies: 394
-- Name: restaurants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4164 (class 0 OID 82786)
-- Dependencies: 411
-- Name: revenue; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4163 (class 0 OID 82762)
-- Dependencies: 410
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4238 (class 0 OID 0)
-- Dependencies: 138
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 4239 (class 0 OID 0)
-- Dependencies: 414
-- Name: TABLE restaurant_payment_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.restaurant_payment_settings TO anon;
GRANT ALL ON TABLE public.restaurant_payment_settings TO authenticated;
GRANT ALL ON TABLE public.restaurant_payment_settings TO service_role;


--
-- TOC entry 4240 (class 0 OID 0)
-- Dependencies: 455
-- Name: FUNCTION get_restaurant_payment_settings(p_restaurant_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_restaurant_payment_settings(p_restaurant_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_restaurant_payment_settings(p_restaurant_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_restaurant_payment_settings(p_restaurant_id uuid) TO service_role;


--
-- TOC entry 4241 (class 0 OID 0)
-- Dependencies: 442
-- Name: FUNCTION get_restaurant_razorpay_secret(p_restaurant_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_restaurant_razorpay_secret(p_restaurant_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_restaurant_razorpay_secret(p_restaurant_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_restaurant_razorpay_secret(p_restaurant_id uuid) TO service_role;


--
-- TOC entry 4242 (class 0 OID 0)
-- Dependencies: 488
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- TOC entry 4243 (class 0 OID 0)
-- Dependencies: 457
-- Name: FUNCTION handle_user_update(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_user_update() TO anon;
GRANT ALL ON FUNCTION public.handle_user_update() TO authenticated;
GRANT ALL ON FUNCTION public.handle_user_update() TO service_role;


--
-- TOC entry 4244 (class 0 OID 0)
-- Dependencies: 492
-- Name: FUNCTION is_restaurant_member(rest_id uuid, user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_restaurant_member(rest_id uuid, user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_restaurant_member(rest_id uuid, user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_restaurant_member(rest_id uuid, user_id uuid) TO service_role;


--
-- TOC entry 4245 (class 0 OID 0)
-- Dependencies: 529
-- Name: FUNCTION is_super_admin(user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_super_admin(user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_super_admin(user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_super_admin(user_id uuid) TO service_role;


--
-- TOC entry 4246 (class 0 OID 0)
-- Dependencies: 495
-- Name: FUNCTION maintain_revenue_aggregation(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.maintain_revenue_aggregation() TO anon;
GRANT ALL ON FUNCTION public.maintain_revenue_aggregation() TO authenticated;
GRANT ALL ON FUNCTION public.maintain_revenue_aggregation() TO service_role;


--
-- TOC entry 4247 (class 0 OID 0)
-- Dependencies: 515
-- Name: FUNCTION propagate_order_status_to_items(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.propagate_order_status_to_items() TO anon;
GRANT ALL ON FUNCTION public.propagate_order_status_to_items() TO authenticated;
GRANT ALL ON FUNCTION public.propagate_order_status_to_items() TO service_role;


--
-- TOC entry 4248 (class 0 OID 0)
-- Dependencies: 505
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- TOC entry 4249 (class 0 OID 0)
-- Dependencies: 466
-- Name: FUNCTION suspend_expired_subscriptions(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.suspend_expired_subscriptions() TO anon;
GRANT ALL ON FUNCTION public.suspend_expired_subscriptions() TO authenticated;
GRANT ALL ON FUNCTION public.suspend_expired_subscriptions() TO service_role;


--
-- TOC entry 4250 (class 0 OID 0)
-- Dependencies: 461
-- Name: FUNCTION update_menu_item_sales_count(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_menu_item_sales_count() TO anon;
GRANT ALL ON FUNCTION public.update_menu_item_sales_count() TO authenticated;
GRANT ALL ON FUNCTION public.update_menu_item_sales_count() TO service_role;


--
-- TOC entry 4251 (class 0 OID 0)
-- Dependencies: 549
-- Name: FUNCTION update_parent_order_status(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_parent_order_status() TO anon;
GRANT ALL ON FUNCTION public.update_parent_order_status() TO authenticated;
GRANT ALL ON FUNCTION public.update_parent_order_status() TO service_role;


--
-- TOC entry 4252 (class 0 OID 0)
-- Dependencies: 553
-- Name: FUNCTION upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean) TO anon;
GRANT ALL ON FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean) TO service_role;


--
-- TOC entry 4253 (class 0 OID 0)
-- Dependencies: 526
-- Name: FUNCTION upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean, p_razorpay_linked_account_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean, p_razorpay_linked_account_id text) TO anon;
GRANT ALL ON FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean, p_razorpay_linked_account_id text) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_restaurant_payment_settings(p_restaurant_id uuid, p_razorpay_key_id text, p_razorpay_key_secret text, p_razorpay_webhook_secret text, p_online_payments_enabled boolean, p_razorpay_linked_account_id text) TO service_role;


--
-- TOC entry 4254 (class 0 OID 0)
-- Dependencies: 403
-- Name: TABLE favorites; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.favorites TO anon;
GRANT ALL ON TABLE public.favorites TO authenticated;
GRANT ALL ON TABLE public.favorites TO service_role;


--
-- TOC entry 4255 (class 0 OID 0)
-- Dependencies: 404
-- Name: TABLE feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feedback TO anon;
GRANT ALL ON TABLE public.feedback TO authenticated;
GRANT ALL ON TABLE public.feedback TO service_role;


--
-- TOC entry 4256 (class 0 OID 0)
-- Dependencies: 421
-- Name: TABLE home_banners; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.home_banners TO anon;
GRANT ALL ON TABLE public.home_banners TO authenticated;
GRANT ALL ON TABLE public.home_banners TO service_role;


--
-- TOC entry 4257 (class 0 OID 0)
-- Dependencies: 413
-- Name: TABLE landing_leads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.landing_leads TO anon;
GRANT ALL ON TABLE public.landing_leads TO authenticated;
GRANT ALL ON TABLE public.landing_leads TO service_role;


--
-- TOC entry 4258 (class 0 OID 0)
-- Dependencies: 397
-- Name: TABLE menu_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.menu_categories TO anon;
GRANT ALL ON TABLE public.menu_categories TO authenticated;
GRANT ALL ON TABLE public.menu_categories TO service_role;


--
-- TOC entry 4259 (class 0 OID 0)
-- Dependencies: 407
-- Name: TABLE menu_item_images; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.menu_item_images TO anon;
GRANT ALL ON TABLE public.menu_item_images TO authenticated;
GRANT ALL ON TABLE public.menu_item_images TO service_role;


--
-- TOC entry 4260 (class 0 OID 0)
-- Dependencies: 398
-- Name: TABLE menu_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.menu_items TO anon;
GRANT ALL ON TABLE public.menu_items TO authenticated;
GRANT ALL ON TABLE public.menu_items TO service_role;


--
-- TOC entry 4261 (class 0 OID 0)
-- Dependencies: 412
-- Name: TABLE offers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.offers TO anon;
GRANT ALL ON TABLE public.offers TO authenticated;
GRANT ALL ON TABLE public.offers TO service_role;


--
-- TOC entry 4262 (class 0 OID 0)
-- Dependencies: 400
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_items TO anon;
GRANT ALL ON TABLE public.order_items TO authenticated;
GRANT ALL ON TABLE public.order_items TO service_role;


--
-- TOC entry 4263 (class 0 OID 0)
-- Dependencies: 399
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--
-- TOC entry 4264 (class 0 OID 0)
-- Dependencies: 402
-- Name: TABLE payment_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_logs TO anon;
GRANT ALL ON TABLE public.payment_logs TO authenticated;
GRANT ALL ON TABLE public.payment_logs TO service_role;


--
-- TOC entry 4265 (class 0 OID 0)
-- Dependencies: 401
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- TOC entry 4266 (class 0 OID 0)
-- Dependencies: 405
-- Name: TABLE platform_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.platform_settings TO anon;
GRANT ALL ON TABLE public.platform_settings TO authenticated;
GRANT ALL ON TABLE public.platform_settings TO service_role;


--
-- TOC entry 4267 (class 0 OID 0)
-- Dependencies: 393
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- TOC entry 4268 (class 0 OID 0)
-- Dependencies: 419
-- Name: TABLE restaurant_notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.restaurant_notifications TO anon;
GRANT ALL ON TABLE public.restaurant_notifications TO authenticated;
GRANT ALL ON TABLE public.restaurant_notifications TO service_role;


--
-- TOC entry 4269 (class 0 OID 0)
-- Dependencies: 396
-- Name: TABLE restaurant_tables; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.restaurant_tables TO anon;
GRANT ALL ON TABLE public.restaurant_tables TO authenticated;
GRANT ALL ON TABLE public.restaurant_tables TO service_role;


--
-- TOC entry 4270 (class 0 OID 0)
-- Dependencies: 395
-- Name: TABLE restaurant_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.restaurant_users TO anon;
GRANT ALL ON TABLE public.restaurant_users TO authenticated;
GRANT ALL ON TABLE public.restaurant_users TO service_role;


--
-- TOC entry 4271 (class 0 OID 0)
-- Dependencies: 394
-- Name: TABLE restaurants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.restaurants TO anon;
GRANT ALL ON TABLE public.restaurants TO authenticated;
GRANT ALL ON TABLE public.restaurants TO service_role;


--
-- TOC entry 4272 (class 0 OID 0)
-- Dependencies: 411
-- Name: TABLE revenue; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.revenue TO anon;
GRANT ALL ON TABLE public.revenue TO authenticated;
GRANT ALL ON TABLE public.revenue TO service_role;


--
-- TOC entry 4273 (class 0 OID 0)
-- Dependencies: 410
-- Name: TABLE subscription_payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.subscription_payments TO anon;
GRANT ALL ON TABLE public.subscription_payments TO authenticated;
GRANT ALL ON TABLE public.subscription_payments TO service_role;


--
-- TOC entry 2586 (class 826 OID 16490)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2587 (class 826 OID 16491)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2585 (class 826 OID 16489)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2589 (class 826 OID 16493)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2584 (class 826 OID 16488)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2588 (class 826 OID 16492)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


-- Completed on 2026-08-13 11:40:10

--
-- PostgreSQL database dump complete
--

