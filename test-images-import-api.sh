#!/bin/bash
# Test script for images import endpoint with Unsplash adapter

API_BASE="http://localhost:3000/api/images"

echo "🧪 Testing Images Import Endpoint"
echo "=================================="
echo ""

# Test 1: Single Unsplash image
echo "Test 1: Import single Unsplash image"
echo "-------------------------------------"
curl -X POST "${API_BASE}/import" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://unsplash.com/photos/a-close-up-of-a-persons-hand-on-a-red-background-5QXcqAJ3xmk"],
    "batch": {
      "domaincode": "tp",
      "owner_id": 1,
      "alt_text": "Test import from Unsplash",
      "license": "unsplash",
      "xml_root": "test_unsplash"
    }
  }' | jq '.'

echo ""
echo ""

# Test 2: Multiple Unsplash images with xml_root sequence
echo "Test 2: Import multiple Unsplash images with xmlid sequence"
echo "------------------------------------------------------------"
curl -X POST "${API_BASE}/import" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://unsplash.com/photos/a-close-up-of-a-persons-hand-on-a-red-background-5QXcqAJ3xmk",
      "https://unsplash.com/photos/brown-wooden-blocks-on-white-surface-OqtafYT5kTw",
      "https://unsplash.com/photos/a-group-of-oranges-sitting-on-top-of-a-table-JnB8Gio0d9w"
    ],
    "batch": {
      "domaincode": "tp",
      "owner_id": 1,
      "xml_root": "batch_test"
    }
  }' | jq '.'

echo ""
echo ""

# Test 3: Unsupported URL (should fail gracefully)
echo "Test 3: Try importing unsupported URL"
echo "--------------------------------------"
curl -X POST "${API_BASE}/import" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/some-image.jpg"],
    "batch": {
      "domaincode": "tp"
    }
  }' | jq '.'

echo ""
echo ""

# Test 4: Mixed URLs (some supported, some not)
echo "Test 4: Import mixed URLs (Unsplash + unsupported)"
echo "---------------------------------------------------"
curl -X POST "${API_BASE}/import" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://unsplash.com/photos/a-close-up-of-a-persons-hand-on-a-red-background-5QXcqAJ3xmk",
      "https://example.com/image.jpg"
    ],
    "batch": {
      "domaincode": "tp"
    }
  }' | jq '.'

echo ""
echo ""
echo "✅ All tests completed"
