#!/bin/bash
#
# Production Database Backup Script
# Creates timestamped PostgreSQL dump with compression
# 
# Usage:
#   bash scripts/backup-production-db.sh [backup_name]
#
# Examples:
#   bash scripts/backup-production-db.sh                    # Auto-named with timestamp
#   bash scripts/backup-production-db.sh pre_deployment    # Custom name
#
# Environment Variables (from .env or environment):
#   DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT
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

# Load environment variables from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep -v '^$' | xargs)
fi

# Database configuration
DB_USER="${DB_USER:-crearis_admin}"
DB_NAME="${DB_NAME:-crearis_admin_prod}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/crearis/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Custom backup name or timestamp
if [ -n "$1" ]; then
    BACKUP_NAME="db_backup_${1}_$(date +%Y%m%d_%H%M%S)"
else
    BACKUP_NAME="db_backup_$(date +%Y%m%d_%H%M%S)"
fi

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Display header
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║          🗄️  PostgreSQL Database Backup                         ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Database:${NC}        $DB_NAME"
echo -e "${BLUE}User:${NC}            $DB_USER"
echo -e "${BLUE}Host:${NC}            $DB_HOST:$DB_PORT"
echo -e "${BLUE}Backup Location:${NC} $BACKUP_DIR"
echo -e "${BLUE}Retention:${NC}       $RETENTION_DAYS days"
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""

# Check if PostgreSQL is accessible
echo -e "${BLUE}🔍 Checking database connection...${NC}"
if ! psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    echo -e "${YELLOW}   Check DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT${NC}"
    echo -e "${YELLOW}   Ensure PostgreSQL is running${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Database accessible${NC}"
echo ""

# Create backup
echo -e "${BLUE}📦 Creating backup...${NC}"
echo -e "${YELLOW}   This may take a few minutes for large databases${NC}"
echo ""

START_TIME=$(date +%s)

# Perform backup with compression
# --no-owner: Don't include ownership commands (for portability)
# --no-acl: Don't include access privileges (for portability)
# -F p: Plain text format (SQL statements)
if pg_dump -U "$DB_USER" \
           -h "$DB_HOST" \
           -p "$DB_PORT" \
           -d "$DB_NAME" \
           -F p \
           --no-owner \
           --no-acl \
           2>/tmp/backup_error.log \
           | gzip > "$BACKUP_FILE"; then
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo -e "${GREEN}   ✅ Backup created: ${BACKUP_NAME}.sql.gz${NC}"
    echo -e "${GREEN}   Size: ${BACKUP_SIZE}${NC}"
    echo -e "${GREEN}   Duration: ${DURATION}s${NC}"
    
    # Verify backup integrity
    echo ""
    echo -e "${BLUE}🔍 Verifying backup integrity...${NC}"
    if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}   ✅ Backup file is valid${NC}"
    else
        echo -e "${RED}   ❌ Warning: Backup file may be corrupted${NC}"
        echo -e "${YELLOW}   Consider creating another backup${NC}"
    fi
else
    echo -e "${RED}❌ Error: Backup failed${NC}"
    if [ -f /tmp/backup_error.log ]; then
        echo -e "${RED}Error details:${NC}"
        cat /tmp/backup_error.log
    fi
    exit 1
fi

# Set secure permissions
chmod 600 "$BACKUP_FILE"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""

# Clean up old backups
echo -e "${BLUE}🗑️  Cleaning old backups (keeping last $RETENTION_DAYS days)...${NC}"

# Find and remove old backup files
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null)

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r old_file; do
        FILENAME=$(basename "$old_file")
        FILESIZE=$(du -h "$old_file" | cut -f1)
        rm -f "$old_file"
        echo -e "${YELLOW}   Removed: ${FILENAME} (${FILESIZE})${NC}"
    done
    
    REMOVED_COUNT=$(echo "$OLD_BACKUPS" | wc -l)
    echo -e "${GREEN}   ✅ Removed $REMOVED_COUNT old backup(s)${NC}"
else
    echo -e "${GREEN}   ✅ No old backups to remove${NC}"
fi

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Backup complete!${NC}"
echo ""
echo -e "${BLUE}Backup file:${NC}"
echo -e "   ${BACKUP_FILE}"
echo ""
echo -e "${BLUE}To download to dev box:${NC}"
echo -e "   ${YELLOW}scp user@production:${BACKUP_FILE} ~/backups/${NC}"
echo ""
echo -e "${BLUE}To restore on dev box:${NC}"
echo -e "   ${YELLOW}bash scripts/restore-from-production.sh ~/backups/${BACKUP_NAME}.sql.gz${NC}"
echo ""
echo "══════════════════════════════════════════════════════════════════"

# Optional: Send notification (uncomment and configure)
# curl -X POST https://your-monitoring-service.com/notify \
#      -d "Backup completed: ${BACKUP_NAME}.sql.gz (${BACKUP_SIZE})"

exit 0
