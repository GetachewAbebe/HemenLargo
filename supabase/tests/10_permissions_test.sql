-- Assertion-based checks for stock handling, roles, the audit log and shop isolation.
-- Run with: npm run test:db  (requires Docker)
\set ON_ERROR_STOP 1

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
INSERT INTO auth.users VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000002'),
  ('bbbbbbbb-0000-0000-0000-000000000003');

CREATE FUNCTION pg_temp.expect(p_ok BOOLEAN, p_what TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF p_ok IS NOT TRUE THEN RAISE EXCEPTION 'FAILED: %', p_what; END IF;
  RAISE NOTICE 'ok - %', p_what;
END;
$$;

CREATE FUNCTION pg_temp.expect_error(p_sql TEXT, p_pattern TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION 'FAILED: expected error "%" from: %', p_pattern, p_sql;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'FAILED:%' THEN RAISE; END IF;
  IF SQLERRM NOT ILIKE '%' || p_pattern || '%' THEN
    RAISE EXCEPTION 'FAILED: expected error "%" but got "%"', p_pattern, SQLERRM;
  END IF;
  RAISE NOTICE 'ok - rejected: %', p_pattern;
END;
$$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pg_temp TO authenticated;

-- Owner creates a shop; a cashier is added to it.
SET ROLE authenticated;
SELECT set_config('request.uid', 'aaaaaaaa-0000-0000-0000-000000000001', false);
SELECT ensure_user_shop('Owner Shop') AS owner_shop \gset
RESET ROLE;
INSERT INTO shop_members (user_id, shop_id, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000002', :'owner_shop', 'cashier');
SET ROLE authenticated;

-- Stock: editing a product never overwrites stock; restocks are deltas and idempotent.
SELECT upsert_product('{"id":"p1","name":"Largo","price_per_liter":110,"cost_per_liter":60,"stock_liters":50}');
SELECT upsert_product('{"id":"p1","name":"Largo","price_per_liter":120,"cost_per_liter":60,"stock_liters":999}');
SELECT pg_temp.expect((SELECT stock_liters = 50 AND price_per_liter = 120 FROM products WHERE id = 'p1'),
  'product edit with stale stock keeps server stock');
SELECT restock_product('r1', 'p1', 10, 90);
SELECT restock_product('r1', 'p1', 10, 90);
-- 50 L @ 60 + 10 L @ 90 = 60 L @ 65 (weighted average)
SELECT pg_temp.expect((SELECT stock_liters = 60 AND cost_per_liter = 65 FROM products WHERE id = 'p1'),
  'restock adds liters once even when retried, blending cost per liter');

-- Cashier: can sell, take credit, record payments, add debts and expenses.
SELECT set_config('request.uid', 'aaaaaaaa-0000-0000-0000-000000000002', false);
SELECT record_sale('{"id":"REC-1","total":240,"payment_method":"Cash","items":[{"productId":"p1","liters":2}]}');
SELECT record_sale('{"id":"REC-2","total":100,"payment_method":"Credit","customer_name":"Abebe","items":[{"productId":"p1","liters":1}]}');
SELECT pg_temp.expect((SELECT stock_liters = 57 FROM products WHERE id = 'p1'), 'cashier sales deduct stock');
SELECT record_debt_payment('{"id":"pay1","debt_id":"debt-2","amount":40}');
SELECT pg_temp.expect((SELECT remaining_balance = 60 FROM debts WHERE id = 'debt-2'), 'cashier repayment updates balance');
SELECT create_manual_debt('{"id":"d9","customer_name":"Kebede","total_amount":300,"paid_amount":300,"remaining_balance":0}');
SELECT pg_temp.expect((SELECT paid_amount = 0 AND remaining_balance = 300 FROM debts WHERE id = 'd9'),
  'manual debt ignores client-supplied balances');
INSERT INTO expenses (id, title, amount) VALUES ('e1', 'Bottles', 50);
SELECT pg_temp.expect_error($$SELECT record_sale('{"id":"REC-3","total":1,"items":[{"productId":"p1","liters":1000}]}')$$,
  'Insufficient or missing stock');

-- Cashier: blocked from owner-only actions.
SELECT pg_temp.expect_error($$SELECT void_sale('REC-1')$$, 'Only the shop owner can void sales');
SELECT pg_temp.expect_error($$SELECT clear_shop_sales()$$, 'Only the shop owner can clear sales');
SELECT pg_temp.expect_error($$SELECT upsert_product('{"id":"p1","name":"X","price_per_liter":1}')$$, 'Only the shop owner can change products');
SELECT pg_temp.expect_error($$SELECT restock_product('r2','p1',5)$$, 'Only the shop owner can restock products');
DELETE FROM products;
UPDATE debts SET remaining_balance = 0;
DELETE FROM expenses;
UPDATE products SET stock_liters = 0;
SELECT pg_temp.expect((SELECT count(*) = 1 FROM products), 'cashier cannot delete products');
SELECT pg_temp.expect((SELECT stock_liters = 57 FROM products WHERE id = 'p1'), 'cashier cannot edit stock directly');
SELECT pg_temp.expect((SELECT sum(remaining_balance) = 360 FROM debts), 'cashier cannot edit debt balances');
SELECT pg_temp.expect((SELECT count(*) = 1 FROM expenses), 'cashier cannot delete expenses');
SELECT pg_temp.expect((SELECT count(*) = 0 FROM audit_log), 'cashier cannot read the audit log');

-- Owner: void and delete are allowed and audited.
SELECT set_config('request.uid', 'aaaaaaaa-0000-0000-0000-000000000001', false);
SELECT void_sale('REC-1');
DELETE FROM expenses WHERE id = 'e1';
SELECT pg_temp.expect((SELECT stock_liters = 59 FROM products WHERE id = 'p1'), 'void restores stock');
SELECT pg_temp.expect((SELECT count(*) = 1 FROM audit_log WHERE action = 'void_sale' AND record_id = 'REC-1'), 'void is audited');
SELECT pg_temp.expect((SELECT count(*) = 1 FROM audit_log WHERE action = 'delete' AND table_name = 'expenses'), 'delete keeps a copy in the audit log');
SELECT pg_temp.expect((SELECT count(*) = 1 FROM audit_log WHERE action = 'restock'), 'restock is audited');

-- Another shop sees nothing and cannot act on this shop's data.
SELECT set_config('request.uid', 'bbbbbbbb-0000-0000-0000-000000000003', false);
SELECT ensure_user_shop('Other Shop');
SELECT pg_temp.expect((SELECT count(*) = 0 FROM products) AND (SELECT count(*) = 0 FROM sales)
  AND (SELECT count(*) = 0 FROM debts) AND (SELECT count(*) = 0 FROM audit_log), 'other shop sees no rows');
SELECT pg_temp.expect_error($$SELECT void_sale('REC-2')$$, 'Sale not found');
SELECT pg_temp.expect_error($$SELECT restock_product('r3','p1',5)$$, 'was not found');

-- Internal helpers cannot be called directly through the API.
SELECT pg_temp.expect_error(
  format($$SELECT write_audit_log(%L, 'fake', 'sales', 'x', '{}')$$, :'owner_shop'),
  'permission denied');
SELECT pg_temp.expect((SELECT NOT has_function_privilege('anon', 'record_sale(jsonb)', 'EXECUTE')),
  'anonymous visitors cannot call shop functions');

\echo 'All database checks passed.'
