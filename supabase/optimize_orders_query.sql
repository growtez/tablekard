-- OPTIMIZATION: Index created_at on orders table
-- This speeds up "Today's Orders" and "Order History" queries.
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
