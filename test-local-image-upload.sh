#!/bin/bash
# Test script for local image adapter upload and retrieval
# 
# Prerequisites:
# 1. Server running on localhost:3000
# 2. Owner user exists in database (ID: 1)
# 3. Test image file available
# 
# Usage: ./test-local-image-upload.sh [path/to/test/image.jpg]

set -e

# Configuration
BASE_URL="http://localhost:3000"
TEST_IMAGE="${1:-test-image.jpg}"
OWNER_ID=1
XMLID="tp.image.test-upload_$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Local Image Adapter Test ===${NC}\n"

# Check if test image exists
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${RED}❌ Test image not found: $TEST_IMAGE${NC}"
    echo "Please provide a test image path as argument"
    echo "Example: ./test-local-image-upload.sh path/to/image.jpg"
    exit 1
fi

echo -e "Test Configuration:"
echo -e "  Base URL: $BASE_URL"
echo -e "  Test Image: $TEST_IMAGE"
echo -e "  XMLID: $XMLID"
echo -e "  Owner ID: $OWNER_ID\n"

# Step 1: Upload image
echo -e "${YELLOW}Step 1: Uploading image...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/upload" \
    -F "file=@$TEST_IMAGE" \
    -F "xmlid=$XMLID" \
    -F "owner_id=$OWNER_ID" \
    -F "xml_subject=test" \
    -F "alt_text=Test image upload" \
    -F "license=BY" \
    -F "ctags=0")

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

# Extract image_id and URLs from response
IMAGE_ID=$(echo "$RESPONSE" | jq -r '.image_id // empty')
SOURCE_URL=$(echo "$RESPONSE" | jq -r '.urls.source // empty')
SQUARE_URL=$(echo "$RESPONSE" | jq -r '.urls.square // empty')

if [ -z "$IMAGE_ID" ]; then
    echo -e "${RED}❌ Upload failed - no image_id in response${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Upload successful - Image ID: $IMAGE_ID${NC}\n"

# Step 2: Verify source image
echo -e "${YELLOW}Step 2: Verifying source image...${NC}"
SOURCE_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$SOURCE_URL")

if [ "$SOURCE_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Source image accessible: $SOURCE_URL${NC}"
else
    echo -e "${RED}❌ Source image not accessible (HTTP $SOURCE_HTTP_CODE): $SOURCE_URL${NC}"
fi

# Step 3: Verify square shape
echo -e "\n${YELLOW}Step 3: Verifying square shape...${NC}"
SQUARE_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$SQUARE_URL")

if [ "$SQUARE_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Square shape accessible: $SQUARE_URL${NC}"
else
    echo -e "${RED}❌ Square shape not accessible (HTTP $SQUARE_HTTP_CODE): $SQUARE_URL${NC}"
fi

# Step 4: Check database record
echo -e "\n${YELLOW}Step 4: Retrieving database record...${NC}"
DB_RESPONSE=$(curl -s "$BASE_URL/api/images/$IMAGE_ID")

echo "$DB_RESPONSE" | jq '.image | {id, name, xmlid, url, alt_text, fileformat}' || echo "$DB_RESPONSE"

if echo "$DB_RESPONSE" | jq -e '.image.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database record found${NC}"
else
    echo -e "${RED}❌ Database record not found${NC}"
fi

# Step 5: Verify all shapes
echo -e "\n${YELLOW}Step 5: Verifying all shape variants...${NC}"
WIDE_URL=$(echo "$RESPONSE" | jq -r '.urls.wide // empty')
VERTICAL_URL=$(echo "$RESPONSE" | jq -r '.urls.vertical // empty')
THUMB_URL=$(echo "$RESPONSE" | jq -r '.urls.thumb // empty')

for SHAPE_URL in "$WIDE_URL" "$VERTICAL_URL" "$THUMB_URL"; do
    SHAPE_NAME=$(echo "$SHAPE_URL" | grep -oP '(?<=_)[a-z]+(?=\.webp)')
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$SHAPE_URL")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ $SHAPE_NAME shape accessible${NC}"
    else
        echo -e "${RED}❌ $SHAPE_NAME shape not accessible (HTTP $HTTP_CODE)${NC}"
    fi
done

# Summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
echo -e "Image ID: $IMAGE_ID"
echo -e "XMLID: $XMLID"
echo -e "Test completed. Check output above for any failures."
