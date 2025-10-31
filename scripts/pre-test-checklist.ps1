# Pre-Test Checklist Script (PowerShell)
# Verifies all prerequisites before running E2E tests
# Prevents 80% of common test failures by catching infrastructure issues early

Write-Host "🚀 Pre-Test Checklist" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Track failures
$failures = 0

# 1. Verify Backend Running
Write-Host "✓ Backend running... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host "  Backend returned status: $($response.StatusCode)" -ForegroundColor Yellow
        $failures++
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host "  Backend not responding on port 3006" -ForegroundColor Yellow
    Write-Host "  ACTION: Start backend with 'cd teacher-assistant\backend && npm start'" -ForegroundColor Yellow
    $failures++
}

# 2. Verify Backend Version (if backend is running)
if ($failures -eq 0) {
    Write-Host "✓ Backend version... " -NoNewline

    try {
        $healthData = Invoke-RestMethod -Uri "http://localhost:3006/api/health" -Method GET -ErrorAction Stop
        $backendCommit = $healthData.gitCommit
        $currentCommit = (git rev-parse HEAD 2>$null)

        if (-not $backendCommit) {
            Write-Host "SKIP (backend does not return version)" -ForegroundColor Yellow
            Write-Host "  RECOMMENDATION: Add gitCommit to /api/health endpoint" -ForegroundColor Gray
        } elseif ($backendCommit -ne $currentCommit) {
            Write-Host "❌ FAIL" -ForegroundColor Red
            Write-Host "  Backend version: $($backendCommit.Substring(0,7))" -ForegroundColor Yellow
            Write-Host "  Current version: $($currentCommit.Substring(0,7))" -ForegroundColor Yellow
            Write-Host "  ACTION: Restart backend with 'bash scripts/restart-backend.sh'" -ForegroundColor Yellow
            $failures++
        } else {
            Write-Host "✅ PASS ($($backendCommit.Substring(0,7)))" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  SKIP (could not verify version)" -ForegroundColor Yellow
    }
}

# 3. Verify InstantDB Initialized
if ($failures -eq 0) {
    Write-Host "✓ InstantDB initialized... " -NoNewline

    try {
        $healthData = Invoke-RestMethod -Uri "http://localhost:3006/api/health" -Method GET -ErrorAction Stop
        $instantdbStatus = $healthData.instantdb

        if (-not $instantdbStatus) {
            Write-Host "SKIP (backend does not return InstantDB status)" -ForegroundColor Yellow
        } elseif ($instantdbStatus -ne "connected") {
            Write-Host "❌ FAIL" -ForegroundColor Red
            Write-Host "  InstantDB status: $instantdbStatus" -ForegroundColor Yellow
            Write-Host "  ACTION: Check InstantDB credentials in .env" -ForegroundColor Yellow
            $failures++
        } else {
            Write-Host "✅ PASS" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  SKIP (could not verify InstantDB)" -ForegroundColor Yellow
    }
}

# 4. Verify Test Mode Environment Variable
Write-Host "✓ VITE_TEST_MODE set... " -NoNewline
if ($env:VITE_TEST_MODE) {
    Write-Host "✅ PASS" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING (not set)" -ForegroundColor Yellow
    Write-Host "  RECOMMENDATION: Set environment variable VITE_TEST_MODE=true" -ForegroundColor Gray
    Write-Host "  Tests may hit login screens without this" -ForegroundColor Gray
}

# 5. Verify Port 3006 Listening
Write-Host "✓ Port 3006 listening... " -NoNewline
$portCheck = netstat -ano | Select-String ":3006" | Select-String "LISTENING"
if ($portCheck) {
    Write-Host "✅ PASS" -ForegroundColor Green
} else {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host "  Backend not listening on port 3006" -ForegroundColor Yellow
    Write-Host "  ACTION: Start backend" -ForegroundColor Yellow
    $failures++
}

# 6. Cleanup Stale Test Data (optional, non-blocking)
if ($failures -eq 0) {
    Write-Host "✓ Cleaning stale test data... " -NoNewline
    try {
        $cleanupResponse = Invoke-WebRequest -Uri "http://localhost:3006/api/test/cleanup-all" -Method POST -TimeoutSec 5 -ErrorAction Stop
        if ($cleanupResponse.StatusCode -eq 200) {
            Write-Host "✅ DONE" -ForegroundColor Green
        } else {
            Write-Host "⚠️  SKIP (endpoint returned $($cleanupResponse.StatusCode))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  SKIP (endpoint not available)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "====================" -ForegroundColor Cyan

# Final verdict
if ($failures -eq 0) {
    Write-Host "✅ All checks passed! Ready to run tests." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $failures check(s) failed. Fix issues before running tests." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  - Backend not running: bash scripts/restart-backend.sh" -ForegroundColor Gray
    Write-Host "  - Port conflict: bash scripts/kill-backend.sh" -ForegroundColor Gray
    Write-Host "  - Version mismatch: Restart backend after git pull/commit" -ForegroundColor Gray
    exit 1
}
