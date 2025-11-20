#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# SAFETY CHECK: Prevent accidental production database drop
if [ "$NODE_ENV" = "production" ]; then
    echo "❌ BLOCKED: Cannot drop database in production environment"
    echo "   NODE_ENV=production detected"
    echo "   This script is ONLY for development databases"
    echo ""
    echo "   If you need to reset production:"
    echo "   1. Create a backup first"
    echo "   2. Use migration-based schema updates"
    echo "   3. Never drop production data"
    echo ""
    exit 1
fi

if [[ "$DB_NAME" == *"prod"* ]] || [[ "$DB_NAME" == *"production"* ]]; then
    echo "❌ BLOCKED: Production database name detected"
    echo "   DB_NAME=\"$DB_NAME\" contains 'prod' or 'production'"
    echo "   This script is ONLY for development databases"
    echo ""
    echo "   To protect production data:"
    echo "   - Development: crearis_admin_dev or crearis_dev"
    echo "   - Production: crearis_db or crearis_production"
    echo ""
    exit 1
fi

echo "✅ Environment check passed (development mode)"
echo ""

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
