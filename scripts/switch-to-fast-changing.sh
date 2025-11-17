#!/bin/bash

#############################################################
# Production Mode Switcher: FAST-CHANGING PRODUCTION
#############################################################
# 
# This mode optimizes for rapid iteration with near-HMR
# experience. Use during alpha/beta or when making frequent
# code changes that need immediate browser visibility.
#
# Characteristics:
# - Nginx disables asset caching (no-cache headers)
# - PM2 uses delete+start (clears Nitro memory cache)
# - Optimized for development speed
# - Higher server load, immediate change visibility
#############################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Switching to FAST-CHANGING PRODUCTION Mode${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

NGINX_CONFIG="/etc/nginx/sites-available/crearis-vue"
NGINX_BACKUP="/etc/nginx/sites-available/crearis-vue.fast-changing"

echo -e "${YELLOW}📋 Mode Characteristics:${NC}"
echo "   • Nginx: No caching (immediate updates)"
echo "   • PM2: Delete+start (clears memory)"
echo "   • Optimization: Development speed"
echo "   • Use case: Alpha/beta, frequent changes"
echo ""

# Step 1: Backup current Nginx config
echo -e "${BLUE}Step 1: Backing up Nginx configuration...${NC}"
cp "$NGINX_CONFIG" "$NGINX_BACKUP"
echo -e "${GREEN}✓ Backed up to $NGINX_BACKUP${NC}"
echo ""

# Step 2: Update Nginx configuration to disable caching
echo -e "${BLUE}Step 2: Configuring Nginx for no-cache mode...${NC}"

# Update the /assets/ location block
sudo sed -i '/location \/assets\/ {/,/}/c\
    location /assets/ {\
        alias /opt/crearis/live/.output/public/assets/;\
        expires -1;\
        add_header Cache-Control "no-store, no-cache, must-revalidate";\
        access_log off;\
    }' "$NGINX_CONFIG"

echo -e "${GREEN}✓ Nginx configured for no-cache mode${NC}"
echo ""

# Step 3: Test and reload Nginx
echo -e "${BLUE}Step 3: Testing and reloading Nginx...${NC}"
if nginx -t 2>&1 | grep -q "successful"; then
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed${NC}"
    echo "Restoring backup..."
    cp "$NGINX_BACKUP" "$NGINX_CONFIG"
    exit 1
fi
echo ""

# Step 4: Update rebuild script to use PM2 delete+start
echo -e "${BLUE}Step 4: Configuring rebuild script for memory-clearing restart...${NC}"

REBUILD_SCRIPT="/opt/crearis/source/scripts/dev_rebuild_restart.sh"

# Replace pm2 restart with pm2 delete/start
sudo -u pruvious sed -i '/echo.*Using standard restart/,/pm2 restart.*--update-env/c\
echo "   Deleting process to clear memory cache..."\
\
# Delete and recreate PM2 process to clear Nitro memory cache\
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true\
pm2 start ecosystem.config.cjs' "$REBUILD_SCRIPT"

echo -e "${GREEN}✓ Rebuild script configured for memory-clearing restart${NC}"
echo ""

# Step 5: Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ FAST-CHANGING PRODUCTION Mode Activated${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Active Settings:${NC}"
echo "   • Nginx caching: Disabled (no-cache)"
echo "   • PM2 restart: Delete+start (clears memory)"
echo "   • Performance: Optimized for rapid changes"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "   • Higher server load due to no caching"
echo "   • Each deployment clears PM2 process (brief downtime)"
echo "   • Users always get fresh content (hard refresh not needed)"
echo ""
echo -e "${YELLOW}To deploy changes:${NC}"
echo "   sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh"
echo ""
echo -e "${YELLOW}To switch back to stable production:${NC}"
echo "   sudo bash /opt/crearis/source/scripts/switch-to-stable-production.sh"
echo ""
echo -e "${YELLOW}Recommended: Switch to stable mode when:${NC}"
echo "   • Moving to production release"
echo "   • Code changes become infrequent"
echo "   • Performance optimization is priority"
echo ""
