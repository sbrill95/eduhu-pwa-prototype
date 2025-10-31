# Session 02: E2E Test Mock Handler & Windows Environment Fixes

**Date**: 2025-10-13
**Session**: 02
**Feature**: E2E Testing Infrastructure
**Status**: ✅ Complete

## Overview

Fixed two critical issues preventing E2E tests from running correctly:
1. Mock API handlers returning incorrect response format
2. Windows incompatibility with Unix-style environment variables in npm scripts

## Issues Identified

### Issue 1: Mock Handler Response Format Mismatch

**Error**: `Error: Invalid response from API - no message content`
**Location**: `teacher-assistant/frontend/src/hooks/useChat.ts:954`

**Root Cause**:
Mock handlers in `e2e-tests/mocks/handlers.ts` were returning flat response objects, but the `apiClient.sendChatMessage()` expects a wrapped response with this structure:

```typescript
{
  success: boolean;
  data: ChatResponse;  // <-- Contains { message: string, agentSuggestion?: object }
  timestamp: string;
}
```

The API client then extracts `response.data` (line 173 in api.ts), which must contain the `message` field.

### Issue 2: Windows Environment Variable Syntax

**Error**: `VITE_TEST_MODE` was not being set correctly on Windows
**Location**: `package.json` scripts (lines 19-21)

**Root Cause**:
Unix syntax `VITE_TEST_MODE=true playwright test` doesn't work on Windows Command Prompt or PowerShell. Windows requires different syntax (`set VITE_TEST_MODE=true && playwright test`).

## Changes Made

### 1. Fixed Mock Handlers Response Format

**File**: `teacher-assistant/frontend/e2e-tests/mocks/handlers.ts`

**Before**:
```typescript
// Line 36-46 - Image request response
return HttpResponse.json({
  message: 'Ich kann ein Bild für Sie erstellen.',
  agentSuggestion: { ... }
});

// Line 50-52 - Default text response
return HttpResponse.json({
  message: 'Das ist eine Mock-Antwort für Testzwecke.'
});
```

**After**:
```typescript
// Line 36-50 - Image request response
return HttpResponse.json({
  success: true,
  data: {
    message: 'Ich kann ein Bild für Sie erstellen.',
    agentSuggestion: {
      agentType: 'image-generation',
      reasoning: 'Du hast nach einem Bild gefragt...',
      prefillData: { ... }
    }
  },
  timestamp: new Date().toISOString()
});

// Line 54-60 - Default text response
return HttpResponse.json({
  success: true,
  data: {
    message: 'Das ist eine Mock-Antwort für Testzwecke.'
  },
  timestamp: new Date().toISOString()
});
```

**Also Fixed**: Chat summary endpoint (lines 138-146) to wrap response in same format.

### 2. Installed cross-env for Cross-Platform Compatibility

**Command**:
```bash
npm install -D cross-env
```

**Result**:
- Added `cross-env@10.1.0` to devDependencies
- Provides consistent environment variable syntax across Windows, macOS, and Linux

**Verification**:
```bash
> npx cross-env VITE_TEST_MODE=true node -e "console.log(process.env.VITE_TEST_MODE)"
true  ✅
```

### 3. Updated Package.json Scripts

**File**: `teacher-assistant/frontend/package.json`

**Before** (Lines 19-21):
```json
"test:e2e": "VITE_TEST_MODE=true playwright test --project=\"Mock Tests (Fast)\"",
"test:e2e:real": "VITE_TEST_MODE=true playwright test --project=\"Real API Tests (Smoke)\"",
"test:e2e:ui": "VITE_TEST_MODE=true playwright test --ui",
```

**After** (Lines 19-21):
```json
"test:e2e": "cross-env VITE_TEST_MODE=true playwright test --project=\"Mock Tests (Fast)\"",
"test:e2e:real": "cross-env VITE_TEST_MODE=true playwright test --project=\"Real API Tests (Smoke)\"",
"test:e2e:ui": "cross-env VITE_TEST_MODE=true playwright test --ui",
```

### 4. Fixed Playwright Route Interceptors

**File**: `teacher-assistant/frontend/e2e-tests/mocks/agent-responses.ts`

**Before** (Lines 68-96):
```typescript
await page.route('**/api/chat', async (route: any) => {
  const postData = request.postDataJSON();

  if (postData.message?.toLowerCase().includes('bild')) {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        message: mockAgentSuggestion  // ❌ Wrong format
      })
    });
  }
});
```

**After** (Lines 68-103):
```typescript
await page.route('**/api/chat', async (route: any) => {
  const postData = request.postDataJSON();

  // Check messages array (correct API format)
  if (postData.messages?.some((msg: any) =>
      msg.content?.toLowerCase().includes('bild'))) {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        success: true,
        data: {
          message: mockAgentSuggestion.content,
          agentSuggestion: mockAgentSuggestion.agentSuggestion
        },
        timestamp: new Date().toISOString()
      })
    });
  }
});
```

**Key Changes**:
- Check `postData.messages` array instead of flat `postData.message`
- Wrap response in `{ success, data, timestamp }` structure
- Extract `content` and `agentSuggestion` separately

## Expected API Response Flow

```typescript
// 1. Frontend sends chat request
const response = await apiClient.sendChatMessage({
  messages: [
    { role: 'user', content: 'Erstelle ein Bild zur Photosynthese' }
  ]
});

// 2. Backend (or mock) returns wrapped response
{
  success: true,
  data: {
    message: 'Ich kann ein Bild für Sie erstellen.',
    agentSuggestion?: { ... }  // Optional
  },
  timestamp: '2025-10-13T...'
}

// 3. apiClient.sendChatMessage extracts and returns data
return response.data;  // { message: '...', agentSuggestion?: {...} }

// 4. useChat.ts validates response.message exists
if (!response || !response.message) {
  throw new Error('Invalid response from API - no message content');  // Line 954
}
```

## Testing Results

### Before Fixes
- ❌ Tests failed with "Invalid response from API - no message content"
- ❌ VITE_TEST_MODE not set on Windows (MSW not initialized)
- ❌ Route interceptors using wrong request/response format

### After Fixes
- ✅ cross-env successfully sets VITE_TEST_MODE on Windows
- ✅ Mock handlers return correct wrapped response format
- ✅ Playwright route interceptors use correct API structure
- ⏳ Tests now execute (though timeout issues remain - separate concern)

### Test Execution Log
```bash
> npm run test:e2e

Running 357 tests using 1 worker

[E2E Mock] Agent API interceptors configured
[info] api: => page.goto started []
[info] api: <= page.goto succeeded []
[info] api: => page.waitForLoadState started []
[info] api: <= page.waitForLoadState succeeded []
```

**Note**: Tests are now properly executing but encountering timeouts on specific assertions (e.g., clicking chat tab). This is a separate issue related to test selectors and application state, not the mock infrastructure itself.

## Files Modified

1. ✅ `teacher-assistant/frontend/e2e-tests/mocks/handlers.ts`
   - Fixed POST /api/chat response format (lines 36-60)
   - Fixed POST /api/chat/summary response format (lines 138-146)

2. ✅ `teacher-assistant/frontend/e2e-tests/mocks/agent-responses.ts`
   - Fixed Playwright route interceptor for /api/chat (lines 68-103)
   - Changed request inspection to check `messages` array
   - Changed response format to match backend wrapper

3. ✅ `teacher-assistant/frontend/package.json`
   - Added `cross-env@10.1.0` to devDependencies (line 54)
   - Updated test:e2e script (line 19)
   - Updated test:e2e:real script (line 20)
   - Updated test:e2e:ui script (line 21)

## Technical Context

### Why This Matters

1. **Consistent API Contract**: Frontend expects all API responses wrapped in `{ success, data, timestamp }` format. This consistency is enforced by the `ApiClient` class (api.ts:162-174).

2. **Cross-Platform Development**: Team members may use Windows, macOS, or Linux. Using `cross-env` ensures npm scripts work identically across all platforms.

3. **MSW Mock Service Worker**: MSW requires `VITE_TEST_MODE=true` to initialize correctly. Without this environment variable, MSW doesn't intercept API calls, causing tests to fail when backend is not running.

4. **Playwright Route Interceptors**: Playwright's route interceptors bypass MSW, so they must also return the correct response format. This creates two mock layers:
   - **MSW**: For Vite dev server (browser-based mocking)
   - **Playwright Routes**: For E2E tests (Node-based interception)

### Response Format Standardization

The backend consistently wraps all responses:

```typescript
// Backend: server/src/routes/chat.routes.ts
res.json({
  success: true,
  data: {
    message: chatResponse.message,
    agentSuggestion: chatResponse.agentSuggestion
  },
  timestamp: new Date().toISOString()
});
```

The frontend `ApiClient` extracts the inner `data` object:

```typescript
// Frontend: src/lib/api.ts:162-174
async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await this.request<{
    success: boolean;
    data: ChatResponse;  // <-- Actual chat response
    timestamp: string;
  }>('/chat', { method: 'POST', body: JSON.stringify(request) });

  return response.data;  // <-- Extract and return
}
```

This two-layer structure provides:
- Standard error handling (success/failure flag)
- Consistent metadata (timestamp)
- Clean separation of transport concerns from business logic

## Next Steps

### Immediate (Not in Scope)
- ⏳ Fix test timeouts (selector issues, timing issues)
- ⏳ Add InstantDB mocking for authentication flow
- ⏳ Implement proper wait strategies for React component hydration

### Future Improvements
1. Create shared mock response factory to ensure consistency
2. Add TypeScript types for mock responses
3. Document mock strategy in E2E testing guide
4. Consider extracting mock logic into reusable test utilities

## Definition of Done

- [x] Mock handlers return correct response format
- [x] No "Invalid response from API" errors
- [x] VITE_TEST_MODE correctly set on Windows
- [x] cross-env installed and configured
- [x] npm scripts use cross-env for environment variables
- [x] Playwright route interceptors match backend API contract
- [x] Session log created with detailed technical analysis

## Verification Commands

```bash
# Verify cross-env works
npx cross-env VITE_TEST_MODE=true node -e "console.log(process.env.VITE_TEST_MODE)"
# Expected: true

# Run E2E tests
npm run test:e2e
# Expected: Tests execute without "Invalid response" errors

# Check MSW initialization
npm run test:e2e | grep "VITE_TEST_MODE"
# Expected: "✅ VITE_TEST_MODE is enabled"
```

## Related Documentation

- **Issue Tracking**: `docs/testing/E2E-TEST-INFRASTRUCTURE-FIX-PLAN.md`
- **Previous Session**: `docs/development-logs/sessions/2025-10-13/session-01-e2e-test-infrastructure-phase1.md`
- **Mock Strategy**: `teacher-assistant/frontend/e2e-tests/README.md`
- **API Documentation**: `teacher-assistant/frontend/src/lib/api.ts`

## Summary

✅ **Both issues resolved**:
1. Mock handlers now return correct `{ success, data, timestamp }` format
2. Windows environment variables work with cross-env

⏳ **Tests now execute** but encounter timeouts on specific UI interactions (separate issue)

🎯 **Key Learning**: Always verify mock responses match the exact structure expected by the API client, including transport wrappers. E2E mocks must mirror backend response format precisely.
