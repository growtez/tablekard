-- Fix RLS policies to allow public read access for QR ordering
-- This allows unauthenticated customers to view menus via QR codes

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Restaurants are viewable by authenticated users" ON restaurants;
DROP POLICY IF EXISTS "Menu categories readable by authenticated" ON menu_categories;
DROP POLICY IF EXISTS "Menu items readable by authenticated" ON menu_items;

-- Create new public read policies
CREATE POLICY "Restaurants are publicly viewable"
  ON restaurants FOR SELECT
  USING (true);

CREATE POLICY "Menu categories are publicly viewable"
  ON menu_categories FOR SELECT
  USING (true);

CREATE POLICY "Menu items are publicly viewable"
  ON menu_items FOR SELECT
  USING (true);

-- Restaurant tables should also be publicly viewable for QR code validation
DROP POLICY IF EXISTS "Restaurant tables viewable by members" ON restaurant_tables;

CREATE POLICY "Restaurant tables are publicly viewable"
  ON restaurant_tables FOR SELECT
  USING (true);
