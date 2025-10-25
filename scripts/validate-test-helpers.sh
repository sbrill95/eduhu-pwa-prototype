#!/bin/bash
# Test Helper Endpoints Validation Script
# Verifies all test helper endpoints are working correctly
# Run this with backend running on port 3006

echo "🧪 Test Helper Endpoints Validation"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILURES=0
PASSES=0

# Helper function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4

  echo -n "Testing: $description... "

  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "http://localhost:3006$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      "http://localhost:3006$endpoint")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
    PASSES=$((PASSES + 1))

    # Show response if verbose
    if [ "$VERBOSE" = "true" ]; then
      echo "  Response: $body"
    fi

    # Return the response body for further use
    echo "$body"
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
    echo "  Response: $body"
    FAILURES=$((FAILURES + 1))
  fi
}

# 1. Check backend is running
echo "Prerequisite: Backend Health Check"
echo "-----------------------------------"
health_response=$(curl -s -w "\n%{http_code}" http://localhost:3006/api/health)
health_code=$(echo "$health_response" | tail -n1)

if [ "$health_code" != "200" ]; then
  echo -e "${RED}❌ Backend not running on port 3006${NC}"
  echo "   Start backend: cd teacher-assistant/backend && npm start"
  exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# 2. Test Helper Endpoints
echo "Test Helper Endpoints"
echo "---------------------"

# 2.1 Create Test Image
echo ""
echo "Test 1: Create Test Image (POST /api/test/create-image)"
create_response=$(test_endpoint POST "/api/test/create-image" "Create test image" '{
  "user_id": "test-qa-validation-user",
  "title": "QA Validation Test Image",
  "type": "image",
  "content": "https://example.com/qa-test.jpg",
  "description": "Created by QA validation script",
  "tags": "[\"qa\", \"validation\", \"automated\"]",
  "metadata": "{\"test\":true,\"source\":\"qa-validation\",\"timestamp\":'"$(date +%s)"'}"
}')

# Extract image ID from response
image_id=$(echo "$create_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$image_id" ]; then
  echo "  Created image ID: $image_id"
else
  echo -e "${YELLOW}  Warning: Could not extract image ID${NC}"
fi

# 2.2 Delete Test Image (if created)
if [ -n "$image_id" ]; then
  echo ""
  echo "Test 2: Delete Test Image (DELETE /api/test/delete-image/:id)"
  test_endpoint DELETE "/api/test/delete-image/$image_id" "Delete test image $image_id"
fi

# 2.3 Cleanup All Test Images
echo ""
echo "Test 3: Cleanup All Test Images (POST /api/test/cleanup-all)"
cleanup_response=$(test_endpoint POST "/api/test/cleanup-all" "Cleanup all test images")

# Extract deleted count
deleted_count=$(echo "$cleanup_response" | grep -o '"deletedCount":[0-9]*' | cut -d':' -f2)
if [ -n "$deleted_count" ]; then
  echo "  Deleted $deleted_count test image(s)"
fi

# 3. Summary
echo ""
echo "==================================="
echo "Validation Summary"
echo "==================================="
echo -e "${GREEN}Passed: $PASSES${NC}"
echo -e "${RED}Failed: $FAILURES${NC}"
echo ""

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All test helper endpoints are working correctly!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some test helper endpoints failed validation${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check backend logs for errors"
  echo "  2. Verify NODE_ENV is set to 'development' or 'test'"
  echo "  3. Verify InstantDB is initialized correctly"
  echo "  4. Check teacher-assistant/backend/src/routes/testHelpers.ts"
  exit 1
fi
