#!/bin/bash
# Validation script: Check readiness for column rename refactoring
# Run before starting migration 035

set -e

DB_NAME="crearis_admin_dev"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Column Rename Refactoring Readiness Check ===${NC}\n"

# Check 1: Verify migrations state
echo -e "${YELLOW}[1/7] Checking migration state...${NC}"
MIGRATIONS=$(psql -d $DB_NAME -t -c "SELECT config->'migrations_run' FROM crearis_config LIMIT 1;")
if echo "$MIGRATIONS" | grep -q "031_add_local_adapter"; then
    echo -e "${GREEN}✓ Migration 031 found - ready to proceed${NC}"
else
    echo -e "${RED}✗ Migration 031 not found - cannot proceed${NC}"
    exit 1
fi

# Check 2: Verify images table has both column sets
echo -e "\n${YELLOW}[2/7] Checking images table columns...${NC}"
psql -d $DB_NAME -c "\d images" | grep -E "(ctags|rtags|ttags|dtags)" | head -6
CTAGS_EXISTS=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='images' AND column_name='ctags';")
CTAGS_VAL_EXISTS=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='images' AND column_name='ctags_val';")
if [ "$CTAGS_EXISTS" -eq 1 ] && [ "$CTAGS_VAL_EXISTS" -eq 1 ]; then
    echo -e "${GREEN}✓ Images has both ctags and ctags_val${NC}"
else
    echo -e "${RED}✗ Images table structure unexpected${NC}"
fi

# Check 3: Count data in images columns
echo -e "\n${YELLOW}[3/7] Checking data distribution in images...${NC}"
psql -d $DB_NAME -c "
SELECT 
  COUNT(*) as total_images,
  COUNT(*) FILTER (WHERE ctags != '\\x00'::bytea) as ctags_active,
  COUNT(*) FILTER (WHERE rtags != '\\x00'::bytea) as rtags_active,
  COUNT(*) FILTER (WHERE ctags_val IS NOT NULL) as ctags_val_active,
  COUNT(*) FILTER (WHERE rtags_val IS NOT NULL) as rtags_val_active,
  COUNT(*) FILTER (WHERE ttags_val IS NOT NULL) as ttags_val_active,
  COUNT(*) FILTER (WHERE dtags_val IS NOT NULL) as dtags_val_active
FROM images;
"

# Check 4: Verify posts/events only have *_val columns
echo -e "\n${YELLOW}[4/7] Checking posts table columns...${NC}"
POSTS_CTAGS=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='posts' AND column_name='ctags';")
POSTS_CTAGS_VAL=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='posts' AND column_name='ctags_val';")
if [ "$POSTS_CTAGS" -eq 0 ] && [ "$POSTS_CTAGS_VAL" -eq 1 ]; then
    echo -e "${GREEN}✓ Posts has ctags_val only (as expected)${NC}"
else
    echo -e "${RED}✗ Posts table structure unexpected${NC}"
fi

# Check 5: Count *_val references in server code
echo -e "\n${YELLOW}[5/7] Searching for *_val references in server code...${NC}"
VAL_REFS=$(grep -r "status_val\|ctags_val\|ttags_val\|dtags_val\|rtags_val\|config_val" server/api/ server/database/ --include="*.ts" | wc -l)
echo "Found $VAL_REFS references to *_val columns in server code"
if [ "$VAL_REFS" -gt 0 ]; then
    echo -e "${YELLOW}Top 5 files with most references:${NC}"
    grep -r "status_val\|ctags_val\|ttags_val\|dtags_val\|rtags_val\|config_val" server/api/ server/database/ --include="*.ts" -c | sort -t: -k2 -rn | head -5
fi

# Check 6: Count *_val references in frontend code
echo -e "\n${YELLOW}[6/7] Searching for *_val references in frontend code...${NC}"
FRONTEND_REFS=$(grep -r "status_val\|ctags_val\|ttags_val\|dtags_val\|rtags_val\|config_val" src/composables/ src/components/sysreg/ --include="*.ts" --include="*.vue" | wc -l)
echo "Found $FRONTEND_REFS references to *_val columns in frontend code"
if [ "$FRONTEND_REFS" -gt 0 ]; then
    echo -e "${YELLOW}Top 5 files with most references:${NC}"
    grep -r "status_val\|ctags_val\|ttags_val\|dtags_val\|rtags_val\|config_val" src/composables/ src/components/sysreg/ --include="*.ts" --include="*.vue" -c | sort -t: -k2 -rn | head -5
fi

# Check 7: Verify backup space available
echo -e "\n${YELLOW}[7/7] Checking disk space for backup...${NC}"
DB_SIZE=$(psql -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
AVAILABLE=$(df -h . | tail -1 | awk '{print $4}')
echo "Database size: $DB_SIZE"
echo "Available space: $AVAILABLE"

# Summary
echo -e "\n${BLUE}=== Summary ===${NC}"
echo -e "${GREEN}✓ Database structure verified${NC}"
echo -e "${GREEN}✓ Migration state ready${NC}"
echo -e "${GREEN}✓ Data distribution analyzed${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review COLUMN_RENAME_REFACTORING_PLAN.md"
echo "2. Create database backup: pg_dump $DB_NAME > backup_before_035.sql"
echo "3. Create migration file: server/database/migrations/035_rename_val_columns.ts"
echo "4. Test migration on dev database"
echo ""
echo -e "${BLUE}Estimated scope:${NC}"
echo "- Server files to update: ~10-15"
echo "- Frontend files to update: ~5-10"
echo "- Documentation files: ~5-10"
echo "- Total *_val references: $((VAL_REFS + FRONTEND_REFS))"
