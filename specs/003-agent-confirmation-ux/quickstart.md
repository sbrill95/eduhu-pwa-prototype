# Manual Testing Guide: Agent Confirmation UX + Auto-Tagging

**Feature**: `003-agent-confirmation-ux`
**Phase**: 1 (Design) - QA Preparation
**Date**: 2025-10-14

## Overview

This document provides step-by-step manual test procedures for all 6 user stories in the Agent Confirmation UX feature. Each test is designed to be executed independently and includes expected vs actual results.

## Prerequisites

**Before Testing**:
1. Backend server running on `http://localhost:3006`
2. Frontend dev server running on `http://localhost:5173`
3. Logged in as test user with existing InstantDB account
4. Browser DevTools open (Console + Network tabs)
5. OpenAI API key configured in backend `.env`

**Test Data Required**:
- At least 1 existing chat session with 3+ messages
- At least 1 generated image in library (for regeneration tests)

---

## User Story 1: Agent Confirmation Card Visibility (P1 MVP)

### Test 1.1 - Gradient Background Visibility

**Objective**: Verify Agent Confirmation Card has visible orange gradient background

**Steps**:
1. Navigate to Chat tab
2. Type message: "Erstelle ein Bild von einem Löwen für Biologieunterricht"
3. Send message
4. Wait for AI response with agent suggestion
5. Observe Agent Confirmation Card rendering

**Expected Results**:
- ✅ Card has visible orange gradient background (from-primary-50 to-primary-100)
- ✅ Card has orange border (border-primary-500, 2px)
- ✅ Card has shadow for depth (shadow-lg)
- ✅ Card stands out from white chat background
- ✅ Text inside card is readable (sufficient contrast)

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Notes: _______________

**Visual Reference**:
```
┌─────────────────────────────────┐
│  ╭─────────────────────────╮    │ ← Orange gradient
│  │ Agent Confirmation      │    │   (visible against white)
│  │ ────────────────────────│    │
│  │ Reasoning text...       │    │ ← Dark text (good contrast)
│  │                         │    │
│  │ [Bild-Generierung]     │    │ ← Orange button (primary-600)
│  │ [Weiter im Chat]       │    │ ← Gray button (gray-100)
│  ╰─────────────────────────╯    │
└─────────────────────────────────┘
```

---

### Test 1.2 - Button Contrast and Visibility

**Objective**: Verify both buttons are clearly visible and readable

**Steps**:
1. Continue from Test 1.1 (Agent Confirmation Card visible)
2. Locate "Bild-Generierung starten" button
3. Locate "Weiter im Chat" button
4. Check button text readability
5. Check button hover states

**Expected Results**:
- ✅ Primary button ("Bild-Generierung starten"):
  - Orange background (bg-primary-600)
  - White text (text-white)
  - Ring effect (ring-2 ring-white ring-offset-2)
  - Shadow (shadow-md)
  - Hover darkens (hover:bg-primary-700)
- ✅ Secondary button ("Weiter im Chat"):
  - Gray background (bg-gray-100)
  - Dark text (text-gray-700)
  - No ring
  - Hover lightens (hover:bg-gray-200)
- ✅ Both buttons are touch-friendly (height: 48px+)
- ✅ Buttons stack vertically on mobile (<640px width)

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Notes: _______________

---

### Test 1.3 - WCAG Contrast Compliance

**Objective**: Verify text contrast meets WCAG AA standards (4.5:1 minimum)

**Steps**:
1. Open browser DevTools → Inspect Agent Confirmation Card
2. Use contrast checker tool (e.g., https://webaim.org/resources/contrastchecker/)
3. Test text colors against background:
   - Reasoning text color vs gradient background
   - Button text vs button background

**Expected Results**:
- ✅ Reasoning text (text-gray-700) on gradient: ≥4.5:1 contrast ratio
- ✅ Primary button (white text on primary-600): ≥4.5:1 contrast ratio
- ✅ Secondary button (gray-700 text on gray-100): ≥4.5:1 contrast ratio

**Actual Results**: _(Fill after testing)_
- Reasoning text contrast: _____ (pass/fail)
- Primary button contrast: _____ (pass/fail)
- Secondary button contrast: _____ (pass/fail)

---

### Test 1.4 - Mobile Responsive Layout

**Objective**: Verify card and buttons adapt correctly on mobile viewports

**Steps**:
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select "iPhone 12 Pro" preset (390x844px)
3. Navigate to chat with agent suggestion
4. Observe card layout and button stacking

**Expected Results**:
- ✅ Card scales to viewport width (responsive)
- ✅ Buttons stack vertically (flex-col on sm breakpoint)
- ✅ Primary button appears first (top)
- ✅ Secondary button appears second (bottom)
- ✅ No horizontal scroll required
- ✅ Text wraps correctly (no overflow)

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Notes: _______________

---

## User Story 2: Library Navigation with MaterialId (P1 MVP)

### Test 2.1 - Navigate to Library After Image Creation

**Objective**: Verify "Weiter im Chat" button navigates to Library tab

**Steps**:
1. Generate image via agent (complete User Story 1 flow)
2. Wait for AgentResultView to appear
3. Click "Weiter im Chat" button in AgentResultView
4. Observe tab change

**Expected Results**:
- ✅ Tab changes from Chat to Library
- ✅ Library tab becomes active (orange highlight)
- ✅ Library content loads
- ✅ Materials tab (not Chats tab) is selected
- ✅ Console log shows: `[Library] Received navigate-library-tab event`

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Console output: _______________

---

### Test 2.2 - MaterialPreviewModal Auto-Opens

**Objective**: Verify modal opens automatically with newly created image

**Steps**:
1. Continue from Test 2.1 (Library tab active)
2. Wait 500ms for event processing
3. Observe modal state

**Expected Results**:
- ✅ MaterialPreviewModal is open (isOpen=true)
- ✅ Modal shows the newly created image (full size)
- ✅ Modal title matches image description
- ✅ Modal displays:
  - Image preview (large)
  - Title (editable)
  - Metadata (Type, Source, Date, Agent)
  - Action buttons (Regenerieren, Download, Favorite, Share, Delete)
- ✅ "Regenerieren" button is visible (source: agent-generated)

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Modal opened: Yes / No
- Image displayed: Yes / No
- Buttons visible: _______________

---

### Test 2.3 - Modal Content Rendering

**Objective**: Verify all modal content renders correctly (US4 integration)

**Steps**:
1. Continue from Test 2.2 (Modal open)
2. Scroll through modal content
3. Verify each section

**Expected Results**:
- ✅ Image preview section:
  - Image loads successfully (not broken)
  - Image scales to fit modal width
  - Proxy URL used (getProxiedImageUrl)
- ✅ Metadata section:
  - Type: "image"
  - Source: "KI-generiert"
  - Date: Today's date (German format)
  - Agent: "Bildgenerierung"
- ✅ Action buttons section:
  - "Neu generieren" button (blue, secondary)
  - "Download" button (primary)
  - "Als Favorit" button (outline)
  - "Teilen" button (outline)
  - "Löschen" button (danger, outline)

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Missing elements: _______________

---

### Test 2.4 - Custom Event Firing

**Objective**: Verify navigate-library-tab event fires correctly with materialId

**Steps**:
1. Open DevTools Console
2. Add event listener:
   ```javascript
   window.addEventListener('navigate-library-tab', (e) => {
     console.log('Event received:', e.detail);
   });
   ```
3. Generate image and click "Weiter im Chat"
4. Check console output

**Expected Results**:
- ✅ Event fires within 100ms of button click
- ✅ Event detail contains:
  ```json
  {
    "tab": "materials",
    "materialId": "[UUID]",
    "source": "AgentResultView"
  }
  ```
- ✅ materialId matches newly created material ID

**Actual Results**: _(Fill after testing)_
- Event detail: _______________

---

## User Story 3: Image in Chat History (P1 MVP)

### Test 3.1 - Image Appears as Thumbnail

**Objective**: Verify generated image appears in chat history

**Steps**:
1. Generate image via agent workflow
2. After image creation, navigate to Chat tab
3. Scroll to bottom of chat history
4. Locate image message

**Expected Results**:
- ✅ Image message visible in chat
- ✅ Message has thumbnail (not just text)
- ✅ Thumbnail shows actual image content
- ✅ Caption/title displayed below thumbnail
- ✅ Message role is "assistant"
- ✅ Thumbnail is clickable (cursor: pointer)

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Thumbnail visible: Yes / No
- Notes: _______________

---

### Test 3.2 - Chat Session Persistence

**Objective**: Verify chat session ID remains constant before/after agent

**Steps**:
1. Start new chat, type 3 messages
2. Check sessionId in DevTools:
   ```javascript
   // In ChatView component
   console.log('Session ID:', currentSessionId);
   ```
3. Trigger image agent, generate image
4. Check sessionId again after image creation
5. Compare IDs

**Expected Results**:
- ✅ sessionId is same before and after agent workflow
- ✅ All messages have same session link
- ✅ message_index increments sequentially (no gaps)
- ✅ No new chat_sessions entry created

**Actual Results**: _(Fill after testing)_
- sessionId before: _______________
- sessionId after: _______________
- [ ] SAME / [ ] DIFFERENT

**InstantDB Query Verification**:
```javascript
// Run in DevTools Console
const { data } = await db.useQuery({
  messages: {
    $: {
      where: { 'session.id': 'YOUR_SESSION_ID' },
      order: { message_index: 'asc' }
    }
  }
});
console.log('Message indices:', data.messages.map(m => m.message_index));
```

---

### Test 3.3 - Vision Context Works

**Objective**: Verify AI can analyze image in chat history

**Steps**:
1. After image appears in chat (Test 3.1)
2. Type message: "Was zeigt das Bild?"
3. Send message
4. Wait for AI response

**Expected Results**:
- ✅ AI response describes image content (not generic)
- ✅ Response demonstrates vision analysis:
  - Mentions specific visual elements (e.g., "Löwe", "Anatomie")
  - Describes colors, style, perspective
  - Shows understanding of image context
- ✅ Backend logs show vision API call:
  ```
  [Chat] Building messages with vision context
  [OpenAI] Sending image_url to GPT-4o
  ```

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- AI response: _______________
- Vision analysis quality: Good / Medium / Poor

---

### Test 3.4 - Chat History Completeness

**Objective**: Verify no messages are lost during agent workflow

**Steps**:
1. Start chat with 5 messages
2. Generate image (6th message = agent confirmation, 7th = image result)
3. Type 2 more messages (8th, 9th)
4. Scroll to top of chat
5. Count all messages

**Expected Results**:
- ✅ Total 9 messages visible
- ✅ Messages in correct order (1-9)
- ✅ No messages missing or duplicated
- ✅ Scroll position preserved
- ✅ message_index sequence: [0, 1, 2, 3, 4, 5, 6, 7, 8]

**Actual Results**: _(Fill after testing)_
- Total messages visible: _____
- Missing messages: _____
- Duplicate messages: _____

---

## User Story 4: MaterialPreviewModal Content (P2)

### Test 4.1 - Full Image Preview Rendering

**Objective**: Verify modal shows full image, not just title

**Steps**:
1. Open Library → Materials tab
2. Click on any image material card
3. Observe modal content

**Expected Results**:
- ✅ Modal opens successfully
- ✅ Large image preview visible (not placeholder)
- ✅ Image scales to modal width (responsive)
- ✅ Image aspect ratio preserved
- ✅ Title displayed above/below image
- ✅ Metadata section visible below image

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Image loaded: Yes / No
- Image URL: _______________

---

### Test 4.2 - Metadata Section Display

**Objective**: Verify all metadata fields render correctly

**Steps**:
1. Continue from Test 4.1 (Modal open)
2. Scroll to metadata section
3. Check each field

**Expected Results**:
- ✅ Type field: "image" (correct icon)
- ✅ Source field: "KI-generiert" (correct label)
- ✅ Date field: German format (DD.MM.YYYY)
- ✅ Agent field: "Bildgenerierung" (if agent-generated)
- ✅ All fields have labels (h3 tags)
- ✅ No "undefined" or "null" displayed

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Missing fields: _______________

---

### Test 4.3 - Action Buttons Functionality

**Objective**: Verify all action buttons work correctly

**Steps**:
1. Continue from Test 4.1 (Modal open with image)
2. Test each button:
   - **Regenerieren**: Click → Verify AgentFormView opens with prefilled data
   - **Download**: Click → Verify file downloads
   - **Favorit**: Click → Verify icon toggles (heart outline ↔ filled heart)
   - **Teilen**: Click → Verify share dialog (or log if not implemented)
   - **Löschen**: Click → Verify delete confirmation alert

**Expected Results**:
- ✅ Regenerieren:
  - Modal closes
  - AgentFormView opens
  - Form prefilled with originalParams (description, style)
- ✅ Download:
  - File downloads with correct filename
  - Image opens in new tab (fallback)
- ✅ Favorit:
  - Icon toggles immediately
  - InstantDB updated (is_favorite: true/false)
- ✅ Löschen:
  - Alert appears with confirmation
  - "Abbrechen" closes alert
  - "Löschen" removes material and closes modal

**Actual Results**: _(Fill after testing)_
- Regenerieren: [ ] PASS / [ ] FAIL
- Download: [ ] PASS / [ ] FAIL
- Favorit: [ ] PASS / [ ] FAIL
- Löschen: [ ] PASS / [ ] FAIL

---

### Test 4.4 - Modal Scroll on Mobile

**Objective**: Verify modal is scrollable when content overflows viewport

**Steps**:
1. Open DevTools → Device toolbar (iPhone 12 Pro)
2. Open MaterialPreviewModal with image
3. Attempt to scroll modal content
4. Verify all buttons are reachable

**Expected Results**:
- ✅ Modal content is scrollable (no fixed height)
- ✅ Image scales down on mobile (max-width: 100%)
- ✅ Action buttons visible at bottom (after scroll)
- ✅ Close button (X) always visible (fixed header)
- ✅ No content cut off or unreachable

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Scrollable: Yes / No
- Notes: _______________

---

## User Story 5: Automatic Image Tagging (P2)

### Test 5.1 - Tags Generated After Image Creation

**Objective**: Verify Vision API is called automatically for new images

**Steps**:
1. Generate new image via agent
2. Wait 5 seconds after image saved to library
3. Check backend logs for Vision API call
4. Query InstantDB for material metadata

**Expected Results**:
- ✅ Backend logs show:
  ```
  [Vision] Tagging image: <imageUrl>
  [OpenAI] Vision API request sent
  [Vision] Generated tags: ["anatomie", "biologie", ...]
  [InstantDB] Updated material metadata with tags
  ```
- ✅ InstantDB material record updated:
  ```json
  {
    "metadata": {
      "tags": ["anatomie", "biologie", "löwe", ...],
      "tagging": {
        "generatedAt": 1697123456789,
        "model": "gpt-4o",
        "confidence": "high"
      }
    }
  }
  ```
- ✅ 5-10 tags generated (max 15)
- ✅ All tags lowercase
- ✅ No duplicate tags

**Actual Results**: _(Fill after testing)_
- Vision API called: Yes / No
- Tags generated: _______________
- Tag count: _____

**InstantDB Query**:
```javascript
const { data } = await db.useQuery({
  library_materials: {
    $: { where: { id: 'YOUR_MATERIAL_ID' } }
  }
});
const metadata = JSON.parse(data.library_materials[0].metadata);
console.log('Tags:', metadata.tags);
```

---

### Test 5.2 - Tag-Based Search Works

**Objective**: Verify Library search finds materials by tags

**Steps**:
1. After tags generated (Test 5.1)
2. Go to Library → Materials tab
3. Search for one of the generated tags (e.g., "anatomie")
4. Observe search results

**Expected Results**:
- ✅ Material appears in search results
- ✅ Search matches tags even if tag not in title
- ✅ Search is case-insensitive (works for "Anatomie" and "anatomie")
- ✅ Multiple materials with same tag all appear

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Search query: _______________
- Results count: _____

---

### Test 5.3 - Tags NOT Visible in UI

**Objective**: Verify tags are used for search but not displayed to user

**Steps**:
1. Open MaterialPreviewModal with tagged image
2. Check all sections (image, metadata, buttons)
3. Look for tags display

**Expected Results**:
- ✅ Tags are NOT visible in modal
- ✅ No "Tags:" section in metadata
- ✅ No tag chips/badges displayed
- ✅ Tags only used internally for search

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Tags visible: Yes / No (should be No)

---

### Test 5.4 - Graceful Degradation on Tagging Failure

**Objective**: Verify image is saved even if tagging fails

**Steps**:
1. Disable Vision API (temporarily remove OpenAI key)
2. Generate image via agent
3. Verify image is still saved to library

**Expected Results**:
- ✅ Image generation completes successfully
- ✅ Material saved to InstantDB
- ✅ Material appears in Library
- ✅ Metadata has empty tags: `"tags": []`
- ✅ Backend logs error but continues:
  ```
  [Vision] Tagging failed: OpenAI API error
  [Vision] Continuing without tags (graceful degradation)
  ```
- ✅ No user-facing error displayed

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Image saved: Yes / No
- Error logged: _______________

---

## User Story 6: Chat Session Persistence (P2)

### Test 6.1 - Session ID Remains Constant

**Objective**: Verify sessionId doesn't change during agent workflow

**Steps**:
1. Start chat, note sessionId (from DevTools):
   ```javascript
   console.log('Initial sessionId:', currentSessionId);
   ```
2. Send 3 messages
3. Trigger agent, generate image
4. Note sessionId after agent completes:
   ```javascript
   console.log('Final sessionId:', currentSessionId);
   ```

**Expected Results**:
- ✅ sessionId is identical before and after
- ✅ Console shows: `Initial sessionId === Final sessionId`

**Actual Results**: _(Fill after testing)_
- Initial sessionId: _______________
- Final sessionId: _______________
- [ ] SAME / [ ] DIFFERENT

---

### Test 6.2 - Message History Preserved

**Objective**: Verify no messages are lost during agent workflow

**Steps**:
1. Start chat with 5 user messages
2. Trigger agent
3. Generate image
4. Scroll to top of chat
5. Count messages

**Expected Results**:
- ✅ All 5 original messages visible
- ✅ Agent confirmation message visible (6th)
- ✅ Image result message visible (7th)
- ✅ Total: 7 messages minimum
- ✅ No gaps or missing messages

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Total messages: _____
- Missing messages: _____

---

### Test 6.3 - New Messages Append Correctly

**Objective**: Verify messages continue sequentially after agent

**Steps**:
1. After agent completes (session persisted)
2. Type new message: "Danke!"
3. Send message
4. Type another: "Noch eine Frage..."
5. Send message
6. Check message_index values

**Expected Results**:
- ✅ New messages append to same session
- ✅ message_index increments correctly:
  - Before agent: [0, 1, 2, 3, 4]
  - Agent messages: [5, 6]
  - After agent: [7, 8]
- ✅ No index gaps or resets

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Message indices: _______________

---

## Edge Cases Testing

### Edge Case 1: Vision API Timeout

**Objective**: Verify timeout handling doesn't block image creation

**Steps**:
1. Generate image (trigger Vision API call)
2. Simulate slow Vision API (backend timeout >30s)
3. Verify image is still saved

**Expected Results**:
- ✅ Image saved to library within 5 seconds
- ✅ Tagging skipped after 30s timeout
- ✅ Backend logs: `[Vision] API timeout, skipping tags`
- ✅ Material has empty tags

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL

---

### Edge Case 2: Duplicate Tags

**Objective**: Verify duplicate tags are filtered

**Steps**:
1. Mock Vision API to return duplicates:
   ```json
   ["biologie", "Biologie", "BIOLOGIE", "biologie"]
   ```
2. Generate image
3. Check saved tags

**Expected Results**:
- ✅ Duplicates removed
- ✅ Only one "biologie" tag saved
- ✅ Normalized to lowercase

**Actual Results**: _(Fill after testing)_
- Saved tags: _______________

---

### Edge Case 3: No sessionId Provided

**Objective**: Verify graceful fallback when sessionId missing

**Steps**:
1. Manually open AgentFormView without sessionId
2. Generate image
3. Check if new session created

**Expected Results**:
- ✅ New session created automatically
- ✅ Message added to new session
- ✅ No error displayed
- ✅ Backend logs: `[Message] No sessionId, creating new session`

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- New session created: Yes / No

---

### Edge Case 4: Concurrent Agent Starts

**Objective**: Verify debouncing prevents duplicate agent modals

**Steps**:
1. Agent confirmation appears
2. Click "Bild-Generierung starten" button rapidly (3x fast clicks)
3. Observe modal state

**Expected Results**:
- ✅ Only ONE modal opens
- ✅ No duplicate requests sent
- ✅ Button disabled after first click (briefly)

**Actual Results**: _(Fill after testing)_
- [ ] PASS / [ ] FAIL
- Modals opened: _____

---

## Test Summary Template

**Date Tested**: _______________
**Tester**: _______________
**Browser**: _______________
**Environment**: Dev / Staging / Production

### Results Overview

| User Story | Test ID | Status | Notes |
|------------|---------|--------|-------|
| US1 (P1) | 1.1 | ⬜ PASS / ⬜ FAIL | ____________ |
| US1 (P1) | 1.2 | ⬜ PASS / ⬜ FAIL | ____________ |
| US1 (P1) | 1.3 | ⬜ PASS / ⬜ FAIL | ____________ |
| US1 (P1) | 1.4 | ⬜ PASS / ⬜ FAIL | ____________ |
| US2 (P1) | 2.1 | ⬜ PASS / ⬜ FAIL | ____________ |
| US2 (P1) | 2.2 | ⬜ PASS / ⬜ FAIL | ____________ |
| US2 (P1) | 2.3 | ⬜ PASS / ⬜ FAIL | ____________ |
| US2 (P1) | 2.4 | ⬜ PASS / ⬜ FAIL | ____________ |
| US3 (P1) | 3.1 | ⬜ PASS / ⬜ FAIL | ____________ |
| US3 (P1) | 3.2 | ⬜ PASS / ⬜ FAIL | ____________ |
| US3 (P1) | 3.3 | ⬜ PASS / ⬜ FAIL | ____________ |
| US3 (P1) | 3.4 | ⬜ PASS / ⬜ FAIL | ____________ |
| US4 (P2) | 4.1 | ⬜ PASS / ⬜ FAIL | ____________ |
| US4 (P2) | 4.2 | ⬜ PASS / ⬜ FAIL | ____________ |
| US4 (P2) | 4.3 | ⬜ PASS / ⬜ FAIL | ____________ |
| US4 (P2) | 4.4 | ⬜ PASS / ⬜ FAIL | ____________ |
| US5 (P2) | 5.1 | ⬜ PASS / ⬜ FAIL | ____________ |
| US5 (P2) | 5.2 | ⬜ PASS / ⬜ FAIL | ____________ |
| US5 (P2) | 5.3 | ⬜ PASS / ⬜ FAIL | ____________ |
| US5 (P2) | 5.4 | ⬜ PASS / ⬜ FAIL | ____________ |
| US6 (P2) | 6.1 | ⬜ PASS / ⬜ FAIL | ____________ |
| US6 (P2) | 6.2 | ⬜ PASS / ⬜ FAIL | ____________ |
| US6 (P2) | 6.3 | ⬜ PASS / ⬜ FAIL | ____________ |
| Edge Cases | EC1 | ⬜ PASS / ⬜ FAIL | ____________ |
| Edge Cases | EC2 | ⬜ PASS / ⬜ FAIL | ____________ |
| Edge Cases | EC3 | ⬜ PASS / ⬜ FAIL | ____________ |
| Edge Cases | EC4 | ⬜ PASS / ⬜ FAIL | ____________ |

### Pass Rate
- P1 Tests: _____ / 12 (______%)
- P2 Tests: _____ / 11 (______%)
- Edge Cases: _____ / 4 (______%)
- **Overall**: _____ / 27 (______%)

### Blockers
_(List any critical issues that prevent feature release)_

### Known Issues
_(List non-critical issues for backlog)_

### Screenshots
_(Attach screenshots of key scenarios: Agent Confirmation Card, MaterialPreviewModal, Chat with image)_

---

## References

- Feature Spec: `specs/003-agent-confirmation-ux/spec.md`
- Data Model: `specs/003-agent-confirmation-ux/data-model.md`
- API Contracts: `specs/003-agent-confirmation-ux/contracts/`
- Research Decisions: `specs/003-agent-confirmation-ux/research.md`
