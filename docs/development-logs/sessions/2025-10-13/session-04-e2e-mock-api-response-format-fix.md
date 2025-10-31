# E2E Test Mock API Response Format Fix
**Date**: 2025-10-13
**Session**: 04
**Engineer**: Claude Code
**Task**: Fix E2E test failures in bug-fixes-2025-10-11.spec.ts due to incorrect mock API response format

## Problem Statement

The E2E tests in `bug-fixes-2025-10-11.spec.ts` were timing out with the error:
```
Error: Invalid response from API - no message content
    at http://localhost:5173/src/hooks/useChat.ts:705:15
```

### Root Cause Analysis

The mock API handlers in `teacher-assistant/frontend/e2e-tests/mocks/setup.ts` were returning an incorrect response format that didn't match the backend's standardized wrapper format.

**Incorrect Mock Response** (before fix):
```json
{
  "response": "Ich kann ein Bild für Sie erstellen.",
  "agentSuggestion": {...}
}
```

**Expected Backend Response Format**:
```json
{
  "success": true,
  "data": {
    "message": "Ich kann ein Bild für Sie erstellen.",
    "agentSuggestion": {...}
  },
  "timestamp": "2025-10-13T..."
}
```

### Additional Issues Found

1. **Incorrect POST Body Parsing**:
   - Mock was reading `postData?.message`
   - Actual request sends `{ messages: [...], image_data?: string }`
   - Fixed to extract last message from `messages` array

2. **Wrong Agent Execution Endpoint**:
   - Mock route: `**/api/langgraph-agents/execute` (with hyphen)
   - Actual endpoint: `**/api/langgraph/agents/execute` (with slash)

3. **Missing AgentSuggestion Properties**:
   - Mock returned `agentId`, `agentName`, `prefilledParams`
   - Backend expects `agentType`, `reasoning`, `prefillData`

## Changes Made

### File: `teacher-assistant/frontend/e2e-tests/mocks/setup.ts`

#### Change 1: Fixed POST /api/chat Response Format
**Lines 80-112**

**Before**:
```typescript
if (isImageRequest) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      response: 'Ich kann ein Bild für Sie erstellen.',
      agentSuggestion: {
        agentId: 'image-generator',
        agentName: 'Bild-Generator',
        description: 'Generiert ein Bild basierend auf Ihrer Beschreibung',
        prefilledParams: {
          description: message,
          imageStyle: 'illustrative'
        }
      }
    })
  });
}
```

**After**:
```typescript
if (isImageRequest) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        message: 'Ich kann ein Bild für Sie erstellen.',
        agentSuggestion: {
          agentType: 'image-generation',
          reasoning: 'Du hast nach einem Bild gefragt. Ich kann dir helfen, eines zu erstellen!',
          prefillData: {
            description: message.replace(/erstelle ein bild (zur?|vom?|von)/i, '').trim(),
            imageStyle: 'illustrative'
          }
        }
      },
      timestamp: new Date().toISOString()
    })
  });
}
```

#### Change 2: Fixed Request Body Parsing
**Lines 68-74**

**Before**:
```typescript
const postData = request.postDataJSON();
const message = postData?.message || '';
```

**After**:
```typescript
const postData = request.postDataJSON();
// Extract the last user message from the messages array
const messages = postData?.messages || [];
const lastMessage = messages[messages.length - 1];
const message = lastMessage?.content || '';

console.log('[MOCK] POST /api/chat ->', { messageCount: messages.length, lastMessage: message });
```

#### Change 3: Fixed Agent Execution Endpoint
**Line 118**

**Before**:
```typescript
await page.route('**/api/langgraph-agents/execute', async (route) => {
```

**After**:
```typescript
await page.route('**/api/langgraph/agents/execute', async (route) => {
```

#### Change 4: Fixed Chat Summary Response Format
**Lines 204-216**

**Before**:
```typescript
await route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({
    summary: 'Mock-Zusammenfassung: Benutzer hat nach Bildgenerierung gefragt.',
    keyTopics: ['Bildgenerierung', 'Unterrichtsmaterial'],
    messageCount: 5
  })
});
```

**After**:
```typescript
await route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({
    success: true,
    data: {
      summary: 'Mock-Zusammenfassung: Benutzer hat nach Bildgenerierung gefragt.',
      keyTopics: ['Bildgenerierung', 'Unterrichtsmaterial'],
      messageCount: 5
    },
    timestamp: new Date().toISOString()
  })
});
```

## Test Results

### Before Fix
- **Status**: All tests timeout
- **Error**: "Invalid response from API - no message content"
- **Root Cause**: useChat.ts:954 expects `response.message` but mock returns `response.response`

### After Fix (Partial)
- **Status**: Tests start properly, chat messages send successfully
- **Progress**: Tests now get past chat message sending step
- **Issue**: Agent suggestion button appears correctly
- **Remaining Issue**: Agent execution still has issues (tests running slowly, possible other mock issues)

## Verification Steps

1. ✅ Mock chat endpoint returns wrapped response with `success`, `data`, `timestamp`
2. ✅ Mock correctly extracts message from `messages` array
3. ✅ Agent suggestion format matches backend schema (`agentType`, `reasoning`, `prefillData`)
4. ✅ Agent execution endpoint route pattern corrected
5. ⚠️ Tests run but are still slow (may indicate other issues)

## Files Modified

- `teacher-assistant/frontend/e2e-tests/mocks/setup.ts`

## Related Documentation

- **Backend API Spec**: `docs/architecture/api-documentation/backend-api.md`
- **Type Definitions**: `teacher-assistant/frontend/src/lib/types.ts` (AgentSuggestion interface)
- **useChat Hook**: `teacher-assistant/frontend/src/hooks/useChat.ts` (lines 950-1020 for agentSuggestion handling)

## Next Steps

1. **Investigate remaining test slowness**: Tests are running but taking longer than expected
2. **Verify all mock endpoints**: Ensure all backend endpoints have matching mocks
3. **Add mock validation**: Add TypeScript checks to ensure mocks match backend types
4. **Consider MSW vs Playwright routes**: Current implementation uses Playwright routes instead of MSW service worker
5. **Test timeout analysis**: Analyze which tests are slow and why

## Lessons Learned

1. **API Response Format Consistency Critical**: Frontend expects specific wrapper format `{ success, data, timestamp }`
2. **Mock Fidelity Matters**: Mocks must match exact backend response structure including nested properties
3. **Request Body Parsing**: Always verify how the real API sends data before mocking
4. **Endpoint Naming**: Small differences like `/langgraph-agents/` vs `/langgraph/agents/` break routing
5. **AgentSuggestion Schema**: Backend uses `agentType`, `reasoning`, `prefillData` (not `agentId`, `agentName`, `prefilledParams`)

## Definition of Done Status

- ✅ Mock handlers fixed to return correct format
- ✅ Request body parsing corrected
- ✅ Agent execution endpoint route fixed
- ✅ Chat summary response format corrected
- ⚠️ Tests partially passing (still investigating remaining issues)
- ⏳ Build passing: Not yet verified
- ⏳ All tests passing: In progress

## Impact Assessment

**Positive**:
- Tests no longer fail immediately with "Invalid response" error
- Agent suggestion flow now works in tests
- Mock API responses match backend format

**Remaining Issues**:
- Tests still running slower than expected
- May be other mock endpoints that need fixing
- Need to verify all user stories pass

## Code Quality

- ✅ TypeScript types maintained
- ✅ Console logging added for debugging
- ✅ Comments updated to clarify endpoint patterns
- ✅ Response format matches backend specification
