# BUG-001: Prompt Auto-Submit - Manual Testing Guide

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd teacher-assistant/backend
   npm run dev
   ```

2. **Frontend Server Running**
   ```bash
   cd teacher-assistant/frontend
   npm run dev
   ```

3. **Browser**: Chrome/Edge (Chromium-based recommended)

## Test Case 1: Happy Path - Auto-Submit Works

### Steps:
1. Open browser to `http://localhost:5175`
2. Navigate to **Home** tab (bottom navigation)
3. Scroll to **Welcome Message Bubble** (with prompt suggestions)
4. Click on **any prompt tile** (e.g., "Erstelle mir einen Stundenplan")

### Expected Results:
✅ App navigates to **Chat** tab automatically
✅ Prompt briefly appears in input field (~300ms)
✅ Loading spinner appears ("eduhu tippt...")
✅ KI response appears in chat
✅ Input field is **empty** and ready for follow-up

### Console Logs to Verify:
```
[ChatView] Setting prefilled prompt: Erstelle mir einen Stundenplan...
[ChatView] Auto-submitting prefilled prompt
[ChatView] Auto-submit successful
```

### Screenshot:
Take screenshot after KI response appears:
`.specify/specs/bug-fix-critical-oct-05/screenshots/bug-001-manual-success.png`

---

## Test Case 2: Error Handling - Network Failure

### Steps:
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click **"Offline"** checkbox (or throttle to "Offline")
4. Navigate to **Home** tab
5. Click a **prompt tile**

### Expected Results:
✅ App navigates to **Chat** tab
✅ Error message appears: **"Automatisches Senden fehlgeschlagen. Bitte erneut versuchen."**
✅ Prompt **stays in input field** (not cleared)
✅ User can manually click "Send" to retry

### Console Logs to Verify:
```
[ChatView] Setting prefilled prompt: ...
[ChatView] Auto-submitting prefilled prompt
[ChatView] Auto-submit failed: [error details]
```

### Screenshot:
Take screenshot showing error message and prompt still in input:
`.specify/specs/bug-fix-critical-oct-05/screenshots/bug-001-manual-error.png`

---

## Test Case 3: Fast Navigation - No Duplicate Messages

### Steps:
1. Navigate to **Home** tab
2. Click a **prompt tile**
3. **Immediately** (within 100ms) click **Profile** tab (before 300ms delay completes)
4. Wait 2 seconds
5. Navigate back to **Chat** tab

### Expected Results:
✅ No duplicate messages sent
✅ Chat shows only 1 user message (if auto-submit completed)
✅ OR Chat is empty (if auto-submit was cancelled)
✅ No orphan API requests in Network tab

### Console Logs to Verify:
- Only **ONE** `[ChatView] Auto-submitting prefilled prompt` log
- No multiple API requests

---

## Test Case 4: Validation - Empty Prompt

### Steps:
1. Modify code temporarily to pass empty string:
   ```typescript
   // In Home.tsx, line 75
   onNavigateToChat(''); // Empty prompt
   ```
2. Click a prompt tile

### Expected Results:
✅ Console log: `[ChatView] Auto-submit skipped: empty prompt`
✅ No API request sent
✅ No error message shown
✅ Input remains empty

---

## Test Case 5: Validation - Too Long Prompt

### Steps:
1. Modify code temporarily to pass very long prompt:
   ```typescript
   // In Home.tsx, line 75
   onNavigateToChat('A'.repeat(500)); // 500 chars (>400 limit)
   ```
2. Click a prompt tile

### Expected Results:
✅ Console log: `[ChatView] Auto-submit skipped: prompt too long`
✅ Error message: **"Nachricht ist zu lang (500/400 Zeichen)"**
✅ No API request sent
✅ Prompt stays in input field

---

## Performance Metrics

### Timing Benchmarks:
- **Prefill delay**: ~100-150ms (input render time)
- **Auto-submit delay**: 300ms (intentional UX timing)
- **Total time to first response**: ~3-5 seconds (depending on API)

### User Action Count:
- **Before**: 3+ actions (click tile → click send → wait)
- **After**: 1 action (click tile → auto-magic ✨)
- **Improvement**: 67% reduction

---

## Browser Console Commands (for debugging)

### Check if auto-submit is enabled:
```javascript
// Inspect ChatView component state
// (Use React DevTools)
// Look for "prefilledPrompt" prop
```

### Force trigger auto-submit:
```javascript
// Not recommended, but for debugging:
// Open React DevTools → Find ChatView → Edit "prefilledPrompt" prop
```

---

## Common Issues & Solutions

### Issue: Auto-submit doesn't trigger
**Solution**: Check console logs for warnings. Verify:
- Prompt is not empty
- Prompt length < 400 characters
- `sendMessage` function is available
- Backend is running

### Issue: Multiple duplicate messages
**Solution**: Check useEffect dependency array includes all dependencies:
```typescript
}, [prefilledPrompt, sendMessage, onClearPrefill]);
```

### Issue: Error message persists
**Solution**: Error message should clear on next successful send. If not, check `setInputError(null)` is called in `handleSubmit`.

---

## Accessibility Testing

### Keyboard Navigation:
1. Use **Tab** to navigate to prompt tile
2. Press **Enter** to activate
3. Verify auto-submit works with keyboard input

### Screen Reader:
1. Enable screen reader (NVDA/JAWS)
2. Navigate to prompt tile
3. Verify tile is announced
4. Click tile
5. Verify loading state is announced

---

## Mobile Testing (Optional)

### iOS Safari:
1. Open `http://[your-ip]:5175` on iPhone
2. Navigate to Home tab
3. Tap prompt tile
4. Verify auto-submit works on mobile

### Android Chrome:
1. Open `http://[your-ip]:5175` on Android device
2. Navigate to Home tab
3. Tap prompt tile
4. Verify auto-submit works on mobile

**Note**: Input focus behavior may differ on mobile due to browser restrictions.

---

## Sign-Off Checklist

- [ ] Test Case 1: Happy Path ✅
- [ ] Test Case 2: Error Handling ✅
- [ ] Test Case 3: Fast Navigation ✅
- [ ] Test Case 4: Empty Prompt ✅
- [ ] Test Case 5: Too Long Prompt ✅
- [ ] Performance: Response time < 5s ✅
- [ ] Console: No unexpected errors ✅
- [ ] Screenshots: Captured for documentation ✅

**Tester Signature**: ________________
**Date**: ________________
**Build Version**: `git rev-parse --short HEAD`

---

## Next Steps After Manual Testing

1. Run E2E tests: `npx playwright test .specify/specs/bug-fix-critical-oct-05/tests/bug-001-prompt-auto-submit.spec.ts`
2. Create Git commit with changes
3. Update project documentation
4. Deploy to staging environment
5. User acceptance testing (UAT)

---

**Test Guide Version**: 1.0
**Last Updated**: 2025-10-05
**Author**: Claude Code Assistant
