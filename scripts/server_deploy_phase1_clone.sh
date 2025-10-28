#!/bin/bash

# =============================================================================
# Crearis Vue - Phase 1: GitHub Repository Cloning
# =============================================================================
# Run as: root
# Purpose: Clone repository and set up directory structure
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (Phase 1 requires root privileges)"
        echo "Usage: sudo bash $0"
        exit 1
    fi
    success "Running as root ✓"
}

# Load configuration
load_config() {
    log "📋 Loading deployment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Deployment configuration file not found: $ENV_FILE"
        echo ""
        echo "Please create $ENV_FILE first."
        echo "See .env.deploy.example for reference."
        exit 1
    fi
    
    source "$ENV_FILE"
    success "Configuration loaded ✓"
}

# Validate configuration
validate_config() {
    log "🔍 Validating configuration..."
    
    local errors=0
    
    # Check required variables
    if [[ -z "$GITHUB_REPO" ]]; then
        error "GITHUB_REPO not set in .env.deploy"
        errors=$((errors + 1))
    fi
    
    if [[ -z "$DEPLOY_USER" ]]; then
        error "DEPLOY_USER not set in .env.deploy"
        errors=$((errors + 1))
    fi
    
    if [[ -z "$SOURCE_DIR" ]]; then
        error "SOURCE_DIR not set in .env.deploy"
        errors=$((errors + 1))
    fi
    
    if [[ $errors -gt 0 ]]; then
        error "Configuration validation failed with $errors error(s)"
        exit 1
    fi
    
    success "Configuration valid ✓"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    local errors=0
    
    # Check if user exists
    if ! id "$DEPLOY_USER" &>/dev/null; then
        error "User $DEPLOY_USER does not exist"
        echo "Create user with: sudo useradd -m -s /bin/bash $DEPLOY_USER"
        errors=$((errors + 1))
    else
        success "User $DEPLOY_USER exists ✓"
    fi
    
    # Check required commands
    for cmd in git; do
        if ! command -v $cmd &> /dev/null; then
            error "Required command not found: $cmd"
            echo "Install with: sudo apt install $cmd"
            errors=$((errors + 1))
        fi
    done
    
    if [[ $errors -gt 0 ]]; then
        error "Prerequisites check failed"
        exit 1
    fi
    
    success "Prerequisites check passed ✓"
}

# Create directory structure
create_directories() {
    log "📁 Creating directory structure..."
    
    mkdir -p "$SOURCE_DIR" "$LIVE_DIR" "$DATA_DIR" "$LOG_DIR" "$BACKUP_DIR" "$SCRIPTS_DIR"
    
    # Set ownership to deploy user
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$(dirname "$SOURCE_DIR")"
    
    # Set permissions
    chmod 755 "$SOURCE_DIR" "$LIVE_DIR" "$LOG_DIR" "$SCRIPTS_DIR"
    chmod 700 "$DATA_DIR" "$BACKUP_DIR"  # Secure data directories
    
    success "Directory structure created ✓"
    log "  Source: $SOURCE_DIR"
    log "  Live: $LIVE_DIR"
    log "  Data: $DATA_DIR"
    log "  Logs: $LOG_DIR"
}

# Clone or update repository
clone_repository() {
    log "📥 Cloning/updating repository..."
    
    if [[ -d "$SOURCE_DIR/.git" ]]; then
        warning "Repository already exists, updating..."
        
        # Fix git ownership before any git operations
        sudo -u "$DEPLOY_USER" git config --global --add safe.directory "$SOURCE_DIR" 2>/dev/null || true
        
        cd "$SOURCE_DIR"
        sudo -u "$DEPLOY_USER" git fetch origin
        
        if [[ -n "$DEPLOY_TAG" ]]; then
            log "🏷️  Checking out tag: $DEPLOY_TAG"
            sudo -u "$DEPLOY_USER" git checkout "tags/$DEPLOY_TAG"
        else
            log "🌿 Checking out branch: $DEPLOY_BRANCH"
            sudo -u "$DEPLOY_USER" git checkout "$DEPLOY_BRANCH"
            sudo -u "$DEPLOY_USER" git pull origin "$DEPLOY_BRANCH"
        fi
    else
        log "📥 Cloning fresh repository..."
        sudo -u "$DEPLOY_USER" git clone "$GITHUB_REPO" "$SOURCE_DIR"
        
        # Add safe directory for the deploy user
        sudo -u "$DEPLOY_USER" git config --global --add safe.directory "$SOURCE_DIR"
        
        cd "$SOURCE_DIR"
        
        if [[ -n "$DEPLOY_TAG" ]]; then
            sudo -u "$DEPLOY_USER" git checkout "tags/$DEPLOY_TAG"
        else
            sudo -u "$DEPLOY_USER" git checkout "$DEPLOY_BRANCH"
        fi
    fi
    
    # Add safe directory for root (since this script runs as root)
    git config --global --add safe.directory "$SOURCE_DIR" 2>/dev/null || true
    
    # Show current commit
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
    log "📝 Current commit: $COMMIT_HASH - $COMMIT_MESSAGE"
    
    # Ensure ownership is correct
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SOURCE_DIR"
    
    success "Repository cloned/updated ✓"
}

# Create .env template
create_env_template() {
    log "📝 Creating .env template..."
    
    ENV_FILE_PATH="$SOURCE_DIR/.env"
    
    if [[ -f "$ENV_FILE_PATH" ]]; then
        warning ".env file already exists, skipping template creation"
        return
    fi
    
    cat > "$ENV_FILE_PATH" << 'EOF'
# =============================================================================
# Crearis Vue - Production Environment Configuration
# =============================================================================
# ⚠️  IMPORTANT: Fill in all values before running Phase 2!
# =============================================================================

# =============================================================================
# PostgreSQL Configuration (REQUIRED)
# =============================================================================
DATABASE_TYPE=postgresql
DB_USER=crearis_admin
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DB_NAME=crearis_production
DB_HOST=localhost
DB_PORT=5432

# Or use direct DATABASE_URL (alternative to above)
# DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require

# =============================================================================
# Server Configuration
# =============================================================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Migration Control
# Set to false for initial deployment (Phase 2 will run migrations)
# PM2 will override this to true at runtime to prevent auto-migrations on restart
SKIP_MIGRATIONS=false

# =============================================================================
# Application Configuration
# =============================================================================
# Add any application-specific variables here
EOF
    
    chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE_PATH"
    chmod 600 "$ENV_FILE_PATH"  # Secure permissions
    
    success ".env template created ✓"
    warning ""
    warning "⚠️  IMPORTANT: Edit $ENV_FILE_PATH before proceeding to Phase 2!"
    warning "   Set your PostgreSQL credentials and other configuration."
}

# Print next steps
print_next_steps() {
    echo ""
    echo "========================================================================="
    success "✅ Phase 1 Complete: Repository Cloned"
    echo "========================================================================="
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Configure environment variables (as root or $DEPLOY_USER):"
    echo "   sudo nano $SOURCE_DIR/.env"
    echo ""
    echo "2. Set PostgreSQL password and other required values"
    echo ""
    echo "3. Run Phase 2 as user '$DEPLOY_USER':"
    echo "   sudo -u $DEPLOY_USER bash $SCRIPTS_DIR/server_deploy_phase2_build.sh"
    echo ""
    echo "========================================================================="
}

# Main execution
main() {
    log "🚀 Starting Phase 1: Repository Cloning"
    
    check_root
    load_config
    validate_config
    check_prerequisites
    create_directories
    clone_repository
    create_env_template
    print_next_steps
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
