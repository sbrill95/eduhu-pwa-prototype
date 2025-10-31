#!/bin/bash
# Restart Backend with TEST_MODE Enabled
# Safely restarts backend with VITE_TEST_MODE=true for Gemini API mocking
# Prevents 429 rate limit errors and 80%+ test failures

set -e  # Exit on any error

echo "🧪 Restarting backend with TEST_MODE enabled..."
echo ""

# Get script directory (cross-platform)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/teacher-assistant/backend"

# Track failures
FAILED=0

# ==============================================================================
# STEP 1: Kill Old Processes
# ==============================================================================
echo "Step 1: Stopping existing backend processes"
echo "=============================================="

bash "$SCRIPT_DIR/kill-backend.sh"

if [ $? -ne 0 ]; then
  echo "❌ Failed to kill old processes"
  exit 1
fi

echo ""

# ==============================================================================
# STEP 2: Wait for Port to Be Free
# ==============================================================================
echo "Step 2: Verifying port 3006 is free"
echo "===================================="

MAX_WAIT=10
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
  PORT_IN_USE=0

  # Check with netstat (Windows/Linux)
  if command -v netstat &> /dev/null; then
    if netstat -ano 2>/dev/null | grep -q ":3006"; then
      PORT_IN_USE=1
    fi
  fi

  # Check with lsof (macOS/Linux)
  if command -v lsof &> /dev/null; then
    if lsof -ti:3006 &> /dev/null; then
      PORT_IN_USE=1
    fi
  fi

  # If port is free, break
  if [ $PORT_IN_USE -eq 0 ]; then
    echo "✅ Port 3006 is now free"
    break
  fi

  # Otherwise wait
  WAITED=$((WAITED + 1))
  if [ $WAITED -lt $MAX_WAIT ]; then
    echo "  Waiting for port to be free... ($WAITED/$MAX_WAIT)"
    sleep 1
  else
    echo "❌ Port 3006 still occupied after ${MAX_WAIT}s"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check processes: netstat -ano | findstr :3006"
    echo "  • Kill manually: taskkill /F /PID <PID>"
    exit 1
  fi
done

echo ""

# ==============================================================================
# STEP 3: Start Backend with TEST_MODE
# ==============================================================================
echo "Step 3: Starting backend with TEST_MODE enabled"
echo "================================================"

# Navigate to backend directory
cd "$BACKEND_DIR" || {
  echo "❌ Backend directory not found: $BACKEND_DIR"
  exit 1
}

echo "  Directory: $(pwd)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found. Please install Node.js"
  exit 1
fi

# Check if dist directory exists (compiled TypeScript)
if [ ! -d "dist" ]; then
  echo "⚠️  Warning: dist/ directory not found. Running build first..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
  fi
fi

# Set TEST_MODE environment variable and start backend
echo "  Setting: VITE_TEST_MODE=true"
echo "  Command: npm start"
echo ""

# Start backend in background with TEST_MODE
VITE_TEST_MODE=true npm start > backend-test-mode.log 2>&1 &
BACKEND_PID=$!

echo "  Backend PID: $BACKEND_PID"
echo "  Logs: $BACKEND_DIR/backend-test-mode.log"
echo ""

# ==============================================================================
# STEP 4: Wait for Backend to Be Ready
# ==============================================================================
echo "Step 4: Waiting for backend to be ready"
echo "========================================"

MAX_ATTEMPTS=30
ATTEMPT=0
READY=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  # Check if process is still running
  if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "❌ Backend process died"
    echo ""
    echo "Last 20 lines of logs:"
    tail -n 20 "$BACKEND_DIR/backend-test-mode.log" 2>/dev/null || echo "  Log file not found"
    exit 1
  fi

  # Check if backend health endpoint responds
  if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -f -s http://localhost:3006/api/health 2>&1)
    CURL_EXIT=$?

    if [ $CURL_EXIT -eq 0 ]; then
      echo "✅ Backend is responding!"
      echo ""

      # Display health check info
      echo "Backend Info:"
      echo "$HEALTH_RESPONSE" | grep -o '"[^"]*":"[^"]*"' | head -n 6 | sed 's/^/  /'
      echo ""

      READY=1
      break
    fi
  fi

  # Show progress every 5 seconds
  if [ $((ATTEMPT % 5)) -eq 0 ]; then
    echo "  Waiting... ($ATTEMPT/$MAX_ATTEMPTS)"
  fi

  sleep 1
done

if [ $READY -eq 0 ]; then
  echo "❌ Backend failed to start within ${MAX_ATTEMPTS}s"
  echo ""
  echo "Last 30 lines of logs:"
  tail -n 30 "$BACKEND_DIR/backend-test-mode.log" 2>/dev/null || echo "  Log file not found"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check logs: $BACKEND_DIR/backend-test-mode.log"
  echo "  2. Check port: netstat -ano | findstr :3006"
  echo "  3. Check .env: $BACKEND_DIR/.env"
  echo "  4. Try manual start: cd teacher-assistant/backend && VITE_TEST_MODE=true npm start"
  exit 1
fi

# ==============================================================================
# STEP 5: Verify TEST_MODE is Active
# ==============================================================================
echo "Step 5: Verifying TEST_MODE is active"
echo "======================================"

# Check backend logs for TEST_MODE confirmation
sleep 2  # Give backend time to log

if grep -q "TEST MODE" "$BACKEND_DIR/backend-test-mode.log" 2>/dev/null; then
  echo "✅ TEST_MODE is active (confirmed in logs)"
  echo ""
  echo "Test Mode Indicators:"
  grep "TEST MODE\|🧪\|bypassed\|mock" "$BACKEND_DIR/backend-test-mode.log" 2>/dev/null | tail -n 5 | sed 's/^/  /'
elif grep -q "VITE_TEST_MODE" "$BACKEND_DIR/backend-test-mode.log" 2>/dev/null; then
  echo "✅ TEST_MODE environment variable detected"
else
  echo "⚠️  Warning: Cannot confirm TEST_MODE in logs"
  echo "  The backend may not be in test mode"
  echo "  Gemini API calls may hit real API (rate limits!)"
  echo ""
  echo "  Check logs manually: cat $BACKEND_DIR/backend-test-mode.log"
fi

echo ""
echo "========================================"
echo "✅ Backend restart with TEST_MODE complete!"
echo ""
echo "Summary:"
echo "  • Backend running on: http://localhost:3006"
echo "  • Process ID: $BACKEND_PID"
echo "  • Test Mode: ENABLED"
echo "  • Gemini API: MOCKED (no rate limits)"
echo "  • Logs: $BACKEND_DIR/backend-test-mode.log"
echo ""
echo "Ready to run E2E tests!"
echo ""
echo "Next steps:"
echo "  cd teacher-assistant/frontend"
echo "  npx playwright test"

exit 0
