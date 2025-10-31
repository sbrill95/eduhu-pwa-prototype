# CRITICAL: Claude Code Windows Limitation

**Date**: 2025-10-27
**Severity**: CRITICAL - BLOCKS ALL SCRIPT EXECUTION
**Status**: CONFIRMED ISSUE

---

## 🔴 CONFIRMED ISSUE

**Claude Code crashes when executing ANY script files on Windows**

### What Crashes Claude Code:
- ❌ `bash scripts/restart-backend.sh` → **CRASHES**
- ❌ `bash scripts/any-script.sh` → **CRASHES**
- ❌ `cmd /c scripts\restart-backend.bat` → **CRASHES**
- ❌ ANY external script execution → **CRASHES**

### What Works:
- ✅ Simple inline bash commands (echo, ls, cd)
- ✅ curl requests
- ✅ Reading files with cat/Read tool
- ✅ Writing files

---

## ✅ ONLY SAFE SOLUTION: External Terminal

**You MUST use a separate terminal window** to run backend restart scripts.

### Step-by-Step:

#### 1. Open Windows Command Prompt:
- Press `Win + R`
- Type `cmd`
- Press Enter

#### 2. Navigate to Project:
```cmd
cd C:\Users\steff\Desktop\eduhu-pwa-prototype
```

#### 3. Run Restart Script:
```cmd
scripts\restart-backend.bat
```

#### 4. Wait for Success Message:
```
SUCCESS: Backend restart complete!
Backend running on: http://localhost:3006
```

#### 5. Return to Claude Code:
Now you can safely use Claude Code for development, testing, etc.

---

## 🎯 WORKFLOW: Backend Restart

### DO THIS (External Terminal):
```
1. Open separate CMD window
2. Run: cd C:\Users\steff\Desktop\eduhu-pwa-prototype
3. Run: scripts\restart-backend.bat
4. Wait for "SUCCESS" message
5. Return to Claude Code
```

### DO NOT DO THIS (Through Claude Code):
```bash
# ❌ This will crash Claude Code:
bash scripts/restart-backend.sh
cmd /c scripts\restart-backend.bat
```

---

## 🧪 FOR E2E TESTING

### Before Running Tests:

1. **Restart Backend** (in external CMD):
   ```cmd
   scripts\restart-backend.bat
   ```

2. **Verify Backend** (can use Claude Code):
   ```bash
   curl http://localhost:3006/api/health
   ```

3. **Run Tests** (through Claude Code is OK):
   ```bash
   cd teacher-assistant/frontend
   npx playwright test
   ```

---

## ✅ SAFE INLINE COMMANDS (Through Claude Code)

These commands are SAFE to run through Claude Code:

### Check Backend Status:
```bash
curl -s http://localhost:3006/api/health
```

### Check Port Usage:
```bash
netstat -ano | findstr ":3006"
```

### View Logs:
```bash
cat teacher-assistant/backend/backend-test-mode.log | tail -n 50
```

### Kill Backend (Simple):
```bash
taskkill //F //IM node.exe
```

### Navigate:
```bash
cd teacher-assistant/backend
pwd
ls
```

---

## ⚠️ UNSAFE COMMANDS (Avoid Through Claude Code)

### Background Process Start:
```bash
# ❌ MIGHT CRASH:
npm start &

# ❌ MIGHT CRASH:
VITE_TEST_MODE=true npm start > log.txt 2>&1 &
```

### Script Execution:
```bash
# ❌ WILL CRASH:
bash any-script.sh

# ❌ WILL CRASH:
cmd /c any-script.bat
```

### Complex Command Substitution:
```bash
# ❌ MIGHT CRASH:
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
```

---

## 📋 QUICK REFERENCE CARD

**Print this and keep handy:**

```
═══════════════════════════════════════════════════
       BACKEND RESTART - QUICK REFERENCE
═══════════════════════════════════════════════════

TO RESTART BACKEND:
  1. Open separate CMD window (Win+R → cmd)
  2. cd C:\Users\steff\Desktop\eduhu-pwa-prototype
  3. scripts\restart-backend.bat
  4. Wait for "SUCCESS" message

TO VERIFY BACKEND (in Claude Code):
  curl http://localhost:3006/api/health

TO KILL BACKEND (in Claude Code):
  taskkill //F //IM node.exe

NEVER DO:
  ❌ bash scripts/*.sh (crashes!)
  ❌ cmd /c scripts/*.bat (crashes!)

═══════════════════════════════════════════════════
```

---

## 🔧 FOR DEVELOPMENT

### Pattern 1: Need to Restart Backend

**DON'T**: Ask Claude Code to restart backend
**DO**:
1. Tell user: "Please restart backend in external terminal"
2. Provide: `scripts\restart-backend.bat`
3. Wait: User confirms "backend running"
4. Continue: With development/testing

### Pattern 2: Need to Check Backend

**DO**: Use curl through Claude Code
```bash
curl -s http://localhost:3006/api/health
```

### Pattern 3: Need to Kill Backend

**DO**: Use taskkill through Claude Code (usually safe)
```bash
taskkill //F //IM node.exe
```

**DON'T**: Try to start it again through Claude Code

---

## 📝 UPDATE ALL DOCUMENTATION

### CLAUDE.md Should Say:

```markdown
## Backend Restart (Windows)

⚠️ **CRITICAL**: Claude Code cannot execute script files on Windows.

**To restart backend**:
1. Open separate Windows Command Prompt
2. Navigate: `cd C:\Users\steff\Desktop\eduhu-pwa-prototype`
3. Run: `scripts\restart-backend.bat`
4. Wait for "SUCCESS" message

**Do NOT try** to run scripts through Claude Code - it will crash.

**Safe verification** (through Claude Code):
```bash
curl http://localhost:3006/api/health
```
```

---

## 🐛 BUG REPORT SUMMARY

**Issue**: Claude Code Bash tool crashes when executing external script files on Windows

**Affected**:
- .sh files (bash scripts)
- .bat files (batch scripts)
- Any subprocess spawning

**Workaround**: Use external terminal for all script execution

**Impact**: High - Blocks automated workflows on Windows

**Recommendation**: Claude Code team needs to fix subprocess handling on Windows Git Bash

---

## ✅ FINAL ANSWER

**Q: How do I restart the backend?**

**A: You CANNOT do it through Claude Code on Windows. You MUST:**
1. Open a separate Command Prompt window
2. Run `scripts\restart-backend.bat`
3. That's it.

**Q: Why can't Claude Code do this?**

**A: Claude Code crashes when trying to execute any script file on Windows. This is a known limitation.**

**Q: What CAN Claude Code do?**

**A: Simple inline commands (curl, ls, cat, etc.) but NOT script execution or background process spawning.**

---

**Last Updated**: 2025-10-27
**Status**: Documented workaround - Use external terminal for ALL script execution
