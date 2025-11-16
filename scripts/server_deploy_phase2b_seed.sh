#!/bin/bash

# =============================================================================
# Crearis Vue - Phase 2b: System Data Seeding (Migration 021)
# =============================================================================
# Run as: pruvious (or your DEPLOY_USER)
# Purpose: Run migration 021 to seed system data (tags, status, users, projects)
#          Includes pre-flight database validation checks
#          Must be run AFTER Phase 2a
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Node v22 required for Nitro 3.0
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
info() { echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"; }

# Check if running as correct user
check_user() {
    source "$ENV_FILE"
    
    if [[ $EUID -eq 0 ]]; then
        error "This script should NOT be run as root"
        echo "Run as: sudo -u $DEPLOY_USER bash $0"
        exit 1
    fi
    
    if [[ "$(whoami)" != "$DEPLOY_USER" ]]; then
        error "This script should be run as user: $DEPLOY_USER"
        echo "Current user: $(whoami)"
        echo "Run as: sudo -u $DEPLOY_USER bash $0"
        exit 1
    fi
    
    success "Running as $DEPLOY_USER ✓"
}

# Load configuration
load_config() {
    log "📋 Loading deployment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Deployment configuration file not found: $ENV_FILE"
        exit 1
    fi
    
    source "$ENV_FILE"
    success "Configuration loaded ✓"
}

# Load environment variables from .env
load_env_vars() {
    log "🔧 Loading environment variables from .env..."
    
    cd "$SOURCE_DIR"
    
    # Export all variables from .env
    if [[ -f .env ]]; then
        export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
        success "Environment variables loaded ✓"
    else
        error ".env file not found"
        exit 1
    fi
}

# Pre-flight check: Database connection
check_database_connection() {
    log "🔌 Pre-flight Check 1/5: Database connection..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' &>/dev/null; then
        success "✓ Database connection successful"
        info "  Database: $DB_NAME"
        info "  Host: $DB_HOST:$DB_PORT"
        info "  User: $DB_USER"
    else
        error "✗ Cannot connect to PostgreSQL database"
        echo ""
        echo "Database details:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  User: $DB_USER"
        echo "  Database: $DB_NAME"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Check if PostgreSQL is running: sudo systemctl status postgresql"
        echo "  2. Verify credentials in $SOURCE_DIR/.env"
        echo "  3. Check pg_hba.conf for authentication settings"
        exit 1
    fi
}

# Pre-flight check: Config table exists (tracks migrations)
check_migrations_table() {
    log "🔍 Pre-flight Check 2/5: Migration tracking table existence..."
    
    # Check if crearis_config table exists (used to track migrations)
    local table_check=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'crearis_config'
        );")
    
    if [[ "$table_check" == "t" ]]; then
        success "✓ Config table exists (tracks migrations)"
        
        # Show config table structure
        info "  Config table structure:"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crearis_config' ORDER BY ordinal_position;" \
            2>/dev/null | head -n 10
    else
        error "✗ Config table (crearis_config) does NOT exist"
        echo ""
        echo "The crearis_config table is required to track which migrations have been applied."
        echo "This table should have been created by base migrations (000-020)."
        echo ""
        echo "Possible causes:"
        echo "  1. Phase 2a was not run yet"
        echo "  2. Base migrations (000-020) failed to complete"
        echo "  3. SKIP_MIGRATIONS was set to 'true' during Phase 2a"
        echo ""
        echo "Solutions:"
        echo "  1. Run Phase 2a first: bash server_deploy_phase2a_build.sh"
        echo "  2. Or manually run base migrations: cd $SOURCE_DIR && pnpm db:migrate"
        echo ""
        exit 1
    fi
}

# Pre-flight check: Base migrations completed
check_base_migrations() {
    log "📊 Pre-flight Check 3/5: Base migrations (000-020) status..."
    
    # Check migrations_run array in config table
    local migrations_json=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT config->>'migrations_run' FROM crearis_config WHERE id = 1;" 2>/dev/null)
    
    if [[ -n "$migrations_json" ]] && [[ "$migrations_json" != "null" ]]; then
        # Count migrations (excluding 021)
        local migration_count=$(echo "$migrations_json" | grep -o "\"[^\"]*\"" | grep -v "021_seed_system_data" | wc -l)
        
        if [[ $migration_count -gt 0 ]]; then
            success "✓ Found $migration_count base migration(s) in tracking"
        else
            info "ℹ No migrations found in tracking array"
        fi
        
        # Show applied migrations
        if [[ $migration_count -gt 0 ]]; then
            info "  Tracked migrations:"
            echo "$migrations_json" | grep -o "\"[^\"]*\"" | sed 's/"//g' | grep -v "021_seed_system_data" | head -n 20 | while read -r mig; do
                info "    - $mig"
            done
        fi
    else
        info "ℹ No migration tracking data found in config table"
    fi
    
    # Note: Migration tracking may be incomplete if migrations ran before tracking was implemented
    # We'll verify actual schema state in the next check (key tables existence)
    info "  Note: Will verify actual database schema in next check"
}

# Pre-flight check: Migration 021 not already applied
check_migration_021_status() {
    log "🔎 Pre-flight Check 4/5: Migration 021 status..."
    
    # Check if migration 021 is in migrations_run array
    local migrations_json=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT config->>'migrations_run' FROM crearis_config WHERE id = 1;" 2>/dev/null)
    
    if [[ -n "$migrations_json" ]] && echo "$migrations_json" | grep -q "021_seed_system_data"; then
        warning "⚠ Migration 021 has ALREADY been applied"
        
        info "  Found in migrations_run array"
        echo ""
        echo "Running migration 021 again will likely cause errors:"
        echo "  - Duplicate key violations (unique constraints)"
        echo "  - Duplicate system users"
        echo "  - Duplicate projects"
        echo ""
        read -p "Do you want to SKIP migration 021? (yes/no): " skip_choice
        if [[ "$skip_choice" == "yes" ]]; then
            info "Migration 021 will be SKIPPED"
            return 1  # Signal to skip migration
        else
            warning "Migration 021 will be RE-RUN (may cause errors)"
            return 0  # Signal to run migration
        fi
    else
        success "✓ Migration 021 has NOT been applied yet"
        info "  Safe to proceed with seeding system data"
        return 0  # Signal to run migration
    fi
}

# Pre-flight check: Key tables existence
check_key_tables() {
    log "🗂️  Pre-flight Check 5/5: Key tables existence..."
    
    # Core tables that MUST exist (created by migrations 000-020)
    local core_tables=("users" "projects" "status" "tags" "domains" "pages")
    # Optional tables that migration 021 will need (may not exist yet)
    local optional_tables=("memberships")
    
    local missing_core=()
    local missing_optional=()
    local existing_tables=()
    
    # Check core tables
    for table in "${core_tables[@]}"; do
        local table_check=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '$table'
            );")
        
        if [[ "$table_check" == "t" ]]; then
            existing_tables+=("$table")
        else
            missing_core+=("$table")
        fi
    done
    
    # Check optional tables
    for table in "${optional_tables[@]}"; do
        local table_check=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '$table'
            );")
        
        if [[ "$table_check" == "t" ]]; then
            existing_tables+=("$table")
        else
            missing_optional+=("$table")
        fi
    done
    
    # Report results
    if [[ ${#missing_core[@]} -eq 0 ]]; then
        success "✓ All core tables exist"
        info "  Core tables: ${core_tables[*]}"
        
        if [[ ${#missing_optional[@]} -gt 0 ]]; then
            warning "⚠ Optional tables missing: ${missing_optional[*]}"
            info "  These tables should exist but migration 021 may create them if needed"
        fi
    else
        error "✗ Missing CORE tables: ${missing_core[*]}"
        echo ""
        echo "These core tables should have been created by base migrations (000-020)."
        echo ""
        echo "Solutions:"
        echo "  1. Run Phase 2a first: bash server_deploy_phase2a_build.sh"
        echo "  2. Or manually run base migrations: cd $SOURCE_DIR && pnpm db:migrate"
        echo ""
        exit 1
    fi
    
    # Show row counts for existing tables
    info "  Current row counts:"
    for table in "${existing_tables[@]}"; do
        local row_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT COUNT(*) FROM $table;")
        info "    $table: $row_count rows"
    done
}

# Run all pre-flight checks
run_preflight_checks() {
    log "🚦 Running pre-flight checks before migration 021..."
    echo ""
    
    check_database_connection
    echo ""
    
    check_migrations_table
    echo ""
    
    check_base_migrations
    echo ""
    
    check_migration_021_status
    local should_run_migration=$?
    echo ""
    
    check_key_tables
    echo ""
    
    success "✅ All pre-flight checks passed"
    echo ""
    
    return $should_run_migration
}

# Run migration 021
run_migration_021() {
    log "📦 Running migration 021 (System Data Seeding)..."
    
    cd "$SOURCE_DIR"
    
    info "Migration 021 will seed:"
    echo "  - tags table (empty, structure only)"
    echo "  - status table (~48 status values)"
    echo "  - users table (6 system users: admin, base, tp, regio1, user, spectator)"
    echo "  - projects table (2 demo projects: tp, regio1)"
    echo "  - domains table (system domains)"
    echo "  - memberships table (user-project associations)"
    echo "  - pages table (initial pages)"
    echo ""
    
    # Run the migration
    pnpm run db:migrate:021
    
    success "Migration 021 completed ✓"
    
    # Verify seeding by checking row counts
    log "Verifying seeded data..."
    
    local status_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM status;")
    local users_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM users;")
    local projects_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM projects;")
    
    info "  Seeded data counts:"
    info "    status: $status_count rows"
    info "    users: $users_count rows"
    info "    projects: $projects_count rows"
    
    if [[ $status_count -gt 0 ]] && [[ $users_count -gt 0 ]] && [[ $projects_count -gt 0 ]]; then
        success "✓ System data seeded successfully"
    else
        warning "⚠ Some tables appear empty after seeding"
        echo "Check migration 021 output for errors"
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo "========================================================================="
    success "✅ Phase 2b Complete: System Data Seeded"
    echo "========================================================================="
    echo ""
    echo "📋 Seeding Summary:"
    echo "  Migration 021: System data seeded successfully"
    echo "  Database: $DB_NAME@$DB_HOST:$DB_PORT"
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Start/restart the application (as $DEPLOY_USER):"
    echo "   cd $LIVE_DIR"
    echo "   pm2 delete crearis-vue 2>/dev/null || true  # Stop old process"
    echo "   pm2 start ecosystem.config.js"
    echo "   pm2 save"
    echo "   pm2 startup  # Follow instructions to enable on boot"
    echo ""
    echo "2. Check application status:"
    echo "   pm2 status"
    echo "   pm2 logs crearis-vue --lines 50"
    echo ""
    echo "3. Verify symlink is working:"
    echo "   ls -la $LIVE_DIR/server/data"
    echo "   ls -la $DATA_DIR/PASSWORDS.csv"
    echo ""
    echo "4. Distribute passwords to users (SECURITY):"
    echo "   - Copy $DATA_DIR/PASSWORDS.csv securely"
    echo "   - Distribute via encrypted channel"
    echo "   - Delete or encrypt PASSWORDS.csv after distribution"
    echo "   - See docs/PASSWORD_SYSTEM.md for details"
    echo ""
    echo "5. (Optional) Import additional users:"
    echo "   - Create import-users.csv with user data"
    echo "   - Upload to $DATA_DIR/import/"
    echo "   - Run: bash scripts/import-users.sh"
    echo "   - See docs/USER_IMPORT_SYSTEM.md for details"
    echo ""
    echo "6. Run Phase 3 as root to configure domains and SSL:"
    echo "   sudo bash $SCRIPT_DIR/server_deploy_phase3_domain.sh"
    echo ""
    echo "========================================================================="
}

# Main execution
main() {
    log "🚀 Starting Phase 2b: System Data Seeding (Migration 021)"
    
    check_user
    load_config
    load_env_vars
    
    # Run pre-flight checks
    run_preflight_checks
    local should_run=$?
    
    # Run migration if checks passed and user confirmed
    if [[ $should_run -eq 0 ]]; then
        run_migration_021
    else
        warning "Migration 021 SKIPPED (already applied or user choice)"
    fi
    
    print_next_steps
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
