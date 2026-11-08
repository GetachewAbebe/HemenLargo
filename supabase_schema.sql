-- Sukie POS Supabase schema and security migration.
-- Safe to run on the previous single-shop schema; existing rows are assigned
-- to the legacy shop UUID below and require an explicit owner membership.

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'cashier')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION current_shop_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT shop_id
  FROM public.shop_members
  WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION ensure_user_shop(p_shop_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_shop_id UUID;
  v_shop_name TEXT := COALESCE(NULLIF(BTRIM(p_shop_name), ''), 'Sukie Liquid Soap');
  v_full_name TEXT := COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT, 0));

  SELECT shop_id INTO v_shop_id
  FROM public.shop_members
  WHERE user_id = v_user_id;

  IF v_shop_id IS NULL THEN
    INSERT INTO public.shops (name) VALUES (v_shop_name) RETURNING id INTO v_shop_id;
    INSERT INTO public.shop_members (user_id, shop_id, role)
    VALUES (v_user_id, v_shop_id, 'owner');
    INSERT INTO public.shop_config (id, shop_id, shop_name, store_name, owner_name)
    VALUES (v_shop_id::TEXT, v_shop_id, v_shop_name, v_shop_name, v_full_name)
    ON CONFLICT (shop_id, id) DO NOTHING;
  END IF;

  RETURN v_shop_id;
END;
$$;

CREATE TABLE IF NOT EXISTS products (
  id TEXT NOT NULL,
  shop_id UUID NOT NULL DEFAULT public.current_shop_id() REFERENCES shops(id),
  name TEXT NOT NULL,
  local_name TEXT,
  category TEXT DEFAULT 'General Cleanser',
  scent TEXT,
  color TEXT DEFAULT '#0d9488',
  icon_emoji TEXT DEFAULT '🧴',
  price_per_liter NUMERIC NOT NULL DEFAULT 60,
  price_per_half_liter NUMERIC,
  cost_per_liter NUMERIC NOT NULL DEFAULT 35,
  stock_liters NUMERIC NOT NULL DEFAULT 100,
  min_stock_alert NUMERIC DEFAULT 40,
  sold_liters NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, id)
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_per_half_liter NUMERIC;

CREATE TABLE IF NOT EXISTS sales (
  id TEXT NOT NULL,
  shop_id UUID NOT NULL DEFAULT public.current_shop_id() REFERENCES shops(id),
  invoice_number TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT DEFAULT 'Walk-in Customer',
  customer_phone TEXT DEFAULT 'N/A',
  payment_method TEXT DEFAULT 'Cash',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  total_liters NUMERIC NOT NULL DEFAULT 0,
  cash_tendered NUMERIC,
  change_due NUMERIC,
  note TEXT,
  notes TEXT,
  credit_due_date TEXT,
  payment_status TEXT DEFAULT 'paid',
  pricing_tier TEXT DEFAULT 'retail',
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, id)
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT NOT NULL,
  shop_id UUID NOT NULL DEFAULT public.current_shop_id() REFERENCES shops(id),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, id)
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT NOT NULL,
  shop_id UUID NOT NULL DEFAULT public.current_shop_id() REFERENCES shops(id),
  debt_id TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  note TEXT NOT NULL DEFAULT '',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id, id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT NOT NULL,
  shop_id UUID NOT NULL DEFAULT public.current_shop_id() REFERENCES shops(id),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Supplies',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  date TEXT,
  note TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, id)
);

CREATE TABLE IF NOT EXISTS shop_config (
  id TEXT NOT NULL DEFAULT 'default_config',
  shop_id UUID NOT NULL DEFAULT public.current_shop_id() REFERENCES shops(id),
  shop_name TEXT DEFAULT 'Sukie Liquid Soap',
  store_name TEXT DEFAULT 'Sukie Liquid Soap',
  tagline TEXT DEFAULT 'Bulk Refill & Quality Cleansers',
  owner_name TEXT DEFAULT 'Getachew',
  phone TEXT DEFAULT '+251 91 100 0000',
  address TEXT DEFAULT 'Addis Ababa, Ethiopia',
  location TEXT DEFAULT 'Addis Ababa, Ethiopia',
  currency TEXT DEFAULT 'ETB',
  calendar_system TEXT DEFAULT 'ethiopian',
  calendar_style TEXT DEFAULT 'amharic',
  receipt_footer TEXT DEFAULT 'Thank you for shopping with us! አመሰግናለሁ!',
  tax_rate NUMERIC DEFAULT 0,
  vat_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, id)
);

-- Backfill pre-tenant deployments into a fixed legacy shop, preserving every row.
INSERT INTO shops (id, name)
VALUES ('11111111-1111-4111-8111-111111111111', 'Legacy Sukie Shop')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['products', 'sales', 'debts', 'expenses', 'shop_config', 'debt_payments']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS shop_id UUID', v_table);
    EXECUTE format(
      'UPDATE public.%I SET shop_id = %L::UUID WHERE shop_id IS NULL',
      v_table,
      '11111111-1111-4111-8111-111111111111'
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN shop_id SET DEFAULT public.current_shop_id()',
      v_table
    );
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN shop_id SET NOT NULL', v_table);
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', v_table, v_table || '_pkey');
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I PRIMARY KEY (shop_id, id)',
      v_table,
      v_table || '_pkey'
    );
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = format('public.%I', v_table)::REGCLASS
        AND conname = v_table || '_shop_id_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (shop_id) REFERENCES public.shops(id)',
        v_table,
        v_table || '_shop_id_fkey'
      );
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE debt_payments DROP CONSTRAINT IF EXISTS debt_payments_debt_shop_fkey;
ALTER TABLE debt_payments DROP CONSTRAINT IF EXISTS debt_payments_debt_id_fkey;
ALTER TABLE debt_payments
  ADD CONSTRAINT debt_payments_debt_shop_fkey
  FOREIGN KEY (shop_id, debt_id) REFERENCES debts(shop_id, id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION record_sale(p_sale JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_shop_id UUID := public.current_shop_id();
  v_sale_id TEXT := p_sale ->> 'id';
  v_item JSONB;
  v_affected INTEGER;
  v_total NUMERIC := COALESCE((p_sale ->> 'total')::NUMERIC, 0);
BEGIN
  IF v_shop_id IS NULL THEN RAISE EXCEPTION 'No shop is assigned to this user'; END IF;
  IF v_sale_id IS NULL THEN RAISE EXCEPTION 'Sale ID is required'; END IF;
  IF jsonb_typeof(p_sale -> 'items') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Sale items must be an array';
  END IF;
  IF jsonb_array_length(p_sale -> 'items') = 0 THEN RAISE EXCEPTION 'Sale must contain an item'; END IF;

  INSERT INTO public.sales (
    id, shop_id, invoice_number, date, customer_name, customer_phone, payment_method,
    items, subtotal, discount, total, total_amount, total_cost, profit, total_liters,
    cash_tendered, change_due, note, notes, credit_due_date, payment_status, status
  ) VALUES (
    v_sale_id, v_shop_id, COALESCE(p_sale ->> 'invoice_number', v_sale_id),
    COALESCE((p_sale ->> 'date')::TIMESTAMPTZ, NOW()),
    COALESCE(p_sale ->> 'customer_name', 'Walk-in Customer'),
    COALESCE(p_sale ->> 'customer_phone', 'N/A'),
    COALESCE(p_sale ->> 'payment_method', 'Cash'),
    COALESCE(p_sale -> 'items', '[]'::JSONB),
    COALESCE((p_sale ->> 'subtotal')::NUMERIC, v_total),
    COALESCE((p_sale ->> 'discount')::NUMERIC, 0),
    v_total, v_total,
    COALESCE((p_sale ->> 'total_cost')::NUMERIC, 0),
    COALESCE((p_sale ->> 'profit')::NUMERIC, 0),
    COALESCE((p_sale ->> 'total_liters')::NUMERIC, 0),
    NULLIF(p_sale ->> 'cash_tendered', '')::NUMERIC,
    NULLIF(p_sale ->> 'change_due', '')::NUMERIC,
    COALESCE(p_sale ->> 'note', ''),
    COALESCE(p_sale ->> 'note', ''),
    NULLIF(p_sale ->> 'credit_due_date', ''),
    CASE WHEN p_sale ->> 'payment_method' = 'Credit' THEN 'pending' ELSE 'paid' END,
    COALESCE(p_sale ->> 'status', 'Completed')
  ) ON CONFLICT (shop_id, id) DO NOTHING;

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.sales
      WHERE id = v_sale_id AND shop_id = v_shop_id AND status = 'Voided'
    ) THEN
      RAISE EXCEPTION 'A voided sale cannot be recorded again';
    END IF;
    RETURN;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_sale -> 'items', '[]'::JSONB))
  LOOP
    IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Sale item must be an object'; END IF;
    IF NULLIF(v_item ->> 'liters', '') IS NULL THEN RAISE EXCEPTION 'Sale item quantity is required'; END IF;
    IF (v_item ->> 'liters')::NUMERIC <= 0 THEN RAISE EXCEPTION 'Sale item quantity must be positive'; END IF;
    IF NULLIF(v_item ->> 'productId', '') IS NULL THEN RAISE EXCEPTION 'Sale item product is required'; END IF;

    UPDATE public.products
    SET stock_liters = stock_liters - (v_item ->> 'liters')::NUMERIC,
        sold_liters = COALESCE(sold_liters, 0) + (v_item ->> 'liters')::NUMERIC
    WHERE id = v_item ->> 'productId'
      AND shop_id = v_shop_id
      AND stock_liters >= (v_item ->> 'liters')::NUMERIC;

    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected = 0 THEN
      RAISE EXCEPTION 'Insufficient or missing stock for product %', v_item ->> 'productId';
    END IF;
  END LOOP;

  IF p_sale ->> 'payment_method' = 'Credit' THEN
    INSERT INTO public.debts (
      id, shop_id, customer_name, customer_phone, sale_id, date, total_amount,
      paid_amount, remaining_balance, due_date, status, notes
    ) VALUES (
      COALESCE(p_sale ->> 'debt_id', 'debt-' || regexp_replace(v_sale_id, '^REC-', '')),
      v_shop_id,
      COALESCE(p_sale ->> 'customer_name', 'Walk-in Customer'),
      COALESCE(p_sale ->> 'customer_phone', 'N/A'),
      v_sale_id,
      COALESCE((p_sale ->> 'date')::TIMESTAMPTZ, NOW()),
      v_total, 0, v_total, NULLIF(p_sale ->> 'credit_due_date', ''),
      'Unpaid', COALESCE(p_sale ->> 'note', 'Sale on credit')
    ) ON CONFLICT (shop_id, id) DO NOTHING;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION void_sale(p_sale_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sale public.sales%ROWTYPE;
  v_item JSONB;
  v_debt public.debts%ROWTYPE;
BEGIN
  SELECT * INTO v_sale FROM public.sales
  WHERE id = p_sale_id AND shop_id = public.current_shop_id()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found'; END IF;
  IF v_sale.status = 'Voided' THEN RETURN; END IF;

  SELECT * INTO v_debt FROM public.debts WHERE sale_id = p_sale_id AND shop_id = v_sale.shop_id FOR UPDATE;
  IF FOUND AND v_debt.paid_amount > 0 THEN
    RAISE EXCEPTION 'A credit sale with repayments cannot be voided';
  END IF;
  IF FOUND THEN DELETE FROM public.debts WHERE id = v_debt.id; END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_sale.items)
  LOOP
    UPDATE public.products
    SET stock_liters = stock_liters + (v_item ->> 'liters')::NUMERIC,
        sold_liters = GREATEST(0, COALESCE(sold_liters, 0) - (v_item ->> 'liters')::NUMERIC)
    WHERE id = v_item ->> 'productId' AND shop_id = v_sale.shop_id;
  END LOOP;

  UPDATE public.sales SET status = 'Voided', payment_status = 'voided'
  WHERE id = p_sale_id AND shop_id = v_sale.shop_id;
END;
$$;

CREATE OR REPLACE FUNCTION clear_shop_sales()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.current_shop_id() IS NULL THEN RAISE EXCEPTION 'No shop is assigned to this user'; END IF;
  DELETE FROM public.sales WHERE shop_id = public.current_shop_id();
END;
$$;

CREATE OR REPLACE FUNCTION record_debt_payment(p_payment JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_shop_id UUID := public.current_shop_id();
  v_debt public.debts%ROWTYPE;
  v_amount NUMERIC := (p_payment ->> 'amount')::NUMERIC;
BEGIN
  IF v_amount IS NULL OR v_amount <= 0 THEN RAISE EXCEPTION 'Payment must be greater than zero'; END IF;
  IF NULLIF(p_payment ->> 'id', '') IS NULL THEN RAISE EXCEPTION 'Payment ID is required'; END IF;

  SELECT * INTO v_debt FROM public.debts
  WHERE id = p_payment ->> 'debt_id' AND shop_id = v_shop_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Debt not found'; END IF;
  IF v_amount > v_debt.remaining_balance THEN RAISE EXCEPTION 'Payment exceeds remaining balance'; END IF;

  INSERT INTO public.debt_payments (id, shop_id, debt_id, amount, payment_method, note, date)
  VALUES (
    p_payment ->> 'id', v_shop_id, v_debt.id, v_amount,
    COALESCE(p_payment ->> 'payment_method', 'Cash'),
    COALESCE(p_payment ->> 'note', ''),
    COALESCE((p_payment ->> 'date')::TIMESTAMPTZ, NOW())
  ) ON CONFLICT (shop_id, id) DO NOTHING;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1 FROM public.debt_payments
      WHERE shop_id = v_shop_id AND id = p_payment ->> 'id'
        AND debt_id = v_debt.id AND amount = v_amount
    ) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'Payment ID has already been used';
  END IF;

  UPDATE public.debts
  SET paid_amount = paid_amount + v_amount,
      remaining_balance = remaining_balance - v_amount,
      status = CASE WHEN remaining_balance - v_amount <= 0 THEN 'Settled' ELSE 'Partially Paid' END
  WHERE id = v_debt.id AND shop_id = v_shop_id;
END;
$$;

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_config ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('shops', 'shop_members', 'products', 'sales', 'debts', 'debt_payments', 'expenses', 'shop_config')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', v_policy.policyname, v_policy.schemaname, v_policy.tablename);
  END LOOP;
END;
$$;

CREATE POLICY shop_members_read_self ON shop_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY shops_read_member ON shops
  FOR SELECT TO authenticated USING (id = public.current_shop_id());

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['products', 'sales', 'debts', 'debt_payments', 'expenses', 'shop_config']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id())',
      v_table || '_shop_isolation',
      v_table
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION ensure_user_shop(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_user_shop(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION current_shop_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_shop_id() TO authenticated;
REVOKE ALL ON FUNCTION record_sale(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_sale(JSONB) TO authenticated;
REVOKE ALL ON FUNCTION void_sale(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION void_sale(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION clear_shop_sales() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clear_shop_sales() TO authenticated;
REVOKE ALL ON FUNCTION record_debt_payment(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_debt_payment(JSONB) TO authenticated;

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['products', 'sales', 'debts', 'debt_payments', 'expenses', 'shop_config']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
    END IF;
  END LOOP;
END;
$$;
