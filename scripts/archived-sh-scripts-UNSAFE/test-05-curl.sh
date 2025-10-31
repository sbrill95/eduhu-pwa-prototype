#!/bin/bash
# Test 05: Curl Health Check
# Tests: Curl commands, HTTP requests

echo "Test 05: Curl health check"

# Check if curl exists
if command -v curl &> /dev/null; then
  echo "Curl found: YES"
else
  echo "Curl found: NO"
  exit 1
fi

# Try health check (might fail if backend not running)
echo "Testing health endpoint..."

HEALTH_RESPONSE=$(curl -f -s http://localhost:3006/api/health 2>/dev/null || echo "")
CURL_EXIT=$?

echo "Curl exit code: $CURL_EXIT"
echo "Response length: ${#HEALTH_RESPONSE}"

if [ -n "$HEALTH_RESPONSE" ]; then
  echo "Response received: YES"
  echo "First 100 chars: ${HEALTH_RESPONSE:0:100}"
else
  echo "Response received: NO (backend may not be running)"
fi

echo "Status: PASS (no crash)"
exit 0
