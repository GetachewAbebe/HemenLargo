-- ============================================================
-- SUKIE / HEMEN SOAP SHOP - SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- 1. Products Table (Bulk Tank Soap Inventory)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_name TEXT,
  category TEXT DEFAULT 'General Cleanser',
  scent TEXT,
  color TEXT DEFAULT '#0d9488',
  icon_emoji TEXT DEFAULT '🧴',
  price_per_liter NUMERIC NOT NULL DEFAULT 60,
  cost_per_liter NUMERIC NOT NULL DEFAULT 35,
  stock_liters NUMERIC NOT NULL DEFAULT 100,
  min_stock_alert NUMERIC DEFAULT 40,
  sold_liters NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sales Table (Transactions & Counter Receipts)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT DEFAULT 'Walk-in Customer',
  customer_phone TEXT DEFAULT 'N/A',
  payment_method TEXT DEFAULT 'Cash',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  total_liters NUMERIC NOT NULL DEFAULT 0,
  cash_tendered NUMERIC,
  change_due NUMERIC,
  note TEXT,
  credit_due_date TEXT,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Debts Table (Customer Credit / ዕዳ Records)
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT 'N/A',
  sale_id TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_balance NUMERIC NOT NULL DEFAULT 0,
  due_date TEXT,
  status TEXT DEFAULT 'Unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expenses Table (Chemicals, Rent, Utilities)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Supplies',
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Shop Config Table (Store Profile, Currency, VAT)
CREATE TABLE IF NOT EXISTS shop_config (
  id TEXT PRIMARY KEY DEFAULT 'default_config',
  store_name TEXT DEFAULT 'Sukie Liquid Soap',
  tagline TEXT DEFAULT 'Bulk Refill & Quality Cleansers',
  phone TEXT DEFAULT '+251 91 123 4567',
  location TEXT DEFAULT 'Addis Ababa, Ethiopia',
  currency TEXT DEFAULT 'ETB',
  vat_percent NUMERIC DEFAULT 0,
  receipt_footer TEXT DEFAULT 'Thank you for keeping clean with Sukie!',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Allow Anonymous Public Access for Shop POS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for debts" ON debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for shop_config" ON shop_config FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for live updates across devices
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE debts;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_config;
