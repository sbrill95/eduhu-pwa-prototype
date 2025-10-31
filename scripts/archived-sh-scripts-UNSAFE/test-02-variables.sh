#!/bin/bash
# Test 02: Variables
# Tests: Variable assignment, string operations, command substitution

echo "Test 02: Variables"

# Simple variables
TEST_VAR="hello"
echo "Simple var: $TEST_VAR"

# Command substitution (RISKY on Windows)
CURRENT_DIR=$(pwd)
echo "Current dir: $CURRENT_DIR"

# Script directory (RISKY - uses BASH_SOURCE)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script dir: $SCRIPT_DIR"

echo "Status: PASS"
exit 0
