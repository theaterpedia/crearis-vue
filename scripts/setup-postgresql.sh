#!/bin/bash

# PostgreSQL Automated Setup Script for demo-data project
# Stage C: Automated PostgreSQL Configuration
# 
# This script:
# 1. Checks PostgreSQL installation and status
# 2. Creates/validates .env configuration file
# 3. Tests database connection
# 4. Creates database and user if needed (with user permission)

set -e  # Exit on error (but we'll handle errors explicitly)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_USER="crearis_admin"
DEFAULT_DB_NAME="crearis_admin"
DEFAULT_HOST="localhost"
DEFAULT_PORT="5432"
DEFAULT_SUPERUSER="postgres"

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}$1${NC}"
}

# Step 1: Check PostgreSQL installation and status
check_postgresql() {
    print_section "🔍 Checking PostgreSQL installation..."
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed!"
        echo ""
        echo "Please install PostgreSQL first:"
        echo ""
        echo "Ubuntu/Debian:"
        echo "  sudo apt update"
        echo "  sudo apt install postgresql postgresql-contrib"
        echo ""
        echo "macOS (Homebrew):"
        echo "  brew install postgresql@15"
        echo ""
        echo "Fedora/RHEL:"
        echo "  sudo dnf install postgresql-server postgresql-contrib"
        echo ""
        echo "For more details, see: docs/postgresql/STAGE-C-SETUP-GUIDE.md"
        exit 1
    fi
    
    print_success "PostgreSQL is installed: $(which psql)"
    
    # Check if PostgreSQL server is running
    print_section "🔍 Checking if PostgreSQL server is running..."
    
    if ! pg_isready -q; then
        print_error "PostgreSQL server is not running!"
        echo ""
        echo "Please start PostgreSQL:"
        echo ""
        echo "Linux (systemd):"
        echo "  sudo systemctl start postgresql"
        echo ""
        echo "macOS (Homebrew):"
        echo "  brew services start postgresql@15"
        echo ""
        echo "Manual start:"
        echo "  pg_ctl -D /path/to/data start"
        echo ""
        echo "For more details, see: docs/postgresql/STAGE-C-SETUP-GUIDE.md"
        exit 1
    fi
    
    print_success "PostgreSQL server is running and accepting connections"
}

# Step 2: Create or validate .env file
setup_environment() {
    print_section "📝 Setting up environment configuration..."
    
    if [ -f .env ]; then
        print_info ".env file already exists"
        
        # Check if it has the required variables
        if grep -q "DATABASE_TYPE" .env && \
           grep -q "DB_USER" .env && \
           grep -q "DB_PASSWORD" .env && \
           grep -q "DB_NAME" .env && \
           grep -q "DB_HOST" .env && \
           grep -q "DB_PORT" .env; then
            print_success ".env file contains all required variables"
            
            # Load environment variables
            export $(grep -v '^#' .env | xargs)
            
            return 0
        else
            print_warning ".env file is incomplete"
            echo "Would you like to recreate it? (y/n): "
            read -r recreate
            
            if [[ ! "$recreate" =~ ^[Yy]$ ]]; then
                print_error "Cannot proceed without valid .env file"
                exit 1
            fi
            
            # Backup existing .env
            mv .env .env.backup.$(date +%s)
            print_info "Existing .env backed up"
        fi
    else
        print_info ".env file not found. Let's create it!"
    fi
    
    echo ""
    echo "PostgreSQL Configuration"
    echo "------------------------"
    
    # Prompt for username
    echo -n "Username [$DEFAULT_USER]: "
    read -r DB_USER
    DB_USER=${DB_USER:-$DEFAULT_USER}
    
    # Prompt for password (twice for confirmation)
    while true; do
        echo -n "Password: "
        read -s DB_PASSWORD
        echo ""
        
        if [ -z "$DB_PASSWORD" ]; then
            print_error "Password cannot be empty"
            continue
        fi
        
        echo -n "Confirm password: "
        read -s DB_PASSWORD_CONFIRM
        echo ""
        
        if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
            print_error "Passwords do not match. Please try again."
            continue
        fi
        
        break
    done
    
    # Prompt for database name
    echo -n "Database name [$DEFAULT_DB_NAME]: "
    read -r DB_NAME
    DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}
    
    # Prompt for host
    echo -n "Host [$DEFAULT_HOST]: "
    read -r DB_HOST
    DB_HOST=${DB_HOST:-$DEFAULT_HOST}
    
    # Prompt for port
    echo -n "Port [$DEFAULT_PORT]: "
    read -r DB_PORT
    DB_PORT=${DB_PORT:-$DEFAULT_PORT}
    
    # Create .env file with content from .env.database.example structure
    cat > .env <<EOF
# Database Configuration Examples

# =============================================================================
# SQLite Configuration (Default)
# =============================================================================
# No configuration needed for SQLite - it works out of the box
# Optionally specify a custom path:

# DATABASE_TYPE=sqlite
# SQLITE_PATH=./demo-data.db


# =============================================================================
# PostgreSQL Configuration
# =============================================================================
# Generated by setup-postgresql.sh on $(date)

DATABASE_TYPE=postgresql

# PostgreSQL connection details (will be combined into DATABASE_URL by config.ts)
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}

# Note: DATABASE_URL is automatically constructed from the above values
# Format: postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME


# =============================================================================
# PostgreSQL Setup Instructions
# =============================================================================
# 1. Install PostgreSQL on your system
# 2. Run the setup script: bash scripts/setup-postgresql.sh
# 3. Or manually create database: createdb ${DB_NAME}
# 4. Install dependencies: npm install pg @types/pg
# 5. Start the application - tables will be created automatically


# =============================================================================
# Development Workflow
# =============================================================================
# Local Development:
#   Use SQLite (default, no setup) - comment out DATABASE_TYPE above
#
# Testing PostgreSQL:
#   Use DATABASE_TYPE=postgresql with local PostgreSQL (as configured above)
#
# Production:
#   Set environment variables in hosting platform
#   Use PostgreSQL for production deployments


# =============================================================================
# Notes
# =============================================================================
# - SQLite is file-based and perfect for development
# - PostgreSQL is recommended for production
# - Both databases support the same API
# - CSV import/export works with both databases
# - No migration needed between databases (use CSV export/import)
EOF
    
    print_success "Environment file created successfully!"
    
    # Set proper permissions
    chmod 600 .env
    print_info "Set .env permissions to 600 (owner read/write only)"
    
    # Ensure .env is in .gitignore
    if [ -f .gitignore ]; then
        if ! grep -q "^\.env$" .gitignore; then
            echo ".env" >> .gitignore
            print_info "Added .env to .gitignore"
        fi
    else
        echo ".env" > .gitignore
        print_info "Created .gitignore with .env"
    fi
}

# Step 3: Test database connection
test_connection() {
    print_section "🔗 Testing database connection..."
    
    # Export password for psql
    export PGPASSWORD="$DB_PASSWORD"
    
    # Try to connect and run a simple query
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        print_success "Successfully connected to PostgreSQL!"
        unset PGPASSWORD
        return 0
    else
        print_error "Cannot connect to database '$DB_NAME'"
        unset PGPASSWORD
        return 1
    fi
}

# Step 4: Create database and user (if needed)
create_database() {
    print_section "🔧 Database Creation Required"
    echo ""
    echo "The database '${DB_NAME}' does not exist or cannot be accessed."
    echo "Would you like to create the database and user? (y/n): "
    read -r confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled by user"
        exit 0
    fi
    
    echo ""
    echo "PostgreSQL Superuser Credentials"
    echo "---------------------------------"
    echo "These credentials are needed to create the database and user."
    echo "They will NOT be stored."
    echo ""
    
    # Prompt for superuser credentials
    echo -n "Superuser username [$DEFAULT_SUPERUSER]: "
    read -r SUPERUSER
    SUPERUSER=${SUPERUSER:-$DEFAULT_SUPERUSER}
    
    echo -n "Superuser password: "
    read -s SUPERUSER_PASSWORD
    echo ""
    
    if [ -z "$SUPERUSER_PASSWORD" ]; then
        print_error "Superuser password cannot be empty"
        exit 1
    fi
    
    print_section "🔧 Creating database and user..."
    
    # Export superuser password for psql
    export PGPASSWORD="$SUPERUSER_PASSWORD"
    
    # Check if user exists
    USER_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" 2>/dev/null || echo "")
    
    if [ -z "$USER_EXISTS" ]; then
        # Create user
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null; then
            print_success "User '$DB_USER' created"
        else
            print_error "Failed to create user '$DB_USER'"
            unset PGPASSWORD
            exit 1
        fi
    else
        print_info "User '$DB_USER' already exists"
        
        # Update password just in case
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null; then
            print_info "Updated password for user '$DB_USER'"
        fi
    fi
    
    # Check if database exists
    DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "")
    
    if [ -z "$DB_EXISTS" ]; then
        # Create database
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null; then
            print_success "Database '$DB_NAME' created"
        else
            print_error "Failed to create database '$DB_NAME'"
            unset PGPASSWORD
            exit 1
        fi
    else
        print_info "Database '$DB_NAME' already exists"
    fi
    
    # Grant privileges
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null; then
        print_success "Privileges granted"
    else
        print_warning "Could not grant privileges (may already be granted)"
    fi
    
    # Unset superuser password
    unset PGPASSWORD
    
    print_section "⏳ Waiting 3 seconds for changes to propagate..."
    sleep 3
    
    # Retry connection test
    if test_connection; then
        return 0
    else
        print_error "Still cannot connect after database creation"
        print_info "Please check PostgreSQL logs for errors"
        exit 1
    fi
}

# Main execution flow
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   PostgreSQL Automated Setup - demo-data Project      ║"
    echo "║   Stage C: Database Configuration                     ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    
    # Step 1: Check PostgreSQL
    check_postgresql
    
    # Step 2: Setup environment
    setup_environment
    
    # Step 3: Test connection
    if ! test_connection; then
        # Step 4: Create database if needed
        create_database
    fi
    
    # Final success message
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║             🎉 PostgreSQL Setup Complete! 🎉          ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_success "Database: $DB_NAME"
    print_success "User: $DB_USER"
    print_success "Host: $DB_HOST:$DB_PORT"
    echo ""
    echo "Next steps:"
    echo "1. Run: pnpm install"
    echo "2. Run: pnpm dev"
    echo "3. The application will create tables automatically"
    echo ""
    echo "For more information, see:"
    echo "  docs/postgresql/STAGE-C-SETUP-GUIDE.md"
    echo ""
}

# Run main function
main
