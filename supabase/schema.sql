-- ============================================================
-- Supabase schema for Tablekard — QR-only Restaurant SaaS
-- Matches the database diagram + Razorpay payment integration
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  create type user_role as enum ('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'RESTAURANT_STAFF', 'CUSTOMER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_status as enum ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('DINE_IN', 'TAKEAWAY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('ONLINE', 'PAY_AT_COUNTER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABLES
-- ============================================================

-- -------------------------
-- 1. profiles
-- -------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text,
  role        user_role not null default 'CUSTOMER',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -------------------------
-- 2. restaurants
--    Added: latitude, longitude, allowed_radius (for QR geo-fencing)
-- -------------------------
create table if not exists restaurants (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  status           restaurant_status not null default 'TRIAL',
  contact_email    text,
  contact_phone    text,
  contact_address  text,
  logo_url         text,
  primary_color    text,
  secondary_color  text,
  settings         jsonb,
  latitude         numeric,
  longitude        numeric,
  allowed_radius   integer,           -- radius in meters for geo-fencing
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- -------------------------
-- 3. restaurant_users
--    Changed: uses profile_id (FK → profiles) instead of auth_user_id + name/email/phone
--    Name, email, phone are read from the joined profiles table
-- -------------------------
create table if not exists restaurant_users (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  role           text not null check (role in ('ADMIN', 'STAFF')),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade
);

-- -------------------------
-- 4. restaurant_tables
-- -------------------------
create table if not exists restaurant_tables (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  table_number    integer not null,
  qr_code_url     text,
  capacity        integer,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (restaurant_id, table_number)
);

-- -------------------------
-- 5. menu_categories
-- -------------------------
create table if not exists menu_categories (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  image_url       text,
  sort_order      integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade
);

-- -------------------------
-- 6. menu_items
-- -------------------------
create table if not exists menu_items (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  price             numeric not null,
  discount_price    numeric,
  image_url         text,
  is_available      boolean not null default true,
  is_veg            boolean not null default false,
  category_id       uuid references menu_categories(id) on delete set null,
  preparation_time  integer,
  tags              text[],
  variants          jsonb,
  addons            jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade
);

-- -------------------------
-- 7. orders
--    Changed: table_number → table_id (uuid FK → restaurant_tables)
--    Removed: customer_name, customer_phone, status_reason, transaction_id
--    (customer info comes from profiles via customer_id join)
--    (transaction_id now lives in the payments table)
-- -------------------------
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references auth.users(id) on delete set null,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  order_number    text not null,
  type            order_type not null,
  status          order_status not null default 'PENDING',
  table_id        uuid references restaurant_tables(id) on delete set null,
  payment_method  payment_method not null default 'PAY_AT_COUNTER',
  payment_status  payment_status not null default 'PENDING',
  subtotal        numeric not null,
  taxes           numeric not null,
  discount        numeric not null default 0,
  total           numeric not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -------------------------
-- 8. order_items
-- -------------------------
create table if not exists order_items (
  id                    uuid primary key default gen_random_uuid(),
  menu_item_id          uuid references menu_items(id) on delete set null,
  name                  text not null,
  price                 numeric not null,
  quantity              integer not null,
  total                 numeric not null,
  variant               jsonb,
  addons                jsonb,
  special_instructions  text,
  created_at            timestamptz not null default now(),
  order_id              uuid not null references orders(id) on delete cascade
);

-- -------------------------
-- 9. favorites (NEW)
-- -------------------------
create table if not exists favorites (
  id            uuid primary key default gen_random_uuid(),
  menu_item_id  uuid not null references menu_items(id) on delete cascade,
  created_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  unique (user_id, menu_item_id)
);

-- -------------------------
-- 10. feedback (NEW)
-- -------------------------
create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text,
  created_at  timestamptz not null default now(),
  order_id    uuid not null references orders(id) on delete cascade,
  unique (user_id, order_id)
);

-- -------------------------
-- 11. payments (NEW — from diagram + Razorpay integration fields)
-- -------------------------
create table if not exists payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete set null,
  restaurant_id         uuid not null references restaurants(id) on delete cascade,
  order_id              uuid not null references orders(id) on delete cascade,
  amount                numeric not null,
  currency              text not null default 'INR',
  method                text,                       -- 'upi', 'card', 'netbanking', 'wallet' (filled after payment)
  gateway               text default 'razorpay',    -- payment gateway used

  -- Razorpay-specific fields
  razorpay_order_id     text,                       -- from Razorpay Orders API
  razorpay_payment_id   text,                       -- from checkout callback
  razorpay_signature    text,                       -- from checkout callback (for verification)

  -- Status tracking
  status                payment_status not null default 'PENDING',
  failure_reason        text,

  -- Webhook tracking
  webhook_verified      boolean not null default false,

  -- Timestamps
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

-- -------------------------
-- 12. payment_logs (NEW — audit trail for every payment event)
-- -------------------------
create table if not exists payment_logs (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid references payments(id) on delete set null,
  order_id    uuid references orders(id) on delete set null,
  event_type  text not null,          -- 'ORDER_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
                                      -- 'SIGNATURE_VERIFIED', 'WEBHOOK_RECEIVED', etc.
  event_data  jsonb,                  -- full event payload
  created_at  timestamptz not null default now()
);

-- -------------------------
-- 13. platform_settings
-- -------------------------
create table if not exists platform_settings (
  id          text primary key,
  config      jsonb,
  updated_at  timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_orders_restaurant_id on orders(restaurant_id);
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_menu_items_restaurant_id on menu_items(restaurant_id);
create index if not exists idx_menu_items_category_id on menu_items(category_id);
create index if not exists idx_menu_categories_restaurant_id on menu_categories(restaurant_id);
create index if not exists idx_favorites_user_id on favorites(user_id);
create index if not exists idx_feedback_order_id on feedback(order_id);
create index if not exists idx_payments_order_id on payments(order_id);
create index if not exists idx_payments_razorpay_order_id on payments(razorpay_order_id);
create index if not exists idx_payments_restaurant_id on payments(restaurant_id);
create index if not exists idx_payment_logs_payment_id on payment_logs(payment_id);
create index if not exists idx_payment_logs_order_id on payment_logs(order_id);


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'SUPER_ADMIN'
  );
$$;

create or replace function public.is_restaurant_member(rest_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from restaurant_users
    where restaurant_id = rest_id
      and profile_id = auth.uid()
      and active = true
  );
$$;

create or replace function public.is_restaurant_admin(rest_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from restaurant_users
    where restaurant_id = rest_id
      and profile_id = auth.uid()
      and role = 'ADMIN'
      and active = true
  );
$$;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table restaurant_users enable row level security;
alter table restaurant_tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table favorites enable row level security;
alter table feedback enable row level security;
alter table payments enable row level security;
alter table payment_logs enable row level security;
alter table platform_settings enable row level security;


-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ----- profiles -----
create policy "Profiles are viewable by owner"
  on profiles for select
  using (id = auth.uid() or is_super_admin());

create policy "Profiles can be inserted by owner"
  on profiles for insert
  with check (id = auth.uid());

create policy "Profiles can be updated by owner"
  on profiles for update
  using (id = auth.uid() or is_super_admin());

-- ----- restaurants -----
create policy "Restaurants are viewable by authenticated users"
  on restaurants for select
  using (auth.uid() is not null);

create policy "Restaurants are managed by super admins"
  on restaurants for insert
  with check (is_super_admin());

create policy "Restaurants are updated by super admins"
  on restaurants for update
  using (is_super_admin());

create policy "Restaurants are deleted by super admins"
  on restaurants for delete
  using (is_super_admin());

-- ----- restaurant_users -----
create policy "Restaurant users viewable by members"
  on restaurant_users for select
  using (is_restaurant_member(restaurant_id) or is_super_admin());

create policy "Restaurant users managed by super admins"
  on restaurant_users for insert
  with check (is_super_admin());

create policy "Restaurant users updated by admins"
  on restaurant_users for update
  using (is_restaurant_admin(restaurant_id) or is_super_admin());

create policy "Restaurant users deleted by super admins"
  on restaurant_users for delete
  using (is_super_admin());

-- ----- restaurant_tables -----
create policy "Tables are viewable by authenticated users"
  on restaurant_tables for select
  using (auth.uid() is not null);

create policy "Tables managed by restaurant admins"
  on restaurant_tables for insert
  with check (is_restaurant_admin(restaurant_id) or is_super_admin());

create policy "Tables updated by restaurant admins"
  on restaurant_tables for update
  using (is_restaurant_admin(restaurant_id) or is_super_admin());

create policy "Tables deleted by restaurant admins"
  on restaurant_tables for delete
  using (is_restaurant_admin(restaurant_id) or is_super_admin());

-- ----- menu_categories -----
create policy "Menu categories readable by authenticated"
  on menu_categories for select
  using (auth.uid() is not null);

create policy "Menu categories managed by admins"
  on menu_categories for insert
  with check (is_restaurant_admin(restaurant_id) or is_super_admin());

create policy "Menu categories updated by admins"
  on menu_categories for update
  using (is_restaurant_admin(restaurant_id) or is_super_admin());

create policy "Menu categories deleted by admins"
  on menu_categories for delete
  using (is_restaurant_admin(restaurant_id) or is_super_admin());

-- ----- menu_items -----
create policy "Menu items readable by authenticated"
  on menu_items for select
  using (auth.uid() is not null);

create policy "Menu items managed by admins"
  on menu_items for insert
  with check (is_restaurant_admin(restaurant_id) or is_super_admin());

create policy "Menu items updated by admins"
  on menu_items for update
  using (is_restaurant_admin(restaurant_id) or is_super_admin());

create policy "Menu items deleted by admins"
  on menu_items for delete
  using (is_restaurant_admin(restaurant_id) or is_super_admin());

-- ----- orders -----
create policy "Orders readable by customer or restaurant members"
  on orders for select
  using (
    customer_id = auth.uid()
    or is_restaurant_member(restaurant_id)
    or is_super_admin()
  );

create policy "Orders can be created by authenticated customers"
  on orders for insert
  with check (auth.uid() = customer_id);

create policy "Orders updated by restaurant members"
  on orders for update
  using (is_restaurant_member(restaurant_id) or is_super_admin());

-- ----- order_items -----
create policy "Order items readable by customer or restaurant members"
  on order_items for select
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and (
        orders.customer_id = auth.uid()
        or is_restaurant_member(orders.restaurant_id)
        or is_super_admin()
      )
  ));

create policy "Order items inserted by owning customer"
  on order_items for insert
  with check (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
  ));

create policy "Order items updated by restaurant members"
  on order_items for update
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and (is_restaurant_member(orders.restaurant_id) or is_super_admin())
  ));

-- ----- favorites -----
create policy "Favorites viewable by owner"
  on favorites for select
  using (user_id = auth.uid());

create policy "Favorites insertable by owner"
  on favorites for insert
  with check (user_id = auth.uid());

create policy "Favorites deletable by owner"
  on favorites for delete
  using (user_id = auth.uid());

-- ----- feedback -----
create policy "Feedback viewable by owner or restaurant members"
  on feedback for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from orders
      where orders.id = feedback.order_id
        and (is_restaurant_member(orders.restaurant_id) or is_super_admin())
    )
  );

create policy "Feedback insertable by order owner"
  on feedback for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from orders
      where orders.id = feedback.order_id
        and orders.customer_id = auth.uid()
    )
  );

-- ----- payments -----
-- Customers can view their own payments
create policy "Payments viewable by customer"
  on payments for select
  using (user_id = auth.uid());

-- Restaurant members can view their restaurant's payments
create policy "Payments viewable by restaurant members"
  on payments for select
  using (is_restaurant_member(restaurant_id) or is_super_admin());

-- Only Edge Functions (service_role) can insert/update payments
-- service_role bypasses RLS, so no insert/update policies needed for regular users

-- ----- payment_logs -----
create policy "Payment logs viewable by restaurant members"
  on payment_logs for select
  using (exists (
    select 1 from payments p
    where p.id = payment_logs.payment_id
      and (is_restaurant_member(p.restaurant_id) or is_super_admin())
  ));

-- ----- platform_settings -----
create policy "Platform settings managed by super admins"
  on platform_settings for all
  using (is_super_admin())
  with check (is_super_admin());
