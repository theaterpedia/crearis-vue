#!/bin/bash

# PostgreSQL Database Setup Script
# Creates database and required extensions with proper permissions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-crearis_admin_dev}"
DB_USER="${DB_USER:-postgres}"
SUPERUSER="${SUPERUSER:-postgres}"

echo -e "${BLUE}=== PostgreSQL Database Setup ===${NC}\n"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "   Start PostgreSQL first: sudo systemctl start postgresql"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}\n"

# Function to run SQL as superuser
run_sql_as_superuser() {
    psql -U "$SUPERUSER" -d "$1" -c "$2" 2>/dev/null
}

# Check if database exists
if psql -U "$SUPERUSER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # SAFETY CHECK: Prevent rebuild in production
        if [ "$NODE_ENV" = "production" ]; then
            echo -e "${RED}❌ BLOCKED: Cannot rebuild database in production${NC}"
            echo -e "${YELLOW}   Rebuild option is ONLY for development${NC}"
            exit 1
        fi
        
        if [[ "$DB_NAME" == *"prod"* ]] || [[ "$DB_NAME" == *"production"* ]]; then
            echo -e "${RED}❌ BLOCKED: Production database detected${NC}"
            echo -e "${YELLOW}   DB_NAME=\"$DB_NAME\" contains 'prod' or 'production'${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🗑️  Dropping database '$DB_NAME'...${NC}"
        psql -U "$SUPERUSER" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    else
        echo -e "${BLUE}👍 Keeping existing database${NC}"
        echo -e "${BLUE}🔧 Ensuring extensions are installed...${NC}"
        run_sql_as_superuser "$DB_NAME" "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
        echo -e "${GREEN}✅ Extensions verified${NC}"
        exit 0
    fi
fi

# Create database
echo -e "${BLUE}📦 Creating database '$DB_NAME'...${NC}"
psql -U "$SUPERUSER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

# Create extensions (requires superuser)
echo -e "${BLUE}🔧 Installing required extensions...${NC}"
run_sql_as_superuser "$DB_NAME" "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

echo -e "${GREEN}✅ pgcrypto extension installed${NC}"

# Grant permissions to application user if different from superuser
if [ "$DB_USER" != "$SUPERUSER" ]; then
    echo -e "${BLUE}🔐 Granting permissions to user '$DB_USER'...${NC}"
    psql -U "$SUPERUSER" -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
    psql -U "$SUPERUSER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    echo -e "${GREEN}✅ Permissions granted${NC}"
fi

echo -e "\n${GREEN}🎉 Database setup complete!${NC}"
echo -e "${BLUE}Database:${NC} $DB_NAME"
echo -e "${BLUE}Extensions:${NC} pgcrypto"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Set environment variables (if needed):"
echo "     export DATABASE_TYPE=postgresql"
echo "     export DATABASE_URL=\"postgresql://$DB_USER@localhost:5432/$DB_NAME\""
echo ""
echo "  2. Start the application:"
echo "     pnpm dev"
echo ""
echo "  The application will automatically run migrations and seed data."
