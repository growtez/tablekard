-- ======================================================================================
-- DB Schema & RLS for TableKard
-- Features: Multi-tenant restaurant app with QR-based ordering
-- ======================================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set default database and session timezone to Indian Standard Time (IST)
ALTER DATABASE postgres SET timezone TO 'Asia/Kolkata';
SET timezone TO 'Asia/Kolkata';

-- 2. Define Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'restaurant_admin', 'restaurant_staff', 'customer');
    CREATE TYPE restaurant_status AS ENUM ('pending', 'approved', 'active', 'suspended', 'rejected');
    CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway', 'delivery');
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled');
    CREATE TYPE cash_card AS ENUM ('cash', 'card', 'online');
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'netbanking', 'wallet', 'online');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Utility Function to Auto-Update 'updated_at' column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================================
-- TABLES CREATION
-- ======================================================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'customer'::user_role,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status restaurant_status DEFAULT 'pending'::restaurant_status,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_address TEXT,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    profile_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_status BOOLEAN DEFAULT false,
    subscription_type TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    allowed_radius INTEGER,
    opening_date DATE,
    tagline TEXT,
    manifesto TEXT,
    operating_hours_weekdays TEXT,
    operating_hours_weekends TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- restaurant_users
CREATE TABLE IF NOT EXISTS public.restaurant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'staff',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, profile_id)
);

-- restaurant_tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    qr_code_url TEXT,
    capacity INTEGER DEFAULT 4,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- menu_categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- menu_items (image_url removed; images now live in menu_item_images)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_description TEXT,
    long_description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    discount_price NUMERIC,
    serves INTEGER DEFAULT 1 CHECK (serves > 0),
    is_available BOOLEAN DEFAULT true,
    is_veg BOOLEAN DEFAULT true,
    preparation_time INTEGER,
    tags TEXT[],
    variants JSONB DEFAULT '[]'::jsonb,
    addons JSONB DEFAULT '[]'::jsonb,
    model_url TEXT,
    sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- menu_item_images (replaces single image_url on menu_items)
CREATE TABLE IF NOT EXISTS public.menu_item_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    type order_type DEFAULT 'dine_in'::order_type,
    status order_status DEFAULT 'pending'::order_status,
    payment_method cash_card DEFAULT 'cash'::cash_card,
    payment_status payment_status DEFAULT 'pending'::payment_status,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    taxes NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, order_number)
);

-- order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    total NUMERIC NOT NULL DEFAULT 0,
    variant JSONB,
    addons JSONB,
    special_instructions TEXT,
    status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'preparing', 'ready')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    method payment_method,
    gateway TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    webhook_verified BOOLEAN DEFAULT false,
    status payment_status DEFAULT 'pending'::payment_status,
    failure_reason TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payment_logs
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- revenue (Analytics & Reporting)
CREATE TABLE IF NOT EXISTS public.revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    revenue_date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue NUMERIC NOT NULL DEFAULT 0,
    total_tax NUMERIC DEFAULT 0,
    total_discount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, revenue_date)
);

-- favorites
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, menu_item_id)
);

-- feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY,
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- subscription_payments (SaaS billing — separate from customer-order payments)
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    plan_duration INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    plan_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed')),
    paid_at TIMESTAMPTZ,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- offers
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    discount_price NUMERIC NOT NULL CHECK (discount_price >= 0),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill schema changes for existing databases
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS profile_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS pay_online BOOLEAN DEFAULT true;

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS subscription_end_at TIMESTAMPTZ;

-- Subscription system v2: grace period buffer before auto-suspension
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- Subscription system v2: snapshot plan name at time of payment
ALTER TABLE public.subscription_payments
    ADD COLUMN IF NOT EXISTS plan_name TEXT;

ALTER TABLE public.payments ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE public.menu_items
    ADD COLUMN IF NOT EXISTS serves INTEGER DEFAULT 1 CHECK (serves > 0);
ALTER TABLE public.menu_items
    ADD COLUMN IF NOT EXISTS model_url TEXT;
ALTER TABLE public.menu_items
    ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0);

-- ======================================================================================
-- INDEXES
-- ======================================================================================

CREATE INDEX IF NOT EXISTS idx_menu_item_images_menu_item
ON public.menu_item_images(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_revenue_restaurant_date
ON public.revenue(restaurant_id, revenue_date);

CREATE INDEX IF NOT EXISTS idx_menu_items_sales_count
ON public.menu_items(restaurant_id, sales_count DESC);

CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id ON public.offers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_offers_menu_item_id ON public.offers(menu_item_id);

-- ======================================================================================
-- TRIGGERS FOR TIMESTAMPS
-- ======================================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_restaurant_users_updated_at ON public.restaurant_users;
DROP TRIGGER IF EXISTS update_restaurant_users_updated_at ON public.restaurant_users;
CREATE TRIGGER update_restaurant_users_updated_at BEFORE UPDATE ON public.restaurant_users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_restaurant_tables_updated_at ON public.restaurant_tables;
DROP TRIGGER IF EXISTS update_restaurant_tables_updated_at ON public.restaurant_tables;
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_menu_categories_updated_at ON public.menu_categories;
DROP TRIGGER IF EXISTS update_menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_revenue_updated_at ON public.revenue;
DROP TRIGGER IF EXISTS update_revenue_updated_at ON public.revenue;
CREATE TRIGGER update_revenue_updated_at BEFORE UPDATE ON public.revenue FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ======================================================================================
-- REVENUE AGGREGATION TRIGGER
-- ======================================================================================

CREATE OR REPLACE FUNCTION maintain_revenue_aggregation()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maintain_revenue ON public.orders;
DROP TRIGGER IF EXISTS trigger_maintain_revenue ON public.orders;
DROP TRIGGER IF EXISTS trigger_maintain_revenue ON public.orders;
CREATE TRIGGER trigger_maintain_revenue
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE maintain_revenue_aggregation();

-- ======================================================================================
-- MENU ITEM SALES COUNT TRIGGER
-- ======================================================================================

CREATE OR REPLACE FUNCTION update_menu_item_sales_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sales_count ON public.orders;
DROP TRIGGER IF EXISTS trigger_update_sales_count ON public.orders;
DROP TRIGGER IF EXISTS trigger_update_sales_count ON public.orders;
CREATE TRIGGER trigger_update_sales_count
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE update_menu_item_sales_count();

-- ======================================================================================
-- AUTH TRIGGER FOR PROFILES
-- ======================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ======================================================================================
-- RLS HELPER FUNCTIONS
-- ======================================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid()) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(rest_id uuid, user_id uuid DEFAULT auth.uid()) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_users
    WHERE restaurant_id = rest_id AND profile_id = user_id AND active = true
  ) OR public.is_super_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================================
-- ENABLE ROW LEVEL SECURITY
-- ======================================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- ======================================================================================
-- RLS POLICIES
-- ======================================================================================

-- 1. profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
CREATE POLICY "Super admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
CREATE POLICY "Allow profile creation" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Restaurant members can read customer profiles" ON public.profiles;
DROP POLICY IF EXISTS "Restaurant members can read customer profiles" ON public.profiles;
CREATE POLICY "Restaurant members can read customer profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.customer_id = profiles.id AND public.is_restaurant_member(o.restaurant_id)
  )
);

-- 2. restaurants
-- Subscription v2: only 'active' (paid) restaurants are publicly visible.
-- 'approved' restaurants are onboarded but not yet subscribed — not publicly accessible.
DROP POLICY IF EXISTS "Anyone can read approved/active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Anyone can read active restaurants" ON public.restaurants;
CREATE POLICY "Anyone can read active restaurants" ON public.restaurants FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Restaurant admins can read full restaurant row" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant admins can read full restaurant row" ON public.restaurants;
CREATE POLICY "Restaurant admins can read full restaurant row" ON public.restaurants FOR SELECT USING (public.is_restaurant_member(id));
DROP POLICY IF EXISTS "Super admins can manage all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Super admins can manage all restaurants" ON public.restaurants;
CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "Restaurant admins can update their restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant admins can update their restaurant" ON public.restaurants;
CREATE POLICY "Restaurant admins can update their restaurant" ON public.restaurants FOR UPDATE USING (public.is_restaurant_member(id));

-- 3. restaurant_users
DROP POLICY IF EXISTS "Super admins manage all restaurant users" ON public.restaurant_users;
DROP POLICY IF EXISTS "Super admins manage all restaurant users" ON public.restaurant_users;
CREATE POLICY "Super admins manage all restaurant users" ON public.restaurant_users FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "Restaurant admins manage their staff" ON public.restaurant_users;
DROP POLICY IF EXISTS "Restaurant admins manage their staff" ON public.restaurant_users;
CREATE POLICY "Restaurant admins manage their staff" ON public.restaurant_users FOR ALL USING (public.is_restaurant_member(restaurant_id));
DROP POLICY IF EXISTS "Users can view their own assignment" ON public.restaurant_users;
DROP POLICY IF EXISTS "Users can view their own assignment" ON public.restaurant_users;
CREATE POLICY "Users can view their own assignment" ON public.restaurant_users FOR SELECT USING (profile_id = auth.uid());

-- 4. restaurant_tables
DROP POLICY IF EXISTS "Public can read tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Public can read tables" ON public.restaurant_tables;
CREATE POLICY "Public can read tables" ON public.restaurant_tables FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Restaurant members manage their tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Restaurant members manage their tables" ON public.restaurant_tables;
CREATE POLICY "Restaurant members manage their tables" ON public.restaurant_tables FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- 5. menu_categories
DROP POLICY IF EXISTS "Public can read active categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Public can read active categories" ON public.menu_categories;
CREATE POLICY "Public can read active categories" ON public.menu_categories FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Restaurant members manage their categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Restaurant members manage their categories" ON public.menu_categories;
CREATE POLICY "Restaurant members manage their categories" ON public.menu_categories FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- 6. menu_items
DROP POLICY IF EXISTS "Public can read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can read menu items" ON public.menu_items;
CREATE POLICY "Public can read menu items" ON public.menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Restaurant members manage their items" ON public.menu_items;
DROP POLICY IF EXISTS "Restaurant members manage their items" ON public.menu_items;
CREATE POLICY "Restaurant members manage their items" ON public.menu_items FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- 7. menu_item_images
DROP POLICY IF EXISTS "Public can read menu item images" ON public.menu_item_images;
DROP POLICY IF EXISTS "Public can read menu item images" ON public.menu_item_images;
CREATE POLICY "Public can read menu item images" ON public.menu_item_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Restaurant members manage their menu item images" ON public.menu_item_images;
DROP POLICY IF EXISTS "Restaurant members manage their menu item images" ON public.menu_item_images;
CREATE POLICY "Restaurant members manage their menu item images" ON public.menu_item_images FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- 8. orders
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
CREATE POLICY "Customers can read own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Public can read orders for live queue" ON public.orders;
DROP POLICY IF EXISTS "Public can read orders for live queue" ON public.orders;
CREATE POLICY "Public can read orders for live queue" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid() OR customer_id IS NULL);
DROP POLICY IF EXISTS "Restaurant members can manage restaurant orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant members can manage restaurant orders" ON public.orders;
CREATE POLICY "Restaurant members can manage restaurant orders" ON public.orders FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- 9. order_items
DROP POLICY IF EXISTS "Customers can read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can read own order items" ON public.order_items;
CREATE POLICY "Customers can read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);
DROP POLICY IF EXISTS "Customers can insert their order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can insert their order items" ON public.order_items;
CREATE POLICY "Customers can insert their order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR o.customer_id IS NULL))
);
DROP POLICY IF EXISTS "Restaurant members can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Restaurant members can manage order items" ON public.order_items;
CREATE POLICY "Restaurant members can manage order items" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.is_restaurant_member(o.restaurant_id))
);

-- 10. payments
DROP POLICY IF EXISTS "Customers can read their payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can read their payments" ON public.payments;
CREATE POLICY "Customers can read their payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Customers can create payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can create payments" ON public.payments;
CREATE POLICY "Customers can create payments" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "Restaurant members can read their payments" ON public.payments;
DROP POLICY IF EXISTS "Restaurant members can read their payments" ON public.payments;
CREATE POLICY "Restaurant members can read their payments" ON public.payments FOR SELECT USING (public.is_restaurant_member(restaurant_id));

-- 11. payment_logs
DROP POLICY IF EXISTS "Restaurant members can read payment logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Restaurant members can read payment logs" ON public.payment_logs;
CREATE POLICY "Restaurant members can read payment logs" ON public.payment_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND public.is_restaurant_member(p.restaurant_id))
);

-- 12. revenue
DROP POLICY IF EXISTS "Restaurant members can manage revenue" ON public.revenue;
DROP POLICY IF EXISTS "Restaurant members can manage revenue" ON public.revenue;
CREATE POLICY "Restaurant members can manage revenue" ON public.revenue FOR ALL USING (public.is_restaurant_member(restaurant_id));
DROP POLICY IF EXISTS "Super admins can manage all revenue" ON public.revenue;
DROP POLICY IF EXISTS "Super admins can manage all revenue" ON public.revenue;
CREATE POLICY "Super admins can manage all revenue" ON public.revenue FOR ALL USING (public.is_super_admin());

-- 13. favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (user_id = auth.uid());

-- 14. feedback
DROP POLICY IF EXISTS "Users can read/write own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can read/write own feedback" ON public.feedback;
CREATE POLICY "Users can read/write own feedback" ON public.feedback FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Restaurant members can read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Restaurant members can read feedback" ON public.feedback;
CREATE POLICY "Restaurant members can read feedback" ON public.feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = feedback.order_id AND public.is_restaurant_member(o.restaurant_id))
);

-- 15. platform_settings
DROP POLICY IF EXISTS "Public can read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Public can read platform settings" ON public.platform_settings;
CREATE POLICY "Public can read platform settings" ON public.platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admins manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Super admins manage platform settings" ON public.platform_settings;
CREATE POLICY "Super admins manage platform settings" ON public.platform_settings FOR ALL USING (public.is_super_admin());

-- 16. subscription_payments
DROP POLICY IF EXISTS "Restaurant members can read subscription payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Restaurant members can read subscription payments" ON public.subscription_payments;
CREATE POLICY "Restaurant members can read subscription payments" ON public.subscription_payments FOR SELECT USING (public.is_restaurant_member(restaurant_id));
DROP POLICY IF EXISTS "Super admins manage subscription payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Super admins manage subscription payments" ON public.subscription_payments;
CREATE POLICY "Super admins manage subscription payments" ON public.subscription_payments FOR ALL USING (public.is_super_admin());
-- NOTE: Restaurant members have read-only access. Status updates (e.g. auto-cancel)
-- must be performed by the super-admin service role only (see super-admin/Subscriptions.jsx).

-- 17. offers
DROP POLICY IF EXISTS "Public can read active offers" ON public.offers;
DROP POLICY IF EXISTS "Public can read active offers" ON public.offers;
CREATE POLICY "Public can read active offers"
    ON public.offers
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Restaurant members manage their offers" ON public.offers;
DROP POLICY IF EXISTS "Restaurant members manage their offers" ON public.offers;
CREATE POLICY "Restaurant members manage their offers"
    ON public.offers
    FOR ALL
    USING (public.is_restaurant_member(restaurant_id));


-- ======================================================================================
-- STORAGE POLICIES
-- ======================================================================================

-- 17. storage.objects (ar-files bucket)
-- Note: These policies target the storage.objects table which is in a different schema

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ar-files' );

DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ar-files' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated Management" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Management" ON storage.objects;
CREATE POLICY "Authenticated Management"
ON storage.objects FOR ALL
USING (
  bucket_id = 'ar-files' AND
  auth.role() = 'authenticated'
);

-- ======================================================================================
-- REALTIME CONFIGURATION
-- ======================================================================================

-- 1. Create the realtime publication if it doesn't already exist
ALTER TABLE public.revenue REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.menu_categories REPLICA IDENTITY FULL;
ALTER TABLE public.menu_item_images REPLICA IDENTITY FULL;
ALTER TABLE public.offers REPLICA IDENTITY FULL;
ALTER TABLE public.feedback REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

-- ======================================================================================
-- AUTOMATIC ORDER ROLLUP TRIGGER
-- ======================================================================================

CREATE OR REPLACE FUNCTION update_parent_order_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_parent_order ON public.order_items;
DROP TRIGGER IF EXISTS trigger_update_parent_order ON public.order_items;
DROP TRIGGER IF EXISTS trigger_update_parent_order ON public.order_items;
CREATE TRIGGER trigger_update_parent_order
    AFTER UPDATE OF status ON public.order_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_parent_order_status();

-- ======================================================================================
-- CASCADE ORDER STATUS TO ITEMS TRIGGER
-- ======================================================================================

CREATE OR REPLACE FUNCTION propagate_order_status_to_items()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_propagate_order_status ON public.orders;
DROP TRIGGER IF EXISTS trigger_propagate_order_status ON public.orders;
DROP TRIGGER IF EXISTS trigger_propagate_order_status ON public.orders;
CREATE TRIGGER trigger_propagate_order_status
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE PROCEDURE propagate_order_status_to_items();
-- ======================================================================================
-- VAULT CONFIGURATION & RESTAURANT PAYMENT SETTINGS
-- ======================================================================================

-- Enable Vault Extension
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

-- Drop old table if exists to recreate it cleanly (or alter it if preferred)
-- Actually, we'll just create the table safely.
CREATE TABLE IF NOT EXISTS public.restaurant_payment_settings (
    restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    razorpay_key_id TEXT,
    has_razorpay_key_secret BOOLEAN NOT NULL DEFAULT false,
    has_razorpay_webhook_secret BOOLEAN NOT NULL DEFAULT false,
    online_payments_enabled BOOLEAN NOT NULL DEFAULT false,
    razorpay_key_secret_id UUID,
    razorpay_webhook_secret_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.restaurant_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurant members manage payment settings" ON public.restaurant_payment_settings;
DROP POLICY IF EXISTS "Restaurant members manage payment settings" ON public.restaurant_payment_settings;
CREATE POLICY "Restaurant members manage payment settings" 
    ON public.restaurant_payment_settings 
    FOR ALL 
    USING (public.is_restaurant_member(restaurant_id)) 
    WITH CHECK (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "Super admins manage restaurant payment settings" ON public.restaurant_payment_settings;
DROP POLICY IF EXISTS "Super admins manage restaurant payment settings" ON public.restaurant_payment_settings;
CREATE POLICY "Super admins manage restaurant payment settings" 
    ON public.restaurant_payment_settings 
    FOR ALL 
    USING (public.is_super_admin()) 
    WITH CHECK (public.is_super_admin());

DROP TRIGGER IF EXISTS update_restaurant_payment_settings_updated_at ON public.restaurant_payment_settings;
DROP TRIGGER IF EXISTS update_restaurant_payment_settings_updated_at ON public.restaurant_payment_settings;
CREATE TRIGGER update_restaurant_payment_settings_updated_at 
    BEFORE UPDATE ON public.restaurant_payment_settings 
    FOR EACH ROW 
    EXECUTE PROCEDURE set_updated_at();

-- RPC Functions

CREATE OR REPLACE FUNCTION upsert_restaurant_payment_settings(
    p_restaurant_id UUID,
    p_razorpay_key_id TEXT,
    p_razorpay_key_secret TEXT,
    p_razorpay_webhook_secret TEXT,
    p_online_payments_enabled BOOLEAN
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

CREATE OR REPLACE FUNCTION get_restaurant_payment_settings(p_restaurant_id UUID)
RETURNS SETOF public.restaurant_payment_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (public.is_restaurant_member(p_restaurant_id) OR public.is_super_admin()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY SELECT * FROM public.restaurant_payment_settings WHERE restaurant_id = p_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_restaurant_razorpay_secret(
    p_restaurant_id UUID
)
RETURNS TABLE (
    razorpay_key_secret TEXT,
    razorpay_webhook_secret TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.secret AS razorpay_key_secret,
        w.secret AS razorpay_webhook_secret
    FROM public.restaurant_payment_settings rps
    LEFT JOIN vault.decrypted_secrets k ON k.id = rps.razorpay_key_secret_id
    LEFT JOIN vault.decrypted_secrets w ON w.id = rps.razorpay_webhook_secret_id
    WHERE rps.restaurant_id = p_restaurant_id;
END;
$$;

-- ======================================================================================
-- SUBSCRIPTION SYSTEM V2 — AUTO-SUSPENSION VIA pg_cron
-- ======================================================================================

-- Enable the pg_cron extension (run once; safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Index to make the daily cron scan fast
CREATE INDEX IF NOT EXISTS idx_restaurants_grace_period
    ON public.restaurants (grace_period_ends_at)
    WHERE status = 'active' AND grace_period_ends_at IS NOT NULL;

-- Function: suspends all 'active' restaurants whose grace period has elapsed.
-- Only ever writes 'active' → 'suspended'. Never touches 'pending', 'approved', or 'rejected'.
CREATE OR REPLACE FUNCTION public.suspend_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.restaurants
    SET
        status              = 'suspended',
        subscription_status = false
    WHERE
        status                  = 'active'
        AND grace_period_ends_at IS NOT NULL
        AND grace_period_ends_at  < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: runs every day at 18:30 UTC (midnight IST).
-- Wrapped in DO block so it's safe to run even if the job doesn't exist yet.
DO $$
BEGIN
    PERFORM cron.unschedule('suspend-expired-subscriptions');
EXCEPTION WHEN OTHERS THEN
    NULL; -- Job didn't exist yet; safe to ignore
END;
$$;
SELECT cron.schedule(
    'suspend-expired-subscriptions',
    '30 18 * * *',
    $$SELECT public.suspend_expired_subscriptions();$$
);
