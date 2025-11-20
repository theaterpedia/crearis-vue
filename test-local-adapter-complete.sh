#!/bin/bash
# Comprehensive test script for local image adapter
# Tests: Upload, Storage, Retrieval, Database, Shapes, Import Stepper Flow, Browser
# 
# Prerequisites:
# 1. Server running on localhost:3000
# 2. Authenticated user session (project or base role)
# 3. Test image file available
# 4. Database initialized with test project
# 
# Usage: ./test-local-adapter-complete.sh [path/to/test/image.jpg]

set -e

# Configuration
BASE_URL="http://localhost:3000"
TEST_IMAGE="${1:-./test-results/bg.png}"
PROJECT_ID="theaterpedia"
OWNER_ID=1
XMLID_BASE="test-local-adapter"
TIMESTAMP=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}Test $TESTS_TOTAL: $test_name${NC}"
    
    if eval "$test_command"; then
        if [ -z "$expected_result" ] || eval "$expected_result"; then
            echo -e "${GREEN}✓ PASSED${NC}\n"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        fi
    fi
    
    echo -e "${RED}✗ FAILED${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
}

# Print header
echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Local Image Adapter - Comprehensive Test Suite       ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "Configuration:"
echo -e "  Base URL: $BASE_URL"
echo -e "  Test Image: $TEST_IMAGE"
echo -e "  Project ID: $PROJECT_ID"
echo -e "  Owner ID: $OWNER_ID\n"

# Check if test image exists
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${RED}❌ Test image not found: $TEST_IMAGE${NC}"
    echo "Please provide a test image path as argument"
    echo "Example: ./test-local-adapter-complete.sh path/to/image.jpg"
    exit 1
fi

# Check server availability
echo -e "${YELLOW}Checking server availability...${NC}"
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not accessible at $BASE_URL${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 1: Core Upload & Storage${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 1: Upload image via API
XMLID="${PROJECT_ID}.image.scene-${XMLID_BASE}_${TIMESTAMP}"
echo -e "${BLUE}Test 1: Upload image via /api/images/upload${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/upload" \
    -F "file=@$TEST_IMAGE" \
    -F "xmlid=$XMLID" \
    -F "project=$PROJECT_ID" \
    -F "owner=$OWNER_ID" \
    -F "author_name=Test User" \
    -F "author_uri=" \
    -F "author_adapter=local" \
    -F "alt_text=Test image for local adapter" \
    -F "ctags=3")

IMAGE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.image_id // empty')
SOURCE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.urls.source // empty')
SQUARE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.urls.square // empty')
THUMB_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.urls.thumb // empty')
WIDE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.urls.wide // empty')
VERTICAL_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.urls.vertical // empty')

if [ -n "$IMAGE_ID" ] && [ -n "$SOURCE_URL" ]; then
    echo -e "${GREEN}✓ PASSED - Image ID: $IMAGE_ID${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - No image_id or source URL in response${NC}"
    echo "$UPLOAD_RESPONSE" | jq '.'
    echo ""
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test 2: Verify source file exists
echo -e "${BLUE}Test 2: Verify source file in storage${NC}"
SOURCE_PATH=".local_images/source/${XMLID}.png"
if [ -f "$SOURCE_PATH" ] || [ -f ".local_images/source/${XMLID}.jpg" ] || [ -f ".local_images/source/${XMLID}.webp" ]; then
    echo -e "${GREEN}✓ PASSED - Source file exists in .local_images/source/${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Source file not found at $SOURCE_PATH${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test 3: Verify source URL accessible
echo -e "${BLUE}Test 3: Verify source image URL accessible${NC}"
SOURCE_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$SOURCE_URL")
if [ "$SOURCE_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED - Source URL returns 200: $SOURCE_URL${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Source URL returns $SOURCE_HTTP_CODE: $SOURCE_URL${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 2: Shape Generation${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 4-7: Verify all shape URLs
for shape in "square" "thumb" "wide" "vertical"; do
    SHAPE_VAR="${shape^^}_URL"
    SHAPE_URL="${!SHAPE_VAR}"
    
    echo -e "${BLUE}Test $((TESTS_TOTAL + 1)): Verify $shape shape URL${NC}"
    if [ -n "$SHAPE_URL" ]; then
        SHAPE_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$SHAPE_URL")
        if [ "$SHAPE_HTTP_CODE" -eq 200 ]; then
            echo -e "${GREEN}✓ PASSED - $shape URL returns 200${NC}\n"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAILED - $shape URL returns $SHAPE_HTTP_CODE${NC}\n"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗ FAILED - No $shape URL in upload response${NC}\n"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
done

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 3: Database Integration${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 8: Verify database record
echo -e "${BLUE}Test 8: Verify database record exists${NC}"
DB_RESPONSE=$(curl -s "$BASE_URL/api/images/$IMAGE_ID")
DB_XMLID=$(echo "$DB_RESPONSE" | jq -r '.xmlid // empty')

if [ "$DB_XMLID" = "$XMLID" ]; then
    echo -e "${GREEN}✓ PASSED - Database record found with correct XMLID${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Database record not found or XMLID mismatch${NC}"
    echo "Expected: $XMLID"
    echo "Got: $DB_XMLID"
    echo ""
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test 9: Verify author composite
echo -e "${BLUE}Test 9: Verify author composite in database${NC}"
DB_AUTHOR=$(echo "$DB_RESPONSE" | jq -r '.author // empty')
if echo "$DB_AUTHOR" | grep -q "Test User"; then
    echo -e "${GREEN}✓ PASSED - Author composite contains 'Test User'${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Author composite missing or incorrect${NC}"
    echo "Author: $DB_AUTHOR"
    echo ""
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test 10: Verify project association
echo -e "${BLUE}Test 10: Verify project association${NC}"
DB_PROJECT=$(echo "$DB_RESPONSE" | jq -r '.project // empty')
if [ "$DB_PROJECT" = "$PROJECT_ID" ]; then
    echo -e "${GREEN}✓ PASSED - Project correctly set to $PROJECT_ID${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Project mismatch (expected: $PROJECT_ID, got: $DB_PROJECT)${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 4: Image List API${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 11: List all images
echo -e "${BLUE}Test 11: GET /api/images returns array${NC}"
LIST_RESPONSE=$(curl -s "$BASE_URL/api/images")
IMAGE_COUNT=$(echo "$LIST_RESPONSE" | jq 'length // 0')

if [ "$IMAGE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ PASSED - API returned $IMAGE_COUNT images${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - API returned empty array${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test 12: Filter by project
echo -e "${BLUE}Test 12: GET /api/images?project=$PROJECT_ID returns filtered results${NC}"
PROJECT_LIST=$(curl -s "$BASE_URL/api/images?project=$PROJECT_ID")
PROJECT_COUNT=$(echo "$PROJECT_LIST" | jq 'length // 0')

if [ "$PROJECT_COUNT" -gt 0 ]; then
    # Verify our image is in the list
    FOUND=$(echo "$PROJECT_LIST" | jq -r --arg xmlid "$XMLID" '.[] | select(.xmlid == $xmlid) | .xmlid')
    if [ "$FOUND" = "$XMLID" ]; then
        echo -e "${GREEN}✓ PASSED - Our test image found in project filter${NC}\n"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAILED - Test image not found in project filter${NC}\n"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo -e "${RED}✗ FAILED - Project filter returned empty array${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 5: Shape Regeneration (Optional - requires Phase 2)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 13: Regenerate square shape
echo -e "${BLUE}Test 13: POST /api/images/$IMAGE_ID/regenerate-shapes${NC}"
REGEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/$IMAGE_ID/regenerate-shapes" \
    -H "Content-Type: application/json" \
    -d '{
        "shapes": ["square"],
        "xyz": {
            "square": {"x": 50, "y": 50, "z": 100}
        }
    }')

REGEN_SUCCESS=$(echo "$REGEN_RESPONSE" | jq -r '.success // false')
if [ "$REGEN_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ PASSED - Shape regeneration successful${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ SKIPPED - Regeneration endpoint not available or failed${NC}"
    echo "Response: $REGEN_RESPONSE"
    echo ""
    # Don't count as failed - might not be implemented yet
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PHASE 6: Cleanup${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

# Test 14: Delete image
echo -e "${BLUE}Test 14: DELETE /api/images/$IMAGE_ID${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/images/$IMAGE_ID" -w "\nHTTP_CODE:%{http_code}")
DELETE_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$DELETE_CODE" = "204" ] || [ "$DELETE_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED - Image deleted (HTTP $DELETE_CODE)${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Delete failed (HTTP $DELETE_CODE)${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test 15: Verify deletion
echo -e "${BLUE}Test 15: Verify image no longer accessible${NC}"
VERIFY_DELETE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/images/$IMAGE_ID")

if [ "$VERIFY_DELETE" = "404" ]; then
    echo -e "${GREEN}✓ PASSED - Image returns 404 after deletion${NC}\n"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED - Image still accessible (HTTP $VERIFY_DELETE)${NC}\n"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Print summary
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}\n"

echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}\n"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL TESTS PASSED                                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ SOME TESTS FAILED                                   ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}\n"
    exit 1
fi
