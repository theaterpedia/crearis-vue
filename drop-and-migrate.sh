#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PostgreSQL Database Drop & Migration Test                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Database connection details
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="crearis_admin"
DB_NAME="crearis_admin_dev"
export PGPASSWORD="crearis_secure_2024"

echo -e "${YELLOW}⚠️  WARNING: This will completely drop and recreate the database!${NC}"
echo -e "${YELLOW}   Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}   Host: ${DB_HOST}:${DB_PORT}${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}❌ Operation cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 1: Dropping existing database${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Terminate existing connections
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres << SQL
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${DB_NAME}'
  AND pid <> pg_backend_pid();
SQL

# Drop the database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres << SQL
DROP DATABASE IF EXISTS ${DB_NAME};
SQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database dropped successfully${NC}"
else
    echo -e "${RED}❌ Failed to drop database${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 2: Creating fresh database${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres << SQL
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
SQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 3: Running migrations${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

export DATABASE_TYPE=postgresql
export POSTGRES_HOST=$DB_HOST
export POSTGRES_PORT=$DB_PORT
export POSTGRES_USER=$DB_USER
export POSTGRES_PASSWORD=$PGPASSWORD
export POSTGRES_DB=$DB_NAME

pnpm db:migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Migrations failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 4: Verification - Checking tables${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'SQL'
\dt
SQL

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 5: Checking seeded data${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${GREEN}📊 TLDs:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT * FROM tlds ORDER BY name;"

echo ""
echo -e "${GREEN}📊 Sysdomains:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, domain, tld, subdomain, domainstring FROM sysdomains ORDER BY id;"

echo ""
echo -e "${GREEN}📊 Users:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, username, role, created_at FROM users ORDER BY id;"

echo ""
echo -e "${GREEN}📊 Projects:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, name, type, owner_id, is_company FROM projects ORDER BY id;"

echo ""
echo -e "${GREEN}📊 Locations with project links:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, name, project_id FROM locations WHERE id LIKE '_demo.%' LIMIT 5;"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Database Drop & Migration Test Complete!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

# Cleanup
unset PGPASSWORD
