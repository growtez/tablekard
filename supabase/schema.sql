-- Supabase schema for QR-only Restaurant SaaS

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
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

-- Tables
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role user_role not null default 'CUSTOMER',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status restaurant_status not null default 'TRIAL',
  status_reason text,
  contact_email text,
  contact_phone text,
  contact_address text,
  logo_url text,
  primary_color text,
  secondary_color text,
  settings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists restaurant_users (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('ADMIN', 'STAFF')),
  name text not null,
  email text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number integer not null,
  qr_code_url text,
  active boolean not null default true,
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, table_number)
);

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric not null,
  discount_price numeric,
  image_url text,
  is_available boolean not null default true,
  is_veg boolean not null default false,
  preparation_time integer,
  tags text[],
  variants jsonb,
  addons jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete set null,
  order_number text not null,
  type order_type not null,
  table_number integer,
  customer_name text,
  customer_phone text,
  status order_status not null default 'PENDING',
  status_reason text,
  payment_method payment_method not null default 'PAY_AT_COUNTER',
  payment_status payment_status not null default 'PENDING',
  transaction_id text,
  subtotal numeric not null,
  taxes numeric not null,
  discount numeric not null default 0,
  total numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name text not null,
  price numeric not null,
  quantity integer not null,
  total numeric not null,
  variant jsonb,
  addons jsonb,
  special_instructions text,
  created_at timestamptz not null default now()
);

create table if not exists platform_settings (
  id text primary key,
  config jsonb,
  updated_at timestamptz not null default now()
);

-- Helper functions
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
      and auth_user_id = auth.uid()
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
      and auth_user_id = auth.uid()
      and role = 'ADMIN'
      and active = true
  );
$$;

-- Enable RLS
alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table restaurant_users enable row level security;
alter table restaurant_tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table platform_settings enable row level security;

-- Profiles policies
create policy "Profiles are viewable by owner"
  on profiles for select
  using (id = auth.uid() or is_super_admin());

create policy "Profiles can be inserted by owner"
  on profiles for insert
  with check (id = auth.uid());

create policy "Profiles can be updated by owner"
  on profiles for update
  using (id = auth.uid() or is_super_admin());

-- Restaurants policies
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

-- Restaurant users policies
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

-- Menu policies (read for authenticated, write for admins)
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

-- Orders policies
create policy "Orders readable by restaurant members"
  on orders for select
  using (is_restaurant_member(restaurant_id) or is_super_admin());

create policy "Orders can be created by authenticated customers"
  on orders for insert
  with check (auth.uid() = customer_id);

create policy "Orders updated by restaurant members"
  on orders for update
  using (is_restaurant_member(restaurant_id) or is_super_admin());

-- Order items policies
create policy "Order items readable by restaurant members"
  on order_items for select
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and (is_restaurant_member(orders.restaurant_id) or is_super_admin())
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

-- Platform settings (super admin only)
create policy "Platform settings managed by super admins"
  on platform_settings for all
  using (is_super_admin())
  with check (is_super_admin());
