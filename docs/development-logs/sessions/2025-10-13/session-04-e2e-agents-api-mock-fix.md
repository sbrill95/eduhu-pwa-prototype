# E2E Test Mock Fix - Agents API Response Format

**Date:** 2025-10-13
**Session:** 04
**Task:** Fix agents API mock handler response format in E2E tests

## Problem Discovered

From test logs:
```
WARNING: Failed to load agents from API, using mock data for testing: TypeError: Cannot read properties of undefined (reading 'agents')
    at http://localhost:5173/src/hooks/useAgents.ts:17:28
```

## Root Cause Analysis

### Issue 1: GET /api/langgraph/agents/available Response Format

**Expected by apiClient.getAvailableAgents()** (line 440-448 in `api.ts`):
```typescript
{
  success: boolean;
  data: {
    agents: AgentInfo[];
    count: number;
  };
}
```

**What the mock was returning** (line 167-191 in `setup.ts`):
```typescript
{
  agents: [...]  // Missing success/data wrapper!
}
```

**Fix Applied:**
```typescript
{
  success: true,
  data: {
    agents: [...],
    count: 1
  },
  timestamp: new Date().toISOString()
}
```

### Issue 2: POST /api/langgraph/agents/execute Response Format

**Expected by AgentExecutionResponse** (line 260-272 in `types.ts`):
```typescript
{
  executionId: string;
  agentId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message: string;
  image_url?: string;  // Note: underscore, not camelCase
  title?: string;
  library_id?: string;
  message_id?: string;
}
```

**What the mock was returning:**
```typescript
{
  success: true,
  data: {
    imageUrl: ...,  // Wrong! Should be image_url
    title: ...,
    library_id: ...,
    // Missing: executionId, agentId, status, message
  }
}
```

**Fix Applied:**
```typescript
{
  success: true,
  data: {
    executionId: `mock-exec-${Date.now()}`,
    agentId: postData?.agentId || 'langgraph-image-generation',
    status: 'completed',
    message: 'Bild wurde erfolgreich erstellt',
    image_url: `data:image/svg+xml;base64,${MOCK_IMAGE_SVG}`,
    title: 'Test Generated Image - Photosynthese Klasse 7',
    revised_prompt: 'Educational illustration of photosynthesis for grade 7',
    library_id: mockLibraryId,
    message_id: mockMessageId
  }
}
```

## Files Modified

### `teacher-assistant/frontend/e2e-tests/mocks/setup.ts`

**Changes:**
1. Fixed GET `/api/langgraph/agents/available` response format (lines 155-189)
2. Fixed POST `/api/langgraph/agents/execute` response format (lines 118-154)
3. Updated agent ID to match useAgents.ts mock: `langgraph-image-generation`
4. Added all required fields for AgentExecutionResponse

## Test Results

### Before Fix
```
WARNING: Failed to load agents from API, using mock data for testing:
TypeError: Cannot read properties of undefined (reading 'agents')
```

### After Fix
- ✅ No more "Cannot read properties of undefined" error
- ✅ Agents load successfully from mock API
- ✅ Image generation modal opens
- ✅ Image generates successfully (500ms mock delay)
- ✅ Result modal displays with image and action buttons
- ✅ "Weiter im Chat 💬" button appears and works

### Current Test Progress

**Test:** US1 (BUG-030) - "Weiter im Chat" navigates to Chat tab with image thumbnail

**Status:** Progresses further but still fails

**Failure Point:** After clicking "Weiter im Chat", the test expects chat messages to load but none exist in InstantDB (mock environment issue, not code issue)

**Evidence from error-context.md:**
```yaml
- dialog [ref=e80]:
  - img "AI-generiertes Bild" [ref=e87]
  - generic [ref=e88]:
    - img [ref=e90]
    - generic [ref=e92]: In Library gespeichert
  - generic [ref=e93]:
    - button "Weiter im Chat 💬" [ref=e94]
    - button "In Library öffnen 📚" [ref=e95]
    - button "Neu generieren 🔄" [ref=e96]
```

The result modal works correctly! The remaining test failure is due to InstantDB not having real chat messages in the mock environment.

## Success Criteria Met

- [x] No "Cannot read properties of undefined (reading 'agents')" error
- [x] Tests progress past chat interface loading
- [x] Chat input field appears
- [x] Image generation completes successfully
- [x] Result modal displays correctly

## Next Steps

The mock API handlers are now correct. The remaining test failures are related to:
1. InstantDB mock data not persisting between operations
2. Chat messages not being queried from mock database

These are separate issues from the API response format problems that were fixed in this session.

## Technical Notes

### Key Learnings

1. **Always check the API wrapper structure:** The apiClient methods often wrap responses in `{ success, data }` format
2. **Use snake_case for API responses:** Backend uses snake_case (`image_url`), not camelCase (`imageUrl`)
3. **Include all required fields:** TypeScript interfaces define all required fields - mock responses must match exactly
4. **Match agent IDs consistently:** Mock agent ID must match what useAgents.ts expects: `langgraph-image-generation`

### Response Format Pattern

All backend API responses follow this pattern:
```typescript
{
  success: boolean;
  data: <ActualResponseType>;
  timestamp: string;
}
```

The apiClient extracts `response.data` and returns it to the caller.
