#!/bin/bash
# Backend Fix Verification Script
# Run with: bash verify-backend-fixes.sh

echo "=== Backend Fix Verification ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Test 1: Profile Name Update
echo -e "${YELLOW}Test 1: Profile Name Update (POST /api/profile/update-name)${NC}"
response1=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3006/api/profile/update-name \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","name":"Max Mustermann"}')

http_code1=$(echo "$response1" | tail -n1)
body1=$(echo "$response1" | head -n-1)

if [ "$http_code1" = "200" ] && echo "$body1" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS - Profile name update successful${NC}"
    echo -e "${GRAY}   Response: $(echo $body1 | grep -o '"message":"[^"]*"')${NC}"
elif [ "$http_code1" = "503" ]; then
    echo -e "${RED}❌ FAIL - HTTP 503: InstantDB not initialized${NC}"
    echo -e "${YELLOW}   → Server needs restart!${NC}"
else
    echo -e "${RED}❌ FAIL - HTTP $http_code1${NC}"
    echo -e "${GRAY}   Response: $body1${NC}"
fi
echo ""

# Test 2: Image Generation
echo -e "${YELLOW}Test 2: Image Generation (POST /api/langgraph/agents/execute)${NC}"
response2=$(curl -s -X POST http://localhost:3006/api/langgraph/agents/execute \
  -H "Content-Type: application/json" \
  -d '{"agentType":"image-generation","parameters":{"theme":"ein Apfel","style":"realistic"},"sessionId":"verify-session"}')

if echo "$response2" | grep -q '"success":true'; then
    has_image=$(echo "$response2" | grep -o '"image_url":"[^"]*"' | wc -l)
    library_id=$(echo "$response2" | grep -o '"library_id":"[^"]*"' | cut -d'"' -f4)
    message_id=$(echo "$response2" | grep -o '"message_id":"[^"]*"' | cut -d'"' -f4)

    if [ "$has_image" -gt 0 ] && [ ! -z "$library_id" ] && [ "$library_id" != "null" ]; then
        echo -e "${GREEN}✅ PASS - Image generated and saved to database${NC}"
        echo -e "${GRAY}   Library ID: $library_id${NC}"
        echo -e "${GRAY}   Message ID: $message_id${NC}"
    elif [ "$has_image" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  PARTIAL - Image generated but NOT saved to database${NC}"
        echo -e "${GRAY}   Image URL: Present${NC}"
        echo -e "${RED}   Library ID: null${NC}"
        echo -e "${RED}   Message ID: null${NC}"
        echo -e "${YELLOW}   → InstantDB not initialized. Restart server!${NC}"
    else
        echo -e "${RED}❌ FAIL - No image URL in response${NC}"
    fi
else
    echo -e "${RED}❌ FAIL - Request failed${NC}"
    echo -e "${GRAY}   Response: $response2${NC}"
fi
echo ""

# Test 3: Chat Summary
echo -e "${YELLOW}Test 3: Chat Summary (POST /api/chat/summary)${NC}"
response3=$(curl -s -X POST http://localhost:3006/api/chat/summary \
  -H "Content-Type: application/json" \
  -d '{"chatId":"verify-chat","messages":[{"role":"user","content":"Hallo"},{"role":"assistant","content":"Hi"},{"role":"user","content":"Wie geht es?"}]}')

if echo "$response3" | grep -q '"success":true' && echo "$response3" | grep -q '"summary"'; then
    summary=$(echo "$response3" | grep -o '"summary":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ PASS - Chat summary generated${NC}"
    echo -e "${GRAY}   Summary: $summary${NC}"
    echo -e "${GRAY}   Length: ${#summary} characters${NC}"
else
    echo -e "${RED}❌ FAIL - No summary in response${NC}"
    echo -e "${GRAY}   Response: $response3${NC}"
fi
echo ""

# Summary
echo "=== Verification Complete ==="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. If Test 1 failed with 503 error → Server needs restart"
echo "2. If Test 2 shows null library_id → Server needs restart"
echo "3. Check server logs for: '[INFO] InstantDB initialized successfully'"
echo ""
echo -e "${YELLOW}To restart the server:${NC}"
echo "  cd teacher-assistant/backend"
echo "  npm run dev"
