#!/bin/bash
# Safe Restart Backend Script (Crash-Resistant Version)
# Simplified version without PowerShell/Tasklist issues

echo ""
echo "[SAFE] Restarting backend with TEST_MODE..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/teacher-assistant/backend"
LOG_FILE="$BACKEND_DIR/backend-test-mode.log"

# ==============================================================================
# STEP 1: Kill Old Processes
# ==============================================================================
echo "Step 1: Stopping existing backend processes"
echo "============================================="

bash "$SCRIPT_DIR/kill-backend.sh" || echo "[WARN] Kill script had issues, continuing..."

sleep 2
echo "[OK] Old processes stopped"
echo ""

# ==============================================================================
# STEP 2: Start Backend
# ==============================================================================
echo "Step 2: Starting backend"
echo "========================"

cd "$BACKEND_DIR" || {
  echo "[ERROR] Backend directory not found: $BACKEND_DIR"
  exit 1
}

echo "  Directory: $(pwd)"
echo "  Setting: VITE_TEST_MODE=true"
echo "  Logs: $LOG_FILE"
echo ""

# Start backend in background
VITE_TEST_MODE=true npm start > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

echo "  Backend PID: $BACKEND_PID"
echo ""

# ==============================================================================
# STEP 3: Wait for Backend (Simplified)
# ==============================================================================
echo "Step 3: Waiting for backend to be ready"
echo "========================================"

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  # Simple health check with curl (no PowerShell!)
  if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -f -s http://localhost:3006/api/health 2>/dev/null || echo "")

    if [ -n "$HEALTH_RESPONSE" ] && [ "$HEALTH_RESPONSE" != "Cannot GET /api/health" ]; then
      echo "[OK] Backend is responding!"
      echo ""

      # Display basic info (simplified parsing)
      echo "Backend Info:"
      echo "$HEALTH_RESPONSE" | grep -o '"gitCommit":"[^"]*"' | head -n 1 || true
      echo "$HEALTH_RESPONSE" | grep -o '"instantdb":"[^"]*"' | head -n 1 || true
      echo ""
      break
    fi
  fi

  # Show progress every 5 seconds
  if [ $((ATTEMPT % 5)) -eq 0 ]; then
    echo "  Waiting... ($ATTEMPT/$MAX_ATTEMPTS)"
  fi

  sleep 1
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
  echo "[ERROR] Backend failed to start within ${MAX_ATTEMPTS}s"
  echo ""
  echo "Last 30 lines of logs:"
  tail -n 30 "$LOG_FILE" 2>/dev/null || echo "  Log file not found"
  exit 1
fi

# ==============================================================================
# SUCCESS
# ==============================================================================
echo "========================================"
echo "[SUCCESS] Backend restart complete!"
echo ""
echo "Summary:"
echo "  • Backend running on: http://localhost:3006"
echo "  • Process ID: $BACKEND_PID"
echo "  • Test Mode: ENABLED"
echo "  • Logs: $LOG_FILE"
echo ""
echo "Ready to run E2E tests!"
echo ""

exit 0
