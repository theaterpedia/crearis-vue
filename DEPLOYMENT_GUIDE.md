# 🚀 Crearis Vue - Web Server Deployment Guide

## ⚠️ IMPORTANT: Database Requirements

**🔴 SQLite Support is OUTDATED and NOT SUPPORTED**

- The current codebase has evolved to depend on PostgreSQL-specific features
- **JSONB field types** are extensively used throughout the application
- SQLite compatibility would require significant refactoring and development work
- **PostgreSQL is the ONLY supported database** for this application

**✅ PostgreSQL 12+ is REQUIRED** for all deployments (development and production)

---

## 📋 Deployment Overview

### Three-Phase Deployment Process

This guide uses a structured 3-phase approach with clear user separation:

| Phase | User | Purpose | Script |
|-------|------|---------|--------|
| **Phase 1** | `root` | Clone repository, create directories | `server_deploy_phase1_clone.sh` |
| **Phase 2** | `pruvious` | Database setup, build application | `server_deploy_phase2_build.sh` |
| **Phase 3** | `root` | Domain configuration, SSL certificates | `server_deploy_phase3_domain.sh` |

### User Roles

- **root**: System administration tasks (directory creation, Nginx, SSL certificates)
- **pruvious**: Application user (runs PM2, builds code, database operations)

### Server Directory Structure

After deployment, the server will have this structure:

```
/opt/crearis/
├── source/          # Git repository (managed by pruvious)
│   ├── .git/
│   ├── .env         # Application configuration (create in Phase 1)
│   ├── src/
│   ├── server/
│   │   ├── data/   # Source data files (copied to /opt/crearis/data)
│   │   │   ├── root/        # Root fileset (users.csv, projects.csv)
│   │   │   └── base/        # Base fileset (demo data)
│   └── ...
├── live/            # Production build (managed by pruvious)
│   ├── .output/     # Built application
│   ├── server/
│   │   ├── index.mjs        # Nitro server entry point
│   │   └── data/            # ⚠️ SYMLINK → /opt/crearis/data
│   └── ecosystem.config.js  # PM2 configuration
├── data/            # ⚠️ PERSISTENT DATA (owned by pruvious, mode 700)
│   ├── PASSWORDS.csv        # Plain passwords for distribution (mode 600)
│   ├── root/                # Root fileset (users.csv, projects.csv)
│   └── base/                # Base fileset (events, posts, etc.)
├── logs/            # Application logs (owned by pruvious)
├── backups/         # Database backups (owned by pruvious)
└── scripts/         # Deployment scripts (owned by root)
    ├── .env.deploy          # Deployment configuration
    └── server_deploy_phase*.sh
```

**Important Notes:**

1. **No Repo Restructuring Needed!**  
   The repository structure (`server/data/`) differs from production (`/opt/crearis/data/`).  
   This is intentional and handled automatically by the deployment scripts via symlinks.

2. **Data Persistence via Symlink**  
   `/opt/crearis/live/server/data/` → `/opt/crearis/data/`  
   This ensures data survives deployments and lives outside the live directory.

3. **Password Security**  
   PASSWORDS.csv contains plaintext passwords for initial distribution.  
   See "Password Distribution" section below for security best practices.

---

## 🔐 Password System

### Overview

The application generates random 10-character passwords for all users:
- **System users** (6): admin, base, project1, project2, tp, regio1
- **CSV users** (17+): Imported from `server/data/root/users.csv`

All passwords are stored in `/opt/crearis/data/PASSWORDS.csv` for distribution.

### Security Requirements

1. **File Permissions** (set automatically by deployment script):
   ```bash
   chmod 600 /opt/crearis/data/PASSWORDS.csv  # Only owner can read/write
   chmod 700 /opt/crearis/data                # Only owner can access
   ```

2. **After First Deployment**:
   - Copy PASSWORDS.csv securely (encrypted email, password manager, etc.)
   - Distribute passwords to users via secure channel
   - **Recommended**: Delete or encrypt PASSWORDS.csv after distribution
   - Instruct users to change passwords on first login

3. **For Detailed Documentation**:
   - See `docs/PASSWORD_SYSTEM.md` for complete documentation
   - Includes password rotation, backup strategies, troubleshooting

---

## Pre-Deployment Testing Checklist

### 0. System Requirements

**Node.js Version: ≥ 20.10.0**
```bash
# Check Node.js version
node --version  # Must be 20.10.0 or higher
```

If you need to install/update Node.js:
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Or install directly from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1. Local Production Build Test
```bash
# ✅ PREREQUISITE: Ensure PostgreSQL is running
sudo systemctl start postgresql

# Configure environment (PostgreSQL required)
cp .env.database.example .env
# Edit .env with PostgreSQL credentials

# Build the application
pnpm build

# Test production build locally
pnpm start

# Verify app runs on http://localhost:3000
# Check all major features work correctly (requires PostgreSQL JSONB support)

```



### 2. Server Preparation and PostgreSQL Database Setup

> **📋 Three-Phase Deployment Process**
>
> The deployment is split into 3 phases with different user requirements:
>
> - **Phase 1** (as **root**): Clone repository and create directory structure
> - **Phase 2** (as **pruvious**): Database setup, build application
> - **Phase 3** (as **root**): Domain configuration and SSL certificates
>
> See detailed scripts in `/scripts/server_deploy_phase*.sh`

#### Prerequisites (as root)

```bash
# Create system user for running the application (if not exists)
sudo useradd -m -s /bin/bash pruvious
sudo passwd pruvious

# Install required software
sudo apt update
sudo apt install -y git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Install Node.js (version 20.10.0+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Ensure PostgreSQL is running
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create PostgreSQL database user (note: different from Linux user)
sudo -u postgres createuser crearis_admin
sudo -u postgres psql -c "ALTER USER crearis_admin PASSWORD 'your_secure_database_password';"
```

#### Phase 1: Clone Repository (as root)

```bash
# Navigate to scripts directory
cd /path/to/local/repo/scripts

# Copy deployment configuration
cp .env.deploy.example .env.deploy

# Edit configuration
nano .env.deploy
# Set: GITHUB_REPO, DEPLOY_USER=pruvious, domains, etc.

# Run Phase 1 script
sudo bash server_deploy_phase1_clone.sh
```

**What Phase 1 does:**
- Creates directory structure: `/opt/crearis/{source,live,data,logs,scripts}`
- Clones GitHub repository to `/opt/crearis/source`
- Creates `.env` template with placeholders
- Sets proper ownership for `pruvious` user

**After Phase 1:**
- Edit `/opt/crearis/source/.env` with your PostgreSQL credentials
- Set `DB_PASSWORD` and other required values

#### Phase 2: Database & Build (as pruvious)

**Prerequisites:**
- Node.js ≥ 20.10.0 must be installed
- PostgreSQL client tools installed
- pnpm installed globally

**Trouble-Shooting**
If the for security-reasons the database-user is disallowed to create databases we create the db as root and then grant the privileges

```bash
# Change Database-Name and User accordingly
sudo -u postgres createdb crearis_production
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crearis_production TO crearis_admin;"
```


```bash
# Switch to pruvious user
sudo -u pruvious bash

# Navigate to scripts
cd /opt/crearis/scripts

# Run Phase 2 script (includes Node.js version check)
bash server_deploy_phase2_build.sh
```

**What Phase 2 does:**
- **Validates Node.js version ≥ 20.10.0**
- Validates `.env` configuration
- Tests PostgreSQL database connection
- Creates database if needed
- Installs Node.js dependencies
- Runs database migrations
- Builds production application
- Syncs to live directory
- Sets up PM2 configuration

**After Phase 2:**
- Start application: `pm2 start /opt/crearis/live/ecosystem.config.js`
- Enable PM2 on boot: `pm2 startup` (follow instructions)
- Save PM2 configuration: `pm2 save`

#### Phase 3: Domain & SSL (as root)

```bash
# Ensure .env.deploy is configured with domains
nano /opt/crearis/scripts/.env.deploy
# Set: PRIMARY_DOMAIN, ADDITIONAL_DOMAINS, SSL_EMAIL

# Run Phase 3 script
sudo bash /opt/crearis/scripts/server_deploy_phase3_domain.sh
```

**What Phase 3 does:**
- Creates Nginx configuration
- Obtains SSL certificates from Let's Encrypt
- Configures automatic certificate renewal
- Sets up HTTPS redirects
- Verifies deployment

**After Phase 3:**
- Your application is live at `https://your-domain.com`
- SSL certificates auto-renew via systemd timer

---

## 📝 Deployment Scripts Reference

All deployment scripts are located in `/scripts/` with the `server_` prefix:

### Script Files

| Script | User | Purpose |
|--------|------|---------|
| `server_deploy_phase1_clone.sh` | root | Clone repository, create structure |
| `server_deploy_phase2_build.sh` | pruvious | Build application, setup database |
| `server_deploy_phase3_domain.sh` | root | Configure Nginx, obtain SSL certs |
| `.env.deploy.example` | - | Deployment configuration template |

### Configuration File: `.env.deploy`

Before running any deployment scripts, copy and configure:

```bash
cd /path/to/repo/scripts
cp .env.deploy.example .env.deploy
nano .env.deploy
```

**Example `.env.deploy` for theaterpedia.org:**

```bash
# GitHub Repository
GITHUB_REPO=https://github.com/theaterpedia/crearis-vue.git
DEPLOY_BRANCH=main

# System User (Linux user that runs PM2)
DEPLOY_USER=pruvious

# PostgreSQL Database User (database owner)
PG_USER=crearis_admin

# Directory Structure
BASE_DIR=/opt/crearis
SOURCE_DIR=/opt/crearis/source
LIVE_DIR=/opt/crearis/live
DATA_DIR=/opt/crearis/data
LOG_DIR=/opt/crearis/logs
BACKUP_DIR=/opt/crearis/backups
SCRIPTS_DIR=/opt/crearis/scripts

# Application Port (internal)
APP_PORT=3000

# Domain Configuration
PRIMARY_DOMAIN=theaterpedia.org
ADDITIONAL_DOMAINS=www.theaterpedia.org
SSL_EMAIL=admin@theaterpedia.org
```

### Quick Deployment Commands

```bash
# Phase 1 (as root)
sudo bash scripts/server_deploy_phase1_clone.sh

# Edit .env with database credentials
sudo nano /opt/crearis/source/.env

# Phase 2 (as pruvious)
sudo -u pruvious bash /opt/crearis/scripts/server_deploy_phase2_build.sh

# Start application (as pruvious)
sudo -u pruvious pm2 start /opt/crearis/live/ecosystem.config.js
sudo -u pruvious pm2 save
# Follow pm2 startup instructions

# Phase 3 (as root)
sudo bash /opt/crearis/scripts/server_deploy_phase3_domain.sh
```

---

## PM2 Process Management

> **Note**: PM2 setup is handled automatically by Phase 2.
> The following commands are for managing the application after deployment.

### PM2 Commands (run as pruvious)

```bash
# Start application
pm2 start /opt/crearis/live/ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs crearis-vue

# Restart application
pm2 restart crearis-vue

# Stop application
pm2 stop crearis-vue

# Monitor resources
pm2 monit

# Save current PM2 state
pm2 save

# Setup PM2 to start on boot (run once)
pm2 startup
# Follow the instructions provided by the command
```

### Updating the Application (as pruvious)

```bash
# Navigate to source directory
cd /opt/crearis/source

# Pull latest changes
git pull origin main

# Install dependencies (if package.json changed)
pnpm install --frozen-lockfile

# Build application
pnpm build

# Sync to live directory
rsync -av --delete .output/ /opt/crearis/live/

# Restart PM2
pm2 restart crearis-vue
```

---

## Nginx & SSL Management

> **Note**: Nginx and SSL are configured automatically by Phase 3.
> The following information is for reference and troubleshooting.

### Nginx Configuration

Phase 3 creates `/etc/nginx/sites-available/crearis-vue` with:
- HTTP to HTTPS redirect
- SSL certificate configuration
- Reverse proxy to `localhost:3000`
- Security headers
- Static file caching

### Manual Nginx Commands (as root)

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /opt/crearis/logs/nginx-*.log
```

### SSL Certificate Management (as root)

```bash
# List certificates
sudo certbot certificates

# Renew certificates (dry run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Expand certificate to include more domains
sudo certbot --nginx -d theaterpedia.org -d www.theaterpedia.org --expand
```

---

## Reverse Proxy Setup (nginx)

> **Note**: This section is for reference only.
> Phase 3 automatically configures Nginx with optimal settings.

### nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Static assets (if serving separately)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables

The application uses `.env` for configuration. Copy from the example file:

```bash
cp .env.database.example .env
```

### Development Configuration (.env)
```bash
# =============================================================================
# SQLite Configuration (⚠️ OUTDATED - NEEDS FIXING)
# =============================================================================
# ⚠️ WARNING: SQLite support is outdated and needs further development
# ⚠️ Current codebase has dependencies on PostgreSQL JSONB fields
# ⚠️ SQLite compatibility requires significant refactoring
# DATABASE_TYPE=sqlite
# SQLITE_PATH=./crearis-vue.db

# =============================================================================
# PostgreSQL Configuration (✅ REQUIRED - Only Supported Database)
# =============================================================================
DATABASE_TYPE=postgresql
DB_USER=crearis_admin
DB_PASSWORD=your_secure_password
DB_NAME=crearis_development
DB_HOST=localhost
DB_PORT=5432

# Migration Control
SKIP_MIGRATIONS=false

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

### Production Environment Variables
Set these on your server or hosting platform:

```bash
# Database (PostgreSQL recommended for production)
DATABASE_TYPE=postgresql
DB_USER=crearis_admin
DB_PASSWORD=your_very_secure_password
DB_NAME=crearis_production
DB_HOST=your_db_host
DB_PORT=5432

# Or use direct DATABASE_URL
# DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Skip migrations in production (run manually)
SKIP_MIGRATIONS=true
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Performance Optimization

### 1. Enable gzip compression in nginx
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/js
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;
```

### 2. Static file caching
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Health Checks & Monitoring

### Simple Health Check Endpoint
Test if the server is responding:
```bash
curl http://localhost:3000/api/status/all
```

### PM2 Monitoring
```bash
pm2 monit
pm2 logs crearis-vue
pm2 restart crearis-vue
```

## Backup Strategy

### Database Backup

#### SQLite Backup (⚠️ OUTDATED - NOT SUPPORTED)
```bash
# ⚠️ WARNING: SQLite is outdated and not supported
# ⚠️ Application requires PostgreSQL JSONB fields
# ⚠️ SQLite backup scripts are provided for reference only

# Manual backup (OUTDATED)
# cp crearis-vue.db crearis-vue.db.backup.$(date +%Y%m%d_%H%M%S)

# Automated SQLite backup script (OUTDATED)
#!/bin/bash
# BACKUP_DIR="/var/backups/crearis-vue"
# mkdir -p $BACKUP_DIR
# cp crearis-vue.db "$BACKUP_DIR/crearis-vue.db.$(date +%Y%m%d_%H%M%S)"
# find $BACKUP_DIR -name "*.db.*" -mtime +7 -delete
```

#### PostgreSQL Backup (✅ REQUIRED)
```bash
# Manual backup
pg_dump -h localhost -U crearis_prod -d crearis_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated PostgreSQL backup script
#!/bin/bash
BACKUP_DIR="/var/backups/crearis-vue"
mkdir -p $BACKUP_DIR
export PGPASSWORD="your_password"
pg_dump -h localhost -U crearis_prod -d crearis_production > "$BACKUP_DIR/crearis_$(date +%Y%m%d_%H%M%S).sql"
gzip "$BACKUP_DIR/crearis_$(date +%Y%m%d_%H%M%S).sql"
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Application Backup
```bash
# Backup entire application
tar -czf crearis-vue-backup-$(date +%Y%m%d).tar.gz .output/ server/data/
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **PostgreSQL connection issues:**
   ```bash
   # Check PostgreSQL service
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U your_user -d your_database -c "SELECT version();"
   
   # Check PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

3. **⚠️ SQLite Migration Issues (OUTDATED DATABASE):**
   ```bash
   # If you encounter SQLite-related errors:
   # ERROR: SQLite does not support JSONB data types
   # ERROR: Column type 'jsonb' not recognized
   
   # SOLUTION: Migrate to PostgreSQL (required)
   # 1. Export existing data (if any):
   #    pnpm db:export-csv
   # 2. Set up PostgreSQL
   # 3. Configure .env for PostgreSQL
   # 4. Run migrations: pnpm db:migrate
   # 5. Import data: pnpm db:import-csv
   
   echo "⚠️ SQLite is no longer supported due to JSONB field dependencies"
   echo "✅ Please migrate to PostgreSQL for full functionality"
   ```

3. **Memory issues:**
   ```bash
   # Monitor memory usage
   htop
   # Increase PM2 memory limit
   pm2 restart crearis-vue --max-memory-restart 2G
   ```

### Log Files
```bash
# Application logs (PM2)
pm2 logs crearis-vue

# System logs
sudo journalctl -u nginx
sudo tail -f /var/log/nginx/error.log

# Check disk space
df -h
```

## Security Considerations

1. **Firewall setup:**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Hide sensitive files:**
   ```bash
   # Ensure .env and PASSWORDS.csv are not web-accessible
   chmod 600 .env server/data/PASSWORDS.csv
   ```

3. **Regular updates:**
   ```bash
   sudo apt update && sudo apt upgrade
   npm audit fix
   ```

## Testing Checklist

- [ ] Application starts without errors
- [ ] Database migrations complete successfully
- [ ] API endpoints respond correctly
- [ ] Frontend loads and navigates properly
- [ ] Authentication works (if implemented)
- [ ] SSL certificate is valid
- [ ] Backups are working
- [ ] Logs are being generated
- [ ] Performance is acceptable
- [ ] Security scans pass

## Server Directory Structure

### Recommended Server Layout

```
/opt/crearis/
├── source/                 # Git repository and build environment
│   ├── .git/              # Git repository
│   ├── src/               # Vue source code
│   ├── server/            # Nitro server source
│   │   └── data/         # Development data files
│   ├── package.json       # Dependencies
│   ├── .env              # Environment configuration
│   └── .output/          # Built application (after build)
├── live/                  # Production application files
│   ├── server/           # Production server files
│   │   └── data/ -> ../../data/  # Symlink to persistent data
│   ├── public/          # Static assets
│   └── ecosystem.config.js # PM2 configuration
├── data/                 # Application data (persistent, backed up)
│   ├── PASSWORDS.csv    # Generated passwords (gitignored)
│   └── backups/         # Database backups
├── logs/                # Application logs
│   ├── error.log
│   ├── out.log
│   └── combined.log
└── scripts/             # Deployment scripts
    ├── deploy.sh        # Main deployment script
    └── .env.deploy      # Deployment configuration
```

### Important: No Repo Restructuring Needed! ✅

**Your current repository structure is perfect and should NOT be changed.** The deployment script handles the mapping:

| Development (Repo)          | Production (Server)        | How It's Mapped                |
|-----------------------------|---------------------------|--------------------------------|
| `server/data/`              | `/opt/crearis/data/`      | Copied by deployment script    |
| `.output/`                  | `/opt/crearis/live/`      | Synced by deployment script    |
| `src/`, `server/` (source)  | `/opt/crearis/source/`    | Git clone                      |
| `.env`                      | `.env` in source/         | Used during build              |
| (none)                      | `/opt/crearis/logs/`      | Created by PM2                 |

**Key Points:**
- Keep your repo structure as-is (development-friendly)
- Deployment script extracts and organizes files for production
- Symlink connects live app to persistent data directory
- No manual file movement needed after deployment

### Why Separate Source and Live?

- **Security**: Source code and dependencies are not exposed in web directory
- **Performance**: Only built assets are served, reducing disk I/O
- **Backup**: Easier to backup just the live application without dev dependencies
- **Updates**: Can build and test before switching live version
- **Rollback**: Can maintain previous versions for quick rollback

## Server-Side Deployment Script

This approach builds the application on the server by pulling from GitHub, rather than uploading pre-built files.

### Setup

Create deployment configuration file `/opt/crearis/scripts/.env.deploy`:
```bash
# Deployment Configuration
GITHUB_REPO="https://github.com/theaterpedia/crearis-vue.git"
DEPLOY_BRANCH="theaterpedia.org"
# Alternative: use tags
# DEPLOY_TAG="theaterpedia-v0.1"

# Server Paths
SOURCE_DIR="/opt/crearis/source"
LIVE_DIR="/opt/crearis/live"
DATA_DIR="/opt/crearis/data"
LOG_DIR="/opt/crearis/logs"
BACKUP_DIR="/opt/crearis/data/backups"

# PM2 Configuration
PM2_APP_NAME="crearis-vue"
PM2_ECOSYSTEM_FILE="/opt/crearis/live/ecosystem.config.js"

# Database (ensure these match your .env)
DATABASE_TYPE="postgresql"
DB_HOST="localhost"
DB_USER="crearis_admin"
DB_NAME="crearis_production"
# DB_PASSWORD should be set in main .env file

# Notification (optional)
SLACK_WEBHOOK_URL=""
DISCORD_WEBHOOK_URL=""
```

### Main Deployment Script

Create `/opt/crearis/scripts/deploy.sh`:
```bash
#!/bin/bash

# Crearis Vue Server-Side Deployment Script
# Builds application on server from GitHub repository

set -e  # Exit on any error

# Load deployment configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Error: Deployment configuration file not found: $ENV_FILE"
    echo "Please create the configuration file first."
    exit 1
fi

source "$ENV_FILE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check if running as appropriate user
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a dedicated user."
    fi
    
    # Check required commands
    for cmd in git node npm pnpm pm2 psql; do
        if ! command -v $cmd &> /dev/null; then
            error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check PostgreSQL connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &> /dev/null; then
        error "Cannot connect to PostgreSQL database"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create directory structure
setup_directories() {
    log "📁 Setting up directory structure..."
    
    mkdir -p "$SOURCE_DIR" "$LIVE_DIR" "$DATA_DIR" "$LOG_DIR" "$BACKUP_DIR"
    chmod 755 "$SOURCE_DIR" "$LIVE_DIR" "$LOG_DIR"
    chmod 700 "$DATA_DIR" "$BACKUP_DIR"  # Secure data directories
    
    success "Directory structure created"
}

# Backup current deployment
backup_current() {
    if [[ -d "$LIVE_DIR" && "$(ls -A $LIVE_DIR)" ]]; then
        log "💾 Backing up current deployment..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        cp -r "$LIVE_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        success "Current deployment backed up to $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# Clone or update source repository
update_source() {
    log "📥 Updating source code..."
    
    if [[ -d "$SOURCE_DIR/.git" ]]; then
        cd "$SOURCE_DIR"
        git fetch origin
        
        if [[ -n "$DEPLOY_TAG" ]]; then
            log "🏷️  Checking out tag: $DEPLOY_TAG"
            git checkout "tags/$DEPLOY_TAG"
        else
            log "🌿 Checking out branch: $DEPLOY_BRANCH"
            git checkout "$DEPLOY_BRANCH"
            git pull origin "$DEPLOY_BRANCH"
        fi
    else
        log "📥 Cloning repository..."
        rm -rf "$SOURCE_DIR"
        git clone "$GITHUB_REPO" "$SOURCE_DIR"
        cd "$SOURCE_DIR"
        
        if [[ -n "$DEPLOY_TAG" ]]; then
            git checkout "tags/$DEPLOY_TAG"
        else
            git checkout "$DEPLOY_BRANCH"
        fi
    fi
    
    # Show current commit
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
    log "📝 Current commit: $COMMIT_HASH - $COMMIT_MESSAGE"
    
    success "Source code updated"
}

# Install dependencies and build
build_application() {
    log "📦 Installing dependencies..."
    cd "$SOURCE_DIR"
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    log "� Building application..."
    pnpm build
    
    # Verify build output
    if [[ ! -d "$SOURCE_DIR/.output" ]]; then
        error "Build failed - .output directory not found"
        exit 1
    fi
    
    success "Application built successfully"
}

# Deploy to live directory
deploy_to_live() {
    log "🚀 Deploying to live directory..."
    
    # Stop PM2 application if running
    if pm2 describe "$PM2_APP_NAME" &> /dev/null; then
        log "⏹️  Stopping PM2 application..."
        pm2 stop "$PM2_APP_NAME"
    fi
    
    # Copy built application
    rsync -av --delete "$SOURCE_DIR/.output/" "$LIVE_DIR/"
    
    # Copy data files that should persist
    if [[ -d "$SOURCE_DIR/server/data" ]]; then
        log "📋 Copying persistent data files..."
        mkdir -p "$DATA_DIR"
        
        # Copy PASSWORDS.csv if it exists
        if [[ -f "$SOURCE_DIR/server/data/PASSWORDS.csv" ]]; then
            cp "$SOURCE_DIR/server/data/PASSWORDS.csv" "$DATA_DIR/"
            chmod 600 "$DATA_DIR/PASSWORDS.csv"  # Secure permissions
        fi
        
        # Copy any other data files (excluding .gitkeep, backups)
        find "$SOURCE_DIR/server/data" -type f \
            ! -name '.gitkeep' \
            ! -name '*.backup' \
            ! -name '*.backup_*' \
            -exec cp {} "$DATA_DIR/" \;
    fi
    
    # Create symlink from live app to data directory
    # This allows the app to access /opt/crearis/data/ as if it's server/data/
    if [[ ! -L "$LIVE_DIR/server/data" ]]; then
        mkdir -p "$LIVE_DIR/server"
        ln -sf "$DATA_DIR" "$LIVE_DIR/server/data"
    fi
    
    # Create PM2 ecosystem file
    create_pm2_config
    
    success "Application deployed to live directory"
}

# Create PM2 ecosystem configuration
create_pm2_config() {
    log "⚙️  Creating PM2 configuration..."
    
    cat > "$PM2_ECOSYSTEM_FILE" << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: 'server/index.mjs',
    cwd: '$LIVE_DIR',
    env: {
      NODE_ENV: 'production',
      DATABASE_TYPE: '$DATABASE_TYPE',
      DB_HOST: '$DB_HOST',
      DB_USER: '$DB_USER',
      DB_NAME: '$DB_NAME',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true,
    
    // Restart strategies
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Health monitoring
    health_check_grace_period: 5000,
    health_check_fatal_exceptions: true
  }]
}
EOF
    
    success "PM2 configuration created"
}

# Start or restart PM2 application
manage_pm2() {
    log "🔄 Managing PM2 application..."
    
    cd "$LIVE_DIR"
    
    if pm2 describe "$PM2_APP_NAME" &> /dev/null; then
        log "🔄 Restarting PM2 application..."
        pm2 restart "$PM2_ECOSYSTEM_FILE"
    else
        log "▶️  Starting PM2 application..."
        pm2 start "$PM2_ECOSYSTEM_FILE"
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Wait for application to start
    sleep 5
    
    # Check if application is running
    if pm2 describe "$PM2_APP_NAME" | grep -q "online"; then
        success "PM2 application is running"
    else
        error "PM2 application failed to start"
        pm2 logs "$PM2_APP_NAME" --lines 20
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log "🗄️  Running database migrations..."
    cd "$SOURCE_DIR"
    
    # Set environment variables for migration
    export DATABASE_TYPE="$DATABASE_TYPE"
    export DB_HOST="$DB_HOST"
    export DB_USER="$DB_USER"
    export DB_NAME="$DB_NAME"
    
    pnpm db:migrate
    
    success "Database migrations completed"
}

# Health check
health_check() {
    log "🏥 Performing health check..."
    
    # Wait for application to fully start
    sleep 10
    
    # Check if port is listening
    if ! netstat -tuln | grep -q ":3000 "; then
        error "Application is not listening on port 3000"
        exit 1
    fi
    
    # Check HTTP response
    if curl -f -s http://localhost:3000/api/status/all > /dev/null; then
        success "Health check passed - application is responding"
    else
        error "Health check failed - application is not responding"
        exit 1
    fi
}

# Send notifications
send_notifications() {
    local status="$1"
    local message="$2"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Crearis Vue Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        curl -H "Content-Type: application/json" \
            -d "{\"content\":\"🚀 Crearis Vue Deployment $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" &> /dev/null || true
    fi
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up..."
    
    # Remove old backups (keep last 5)
    find "$BACKUP_DIR" -name "backup-*" -type d | sort -r | tail -n +6 | xargs rm -rf
    
    # Clean npm cache
    cd "$SOURCE_DIR"
    pnpm store prune || true
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    local START_TIME=$(date +%s)
    
    log "🚀 Starting Crearis Vue deployment..."
    log "Repository: $GITHUB_REPO"
    log "Branch/Tag: ${DEPLOY_TAG:-$DEPLOY_BRANCH}"
    
    # Trap errors and send failure notification
    trap 'error "Deployment failed!"; send_notifications "FAILED" "Deployment process encountered an error"; exit 1' ERR
    
    check_prerequisites
    setup_directories
    backup_current
    update_source
    build_application
    run_migrations
    deploy_to_live
    manage_pm2
    health_check
    cleanup
    
    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    
    success "� Deployment completed successfully in ${DURATION}s"
    log "�🌐 Application available at: http://localhost:3000"
    
    send_notifications "SUCCESS" "Deployment completed in ${DURATION}s"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

Make executable: `chmod +x /opt/crearis/scripts/deploy.sh`

### Usage

```bash
# Deploy from branch
sudo /opt/crearis/scripts/deploy.sh

# Deploy specific tag (modify .env.deploy first)
# Set DEPLOY_TAG="theaterpedia-v0.1" and comment out DEPLOY_BRANCH
sudo /opt/crearis/scripts/deploy.sh

# Monitor deployment
pm2 logs crearis-vue --lines 50
pm2 monit
```

### Manual Deployment Commands

```bash
# One-time server setup
sudo mkdir -p /opt/crearis/{source,live,data,logs,scripts}
sudo chown -R $USER:$USER /opt/crearis

# Deploy
cd /opt/crearis/scripts
./deploy.sh

# Monitor
pm2 status
pm2 logs crearis-vue
pm2 monit

# Rollback (if needed)
pm2 stop crearis-vue
rsync -av /opt/crearis/data/backups/backup-YYYYMMDD-HHMMSS/ /opt/crearis/live/
pm2 start crearis-vue
```