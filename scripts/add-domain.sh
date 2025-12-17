#!/bin/bash
# =============================================================================
# add-domain.sh - Add a custom domain to the Crearis Vue application
# =============================================================================
# Usage: sudo ./add-domain.sh <domain> <domaincode>
# Example: sudo ./add-domain.sh dasei.eu dasei
#
# This script:
# 1. Obtains SSL certificate via Let's Encrypt/certbot
# 2. Adds the domain to the nginx map file
# 3. Reloads nginx
#
# Prerequisites:
# - DNS must be configured (A record pointing to this server)
# - certbot must be installed
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
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@theaterpedia.org}"

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Usage: $0 <domain> <domaincode>${NC}"
    echo "Example: $0 dasei.eu dasei"
    exit 1
fi

DOMAIN=$1
DOMAINCODE=$2

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

echo "======================================"
echo -e "${GREEN}Adding domain: ${DOMAIN}${NC}"
echo -e "Project code: ${DOMAINCODE}"
echo "======================================"

# Step 1: Check if domain already exists in map
if grep -q "\"${DOMAINCODE}\"" "$NGINX_MAP_FILE" 2>/dev/null; then
    if grep -q "${DOMAIN}" "$NGINX_MAP_FILE"; then
        echo -e "${YELLOW}Warning: Domain ${DOMAIN} already exists in nginx map${NC}"
    fi
fi

# Step 2: Verify DNS (optional check)
echo ""
echo -e "${YELLOW}Step 1: Verifying DNS...${NC}"
if host "$DOMAIN" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ DNS record found for ${DOMAIN}${NC}"
else
    echo -e "${RED}✗ DNS record not found for ${DOMAIN}${NC}"
    echo "Please ensure DNS A record points to this server before continuing."
    read -p "Continue anyway? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        exit 1
    fi
fi

# Step 3: Get SSL certificate
echo ""
echo -e "${YELLOW}Step 2: Obtaining SSL certificate...${NC}"
certbot certonly --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$CERTBOT_EMAIL" \
    || {
        echo -e "${RED}Failed to obtain SSL certificate${NC}"
        echo "Check certbot logs: /var/log/letsencrypt/letsencrypt.log"
        exit 1
    }

echo -e "${GREEN}✓ SSL certificate obtained${NC}"

# Step 4: Add to nginx map
echo ""
echo -e "${YELLOW}Step 3: Adding to nginx map...${NC}"

# Create map file if it doesn't exist
if [ ! -f "$NGINX_MAP_FILE" ]; then
    echo -e "${YELLOW}Creating nginx map file...${NC}"
    cat > "$NGINX_MAP_FILE" << 'EOF'
# Domain to domaincode mapping
# Auto-managed by add-domain.sh and add-subdomain.sh
# Format: domain "domaincode";

map $host $domaincode {
    default "";
    
    # Custom domains
}
EOF
fi

# Add domain entries (before the closing brace)
# Use sed to insert before the last line (closing brace)
if ! grep -q "^[[:space:]]*${DOMAIN}[[:space:]]" "$NGINX_MAP_FILE"; then
    # Insert the domain mapping
    sed -i "/^}$/i\\    ${DOMAIN}        \"${DOMAINCODE}\";" "$NGINX_MAP_FILE"
    sed -i "/^}$/i\\    www.${DOMAIN}    \"${DOMAINCODE}\";" "$NGINX_MAP_FILE"
    echo -e "${GREEN}✓ Added ${DOMAIN} to nginx map${NC}"
else
    echo -e "${YELLOW}Domain already in map file${NC}"
fi

# Step 5: Add server_name to main config if needed
echo ""
echo -e "${YELLOW}Step 4: Checking nginx main config...${NC}"

NGINX_SITE_CONFIG="/etc/nginx/sites-available/crearis-vue"
if [ -f "$NGINX_SITE_CONFIG" ]; then
    if ! grep -q "$DOMAIN" "$NGINX_SITE_CONFIG"; then
        echo -e "${YELLOW}Note: You may need to add ${DOMAIN} to server_name in ${NGINX_SITE_CONFIG}${NC}"
        echo "Look for the 'server_name' directive and add: ${DOMAIN} www.${DOMAIN}"
    fi
fi

# Step 6: Test and reload nginx
echo ""
echo -e "${YELLOW}Step 5: Testing nginx configuration...${NC}"
nginx -t || {
    echo -e "${RED}Nginx configuration test failed!${NC}"
    echo "Please check the configuration manually."
    exit 1
}

echo -e "${GREEN}✓ Nginx configuration OK${NC}"

echo ""
echo -e "${YELLOW}Step 6: Reloading nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

# Done
echo ""
echo "======================================"
echo -e "${GREEN}✅ Domain ${DOMAIN} configured successfully!${NC}"
echo "======================================"
echo ""
echo "The domain now routes to project: ${DOMAINCODE}"
echo ""
echo "URLs:"
echo "  https://${DOMAIN} → /sites/${DOMAINCODE}"
echo "  https://${DOMAIN}/posts/1 → /sites/${DOMAINCODE}/posts/1"
echo "  https://${DOMAIN}/events/1 → /sites/${DOMAINCODE}/events/1"
echo ""
echo "Don't forget to register this domain in the admin panel!"
