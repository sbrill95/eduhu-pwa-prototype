#!/bin/bash
# Test 03: Path Operations
# Tests: Directory navigation, path manipulation

echo "Test 03: Path operations"

# Get current directory
echo "Current dir: $(pwd)"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script dir: $SCRIPT_DIR"

# Get project root (parent of scripts)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
echo "Project root: $PROJECT_ROOT"

# Backend directory path
BACKEND_DIR="$PROJECT_ROOT/teacher-assistant/backend"
echo "Backend dir: $BACKEND_DIR"

# Test if directory exists
if [ -d "$BACKEND_DIR" ]; then
  echo "Backend dir exists: YES"
else
  echo "Backend dir exists: NO"
fi

echo "Status: PASS"
exit 0
