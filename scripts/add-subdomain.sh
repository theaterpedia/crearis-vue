#!/bin/bash
# =============================================================================
# add-subdomain.sh - Add a subdomain to the Crearis Vue application
# =============================================================================
# Usage: sudo ./add-subdomain.sh <subdomain> <sysdomain> <domaincode>
# Example: sudo ./add-subdomain.sh dasei theaterpedia.org dasei
#
# This script:
# 1. Adds the subdomain to the nginx map file
# 2. Reloads nginx
#
# Note: Subdomains use wildcard SSL certificates, so no certbot needed.
# Prerequisites:
# - Wildcard SSL certificate for *.sysdomain must exist
# - nginx must be running
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
if [ $# -lt 3 ]; then
    echo -e "${RED}Usage: $0 <subdomain> <sysdomain> <domaincode>${NC}"
    echo "Example: $0 dasei theaterpedia.org dasei"
    exit 1
fi

SUBDOMAIN=$1
SYSDOMAIN=$2
DOMAINCODE=$3
FULL_DOMAIN="${SUBDOMAIN}.${SYSDOMAIN}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

echo "======================================"
echo -e "${GREEN}Adding subdomain: ${FULL_DOMAIN}${NC}"
echo -e "Project code: ${DOMAINCODE}"
echo "======================================"

# Check if map file exists
if [ ! -f "$NGINX_MAP_FILE" ]; then
    echo -e "${YELLOW}Creating nginx map file...${NC}"
    cat > "$NGINX_MAP_FILE" << 'EOF'
# Domain to domaincode mapping
# Auto-managed by add-domain.sh and add-subdomain.sh
# Format: domain "domaincode";

map $host $domaincode {
    default "";
    
    # Subdomains (wildcard SSL)
    
    # Custom domains
}
EOF
fi

# Check if subdomain already exists
if grep -q "^[[:space:]]*${FULL_DOMAIN}[[:space:]]" "$NGINX_MAP_FILE"; then
    echo -e "${YELLOW}Subdomain ${FULL_DOMAIN} already exists in nginx map${NC}"
    exit 0
fi

# Add subdomain to map (insert before "# Custom domains" or before closing brace)
echo ""
echo -e "${YELLOW}Adding to nginx map...${NC}"

if grep -q "# Custom domains" "$NGINX_MAP_FILE"; then
    # Insert before "# Custom domains" section
    sed -i "/# Custom domains/i\\    ${FULL_DOMAIN}   \"${DOMAINCODE}\";" "$NGINX_MAP_FILE"
else
    # Insert before closing brace
    sed -i "/^}$/i\\    ${FULL_DOMAIN}   \"${DOMAINCODE}\";" "$NGINX_MAP_FILE"
fi

echo -e "${GREEN}✓ Added ${FULL_DOMAIN} to nginx map${NC}"

# Test nginx config
echo ""
echo -e "${YELLOW}Testing nginx configuration...${NC}"
nginx -t || {
    echo -e "${RED}Nginx configuration test failed!${NC}"
    # Rollback
    sed -i "/${FULL_DOMAIN}/d" "$NGINX_MAP_FILE"
    echo "Rolled back changes to map file."
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
echo -e "${GREEN}✅ Subdomain ${FULL_DOMAIN} configured successfully!${NC}"
echo "======================================"
echo ""
echo "The subdomain now routes to project: ${DOMAINCODE}"
echo ""
echo "URL: https://${FULL_DOMAIN} → /sites/${DOMAINCODE}"
