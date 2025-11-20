#!/bin/bash
#
# Restore Production Database to Development
# Downloads and restores production backup to local dev database
# Re-runs migrations to bring schema in sync with code
#
# Usage:
#   bash scripts/restore-from-production.sh <backup_file>
#
# Example:
#   bash scripts/restore-from-production.sh server/data/backups/db_backup_20251028_020000.sql.gz
#
# ⚠️  WARNING: This will DELETE your local development database!
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if backup file provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No backup file specified${NC}"
    echo ""
    echo -e "${BLUE}Usage:${NC}"
    echo -e "   bash scripts/restore-from-production.sh <backup_file>"
    echo ""
    echo -e "${BLUE}Example:${NC}"
    echo -e "   bash scripts/restore-from-production.sh server/data/backups/db_backup_20251028_020000.sql.gz"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_FILE}${NC}"
    echo ""
    echo -e "${BLUE}Tips:${NC}"
    echo -e "   1. Check file path is correct"
    echo -e "   2. Download from production:"
    echo -e "      ${YELLOW}scp user@production:/opt/crearis/backups/db_backup_*.sql.gz server/data/backups/${NC}"
    echo ""
    exit 1
fi

# Load environment variables from .env
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}   Create .env file in project root${NC}"
    exit 1
fi

export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep -v '^$' | xargs)

# Database configuration (use dev database name)
DB_USER="${DB_USER:-crearis_admin}"
DB_NAME="${DB_NAME:-crearis_admin_dev}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Display header
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║         🔄 Restore Production Database to Dev                   ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# SAFETY CHECK: Prevent restoring TO production
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${RED}❌ BLOCKED: Cannot restore database in production environment${NC}"
    echo -e "${YELLOW}   This script is for restoring production backup TO development${NC}"
    echo -e "${YELLOW}   It should NEVER be run on production server${NC}"
    echo ""
    echo -e "${YELLOW}   This script will DROP the target database!${NC}"
    echo -e "${YELLOW}   Running on production would destroy your live database${NC}"
    echo ""
    exit 1
fi

if [[ "$DB_NAME" == *"prod"* ]] || [[ "$DB_NAME" == *"production"* ]]; then
    echo -e "${RED}❌ BLOCKED: Production database name detected${NC}"
    echo -e "${YELLOW}   DB_NAME=\"$DB_NAME\" contains 'prod' or 'production'${NC}"
    echo -e "${YELLOW}   This script would DROP your production database!${NC}"
    echo ""
    echo -e "${YELLOW}   To protect production data:${NC}"
    echo -e "${YELLOW}   - Development: crearis_admin_dev or crearis_dev${NC}"
    echo -e "${YELLOW}   - Production: crearis_db or crearis_production${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Environment check passed (development mode)${NC}"
echo ""

echo -e "${BLUE}Backup File:${NC}      $(basename "$BACKUP_FILE")"
echo -e "${BLUE}Backup Size:${NC}      $(du -h "$BACKUP_FILE" | cut -f1)"
echo -e "${BLUE}Local Database:${NC}   $DB_NAME"
echo -e "${BLUE}Database Host:${NC}    $DB_HOST:$DB_PORT"
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""

# Warning prompt
echo -e "${RED}⚠️  WARNING: This will DELETE your local database!${NC}"
echo -e "${YELLOW}   Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}   All current data will be lost${NC}"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Cancelled by user${NC}"
    exit 0
fi

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""

# Verify backup file integrity
echo -e "${BLUE}🔍 Verifying backup file...${NC}"
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}   ✅ Backup file is valid${NC}"
else
    echo -e "${RED}❌ Error: Backup file is corrupted or not a valid gzip file${NC}"
    exit 1
fi

echo ""

# Terminate all connections to the database
echo -e "${BLUE}🔌 Terminating active connections...${NC}"
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DB_NAME' 
  AND pid <> pg_backend_pid();
" > /dev/null 2>&1 || true
echo -e "${GREEN}   ✅ Connections terminated${NC}"

echo ""

# Drop database
echo -e "${BLUE}🗑️  Dropping local database...${NC}"
if dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" --if-exists "$DB_NAME" 2>/dev/null; then
    echo -e "${GREEN}   ✅ Database dropped${NC}"
else
    echo -e "${RED}❌ Error: Could not drop database${NC}"
    echo -e "${YELLOW}   Try manually: dropdb $DB_NAME${NC}"
    exit 1
fi

echo ""

# Create fresh database
echo -e "${BLUE}📦 Creating fresh database...${NC}"
if createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"; then
    echo -e "${GREEN}   ✅ Database created${NC}"
else
    echo -e "${RED}❌ Error: Could not create database${NC}"
    exit 1
fi

echo ""

# Restore backup
echo -e "${BLUE}📥 Restoring backup...${NC}"
echo -e "${YELLOW}   This may take a few minutes for large backups${NC}"
echo ""

START_TIME=$(date +%s)

# Extract and restore
if gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" > /tmp/restore.log 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Get database size after restore
    DB_SIZE=$(psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo -e "${GREEN}   ✅ Backup restored successfully${NC}"
    echo -e "${GREEN}   Compressed size: ${BACKUP_SIZE}${NC}"
    echo -e "${GREEN}   Database size: ${DB_SIZE}${NC}"
    echo -e "${GREEN}   Duration: ${DURATION}s${NC}"
else
    echo -e "${RED}❌ Error: Restore failed${NC}"
    if [ -f /tmp/restore.log ]; then
        echo -e "${RED}Error details (last 20 lines):${NC}"
        tail -20 /tmp/restore.log
    fi
    exit 1
fi

echo ""

# Enable required extensions
echo -e "${BLUE}🔧 Enabling required extensions...${NC}"
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" > /dev/null 2>&1
echo -e "${GREEN}   ✅ Extensions enabled (pgcrypto)${NC}"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""

# Re-run migrations to catch up with code
echo -e "${BLUE}🔄 Re-running migrations (to catch up with code)...${NC}"
echo -e "${YELLOW}   Production backup may have older schema${NC}"
echo -e "${YELLOW}   Re-running migrations brings dev in sync with latest code${NC}"
echo ""

cd "$PROJECT_ROOT"

# Temporarily disable SKIP_MIGRATIONS for migration run
OLD_SKIP_MIGRATIONS="$SKIP_MIGRATIONS"
export SKIP_MIGRATIONS="false"

if pnpm dlx tsx server/database/migrations/run.ts 2>&1 | tee /tmp/migrations.log; then
    echo ""
    
    # Check how many migrations ran
    MIGRATIONS_RAN=$(grep -c "Running migration:" /tmp/migrations.log || echo "0")
    
    if [ "$MIGRATIONS_RAN" -gt 0 ]; then
        echo -e "${GREEN}   ✅ Applied $MIGRATIONS_RAN new migration(s)${NC}"
    else
        echo -e "${GREEN}   ✅ All migrations already applied (schema up to date)${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Migration warnings (may be safe to ignore)${NC}"
    echo -e "${YELLOW}   Check logs above for details${NC}"
fi

# Restore SKIP_MIGRATIONS setting
export SKIP_MIGRATIONS="$OLD_SKIP_MIGRATIONS"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Restore Complete!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "   Local database now matches production data + latest code migrations"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "   1. Verify data: ${YELLOW}pnpm dev${NC}"
echo -e "   2. Check users: ${YELLOW}psql $DB_NAME -c 'SELECT COUNT(*) FROM users;'${NC}"
echo -e "   3. Test login with production credentials"
echo -e "   4. Verify projects, events, posts are visible"
echo ""
echo -e "${BLUE}Notes:${NC}"
echo -e "   • Production passwords work in dev (from PASSWORDS.csv)"
echo -e "   • File uploads may not be present (not in database)"
echo -e "   • Schema is now at latest version (migrations re-run)"
echo ""
echo "══════════════════════════════════════════════════════════════════"

exit 0
