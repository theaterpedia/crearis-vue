#!/bin/bash
# =============================================================================
# remove-domain.sh - Remove a domain from the Crearis Vue nginx configuration
# =============================================================================
# Usage: sudo ./remove-domain.sh <domain>
# Example: sudo ./remove-domain.sh dasei.eu
#
# This script:
# 1. Removes the domain from the nginx map file
# 2. Reloads nginx
#
# Note: This does NOT revoke SSL certificates. Use certbot delete for that.
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NGINX_MAP_FILE="/etc/nginx/conf.d/domain-map.conf"

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Usage: $0 <domain>${NC}"
    echo "Example: $0 dasei.eu"
    echo "Example: $0 dasei.theaterpedia.org"
    exit 1
fi

DOMAIN=$1

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

echo "======================================"
echo -e "${YELLOW}Removing domain: ${DOMAIN}${NC}"
echo "======================================"

# Check if map file exists
if [ ! -f "$NGINX_MAP_FILE" ]; then
    echo -e "${RED}Nginx map file not found: ${NGINX_MAP_FILE}${NC}"
    exit 1
fi

# Check if domain exists in map
if ! grep -q "${DOMAIN}" "$NGINX_MAP_FILE"; then
    echo -e "${YELLOW}Domain ${DOMAIN} not found in nginx map${NC}"
    exit 0
fi

# Backup the map file
cp "$NGINX_MAP_FILE" "${NGINX_MAP_FILE}.bak"
echo -e "${GREEN}✓ Backed up map file${NC}"

# Remove domain entries
echo ""
echo -e "${YELLOW}Removing from nginx map...${NC}"

# Remove lines containing the domain
sed -i "/${DOMAIN}/d" "$NGINX_MAP_FILE"

# Also remove www variant if it's a custom domain (not subdomain)
if [[ ! "$DOMAIN" =~ \. ]]; then
    # This shouldn't happen, but just in case
    :
elif [[ "$DOMAIN" != www.* ]]; then
    # Remove www variant too
    sed -i "/www.${DOMAIN}/d" "$NGINX_MAP_FILE"
fi

echo -e "${GREEN}✓ Removed ${DOMAIN} from nginx map${NC}"

# Test nginx config
echo ""
echo -e "${YELLOW}Testing nginx configuration...${NC}"
nginx -t || {
    echo -e "${RED}Nginx configuration test failed!${NC}"
    # Rollback
    cp "${NGINX_MAP_FILE}.bak" "$NGINX_MAP_FILE"
    echo "Rolled back changes from backup."
    exit 1
}

echo -e "${GREEN}✓ Nginx configuration OK${NC}"

# Reload nginx
echo ""
echo -e "${YELLOW}Reloading nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

# Done
echo ""
echo "======================================"
echo -e "${GREEN}✅ Domain ${DOMAIN} removed from nginx config${NC}"
echo "======================================"
echo ""
echo "Note: SSL certificate was NOT removed."
echo "To remove the SSL certificate, run:"
echo "  sudo certbot delete --cert-name ${DOMAIN}"
echo ""
echo "Don't forget to remove this domain from the admin panel database!"
