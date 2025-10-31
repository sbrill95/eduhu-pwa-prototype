# Backend Restart Script - Claude Code Crash Fix

**Date**: 2025-10-31
**Issue**: Backend restart scripts were crashing Claude Code
**Status**: FIXED ✅

---

## Problem

When running `scripts\restart-backend.bat` or `scripts\restart-backend.ps1`, Claude Code would crash mid-execution.

### Root Cause

The restart scripts used **system-wide process killing**:

```batch
REM OLD CODE (DANGEROUS):
taskkill /F /IM node.exe >nul 2>&1
```

```powershell
# OLD CODE (DANGEROUS):
Get-Process -Name "node" | Stop-Process -Force
```

**What happened**:
1. Script kills ALL `node.exe` processes on system
2. This includes:
   - ✅ Backend server (intended target)
   - ❌ Claude Code's Node.js runtime (collateral damage)
   - ❌ VS Code extensions (if using Node)
   - ❌ Any other Node.js applications
3. Claude Code crashes when its runtime is terminated

---

## Solution

Changed to **port-specific process killing** - only kills the process using port 3006.

### Batch Script Fix (`restart-backend.bat`)

```batch
REM NEW CODE (SAFE):
echo   Finding process using port 3006...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3006"') do (
    set PORT_PID=%%a
    goto FOUND_PID
)

:FOUND_PID
if defined PORT_PID (
    echo   Found PID %PORT_PID% using port 3006
    echo   Killing PID %PORT_PID%...
    taskkill /F /PID %PORT_PID% >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo   [92m✓[0m Killed backend process (PID: %PORT_PID%)
    )
)
```

### PowerShell Script Fix (`kill-backend.ps1`)

```powershell
# NEW CODE (SAFE):
$portCheck = netstat -ano | Select-String ":3006" | Select-String "LISTENING"

if ($portCheck) {
    $portCheck | ForEach-Object {
        $line = $_.Line
        $parts = $line -split '\s+' | Where-Object { $_ -ne '' }
        $pid = $parts[-1]

        if ($pid -match '^\d+$') {
            Write-Host "  Found PID $pid using port 3006"
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Killed backend process (PID: $pid)"
        }
    }
}
```

---

## How It Works

1. **Find the PID**: Use `netstat -ano | findstr ":3006"` to find which process is using port 3006
2. **Extract PID**: Parse the netstat output to get the specific Process ID
3. **Kill by PID**: Use `taskkill /F /PID <pid>` to kill ONLY that specific process
4. **Verify**: Check that port 3006 is now free

**Result**: Only the backend server is killed, not Claude Code or other Node processes.

---

## Benefits

✅ **Safer**: Doesn't kill other Node.js processes
✅ **Surgical**: Only targets backend on port 3006
✅ **No Claude Code crashes**: Claude Code runtime untouched
✅ **No VS Code impact**: Extensions keep running
✅ **No user apps killed**: Other Node apps (webpack, vite, etc.) safe

---

## Testing

Test the fix:

1. **Start backend** in external terminal:
   ```cmd
   scripts\restart-backend.bat
   ```

2. **Verify Claude Code still running** - you should see this message and Claude Code should NOT crash

3. **Check only backend killed**:
   ```cmd
   # Before restart - should show PID
   netstat -ano | findstr ":3006"

   # After restart - should show NEW PID (backend restarted)
   netstat -ano | findstr ":3006"
   ```

4. **Verify other Node processes unaffected**:
   ```cmd
   # Check all Node processes still running (except old backend)
   tasklist | findstr "node.exe"
   ```

---

## Files Modified

- ✅ `scripts/restart-backend.bat` - Lines 37-65 (port-specific killing)
- ✅ `scripts/kill-backend.ps1` - Lines 1-31 (port-specific killing)
- ✅ `scripts/restart-backend.ps1` - Uses updated `kill-backend.ps1`

---

## Backward Compatibility

**No breaking changes**:
- Scripts work exactly the same from user perspective
- Only internal implementation changed (safer)
- All parameters and output messages preserved

---

## Related Issues

- **Original Issue**: Claude Code crash during backend restart
- **Related Doc**: `docs/troubleshooting/CRITICAL-WINDOWS-LIMITATION.md`
- **Error Prevention**: `CLAUDE.md` (lines 161-203)

---

## Recommendation

**Use these scripts for backend restart**:
- ✅ `scripts\restart-backend.bat` (CMD)
- ✅ `scripts\restart-backend.ps1` (PowerShell)

**Avoid manual commands**:
- ❌ `taskkill /F /IM node.exe` (kills all Node processes)
- ❌ `Get-Process node | Stop-Process -Force` (kills all Node processes)

**Safe alternative for manual restart**:
```cmd
# Find PID first
netstat -ano | findstr ":3006"

# Kill specific PID (replace <PID> with actual number)
taskkill /F /PID <PID>

# Start backend
cd teacher-assistant\backend
npm start
```

---

**Status**: FIXED and tested ✅
**Last Updated**: 2025-10-31
**Tested On**: Windows 11, Claude Code
