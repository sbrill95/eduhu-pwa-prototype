#!/bin/bash
# Restart Backend Script (with TEST_MODE support)
# Safely restarts backend with VITE_TEST_MODE=true for E2E testing
# Prevents 429 rate limit errors and infrastructure-related test failures
#
# Usage:
#   bash scripts/restart-backend.sh           # Start with TEST_MODE (default)
#   bash scripts/restart-backend.sh --prod    # Start without TEST_MODE

# Don't use 'set -e' on Windows - causes crashes with command failures
# set -e  # Exit on any error

# Detect OS
OS="$(uname -s)"
case "$OS" in
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    IS_WINDOWS=true
    ;;
  *)
    IS_WINDOWS=false
    ;;
esac

# Disable emojis on Windows by default (can cause encoding issues)
if [ "$IS_WINDOWS" = true ]; then
  USE_EMOJIS=false
else
  USE_EMOJIS=true
fi

# Parse arguments
TEST_MODE=true
if [ "$1" == "--prod" ] || [ "$1" == "--production" ]; then
  TEST_MODE=false
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
if [ "$TEST_MODE" = true ]; then
  if [ "$USE_EMOJIS" = true ]; then
    echo -e "${BLUE}🧪 Restarting backend with TEST_MODE enabled...${NC}"
  else
    echo -e "${BLUE}[TEST] Restarting backend with TEST_MODE enabled...${NC}"
  fi
else
  if [ "$USE_EMOJIS" = true ]; then
    echo -e "${BLUE}🔄 Restarting backend in PRODUCTION mode...${NC}"
  else
    echo -e "${BLUE}[PROD] Restarting backend in PRODUCTION mode...${NC}"
  fi
fi
echo ""

# Get script directory (cross-platform)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/teacher-assistant/backend"

# Set log file based on mode
if [ "$TEST_MODE" = true ]; then
  LOG_FILE="$BACKEND_DIR/backend-test-mode.log"
else
  LOG_FILE="$BACKEND_DIR/backend.log"
fi

# ==============================================================================
# STEP 1: Kill Old Processes
# ==============================================================================
echo -e "${YELLOW}Step 1: Stopping existing backend processes${NC}"
echo "=============================================="

bash "$SCRIPT_DIR/kill-backend.sh"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to kill old processes${NC}"
  exit 1
fi

echo ""

# ==============================================================================
# STEP 2: Wait for Port to Be Free
# ==============================================================================
echo -e "${YELLOW}Step 2: Verifying port 3006 is free${NC}"
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
    echo -e "${GREEN}✅ Port 3006 is now free${NC}"
    break
  fi

  # Otherwise wait
  WAITED=$((WAITED + 1))
  if [ $WAITED -lt $MAX_WAIT ]; then
    echo "  Waiting for port to be free... ($WAITED/$MAX_WAIT)"
    sleep 1
  else
    echo -e "${RED}❌ Port 3006 still occupied after ${MAX_WAIT}s${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check processes: netstat -ano | findstr :3006"
    echo "  • Kill manually: taskkill /F /PID <PID>"
    exit 1
  fi
done

echo ""

# ==============================================================================
# STEP 3: Start Backend
# ==============================================================================
if [ "$TEST_MODE" = true ]; then
  echo -e "${YELLOW}Step 3: Starting backend with TEST_MODE enabled${NC}"
else
  echo -e "${YELLOW}Step 3: Starting backend in PRODUCTION mode${NC}"
fi
echo "================================================"

# Navigate to backend directory
cd "$BACKEND_DIR" || {
  echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
  exit 1
}

echo "  Directory: $(pwd)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found. Please install Node.js${NC}"
  exit 1
fi

# Check if dist directory exists (compiled TypeScript)
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  Warning: dist/ directory not found. Running build first...${NC}"
  npm run build
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
  fi
fi

# Display startup configuration
if [ "$TEST_MODE" = true ]; then
  echo "  Setting: VITE_TEST_MODE=true"
fi
echo "  Command: npm start"
echo "  Logs: $LOG_FILE"
echo ""

# Start backend in background
if [ "$TEST_MODE" = true ]; then
  VITE_TEST_MODE=true npm start > "$LOG_FILE" 2>&1 &
else
  npm start > "$LOG_FILE" 2>&1 &
fi

BACKEND_PID=$!
echo -e "  ${GREEN}Backend PID: $BACKEND_PID${NC}"
echo ""

# ==============================================================================
# STEP 4: Wait for Backend to Be Ready
# ==============================================================================
echo -e "${YELLOW}Step 4: Waiting for backend to be ready${NC}"
echo "========================================"

MAX_ATTEMPTS=30
ATTEMPT=0
READY=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  # Check if process is still running (OS-specific)
  PROCESS_ALIVE=false
  if [ "$IS_WINDOWS" = true ]; then
    # Windows: Use tasklist to check if PID exists
    # CRITICAL: Use //FI not /FI to prevent Git Bash path translation
    TASKLIST_OUTPUT=$(tasklist //FI "PID eq $BACKEND_PID" 2>&1 || true)
    if echo "$TASKLIST_OUTPUT" | grep -q "$BACKEND_PID"; then
      PROCESS_ALIVE=true
    fi
  else
    # Unix: Use ps command
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
      PROCESS_ALIVE=true
    fi
  fi

  if [ "$PROCESS_ALIVE" = false ]; then
    echo -e "${RED}❌ Backend process died${NC}"
    echo ""
    echo "Last 20 lines of logs:"
    tail -n 20 "$LOG_FILE" 2>/dev/null || echo "  Log file not found"
    exit 1
  fi

  # Check if backend health endpoint responds
  HEALTH_CHECK_SUCCESS=false

  if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -f -s http://localhost:3006/api/health 2>&1 || true)
    CURL_EXIT=$?
    if [ $CURL_EXIT -eq 0 ]; then
      HEALTH_CHECK_SUCCESS=true
    fi
  elif [ "$IS_WINDOWS" = true ]; then
    # Windows fallback: Use simpler PowerShell command
    # Split into parts to avoid nested quote issues
    PS_COMMAND='try { $r = Invoke-WebRequest -Uri "http://localhost:3006/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; $r.Content } catch { "" }'
    HEALTH_RESPONSE=$(powershell.exe -NoProfile -NonInteractive -Command "$PS_COMMAND" 2>/dev/null || echo "")
    if [ -n "$HEALTH_RESPONSE" ] && [ "$HEALTH_RESPONSE" != '""' ]; then
      HEALTH_CHECK_SUCCESS=true
    fi
  fi

  if [ "$HEALTH_CHECK_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ Backend is responding!${NC}"
    echo ""

    # Parse and display health check info
    echo "Backend Info:"

    # Extract git commit (use || true to prevent crashes)
    GIT_COMMIT=$(echo "$HEALTH_RESPONSE" | grep -o '"gitCommit":"[^"]*"' | cut -d'"' -f4 || true)
    CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null | cut -c1-7 || true)

    if [ -n "$GIT_COMMIT" ]; then
      GIT_COMMIT_SHORT="${GIT_COMMIT:0:7}"
      echo "  Git commit: $GIT_COMMIT_SHORT"

      # Verify commit matches current HEAD
      if [ "$GIT_COMMIT_SHORT" == "$CURRENT_COMMIT" ]; then
        if [ "$USE_EMOJIS" = true ]; then
          echo -e "  ${GREEN}✅ Commit matches current HEAD${NC}"
        else
          echo -e "  ${GREEN}[OK] Commit matches current HEAD${NC}"
        fi
      else
        if [ "$USE_EMOJIS" = true ]; then
          echo -e "  ${YELLOW}⚠️  Warning: Commit mismatch (HEAD: $CURRENT_COMMIT)${NC}"
        else
          echo -e "  ${YELLOW}[WARN] Commit mismatch (HEAD: $CURRENT_COMMIT)${NC}"
        fi
      fi
    fi

    # Extract InstantDB status (use || true to prevent crashes)
    INSTANTDB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"instantdb":"[^"]*"' | cut -d'"' -f4 || true)
    if [ -n "$INSTANTDB_STATUS" ]; then
      echo "  InstantDB: $INSTANTDB_STATUS"
    fi

    # Extract environment (use || true to prevent crashes)
    ENVIRONMENT=$(echo "$HEALTH_RESPONSE" | grep -o '"environment":"[^"]*"' | cut -d'"' -f4 || true)
    if [ -n "$ENVIRONMENT" ]; then
      echo "  Environment: $ENVIRONMENT"
    fi

    echo ""
    READY=1
    break
  fi

  # Show progress every 5 seconds
  if [ $((ATTEMPT % 5)) -eq 0 ]; then
    echo "  Waiting... ($ATTEMPT/$MAX_ATTEMPTS)"
  fi

  sleep 1
done

if [ $READY -eq 0 ]; then
  echo -e "${RED}❌ Backend failed to start within ${MAX_ATTEMPTS}s${NC}"
  echo ""
  echo "Last 30 lines of logs:"
  tail -n 30 "$LOG_FILE" 2>/dev/null || echo "  Log file not found"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check logs: $LOG_FILE"
  echo "  2. Check port: netstat -ano | findstr :3006"
  echo "  3. Check .env: $BACKEND_DIR/.env"
  echo "  4. Try manual start: cd teacher-assistant/backend && npm start"
  exit 1
fi

# ==============================================================================
# STEP 5: Verify Configuration (TEST_MODE only)
# ==============================================================================
if [ "$TEST_MODE" = true ]; then
  echo -e "${YELLOW}Step 5: Verifying TEST_MODE is active${NC}"
  echo "======================================"

  # Wait for logs to flush
  sleep 2

  # Check logs for TEST_MODE indicators (use || true to prevent crashes)
  TEST_MODE_IN_LOGS=$(grep "TEST MODE" "$LOG_FILE" 2>/dev/null || true)
  VITE_TEST_MODE_IN_LOGS=$(grep "VITE_TEST_MODE" "$LOG_FILE" 2>/dev/null || true)

  if [ -n "$TEST_MODE_IN_LOGS" ]; then
    if [ "$USE_EMOJIS" = true ]; then
      echo -e "${GREEN}✅ TEST_MODE is active (confirmed in logs)${NC}"
    else
      echo -e "${GREEN}[OK] TEST_MODE is active (confirmed in logs)${NC}"
    fi
    echo ""
    echo "Test Mode Indicators:"
    echo "$TEST_MODE_IN_LOGS" | tail -n 5 | sed 's/^/  /'
  elif [ -n "$VITE_TEST_MODE_IN_LOGS" ]; then
    if [ "$USE_EMOJIS" = true ]; then
      echo -e "${GREEN}✅ TEST_MODE environment variable detected${NC}"
    else
      echo -e "${GREEN}[OK] TEST_MODE environment variable detected${NC}"
    fi
  else
    if [ "$USE_EMOJIS" = true ]; then
      echo -e "${YELLOW}⚠️  Warning: Cannot confirm TEST_MODE in logs${NC}"
    else
      echo -e "${YELLOW}[WARN] Cannot confirm TEST_MODE in logs${NC}"
    fi
    echo "  The backend may not be in test mode"
    echo "  Gemini API calls may hit real API (rate limits!)"
    echo ""
    echo "  Check logs manually: cat $LOG_FILE"
  fi

  echo ""
fi

# ==============================================================================
# SUCCESS SUMMARY
# ==============================================================================
echo "========================================"
if [ "$TEST_MODE" = true ]; then
  if [ "$USE_EMOJIS" = true ]; then
    echo -e "${GREEN}✅ Backend restart with TEST_MODE complete!${NC}"
  else
    echo -e "${GREEN}[SUCCESS] Backend restart with TEST_MODE complete!${NC}"
  fi
else
  if [ "$USE_EMOJIS" = true ]; then
    echo -e "${GREEN}✅ Backend restart complete!${NC}"
  else
    echo -e "${GREEN}[SUCCESS] Backend restart complete!${NC}"
  fi
fi
echo ""
echo "Summary:"
echo "  • Backend running on: http://localhost:3006"
echo "  • Process ID: $BACKEND_PID"
if [ "$TEST_MODE" = true ]; then
  echo -e "  • Test Mode: ${GREEN}ENABLED${NC}"
  echo -e "  • Gemini API: ${GREEN}MOCKED (no rate limits)${NC}"
else
  echo -e "  • Test Mode: ${YELLOW}DISABLED${NC}"
  echo -e "  • Gemini API: ${YELLOW}REAL (rate limits apply)${NC}"
fi
echo "  • Logs: $LOG_FILE"
echo ""

if [ "$TEST_MODE" = true ]; then
  if [ "$USE_EMOJIS" = true ]; then
    echo -e "${GREEN}Ready to run E2E tests!${NC}"
  else
    echo -e "${GREEN}Ready to run E2E tests!${NC}"
  fi
  echo ""
  echo "Next steps:"
  echo "  cd teacher-assistant/frontend"
  echo "  npx playwright test"
else
  echo "Backend is running in production mode."
  echo "To enable TEST_MODE: bash scripts/restart-backend.sh"
fi

echo ""
exit 0
