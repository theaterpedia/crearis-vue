#!/bin/bash

# =============================================================================
# User Import Script Wrapper
# =============================================================================
# Usage: bash scripts/import-users.sh
# Location: Run from /opt/crearis/live/ or /opt/crearis/source/
# =============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}  User Import Script${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo ""

# Detect if we're in the live or source directory
if [[ -f "server/index.mjs" ]]; then
    # We're in the live directory (.output/)
    echo -e "${YELLOW}⚠️  Running from live directory${NC}"
    echo -e "${YELLOW}   This script should be run from the source directory${NC}"
    echo ""
    echo "To import users:"
    echo "  1. cd /opt/crearis/source"
    echo "  2. bash scripts/import-users.sh"
    exit 1
fi

# Check if tsx is available
if ! command -v tsx &> /dev/null; then
    echo -e "${RED}❌ tsx not found${NC}"
    echo ""
    echo "Install tsx globally:"
    echo "  npm install -g tsx"
    echo ""
    echo "Or use local tsx:"
    echo "  npx tsx server/scripts/import-users.ts"
    exit 1
fi

# Check if import file exists
IMPORT_FILE="server/data/import/import-users.csv"

if [[ -f "$IMPORT_FILE" ]]; then
    echo -e "${GREEN}✓${NC} Found import file: $IMPORT_FILE"
    echo ""
    
    # Show first few lines
    echo "Preview (first 3 rows):"
    echo "----------------------------------------"
    head -n 4 "$IMPORT_FILE"
    echo "----------------------------------------"
    echo ""
    
    # Ask for confirmation
    read -p "Continue with import? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Import cancelled"
        exit 0
    fi
else
    echo -e "${YELLOW}⚠️  Import file not found: $IMPORT_FILE${NC}"
    echo ""
    echo "Creating import directory..."
    mkdir -p server/data/import
    chmod 700 server/data/import
    echo ""
    echo "To import users:"
    echo "  1. Create file: $IMPORT_FILE"
    echo "  2. Add CSV data with headers:"
    echo "     sysmail,extmail,username,password,role,lang,instructor_id/xmlid"
    echo "  3. Run this script again"
    echo ""
    echo "Example CSV content:"
    echo '  "john.doe@example.com","","John Doe","","user","de",""'
    echo '  "jane.smith@example.com","","Jane Smith","","user","en","project.partner.jane_smith"'
    exit 1
fi

# Run the import script
echo ""
echo -e "${GREEN}Running import...${NC}"
echo ""

tsx server/scripts/import-users.ts

# Check exit code
if [[ $? -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}==================================================================${NC}"
    echo -e "${GREEN}✅ Import completed successfully${NC}"
    echo -e "${GREEN}==================================================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review PASSWORDS.csv for new user passwords"
    echo "  2. Securely distribute passwords to new users"
    echo "  3. Check archived import file in server/data/import/archive/"
else
    echo ""
    echo -e "${RED}==================================================================${NC}"
    echo -e "${RED}❌ Import failed${NC}"
    echo -e "${RED}==================================================================${NC}"
    echo ""
    echo "Check the error messages above for details"
    exit 1
fi
