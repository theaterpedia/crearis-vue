#!/bin/bash

# =============================================================================
# Crearis Vue - Phase 2: Database Setup & Application Build
# =============================================================================
# Run as: pruvious (or your DEPLOY_USER)
# Purpose: Set up PostgreSQL database, install dependencies, build application
#          PostgreSQL user 'crearis_admin' must be created before running
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    local errors=0
    
    # Check if source directory exists
    if [[ ! -d "$SOURCE_DIR" ]]; then
        error "Source directory not found: $SOURCE_DIR"
        echo "Run Phase 1 first: server_deploy_phase1_clone.sh"
        errors=$((errors + 1))
    fi
    
    # Check if .env exists
    if [[ ! -f "$SOURCE_DIR/.env" ]]; then
        error ".env file not found: $SOURCE_DIR/.env"
        echo "Create .env file with database credentials before proceeding"
        errors=$((errors + 1))
    else
        # Check if .env has been configured
        if grep -q "YOUR_SECURE_PASSWORD_HERE" "$SOURCE_DIR/.env"; then
            error ".env file contains placeholder values"
            echo "Edit $SOURCE_DIR/.env and set real database credentials"
            errors=$((errors + 1))
        else
            success ".env file configured ✓"
        fi
    fi
    
    # Check required commands
    for cmd in psql node pnpm; do
        if ! command -v $cmd &> /dev/null; then
            error "Required command not found: $cmd"
            
            case $cmd in
                psql)
                    echo "PostgreSQL client not installed or not accessible"
                    echo "Install: sudo apt install postgresql-client"
                    ;;
                node)
                    echo "Node.js not installed"
                    echo "Install: https://nodejs.org/"
                    ;;
                pnpm)
                    echo "pnpm not installed"
                    echo "Install: npm install -g pnpm"
                    ;;
            esac
            
            errors=$((errors + 1))
        fi
    done
    
    # Check Node.js version (minimum 20.10.0)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        REQUIRED_VERSION="20.10.0"
        
        if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
            error "Node.js version $NODE_VERSION is too old (minimum: $REQUIRED_VERSION)"
            echo "Update Node.js:"
            echo "  - Using nvm: nvm install 20 && nvm use 20"
            echo "  - Or from NodeSource: https://github.com/nodesource/distributions"
            errors=$((errors + 1))
        else
            success "Node.js version $NODE_VERSION ✓"
        fi
    fi
    
    if [[ $errors -gt 0 ]]; then
        error "Prerequisites check failed with $errors error(s)"
        exit 1
    fi
    
    success "Prerequisites check passed ✓"
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

# Test database connection
test_database_connection() {
    log "🔌 Testing database connection..."
    
    # Try to connect to database
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' &>/dev/null; then
        success "Database connection successful ✓"
    else
        error "Cannot connect to PostgreSQL database"
        echo ""
        echo "Database details:"
        echo "  Host: $DB_HOST"
        echo "  Port: $DB_PORT"
        echo "  User: $DB_USER"
        echo "  Database: postgres (for testing)"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Check if PostgreSQL is running: sudo systemctl status postgresql"
        echo "  2. Verify credentials in $SOURCE_DIR/.env"
        echo "  3. Check pg_hba.conf for authentication settings"
        exit 1
    fi
}

# Create database if needed
create_database() {
    log "🗄️  Setting up database: $DB_NAME"
    
    # Check if database exists
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        warning "Database $DB_NAME already exists"
    else
        log "Creating database: $DB_NAME"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
        success "Database created ✓"
    fi
    
    # Test connection to the actual database
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' &>/dev/null; then
        success "Connected to database $DB_NAME ✓"
    else
        error "Cannot connect to database $DB_NAME"
        exit 1
    fi
}

# Install Node.js dependencies
install_dependencies() {
    log "📦 Installing Node.js dependencies..."
    
    cd "$SOURCE_DIR"
    
    # Clean install with pnpm
    if [[ -d "node_modules" ]]; then
        log "Cleaning existing node_modules..."
        rm -rf node_modules
    fi
    
    pnpm install --frozen-lockfile --prod=false
    
    success "Dependencies installed ✓"
}

# Setup data directory symlink in source
setup_source_data_symlink() {
    log "🔗 Setting up data directory symlink in source..."
    
    # Ensure persistent data directory exists
    mkdir -p "$DATA_DIR"
    
    # Create server directory in source if doesn't exist
    mkdir -p "$SOURCE_DIR/server"
    
    # Remove existing server/data if it's a regular directory or broken symlink
    if [[ -e "$SOURCE_DIR/server/data" ]] || [[ -L "$SOURCE_DIR/server/data" ]]; then
        if [[ ! -L "$SOURCE_DIR/server/data" ]]; then
            # It's a regular directory, move contents to persistent storage
            log "Moving existing data directory contents to $DATA_DIR..."
            if [[ -d "$SOURCE_DIR/server/data" ]]; then
                cp -rn "$SOURCE_DIR/server/data/"* "$DATA_DIR/" 2>/dev/null || true
            fi
        fi
        rm -rf "$SOURCE_DIR/server/data"
    fi
    
    # Create symlink from source to persistent data directory
    log "Creating symlink: $SOURCE_DIR/server/data -> $DATA_DIR"
    ln -sfn "$DATA_DIR" "$SOURCE_DIR/server/data"
    
    # Verify symlink
    if [[ -L "$SOURCE_DIR/server/data" ]] && [[ -d "$SOURCE_DIR/server/data" ]]; then
        success "Source data directory symlinked ✓"
        log "  $SOURCE_DIR/server/data -> $DATA_DIR"
    else
        error "Failed to create source data symlink"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log "🔄 Running database migrations..."
    
    cd "$SOURCE_DIR"
    
    # Check if migrations should be skipped
    if [[ "$SKIP_MIGRATIONS" == "true" ]]; then
        warning "Migrations skipped (SKIP_MIGRATIONS=true)"
        return
    fi
    
    # Run migrations (adjust command based on your setup)
    if [[ -f "scripts/migrate.sh" ]]; then
        bash scripts/migrate.sh
    elif [[ -n "$(pnpm run | grep migrate)" ]]; then
        pnpm run migrate
    else
        warning "No migration script found, skipping migrations"
    fi
    
    success "Migrations completed ✓"
}

# Build application
build_application() {
    log "🏗️  Building application..."
    
    cd "$SOURCE_DIR"
    
    # Clean previous build outputs
    log "Cleaning previous build outputs..."
    rm -rf .output server/public
    
    # Run production build (prebuild runs automatically)
    # prebuild: vite build → server/public/
    # build: nitro build → .output/ (copies server/public/ to .output/public/)
    NODE_ENV=production pnpm run build
    
    if [[ ! -d ".output" ]]; then
        error "Build failed: .output directory not created"
        exit 1
    fi
    
    if [[ ! -d ".output/public" ]] || [[ ! -f ".output/public/index.html" ]]; then
        error "Build failed: .output/public/ is empty or missing index.html"
        echo "Check if vite build (prebuild) completed successfully"
        exit 1
    fi
    
    success "Application built successfully ✓"
    log "  Frontend: server/public/ (Vite output)"
    log "  Backend: .output/server/ (Nitro output)"
    log "  Static: .output/public/ (Copied from server/public/)"
}

# Sync to live directory
sync_to_live() {
    log "📋 Syncing build to live directory..."
    
    # Create live directory if it doesn't exist
    mkdir -p "$LIVE_DIR"
    
    # Sync .output directory (clean sync - delete old files)
    log "Syncing .output/ to $LIVE_DIR..."
    rsync -av --delete "$SOURCE_DIR/.output/" "$LIVE_DIR/"
    
    # Copy .env file
    cp "$SOURCE_DIR/.env" "$LIVE_DIR/.env"
    chmod 600 "$LIVE_DIR/.env"
    
    # Create server directory if doesn't exist
    mkdir -p "$LIVE_DIR/server"
    
    # Create symlink to data directory
    log "Creating symlink: $LIVE_DIR/server/data -> $DATA_DIR"
    if [[ -L "$LIVE_DIR/server/data" ]] || [[ -e "$LIVE_DIR/server/data" ]]; then
        rm -rf "$LIVE_DIR/server/data"
    fi
    ln -sfn "$DATA_DIR" "$LIVE_DIR/server/data"
    
    # Verify symlink
    if [[ -L "$LIVE_DIR/server/data" ]]; then
        success "Data directory symlinked ✓"
        log "  $LIVE_DIR/server/data -> $DATA_DIR"
    else
        error "Failed to create symlink"
        exit 1
    fi
    
    success "Build synced to live directory ✓"
}

# Copy data files
copy_data_files() {
    log "📄 Copying data files to persistent storage..."
    
    # Ensure data directory exists
    mkdir -p "$DATA_DIR"
    
    # Copy data files from source if they exist
    if [[ -d "$SOURCE_DIR/server/data" ]]; then
        for file in "$SOURCE_DIR/server/data"/*; do
            filename=$(basename "$file")
            
            # Skip certain files
            if [[ "$filename" == ".gitkeep" ]] || [[ "$filename" == *backup* ]]; then
                continue
            fi
            
            # Check if it's a directory
            if [[ -d "$file" ]]; then
                # Copy directory recursively if it doesn't exist
                if [[ ! -d "$DATA_DIR/$filename" ]]; then
                    cp -r "$file" "$DATA_DIR/"
                    log "  Copied directory: $filename"
                fi
            else
                # Only copy file if doesn't exist in data directory (preserve existing)
                if [[ ! -f "$DATA_DIR/$filename" ]]; then
                    cp "$file" "$DATA_DIR/"
                    
                    # Secure permissions for sensitive files
                    if [[ "$filename" == "PASSWORDS.csv" ]] || [[ "$filename" == *.env* ]]; then
                        chmod 600 "$DATA_DIR/$filename"
                        log "  Copied file: $filename (secured with 600 permissions)"
                    else
                        log "  Copied file: $filename"
                    fi
                else
                    log "  Skipped (exists): $filename"
                fi
            fi
        done
        
        # Set secure permissions on data directory
        chmod 700 "$DATA_DIR"
        
        success "Data files copied and secured ✓"
        
        # Warn about PASSWORDS.csv
        if [[ -f "$DATA_DIR/PASSWORDS.csv" ]]; then
            echo ""
            warning "⚠️  PASSWORDS.csv contains plaintext passwords for initial distribution"
            log "  Location: $DATA_DIR/PASSWORDS.csv"
            log "  Permissions: $(stat -c '%a' "$DATA_DIR/PASSWORDS.csv")"
            log "  Recommendation: Copy passwords securely, then delete or encrypt this file"
            echo ""
        fi
    else
        warning "No data files found in $SOURCE_DIR/server/data"
    fi
}

# Create import directory for bulk user imports
create_import_directory() {
    log "📥 Creating import directory for bulk user imports..."
    
    mkdir -p "$DATA_DIR/import/archive"
    chmod 700 "$DATA_DIR/import"
    chmod 700 "$DATA_DIR/import/archive"
    
    success "Import directory created ✓"
    log "  Location: $DATA_DIR/import/"
    log "  Archive: $DATA_DIR/import/archive/"
    log "  Usage: Place import-users.csv in import/ directory"
    log "  Script: bash scripts/import-users.sh"
}

# Setup .output directory structure for Nitro
setup_output_structure() {
    log "🔗 Setting up .output directory structure for Nitro..."
    
    # The application expects .output/public/ and .output/server/ structure
    # Create .output with symlinks to the actual directories
    mkdir -p "$LIVE_DIR/.output"
    
    # Remove existing symlinks if they exist
    rm -f "$LIVE_DIR/.output/public" "$LIVE_DIR/.output/server"
    
    # Create symlinks
    ln -sfn ../public "$LIVE_DIR/.output/public"
    ln -sfn ../server "$LIVE_DIR/.output/server"
    
    # Verify symlinks
    if [[ -L "$LIVE_DIR/.output/public" ]] && [[ -L "$LIVE_DIR/.output/server" ]]; then
        success ".output directory structure created ✓"
        log "  $LIVE_DIR/.output/public -> ../public"
        log "  $LIVE_DIR/.output/server -> ../server"
    else
        error "Failed to create .output symlinks"
        exit 1
    fi
}

# Setup PM2
setup_pm2() {
    log "🔧 Setting up PM2 configuration..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        error "PM2 not installed"
        echo "Install PM2: npm install -g pm2"
        exit 1
    fi
    
    # Create ecosystem file directly in live directory (always create/update)
    log "Creating PM2 ecosystem.config.js in $LIVE_DIR..."
    
    # Note: Database credentials are loaded from .env file through PM2
    # The .env file is copied to LIVE_DIR and PM2 loads it automatically
    cat > "$LIVE_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'crearis-vue',
    cwd: '$LIVE_DIR',
    script: './server/index.mjs',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_USER: '$DB_USER',
      DB_PASSWORD: '$DB_PASSWORD',
      DB_NAME: '$DB_NAME',
      DB_HOST: '$DB_HOST',
      DB_PORT: '$DB_PORT'
    },
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF
    
    success "PM2 ecosystem.config.js created ✓"
    log "  Location: $LIVE_DIR/ecosystem.config.js"
    log "  NODE_ENV: production (REQUIRED for Nitro 3.0)"
    log "  Port: 3000"
    log "  Database: $DB_NAME@$DB_HOST:$DB_PORT"
}

# Print next steps
print_next_steps() {
    echo ""
    echo "========================================================================="
    success "✅ Phase 2 Complete: Application Built & Database Ready"
    echo "========================================================================="
    echo ""
    echo "📋 Build Summary:"
    echo "  Frontend: Vite → server/public/ → .output/public/"
    echo "  Backend: Nitro → .output/server/"
    echo "  Symlink: $LIVE_DIR/server/data → $DATA_DIR"
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
    echo "   sudo bash $SCRIPTS_DIR/server_deploy_phase3_domain.sh"
    echo ""
    echo "========================================================================="
}

# Main execution
main() {
    log "🚀 Starting Phase 2: Database & Build"
    
    check_user
    load_config
    check_prerequisites
    load_env_vars
    test_database_connection
    create_database
    install_dependencies
    setup_source_data_symlink
    run_migrations
    build_application
    sync_to_live
    setup_output_structure
    copy_data_files
    create_import_directory
    setup_pm2
    print_next_steps
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
