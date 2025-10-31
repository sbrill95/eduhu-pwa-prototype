# restart-backend.sh Crash Analysis

**Date**: 2025-10-27
**Issue**: Claude Code crashes when running `scripts/restart-backend.sh`
**Environment**: Windows (Git Bash)

---

## 🔍 Root Cause Analysis

### Primary Suspects (Ordered by Likelihood)

#### 1. **PowerShell Health Check Command (Lines 238-242)** - HIGHEST RISK
```bash
PS_COMMAND='try { $r = Invoke-WebRequest -Uri "http://localhost:3006/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; $r.Content } catch { "" }'
HEALTH_RESPONSE=$(powershell.exe -NoProfile -NonInteractive -Command "$PS_COMMAND" 2>/dev/null || echo "")
```

**Why it crashes**:
- Complex nested quotes (single quotes wrapping double quotes)
- Git Bash quote translation issues
- PowerShell output encoding (UTF-16 vs UTF-8)
- Silent failures with `|| echo ""` mask real errors

**Symptoms**:
- Crash occurs during "Step 4: Waiting for backend to be ready"
- No error message, just instant termination
- Claude Code can't handle PowerShell encoding or quote escaping

---

#### 2. **Tasklist PID Checking (Lines 207-210)** - HIGH RISK
```bash
TASKLIST_OUTPUT=$(tasklist //FI "PID eq $BACKEND_PID" 2>&1 || true)
if echo "$TASKLIST_OUTPUT" | grep -q "$BACKEND_PID"; then
  PROCESS_ALIVE=true
fi
```

**Why it crashes**:
- Tasklist output format varies by Windows locale
- PID might not be numeric (rare edge case)
- Output encoding issues (Windows code page vs UTF-8)
- Pipe to grep could fail if output contains control characters

**Symptoms**:
- Crash during health check loop (every second)
- Happens when checking if backend process is alive
- More likely if Windows is non-English locale

---

#### 3. **String Comparison with == (Line 261)** - MEDIUM RISK
```bash
if [ "$GIT_COMMIT_SHORT" == "$CURRENT_COMMIT" ]; then
```

**Why it crashes**:
- `==` is bash-specific (should use `=` for POSIX compatibility)
- Git Bash might interpret this differently in some contexts
- Could cause test condition to fail unexpectedly

**Symptoms**:
- Crash after backend responds successfully
- Happens during commit verification step

---

#### 4. **Log File Grep Operations (Lines 326-327)** - MEDIUM RISK
```bash
TEST_MODE_IN_LOGS=$(grep "TEST MODE" "$LOG_FILE" 2>/dev/null || true)
VITE_TEST_MODE_IN_LOGS=$(grep "VITE_TEST_MODE" "$LOG_FILE" 2>/dev/null || true)
```

**Why it crashes**:
- Log file might have Windows line endings (CRLF vs LF)
- Encoding issues (UTF-8 with BOM, UTF-16, etc.)
- File locked by backend process on Windows
- Grep might fail on binary content (if logs are corrupted)

**Symptoms**:
- Crash during "Step 5: Verifying TEST_MODE is active"
- Happens after backend starts successfully
- More likely if backend outputs emoji/special characters

---

#### 5. **Git Commands Without Error Handling (Line 254)** - LOW RISK
```bash
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null | cut -c1-7 || true)
```

**Why it crashes**:
- Git might not be in PATH (though unlikely)
- Cut command could fail on Windows with unexpected input
- Pipe failure between git and cut

---

## 🔧 Known Fixes Already Applied

The script shows several fixes were already implemented:

1. **Disabled `set -e` on Windows** (Line 11):
   ```bash
   # Don't use 'set -e' on Windows - causes crashes with command failures
   # set -e  # Exit on any error
   ```

2. **Git Bash Path Translation Fix** (Lines 18, 207):
   ```bash
   tasklist //FI "PID eq $BACKEND_PID"  # Use // not / to prevent path translation
   ```

3. **Added `|| true` to prevent crashes** (Lines 207, 253-254, 276-277, 283):
   ```bash
   GIT_COMMIT=$(echo "$HEALTH_RESPONSE" | grep -o '"gitCommit":"[^"]*"' | cut -d'"' -f4 || true)
   ```

---

## 🎯 Recommended Fixes (Prioritized)

### Fix #1: Replace PowerShell Health Check (CRITICAL)
**Current** (Line 238-242):
```bash
PS_COMMAND='try { $r = Invoke-WebRequest -Uri "http://localhost:3006/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; $r.Content } catch { "" }'
HEALTH_RESPONSE=$(powershell.exe -NoProfile -NonInteractive -Command "$PS_COMMAND" 2>/dev/null || echo "")
```

**Fixed** (Simpler, no nested quotes):
```bash
# Use timeout command with curl fallback
if command -v timeout &> /dev/null; then
  HEALTH_RESPONSE=$(timeout 2 curl -f -s http://localhost:3006/api/health 2>/dev/null || echo "")
  CURL_EXIT=$?
  if [ $CURL_EXIT -eq 0 ]; then
    HEALTH_CHECK_SUCCESS=true
  fi
elif [ "$IS_WINDOWS" = true ]; then
  # Windows: Use simpler wget (often available in Git Bash)
  HEALTH_RESPONSE=$(wget -q -O- --timeout=2 http://localhost:3006/api/health 2>/dev/null || echo "")
  if [ -n "$HEALTH_RESPONSE" ]; then
    HEALTH_CHECK_SUCCESS=true
  fi
fi
```

---

### Fix #2: Safer Tasklist PID Check
**Current** (Line 207-210):
```bash
TASKLIST_OUTPUT=$(tasklist //FI "PID eq $BACKEND_PID" 2>&1 || true)
if echo "$TASKLIST_OUTPUT" | grep -q "$BACKEND_PID"; then
  PROCESS_ALIVE=true
fi
```

**Fixed** (More defensive):
```bash
# Use task query with explicit encoding
if command -v tasklist &> /dev/null; then
  # Check if PID exists in tasklist (simplified check)
  TASKLIST_CHECK=$(tasklist 2>/dev/null | grep -c "^node.exe" || echo "0")
  if [ "$TASKLIST_CHECK" -gt 0 ]; then
    # Node process exists, assume backend is alive (can't reliably check specific PID)
    PROCESS_ALIVE=true
  fi
else
  # Fallback: Assume alive if we can't check (will be verified by health check)
  PROCESS_ALIVE=true
fi
```

---

### Fix #3: Use POSIX-Compatible String Comparison
**Current** (Line 261):
```bash
if [ "$GIT_COMMIT_SHORT" == "$CURRENT_COMMIT" ]; then
```

**Fixed**:
```bash
if [ "$GIT_COMMIT_SHORT" = "$CURRENT_COMMIT" ]; then
```

---

### Fix #4: Safer Log File Grep
**Current** (Lines 326-327):
```bash
TEST_MODE_IN_LOGS=$(grep "TEST MODE" "$LOG_FILE" 2>/dev/null || true)
```

**Fixed** (Handle file locks):
```bash
# Wait for file to be unlocked (Windows file locking issue)
sleep 1

# Check if file exists and is readable
if [ -f "$LOG_FILE" ] && [ -r "$LOG_FILE" ]; then
  TEST_MODE_IN_LOGS=$(grep "TEST MODE" "$LOG_FILE" 2>/dev/null || echo "")
else
  TEST_MODE_IN_LOGS=""
  echo "  [WARN] Cannot read log file (may be locked)"
fi
```

---

## 🧪 Testing Strategy

### Test Case 1: PowerShell Health Check
```bash
# Isolate the problematic command
PS_COMMAND='try { $r = Invoke-WebRequest -Uri "http://localhost:3006/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; $r.Content } catch { "" }'
echo "Testing PS command..."
powershell.exe -NoProfile -NonInteractive -Command "$PS_COMMAND"
echo "Exit code: $?"
```

**Expected crash point**: If this crashes Claude Code, PowerShell is the culprit.

---

### Test Case 2: Tasklist PID Check
```bash
# Start a test process
sleep 1000 &
TEST_PID=$!
echo "Test PID: $TEST_PID"

# Test tasklist command
TASKLIST_OUTPUT=$(tasklist //FI "PID eq $TEST_PID" 2>&1 || true)
echo "Tasklist output: $TASKLIST_OUTPUT"
echo "Exit code: $?"

# Kill test process
kill $TEST_PID 2>/dev/null || true
```

**Expected crash point**: If tasklist fails, this will show encoding/format issues.

---

### Test Case 3: Full Script in Isolation
```bash
# Run with verbose output
set -x  # Print each command
bash scripts/restart-backend.sh 2>&1 | tee restart-debug.log

# Check where it crashes
tail -n 50 restart-debug.log
```

---

## 📊 Crash Pattern Detection

### If crash happens during "Step 4" (Health Check):
→ **PowerShell health check is the issue** (Fix #1)

### If crash happens immediately after "Backend PID: XXXXX":
→ **Tasklist PID checking is the issue** (Fix #2)

### If crash happens during "Step 5" (TEST_MODE verification):
→ **Log file grep is the issue** (Fix #4)

### If crash is random/intermittent:
→ **Git Bash encoding/quote handling** - Simplify all commands

---

## 🚨 Emergency Workaround

If script keeps crashing, bypass it with manual steps:

```bash
# Step 1: Kill old processes
bash scripts/kill-backend.sh

# Step 2: Wait for port to free
sleep 3

# Step 3: Start backend manually
cd teacher-assistant/backend
VITE_TEST_MODE=true npm start > backend-test-mode.log 2>&1 &

# Step 4: Check if it started
sleep 5
curl http://localhost:3006/api/health

# If that works, problem is definitely in restart-backend.sh
```

---

## 📝 Next Steps

1. **Identify exact crash point**:
   - Run script with `set -x` to see last executed command
   - Check Claude Code error logs (if available)

2. **Apply Fix #1 first** (PowerShell replacement):
   - This is the most likely culprit
   - Simplifies Windows compatibility

3. **Test incrementally**:
   - Apply one fix at a time
   - Test after each fix to isolate what works

4. **Document the working solution**:
   - Update this file with confirmed fix
   - Add to Error Prevention System docs

---

## 🔗 Related Files

- `scripts/restart-backend.sh` - Main script
- `scripts/kill-backend.sh` - Dependency (also has Windows quirks)
- `scripts/pre-test-checklist.sh` - Uses similar patterns
- `docs/CLAUDE.md` - Error Prevention System docs (lines 84-194)

---

## ✅ Resolution Checklist

When issue is fixed, document:
- [ ] Exact crash point identified (line number)
- [ ] Root cause confirmed (which of the 5 suspects)
- [ ] Fix applied and tested
- [ ] Script runs without crashes (3+ successful runs)
- [ ] Update Error Prevention System docs
- [ ] Add regression test case
- [ ] Commit fix with detailed message

---

**Last Updated**: 2025-10-27
**Status**: Analysis complete, awaiting crash point identification
