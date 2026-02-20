-- ============================================================
-- MIGRATION: Update Tablekard database to match new schema
-- Run this if you already have the old schema in Supabase
-- and want to migrate WITHOUT losing existing data.
--
-- ⚠️ BEFORE RUNNING: Take a backup of your database!
-- ============================================================


-- ============================================================
-- STEP 1: Add new columns to existing tables
-- ============================================================

-- 1a. restaurants: Add geo-fencing columns
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS allowed_radius integer;

-- 1b. restaurants: Remove status_reason (not in diagram)
-- (safe to drop if not used)
ALTER TABLE restaurants DROP COLUMN IF EXISTS status_reason;

-- 1c. profiles: Add unique constraint on email
-- (skip if it already exists)
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
EXCEPTION WHEN duplicate_table THEN null;
         WHEN duplicate_object THEN null;
END $$;


-- ============================================================
-- STEP 2: Modify restaurant_users (auth_user_id → profile_id)
-- ============================================================

-- 2a. Add profile_id column
ALTER TABLE restaurant_users ADD COLUMN IF NOT EXISTS profile_id uuid;

-- 2b. Migrate data: copy auth_user_id → profile_id
UPDATE restaurant_users SET profile_id = auth_user_id WHERE profile_id IS NULL;

-- 2c. Add FK constraint on profile_id
DO $$ BEGIN
  ALTER TABLE restaurant_users
    ADD CONSTRAINT restaurant_users_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2d. Make profile_id NOT NULL (after data migration)
ALTER TABLE restaurant_users ALTER COLUMN profile_id SET NOT NULL;

-- 2e. Drop old columns
ALTER TABLE restaurant_users DROP COLUMN IF EXISTS auth_user_id;
ALTER TABLE restaurant_users DROP COLUMN IF EXISTS name;
ALTER TABLE restaurant_users DROP COLUMN IF EXISTS email;
ALTER TABLE restaurant_users DROP COLUMN IF EXISTS phone;


-- ============================================================
-- STEP 3: Modify orders (table_number → table_id)
-- ============================================================

-- 3a. Add table_id column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id uuid;

-- 3b. Add FK constraint
DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_table_id_fkey
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3c. Migrate existing data: Match table_number to restaurant_tables.id
UPDATE orders o
SET table_id = rt.id
FROM restaurant_tables rt
WHERE o.restaurant_id = rt.restaurant_id
  AND o.table_number = rt.table_number
  AND o.table_id IS NULL
  AND o.table_number IS NOT NULL;

-- 3d. Drop old columns
ALTER TABLE orders DROP COLUMN IF EXISTS table_number;
ALTER TABLE orders DROP COLUMN IF EXISTS customer_name;
ALTER TABLE orders DROP COLUMN IF EXISTS customer_phone;
ALTER TABLE orders DROP COLUMN IF EXISTS status_reason;
ALTER TABLE orders DROP COLUMN IF EXISTS transaction_id;


-- ============================================================
-- STEP 4: Create new tables
-- ============================================================

-- 4a. favorites
CREATE TABLE IF NOT EXISTS favorites (
  id            uuid primary key default gen_random_uuid(),
  menu_item_id  uuid not null references menu_items(id) on delete cascade,
  created_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  unique (user_id, menu_item_id)
);

-- 4b. feedback
CREATE TABLE IF NOT EXISTS feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text,
  created_at  timestamptz not null default now(),
  order_id    uuid not null references orders(id) on delete cascade,
  unique (user_id, order_id)
);

-- 4c. payments (with Razorpay integration fields)
CREATE TABLE IF NOT EXISTS payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete set null,
  restaurant_id         uuid not null references restaurants(id) on delete cascade,
  order_id              uuid not null references orders(id) on delete cascade,
  amount                numeric not null,
  currency              text not null default 'INR',
  method                text,
  gateway               text default 'razorpay',

  -- Razorpay-specific fields
  razorpay_order_id     text,
  razorpay_payment_id   text,
  razorpay_signature    text,

  -- Status tracking
  status                payment_status not null default 'PENDING',
  failure_reason        text,

  -- Webhook tracking
  webhook_verified      boolean not null default false,

  -- Timestamps
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

-- 4d. payment_logs
CREATE TABLE IF NOT EXISTS payment_logs (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid references payments(id) on delete set null,
  order_id    uuid references orders(id) on delete set null,
  event_type  text not null,
  event_data  jsonb,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- STEP 5: Create indexes for new tables
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_restaurant_id ON payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);


-- ============================================================
-- STEP 6: Update helper functions
-- ============================================================

-- Update is_restaurant_member to use profile_id instead of auth_user_id
CREATE OR REPLACE FUNCTION public.is_restaurant_member(rest_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_users
    WHERE restaurant_id = rest_id
      AND profile_id = auth.uid()
      AND active = true
  );
$$;

-- Update is_restaurant_admin to use profile_id instead of auth_user_id
CREATE OR REPLACE FUNCTION public.is_restaurant_admin(rest_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_users
    WHERE restaurant_id = rest_id
      AND profile_id = auth.uid()
      AND role = 'ADMIN'
      AND active = true
  );
$$;


-- ============================================================
-- STEP 7: Enable RLS on new tables & add policies
-- ============================================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Favorites viewable by owner"
  ON favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Favorites insertable by owner"
  ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Favorites deletable by owner"
  ON favorites FOR DELETE
  USING (user_id = auth.uid());

-- Feedback policies
CREATE POLICY "Feedback viewable by owner or restaurant members"
  ON feedback FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = feedback.order_id
        AND (is_restaurant_member(orders.restaurant_id) OR is_super_admin())
    )
  );

CREATE POLICY "Feedback insertable by order owner"
  ON feedback FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = feedback.order_id
        AND orders.customer_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Payments viewable by customer"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Payments viewable by restaurant members"
  ON payments FOR SELECT
  USING (is_restaurant_member(restaurant_id) OR is_super_admin());

-- Payment logs policies
CREATE POLICY "Payment logs viewable by restaurant members"
  ON payment_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM payments p
    WHERE p.id = payment_logs.payment_id
      AND (is_restaurant_member(p.restaurant_id) OR is_super_admin())
  ));

-- Update orders policy to also allow customers to read their own orders
-- (Drop old policy first, then recreate)
DROP POLICY IF EXISTS "Orders readable by restaurant members" ON orders;
CREATE POLICY "Orders readable by customer or restaurant members"
  ON orders FOR SELECT
  USING (
    customer_id = auth.uid()
    OR is_restaurant_member(restaurant_id)
    OR is_super_admin()
  );

-- Add table policies if missing
DO $$ BEGIN
  CREATE POLICY "Tables are viewable by authenticated users"
    ON restaurant_tables FOR SELECT
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- ============================================================
-- DONE! Verify with:
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurants' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position;
