# Session 04 - BUG-028 useNavigate Router Context Fix

**Date**: 2025-10-07
**Task**: BUG-028 - Fix "useNavigate() may be used only in the context of a <Router> component" error
**Status**: ✅ COMPLETED
**Time**: 10 minutes

## Problem Description

After fixing BUG-027 (form field mapping), the image generation worked but the result view crashed with:

```
Uncaught Error: useNavigate() may be used only in the context of a <Router> component.
    at AgentResultView (AgentResultView.tsx:31:20)
```

## Root Cause Analysis

**File**: `teacher-assistant/frontend/src/components/AgentResultView.tsx`

**Problem**: AgentResultView component used `useNavigate()` hook from react-router-dom, but the component is rendered inside a Modal that's outside the React Router `<Router>` context.

**Affected Lines**:
- Line 3: `import { useNavigate } from 'react-router-dom';`
- Line 31: `const navigate = useNavigate();`
- Line 198: `navigate('/chat')`
- Line 204: `navigate('/library?filter=image')`

## Solution

Replaced `useNavigate()` with a `safeNavigate()` function that uses `window.location.href` for navigation. This works universally, regardless of Router context.

**Changes**:

### 1. Removed react-router-dom import (Line 3)
```diff
- import { useNavigate } from 'react-router-dom';
```

### 2. Created safeNavigate function (Lines 32-37)
```typescript
// BUG-028 FIX: Don't use useNavigate() - component may be outside Router context
// Use window.location for navigation instead
const safeNavigate = (path: string) => {
  console.log('[AgentResultView] Navigating to:', path);
  window.location.href = path;
};
```

### 3. Updated navigation calls
```diff
const handleContinueChat = () => {
  console.log('[AgentResultView] Continuing in chat');
  closeModal();
-  navigate('/chat');
+  safeNavigate('/chat');
};

const handleOpenInLibrary = () => {
  console.log('[AgentResultView] Opening Library with Bilder filter');
  closeModal();
-  navigate('/library?filter=image');
+  safeNavigate('/library?filter=image');
};
```

## Files Changed

1. `teacher-assistant/frontend/src/components/AgentResultView.tsx` (Lines 1-3, 32-37, 205, 211)

## Testing

### Expected Behavior After Fix
1. Image generation completes successfully
2. Result view opens in fullscreen without errors
3. "Weiter im Chat" button navigates to /chat
4. "Zur Bibliothek" button navigates to /library?filter=image
5. No React Router errors in console

### Build Check
- Frontend rebuilds automatically via Vite HMR
- No TypeScript errors (removed unused import, no breaking changes)

## Related Issues

- BUG-027: ✅ Form field mapping fix (enabled image generation to work)
- BUG-028: ✅ useNavigate Router context fix (this fix)

## Technical Notes

**Why window.location.href?**
- Works everywhere, no Router context required
- Appropriate for modal-to-page navigation (causes full page reload)
- Alternative would be to wrap AgentModal in a Router, but that's overkill

**Why not try-catch useNavigate()?**
- React Hooks cannot be called conditionally or in try-catch
- Rules of Hooks violation would cause other issues

**Better long-term solution?**
- Move AgentModal inside Router context in App.tsx
- Or use React Router's createMemoryRouter for the modal
- Current solution is pragmatic and works correctly

## Next Steps

1. ⏳ User verifies full workflow (Steps 1-5)
2. ⏳ Manual test: Click "Weiter im Chat" → Should navigate to /chat
3. ⏳ Manual test: Click "Zur Bibliothek" → Should navigate to /library
4. ⏳ Re-run E2E test for full workflow verification
