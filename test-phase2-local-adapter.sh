#!/bin/bash
# Phase 2 Integration Test
# Tests local upload and shape regeneration features
#
# Prerequisites:
# 1. Server running on localhost:3000
# 2. Owner user exists (ID: 1)
# 3. Test image available
#
# Usage: ./test-phase2-local-adapter.sh [path/to/test/image]

set -e

# Configuration
BASE_URL="http://localhost:3000"
TEST_IMAGE="${1:-./test-results/bg.png}"
OWNER_ID=1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 2 Local Adapter Integration    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check server
echo -e "${YELLOW}Checking server status...${NC}"
if ! curl -sf "$BASE_URL/api/projects" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not responding at $BASE_URL${NC}"
    echo "Please start the server: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

# Check test image
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${RED}❌ Test image not found: $TEST_IMAGE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Test image found: $TEST_IMAGE${NC}\n"

# Generate unique xmlid
TIMESTAMP=$(date +%s)
XMLID="tp.image.phase2test-upload_${TIMESTAMP}"

# ============================================================================
# TEST 1: Local File Upload
# ============================================================================
echo -e "${BLUE}═══ TEST 1: Local File Upload ═══${NC}"
echo "Uploading: $TEST_IMAGE"
echo "XMLID: $XMLID"

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/upload" \
    -F "file=@$TEST_IMAGE" \
    -F "xmlid=$XMLID" \
    -F "owner_id=$OWNER_ID" \
    -F "xml_subject=test" \
    -F "alt_text=Phase 2 integration test" \
    -F "license=BY" \
    -F "ctags=0,2,1,0")

echo "$UPLOAD_RESPONSE" | jq '.'

# Extract data
SUCCESS=$(echo "$UPLOAD_RESPONSE" | jq -r '.success // false')
IMAGE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.image_id // empty')
SOURCE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.urls.source // empty')

if [ "$SUCCESS" != "true" ] || [ -z "$IMAGE_ID" ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Upload successful - Image ID: $IMAGE_ID${NC}\n"

# ============================================================================
# TEST 2: Verify File Storage
# ============================================================================
echo -e "${BLUE}═══ TEST 2: File Storage Verification ═══${NC}"

# Check if files exist in .local_images
STORAGE_PATH=".local_images"
SOURCE_FILE=$(find "$STORAGE_PATH/source" -name "*${XMLID}*" 2>/dev/null | head -1)
SQUARE_FILE=$(find "$STORAGE_PATH/shapes" -name "*${XMLID}*square*" 2>/dev/null | head -1)

if [ -n "$SOURCE_FILE" ]; then
    echo -e "${GREEN}✓ Source file exists: $SOURCE_FILE${NC}"
    ls -lh "$SOURCE_FILE"
else
    echo -e "${RED}❌ Source file not found in $STORAGE_PATH/source${NC}"
fi

if [ -n "$SQUARE_FILE" ]; then
    echo -e "${GREEN}✓ Shape files exist${NC}"
    ls -lh "$STORAGE_PATH/shapes/"*"${XMLID}"*.webp | head -4
else
    echo -e "${RED}❌ Shape files not found${NC}"
fi

echo ""

# ============================================================================
# TEST 3: Image Retrieval via API
# ============================================================================
echo -e "${BLUE}═══ TEST 3: Image Retrieval ═══${NC}"

# Test source image
SOURCE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$SOURCE_URL")
if [ "$SOURCE_HTTP" -eq 200 ]; then
    echo -e "${GREEN}✓ Source image accessible (HTTP $SOURCE_HTTP)${NC}"
else
    echo -e "${RED}❌ Source image not accessible (HTTP $SOURCE_HTTP)${NC}"
fi

# Test all shapes
for SHAPE in square wide vertical thumb; do
    SHAPE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r ".urls.$SHAPE // empty")
    if [ -n "$SHAPE_URL" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$SHAPE_URL")
        if [ "$HTTP_CODE" -eq 200 ]; then
            echo -e "${GREEN}✓ $SHAPE shape accessible (HTTP $HTTP_CODE)${NC}"
        else
            echo -e "${RED}❌ $SHAPE shape not accessible (HTTP $HTTP_CODE)${NC}"
        fi
    fi
done

echo ""

# ============================================================================
# TEST 4: Database Record
# ============================================================================
echo -e "${BLUE}═══ TEST 4: Database Record ═══${NC}"

DB_RESPONSE=$(curl -s "$BASE_URL/api/images/$IMAGE_ID")
echo "$DB_RESPONSE" | jq '.image | {id, name, xmlid, fileformat, alt_text, img_square: .img_square.url}'

if echo "$DB_RESPONSE" | jq -e '.image.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database record found${NC}"
    
    # Check shape URLs in DB
    SHAPE_SQUARE_URL=$(echo "$DB_RESPONSE" | jq -r '.image.img_square.url // empty')
    if [ -n "$SHAPE_SQUARE_URL" ]; then
        echo -e "${GREEN}✓ Shape URLs stored in database${NC}"
    else
        echo -e "${RED}❌ Shape URLs missing in database${NC}"
    fi
else
    echo -e "${RED}❌ Database record not found${NC}"
fi

echo ""

# ============================================================================
# TEST 5: Shape Regeneration
# ============================================================================
echo -e "${BLUE}═══ TEST 5: Shape Regeneration ═══${NC}"

# Regenerate square shape only
echo "Regenerating square shape for image $IMAGE_ID..."

REGEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/$IMAGE_ID/regenerate-shapes" \
    -H "Content-Type: application/json" \
    -d '{
        "shapes": ["square"]
    }')

echo "$REGEN_RESPONSE" | jq '.'

REGEN_SUCCESS=$(echo "$REGEN_RESPONSE" | jq -r '.success // false')
if [ "$REGEN_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Shape regeneration successful${NC}"
else
    echo -e "${RED}❌ Shape regeneration failed${NC}"
fi

echo ""

# ============================================================================
# TEST 6: XYZ Regeneration
# ============================================================================
echo -e "${BLUE}═══ TEST 6: XYZ Transformation ═══${NC}"

echo "Regenerating with XYZ focal point (x:30, y:30, z:80)..."

XYZ_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/$IMAGE_ID/regenerate-shapes" \
    -H "Content-Type: application/json" \
    -d '{
        "shapes": ["wide"],
        "xyz": {
            "wide": { "x": 30, "y": 30, "z": 80 }
        }
    }')

echo "$XYZ_RESPONSE" | jq '.'

XYZ_SUCCESS=$(echo "$XYZ_RESPONSE" | jq -r '.success // false')
if [ "$XYZ_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ XYZ transformation successful${NC}"
    
    # Check if transform file was created
    TRANSFORM_FILE=$(find "$STORAGE_PATH/transforms" -name "*${XMLID}*" 2>/dev/null | head -1)
    if [ -n "$TRANSFORM_FILE" ]; then
        echo -e "${GREEN}✓ Transform file created: $TRANSFORM_FILE${NC}"
    fi
else
    echo -e "${RED}❌ XYZ transformation failed${NC}"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Test Summary                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Image ID: $IMAGE_ID"
echo "XMLID: $XMLID"
echo "Source: $SOURCE_URL"
echo ""
echo -e "${GREEN}All Phase 2 tests completed!${NC}"
echo ""
echo "To view the uploaded image:"
echo "  curl $BASE_URL$SOURCE_URL -o test-output.png"
echo ""
echo "To cleanup test files:"
echo "  rm -f $STORAGE_PATH/source/*${XMLID}*"
echo "  rm -f $STORAGE_PATH/shapes/*${XMLID}*"
echo "  rm -f $STORAGE_PATH/transforms/*${XMLID}*"
