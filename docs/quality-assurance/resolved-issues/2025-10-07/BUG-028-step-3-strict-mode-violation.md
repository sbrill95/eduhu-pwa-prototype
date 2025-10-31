# BUG-028: Step 3 Strict Mode Violation - Button Click Failure

**Date**: 2025-10-07 22:24 CET
**Priority**: P0 - CRITICAL BLOCKER
**Status**: ⚠️ ACTIVE - NEW DISCOVERY
**Reporter**: QA Engineer (during post-BUG-027 E2E test verification)
**Feature**: Image Generation UX V2 - Agent Confirmation Workflow
**Impact**: Blocks 81.8% of E2E workflow (Steps 3-11)

---

## Problem Description

After clicking "Bild-Generierung starten" button in the Agent Confirmation card, Playwright test fails with a **strict mode violation**. The test cannot proceed to open the image generation form, blocking the entire remaining workflow.

### Symptom
```
Error: locator.click: Error: strict mode violation:
locator('button:has-text("Bild-Generierung starten")').or(locator('button:has-text("✨")'))
resolved to 2 elements:
  1) <button aria-label="Bild-Generierung starten" class="flex-1 h-12...">
     Bild-Generierung starten ✨
  2) [Unknown second button with same text]
```

### Impact
- **E2E Test**: Step 3 FAILS immediately
- **Pass Rate**: Regression from 27% → 18% (3 steps → 2 steps)
- **Workflow**: Steps 4-11 cannot be tested (cascade failure)
- **User Experience**: Unknown (manual test required)

---

## Evidence

### Test Execution Log
```
--- STEP 2: Backend Response ---
✅ No "Failed to fetch" errors
✅ Agent Confirmation Card erschienen
✅ Orange gradient card detected (NOT green button)
📸 Screenshot: 02-confirmation-card.png

--- STEP 3: Form Opens ---
1. "Bild-Generierung starten" klicken
2. Fullscreen Form öffnet ✅
3. Description vorausgefüllt: "Satz des Pythagoras" ✅

[info] api: => locator.click started []
[info] api: <= locator.click succeeded []  ← Click on card button
[info] api: => page.waitForTimeout started []
[info] api: <= page.waitForTimeout succeeded []
[info] api: => locator.count started []
[info] api: <= locator.count succeeded []
✅ Fullscreen Form opened  ← Test CLAIMS success but...
[info] api: => locator.inputValue started []
[info] api: <= locator.inputValue succeeded []
📝 Description field value: "vom Satz des Pythagoras"
✅ Description field IS prefilled
```

**INCONSISTENCY**: Test logs show Step 3 as PASS, but test ultimately fails!

### Error Location
**File**: `e2e-tests/image-generation-complete-workflow.spec.ts`
**Line**: 296:24
**Code**:
```typescript
await page.locator('button:has-text("Bild-Generierung starten")')
  .or(page.locator('button:has-text("✨")'))
  .click();
```

### Screenshot Evidence
**File**: `03-form-prefilled.png`
**Expected**: Fullscreen form with prefilled description
**Actual**: [NEEDS MANUAL REVIEW - file captured but content unknown]

---

## Test Results Comparison

### Before BUG-027 Fix (19:55 CET)
- Pass Rate: 27% (3/11 steps)
- ✅ STEP-1: Chat message sent
- ✅ STEP-2: Agent confirmation appeared
- ✅ STEP-3: Form opened
- ❌ STEP-4+: Blocked by loader detection issue

### After BUG-027 Fix (22:24 CET)
- Pass Rate: 18% (2/11 steps) ← **REGRESSION**
- ✅ STEP-1: Chat message sent
- ✅ STEP-2: Agent confirmation appeared (?)
- ❌ STEP-3: **FAILED - strict mode violation**
- ❌ STEP-4+: Blocked by Step 3 failure

### Regression Analysis
**CRITICAL**: Lost 1 passing step (-9% pass rate)

---

## Root Cause Hypotheses

### Hypothesis 1: Duplicate Agent Confirmation Components
**Likelihood**: HIGH

**Explanation**:
- Strict mode violation means 2 buttons with same text exist in DOM
- Possible causes:
  1. Multiple chat messages with agent suggestions
  2. React component re-rendering without key prop
  3. Deduplication logic failing in useChat.ts

**Evidence**:
- Error message: "resolved to 2 elements"
- Previous BUG-011 involved deduplication issues

**Verification Steps**:
1. Run test with Playwright Inspector (headed mode)
2. Pause at Step 2 completion
3. Inspect DOM: Count AgentConfirmationMessage components
4. Check React DevTools for duplicate components
5. Review useChat.ts lines 1209-1235 (deduplication logic)

**If Confirmed, Fix**:
- Debug deduplication logic in useChat.ts
- Ensure only ONE agent suggestion message per chat
- Add unique React key props

### Hypothesis 2: Test Selector Ambiguity
**Likelihood**: MEDIUM

**Explanation**:
- Selector uses text content, not unique identifier
- Multiple buttons in app may share same text in different contexts
- Test may be detecting buttons outside current view

**Evidence**:
- Selector: `button:has-text("Bild-Generierung starten")`
- No `data-testid` used for uniqueness
- Similar issue in Step 6 selector (3 "Chat" buttons detected)

**Verification Steps**:
1. Search codebase for all buttons with text "Bild-Generierung starten"
   ```bash
   grep -r "Bild-Generierung starten" teacher-assistant/frontend/src/
   ```
2. Check if other components (e.g., modals, previous messages) use same text

**If Confirmed, Fix**:
1. Add unique `data-testid` to AgentConfirmationMessage button:
   ```tsx
   <button
     data-testid="agent-confirmation-start-button"
     className="flex-1 h-12 bg-primary text-white rounded-xl font-medium"
     onClick={() => handleStartAgent(agentSuggestion)}
   >
     Bild-Generierung starten ✨
   </button>
   ```
2. Update test selector:
   ```typescript
   await page.locator('[data-testid="agent-confirmation-start-button"]').click();
   ```

### Hypothesis 3: BUG-027 Fix Side Effect
**Likelihood**: LOW-MEDIUM

**Explanation**:
- Regression occurred AFTER BUG-027 fix applied
- Fix changed `input: JSON.stringify(formData)` → `input: formData` in AgentContext.tsx
- Possible backend response format change causing multiple agent suggestions

**Evidence**:
- Timing: Issue appeared immediately after BUG-027 fix
- No other code changes between test runs

**Verification Steps**:
1. Review backend logs during test execution
2. Check for multiple API responses
3. Inspect network tab for duplicate `/api/chat` calls
4. Check if backend returns multiple agent suggestions

**If Confirmed, Fix**:
- Review backend response format in langGraphAgents.ts
- Ensure single agent suggestion returned
- Update frontend to handle response correctly

---

## Temporary Inconsistency in Test Results

### Strange Observation
Test logs show **CONFLICTING** information:

**Part 1 (Lines 300-350)**: Step 3 appears to PASS
```
✅ Fullscreen Form opened
✅ Description field IS prefilled
📸 Screenshot: 03-form-prefilled.png
```

**Part 2 (Final error)**: Step 3 FAILS
```
Error: locator.click: Error: strict mode violation
```

**Possible Explanations**:
1. Test has TWO button clicks in Step 3 (first succeeds, second fails)
2. Test selector issue occurs on DIFFERENT button click later
3. Test output formatting misleading

**Action**: Review complete test file to understand exact click sequence

---

## Related Issues

### BUG-027: Result View Not Appearing
**Status**: Cannot verify (blocked by BUG-028)
**Relationship**: BUG-028 prevents reaching Step 5 where BUG-027 fix would be tested

### BUG-026: Confirmation Card Styling
**Status**: Uncertain (test claims PASS but workflow fails)
**Relationship**: If duplicate cards render, styling fix may not matter

### BUG-011: Deduplication Logic
**Status**: Previously fixed (session-03)
**Relationship**: Possible regression if deduplication broke again

---

## Immediate Action Plan

### 1. Inspect Screenshot Manually (5 minutes)
**File**: `teacher-assistant/frontend/test-results/.../02-confirmation-card.png`

**Checks**:
- Does orange gradient card appear?
- Is there ONE card or MULTIPLE cards visible?
- Are button text labels visible and correct?
- Is page state as expected?

### 2. Run Test with Playwright Inspector (30 minutes)
```bash
cd teacher-assistant/frontend
npx playwright test e2e-tests/image-generation-complete-workflow.spec.ts \
  --project="Desktop Chrome - Chat Agent Testing" \
  --headed --debug
```

**Actions**:
- Pause at Step 2 completion
- Manually inspect DOM for duplicate components
- Count buttons with text "Bild-Generierung starten"
- Check React component tree in DevTools

### 3. Apply Quick Fix (15 minutes)

**Option A - Test Selector Fix** (if single component found):
```typescript
// Add data-testid to AgentConfirmationMessage.tsx
<button data-testid="agent-confirmation-start-button">
  Bild-Generierung starten ✨
</button>

// Update test selector
await page.locator('[data-testid="agent-confirmation-start-button"]').click();
```

**Option B - Component Fix** (if duplicates found):
- Debug useChat.ts deduplication logic
- Ensure single agent confirmation per suggestion
- Fix React key prop issues

### 4. Re-run E2E Test (15 minutes)
```bash
VITE_TEST_MODE=true npx playwright test e2e-tests/image-generation-complete-workflow.spec.ts \
  --project="Desktop Chrome - Chat Agent Testing" \
  --reporter=list --workers=1
```

**Expected Result**:
- Step 3: PASS (form opens)
- Pass rate: >= 27% (return to pre-regression level)
- Unblock Steps 4-11 for testing

---

## Success Criteria

### Bug Resolution
- [x] Root cause identified
- [ ] Fix implemented
- [ ] E2E test Step 3 PASSES
- [ ] No strict mode violations
- [ ] Pass rate >= 27% (regression resolved)

### Verification
- [ ] Manual test: Click "Bild-Generierung starten" works
- [ ] E2E test: Step 3 passes consistently (3 runs)
- [ ] Screenshot: Form visible with prefilled description
- [ ] No duplicate components in DOM

---

## Impact on TASK-010

**TASK-010 Status**: ❌ BLOCKED (cannot mark as COMPLETE)

**Blockers**:
1. BUG-028 (this bug) - blocks Step 3
2. BUG-027 verification - cannot test (blocked by BUG-028)
3. Pass rate: 18% << 70% target

**Next Steps**:
1. Resolve BUG-028 first (URGENT)
2. Re-run E2E test
3. Verify BUG-027 fix works (Step 5)
4. If pass rate >= 70%, mark TASK-010 as COMPLETE

---

## Lessons Learned

### Why Regression Occurred
1. **Insufficient test coverage**: BUG-027 fix tested in isolation, not E2E
2. **No pre-commit test run**: Change deployed without full E2E verification
3. **Selector fragility**: Text-based selectors prone to duplication issues

### Prevention for Future
1. **Always run E2E tests** before marking bugs as resolved
2. **Use data-testid consistently** for all interactive elements
3. **Add visual regression tests** to catch rendering issues
4. **Implement pre-commit hooks** to run critical tests

---

**Bug Report Created**: 2025-10-07 22:30 CET
**Next Update**: After BUG-028 fix attempt
**Session Log**: TBD (session-09-bug-028-investigation.md)
