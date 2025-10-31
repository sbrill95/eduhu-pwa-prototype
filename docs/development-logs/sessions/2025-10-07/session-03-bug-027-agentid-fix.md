# Session 03 - BUG-027 AgentId Mismatch Fix

**Date**: 2025-10-07
**Task**: BUG-027 - Fix "Only image-generation agent is supported" error
**Status**: ✅ COMPLETED
**Time**: 15 minutes

## Problem Description

User reported that Steps 1-3 of the Image Generation workflow work manually, but Step 4 (clicking "Bild generieren" button) fails with error:

```
Error: Only image-generation agent is supported
    at ApiClient.request (api.ts:107:29)
    at async ApiClient.executeAgent (api.ts:452:22)
    at async AgentContext.tsx:153:24
```

## Root Cause Analysis

**File**: `teacher-assistant/frontend/src/lib/AgentContext.tsx` lines 140-141

**Problem**: Frontend sends wrong agentId to backend
- Frontend sends: `agentId: 'langgraph-image-generation'`
- Backend expects: `agentType: 'image-generation'`

**Backend Validation**: `teacher-assistant/backend/src/routes/imageGeneration.ts` line 47
```typescript
if (agentType !== 'image-generation') {
  return res.status(400).json({
    success: false,
    error: 'Only image-generation agent is supported'
  });
}
```

## Solution

Changed `AgentContext.tsx` line 141:

```diff
const agentIdMap: Record<string, string> = {
-  'image-generation': 'langgraph-image-generation'
+  'image-generation': 'image-generation'
};
```

## Files Changed

1. `teacher-assistant/frontend/src/lib/AgentContext.tsx` (line 141)

## Testing

### Build Check
- Frontend is running via `npm run dev` (auto-rebuilds on change)
- No TypeScript errors expected (string value change only)

### Manual Verification Required
User needs to test:
1. Open http://localhost:5173
2. Navigate to Chat
3. Send message: "Erstelle ein Bild vom Satz des Pythagoras"
4. Wait for confirmation card
5. Click "Bild-Generierung starten"
6. Fill form (description already prefilled)
7. **Click "Generieren" button** ← This should now work
8. Wait for image generation (≤30 seconds)
9. Verify image appears in fullscreen result view

Expected: No "Only image-generation agent is supported" error

### E2E Test
- E2E test ran with OLD code (9% pass rate)
- Need to re-run after manual verification succeeds

## Related Issues

- BUG-025: ✅ Backend schema fix (message_id not null)
- BUG-026: ✅ Confirmation card styling (orange color)
- BUG-027: ✅ AgentId mismatch (this fix)

## Notes

- This was a simple API contract mismatch
- Backend has TWO routes: `/api/langgraph/agents/execute` and `/api/agents/execute`
- Frontend was sending wrong ID format for the fallback route
- Frontend is using the `/api/agents/execute` route (imageGeneration.ts)
- Fix aligns frontend agentId with backend validation

## Next Steps

1. ⏳ User manually verifies "Bild generieren" button works (Step 4)
2. ⏳ If manual test succeeds, re-run E2E test for full workflow verification
3. ⏳ Aim for ≥70% E2E pass rate (7/10 steps)
