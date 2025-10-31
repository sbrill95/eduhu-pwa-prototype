#!/bin/bash
# Pre-Test Checklist Script
# Verifies all prerequisites before running E2E tests
# Prevents 80% of common test failures by catching infrastructure issues early

echo "🚀 Pre-Test Checklist"
echo "===================="
echo ""

# Track failures
FAILURES=0

# 1. Verify Backend Running
echo -n "✓ Backend running... "
if command -v curl &> /dev/null; then
  curl -f http://localhost:3006/api/health > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "❌ FAIL"
    echo "  Backend not responding on port 3006"
    echo "  ACTION: Start backend with 'cd teacher-assistant/backend && npm start'"
    FAILURES=$((FAILURES + 1))
  else
    echo "✅ PASS"
  fi
else
  echo "⚠️  SKIP (curl not installed)"
fi

# 2. Verify Backend Version (if backend is running)
if [ $FAILURES -eq 0 ] && command -v curl &> /dev/null && command -v git &> /dev/null; then
  echo -n "✓ Backend version... "

  # Get backend commit (if health endpoint returns it)
  BACKEND_COMMIT=$(curl -s http://localhost:3006/api/health 2>/dev/null | grep -o '"gitCommit":"[^"]*"' | cut -d'"' -f4)
  CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null)

  if [ -z "$BACKEND_COMMIT" ]; then
    echo "⚠️  SKIP (backend doesn't return version)"
    echo "  RECOMMENDATION: Add gitCommit to /api/health endpoint"
  elif [ "$BACKEND_COMMIT" != "$CURRENT_COMMIT" ]; then
    echo "❌ FAIL"
    echo "  Backend version: ${BACKEND_COMMIT:0:7}"
    echo "  Current version: ${CURRENT_COMMIT:0:7}"
    echo "  ACTION: Restart backend with 'bash scripts/restart-backend.sh'"
    FAILURES=$((FAILURES + 1))
  else
    echo "✅ PASS (${BACKEND_COMMIT:0:7})"
  fi
fi

# 3. Verify InstantDB Initialized
if [ $FAILURES -eq 0 ] && command -v curl &> /dev/null; then
  echo -n "✓ InstantDB initialized... "

  INSTANTDB_STATUS=$(curl -s http://localhost:3006/api/health 2>/dev/null | grep -o '"instantdb":"[^"]*"' | cut -d'"' -f4)

  if [ -z "$INSTANTDB_STATUS" ]; then
    echo "⚠️  SKIP (backend doesn't return InstantDB status)"
  elif [ "$INSTANTDB_STATUS" != "connected" ]; then
    echo "❌ FAIL"
    echo "  InstantDB status: $INSTANTDB_STATUS"
    echo "  ACTION: Check InstantDB credentials in .env"
    FAILURES=$((FAILURES + 1))
  else
    echo "✅ PASS"
  fi
fi

# 4. Verify Test Mode Environment Variable (Windows-compatible)
echo -n "✓ VITE_TEST_MODE set... "
if [ -n "$VITE_TEST_MODE" ]; then
  echo "✅ PASS"
else
  echo "⚠️  WARNING (not set)"
  echo "  RECOMMENDATION: set VITE_TEST_MODE=true (or export on Unix)"
  echo "  Tests may hit login screens without this"
fi

# 5. Verify Port 3006 Listening (cross-platform)
echo -n "✓ Port 3006 listening... "
if command -v netstat &> /dev/null; then
  if netstat -ano 2>/dev/null | grep -q ":3006"; then
    echo "✅ PASS"
  else
    echo "❌ FAIL"
    echo "  Backend not listening on port 3006"
    echo "  ACTION: Start backend"
    FAILURES=$((FAILURES + 1))
  fi
elif command -v lsof &> /dev/null; then
  if lsof -ti:3006 &> /dev/null; then
    echo "✅ PASS"
  else
    echo "❌ FAIL"
    echo "  Backend not listening on port 3006"
    FAILURES=$((FAILURES + 1))
  fi
else
  echo "⚠️  SKIP (netstat/lsof not available)"
fi

# 6. Cleanup Stale Test Data (optional, non-blocking)
if [ $FAILURES -eq 0 ] && command -v curl &> /dev/null; then
  echo -n "✓ Cleaning stale test data... "
  curl -X DELETE http://localhost:3006/api/test-helpers/cleanup-all > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ DONE"
  else
    echo "⚠️  SKIP (endpoint not available)"
  fi
fi

echo ""
echo "===================="

# Final verdict
if [ $FAILURES -eq 0 ]; then
  echo "✅ All checks passed! Ready to run tests."
  exit 0
else
  echo "❌ $FAILURES check(s) failed. Fix issues before running tests."
  echo ""
  echo "Common fixes:"
  echo "  • Backend not running → bash scripts/restart-backend-test-mode.sh"
  echo "  • Port conflict → bash scripts/kill-backend.sh"
  echo "  • Version mismatch → Restart backend after git pull/commit"
  echo "  • Need TEST_MODE for E2E → bash scripts/restart-backend-test-mode.sh"
  exit 1
fi
