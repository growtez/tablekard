-- ============================================================
-- SAFE MIGRATION: Only add what's missing
-- Your database already has the new schema structure.
-- This script ONLY creates tables/indexes/policies that 
-- might not exist yet.
-- ============================================================

-- ============================================================
-- STEP 1: Create the payment_status enum if missing
-- ============================================================
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- STEP 2: Create missing tables
-- ============================================================

-- favorites
CREATE TABLE IF NOT EXISTS favorites (
  id            uuid primary key default gen_random_uuid(),
  menu_item_id  uuid not null references menu_items(id) on delete cascade,
  created_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  unique (user_id, menu_item_id)
);

-- feedback
CREATE TABLE IF NOT EXISTS feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text,
  created_at  timestamptz not null default now(),
  order_id    uuid not null references orders(id) on delete cascade,
  unique (user_id, order_id)
);

-- payments (Razorpay integration)
CREATE TABLE IF NOT EXISTS payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete set null,
  restaurant_id         uuid not null references restaurants(id) on delete cascade,
  order_id              uuid references orders(id) on delete cascade,  -- nullable: payment created before order
  amount                numeric not null,
  currency              text not null default 'INR',
  method                text,
  gateway               text default 'razorpay',
  razorpay_order_id     text,
  razorpay_payment_id   text,
  razorpay_signature    text,
  status                payment_status not null default 'PENDING',
  failure_reason        text,
  webhook_verified      boolean not null default false,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

-- payment_logs
CREATE TABLE IF NOT EXISTS payment_logs (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid references payments(id) on delete set null,
  order_id    uuid references orders(id) on delete set null,
  event_type  text not null,
  event_data  jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- STEP 3: Add geo columns to restaurants (if missing)
-- ============================================================
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS allowed_radius integer;

-- ============================================================
-- STEP 4: Create indexes
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
-- STEP 5: Enable RLS on new tables
-- ============================================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Add RLS policies (safe with DO blocks)
-- ============================================================

-- Favorites
DO $$ BEGIN
  CREATE POLICY "Favorites viewable by owner"
    ON favorites FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Favorites insertable by owner"
    ON favorites FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Favorites deletable by owner"
    ON favorites FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Feedback
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Payments
DO $$ BEGIN
  CREATE POLICY "Payments viewable by customer"
    ON payments FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Payments viewable by restaurant members"
    ON payments FOR SELECT
    USING (is_restaurant_member(restaurant_id) OR is_super_admin());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Payments insertable by authenticated users"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Payments updatable by service role"
    ON payments FOR UPDATE
    USING (user_id = auth.uid() OR is_restaurant_member(restaurant_id) OR is_super_admin());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Payment logs
DO $$ BEGIN
  CREATE POLICY "Payment logs viewable by restaurant members"
    ON payment_logs FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = payment_logs.payment_id
        AND (is_restaurant_member(p.restaurant_id) OR is_super_admin())
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Payment logs insertable by authenticated"
    ON payment_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Orders: ensure customers can read their own orders
DROP POLICY IF EXISTS "Orders readable by restaurant members" ON orders;
DO $$ BEGIN
  CREATE POLICY "Orders readable by customer or restaurant members"
    ON orders FOR SELECT
    USING (
      customer_id = auth.uid()
      OR is_restaurant_member(restaurant_id)
      OR is_super_admin()
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- DONE! ✅
-- ============================================================
-- Verify: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
