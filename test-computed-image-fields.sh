#!/bin/bash

# Test script for computed image fields (Chapter 14 of migration 019)
# Tests with events table, record id: 9, which has img_id set to 5

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection details
DB_NAME="crearis_admin_dev"
DB_USER="crearis_admin"
PGPASSWORD="7uqf9nE0umJmMMo"
export PGPASSWORD

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Computed Image Fields${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test record details
TEST_RECORD_ID=9
TEST_IMAGE_ID=5

echo -e "${YELLOW}Test Configuration:${NC}"
echo -e "  Table: events"
echo -e "  Record ID: ${TEST_RECORD_ID}"
echo -e "  Expected img_id: ${TEST_IMAGE_ID}\n"

# ========================================
# STEP 1: Verify test record exists and has correct img_id
# ========================================
echo -e "${BLUE}Step 1: Verify test record${NC}"

RECORD_CHECK=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -A -c \
  "SELECT id, img_id FROM events WHERE id = $TEST_RECORD_ID;")

if [ -z "$RECORD_CHECK" ]; then
    echo -e "${RED}✗ FAILED: Record with id=$TEST_RECORD_ID not found in events table${NC}"
    exit 1
fi

FOUND_ID=$(echo $RECORD_CHECK | cut -d'|' -f1)
FOUND_IMG_ID=$(echo $RECORD_CHECK | cut -d'|' -f2)

echo -e "  Record ID: ${FOUND_ID}"
echo -e "  img_id: ${FOUND_IMG_ID}"

if [ "$FOUND_IMG_ID" != "$TEST_IMAGE_ID" ]; then
    echo -e "${RED}✗ FAILED: img_id mismatch. Expected ${TEST_IMAGE_ID}, found ${FOUND_IMG_ID}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Test record verified${NC}\n"

# ========================================
# STEP 2: Verify image record exists
# ========================================
echo -e "${BLUE}Step 2: Verify image record${NC}"

IMAGE_EXISTS=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -A -c \
  "SELECT COUNT(*) FROM images WHERE id = $TEST_IMAGE_ID;")

if [ "$IMAGE_EXISTS" != "1" ]; then
    echo -e "${RED}✗ FAILED: Image with id=$TEST_IMAGE_ID not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Image record exists${NC}\n"

# ========================================
# STEP 3: Get image details and expected values
# ========================================
echo -e "${BLUE}Step 3: Fetch image details${NC}"

IMAGE_DATA=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -A -F'|' -c \
  "SELECT 
    url,
    get_byte(ctags, 0) as ctags_byte,
    (get_byte(ctags, 0) & 192) as quality_bits,
    CASE 
      WHEN (shape_thumb).url IS NOT NULL THEN (shape_thumb).url
      ELSE NULL
    END as shape_thumb_url,
    CASE 
      WHEN (shape_square).url IS NOT NULL THEN (shape_square).url
      ELSE NULL
    END as shape_square_url,
    CASE 
      WHEN (shape_wide).url IS NOT NULL THEN (shape_wide).url
      ELSE NULL
    END as shape_wide_url,
    CASE 
      WHEN (shape_vertical).url IS NOT NULL THEN (shape_vertical).url
      ELSE NULL
    END as shape_vertical_url
  FROM images WHERE id = $TEST_IMAGE_ID;")

IMAGE_URL=$(echo $IMAGE_DATA | cut -d'|' -f1)
CTAGS_BYTE=$(echo $IMAGE_DATA | cut -d'|' -f2)
QUALITY_BITS=$(echo $IMAGE_DATA | cut -d'|' -f3)
SHAPE_THUMB_URL=$(echo $IMAGE_DATA | cut -d'|' -f4)
SHAPE_SQUARE_URL=$(echo $IMAGE_DATA | cut -d'|' -f5)
SHAPE_WIDE_URL=$(echo $IMAGE_DATA | cut -d'|' -f6)
SHAPE_VERT_URL=$(echo $IMAGE_DATA | cut -d'|' -f7)

echo -e "  Image URL: ${IMAGE_URL}"
echo -e "  CTags byte: ${CTAGS_BYTE} (0x$(printf '%02x' $CTAGS_BYTE))"
echo -e "  Quality bits (6+7): ${QUALITY_BITS}"

# Determine img_show based on quality bits
# quality = 0 (bits 0-1) = ok, show
# quality = 64 (bits 0-1) = is_deprecated, show
# Others = hide
EXPECTED_IMG_SHOW="false"
if [ "$QUALITY_BITS" = "0" ] || [ "$QUALITY_BITS" = "64" ]; then
    EXPECTED_IMG_SHOW="true"
fi

echo -e "  Expected img_show: ${EXPECTED_IMG_SHOW}"
echo -e "\n  Shape URLs:"
echo -e "    thumb: ${SHAPE_THUMB_URL:-NULL}"
echo -e "    square: ${SHAPE_SQUARE_URL:-NULL}"
echo -e "    wide: ${SHAPE_WIDE_URL:-NULL}"
echo -e "    vertical: ${SHAPE_VERT_URL:-NULL}"
echo -e "${GREEN}✓ Image details retrieved${NC}\n"

# ========================================
# STEP 4: Calculate expected computed values
# ========================================
echo -e "${BLUE}Step 4: Calculate expected values${NC}"

# Expected img_thumb logic:
# if !img_show: "dummy"
# else if shape_thumb exists: reduce_image_shape(shape_thumb)
# else if shape_square exists: reduce_image_shape(shape_square)
# else: url

if [ "$EXPECTED_IMG_SHOW" = "false" ]; then
    EXPECTED_IMG_THUMB="dummy"
    EXPECTED_IMG_SQUARE="dummy"
    EXPECTED_IMG_WIDE="dummy"
    EXPECTED_IMG_VERT="dummy"
else
    # For img_thumb
    if [ -n "$SHAPE_THUMB_URL" ]; then
        EXPECTED_IMG_THUMB=$SHAPE_THUMB_URL
    elif [ -n "$SHAPE_SQUARE_URL" ]; then
        EXPECTED_IMG_THUMB=$SHAPE_SQUARE_URL
    else
        EXPECTED_IMG_THUMB=$IMAGE_URL
    fi

    # For img_square
    if [ -n "$SHAPE_SQUARE_URL" ]; then
        EXPECTED_IMG_SQUARE=$SHAPE_SQUARE_URL
    else
        EXPECTED_IMG_SQUARE=$IMAGE_URL
    fi

    # For img_wide
    if [ -n "$SHAPE_WIDE_URL" ]; then
        EXPECTED_IMG_WIDE=$SHAPE_WIDE_URL
    else
        EXPECTED_IMG_WIDE="dummy"
    fi

    # For img_vert
    if [ -n "$SHAPE_VERT_URL" ]; then
        EXPECTED_IMG_VERT=$SHAPE_VERT_URL
    else
        EXPECTED_IMG_VERT="dummy"
    fi
fi

echo -e "  Expected img_thumb: ${EXPECTED_IMG_THUMB}"
echo -e "  Expected img_square: ${EXPECTED_IMG_SQUARE}"
echo -e "  Expected img_wide: ${EXPECTED_IMG_WIDE}"
echo -e "  Expected img_vert: ${EXPECTED_IMG_VERT}"
echo -e "${GREEN}✓ Expected values calculated${NC}\n"

# ========================================
# STEP 5: Get actual computed values from events table
# ========================================
echo -e "${BLUE}Step 5: Fetch actual computed values${NC}"

ACTUAL_DATA=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -A -F'|' -c \
  "SELECT img_show, img_thumb, img_square, img_wide, img_vert 
   FROM events WHERE id = $TEST_RECORD_ID;")

ACTUAL_IMG_SHOW=$(echo $ACTUAL_DATA | cut -d'|' -f1)
ACTUAL_IMG_THUMB=$(echo $ACTUAL_DATA | cut -d'|' -f2)
ACTUAL_IMG_SQUARE=$(echo $ACTUAL_DATA | cut -d'|' -f3)
ACTUAL_IMG_WIDE=$(echo $ACTUAL_DATA | cut -d'|' -f4)
ACTUAL_IMG_VERT=$(echo $ACTUAL_DATA | cut -d'|' -f5)

echo -e "  Actual img_show: ${ACTUAL_IMG_SHOW}"
echo -e "  Actual img_thumb: ${ACTUAL_IMG_THUMB}"
echo -e "  Actual img_square: ${ACTUAL_IMG_SQUARE}"
echo -e "  Actual img_wide: ${ACTUAL_IMG_WIDE}"
echo -e "  Actual img_vert: ${ACTUAL_IMG_VERT}"
echo -e "${GREEN}✓ Actual values retrieved${NC}\n"

# ========================================
# STEP 6: Compare actual vs expected
# ========================================
echo -e "${BLUE}Step 6: Validate computed fields${NC}\n"

FAILED=0

# Test img_show
if [ "$ACTUAL_IMG_SHOW" = "$EXPECTED_IMG_SHOW" ]; then
    echo -e "${GREEN}✓ img_show: PASS${NC} (${ACTUAL_IMG_SHOW})"
else
    echo -e "${RED}✗ img_show: FAIL${NC}"
    echo -e "    Expected: ${EXPECTED_IMG_SHOW}"
    echo -e "    Actual: ${ACTUAL_IMG_SHOW}"
    FAILED=1
fi

# Test img_thumb
if [ "$ACTUAL_IMG_THUMB" = "$EXPECTED_IMG_THUMB" ]; then
    echo -e "${GREEN}✓ img_thumb: PASS${NC}"
    echo -e "    ${ACTUAL_IMG_THUMB}"
else
    echo -e "${RED}✗ img_thumb: FAIL${NC}"
    echo -e "    Expected: ${EXPECTED_IMG_THUMB}"
    echo -e "    Actual: ${ACTUAL_IMG_THUMB}"
    FAILED=1
fi

# Test img_square
if [ "$ACTUAL_IMG_SQUARE" = "$EXPECTED_IMG_SQUARE" ]; then
    echo -e "${GREEN}✓ img_square: PASS${NC}"
    echo -e "    ${ACTUAL_IMG_SQUARE}"
else
    echo -e "${RED}✗ img_square: FAIL${NC}"
    echo -e "    Expected: ${EXPECTED_IMG_SQUARE}"
    echo -e "    Actual: ${ACTUAL_IMG_SQUARE}"
    FAILED=1
fi

# Test img_wide
if [ "$ACTUAL_IMG_WIDE" = "$EXPECTED_IMG_WIDE" ]; then
    echo -e "${GREEN}✓ img_wide: PASS${NC}"
    echo -e "    ${ACTUAL_IMG_WIDE}"
else
    echo -e "${RED}✗ img_wide: FAIL${NC}"
    echo -e "    Expected: ${EXPECTED_IMG_WIDE}"
    echo -e "    Actual: ${ACTUAL_IMG_WIDE}"
    FAILED=1
fi

# Test img_vert
if [ "$ACTUAL_IMG_VERT" = "$EXPECTED_IMG_VERT" ]; then
    echo -e "${GREEN}✓ img_vert: PASS${NC}"
    echo -e "    ${ACTUAL_IMG_VERT}"
else
    echo -e "${RED}✗ img_vert: FAIL${NC}"
    echo -e "    Expected: ${EXPECTED_IMG_VERT}"
    echo -e "    Actual: ${ACTUAL_IMG_VERT}"
    FAILED=1
fi

# ========================================
# STEP 7: Test trigger by forcing an update
# ========================================
echo -e "\n${BLUE}Step 7: Test trigger re-computation${NC}"

echo -e "  Forcing trigger by updating updated_at field..."
psql -h localhost -U $DB_USER -d $DB_NAME -c \
  "UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = $TEST_RECORD_ID;" > /dev/null

# Fetch values again
AFTER_TRIGGER=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -A -F'|' -c \
  "SELECT img_show, img_thumb, img_square, img_wide, img_vert 
   FROM events WHERE id = $TEST_RECORD_ID;")

AT_IMG_SHOW=$(echo $AFTER_TRIGGER | cut -d'|' -f1)
AT_IMG_THUMB=$(echo $AFTER_TRIGGER | cut -d'|' -f2)
AT_IMG_SQUARE=$(echo $AFTER_TRIGGER | cut -d'|' -f3)
AT_IMG_WIDE=$(echo $AFTER_TRIGGER | cut -d'|' -f4)
AT_IMG_VERT=$(echo $AFTER_TRIGGER | cut -d'|' -f5)

echo -e "  After trigger values:"
echo -e "    img_show: ${AT_IMG_SHOW}"
echo -e "    img_thumb: ${AT_IMG_THUMB}"
echo -e "    img_square: ${AT_IMG_SQUARE}"
echo -e "    img_wide: ${AT_IMG_WIDE}"
echo -e "    img_vert: ${AT_IMG_VERT}"

if [ "$AT_IMG_SHOW" = "$EXPECTED_IMG_SHOW" ] && \
   [ "$AT_IMG_THUMB" = "$EXPECTED_IMG_THUMB" ] && \
   [ "$AT_IMG_SQUARE" = "$EXPECTED_IMG_SQUARE" ] && \
   [ "$AT_IMG_WIDE" = "$EXPECTED_IMG_WIDE" ] && \
   [ "$AT_IMG_VERT" = "$EXPECTED_IMG_VERT" ]; then
    echo -e "${GREEN}✓ Trigger re-computation: PASS${NC}"
else
    echo -e "${RED}✗ Trigger re-computation: FAIL${NC}"
    FAILED=1
fi

# ========================================
# Final Summary
# ========================================
echo -e "\n${BLUE}========================================${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL TESTS PASSED ✓✓✓${NC}"
    echo -e "${BLUE}========================================${NC}"
    exit 0
else
    echo -e "${RED}✗✗✗ SOME TESTS FAILED ✗✗✗${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "\n${YELLOW}Troubleshooting:${NC}"
    echo -e "1. Check if triggers are properly installed:"
    echo -e "   psql -d demo_data -c \"\\df update_entity_image_fields\""
    echo -e "2. Check if reduce_image_shape function exists:"
    echo -e "   psql -d demo_data -c \"\\df reduce_image_shape\""
    echo -e "3. Manually trigger field computation:"
    echo -e "   psql -d demo_data -c \"UPDATE events SET img_id = img_id WHERE id = $TEST_RECORD_ID;\""
    exit 1
fi
