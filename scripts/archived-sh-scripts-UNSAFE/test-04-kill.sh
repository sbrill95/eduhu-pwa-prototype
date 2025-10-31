#!/bin/bash
# Test 04: Kill Backend Script
# Tests: Calling kill-backend.sh

echo "Test 04: Kill script"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Calling kill-backend.sh..."

# Call kill script (this might crash)
bash "$SCRIPT_DIR/kill-backend.sh"

KILL_EXIT=$?
echo "Kill script exit code: $KILL_EXIT"

if [ $KILL_EXIT -eq 0 ]; then
  echo "Status: PASS"
else
  echo "Status: FAIL (but didn't crash)"
fi

exit 0
