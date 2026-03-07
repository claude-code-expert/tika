#!/bin/bash
# dump-schema.sh — Query live PostgreSQL schema and index information
# Usage: ./scripts/dump-schema.sh
# Reads POSTGRES_URL from .env.local

set -e

ENV_FILE="$(dirname "$0")/../.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep POSTGRES_URL | xargs)
fi

if [ -z "$POSTGRES_URL" ]; then
  echo "Error: POSTGRES_URL not found in .env.local" >&2
  exit 1
fi

echo "=== TABLES ==="
psql "$POSTGRES_URL" -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
"

echo ""
echo "=== COLUMNS ==="
psql "$POSTGRES_URL" -c "
SELECT c.table_name, c.column_name, c.data_type,
       c.character_maximum_length, c.column_default, c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
"

echo ""
echo "=== INDEXES ==="
psql "$POSTGRES_URL" -c "
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"

echo ""
echo "=== FOREIGN KEYS ==="
psql "$POSTGRES_URL" -c "
SELECT
  tc.table_name AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column,
  rc.delete_rule AS on_delete
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
"
