#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

export PGPASSWORD="$DB_PASSWORD"

echo "🗑️  Dropping database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
" 2>/dev/null

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

if [ $? -eq 0 ]; then
    echo "✅ Database recreated"
else
    echo "❌ Failed to recreate database"
    exit 1
fi

echo ""
echo "🔄 Running migrations..."

export DATABASE_TYPE=postgresql

pnpm db:migrate
