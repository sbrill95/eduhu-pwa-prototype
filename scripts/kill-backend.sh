#!/bin/bash
# Kill Backend Script
# Kills all Node.js processes and frees port 3006
# Prevents "EADDRINUSE" port conflict errors

echo "[KILL] Killing all Node.js backend processes..."
echo ""

# Detect OS
OS="$(uname -s)"

case "$OS" in
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    # Windows
    echo "Detected: Windows"

    # Kill all node.exe processes
    # CRITICAL: Use //F //IM not /F /IM to prevent Git Bash path translation
    TASKKILL_OUTPUT=$(taskkill //F //IM node.exe 2>&1 || true)
    if echo "$TASKKILL_OUTPUT" | grep -q "SUCCESS"; then
      echo "  Killed node.exe processes"
    else
      echo "  No node.exe processes found"
    fi

    # Wait for processes to die
    sleep 2

    # Check if port 3006 is free
    PORT_CHECK=$(netstat -ano 2>/dev/null | findstr ":3006" || true)

    if [ -n "$PORT_CHECK" ]; then
      echo ""
      echo "[WARN] Port 3006 still in use!"
      echo "$PORT_CHECK"

      # Extract PID and kill it
      PORT_PID=$(echo "$PORT_CHECK" | awk '{print $5}' | head -n 1 || true)

      if [ -n "$PORT_PID" ]; then
        echo "  Killing PID: $PORT_PID"
        # CRITICAL: Use //F //PID not /F /PID for Git Bash
        taskkill //F //PID $PORT_PID 2>&1 || echo "  Failed to kill PID $PORT_PID"
      fi
    fi
    ;;

  Linux|Darwin)
    # Linux or macOS
    echo "Detected: Unix-like ($OS)"

    # Kill all node processes (graceful)
    pkill node 2>/dev/null || echo "  No node processes found"

    # Wait
    sleep 2

    # Check if port 3006 is free
    if lsof -ti:3006 &> /dev/null; then
      echo ""
      echo "[WARN] Port 3006 still in use!"

      # Force kill
      echo "  Force killing processes on port 3006..."
      PORT_PIDS=$(lsof -ti:3006 || true)
      if [ -n "$PORT_PIDS" ]; then
        echo "$PORT_PIDS" | xargs kill -9 2>/dev/null || echo "  Failed to kill processes"
      fi
    fi
    ;;

  *)
    echo "[WARN] Unknown OS: $OS"
    echo "  Please manually kill node processes"
    exit 1
    ;;
esac

# Final verification
sleep 1

echo ""
echo "===================="

# Check port 3006
if command -v netstat &> /dev/null; then
  PORT_OCCUPIED=$(netstat -ano 2>/dev/null | grep ":3006" || true)
  if [ -n "$PORT_OCCUPIED" ]; then
    echo "[FAIL] Port 3006 still occupied"
    echo "  Manual action required"
    exit 1
  else
    echo "[OK] Port 3006 is free"
  fi
elif command -v lsof &> /dev/null; then
  if lsof -ti:3006 &> /dev/null; then
    echo "[FAIL] Port 3006 still occupied"
    echo "  Manual action required"
    exit 1
  else
    echo "[OK] Port 3006 is free"
  fi
else
  echo "[WARN] Cannot verify port status (netstat/lsof not available)"
fi

echo "[OK] Cleanup complete"
exit 0
