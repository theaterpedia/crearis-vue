#!/bin/bash

echo "🧪 Testing Task Management API Endpoints"
echo "=========================================="
echo ""

# Start server in background
echo "🚀 Starting server..."
pnpm run dev > /tmp/nitro-test.log 2>&1 &
SERVER_PID=$!
sleep 5

BASE_URL="http://localhost:3000"

echo "📋 Test 1: GET /api/tasks (initial list)"
echo "---"
curl -s $BASE_URL/api/tasks | head -20
echo ""
echo ""

echo "✏️  Test 2: POST /api/tasks (create task #1)"
echo "---"
TASK1=$(curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review event listings",
    "description": "Check all events for accuracy",
    "priority": "urgent"
  }')
echo "$TASK1" | head -20
TASK1_ID=$(echo "$TASK1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Task ID: $TASK1_ID"
echo ""

echo "✏️  Test 3: POST /api/tasks (create task #2 with record link)"
echo "---"
TASK2=$(curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Update post featured image",
    "description": "Replace placeholder image",
    "priority": "medium",
    "record_type": "post",
    "record_id": "post-123",
    "due_date": "2025-10-20"
  }')
echo "$TASK2" | head -20
TASK2_ID=$(echo "$TASK2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Task ID: $TASK2_ID"
echo ""

echo "📋 Test 4: GET /api/tasks (should show 3 tasks now)"
echo "---"
curl -s $BASE_URL/api/tasks | head -30
echo ""
echo ""

echo "🔍 Test 5: GET /api/tasks?status=todo (filter by status)"
echo "---"
curl -s "$BASE_URL/api/tasks?status=todo" | head -20
echo ""
echo ""

echo "🔍 Test 6: GET /api/tasks?record_type=post (filter by type)"
echo "---"
curl -s "$BASE_URL/api/tasks?record_type=post" | head -20
echo ""
echo ""

echo "✏️  Test 7: PUT /api/tasks/:id (update status to in-progress)"
echo "---"
curl -s -X PUT $BASE_URL/api/tasks/$TASK1_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}' | head -20
echo ""
echo ""

echo "✏️  Test 8: PUT /api/tasks/:id (mark as done)"
echo "---"
curl -s -X PUT $BASE_URL/api/tasks/$TASK2_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}' | head -20
echo ""
echo ""

echo "📋 Test 9: GET /api/tasks (check updated statuses)"
echo "---"
curl -s $BASE_URL/api/tasks
echo ""
echo ""

echo "🗑️  Test 10: DELETE /api/tasks/:id"
echo "---"
curl -s -X DELETE $BASE_URL/api/tasks/$TASK2_ID
echo ""
echo ""

echo "📋 Test 11: GET /api/tasks (verify deletion)"
echo "---"
curl -s $BASE_URL/api/tasks
echo ""
echo ""

echo "❌ Test 12: Error handling - missing title"
echo "---"
curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"description": "No title provided"}'
echo ""
echo ""

echo "❌ Test 13: Error handling - invalid priority"
echo "---"
curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "priority": "super-urgent"}'
echo ""
echo ""

echo "❌ Test 14: Error handling - task not found"
echo "---"
curl -s -X PUT $BASE_URL/api/tasks/nonexistent-id \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
echo ""
echo ""

echo "🛑 Stopping server..."
kill $SERVER_PID
sleep 2

echo ""
echo "✅ All tests completed!"
