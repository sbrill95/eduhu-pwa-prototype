#!/bin/bash
# Test Runner: Runs all test scripts sequentially
# Identifies which specific test causes crash

echo "=========================================="
echo "Bash Script Crash Test Suite"
echo "=========================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FAILED=0

# Test 01: Minimal
echo "Running Test 01: Minimal..."
bash "$SCRIPT_DIR/test-01-minimal.sh"
if [ $? -ne 0 ]; then
  echo "FAILED: Test 01"
  FAILED=$((FAILED + 1))
else
  echo "PASSED: Test 01"
fi
echo ""

# Test 02: Variables
echo "Running Test 02: Variables..."
bash "$SCRIPT_DIR/test-02-variables.sh"
if [ $? -ne 0 ]; then
  echo "FAILED: Test 02"
  FAILED=$((FAILED + 1))
else
  echo "PASSED: Test 02"
fi
echo ""

# Test 03: Paths
echo "Running Test 03: Paths..."
bash "$SCRIPT_DIR/test-03-paths.sh"
if [ $? -ne 0 ]; then
  echo "FAILED: Test 03"
  FAILED=$((FAILED + 1))
else
  echo "PASSED: Test 03"
fi
echo ""

# Test 04: Kill Script
echo "Running Test 04: Kill Script..."
bash "$SCRIPT_DIR/test-04-kill.sh"
if [ $? -ne 0 ]; then
  echo "FAILED: Test 04"
  FAILED=$((FAILED + 1))
else
  echo "PASSED: Test 04"
fi
echo ""

# Test 05: Curl
echo "Running Test 05: Curl..."
bash "$SCRIPT_DIR/test-05-curl.sh"
if [ $? -ne 0 ]; then
  echo "FAILED: Test 05"
  FAILED=$((FAILED + 1))
else
  echo "PASSED: Test 05"
fi
echo ""

# Test 06: Background Process
echo "Running Test 06: Background Process..."
bash "$SCRIPT_DIR/test-06-background.sh"
if [ $? -ne 0 ]; then
  echo "FAILED: Test 06"
  FAILED=$((FAILED + 1))
else
  echo "PASSED: Test 06"
fi
echo ""

echo "=========================================="
if [ $FAILED -eq 0 ]; then
  echo "All tests passed!"
  echo ""
  echo "If Claude Code crashed during this test,"
  echo "note which test was running when it crashed."
else
  echo "Tests failed: $FAILED"
fi
echo "=========================================="

exit 0
