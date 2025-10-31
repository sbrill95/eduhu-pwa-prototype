# Scripts Directory

**Environment**: Windows 11 + Claude Code
**Last Updated**: 2025-10-31

---

## ✅ SAFE SCRIPTS (Use These)

### Backend Restart

**Option 1: Windows Batch File** (Recommended for CMD)
```cmd
# Run in Command Prompt:
scripts\restart-backend.bat
```

**Option 2: PowerShell Script** (Recommended for PowerShell)
```powershell
# Run in PowerShell:
.\scripts\restart-backend.ps1
```

**Features**:
- Kills old node processes
- Verifies port 3006 is free
- Starts backend with TEST_MODE
- Waits for health check
- Shows backend info

---

## ⚠️ USE WITH CAUTION

These bash scripts **might work** but could crash Claude Code:

- `kill-backend.sh` - Kills node processes (try `taskkill //F //IM node.exe` instead)
- `pre-test-checklist.sh` - Validates test prerequisites (may crash, use manual checks)
- `validate-test-helpers.sh` - Tests helper endpoints

**If you need these**: Run them in an **external Git Bash terminal**, NOT through Claude Code.

---

## 🗃️ ARCHIVED SCRIPTS

The folder `archived-sh-scripts-UNSAFE/` contains:
- Original bash restart scripts (crash Claude Code)
- Test diagnostic scripts
- Investigation artifacts

See `archived-sh-scripts-UNSAFE/README.md` for details.

**DO NOT execute anything from the archive folder through Claude Code!**

---

## 📋 Quick Reference

### Restart Backend
```cmd
# CMD:
scripts\restart-backend.bat

# PowerShell:
.\scripts\restart-backend.ps1
```

### Check Backend Status
```bash
# Safe through Claude Code:
curl http://localhost:3006/api/health
```

### Kill Backend
```bash
# Safe through Claude Code:
taskkill //F //IM node.exe
```

### Check Port Usage
```bash
# Safe through Claude Code:
netstat -ano | findstr ":3006"
```

### View Backend Logs
```bash
# Safe through Claude Code:
cat teacher-assistant/backend/backend-test-mode.log
```

---

## 🚫 What NOT to Do

### ❌ Do NOT Execute .sh Scripts Through Claude Code:
```bash
# These will CRASH Claude Code:
bash scripts/restart-backend.sh
bash scripts/any-script.sh
./any-script.sh
```

### ❌ Do NOT Try to Run .bat Through Bash:
```bash
# This won't work properly:
cmd /c scripts\restart-backend.bat
```

---

## ✅ What TO Do

### 1. Restart Backend (External Terminal)
- Open separate CMD or PowerShell window
- Run the appropriate restart script
- Return to Claude Code

### 2. Use Inline Commands (Through Claude Code)
- Simple commands work: `curl`, `ls`, `cat`, `taskkill`
- No script execution needed

### 3. Verify Before Testing
- Always restart backend before E2E tests
- Check health endpoint to confirm it's running
- Run pre-flight checks manually if needed

---

## 📚 Documentation

For detailed information, see:
- `docs/troubleshooting/SOLUTION-SUMMARY.md` - Quick start guide
- `docs/troubleshooting/CRITICAL-WINDOWS-LIMITATION.md` - Windows limitations explained
- `docs/CLAUDE.md` - Error Prevention System (lines 84-194)

---

## 🎯 The Bottom Line

**On Windows with Claude Code**:
1. ✅ Use `.bat` or `.ps1` scripts for backend restart
2. ✅ Run them in external terminal (CMD or PowerShell)
3. ❌ Never execute `.sh` scripts through Claude Code
4. ✅ Use inline commands for simple checks

**That's it!** Everything else works normally.
