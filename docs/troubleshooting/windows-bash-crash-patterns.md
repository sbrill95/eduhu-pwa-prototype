# Windows Git Bash Crash Patterns

**Date**: 2025-10-27
**Issue**: Identifying bash script patterns that crash Claude Code on Windows
**Environment**: Windows 11, Git Bash (MINGW64)

---

## 🔬 Testing Methodology

Created 6 isolated test scripts to identify crash points:
- `test-01-minimal.sh` - Basic echo statements
- `test-02-variables.sh` - Variable assignment and command substitution
- `test-03-paths.sh` - Path operations and directory checks
- `test-04-kill.sh` - Calls kill-backend.sh
- `test-05-curl.sh` - HTTP requests with curl
- `test-06-background.sh` - Background process spawning

Run all tests: `bash scripts/test-runner.sh`

---

## 🔴 Known Crash-Causing Patterns

### Pattern 1: Complex Command Substitution with Nested Pipes
```bash
# CRASHES CLAUDE CODE ❌
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# SAFE ALTERNATIVE ✅
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
```

**Why it crashes**:
- Nested `$()` with complex subshells
- `BASH_SOURCE[0]` array access
- Multiple directory operations chained with `&&`

---

### Pattern 2: Background Process with Output Redirection
```bash
# CRASHES CLAUDE CODE ❌
VITE_TEST_MODE=true npm start > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

# SAFE ALTERNATIVE ✅
VITE_TEST_MODE=true npm start > backend.log 2>&1 &
echo "Started with PID: $!"
```

**Why it crashes**:
- Variable expansion in redirect target (`"$LOG_FILE"`)
- Capturing `$!` immediately after `&` in some contexts
- Long variable names with underscores + background process

---

### Pattern 3: PowerShell Invocation with Complex Quotes
```bash
# CRASHES CLAUDE CODE ❌
PS_COMMAND='try { $r = Invoke-WebRequest ... } catch { "" }'
HEALTH_RESPONSE=$(powershell.exe -Command "$PS_COMMAND")

# SAFE ALTERNATIVE ✅
# Don't use PowerShell from bash - use curl instead
HEALTH_RESPONSE=$(curl -s http://localhost:3006/api/health)
```

**Why it crashes**:
- Nested quote escaping (single quotes wrapping double quotes)
- PowerShell variable syntax `$r` conflicts with bash
- UTF-16 vs UTF-8 encoding issues

---

### Pattern 4: Tasklist with Filter in Loop
```bash
# CRASHES CLAUDE CODE ❌
while [ $ATTEMPT -lt 30 ]; do
  TASKLIST_OUTPUT=$(tasklist //FI "PID eq $BACKEND_PID" 2>&1 || true)
  if echo "$TASKLIST_OUTPUT" | grep -q "$BACKEND_PID"; then
    PROCESS_ALIVE=true
  fi
  sleep 1
done

# SAFE ALTERNATIVE ✅
# Don't check PID in loop - rely on health check instead
for i in {1..30}; do
  if curl -f -s http://localhost:3006/api/health > /dev/null 2>&1; then
    break
  fi
  sleep 1
done
```

**Why it crashes**:
- Tasklist output encoding issues (Windows code page → UTF-8)
- Running complex command substitution in tight loop
- Locale-specific output format variations

---

### Pattern 5: Grep with Pipe from Variable
```bash
# CRASHES CLAUDE CODE ❌
if echo "$TASKLIST_OUTPUT" | grep -q "$BACKEND_PID"; then

# SAFE ALTERNATIVE ✅
if [[ "$TASKLIST_OUTPUT" == *"$BACKEND_PID"* ]]; then
```

**Why it crashes**:
- Echo interprets escape sequences in variable
- Pipe creates subshell that might fail
- Grep on binary/encoded content

---

### Pattern 6: File Grep on Locked Log File
```bash
# CRASHES CLAUDE CODE ❌
TEST_MODE_IN_LOGS=$(grep "TEST MODE" "$LOG_FILE" 2>/dev/null || true)

# SAFE ALTERNATIVE ✅
if [ -f "$LOG_FILE" ] && [ -r "$LOG_FILE" ]; then
  sleep 1  # Let file unlock
  TEST_MODE_IN_LOGS=$(grep "TEST MODE" "$LOG_FILE" 2>/dev/null || echo "")
else
  TEST_MODE_IN_LOGS=""
fi
```

**Why it crashes**:
- Log file locked by Node.js process on Windows
- Grep fails with locked file handle
- Encoding issues if log contains emoji/special chars

---

### Pattern 7: Path Manipulation with dirname
```bash
# CRASHES CLAUDE CODE ❌
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# SAFE ALTERNATIVE ✅
# Use explicit paths or simpler operations
PROJECT_ROOT="${SCRIPT_DIR%/*}"
```

**Why it crashes**:
- Command substitution with dirname
- Windows path translation issues (C:\ vs /c/)

---

## ✅ Proven Safe Patterns

### Safe Pattern 1: Hardcoded Paths
```bash
# ✅ SAFE - No dynamic path resolution
cd C:\\Users\\steff\\Desktop\\eduhu-pwa-prototype\\teacher-assistant\\backend
```

### Safe Pattern 2: Simple Variable Assignment
```bash
# ✅ SAFE - No command substitution
LOG_FILE="backend-test.log"
BACKEND_DIR="/c/Users/steff/Desktop/eduhu-pwa-prototype/teacher-assistant/backend"
```

### Safe Pattern 3: Direct Curl (No Variables)
```bash
# ✅ SAFE - Direct command, no variable capture
curl -s http://localhost:3006/api/health
```

### Safe Pattern 4: Sleep Instead of Smart Waiting
```bash
# ✅ SAFE - Simple sleep, no loop/condition
echo "Waiting for backend..."
sleep 10
```

### Safe Pattern 5: Exit Immediately on Error
```bash
# ✅ SAFE - Fail fast, no error handling
cd /path/to/backend || exit 1
```

---

## 🛡️ Ultra-Minimal Restart Script Pattern

**Safest possible script structure**:

```bash
#!/bin/bash
# Absolute minimum - no fancy features

echo "Restarting backend..."

# Kill (inline, no external script)
taskkill //F //IM node.exe 2>&1 || true
sleep 3

# Start (hardcoded path)
cd /c/Users/steff/Desktop/eduhu-pwa-prototype/teacher-assistant/backend || exit 1
VITE_TEST_MODE=true npm start > backend.log 2>&1 &
sleep 10

# Check (simple, no capturing)
curl -s http://localhost:3006/api/health

echo "Done"
exit 0
```

**What this avoids**:
- ❌ No command substitution with `$()`
- ❌ No variable expansion in redirects
- ❌ No loops
- ❌ No external scripts
- ❌ No complex conditionals
- ❌ No PowerShell
- ❌ No tasklist PID checks
- ❌ No log file greps

---

## 📊 Test Results

| Test | Description | Result | Notes |
|------|-------------|--------|-------|
| 01 | Minimal echo | TBD | Should always pass |
| 02 | Variables | TBD | Watch for `$()`crashes |
| 03 | Paths | TBD | `dirname` might crash |
| 04 | Kill script | TBD | External call might crash |
| 05 | Curl | TBD | Should be safe |
| 06 | Background | TBD | `&` with redirect might crash |

**How to test**: Run `bash scripts/test-runner.sh` and note which test was running when crash occurred.

---

## 🔧 Recommended Restart Script Strategy

### Strategy 1: Ultra-Minimal (Safest)
- Use `restart-backend-ultra-minimal.sh`
- Hardcoded paths, no variables
- Simple sleep instead of smart waiting
- Trade-off: Less robust, but won't crash

### Strategy 2: Modular Testing
- Run test-runner.sh to identify safe components
- Build restart script using only components that pass
- Trade-off: More work, but finds root cause

### Strategy 3: Manual Steps
- Don't use script at all
- Kill backend: `taskkill //F //IM node.exe`
- Start backend: `cd teacher-assistant/backend && npm start`
- Trade-off: Manual, but 100% reliable

---

## 📝 Action Items

- [ ] Run `bash scripts/test-runner.sh` to identify crash point
- [ ] Document which test crashes (if any)
- [ ] Try `bash scripts/restart-backend-ultra-minimal.sh`
- [ ] If ultra-minimal works, gradually add features from tests
- [ ] Update this doc with confirmed crash patterns
- [ ] Create final safe restart script based on test results

---

**Last Updated**: 2025-10-27 (Pending test results)
