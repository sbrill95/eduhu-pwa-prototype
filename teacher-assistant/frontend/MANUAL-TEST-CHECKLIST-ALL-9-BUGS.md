# Manual Test Checklist - All 9 Critical Bugs
**Date**: 2025-10-05
**Tester**: s.brill@eduhu.de
**Purpose**: Verify bug fixes after QA automation blocked by auth

---

## Prerequisites

- [ ] Login with magic link (s.brill@eduhu.de)
- [ ] Open browser DevTools Console (F12)
- [ ] Note starting console error count: __________

---

## BUG-001: Homepage Prompt Auto-Submit

### Test Steps
1. [ ] Navigate to Home tab
2. [ ] Click ANY prompt tile (e.g., "Wie plane ich eine Unterrichtsstunde?")
3. [ ] Observe behavior

### Expected Behavior
- [ ] App navigates to Chat tab automatically
- [ ] Message is sent automatically (no manual "Send" click needed)
- [ ] AI response appears within 5-10 seconds
- [ ] Input field is EMPTY (ready for next message)

### Actual Behavior
- Navigation works: ☐ YES / ☐ NO
- Auto-submit works: ☐ YES / ☐ NO
- AI response appears: ☐ YES / ☐ NO
- Input cleared: ☐ YES / ☐ NO

### Status
☐ ✅ WORKING
☐ ❌ BROKEN (describe issue): _______________________

---

## BUG-002: Material Link Navigation

### Test Steps
1. [ ] Navigate to Home tab
2. [ ] Scroll to "Letzte Materialien" section
3. [ ] Click the arrow button "→" or "Alle Materialien anzeigen"
4. [ ] Observe which tab opens

### Expected Behavior
- [ ] App navigates to Library tab
- [ ] "Materialien" (Artifacts) sub-tab is ACTIVE (not "Chats")
- [ ] Material list is visible

### Actual Behavior
- Navigates to Library: ☐ YES / ☐ NO
- Correct sub-tab active: ☐ Materialien / ☐ Chats / ☐ Other
- Materials visible: ☐ YES / ☐ NO

### Status
☐ ✅ WORKING
☐ ❌ BROKEN (describe issue): _______________________

---

## BUG-003: Agent Detection Workflow

### Test Steps
1. [ ] Navigate to Chat tab
2. [ ] Send message: **"Erstelle ein Bild vom Satz des Pythagoras für Klasse 8a"**
3. [ ] Wait 5-10 seconds for response
4. [ ] Observe if Agent Confirmation Message appears

### Expected Behavior
- [ ] Agent Confirmation Message appears (orange design)
- [ ] Two buttons are VISIBLE:
  - [ ] Left button: "Bild-Generierung starten ✨" (orange)
  - [ ] Right button: "Weiter im Chat 💬" (gray)
- [ ] Click "Bild-Generierung starten ✨"
- [ ] Modal opens with Agent Form
- [ ] Form has PREFILLED values:
  - [ ] Thema: "Satz des Pythagoras" or "Pythagoras"
  - [ ] Lerngruppe: "Klasse 8a" or "8a"

### Actual Behavior
- Agent confirmation appears: ☐ YES / ☐ NO
- Start button visible: ☐ YES / ☐ NO
- Chat button visible: ☐ YES / ☐ NO
- Start button clickable: ☐ YES / ☐ NO
- Modal opens: ☐ YES / ☐ NO
- Theme prefilled: ☐ YES / ☐ NO (value: _______)
- Learning group prefilled: ☐ YES / ☐ NO (value: _______)

### Status
☐ ✅ WORKING
☐ ❌ BROKEN (describe issue): _______________________

**Screenshot**: (Take screenshot of confirmation message)

---

## BUG-004: Console Errors

### Test Steps
1. [ ] Open browser DevTools Console (F12)
2. [ ] Reload the page (Ctrl+R or Cmd+R)
3. [ ] Wait 10 seconds
4. [ ] Count total error messages (RED)

### Expected Behavior
- [ ] Total console errors: **~0-20** (minimal)
- [ ] NO repeated 404 errors
- [ ] NO "/api/profile/extract" errors
- [ ] NO "/api/chat/summary" errors
- [ ] NO "/api/teacher-profile/extract" errors

### Actual Behavior
- Total console errors: __________
- Profile extract 404s: ☐ YES / ☐ NO (count: _____)
- Chat summary 404s: ☐ YES / ☐ NO (count: _____)
- Teacher profile 404s: ☐ YES / ☐ NO (count: _____)

### Status
☐ ✅ WORKING (0-20 errors)
☐ ❌ BROKEN (>20 errors or repeated 404s)

**Screenshot**: (Take screenshot of Console tab)

---

## BUG-005: Library Date Formatting

### Test Steps
1. [ ] Navigate to Library tab
2. [ ] Click "Chat-Historie" sub-tab
3. [ ] Observe date format for each chat
4. [ ] Navigate back to Home tab
5. [ ] Scroll to "Letzte Chats" section
6. [ ] Compare date formats

### Expected Behavior
- [ ] Library dates use German relative format:
  - "14:30" for today
  - "Gestern" for yesterday
  - "vor 2 Tagen" for 2 days ago
- [ ] Homepage uses SAME format
- [ ] NO absolute dates like "05.10.2025"

### Actual Behavior (Library)
- Date format: ☐ Relative (German) / ☐ Absolute / ☐ Mixed
- Examples: _______________________

### Actual Behavior (Homepage)
- Date format: ☐ Relative (German) / ☐ Absolute / ☐ Mixed
- Examples: _______________________

### Status
☐ ✅ WORKING (consistent relative dates)
☐ ❌ BROKEN (describe issue): _______________________

---

## BUG-006: Profile - Merkmal hinzufügen

### Test Steps
1. [ ] Navigate to Profil tab
2. [ ] Scroll to "Merkmale" or "Charakteristika" section
3. [ ] Click button "Merkmal hinzufügen" or "+ Hinzufügen"
4. [ ] Observe if modal opens

### Expected Behavior
- [ ] Modal opens
- [ ] Modal has input field for new characteristic
- [ ] Modal has VISIBLE confirmation button:
  - "Hinzufügen" (orange) OR
  - "Bestätigen" (orange) OR
  - "Speichern" (orange)
- [ ] Button is clickable

### Actual Behavior
- Modal opens: ☐ YES / ☐ NO
- Input field exists: ☐ YES / ☐ NO
- Confirmation button exists: ☐ YES / ☐ NO
- Button text: _______________________
- Button clickable: ☐ YES / ☐ NO

### Bonus Test (if button exists)
1. [ ] Enter test value: "Gruppenarbeit"
2. [ ] Click confirmation button
3. [ ] Check if "Gruppenarbeit" appears in tag list

### Status
☐ ✅ WORKING (button exists and works)
☐ ❌ BROKEN (describe issue): _______________________

**Screenshot**: (Take screenshot of modal)

---

## BUG-007: Profile - Name ändern

### Test Steps
1. [ ] Navigate to Profil tab
2. [ ] Find your name at the top
3. [ ] Look for edit icon (pencil) next to name
4. [ ] Click edit icon
5. [ ] Change name to: "QA Test Name"
6. [ ] Click save/confirm button
7. [ ] Reload page (Ctrl+R or Cmd+R)
8. [ ] Check if name persisted

### Expected Behavior
- [ ] Edit icon (pencil) is visible next to name
- [ ] Clicking icon enables inline editing
- [ ] Save/confirm button appears
- [ ] After saving, name changes to "QA Test Name"
- [ ] After reload, name is STILL "QA Test Name"

### Actual Behavior
- Edit icon exists: ☐ YES / ☐ NO
- Inline edit works: ☐ YES / ☐ NO
- Save button exists: ☐ YES / ☐ NO
- Name changes: ☐ YES / ☐ NO
- Name persists after reload: ☐ YES / ☐ NO
- Final name after reload: _______________________

### Status
☐ ✅ WORKING (name persists)
☐ ❌ BROKEN (describe issue): _______________________

**Screenshot**: (Take screenshot before and after reload)

---

## BUG-008: Library - Orange Color

### Test Steps
1. [ ] Navigate to Library tab
2. [ ] Observe active tab color
3. [ ] Click between "Chat-Historie" and "Materialien" tabs
4. [ ] Observe tab indicator color

### Expected Behavior
- [ ] Active tab uses ORANGE color (#FB6542)
- [ ] NOT blue (#4A90E2 or similar)
- [ ] Tab indicator/underline is orange
- [ ] Selected filter chips are orange

### Actual Behavior
- Active tab color: ☐ Orange / ☐ Blue / ☐ Other: _______
- Tab indicator color: ☐ Orange / ☐ Blue / ☐ Other: _______
- Matches app theme (Gemini orange): ☐ YES / ☐ NO

### Status
☐ ✅ WORKING (orange everywhere)
☐ ❌ BROKEN (describe issue): _______________________

**Screenshot**: (Take screenshot showing tab colors)

---

## BUG-009: Chat Tagging (DISABLED)

### Test Steps
1. [ ] Open browser DevTools Console (F12)
2. [ ] Navigate to Library tab
3. [ ] Click "Chat-Historie" sub-tab
4. [ ] Wait 10 seconds
5. [ ] Count console errors

### Expected Behavior
- [ ] NO infinite loop (console doesn't flood with errors)
- [ ] NO repeated 404 errors to "/api/chat/:chatId/tags"
- [ ] Console error count does NOT increase rapidly
- [ ] Chats may NOT have tags displayed (feature disabled)

### Actual Behavior
- Console errors after 10 seconds: ☐ 0-5 / ☐ 5-20 / ☐ >20
- Infinite loop detected: ☐ YES / ☐ NO
- Chat tag 404 errors: ☐ YES / ☐ NO (count: _____)
- Tags visible on chats: ☐ YES / ☐ NO

### Status
☐ ✅ WORKING (no infinite loop)
☐ ❌ BROKEN (infinite loop detected)

---

## BUG-010: Image Generation Workflow (Combined)

### Test Steps
1. [ ] Navigate to Chat tab
2. [ ] Send message: **"Erstelle ein Bild von einem Apfel"**
3. [ ] Wait for Agent Confirmation Message
4. [ ] Check all workflow steps

### Expected Behavior
- [ ] Agent Confirmation appears
- [ ] Start button ("Bild-Generierung starten ✨") is VISIBLE
- [ ] Chat button ("Weiter im Chat 💬") is VISIBLE
- [ ] Start button is CLICKABLE (not disabled)
- [ ] Chat button is CLICKABLE (not disabled)
- [ ] Clicking Start button opens modal
- [ ] Clicking Chat button continues chat

### Actual Behavior
- Confirmation appears: ☐ YES / ☐ NO
- Start button visible: ☐ YES / ☐ NO
- Chat button visible: ☐ YES / ☐ NO
- Start button clickable: ☐ YES / ☐ NO
- Chat button clickable: ☐ YES / ☐ NO
- Modal opens on click: ☐ YES / ☐ NO
- Chat continues on click: ☐ YES / ☐ NO

### Bonus: Text Extraction Test
- [ ] Theme extracted: ☐ YES / ☐ NO (value: _______)
- [ ] Modal has "Apfel" or "einem Apfel" in theme field: ☐ YES / ☐ NO

### Status
☐ ✅ WORKING (full workflow works)
☐ ❌ BROKEN (describe issue): _______________________

---

## Summary Report

### Bugs Working ✅
(List bug numbers that passed)

### Bugs Broken ❌
(List bug numbers that failed with brief description)

### Console Error Count
- Initial (after login): __________
- After all tests: __________
- Difference: __________

### Overall Assessment
☐ All bugs fixed - ready for deployment
☐ Some bugs still broken - need fixes
☐ Major issues found - require immediate attention

---

## Screenshots to Provide

Please attach:
1. BUG-003: Agent confirmation message
2. BUG-004: Browser console (showing error count)
3. BUG-006: Profile "Merkmal hinzufügen" modal
4. BUG-007: Profile name before/after reload
5. BUG-008: Library tab showing orange color
6. BUG-010: Full image generation workflow

---

## Next Steps

1. Complete this checklist manually
2. Share results with QA agent
3. QA agent will create fix plan for broken bugs
4. Developers will implement fixes
5. Re-test until all bugs pass

---

**Manual Testing Date**: __________
**Tester**: s.brill@eduhu.de
**Completion Time**: __________ minutes
