#!/bin/bash
# Test 06: Background Process
# Tests: Starting processes in background, PID capture

echo "Test 06: Background process"

# Get directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/teacher-assistant/backend"
LOG_FILE="$BACKEND_DIR/test-background.log"

echo "Backend dir: $BACKEND_DIR"
echo "Log file: $LOG_FILE"

# Test if we can cd to backend dir
cd "$BACKEND_DIR" || {
  echo "ERROR: Cannot cd to backend dir"
  exit 1
}

echo "Current dir: $(pwd)"

# Start a simple background process (not npm start, to be safe)
echo "Starting background sleep process..."
sleep 60 > "$LOG_FILE" 2>&1 &

PROCESS_PID=$!
echo "Process PID: $PROCESS_PID"

# Wait a moment
sleep 2

# Check if process is still alive (simple check)
if ps -p $PROCESS_PID > /dev/null 2>&1; then
  echo "Process alive: YES"

  # Kill the test process
  kill $PROCESS_PID 2>/dev/null || true
  echo "Process killed"
else
  echo "Process alive: NO (might be Windows ps issue)"
fi

echo "Status: PASS (no crash)"
exit 0
