-- Mock Data for TableKard Restaurant SaaS
-- This file contains sample data for testing and development

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE order_items, orders, menu_items, menu_categories, restaurant_tables, restaurant_users, restaurants CASCADE;

-- ============================================
-- RESTAURANTS
-- ============================================

INSERT INTO restaurants (id, name, slug, status, contact_email, contact_phone, contact_address, logo_url, primary_color, secondary_color, settings) VALUES
(
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'The Golden Spoon',
  'golden-spoon',
  'ACTIVE',
  'contact@goldenspoon.com',
  '+91-9876543210',
  '123 MG Road, Bangalore, Karnataka 560001',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  '#D4AF37',
  '#1a1a2e',
  '{"tax_percentage": 5, "service_charge": 10, "currency": "INR", "enable_online_payment": true}'::jsonb
),
(
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  'Spice Garden',
  'spice-garden',
  'ACTIVE',
  'hello@spicegarden.in',
  '+91-9876543211',
  '456 Brigade Road, Bangalore, Karnataka 560025',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
  '#FF6B35',
  '#2C3E50',
  '{"tax_percentage": 5, "service_charge": 0, "currency": "INR", "enable_online_payment": true}'::jsonb
),
(
  'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
  'Café Mocha',
  'cafe-mocha',
  'TRIAL',
  'info@cafemocha.com',
  '+91-9876543212',
  '789 Indiranagar, Bangalore, Karnataka 560038',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
  '#6F4E37',
  '#F5E6D3',
  '{"tax_percentage": 5, "service_charge": 5, "currency": "INR", "enable_online_payment": false}'::jsonb
);

-- ============================================
-- RESTAURANT TABLES
-- ============================================

-- Golden Spoon Tables
INSERT INTO restaurant_tables (restaurant_id, table_number, qr_code_url, active, capacity) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 1, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=golden-spoon-t1', true, 4),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 2, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=golden-spoon-t2', true, 2),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 3, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=golden-spoon-t3', true, 6),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 4, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=golden-spoon-t4', true, 4),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 5, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=golden-spoon-t5', true, 8);

-- Spice Garden Tables
INSERT INTO restaurant_tables (restaurant_id, table_number, qr_code_url, active, capacity) VALUES
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 1, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=spice-garden-t1', true, 4),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 2, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=spice-garden-t2', true, 4),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 3, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=spice-garden-t3', true, 2);

-- Café Mocha Tables
INSERT INTO restaurant_tables (restaurant_id, table_number, qr_code_url, active, capacity) VALUES
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 1, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=cafe-mocha-t1', true, 2),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 2, 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=cafe-mocha-t2', true, 4);

-- ============================================
-- MENU CATEGORIES - Golden Spoon
-- ============================================

INSERT INTO menu_categories (id, restaurant_id, name, description, image_url, sort_order, active) VALUES
('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Starters', 'Delicious appetizers to begin your meal', 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400', 1, true),
('11111111-1111-1111-1111-111111111112', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Main Course', 'Hearty main dishes', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', 2, true),
('11111111-1111-1111-1111-111111111113', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Desserts', 'Sweet endings', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', 3, true),
('11111111-1111-1111-1111-111111111114', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Beverages', 'Refreshing drinks', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', 4, true);

-- ============================================
-- MENU ITEMS - Golden Spoon
-- ============================================

-- Starters
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, image_url, is_available, is_veg, preparation_time, tags) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111111', 'Paneer Tikka', 'Cottage cheese marinated in spices and grilled to perfection', 280, 250, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', true, true, 15, ARRAY['popular', 'spicy']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111111', 'Chicken Wings', 'Crispy fried chicken wings with tangy sauce', 320, null, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400', true, false, 20, ARRAY['popular', 'spicy']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111111', 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 180, 160, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400', true, true, 12, ARRAY['vegan-option']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111111', 'Fish Fingers', 'Golden fried fish fingers with tartar sauce', 350, null, 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400', true, false, 18, ARRAY['seafood']);

-- Main Course
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, image_url, is_available, is_veg, preparation_time, tags) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111112', 'Butter Chicken', 'Tender chicken in rich tomato and butter gravy', 420, 380, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', true, false, 25, ARRAY['popular', 'chef-special']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111112', 'Paneer Butter Masala', 'Cottage cheese in creamy tomato gravy', 360, null, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true, true, 20, ARRAY['popular']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111112', 'Biryani (Chicken)', 'Aromatic basmati rice with spiced chicken', 450, 420, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', true, false, 30, ARRAY['popular', 'spicy']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111112', 'Biryani (Veg)', 'Aromatic basmati rice with mixed vegetables', 380, 350, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', true, true, 25, ARRAY['popular']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111112', 'Grilled Salmon', 'Fresh salmon fillet with herbs and lemon butter', 680, null, 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400', true, false, 22, ARRAY['chef-special', 'seafood']);

-- Desserts
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, image_url, is_available, is_veg, preparation_time, tags) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111113', 'Gulab Jamun', 'Soft milk dumplings in sugar syrup', 120, null, 'https://images.unsplash.com/photo-1589119908995-c6b8b1d6c3e4?w=400', true, true, 5, ARRAY['traditional']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111113', 'Chocolate Lava Cake', 'Warm chocolate cake with molten center', 180, 160, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400', true, true, 12, ARRAY['popular']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111113', 'Ice Cream Sundae', 'Vanilla ice cream with toppings', 150, null, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400', true, true, 5, ARRAY['kids-favorite']);

-- Beverages
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, image_url, is_available, is_veg, preparation_time, tags) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111114', 'Fresh Lime Soda', 'Refreshing lime soda with mint', 80, null, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true, true, 5, ARRAY['refreshing']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111114', 'Mango Lassi', 'Creamy yogurt drink with mango', 100, null, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400', true, true, 5, ARRAY['traditional']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111114', 'Masala Chai', 'Traditional Indian spiced tea', 60, null, 'https://images.unsplash.com/photo-1597318130878-aa1caa81e00a?w=400', true, true, 8, ARRAY['traditional']),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '11111111-1111-1111-1111-111111111114', 'Cold Coffee', 'Chilled coffee with ice cream', 120, 100, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', true, true, 7, ARRAY['popular']);

-- ============================================
-- MENU CATEGORIES - Spice Garden
-- ============================================

INSERT INTO menu_categories (id, restaurant_id, name, description, image_url, sort_order, active) VALUES
('22222222-2222-2222-2222-222222222221', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'South Indian', 'Authentic South Indian delicacies', 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', 1, true),
('22222222-2222-2222-2222-222222222222', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'North Indian', 'Rich North Indian cuisine', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', 2, true),
('22222222-2222-2222-2222-222222222223', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Chinese', 'Indo-Chinese favorites', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', 3, true);

-- ============================================
-- MENU ITEMS - Spice Garden
-- ============================================

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, image_url, is_available, is_veg, preparation_time, tags) VALUES
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '22222222-2222-2222-2222-222222222221', 'Masala Dosa', 'Crispy rice crepe with spiced potato filling', 120, null, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', true, true, 15, ARRAY['popular', 'traditional']),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '22222222-2222-2222-2222-222222222221', 'Idli Sambar', 'Steamed rice cakes with lentil soup', 80, null, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400', true, true, 12, ARRAY['healthy', 'traditional']),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '22222222-2222-2222-2222-222222222221', 'Uttapam', 'Thick rice pancake with vegetables', 100, null, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400', true, true, 15, ARRAY['healthy']),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '22222222-2222-2222-2222-222222222222', 'Dal Makhani', 'Creamy black lentils', 220, null, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', true, true, 25, ARRAY['popular']),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '22222222-2222-2222-2222-222222222222', 'Tandoori Roti', 'Whole wheat flatbread', 30, null, 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400', true, true, 8, ARRAY['traditional']),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '22222222-2222-2222-2222-222222222223', 'Veg Fried Rice', 'Stir-fried rice with vegetables', 180, 160, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400', true, true, 15, ARRAY['popular']),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '22222222-2222-2222-2222-222222222223', 'Chilli Paneer', 'Spicy cottage cheese in Indo-Chinese sauce', 240, null, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400', true, true, 18, ARRAY['spicy', 'popular']);

-- ============================================
-- MENU CATEGORIES - Café Mocha
-- ============================================

INSERT INTO menu_categories (id, restaurant_id, name, description, image_url, sort_order, active) VALUES
('33333333-3333-3333-3333-333333333331', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Coffee', 'Specialty coffee drinks', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400', 1, true),
('33333333-3333-3333-3333-333333333332', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Sandwiches', 'Fresh sandwiches and wraps', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', 2, true),
('33333333-3333-3333-3333-333333333333', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Pastries', 'Freshly baked pastries', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 3, true);

-- ============================================
-- MENU ITEMS - Café Mocha
-- ============================================

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, image_url, is_available, is_veg, preparation_time, tags, variants) VALUES
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '33333333-3333-3333-3333-333333333331', 'Cappuccino', 'Classic Italian coffee with steamed milk', 150, null, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', true, true, 8, ARRAY['popular'], 
  '{"sizes": [{"name": "Regular", "price": 150}, {"name": "Large", "price": 180}]}'::jsonb),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '33333333-3333-3333-3333-333333333331', 'Latte', 'Espresso with steamed milk', 160, null, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400', true, true, 8, ARRAY['popular'],
  '{"sizes": [{"name": "Regular", "price": 160}, {"name": "Large", "price": 190}]}'::jsonb),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '33333333-3333-3333-3333-333333333331', 'Mocha', 'Chocolate espresso drink', 180, 160, 'https://images.unsplash.com/photo-1607260550778-aa9d29444ce1?w=400', true, true, 10, ARRAY['popular', 'chef-special'],
  '{"sizes": [{"name": "Regular", "price": 180}, {"name": "Large", "price": 210}]}'::jsonb),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '33333333-3333-3333-3333-333333333332', 'Club Sandwich', 'Triple-decker with chicken, bacon, lettuce', 280, null, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true, false, 15, ARRAY['popular'], null),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '33333333-3333-3333-3333-333333333332', 'Veg Grilled Sandwich', 'Grilled sandwich with vegetables and cheese', 180, 160, 'https://images.unsplash.com/photo-1621852004158-f3bc188ace2d?w=400', true, true, 12, ARRAY['healthy'], null),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '33333333-3333-3333-3333-333333333333', 'Croissant', 'Buttery French pastry', 120, null, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', true, true, 5, ARRAY['breakfast'], null),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '33333333-3333-3333-3333-333333333333', 'Chocolate Muffin', 'Rich chocolate muffin', 100, null, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400', true, true, 5, ARRAY['kids-favorite'], null);

-- ============================================
-- Note: To add sample orders, you would need actual customer user IDs from auth.users
-- The following is a template for creating orders once you have authenticated users
-- ============================================

/*
-- Sample Order Template (uncomment and replace UUIDs when you have actual users)

INSERT INTO orders (id, restaurant_id, customer_id, order_number, type, table_number, customer_name, customer_phone, status, payment_method, payment_status, subtotal, taxes, discount, total) VALUES
('order-1', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'YOUR-CUSTOMER-UUID', 'GS-001', 'DINE_IN', 1, 'John Doe', '+91-9876543210', 'CONFIRMED', 'PAY_AT_COUNTER', 'PENDING', 700, 35, 0, 735);

INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, total) VALUES
('order-1', (SELECT id FROM menu_items WHERE name = 'Paneer Tikka' LIMIT 1), 'Paneer Tikka', 250, 1, 250),
('order-1', (SELECT id FROM menu_items WHERE name = 'Butter Chicken' LIMIT 1), 'Butter Chicken', 380, 1, 380),
('order-1', (SELECT id FROM menu_items WHERE name = 'Mango Lassi' LIMIT 1), 'Mango Lassi', 100, 1, 100);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check restaurants
-- SELECT name, slug, status FROM restaurants;

-- Check menu items count per restaurant
-- SELECT r.name, COUNT(mi.id) as item_count 
-- FROM restaurants r 
-- LEFT JOIN menu_items mi ON r.id = mi.restaurant_id 
-- GROUP BY r.name;

-- Check categories per restaurant
-- SELECT r.name, COUNT(mc.id) as category_count 
-- FROM restaurants r 
-- LEFT JOIN menu_categories mc ON r.id = mc.restaurant_id 
-- GROUP BY r.name;
