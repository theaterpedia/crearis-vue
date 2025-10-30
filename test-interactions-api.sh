#!/bin/bash

# Test script for interactions API

API_URL="http://localhost:3000/api/interactions"

echo "========================================="
echo "Testing Interactions API"
echo "========================================="
echo ""

# Test 1: Create a new interaction
echo "Test 1: Create new interaction (contact form)"
echo "-------------------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "contact_form",
    "project": "tp",
    "status_id": 60,
    "from_mail": "user@example.com",
    "to_mail": "admin@theaterpedia.org",
    "subject": "Contact Request",
    "md": "# Contact Request\n\nUser wants to know more about the project.",
    "fields": {
      "fullname": "John Doe",
      "email": "user@example.com",
      "message": "I would like more information"
    }
  }')

echo "$RESPONSE" | jq .
INTERACTION_ID=$(echo "$RESPONSE" | jq -r '.id')
echo ""
echo "Created interaction ID: $INTERACTION_ID"
echo ""

# Test 2: Create another interaction (newsletter signup)
echo "Test 2: Create newsletter signup interaction"
echo "-------------------------------------------"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "newsletter_signup",
    "status_id": 60,
    "from_mail": "jane@example.com",
    "fields": {
      "email": "jane@example.com",
      "preferences": ["news", "events"]
    }
  }' | jq .
echo ""

# Test 3: Get all interactions
echo "Test 3: Get all interactions"
echo "-------------------------------------------"
curl -s "$API_URL" | jq .
echo ""

# Test 4: Filter by form name
echo "Test 4: Filter by form name (contact_form)"
echo "-------------------------------------------"
curl -s "$API_URL?name=contact_form" | jq .
echo ""

# Test 5: Filter by project
echo "Test 5: Filter by project (tp)"
echo "-------------------------------------------"
curl -s "$API_URL?project=tp" | jq .
echo ""

# Test 6: Sort by name ascending
echo "Test 6: Sort by name ascending"
echo "-------------------------------------------"
curl -s "$API_URL?sort_by=name&sort_order=asc" | jq .
echo ""

# Test 7: Get single interaction by ID
if [ ! -z "$INTERACTION_ID" ] && [ "$INTERACTION_ID" != "null" ]; then
    echo "Test 7: Get interaction by ID ($INTERACTION_ID)"
    echo "-------------------------------------------"
    curl -s "$API_URL/$INTERACTION_ID" | jq .
    echo ""
fi

echo "========================================="
echo "Tests completed!"
echo "========================================="
