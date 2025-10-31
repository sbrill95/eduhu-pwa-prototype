# Archived Bash Scripts (UNSAFE for Claude Code)

**Date Archived**: 2025-10-31
**Reason**: These scripts crash Claude Code when executed on Windows

---

## ⚠️ WARNING

**DO NOT execute these scripts through Claude Code on Windows!**

All `.sh` (bash) scripts in this folder will **crash Claude Code** if you try to run them using:
- `bash script-name.sh`
- `./script-name.sh`
- Any bash execution command

---

## Why Are These Here?

These scripts were archived because:
1. **Claude Code limitation**: Cannot execute external bash script files on Windows
2. **Diagnostic value**: These scripts were created during crash investigation
3. **Future reference**: May be useful for testing on other systems or with future Claude Code versions

---

## What Should You Use Instead?

### For Backend Restart:

**Use the Windows Batch file** (works perfectly):
```cmd
# In Command Prompt (CMD):
scripts\restart-backend.bat
```

**Or use the PowerShell script**:
```powershell
# In PowerShell:
.\scripts\restart-backend.ps1
```

### For Backend Health Check:

**Use curl directly** (safe through Claude Code):
```bash
curl http://localhost:3006/api/health
```

### For Killing Backend:

**Use taskkill directly** (safe through Claude Code):
```bash
taskkill //F //IM node.exe
```

---

## Scripts in This Archive

### Original Restart Scripts:
- `restart-backend.sh` - Original bash version (crashes)
- `restart-backend-safe.sh` - Simplified version (still crashes)
- `restart-backend-ultra-minimal.sh` - Minimal version (still crashes)

### Test Scripts (Diagnostic):
- `test-01-minimal.sh` - Tests basic bash
- `test-02-variables.sh` - Tests variables
- `test-03-paths.sh` - Tests path operations
- `test-04-kill.sh` - Tests kill-backend.sh call
- `test-05-curl.sh` - Tests curl
- `test-06-background.sh` - Tests background processes
- `test-runner.sh` - Runs all tests
- `debug-restart.sh` - Debug version of restart

---

## Can These Scripts Be Used?

**YES, but ONLY:**
1. **On non-Windows systems** (Linux, macOS) where bash scripts work normally
2. **In external terminals** on Windows (Git Bash, WSL)
3. **For reference** to understand what commands are needed
4. **For future testing** if Claude Code fixes the Windows bash issue

**NO:**
- ❌ Do NOT execute through Claude Code on Windows
- ❌ Do NOT try to "fix" them - it's a Claude Code limitation, not a script problem

---

## Documentation

For full details on the crash investigation and solutions, see:
- `docs/troubleshooting/SOLUTION-SUMMARY.md` - Complete solution guide
- `docs/troubleshooting/CRITICAL-WINDOWS-LIMITATION.md` - Windows limitations
- `docs/troubleshooting/crash-findings.md` - Test results
- `docs/troubleshooting/restart-backend-crash-analysis.md` - Detailed analysis

---

## Safe Scripts (Still in scripts/ folder)

These scripts are SAFE to use:
- ✅ `restart-backend.bat` - Windows batch file (use in CMD)
- ✅ `restart-backend.ps1` - PowerShell script (use in PowerShell)
- ✅ `kill-backend.sh` - *May* work if needed (test carefully)
- ✅ `pre-test-checklist.sh` - *May* work if needed (test carefully)

---

**Summary**: Use `.bat` or `.ps1` scripts for backend restart. Don't touch anything in this archive folder unless testing on a different system.
