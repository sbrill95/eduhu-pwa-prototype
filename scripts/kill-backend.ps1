# Kill Backend Script (PowerShell)
# Kills all Node.js processes and frees port 3006
# Prevents "EADDRINUSE" port conflict errors

Write-Host "🔪 Killing all Node.js backend processes..." -ForegroundColor Cyan
Write-Host ""

# Kill all node.exe processes
Write-Host "Killing node.exe processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "  Killing PID: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  Killed $($nodeProcesses.Count) node.exe process(es)" -ForegroundColor Green
} else {
    Write-Host "  No node.exe processes found" -ForegroundColor Gray
}

# Wait for processes to die
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
