-- =========================================================================
-- CAMPUSBITE SUPABASE POSTGRESQL SCHEMA & SEED DATA
-- Copy and paste this script into your Supabase SQL Editor and click RUN.
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT '123456',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  prep_time_mins INT DEFAULT 5,
  description TEXT
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  token_number INT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unique_code TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  pickup_pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  estimated_ready_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. APP SETTINGS (Staff PIN & Token Counter)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public access for canteen web client interactions
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read menu" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public update menu" ON menu_items FOR ALL USING (true);

CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public manage orders" ON orders FOR ALL USING (true);

CREATE POLICY "Allow public read settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON app_settings FOR ALL USING (true);

-- =========================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- (Pushes live updates to phones and TV screens automatically)
-- =========================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- Seed App Settings
INSERT INTO app_settings (key, value)
VALUES 
  ('staff_pin', '1234'),
  ('next_token_number', '1')
ON CONFLICT (key) DO NOTHING;

-- Seed Menu Items
INSERT INTO menu_items (id, name, category, price, stock_quantity, is_available, prep_time_mins, description)
VALUES 
  ('m1', 'Hot Crispy Samosa', 'Snacks', 15, 30, true, 3, 'Golden spiced potato stuffed crispy triangles'),
  ('m2', 'Mumbai Vada Pav', 'Snacks', 20, 25, true, 2, 'Spicy potato fritter in bun with garlic chutney'),
  ('m3', 'Veg Cheese Grilled Sandwich', 'Snacks', 55, 15, true, 7, 'Crisp layered sandwich with veggies and melted cheese'),
  ('m4', 'Paneer Tikka Frankie', 'Quick Meals', 65, 12, true, 8, 'Tandoori paneer roll wrapped with onions & mint mayo'),
  ('m5', 'Veg Fried Rice Bowl', 'Quick Meals', 80, 15, true, 10, 'Aromatic wok-tossed basmati rice with crunchy veggies'),
  ('m6', 'Chole Bhature Platter', 'Quick Meals', 85, 8, true, 12, '2 fluffy bhaturas with rich spiced chickpea curry'),
  ('m7', 'Adrak Masala Chai', 'Beverages', 12, 50, true, 2, 'Fresh brewed cardamom & ginger spiced hot tea'),
  ('m8', 'Thick Cold Coffee', 'Beverages', 35, 20, true, 3, 'Rich creamy chilled coffee with chocolate drizzle')
ON CONFLICT (id) DO NOTHING;

-- Seed Demo Users
INSERT INTO users (id, unique_code, name, phone, password)
VALUES 
  ('u1111111-1111-1111-1111-111111111111', 'CB-1042', 'Rahul Sharma', '9876543210', '123456'),
  ('u2222222-2222-2222-2222-222222222222', 'CB-1088', 'Priya Patel', '9823456789', '123456'),
  ('u3333333-3333-3333-3333-333333333333', 'CB-1015', 'Aman Verma', '9811223344', '123456')
ON CONFLICT (phone) DO NOTHING;
