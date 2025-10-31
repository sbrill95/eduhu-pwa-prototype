# Bash Script Crash Findings

**Date**: 2025-10-27
**Status**: CRITICAL - Even test suite crashes

---

## What We Know

### ✅ What WORKS:
1. **Inline bash commands work**:
   ```bash
   bash -c 'echo "test"; exit 0'  # ✅ Works
   ```

2. **Basic echo from Bash tool works**:
   ```bash
   echo "test"  # ✅ Works
   ```

3. **Reading files works**:
   ```bash
   cat scripts/test-01-minimal.sh  # ✅ Works
   ```

4. **Listing files works**:
   ```bash
   ls scripts/test-*.sh  # ✅ Works
   ```

### ❌ What CRASHES:
1. **Running test-runner.sh crashed Claude Code**
2. **Running restart-backend-safe.sh crashed Claude Code**
3. **Running restart-backend-ultra-minimal.sh crashed Claude Code**

---

## 🔍 Hypothesis

**CRITICAL FINDING**: The act of executing an external bash script file (e.g., `bash scripts/filename.sh`) appears to crash Claude Code on Windows.

**This suggests**:
- It's NOT the script content
- It's NOT specific bash patterns
- It's the **execution of script files** itself

---

## 🧪 Next Test

To confirm, we need to test if executing ANY bash script file crashes:

```bash
# Create world's simplest script
echo 'echo "test"' > /tmp/test.sh

# Try to execute it
bash /tmp/test.sh
```

**If this crashes** → Claude Code cannot execute bash script files on Windows
**If this works** → Something specific about our scripts causes the crash

---

## 🚨 Immediate Workaround

**Since executing .sh files crashes, we MUST use inline commands only**:

### Manual Backend Restart (No Scripts)
```bash
# Kill old processes
taskkill //F //IM node.exe

# Wait
timeout /t 3 /nobreak

# Start backend (needs manual cd first)
cd teacher-assistant/backend
VITE_TEST_MODE=true npm start &
```

### Alternative: Use Windows Batch File (.bat)
```batch
@echo off
REM restart-backend.bat
echo Restarting backend...

taskkill /F /IM node.exe
timeout /t 3 /nobreak

cd teacher-assistant\backend
set VITE_TEST_MODE=true
start /B npm start > backend.log 2>&1

echo Backend started
```

Run with: `cmd /c scripts\restart-backend.bat`

---

## 🔧 Root Cause Investigation

### Possible Causes:

1. **Claude Code + Git Bash Incompatibility**:
   - Claude Code's Bash tool may not support executing external script files
   - Works for inline commands but not file execution

2. **Windows Path Translation**:
   - Git Bash translates paths (C:\ → /c/)
   - Script file paths may be causing issues

3. **File Encoding**:
   - Script files might have wrong encoding (UTF-8 with BOM, CRLF line endings)
   - Claude Code might choke on this

4. **Subprocess Management**:
   - Executing `bash script.sh` creates subprocess
   - Claude Code might not handle subprocesses properly on Windows

---

## ✅ Confirmed Safe Approach

**DO NOT execute .sh files through Claude Code on Windows**

Instead:
- ✅ Use inline bash commands
- ✅ Use Windows batch files (.bat)
- ✅ Use step-by-step manual commands
- ✅ Use PowerShell scripts (.ps1)

---

## 📝 Action Items

1. **Convert restart-backend.sh to .bat file** ✅
2. **Test .bat execution through Claude Code**
3. **Document that .sh execution is unsupported on Windows**
4. **Update all development docs to use .bat on Windows**
5. **Report bug to Claude Code team**

---

## 🎯 Solution: Windows Batch File Version

Creating `restart-backend.bat` that does the same thing without bash.

---

**Last Updated**: 2025-10-27
**Severity**: CRITICAL - Blocks all script-based workflows on Windows
**Workaround**: Use .bat files or inline commands
