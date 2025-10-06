# BUG-002: Material Navigation - Manual Test Checklist

**Test Date**: _____________
**Tester**: _____________
**Browser**: _____________
**Status**: 🔲 Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

---

## Prerequisites

- [ ] Dev server running at http://localhost:5175
- [ ] User logged in to InstantDB
- [ ] Browser DevTools Console open
- [ ] No console errors on page load

---

## Test Case 1: Material Arrow Navigation

**Objective**: Verify material arrow navigates to Library and shows Materials tab

### Steps:
1. [ ] Navigate to http://localhost:5175
2. [ ] Click Home tab (bottom navigation)
3. [ ] Scroll to "Materialien" section
4. [ ] Click the arrow button (→) next to "Materialien" heading

### Expected Results:
- [ ] App navigates to Library (Automatisieren) tab
- [ ] **"Materialien" sub-tab is ACTIVE** (highlighted/underlined in blue)
- [ ] Material list is displayed (NOT chat list)
- [ ] Console shows:
  ```
  [Home] Material arrow clicked - navigating to Library Materials
  [Library] Received navigate-library-tab event: { tab: 'materials' }
  ```

### Screenshot:
- [ ] Screenshot taken and saved to: `.specify/specs/bug-fix-critical-oct-05/screenshots/bug-002-materials-tab-active.png`

**Result**: 🔲 Pass | 🔲 Fail

**Notes**: ___________________________________________________________

---

## Test Case 2: Direct Library Navigation (Regression Test)

**Objective**: Verify default Library navigation still shows Chats tab

### Steps:
1. [ ] From any tab, click Library (Automatisieren) tab in bottom navigation
2. [ ] Do NOT use the material arrow button

### Expected Results:
- [ ] Library loads successfully
- [ ] "Chats" (Chat-Historie) sub-tab is ACTIVE (default behavior)
- [ ] Chat list is displayed
- [ ] No custom event logs in console

### Screenshot:
- [ ] Screenshot taken and saved to: `.specify/specs/bug-fix-critical-oct-05/screenshots/bug-002-default-chats.png`

**Result**: 🔲 Pass | 🔲 Fail

**Notes**: ___________________________________________________________

---

## Test Case 3: Multiple Navigation Cycles

**Objective**: Verify event system works consistently across multiple navigations

### Steps:
1. [ ] Click Material arrow → Verify Materialien tab is active
2. [ ] Click Home tab (bottom nav)
3. [ ] Click Library tab directly → Verify Chats tab is active
4. [ ] Click Home tab
5. [ ] Click Material arrow again → Verify Materialien tab is active

### Expected Results:
- [ ] **Cycle 1**: Material arrow → Materialien tab ✅
- [ ] **Cycle 2**: Direct Library → Chats tab ✅
- [ ] **Cycle 3**: Material arrow → Materialien tab ✅
- [ ] No state pollution between navigations
- [ ] Event system works consistently

**Result**: 🔲 Pass | 🔲 Fail

**Notes**: ___________________________________________________________

---

## Edge Cases

### Test Case 4: Rapid Clicking

**Steps**:
1. [ ] Click Material arrow rapidly 3 times
2. [ ] Observe behavior

**Expected**: No errors, Library shows Materialien tab

**Result**: 🔲 Pass | 🔲 Fail

---

### Test Case 5: Console Error Check

**Steps**:
1. [ ] Perform all test cases above
2. [ ] Check browser console for errors

**Expected**: No errors related to event listeners or state updates

**Result**: 🔲 Pass | 🔲 Fail

---

## Debug Checklist (If Tests Fail)

### Material arrow doesn't navigate:
- [ ] Check `onTabChange` prop is passed to Home component
- [ ] Verify button onClick handler is executing
- [ ] Check console for Home log message

### Library shows Chats instead of Materialien:
- [ ] Check console for Library event log
- [ ] Verify event detail: `{ tab: 'materials' }`
- [ ] Check `setSelectedTab('artifacts')` is called
- [ ] Inspect React DevTools: `selectedTab` state should be `'artifacts'`

### Console logs missing:
- [ ] Verify browser DevTools Console is open
- [ ] Check no console filters applied
- [ ] Refresh page and try again

### Event listener not working:
- [ ] Verify useEffect is running (add breakpoint)
- [ ] Check event listener is registered: `getEventListeners(window)` in console
- [ ] Verify event name spelling: `'navigate-library-tab'`

---

## Overall Test Result

**Status**: 🔲 All Pass | 🔲 Some Fail | 🔲 All Fail

**Summary**:
- Tests Passed: _____ / 5
- Tests Failed: _____ / 5

**Critical Issues Found**: _____________________________________________

**Sign-off**:
- Tester: _________________ Date: _____________
- Reviewer: _________________ Date: _____________

---

## Files Changed (Reference)

1. `teacher-assistant/frontend/src/pages/Home/Home.tsx` (Lines 342-372)
2. `teacher-assistant/frontend/src/pages/Library/Library.tsx` (Lines 1, 50-66)

**Session Log**: `docs/development-logs/sessions/2025-10-05/session-05-bug-002-material-navigation.md`
