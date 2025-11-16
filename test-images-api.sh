#!/bin/bash

API_BASE="http://localhost:3000/api"
echo "====== Testing Images API Endpoints ======"
echo ""

# Test 1: POST - Create new image
echo "1. POST /api/images - Create new image"
RESPONSE=$(curl -s -X POST "${API_BASE}/images" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Image",
    "url": "https://example.com/test.jpg",
    "domaincode": "tp",
    "alt_text": "A test image",
    "x": 1920,
    "y": 1080,
    "status_id": 18
  }')
echo "$RESPONSE" | jq '.'
IMAGE_ID=$(echo "$RESPONSE" | jq -r '.id')
echo "Created image ID: $IMAGE_ID"
echo ""

# Test 2: GET - List all images
echo "2. GET /api/images - List all images"
curl -s "${API_BASE}/images" | jq '.[] | {id, name, url, domaincode}'
echo ""

# Test 3: GET - Get single image by ID
echo "3. GET /api/images/:id - Get image by ID"
curl -s "${API_BASE}/images/${IMAGE_ID}" | jq '.'
echo ""

# Test 4: PUT - Update image
echo "4. PUT /api/images/:id - Update image"
curl -s -X PUT "${API_BASE}/images/${IMAGE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Image",
    "alt_text": "An updated test image"
  }' | jq '.'
echo ""

# Test 5: GET - Verify update
echo "5. GET /api/images/:id - Verify update"
curl -s "${API_BASE}/images/${IMAGE_ID}" | jq '{id, name, alt_text, updated_at}'
echo ""

# Test 6: GET - Filter by domaincode
echo "6. GET /api/images?domaincode=tp - Filter by domaincode"
curl -s "${API_BASE}/images?domaincode=tp" | jq '.[] | {id, name, domaincode}'
echo ""

# Test 7: DELETE - Delete image
echo "7. DELETE /api/images/:id - Delete image"
curl -s -X DELETE "${API_BASE}/images/${IMAGE_ID}" | jq '.'
echo ""

# Test 8: GET - Verify deletion
echo "8. GET /api/images/:id - Verify deletion (should 404)"
curl -s "${API_BASE}/images/${IMAGE_ID}" | jq '.'
echo ""

echo "====== Test Complete ======"
