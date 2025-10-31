# SAFE Backend Restart Solution for Windows + Claude Code

**Date**: 2025-10-27
**Status**: CONFIRMED WORKING SOLUTION
**Problem**: bash .sh scripts crash Claude Code on Windows

---

## 🎯 ROOT CAUSE CONFIRMED

**Claude Code on Windows CANNOT execute external bash script files (`.sh files`)**

Testing confirmed:
- ✅ Inline bash commands work
- ✅ Reading script files works
- ❌ **Executing .sh files with `bash script.sh` CRASHES Claude Code**
- ❌ **Even minimal scripts crash**

---

## ✅ WORKING SOLUTION: Manual Command Sequence

Since we cannot execute script files, use this **inline command sequence** instead:

### Option 1: Git Bash Manual Steps (SAFEST)

```bash
# Step 1: Kill old node processes
taskkill //F //IM node.exe

# Step 2: Wait for port to free
sleep 3

# Step 3: Navigate to backend
cd teacher-assistant/backend

# Step 4: Start backend with TEST_MODE
VITE_TEST_MODE=true npm start &

# Step 5: Wait for startup
sleep 10

# Step 6: Verify it's running
curl http://localhost:3006/api/health
```

**Run each command separately in Claude Code** - Do NOT put them in a script file!

---

### Option 2: Windows Batch File (Alternative)

A `.bat` file already exists at `scripts/restart-backend.bat`

**To use it**:

1. **Open a new Windows Command Prompt (NOT through Claude Code)**:
   - Press Win+R
   - Type `cmd`
   - Press Enter

2. **Navigate to project**:
   ```cmd
   cd C:\Users\steff\Desktop\eduhu-pwa-prototype
   ```

3. **Run the batch file**:
   ```cmd
   scripts\restart-backend.bat
   ```

**Why this works**: Running `.bat` files externally avoids Claude Code's subprocess issues.

---

### Option 3: PowerShell Script (Alternative)

Create a simple PowerShell script that can be run externally:

```powershell
# restart-backend.ps1

Write-Host "Restarting backend..." -ForegroundColor Cyan

# Kill old processes
taskkill /F /IM node.exe 2>$null

# Wait
Start-Sleep -Seconds 3

# Start backend
cd "$PSScriptRoot\..\teacher-assistant\backend"
$env:VITE_TEST_MODE = "true"
Start-Process npm -ArgumentList "start" -NoNewWindow -RedirectStandardOutput "backend.log" -RedirectStandardError "backend-error.log"

# Wait for startup
Start-Sleep -Seconds 10

# Check health
Invoke-WebRequest -Uri "http://localhost:3006/api/health"

Write-Host "Backend started!" -ForegroundColor Green
```

**Run externally** in PowerShell, not through Claude Code.

---

## 🔴 WHAT NOT TO DO

### ❌ Do NOT try to run .sh scripts through Claude Code:
```bash
bash scripts/restart-backend.sh  # ❌ CRASHES
bash scripts/restart-backend-safe.sh  # ❌ CRASHES
bash scripts/test-runner.sh  # ❌ CRASHES
```

### ❌ Do NOT try to run .bat files through Claude Code Bash tool:
```bash
cmd /c scripts\\restart-backend.bat  # ❌ DOESN'T WORK PROPERLY
```

### ❌ Do NOT create wrapper scripts:
```bash
# wrapper.sh
bash restart-backend.sh  # ❌ STILL CRASHES
```

---

## ✅ RECOMMENDED WORKFLOW

### For Backend Restart:

**1. Through Claude Code (Manual Commands)**:
```bash
# Tell Claude Code to run these commands INDIVIDUALLY:
taskkill //F //IM node.exe
cd teacher-assistant/backend
VITE_TEST_MODE=true npm start &
curl http://localhost:3006/api/health
```

**2. Through External Terminal (Batch File)**:
- Open Windows Command Prompt separately
- Run `scripts\restart-backend.bat`
- Return to Claude Code for development

---

### For E2E Tests:

**BEFORE running tests, ensure backend is running**:

1. **Restart backend** using one of the methods above

2. **Verify** it's running:
   ```bash
   curl http://localhost:3006/api/health
   ```

3. **Then run tests**:
   ```bash
   cd teacher-assistant/frontend
   npx playwright test
   ```

---

## 📋 SAFE COMMAND REFERENCE

### Kill Backend:
```bash
taskkill //F //IM node.exe
```

### Start Backend (TEST_MODE):
```bash
cd teacher-assistant/backend
VITE_TEST_MODE=true npm start > backend-test.log 2>&1 &
```

### Start Backend (Production):
```bash
cd teacher-assistant/backend
npm start > backend.log 2>&1 &
```

### Check Backend Status:
```bash
curl http://localhost:3006/api/health
```

### Check Port Usage:
```bash
netstat -ano | findstr ":3006"
```

### View Backend Logs:
```bash
tail teacher-assistant/backend/backend-test.log
```

---

## 🎯 PERMANENT SOLUTION

### Update CLAUDE.md with Safe Restart Pattern:

```markdown
## Backend Restart (Windows)

**DO NOT use scripts** - They crash Claude Code on Windows.

**Use manual commands instead**:

1. Kill old processes: `taskkill //F //IM node.exe`
2. Navigate: `cd teacher-assistant/backend`
3. Start: `VITE_TEST_MODE=true npm start &`
4. Wait: `sleep 10`
5. Verify: `curl http://localhost:3006/api/health`

**OR** run `scripts\restart-backend.bat` in a separate Command Prompt window.
```

---

## 🐛 BUG REPORT FOR CLAUDE CODE

**Issue**: Claude Code Bash tool crashes when executing external .sh script files on Windows

**Environment**:
- OS: Windows 11
- Shell: Git Bash (MINGW64)
- Claude Code: [Version]

**Reproduction**:
1. Create minimal test script: `echo 'echo "test"' > test.sh`
2. Try to execute: `bash test.sh`
3. Result: Claude Code crashes immediately

**Workaround**: Use inline commands or external terminals

---

## ✅ VERIFICATION CHECKLIST

Before running E2E tests, verify:
- [ ] Backend killed: `taskkill //F //IM node.exe` (success or "no process found")
- [ ] Port free: `netstat -ano | findstr ":3006"` (no output)
- [ ] Backend started: PID shown after `npm start &`
- [ ] Backend responding: `curl http://localhost:3006/api/health` (returns JSON)
- [ ] TEST_MODE active: Check log for "TEST MODE" markers

---

## 📚 RELATED DOCUMENTATION

- `docs/troubleshooting/crash-findings.md` - Crash investigation
- `docs/troubleshooting/restart-backend-crash-analysis.md` - Original analysis
- `docs/troubleshooting/windows-bash-crash-patterns.md` - Crash patterns
- `scripts/restart-backend.bat` - Windows batch alternative

---

**Summary**: On Windows with Claude Code, **ALWAYS use inline bash commands or external terminals**. Never try to execute .sh script files through Claude Code's Bash tool.

---

**Last Updated**: 2025-10-27
**Status**: Permanent workaround documented
**Next Action**: Update project docs to reflect this limitation
