# Quickstart Guide: Bug Fixes 2025-10-11

## Overview

This guide provides step-by-step instructions for testing and verifying the 4 bug fixes implemented in this feature. Use this guide for both automated E2E testing and manual verification.

## Prerequisites

### Required Dependencies
- Node.js 18+ and npm
- Chrome browser (for Playwright tests)
- InstantDB account with test data
- OpenAI API key (for image generation tests)

### Environment Setup

1. **Install dependencies**:
   ```bash
   cd teacher-assistant/frontend
   npm install
   ```

2. **Configure environment variables**:
   Create `.env.test` in `teacher-assistant/frontend/`:
   ```env
   VITE_TEST_MODE=true
   VITE_INSTANTDB_APP_ID=your_test_app_id
   VITE_OPENAI_API_KEY=your_test_api_key
   ```

3. **Start development server**:
   ```bash
   npm run dev -- --mode test
   ```

## Running E2E Tests

### Full Test Suite

Run all Playwright tests across multiple browsers:

```bash
cd teacher-assistant/frontend
npx playwright test
```

**Expected Output**:
```
Running 11 tests using 1 worker

✓ [Desktop Chrome] image-generation-ux-v2 > Complete E2E Journey (150s)
✓ [Desktop Chrome] Bug Fix 1: Chat Navigation (5s)
✓ [Desktop Chrome] Bug Fix 2: Message Persistence (8s)
✓ [Desktop Chrome] Bug Fix 3: Library Display (6s)
✓ [Desktop Chrome] Bug Fix 4: Metadata Field (7s)

5 passed (176s)
```

### Focused Test (Single Bug Fix)

Run a specific bug fix test:

```bash
# Test BUG-030: Chat Navigation
npx playwright test --grep "Chat Navigation"

# Test BUG-025: Message Persistence
npx playwright test --grep "Message Persistence"

# Test BUG-020: Library Display
npx playwright test --grep "Library Display"

# Test BUG-019: Metadata Field
npx playwright test --grep "Metadata Field"
```

### Debug Mode

Run tests with visible browser and slow motion:

```bash
npx playwright test --debug
```

### View Test Report

After test run, open HTML report:

```bash
npx playwright show-report
```

## Manual Testing Guide

### Bug Fix 1: Chat Navigation After Image Generation (BUG-030)

**Objective**: Verify "Weiter im Chat" button navigates to Chat tab correctly.

**Test Steps**:

1. **Open application** in browser: `http://localhost:5173`
2. **Log in** with test account (or use test mode bypass)
3. **Navigate to Chat tab** (click "Chat" in bottom navigation)
4. **Open Image Generation agent**:
   - Click "Bild generieren" button in chat input area
   - Wait for agent modal to open
5. **Fill agent form**:
   - Description: "A red apple on a wooden table"
   - Image Style: "Realistic"
   - Learning Group: "Elementary"
   - Click "Generate" button
6. **Wait for image generation** (30-70 seconds)
7. **Verify result view displays**:
   - ✅ Generated image shown
   - ✅ "Weiter im Chat 💬" button visible
8. **Click "Weiter im Chat" button**
9. **Verify navigation**:
   - ✅ Active tab indicator shows "Chat" (NOT "Library")
   - ✅ No full page reload (SPA navigation)
   - ✅ Generated image appears as thumbnail in chat history
   - ✅ Chat input is ready for new messages

**Check Console Logs**:
```
[Event] Agent: image-generation - result-action action: {"type":"navigate-to-chat","trigger":"button-click"}
[Event] Navigation: agent-result → chat (user-click)
```

**Rapid Click Test**:
10. **Repeat test** but click "Weiter im Chat" 5 times rapidly
11. **Verify debouncing**:
    - ✅ Only one navigation occurs
    - ✅ Console shows debounce messages
    - ✅ No race conditions or duplicate navigations

---

### Bug Fix 2: Message Persistence in Database (BUG-025)

**Objective**: Verify messages save correctly with proper field names.

**Test Steps**:

1. **Open application** and navigate to Chat tab
2. **Send text message**: "Hello, this is a test message"
3. **Open browser DevTools** → Network tab
4. **Check InstantDB transaction**:
   - ✅ Request payload contains correct field names:
     - `content` (not `message`)
     - `timestamp` (number)
     - `role` (string)
     - `message_index` (number)
   - ✅ No `userId` field in direct payload (uses links)
5. **Refresh page** (F5)
6. **Verify message persists**:
   - ✅ Message appears in chat history
   - ✅ Correct timestamp
   - ✅ Correct sender (user)
7. **Generate an image** (follow Bug Fix 1 steps 4-7)
8. **Verify image result message**:
   - ✅ Message saved with `metadata` field
   - ✅ Metadata contains `type`, `image_url`, `originalParams`
   - ✅ No database errors in console

**Check Console Logs**:
```
[Event] Agent: image-generation - form-submit with data: {...}
Message saved: { id: '...', content: '...', metadata: '{"type":"image",...}' }
```

**Database Verification**:
9. **Open InstantDB Dashboard** → Messages table
10. **Verify latest messages**:
    - ✅ All required fields present
    - ✅ `metadata` field populated for image messages
    - ✅ JSON structure valid

---

### Bug Fix 3: Display Materials in Library (BUG-020)

**Objective**: Verify Library tab displays generated materials.

**Test Steps**:

1. **Generate 3 images** (follow Bug Fix 1 steps 4-7, repeat 3 times)
2. **Navigate to Library tab** (click "Library" in bottom navigation)
3. **Verify Library display**:
   - ✅ NO "Noch keine Materialien" placeholder
   - ✅ Grid layout shows 3 image cards
   - ✅ Each card shows thumbnail
   - ✅ Each card shows title
   - ✅ Each card shows metadata (date, type)
4. **Test filter** (if implemented):
   - Click "Bilder" filter
   - ✅ Only images shown
5. **Click on a material card**
6. **Verify preview modal**:
   - ✅ Full-size image displayed
   - ✅ Metadata shown (title, date, params)
   - ✅ "Neu generieren" button visible

**Check Console Logs**:
```
[Event] Navigation: chat → library (user-click)
Library query result: { library_materials: [...] }
Displaying 3 materials
```

**Empty State Test**:
7. **Clear all library materials** (in InstantDB dashboard or via test script)
8. **Reload Library tab**
9. **Verify placeholder**:
   - ✅ "Noch keine Materialien" message shown
   - ✅ Helpful instructions for first generation

---

### Bug Fix 4: Persist Image Metadata Correctly (BUG-019)

**Objective**: Verify metadata field saves originalParams for regeneration.

**Test Steps**:

1. **Open application** and navigate to Chat tab
2. **Generate image with specific parameters**:
   - Description: "A blue butterfly on a sunflower"
   - Image Style: "Watercolor"
   - Learning Group: "Middle"
   - Subject: "Biology"
   - Click "Generate"
3. **Wait for generation** (30-70 seconds)
4. **Navigate to Library tab**
5. **Click on generated image card**
6. **Verify metadata in preview modal**:
   - ✅ Title matches: "A blue butterfly on a sunflower"
   - ✅ Metadata section shows parameters
   - ✅ "Neu generieren" button enabled
7. **Click "Neu generieren" button**
8. **Verify agent form pre-fills**:
   - ✅ Description: "A blue butterfly on a sunflower"
   - ✅ Image Style: "Watercolor"
   - ✅ Learning Group: "Middle"
   - ✅ Subject: "Biology"
9. **Modify description**: Add " in spring"
10. **Click "Generate"**
11. **Verify new image generated** with updated description

**Check Console Logs**:
```
[Event] Agent: image-generation - modal-open
Pre-filling form with metadata: { description: '...', imageStyle: 'watercolor', ... }
[Event] Agent: image-generation - form-submit with data: {...}
```

**Database Verification**:
12. **Open InstantDB Dashboard** → Library_Materials table
13. **Find generated material**
14. **Verify metadata field**:
    - ✅ Field exists and is populated
    - ✅ JSON structure valid
    - ✅ Contains `originalParams` object
    - ✅ All parameters present

**Validation Test**:
15. **Attempt to save invalid metadata** (via code modification or test script):
    ```javascript
    // Metadata size > 10KB
    const hugeMetadata = { description: 'x'.repeat(20000) };
    ```
16. **Verify error handling** (FR-010a):
    - ✅ Error logged to console
    - ✅ Core content saved without metadata
    - ✅ User sees warning toast/message
    - ✅ No data loss

---

## Verification Checklists

### Console Log Checks (FR-011)

After running tests, verify console contains:

- ✅ **Navigation events**: All tab changes logged with source/destination
- ✅ **Agent events**: Form open, submit, result view, actions
- ✅ **Error events**: Any exceptions with stack traces
- ✅ **No unexpected errors**: No red console errors

**Retrieve stored events for analysis**:
```javascript
// In browser console
const navEvents = JSON.parse(sessionStorage.getItem('event_log_navigation'));
console.table(navEvents);

const agentEvents = JSON.parse(sessionStorage.getItem('event_log_agent'));
console.table(agentEvents);

const errorEvents = JSON.parse(sessionStorage.getItem('event_log_error'));
console.table(errorEvents);
```

### Metadata Validation Checks (FR-010)

Verify metadata validation works correctly:

1. **Valid metadata**:
   - ✅ Passes validation
   - ✅ Saved to database
   - ✅ Regeneration works

2. **Invalid metadata (missing required fields)**:
   - ✅ Validation fails
   - ✅ Error logged
   - ✅ Core content saved
   - ✅ Warning shown to user

3. **Oversized metadata (>10KB)**:
   - ✅ Size check fails
   - ✅ Error logged
   - ✅ Core content saved
   - ✅ Warning shown to user

4. **Malicious metadata (script injection)**:
   - ✅ Strings sanitized
   - ✅ Script tags removed
   - ✅ Event handlers removed
   - ✅ Safe metadata saved

### Definition of Done Checklist

Before marking bug fixes as complete:

- ✅ **Build Clean**: `npm run build` → 0 TypeScript errors
- ✅ **Tests Pass**: `npx playwright test` → all pass
- ✅ **Manual Tests**: All 4 bug fix tests pass (documented in session log)
- ✅ **Console Clean**: No unexpected errors
- ✅ **Navigation Works**: Chat tab navigation smooth (no page reloads)
- ✅ **Data Persists**: Messages and materials save correctly
- ✅ **Metadata Valid**: Validation and sanitization working
- ✅ **Regeneration Works**: "Neu generieren" pre-fills form

## Troubleshooting

### Test Failures

**Issue**: E2E tests timeout during image generation
- **Solution**: Increase timeout in `playwright.config.ts` (currently 150s)
- **Workaround**: Run tests with `--timeout=180000` flag

**Issue**: Navigation test fails - lands on Library instead of Chat
- **Check**: `AgentResultView.tsx` uses Ionic tab system (not React Router)
- **Check**: Console shows navigation event logs
- **Solution**: Verify `selectedTab` state update in App.tsx

**Issue**: Library shows placeholder despite having materials
- **Check**: InstantDB query includes correct `user_id` filter
- **Check**: Console shows query result with materials
- **Solution**: Verify `Library.tsx` conditional rendering logic

**Issue**: Metadata validation fails for valid data
- **Check**: Metadata size < 10KB
- **Check**: Required fields present (`type`, `image_url`, `originalParams`)
- **Solution**: Review `metadata-validation.schema.ts` and adjust schema

### Console Log Analysis

**Find all navigation events**:
```javascript
const navEvents = JSON.parse(sessionStorage.getItem('event_log_navigation') || '[]');
navEvents.filter(e => e.destination === 'chat');
```

**Find all errors**:
```javascript
const errors = JSON.parse(sessionStorage.getItem('event_log_error') || '[]');
errors.filter(e => e.severity === 'error');
```

**Find agent lifecycle for specific generation**:
```javascript
const agentEvents = JSON.parse(sessionStorage.getItem('event_log_agent') || '[]');
agentEvents.filter(e => e.agentType === 'image-generation');
```

## Additional Resources

- **Spec Document**: `.specify/specs/bug-fixes-2025-10-11/spec.md`
- **Data Model**: `.specify/specs/bug-fixes-2025-10-11/data-model.md`
- **Validation Schemas**: `.specify/specs/bug-fixes-2025-10-11/contracts/`
- **Playwright Config**: `teacher-assistant/frontend/playwright.config.ts`
- **InstantDB Schema**: `teacher-assistant/backend/src/schemas/instantdb.ts`

## Support

For issues or questions:
1. Check console logs for error details
2. Review stored events in sessionStorage
3. Verify InstantDB dashboard for data state
4. Check Playwright HTML report for test details
5. Document issues in `/docs/quality-assurance/bug-tracking.md`
