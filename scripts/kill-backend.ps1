# Kill Backend Script (PowerShell) - PORT-SPECIFIC (Safer)
# Kills ONLY the process using port 3006 (not all Node.js processes)
# Prevents "EADDRINUSE" port conflict errors while protecting other Node processes

Write-Host "🔪 Killing backend process on port 3006..." -ForegroundColor Cyan
Write-Host ""

# Find and kill process using port 3006 (PORT-SPECIFIC - Safer)
Write-Host "Finding process using port 3006..." -ForegroundColor Yellow

$portCheck = netstat -ano | Select-String ":3006" | Select-String "LISTENING"

if ($portCheck) {
    $portCheck | ForEach-Object {
        $line = $_.Line
        $parts = $line -split '\s+' | Where-Object { $_ -ne '' }
        $pid = $parts[-1]

        if ($pid -match '^\d+$') {
            Write-Host "  Found PID $pid using port 3006" -ForegroundColor Gray
            Write-Host "  Killing PID: $pid" -ForegroundColor Gray
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Killed backend process (PID: $pid)" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  No process found using port 3006" -ForegroundColor Gray
}

# Wait for process to die
Start-Sleep -Seconds 2

# Check if port 3006 is free
Write-Host ""
Write-Host "Checking port 3006..." -ForegroundColor Yellow

$portCheck = netstat -ano | Select-String ":3006" | Select-String "LISTENING"

if ($portCheck) {
    Write-Host "⚠️  Port 3006 still in use!" -ForegroundColor Red
    Write-Host ""

    # Extract PID and kill it
    $portCheck | ForEach-Object {
        $line = $_.Line
        $parts = $line -split '\s+' | Where-Object { $_ -ne '' }
        $pid = $parts[-1]

        if ($pid -match '^\d+$') {
            Write-Host "  Killing PID holding port 3006: $pid" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }

    # Wait and recheck
    Start-Sleep -Seconds 1
    $recheckPort = netstat -ano | Select-String ":3006" | Select-String "LISTENING"

    if ($recheckPort) {
        Write-Host "❌ Port 3006 still occupied after force kill" -ForegroundColor Red
        Write-Host "  Manual action required" -ForegroundColor Yellow
        exit 1
    }
}

# Final verification
Write-Host ""
Write-Host "====================" -ForegroundColor Cyan

$finalCheck = netstat -ano | Select-String ":3006" | Select-String "LISTENING"
if ($finalCheck) {
    Write-Host "❌ Port 3006 still occupied" -ForegroundColor Red
    Write-Host "  Manual action required" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Port 3006 is free" -ForegroundColor Green
}

Write-Host "✅ Cleanup complete" -ForegroundColor Green
exit 0
