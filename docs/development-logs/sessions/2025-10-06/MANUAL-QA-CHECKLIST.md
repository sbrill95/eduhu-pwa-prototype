# Manual QA Testing Checklist
**Date:** 2025-10-06
**App URL:** http://localhost:5174
**Backend:** http://localhost:3006

> **Note:** This manual checklist is required because automated E2E testing is blocked by test authentication infrastructure issues. See `QA-VERIFICATION-REPORT-2025-10-06.md` for details.

---

## Pre-Testing Setup

### ✅ Prerequisites
- [ ] Frontend running on http://localhost:5174
- [ ] Backend running on http://localhost:3006
- [ ] Signed in to app with test account
- [ ] Browser DevTools console open (F12)

---

## Test Suite

### 🧪 BUG-A: Chat Summary Generation

**Bug Description:** Chat summaries should auto-generate after 3 messages and appear on Home page

**Test Steps:**
1. Navigate to **Chat** tab
2. Send message: "Test message 1"
3. Wait for AI response
4. Send message: "Test message 2"
5. Wait for AI response
6. Send message: "Test message 3"
7. Wait for AI response (5 seconds)
8. Navigate to **Home** tab
9. Look at recent chat list

**✅ Pass Criteria:**
- Chat appears with meaningful auto-generated summary
- Summary is NOT "Neuer Chat"
- Summary reflects conversation content

**❌ Fail Criteria:**
- Chat shows "Neuer Chat"
- No summary generated
- Summary is empty or generic

**Screenshot Location:**
- `qa-screenshots/bug-a-home-with-summary.png`

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Notes:**
```
[Your notes here]
```

---

### 🧪 BUG-B: Agent Confirmation Cancel Button

**Bug Description:** "Weiter im Chat" button should cancel agent confirmation and return to chat

**Test Steps:**
1. Navigate to **Chat** tab
2. Type: "Erstelle ein Bild von einem Apfel"
3. Click send button
4. Wait for agent detection (3-5 seconds)
5. Verify agent confirmation modal appears
6. Click **"Weiter im Chat"** button (left button)
7. Verify modal closes
8. Type in chat input: "Test"

**✅ Pass Criteria:**
- Agent confirmation modal appears
- "Weiter im Chat" button is visible and clickable
- Modal closes after clicking button
- Chat input is enabled and accepts text

**❌ Fail Criteria:**
- Modal doesn't close
- Chat input is disabled after cancel
- Button click has no effect

**Screenshot Location:**
- `qa-screenshots/bug-b-before-cancel.png` (before clicking)
- `qa-screenshots/bug-b-after-cancel.png` (after clicking)

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Notes:**
```
[Your notes here]
```

---

### 🧪 BUG-C: Profile Modal Buttons Visibility

**Bug Description:** "Abbrechen" and "Hinzufügen" buttons should be visible in profile characteristic modal

**Test Steps:**
1. Navigate to **Profil** tab
2. Scroll down to "Merkmale" section
3. Click **"Merkmal hinzufügen +"** button
4. Verify modal opens
5. Check bottom of modal for buttons

**✅ Pass Criteria:**
- Modal opens successfully
- "Abbrechen" button is fully visible (not cut off)
- "Hinzufügen" button is fully visible (not cut off)
- Both buttons are within viewport
- Buttons are clickable

**❌ Fail Criteria:**
- Buttons are cut off by viewport edge
- Buttons are hidden behind other elements
- Buttons are below visible area and require scrolling

**Screenshot Location:**
- `qa-screenshots/bug-c-modal-full.png`

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Notes:**
```
[Your notes here]
```

---

### 🧪 BUG-D: Profile Name Save

**Bug Description:** Profile name should save and persist after editing

**Test Steps:**
1. Navigate to **Profil** tab
2. Find name section at top of page
3. Click **pencil icon** (edit button)
4. Clear existing name
5. Type: "QA Test Teacher"
6. Click **checkmark icon** (save button)
7. Verify UI returns to view mode (pencil icon visible)
8. Note the saved name
9. Reload page (F5)
10. Verify name persists

**✅ Pass Criteria:**
- Edit mode activates (input field appears)
- Name can be typed
- Save button works
- UI returns to view mode after save
- Name persists after page reload

**❌ Fail Criteria:**
- Save button doesn't work
- Name reverts to old value
- Name doesn't persist after reload
- Edit mode doesn't exit after save

**Screenshot Location:**
- `qa-screenshots/bug-d-before-save.png` (in edit mode)
- `qa-screenshots/bug-d-after-save.png` (after save)

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Notes:**
```
[Your notes here]
```

---

### 🧪 BUG-E: Image Generation End-to-End

**Bug Description:** Image generation should work from chat → modal → library storage

**Test Steps:**
1. Navigate to **Chat** tab
2. Type: "Erstelle ein Bild von einem Apfel"
3. Click send button
4. Wait for agent detection (3-5 seconds)
5. Click **"Bild-Generierung starten"** button (right button)
6. Verify image generation modal opens
7. Fill form:
   - **Thema:** "Roter Apfel"
   - **Beschreibung:** (optional)
   - **Stil:** (select any)
8. Click **"Bild generieren"** button
9. Wait for generation (up to 60 seconds)
10. Verify image appears in result view
11. Navigate to **Bibliothek** tab
12. Check if generated image appears

**✅ Pass Criteria:**
- Agent detection triggers confirmation modal
- "Bild-Generierung starten" button opens form modal
- Form accepts input
- Image generates successfully (within 60s)
- Generated image appears in chat result
- Image is saved to Bibliothek
- Image is visible in Bibliothek tab

**❌ Fail Criteria:**
- Agent detection fails
- Modal doesn't open
- Image generation fails or times out
- Image doesn't appear in result
- Image not saved to Bibliothek

**Screenshot Location:**
- `qa-screenshots/bug-e-modal.png` (form modal)
- `qa-screenshots/bug-e-result.png` (after generation)
- `qa-screenshots/bug-e-library.png` (Bibliothek tab)

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Notes:**
```
[Your notes here]
```

---

## Console Error Monitoring

While testing, monitor browser console for errors:

**Critical Errors to Report:**
- React errors (red text)
- Network failures (404, 500 errors)
- API timeout errors
- InstantDB errors
- TypeScript errors

**How to Report:**
1. Screenshot console errors
2. Copy error text
3. Note which test triggered the error
4. Include in test notes section

---

## Summary Report Template

After completing all tests, fill out this summary:

### Overall Results
- **Total Tests:** 5
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___

### Failed Tests Details
```
[List failed test IDs and brief reason]

Example:
- BUG-A: Chat summary shows "Neuer Chat" instead of generated summary
- BUG-E: Image generation timeout after 60s
```

### Blockers Encountered
```
[List any blockers that prevented testing]

Example:
- Backend not running
- Cannot sign in to app
- Chat tab not loading
```

### Screenshots Collected
```
[List all screenshots taken with descriptions]

Example:
- bug-a-home-with-summary.png - Shows chat summary on home page
- bug-e-result.png - Image generation result view
```

### Recommendation
```
[ ] READY FOR DEPLOYMENT - All tests passed
[ ] NEEDS FIXES - Some tests failed, fixes required
[ ] BLOCKED - Cannot proceed with testing
```

---

## Next Steps

### If All Tests Pass ✅
1. Create deployment checklist
2. Review backend logs for errors
3. Test in production-like environment
4. Proceed with deployment

### If Tests Fail ❌
1. File bug reports for each failure
2. Prioritize bugs (P0, P1, P2)
3. Fix critical bugs
4. Re-test failed scenarios
5. Update this checklist

### If Tests Blocked 🚫
1. Resolve blockers first
2. Document blocker resolution
3. Re-run full test suite
4. Update blockers section in QA report

---

**Tester Name:** _______________
**Date Completed:** _______________
**Time Spent:** _______________ minutes

**Signature:** _______________
