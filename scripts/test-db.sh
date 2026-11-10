#!/usr/bin/env bash
# Runs supabase_schema.sql twice (to prove it is re-runnable) on a throwaway
# Postgres container, then runs the permission and stock tests.
set -euo pipefail
cd "$(dirname "$0")/.."

NAME="sukie-db-test-$$"
PORT="${SUKIE_TEST_DB_PORT:-55439}"
export PGPASSWORD=test

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=test -p "$PORT:5432" postgres:16-alpine >/dev/null
for _ in $(seq 1 60); do
  psql -h localhost -p "$PORT" -U postgres -c 'select 1' >/dev/null 2>&1 && break
  sleep 1
done

PSQL=(psql -h localhost -p "$PORT" -U postgres -q -v ON_ERROR_STOP=1 --set=client_min_messages=warning)
"${PSQL[@]}" -f supabase/tests/00_supabase_stub.sql 2>/dev/null
"${PSQL[@]}" -c "SET client_min_messages = warning" -f supabase_schema.sql >/dev/null
echo "Schema applied."
"${PSQL[@]}" -f supabase_schema.sql >/dev/null 2>&1
echo "Schema re-applied (idempotent)."
psql -h localhost -p "$PORT" -U postgres -q -v ON_ERROR_STOP=1 -f supabase/tests/10_permissions_test.sql 2>&1 \
  | sed -n -e 's/^.*NOTICE:  //p' -e '/ERROR/p' -e '/All database checks passed/p'
