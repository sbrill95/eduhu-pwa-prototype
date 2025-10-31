#!/bin/bash
# Debug version of restart-backend.sh
# Logs every command to identify crash point

DEBUG_LOG="restart-debug-$(date +%Y%m%d-%H%M%S).log"

echo "Starting debug session: $DEBUG_LOG"
echo "Press Ctrl+C to stop"
echo ""

# Enable command tracing
set -x

# Run restart script and capture ALL output
bash scripts/restart-backend.sh 2>&1 | tee "$DEBUG_LOG"

EXIT_CODE=$?

set +x

echo ""
echo "===================="
echo "Debug session complete"
echo "Exit code: $EXIT_CODE"
echo "Log saved to: $DEBUG_LOG"
echo ""
echo "Last 20 lines before crash:"
tail -n 20 "$DEBUG_LOG"
