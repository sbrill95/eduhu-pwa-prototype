# Restart Backend Script (PowerShell)
# Safely restarts backend with latest code
# Ensures clean startup without port conflicts

Write-Host "🔄 Restarting backend..." -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# 1. Kill old processes
Write-Host "Step 1: Killing old backend processes" -ForegroundColor Yellow
$killScriptPath = Join-Path $scriptDir "kill-backend.ps1"

if (Test-Path $killScriptPath) {
    & $killScriptPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to kill old processes" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  kill-backend.ps1 not found, trying manual kill..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
}

Write-Host ""

# 2. Navigate to backend directory
$backendDir = Join-Path $projectRoot "teacher-assistant\backend"

if (-not (Test-Path $backendDir)) {
    Write-Host "❌ Backend directory not found: $backendDir" -ForegroundColor Red
    exit 1
}

Set-Location $backendDir

# 3. Start backend (background)
Write-Host "Step 2: Starting backend..." -ForegroundColor Yellow
Write-Host "  Directory: $(Get-Location)" -ForegroundColor Gray

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Start backend in background
Write-Host "  Starting 'npm start' in background..." -ForegroundColor Gray
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm start
} -ArgumentList $backendDir

Write-Host "  Backend Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host ""

# 4. Wait for backend to be ready
Write-Host "Step 3: Waiting for backend to be ready..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++

    # Check if job is still running
    $jobState = (Get-Job -Id $backendJob.Id).State
    if ($jobState -eq "Failed" -or $jobState -eq "Stopped") {
        Write-Host "❌ Backend process died" -ForegroundColor Red
        Write-Host "  Job State: $jobState" -ForegroundColor Yellow
        Write-Host "  Check logs: teacher-assistant\backend\nul" -ForegroundColor Yellow

        # Show job output
        $jobOutput = Receive-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
        if ($jobOutput) {
            Write-Host ""
            Write-Host "Job Output:" -ForegroundColor Yellow
            Write-Host $jobOutput -ForegroundColor Gray
        }

        Remove-Job -Id $backendJob.Id -Force
        exit 1
    }

    # Check if backend responds
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3006/api/health" -Method GET -TimeoutSec 2 -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend ready!" -ForegroundColor Green
            Write-Host ""

            # Show version info
            try {
                $healthData = Invoke-RestMethod -Uri "http://localhost:3006/api/health" -Method GET -ErrorAction Stop
                Write-Host "Backend Info:" -ForegroundColor Cyan
                Write-Host "  Status: $($healthData.status)" -ForegroundColor Gray
                Write-Host "  InstantDB: $($healthData.instantdb)" -ForegroundColor Gray
                if ($healthData.gitCommit) {
                    Write-Host "  Git Commit: $($healthData.gitCommit.Substring(0,7))" -ForegroundColor Gray
                }
            } catch {
                Write-Host "  (Could not fetch detailed info)" -ForegroundColor Gray
            }

            Write-Host ""
            Write-Host "✅ Backend restart complete" -ForegroundColor Green
            Write-Host ""
            Write-Host "NOTE: Backend is running in background job $($backendJob.Id)" -ForegroundColor Yellow
            Write-Host "      Use 'Get-Job' to check status" -ForegroundColor Gray
            Write-Host "      Use 'Stop-Job -Id $($backendJob.Id)' to stop" -ForegroundColor Gray
            exit 0
        }
    } catch {
        # Backend not ready yet, continue waiting
    }

    # Show progress
    if ($attempt % 5 -eq 0) {
        Write-Host "  Waiting... ($attempt/$maxAttempts)" -ForegroundColor Gray
    }

    Start-Sleep -Seconds 1
}

# Timeout
Write-Host "❌ Backend failed to start within 30 seconds" -ForegroundColor Red
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  1. Check job status: Get-Job -Id $($backendJob.Id)" -ForegroundColor Gray
Write-Host "  2. Check job output: Receive-Job -Id $($backendJob.Id)" -ForegroundColor Gray
Write-Host "  3. Check port 3006: netstat -ano | Select-String ':3006'" -ForegroundColor Gray
Write-Host "  4. Check .env file exists and has correct values" -ForegroundColor Gray
Write-Host "  5. Try manual start: cd teacher-assistant\backend && npm start" -ForegroundColor Gray

Remove-Job -Id $backendJob.Id -Force
exit 1
