# Known Issue: Prompt Suggestions Endpoint

## Issue
Frontend shows console error:
```
POST http://localhost:3006/api/prompts/generate-suggestions net::ERR_CONNECTION_REFUSED
Error fetching prompt suggestions: TypeError: Failed to fetch
```

## Root Cause
The `/api/prompts/generate-suggestions` endpoint is **disabled** in the backend because the prompts router has TypeScript errors.

From `teacher-assistant/backend/src/routes/index.ts` lines 10-12:
```typescript
// TODO: Fix TypeScript errors in these routes before enabling
// import langGraphAgentsRouter from './langGraphAgents';
// import promptsRouter from './prompts';
```

And lines 40-42:
```typescript
// TODO: Enable these routes after fixing TypeScript errors
// router.use('/prompts', promptsRouter);
// router.use('/teacher-profile', teacherProfileRouter);
```

## Impact
**LOW PRIORITY** - This only affects the AI-generated prompt suggestions feature on the Home screen. The app still works perfectly without it.

**What Still Works:**
- ✅ Chat functionality
- ✅ Image generation
- ✅ Library
- ✅ Profile management
- ✅ All core features

**What Doesn't Work:**
- ⏳ AI-generated prompt tile suggestions on Home screen

## Workaround
Users can still:
1. Type their own prompts in the chat
2. Use static prompt suggestions (if implemented)
3. All other features work normally

## Permanent Fix Options

### Option 1: Disable Frontend Call (Quickest)
Modify `teacher-assistant/frontend/src/hooks/usePromptSuggestions.ts` to not fetch suggestions:

```typescript
// Around line 40-60, wrap the API call in a feature flag
const ENABLE_PROMPT_SUGGESTIONS = false; // Disable until backend is ready

useEffect(() => {
  if (!ENABLE_PROMPT_SUGGESTIONS) {
    console.log('[Prompt Suggestions] Feature disabled');
    return;
  }

  // Existing fetch logic...
}, []);
```

### Option 2: Fix Backend TypeScript Errors (Proper)
1. Fix TypeScript errors in `teacher-assistant/backend/src/routes/prompts.ts`
2. Enable import in `routes/index.ts`
3. Test endpoint works

### Option 3: Mock Endpoint (Temporary)
Add a simple mock endpoint that returns empty suggestions:

```typescript
// In routes/index.ts
router.post('/prompts/generate-suggestions', (req, res) => {
  res.json({
    success: true,
    data: {
      suggestions: []
    }
  });
});
```

## Recommendation
**Use Option 1** (disable frontend call) to eliminate console errors without breaking anything. The prompt suggestions feature can be re-enabled later when the backend is properly fixed.

---

**Status:** Non-critical, does not block usage
**Priority:** P2 - Nice to have
**Assigned:** Backend team to fix TypeScript errors in prompts router
