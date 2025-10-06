#!/bin/bash

# Test script for verifying image generation backend fixes (FIX-004 & FIX-005)

echo "=========================================="
echo "Image Generation Backend Fix Test"
echo "=========================================="
echo ""

# Test 1: Image generation with sessionId (should save to library AND create message)
echo "TEST 1: Image generation with sessionId"
echo "----------------------------------------"
echo "Request:"
echo '{
  "agentId": "langgraph-image-generation",
  "input": {
    "description": "Ein Löwe in der Savanne",
    "imageStyle": "realistic"
  },
  "sessionId": "test-session-qa-001",
  "userId": "test-user-qa",
  "confirmExecution": true
}'
echo ""
echo "Response:"
curl -X POST http://localhost:3006/api/langgraph/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "langgraph-image-generation",
    "input": {
      "description": "Ein Löwe in der Savanne",
      "imageStyle": "realistic"
    },
    "sessionId": "test-session-qa-001",
    "userId": "test-user-qa",
    "confirmExecution": true
  }' | jq '.'

echo ""
echo ""

# Test 2: Image generation without sessionId (should save to library only)
echo "TEST 2: Image generation without sessionId"
echo "-------------------------------------------"
echo "Request:"
echo '{
  "agentId": "langgraph-image-generation",
  "input": {
    "description": "Ein Baum im Frühling",
    "imageStyle": "illustrative"
  },
  "userId": "test-user-qa",
  "confirmExecution": true
}'
echo ""
echo "Response:"
curl -X POST http://localhost:3006/api/langgraph/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "langgraph-image-generation",
    "input": {
      "description": "Ein Baum im Frühling",
      "imageStyle": "illustrative"
    },
    "userId": "test-user-qa",
    "confirmExecution": true
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="
echo ""
echo "Expected Results:"
echo "1. Both responses should have success: true"
echo "2. Both should include library_id in response"
echo "3. Test 1 should also include message_id in response"
echo "4. Both should have a German title (e.g., 'Löwe in der Savanne')"
echo "5. Check backend console for debug logs"
echo ""
echo "Backend Console Logs to Check:"
echo "- [langGraphAgents] Using description as prompt:"
echo "- [ImageAgent] Generated title:"
echo "- [langGraphAgents] ✅ Image saved to library_materials:"
echo "- [langGraphAgents] ✅ Chat message created: (only for Test 1)"
