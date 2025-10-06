# Backend Fix Verification Script
# Run with: powershell -ExecutionPolicy Bypass -File verify-backend-fixes.ps1

Write-Host "=== Backend Fix Verification ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Profile Name Update
Write-Host "Test 1: Profile Name Update (POST /api/profile/update-name)" -ForegroundColor Yellow
$body1 = @{
    userId = "test-user-123"
    name = "Max Mustermann"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3006/api/profile/update-name" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body1 `
        -ErrorAction Stop

    if ($response1.success -eq $true) {
        Write-Host "✅ PASS - Profile name update successful" -ForegroundColor Green
        Write-Host "   Response: $($response1.data.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL - Success flag is false" -ForegroundColor Red
        Write-Host "   Error: $($response1.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL - Request failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   HTTP Status: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Image Generation
Write-Host "Test 2: Image Generation (POST /api/langgraph/agents/execute)" -ForegroundColor Yellow
$body2 = @{
    agentType = "image-generation"
    parameters = @{
        theme = "ein Apfel"
        style = "realistic"
        educationalLevel = "Grundschule"
    }
    sessionId = "verify-session-001"
} | ConvertTo-Json -Depth 3

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3006/api/langgraph/agents/execute" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body2 `
        -ErrorAction Stop `
        -TimeoutSec 30

    if ($response2.success -eq $true) {
        $hasImageUrl = $null -ne $response2.data.image_url
        $hasLibraryId = $null -ne $response2.data.library_id -and $response2.data.library_id -ne ""
        $hasMessageId = $null -ne $response2.data.message_id -and $response2.data.message_id -ne ""

        if ($hasImageUrl -and $hasLibraryId -and $hasMessageId) {
            Write-Host "✅ PASS - Image generated and saved to database" -ForegroundColor Green
            Write-Host "   Library ID: $($response2.data.library_id)" -ForegroundColor Gray
            Write-Host "   Message ID: $($response2.data.message_id)" -ForegroundColor Gray
        } elseif ($hasImageUrl) {
            Write-Host "⚠️  PARTIAL - Image generated but NOT saved to database" -ForegroundColor DarkYellow
            Write-Host "   Image URL: Present" -ForegroundColor Gray
            Write-Host "   Library ID: $($response2.data.library_id)" -ForegroundColor Red
            Write-Host "   Message ID: $($response2.data.message_id)" -ForegroundColor Red
            Write-Host "   → InstantDB may not be initialized. Restart server!" -ForegroundColor Yellow
        } else {
            Write-Host "❌ FAIL - No image URL in response" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ FAIL - Success flag is false" -ForegroundColor Red
        Write-Host "   Error: $($response2.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL - Request failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Chat Summary
Write-Host "Test 3: Chat Summary (POST /api/chat/summary)" -ForegroundColor Yellow
$body3 = @{
    chatId = "verify-chat-001"
    messages = @(
        @{ role = "user"; content = "Hallo, ich brauche Hilfe" },
        @{ role = "assistant"; content = "Gerne! Wie kann ich dir helfen?" },
        @{ role = "user"; content = "Ich brauche Materialien für Mathe" }
    )
} | ConvertTo-Json -Depth 3

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:3006/api/chat/summary" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body3 `
        -ErrorAction Stop

    if ($response3.success -eq $true -and $response3.data.summary) {
        Write-Host "✅ PASS - Chat summary generated" -ForegroundColor Green
        Write-Host "   Summary: $($response3.data.summary)" -ForegroundColor Gray
        Write-Host "   Length: $($response3.data.summary.Length) characters" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL - No summary in response" -ForegroundColor Red
        Write-Host "   Response: $($response3 | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL - Request failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If Test 1 failed with 503 error → Server needs restart" -ForegroundColor White
Write-Host "2. If Test 2 shows null library_id → Server needs restart" -ForegroundColor White
Write-Host "3. Check server logs for: '[INFO] InstantDB initialized successfully'" -ForegroundColor White
Write-Host ""
Write-Host "To restart the server:" -ForegroundColor Yellow
Write-Host "  Option 1: Stop current process (Ctrl+C in server terminal) and run 'npm run dev'" -ForegroundColor White
Write-Host "  Option 2: Kill process with 'taskkill /F /IM node.exe' and restart" -ForegroundColor White
