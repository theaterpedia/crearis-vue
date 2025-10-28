#!/bin/bash

# =============================================================================
# Crearis Vue - Production Update Script
# =============================================================================
# Run as: root
# Purpose: Update running production application from GitHub
#          Handles: Git pull, build, PM2 restart, zero-downtime deployment
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

# Default values (will be overridden by .env.deploy)
DEPLOY_USER="pruvious"
SOURCE_DIR="/opt/crearis/source"
LIVE_DIR="/opt/crearis/live"
DATA_DIR="/opt/crearis/data"
BACKUP_DIR="/opt/crearis/backups"
LOG_DIR="/opt/crearis/logs"
APP_PORT="3000"
DEPLOY_BRANCH="theaterpedia.org"
GITHUB_REPO="https://github.com/theaterpedia/crearis-vue.git"

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
info() { echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"; }
section() { echo -e "\n${MAGENTA}═══════════════════════════════════════════════════════════${NC}"; echo -e "${MAGENTA}  $1${NC}"; echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}\n"; }

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        echo "Run as: sudo bash $0"
        exit 1
    fi
    success "Running as root ✓"
}

# Load configuration
load_config() {
    log "📋 Loading deployment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        warning "Configuration file not found: $ENV_FILE"
        warning "Using default values"
    else
        source "$ENV_FILE"
        success "Configuration loaded ✓"
    fi
    
    # Display configuration
    info "Configuration:"
    info "  Repository: $GITHUB_REPO"
    info "  Branch: $DEPLOY_BRANCH"
    info "  Deploy User: $DEPLOY_USER"
    info "  Source Dir: $SOURCE_DIR"
    info "  Live Dir: $LIVE_DIR"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    section "🔍 Checking Prerequisites"
    
    local errors=0
    
    # Check if source directory exists
    if [[ ! -d "$SOURCE_DIR" ]]; then
        error "Source directory not found: $SOURCE_DIR"
        error "Application not deployed yet. Run initial deployment first."
        errors=$((errors + 1))
    else
        success "Source directory exists ✓"
    fi
    
    # Check if deploy user exists
    if ! id "$DEPLOY_USER" &>/dev/null; then
        error "User $DEPLOY_USER does not exist"
        errors=$((errors + 1))
    else
        success "Deploy user exists: $DEPLOY_USER ✓"
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        error "PM2 not found. Install with: npm install -g pm2"
        errors=$((errors + 1))
    else
        success "PM2 installed ✓"
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        error "pnpm not found. Install with: npm install -g pnpm"
        errors=$((errors + 1))
    else
        success "pnpm installed ✓"
    fi
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
        
        if [[ $NODE_MAJOR -lt 22 ]]; then
            error "Node.js $NODE_VERSION detected. Version 22.0.0+ required for Nitro 3.0"
            error "Upgrade Node.js before continuing"
            errors=$((errors + 1))
        else
            success "Node.js $NODE_VERSION ✓ (>= 22.0.0 required)"
        fi
    else
        error "Node.js not found"
        errors=$((errors + 1))
    fi
    
    if [[ $errors -gt 0 ]]; then
        error "Prerequisites check failed with $errors error(s)"
        exit 1
    fi
    
    success "All prerequisites met ✓"
}

# Create pre-update backup
create_backup() {
    section "💾 Creating Pre-Update Backup"
    
    # Database backup
    log "Creating database backup..."
    
    if [[ -f "$SOURCE_DIR/scripts/backup-production-db.sh" ]]; then
        # Run backup as deploy user
        sudo -u "$DEPLOY_USER" bash "$SOURCE_DIR/scripts/backup-production-db.sh" "pre_update_$(date +%Y%m%d_%H%M%S)" || {
            warning "Database backup failed (non-critical)"
        }
    else
        warning "Backup script not found, skipping database backup"
    fi
    
    # Backup current live directory
    log "Creating live directory backup..."
    if [[ -d "$LIVE_DIR" ]]; then
        LIVE_BACKUP="$BACKUP_DIR/live_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        mkdir -p "$BACKUP_DIR"
        tar -czf "$LIVE_BACKUP" -C "$(dirname "$LIVE_DIR")" "$(basename "$LIVE_DIR")" 2>/dev/null || {
            warning "Live directory backup failed (non-critical)"
        }
        success "Live backup created: $LIVE_BACKUP"
    fi
}

# Check for uncommitted changes
check_git_status() {
    section "📝 Checking Git Status"
    
    cd "$SOURCE_DIR"
    
    # Check for local modifications
    if [[ -n $(git status --porcelain) ]]; then
        warning "Uncommitted changes detected in source directory:"
        git status --short
        echo ""
        
        read -p "Continue anyway? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            error "Update cancelled by user"
            exit 1
        fi
    else
        success "Working directory clean ✓"
    fi
    
    # Show current branch and commit
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    info "Current branch: $CURRENT_BRANCH"
    info "Current commit: $CURRENT_COMMIT"
}

# Pull latest changes from GitHub
pull_updates() {
    section "📥 Pulling Latest Changes from GitHub"
    
    cd "$SOURCE_DIR"
    
    # Fetch latest changes
    log "Fetching from origin..."
    sudo -u "$DEPLOY_USER" git fetch origin || {
        error "Git fetch failed"
        exit 1
    }
    
    # Get remote commit info
    REMOTE_COMMIT=$(git rev-parse --short "origin/$DEPLOY_BRANCH")
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    
    if [[ "$REMOTE_COMMIT" == "$CURRENT_COMMIT" ]]; then
        info "Already up to date (commit: $CURRENT_COMMIT)"
        read -p "Rebuild anyway? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            success "No changes needed"
            exit 0
        fi
    else
        info "Update available:"
        info "  Current:  $CURRENT_COMMIT"
        info "  New:      $REMOTE_COMMIT"
        echo ""
        
        # Show changes
        log "Changes to be applied:"
        git log --oneline HEAD.."origin/$DEPLOY_BRANCH" | head -10
        echo ""
    fi
    
    # Pull changes
    log "Pulling changes from origin/$DEPLOY_BRANCH..."
    sudo -u "$DEPLOY_USER" git pull origin "$DEPLOY_BRANCH" || {
        error "Git pull failed"
        exit 1
    }
    
    NEW_COMMIT=$(git rev-parse --short HEAD)
    success "Updated to commit: $NEW_COMMIT ✓"
}

# Install dependencies
install_dependencies() {
    section "📦 Installing Dependencies"
    
    cd "$SOURCE_DIR"
    
    # Check if package.json changed
    if git diff HEAD@{1} HEAD --name-only | grep -q "package.json\|pnpm-lock.yaml"; then
        log "Package dependencies changed, installing..."
        
        # Run as deploy user with their Node environment
        sudo -u "$DEPLOY_USER" bash -c "
            export NVM_DIR=\"\$HOME/.nvm\"
            [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
            cd \"$SOURCE_DIR\"
            pnpm install --frozen-lockfile
        " || {
            error "Dependency installation failed"
            exit 1
        }
        
        success "Dependencies installed ✓"
    else
        info "No dependency changes detected, skipping install"
    fi
}

# Ensure data directory symlink exists in source
ensure_source_data_symlink() {
    section "🔗 Verifying Data Directory Symlink"
    
    # Ensure persistent data directory exists
    mkdir -p "$DATA_DIR"
    
    # Create server directory in source if doesn't exist
    mkdir -p "$SOURCE_DIR/server"
    
    # Check if symlink already exists and is correct
    if [[ -L "$SOURCE_DIR/server/data" ]]; then
        LINK_TARGET=$(readlink -f "$SOURCE_DIR/server/data")
        if [[ "$LINK_TARGET" == "$DATA_DIR" ]]; then
            info "Source data symlink already correct ✓"
            return 0
        else
            warning "Source data symlink points to wrong location: $LINK_TARGET"
            rm -rf "$SOURCE_DIR/server/data"
        fi
    elif [[ -e "$SOURCE_DIR/server/data" ]]; then
        warning "Source server/data exists as regular directory, converting to symlink..."
        # Backup any files
        if [[ -d "$SOURCE_DIR/server/data" ]]; then
            cp -rn "$SOURCE_DIR/server/data/"* "$DATA_DIR/" 2>/dev/null || true
        fi
        rm -rf "$SOURCE_DIR/server/data"
    fi
    
    # Create symlink
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

# Build application
build_application() {
    section "🔨 Building Application"
    
    cd "$SOURCE_DIR"
    
    # Run prebuild (Vite build)
    log "Running prebuild (Vite)..."
    sudo -u "$DEPLOY_USER" bash -c "
        export NVM_DIR=\"\$HOME/.nvm\"
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
        cd \"$SOURCE_DIR\"
        pnpm prebuild
    " || {
        error "Prebuild failed"
        exit 1
    }
    success "Prebuild completed ✓"
    
    # Run build (Nitro build)
    log "Running build (Nitro)..."
    sudo -u "$DEPLOY_USER" bash -c "
        export NVM_DIR=\"\$HOME/.nvm\"
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
        cd \"$SOURCE_DIR\"
        pnpm build
    " || {
        error "Build failed"
        exit 1
    }
    success "Build completed ✓"
    
    # Verify build output
    if [[ ! -f "$SOURCE_DIR/.output/server/index.mjs" ]]; then
        error "Build output not found: .output/server/index.mjs"
        exit 1
    fi
    success "Build verification passed ✓"
}

# Sync to live directory
sync_to_live() {
    section "🔄 Syncing to Live Directory"
    
    # Ensure live directory exists
    mkdir -p "$LIVE_DIR"
    
    # Sync build output to live
    log "Syncing .output/ to $LIVE_DIR..."
    rsync -av --delete \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='server/data' \
        "$SOURCE_DIR/.output/" "$LIVE_DIR/" || {
        error "Sync failed"
        exit 1
    }
    
    # Ensure symlink exists for data directory
    if [[ ! -L "$LIVE_DIR/server/data" ]]; then
        log "Creating data directory symlink..."
        mkdir -p "$LIVE_DIR/server"
        ln -sf "$DATA_DIR" "$LIVE_DIR/server/data"
    fi
    
    # Copy ecosystem config if exists
    if [[ -f "$SOURCE_DIR/ecosystem.config.js" ]]; then
        cp "$SOURCE_DIR/ecosystem.config.js" "$LIVE_DIR/"
    fi
    
    # Set proper ownership
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$LIVE_DIR"
    
    success "Sync completed ✓"
}

# Check if PM2 app is running
check_pm2_status() {
    sudo -u "$DEPLOY_USER" pm2 list | grep -q "crearis-vue" && return 0 || return 1
}

# Restart PM2 application
restart_application() {
    section "♻️  Restarting Application"
    
    if check_pm2_status; then
        log "Restarting PM2 app: crearis-vue..."
        sudo -u "$DEPLOY_USER" bash -c "
            export NVM_DIR=\"\$HOME/.nvm\"
            [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
            pm2 restart crearis-vue
        " || {
            error "PM2 restart failed"
            exit 1
        }
        
        # Wait for app to start
        sleep 3
        
        # Check if app is running
        if sudo -u "$DEPLOY_USER" pm2 list | grep -q "online.*crearis-vue"; then
            success "Application restarted successfully ✓"
        else
            error "Application failed to start"
            sudo -u "$DEPLOY_USER" pm2 logs crearis-vue --lines 20
            exit 1
        fi
    else
        log "PM2 app not running, starting fresh..."
        sudo -u "$DEPLOY_USER" bash -c "
            export NVM_DIR=\"\$HOME/.nvm\"
            [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
            cd \"$LIVE_DIR\"
            pm2 start ecosystem.config.js
        " || {
            error "PM2 start failed"
            exit 1
        }
        
        sleep 3
        success "Application started ✓"
    fi
    
    # Save PM2 configuration
    sudo -u "$DEPLOY_USER" pm2 save
}

# Verify deployment
verify_deployment() {
    section "✅ Verifying Deployment"
    
    local errors=0
    
    # Check PM2 status
    log "Checking PM2 status..."
    if sudo -u "$DEPLOY_USER" pm2 list | grep -q "online.*crearis-vue"; then
        success "PM2 process is online ✓"
    else
        error "PM2 process is not online"
        errors=$((errors + 1))
    fi
    
    # Check if app responds on port
    log "Checking application port $APP_PORT..."
    sleep 2
    if curl -sf "http://localhost:$APP_PORT/api/status/all" > /dev/null 2>&1; then
        success "Application responds on port $APP_PORT ✓"
    else
        warning "Application not responding yet (may still be starting)"
    fi
    
    # Check disk space
    log "Checking disk space..."
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $DISK_USAGE -lt 90 ]]; then
        success "Disk usage: ${DISK_USAGE}% ✓"
    else
        warning "Disk usage high: ${DISK_USAGE}%"
    fi
    
    # Show PM2 status
    echo ""
    info "Current PM2 status:"
    sudo -u "$DEPLOY_USER" pm2 list
    
    if [[ $errors -gt 0 ]]; then
        error "Verification completed with $errors error(s)"
        exit 1
    fi
}

# Print summary
print_summary() {
    section "📊 Update Summary"
    
    cd "$SOURCE_DIR"
    FINAL_COMMIT=$(git rev-parse --short HEAD)
    FINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    success "Update completed successfully!"
    echo ""
    info "Git Status:"
    info "  Branch: $FINAL_BRANCH"
    info "  Commit: $FINAL_COMMIT"
    echo ""
    info "Application Status:"
    sudo -u "$DEPLOY_USER" pm2 status crearis-vue
    echo ""
    info "Useful Commands:"
    echo "  View logs:      sudo -u $DEPLOY_USER pm2 logs crearis-vue"
    echo "  Monitor:        sudo -u $DEPLOY_USER pm2 monit"
    echo "  Restart:        sudo -u $DEPLOY_USER pm2 restart crearis-vue"
    echo "  Stop:           sudo -u $DEPLOY_USER pm2 stop crearis-vue"
    echo ""
    info "Backup Location: $BACKUP_DIR"
    echo ""
    success "✨ Production update complete! ✨"
}

# Rollback function (in case of failure)
rollback() {
    section "🔙 Rolling Back Changes"
    
    error "Update failed, attempting rollback..."
    
    # Find most recent live backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/live_backup_*.tar.gz 2>/dev/null | head -1)
    
    if [[ -n "$LATEST_BACKUP" ]]; then
        log "Restoring from: $LATEST_BACKUP"
        tar -xzf "$LATEST_BACKUP" -C "$(dirname "$LIVE_DIR")"
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$LIVE_DIR"
        
        # Restart PM2
        sudo -u "$DEPLOY_USER" pm2 restart crearis-vue
        
        warning "Rollback completed. Please investigate the issue."
    else
        error "No backup found for rollback"
    fi
}

# Main execution
main() {
    echo ""
    section "🚀 Crearis Vue - Production Update"
    echo ""
    
    check_root
    load_config
    check_prerequisites
    create_backup
    check_git_status
    pull_updates
    install_dependencies
    ensure_source_data_symlink
    build_application
    sync_to_live
    restart_application
    verify_deployment
    print_summary
}

# Trap errors and attempt rollback
trap 'rollback' ERR

# Run main function
main "$@"
