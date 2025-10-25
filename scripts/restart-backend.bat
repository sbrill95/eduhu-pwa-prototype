@echo off
REM Restart Backend Script (with TEST_MODE support)
REM Safely restarts backend with VITE_TEST_MODE=true for E2E testing
REM Prevents 429 rate limit errors and infrastructure-related test failures
REM
REM Usage:
REM   scripts\restart-backend.bat           # Start with TEST_MODE (default)
REM   scripts\restart-backend.bat --prod    # Start without TEST_MODE

setlocal enabledelayedexpansion

REM Parse arguments
set TEST_MODE=true
if "%1"=="--prod" set TEST_MODE=false
if "%1"=="--production" set TEST_MODE=false

echo.
if "%TEST_MODE%"=="true" (
    echo [94m🧪 Restarting backend with TEST_MODE enabled...[0m
) else (
    echo [94m🔄 Restarting backend in PRODUCTION mode...[0m
)
echo.

REM Get paths
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set BACKEND_DIR=%PROJECT_ROOT%\teacher-assistant\backend

REM Set log file based on mode
if "%TEST_MODE%"=="true" (
    set LOG_FILE=%BACKEND_DIR%\backend-test-mode.log
) else (
    set LOG_FILE=%BACKEND_DIR%\backend.log
)

REM ==============================================================================
REM STEP 1: Kill Old Processes
REM ==============================================================================
echo [93mStep 1: Stopping existing backend processes[0m
echo ==============================================

echo   Killing all node.exe processes...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [92m✓[0m Killed node.exe processes
) else (
    echo   No node.exe processes found
)

REM Wait for processes to die
timeout /t 2 /nobreak >nul

echo.

REM ==============================================================================
REM STEP 2: Wait for Port to Be Free
REM ==============================================================================
echo [93mStep 2: Verifying port 3006 is free[0m
echo ====================================

set MAX_WAIT=10
set WAITED=0

:CHECK_PORT
netstat -ano | findstr ":3006" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [92m✓ Port 3006 is now free[0m
    goto PORT_FREE
)

set /a WAITED+=1
if %WAITED% lss %MAX_WAIT% (
    echo   Waiting for port to be free... (%WAITED%/%MAX_WAIT%)
    timeout /t 1 /nobreak >nul
    goto CHECK_PORT
)

echo [91m✗ Port 3006 still occupied after %MAX_WAIT%s[0m
echo.
echo Troubleshooting:
echo   • Check processes: netstat -ano ^| findstr :3006
echo   • Kill manually: taskkill /F /PID ^<PID^>
exit /b 1

:PORT_FREE
echo.

REM ==============================================================================
REM STEP 3: Start Backend
REM ==============================================================================
if "%TEST_MODE%"=="true" (
    echo [93mStep 3: Starting backend with TEST_MODE enabled[0m
) else (
    echo [93mStep 3: Starting backend in PRODUCTION mode[0m
)
echo ================================================

REM Navigate to backend directory
if not exist "%BACKEND_DIR%" (
    echo [91m✗ Backend directory not found: %BACKEND_DIR%[0m
    exit /b 1
)

cd /d "%BACKEND_DIR%"
echo   Directory: %CD%

REM Check if npm is available
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [91m✗ npm not found. Please install Node.js[0m
    exit /b 1
)

REM Check if dist directory exists
if not exist "dist" (
    echo [93m⚠ Warning: dist/ directory not found. Running build first...[0m
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [91m✗ Build failed[0m
        exit /b 1
    )
)

REM Display startup configuration
if "%TEST_MODE%"=="true" (
    echo   Setting: VITE_TEST_MODE=true
)
echo   Command: npm start
echo   Logs: %LOG_FILE%
echo.

REM Start backend in background
if "%TEST_MODE%"=="true" (
    set VITE_TEST_MODE=true
    start /B cmd /c "npm start > "%LOG_FILE%" 2>&1"
) else (
    start /B cmd /c "npm start > "%LOG_FILE%" 2>&1"
)

REM Get PID (approximate - last node.exe process)
timeout /t 1 /nobreak >nul
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" ^| findstr "node.exe"') do (
    set BACKEND_PID=%%a
)

if defined BACKEND_PID (
    echo   [92mBackend PID: %BACKEND_PID%[0m
) else (
    echo   [93m⚠ Could not determine PID[0m
)
echo.

REM ==============================================================================
REM STEP 4: Wait for Backend to Be Ready
REM ==============================================================================
echo [93mStep 4: Waiting for backend to be ready[0m
echo ========================================

set MAX_ATTEMPTS=30
set ATTEMPT=0

:WAIT_BACKEND
set /a ATTEMPT+=1

REM Check if backend responds
curl -f -s http://localhost:3006/api/health >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [92m✓ Backend is responding![0m
    echo.
    goto BACKEND_READY
)

REM Show progress every 5 seconds
set /a MOD=ATTEMPT %% 5
if %MOD% equ 0 (
    echo   Waiting... (%ATTEMPT%/%MAX_ATTEMPTS%)
)

if %ATTEMPT% lss %MAX_ATTEMPTS% (
    timeout /t 1 /nobreak >nul
    goto WAIT_BACKEND
)

echo [91m✗ Backend failed to start within %MAX_ATTEMPTS%s[0m
echo.
echo Last 30 lines of logs:
if exist "%LOG_FILE%" (
    powershell -Command "Get-Content '%LOG_FILE%' -Tail 30 | ForEach-Object { Write-Host \"  $_\" }"
) else (
    echo   Log file not found
)
echo.
echo Troubleshooting:
echo   1. Check logs: %LOG_FILE%
echo   2. Check port: netstat -ano ^| findstr :3006
echo   3. Check .env: %BACKEND_DIR%\.env
echo   4. Try manual start: cd teacher-assistant\backend ^&^& npm start
exit /b 1

:BACKEND_READY

REM Get health info
curl -s http://localhost:3006/api/health > "%TEMP%\health.json" 2>nul

echo Backend Info:

REM Extract git commit using PowerShell
for /f "delims=" %%i in ('powershell -Command "$h = Get-Content '%TEMP%\health.json' | ConvertFrom-Json; $h.data.gitCommit.Substring(0,7)"') do set GIT_COMMIT=%%i
if defined GIT_COMMIT (
    echo   Git commit: %GIT_COMMIT%

    REM Get current HEAD
    for /f %%i in ('git rev-parse HEAD') do set CURRENT_COMMIT=%%i
    set CURRENT_COMMIT_SHORT=!CURRENT_COMMIT:~0,7!

    if "!GIT_COMMIT!"=="!CURRENT_COMMIT_SHORT!" (
        echo   [92m✓ Commit matches current HEAD[0m
    ) else (
        echo   [93m⚠ Warning: Commit mismatch (HEAD: !CURRENT_COMMIT_SHORT!)[0m
    )
)

REM Extract InstantDB status
for /f "delims=" %%i in ('powershell -Command "$h = Get-Content '%TEMP%\health.json' | ConvertFrom-Json; $h.data.instantdb"') do set INSTANTDB=%%i
if defined INSTANTDB (
    echo   InstantDB: %INSTANTDB%
)

REM Extract environment
for /f "delims=" %%i in ('powershell -Command "$h = Get-Content '%TEMP%\health.json' | ConvertFrom-Json; $h.data.environment"') do set ENVIRONMENT=%%i
if defined ENVIRONMENT (
    echo   Environment: %ENVIRONMENT%
)

del "%TEMP%\health.json" >nul 2>&1

echo.

REM ==============================================================================
REM STEP 5: Verify Configuration (TEST_MODE only)
REM ==============================================================================
if "%TEST_MODE%"=="true" (
    echo [93mStep 5: Verifying TEST_MODE is active[0m
    echo ======================================

    REM Wait for logs to flush
    timeout /t 2 /nobreak >nul

    REM Check logs for TEST_MODE indicators
    findstr /C:"TEST MODE" "%LOG_FILE%" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [92m✓ TEST_MODE is active (confirmed in logs)[0m
        echo.
        echo Test Mode Indicators:
        findstr /C:"TEST MODE" /C:"🧪" /C:"bypassed" /C:"mock" "%LOG_FILE%" | powershell -Command "$input | Select-Object -Last 5 | ForEach-Object { Write-Host \"  $_\" }"
    ) else (
        findstr /C:"VITE_TEST_MODE" "%LOG_FILE%" >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            echo [92m✓ TEST_MODE environment variable detected[0m
        ) else (
            echo [93m⚠ Warning: Cannot confirm TEST_MODE in logs[0m
            echo   The backend may not be in test mode
            echo   Gemini API calls may hit real API (rate limits!)
            echo.
            echo   Check logs manually: type %LOG_FILE%
        )
    )

    echo.
)

REM ==============================================================================
REM SUCCESS SUMMARY
REM ==============================================================================
echo ========================================
if "%TEST_MODE%"=="true" (
    echo [92m✓ Backend restart with TEST_MODE complete![0m
) else (
    echo [92m✓ Backend restart complete![0m
)
echo.
echo Summary:
echo   • Backend running on: http://localhost:3006
if defined BACKEND_PID (
    echo   • Process ID: %BACKEND_PID%
)
if "%TEST_MODE%"=="true" (
    echo   • Test Mode: [92mENABLED[0m
    echo   • Gemini API: [92mMOCKED (no rate limits)[0m
) else (
    echo   • Test Mode: [93mDISABLED[0m
    echo   • Gemini API: [93mREAL (rate limits apply)[0m
)
echo   • Logs: %LOG_FILE%
echo.

if "%TEST_MODE%"=="true" (
    echo [92mReady to run E2E tests![0m
    echo.
    echo Next steps:
    echo   cd teacher-assistant\frontend
    echo   npx playwright test
) else (
    echo Backend is running in production mode.
    echo To enable TEST_MODE: scripts\restart-backend.bat
)

echo.
exit /b 0
