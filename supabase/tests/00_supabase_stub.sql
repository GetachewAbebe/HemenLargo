-- Minimal stand-in for the Supabase auth schema so supabase_schema.sql can run on plain Postgres.
-- auth.uid() reads the request.uid setting, which tests set to impersonate a user.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE SQL STABLE AS $$ SELECT NULLIF(current_setting('request.uid', true), '')::UUID $$;
CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE SQL STABLE AS $$ SELECT '{}'::JSONB $$;
GRANT USAGE ON SCHEMA auth, public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;
CREATE PUBLICATION supabase_realtime;

-- Supabase grants EXECUTE on new public functions to anon and authenticated by default,
-- so REVOKE ... FROM PUBLIC alone does not lock a function down. Reproduce that here.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
