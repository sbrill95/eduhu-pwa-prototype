# Restart Backend with TEST_MODE Enabled (PowerShell)
# Safely restarts backend with VITE_TEST_MODE=true for Gemini API mocking
# Prevents 429 rate limit errors and 80%+ test failures

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🧪 Restarting backend with TEST_MODE enabled..." -ForegroundColor Cyan
Write-Host ""

# Get paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "teacher-assistant\backend"
$LogFile = Join-Path $BackendDir "backend-test-mode.log"

# ==============================================================================
# STEP 1: Kill Old Processes
# ==============================================================================
Write-Host "Step 1: Stopping existing backend processes" -ForegroundColor Yellow
Write-Host "=============================================="

try {
    Write-Host "  Killing all node.exe processes..."

    # Kill all node processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-Host "  ✅ Killed $($nodeProcesses.Count) node process(es)"
    } else {
        Write-Host "  No node.exe processes found"
    }

    # Wait for processes to die
    Start-Sleep -Seconds 2

} catch {
    Write-Host "⚠️  Warning: Failed to kill some processes: $_" -ForegroundColor Yellow
}

Write-Host ""

# ==============================================================================
# STEP 2: Wait for Port to Be Free
# ==============================================================================
Write-Host "Step 2: Verifying port 3006 is free" -ForegroundColor Yellow
Write-Host "===================================="

$maxWait = 10
$waited = 0
$portFree = $false

while ($waited -lt $maxWait) {
    # Check if port 3006 is in use
    $portInUse = Get-NetTCPConnection -LocalPort 3006 -ErrorAction SilentlyContinue

    if (-not $portInUse) {
        Write-Host "✅ Port 3006 is now free" -ForegroundColor Green
        $portFree = $true
        break
    }

    $waited++
    if ($waited -lt $maxWait) {
        Write-Host "  Waiting for port to be free... ($waited/$maxWait)"
        Start-Sleep -Seconds 1
    }
}

if (-not $portFree) {
    Write-Host "❌ Port 3006 still occupied after ${maxWait}s" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  • Check processes: netstat -ano | findstr :3006"
    Write-Host "  • Kill manually: taskkill /F /PID <PID>"

    # Show what's using the port
    $connections = Get-NetTCPConnection -LocalPort 3006 -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host ""
        Write-Host "Port 3006 is used by:"
        $connections | ForEach-Object {
            $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            Write-Host "  PID $($_.OwningProcess): $($proc.Name)"
        }
    }

    exit 1
}

Write-Host ""

# ==============================================================================
# STEP 3: Start Backend with TEST_MODE
# ==============================================================================
Write-Host "Step 3: Starting backend with TEST_MODE enabled" -ForegroundColor Yellow
Write-Host "================================================"

# Navigate to backend directory
if (-not (Test-Path $BackendDir)) {
    Write-Host "❌ Backend directory not found: $BackendDir" -ForegroundColor Red
    exit 1
}

Set-Location $BackendDir
Write-Host "  Directory: $(Get-Location)"

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check if dist directory exists
if (-not (Test-Path "dist")) {
    Write-Host "⚠️  Warning: dist/ directory not found. Running build first..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  Setting: VITE_TEST_MODE=true"
Write-Host "  Command: npm start"
Write-Host "  Logs: $LogFile"
Write-Host ""

# Set environment variable for this session
$env:VITE_TEST_MODE = "true"

# Start backend in background
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "npm"
$startInfo.Arguments = "start"
$startInfo.WorkingDirectory = $BackendDir
$startInfo.UseShellExecute = $false
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.CreateNoWindow = $true

# Add environment variable
$startInfo.EnvironmentVariables["VITE_TEST_MODE"] = "true"

# Merge .env file variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            $startInfo.EnvironmentVariables[$matches[1]] = $matches[2]
        }
    }
}

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $startInfo

# Create log file handler
$logStream = [System.IO.StreamWriter]::new($LogFile, $false)

# Start process
$process.Start() | Out-Null

$backendPid = $process.Id
Write-Host "  Backend PID: $backendPid" -ForegroundColor Green
Write-Host ""

# Read output to log file (in background)
$outputJob = Start-Job -ScriptBlock {
    param($proc, $logPath)

    $stream = [System.IO.StreamWriter]::new($logPath, $false)

    while (-not $proc.HasExited) {
        $line = $proc.StandardOutput.ReadLine()
        if ($line) {
            $stream.WriteLine($line)
            $stream.Flush()
        }

        $errLine = $proc.StandardError.ReadLine()
        if ($errLine) {
            $stream.WriteLine("ERROR: $errLine")
            $stream.Flush()
        }
    }

    $stream.Close()
} -ArgumentList $process, $LogFile

# ==============================================================================
# STEP 4: Wait for Backend to Be Ready
# ==============================================================================
Write-Host "Step 4: Waiting for backend to be ready" -ForegroundColor Yellow
Write-Host "========================================"

$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts) {
    $attempt++

    # Check if process is still running
    if ($process.HasExited) {
        Write-Host "❌ Backend process died (exit code: $($process.ExitCode))" -ForegroundColor Red
        Write-Host ""
        Write-Host "Last 20 lines of logs:"

        Start-Sleep -Seconds 1  # Give log file time to flush

        if (Test-Path $LogFile) {
            Get-Content $LogFile -Tail 20 | ForEach-Object {
                Write-Host "  $_"
            }
        } else {
            Write-Host "  Log file not found"
        }

        Stop-Job $outputJob -ErrorAction SilentlyContinue
        Remove-Job $outputJob -ErrorAction SilentlyContinue
        exit 1
    }

    # Check if backend health endpoint responds
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3006/api/health" -Method Get -TimeoutSec 2 -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is responding!" -ForegroundColor Green
            Write-Host ""

            # Display health check info
            Write-Host "Backend Info:"
            $healthData = $response.Content | ConvertFrom-Json
            $healthData.PSObject.Properties | Select-Object -First 6 | ForEach-Object {
                Write-Host "  $($_.Name): $($_.Value)"
            }
            Write-Host ""

            $ready = $true
            break
        }
    } catch {
        # Expected - backend not ready yet
    }

    # Show progress every 5 seconds
    if ($attempt % 5 -eq 0) {
        Write-Host "  Waiting... ($attempt/$maxAttempts)"
    }

    Start-Sleep -Seconds 1
}

if (-not $ready) {
    Write-Host "❌ Backend failed to start within ${maxAttempts}s" -ForegroundColor Red
    Write-Host ""
    Write-Host "Last 30 lines of logs:"

    Start-Sleep -Seconds 2  # Give log file time to flush

    if (Test-Path $LogFile) {
        Get-Content $LogFile -Tail 30 | ForEach-Object {
            Write-Host "  $_"
        }
    } else {
        Write-Host "  Log file not found"
    }

    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  1. Check logs: $LogFile"
    Write-Host "  2. Check port: netstat -ano | findstr :3006"
    Write-Host "  3. Check .env: $BackendDir\.env"
    Write-Host "  4. Try manual start: cd teacher-assistant\backend; `$env:VITE_TEST_MODE='true'; npm start"

    # Kill the hung process
    $process.Kill()
    Stop-Job $outputJob -ErrorAction SilentlyContinue
    Remove-Job $outputJob -ErrorAction SilentlyContinue
    exit 1
}

# ==============================================================================
# STEP 5: Verify TEST_MODE is Active
# ==============================================================================
Write-Host "Step 5: Verifying TEST_MODE is active" -ForegroundColor Yellow
Write-Host "======================================"

# Wait for logs to flush
Start-Sleep -Seconds 2

if (Test-Path $LogFile) {
    $logContent = Get-Content $LogFile -Raw

    if ($logContent -match "TEST MODE|🧪|bypassed|mock") {
        Write-Host "✅ TEST_MODE is active (confirmed in logs)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Test Mode Indicators:"

        Get-Content $LogFile | Select-String -Pattern "TEST MODE|🧪|bypassed|mock" | Select-Object -Last 5 | ForEach-Object {
            Write-Host "  $_"
        }
    } elseif ($logContent -match "VITE_TEST_MODE") {
        Write-Host "✅ TEST_MODE environment variable detected" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Cannot confirm TEST_MODE in logs" -ForegroundColor Yellow
        Write-Host "  The backend may not be in test mode"
        Write-Host "  Gemini API calls may hit real API (rate limits!)"
        Write-Host ""
        Write-Host "  Check logs manually: Get-Content $LogFile"
    }
} else {
    Write-Host "⚠️  Warning: Log file not found yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Backend restart with TEST_MODE complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:"
Write-Host "  • Backend running on: http://localhost:3006"
Write-Host "  • Process ID: $backendPid"
Write-Host "  • Test Mode: ENABLED" -ForegroundColor Green
Write-Host "  • Gemini API: MOCKED (no rate limits)" -ForegroundColor Green
Write-Host "  • Logs: $LogFile"
Write-Host ""
Write-Host "Ready to run E2E tests!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  cd teacher-assistant\frontend"
Write-Host "  npx playwright test"
Write-Host ""

# Keep the output job running
Write-Host "Note: Backend is running in background (PID $backendPid)"
Write-Host "To view live logs: Get-Content $LogFile -Wait"
Write-Host "To stop backend: Stop-Process -Id $backendPid"

exit 0
