# 🚨 BLANK SCREEN FIX - Quick Guide

## Problem
The page `/r/cafe-mocha/table/1` shows a blank screen because:
1. Row Level Security (RLS) policies require authentication to view menus
2. QR ordering customers are NOT authenticated
3. The database queries are being blocked

## Solution (3 Steps)

### Step 1: Fix RLS Policies ⚠️ **DO THIS FIRST!**

1. Open: https://supabase.com/dashboard/project/sguegujmoawhtstzsdqs/sql/new
2. Copy ALL content from: `s:\growtez\3.2 Tablekard\supabase\fix_rls_public_access.sql`
3. Paste into SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**What this does:** Allows public read access to restaurants, menus, and tables (required for QR ordering)

### Step 2: Load Mock Data

1. Stay in the SQL Editor (or open a new query)
2. Copy ALL content from: `s:\growtez\3.2 Tablekard\supabase\mock_data.sql`
3. Paste into SQL Editor
4. Click **Run**

**What this does:** Populates your database with 3 restaurants, 30 menu items, and categories

### Step 3: Test the App

1. Dev server is running at: http://localhost:3003/
2. Visit: http://localhost:3003/r/cafe-mocha/table/1
3. Or try: http://localhost:3003/r/golden-spoon/table/1

**You should now see the menu!** 🎉

## Available Test URLs

After loading data, you can test these URLs:

- http://localhost:3003/r/golden-spoon/table/1 (Fine dining, 16 items)
- http://localhost:3003/r/spice-garden/table/1 (Indian cuisine, 7 items)
- http://localhost:3003/r/cafe-mocha/table/1 (Coffee shop, 7 items)

## Files Created

1. `supabase/fix_rls_public_access.sql` - RLS policy fix
2. `supabase/mock_data.sql` - Sample restaurant data
3. `supabase/README.md` - Detailed documentation

## Why This Happened

The original schema was designed for authenticated users only. But QR ordering is meant for **walk-in customers** who scan a QR code without creating an account. The RLS fix allows public read access while keeping write operations secure.

## Next Steps

Once the menu loads successfully:
- ✅ Test adding items to cart
- ✅ Test the checkout flow
- ✅ Customize the menu items
- ✅ Add your own restaurants
