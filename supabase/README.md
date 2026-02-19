# Mock Data Setup for TableKard

This directory contains SQL scripts for setting up your TableKard database with mock data.

## Files

- `schema.sql` - Database schema with tables, policies, and functions
- `mock_data.sql` - Sample data for testing and development

## Mock Data Includes

### 🏪 3 Restaurants
1. **The Golden Spoon** (slug: `golden-spoon`) - Fine dining
   - 5 tables
   - 4 categories: Starters, Main Course, Desserts, Beverages
   - 16 menu items

2. **Spice Garden** (slug: `spice-garden`) - Indian cuisine
   - 3 tables
   - 3 categories: South Indian, North Indian, Chinese
   - 7 menu items

3. **Café Mocha** (slug: `cafe-mocha`) - Coffee shop
   - 2 tables
   - 3 categories: Coffee, Sandwiches, Pastries
   - 7 menu items

## ⚠️ IMPORTANT: Fix RLS Policies First!

**Before loading mock data**, you MUST fix the Row Level Security (RLS) policies to allow public access to menus. The default schema requires authentication to view menus, but QR ordering needs public access.

### Why This is Needed

The QR ordering system allows customers to scan a QR code and view the menu **without logging in**. The default RLS policies block this. You must run the fix first!

### How to Fix

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/sguegujmoawhtstzsdqs/sql/new
2. Copy the contents of `fix_rls_public_access.sql`
3. Paste and click **Run**
4. ✅ Now you can load the mock data

## How to Load Mock Data

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `mock_data.sql`
5. Paste and click **Run**

### Option 2: Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref sguegujmoawhtstzsdqs

# Run the mock data script
supabase db push --file supabase/mock_data.sql
```

### Option 3: Using psql (if you have direct database access)

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.sguegujmoawhtstzsdqs.supabase.co:5432/postgres" -f supabase/mock_data.sql
```

## Testing the Data

After loading the mock data, you can test by visiting:

- http://localhost:5173/r/golden-spoon/table/1
- http://localhost:5173/r/spice-garden/table/1
- http://localhost:5173/r/cafe-mocha/table/1

## Verification Queries

Run these in the SQL Editor to verify the data:

```sql
-- Check all restaurants
SELECT name, slug, status FROM restaurants;

-- Check menu items per restaurant
SELECT r.name, COUNT(mi.id) as item_count 
FROM restaurants r 
LEFT JOIN menu_items mi ON r.id = mi.restaurant_id 
GROUP BY r.name;

-- Check categories per restaurant
SELECT r.name, COUNT(mc.id) as category_count 
FROM restaurants r 
LEFT JOIN menu_categories mc ON r.id = mc.restaurant_id 
GROUP BY r.name;

-- View all menu items for Golden Spoon
SELECT 
  mc.name as category,
  mi.name as item,
  mi.price,
  mi.is_veg,
  mi.is_available
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
JOIN restaurants r ON mi.restaurant_id = r.id
WHERE r.slug = 'golden-spoon'
ORDER BY mc.sort_order, mi.name;
```

## Important Notes

⚠️ **Authentication Required for Orders**
- The mock data does NOT include sample orders
- Orders require authenticated users (from `auth.users` table)
- Once you have authenticated users, you can create orders using the template in `mock_data.sql`

⚠️ **Row Level Security (RLS)**
- All tables have RLS enabled
- Menu items and categories are readable by authenticated users
- Orders can only be created by the customer who owns them
- Restaurant management requires admin privileges

## Clearing Data

If you need to start fresh:

```sql
-- WARNING: This will delete all data!
TRUNCATE order_items, orders, menu_items, menu_categories, restaurant_tables, restaurant_users, restaurants CASCADE;
```

## Next Steps

1. Load the mock data using one of the methods above
2. Update `App.jsx` to use a real restaurant slug (already set to `demo-restaurant`, change to `golden-spoon`)
3. Test the customer-web app
4. Create authenticated users to test ordering functionality
