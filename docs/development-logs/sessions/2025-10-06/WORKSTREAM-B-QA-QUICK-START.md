# Workstream B - QA Quick Start Guide

**Purpose**: Fast manual testing of Workstream B changes
**Time Required**: 15 minutes
**Status**: Ready for QA

---

## Setup

1. Start backend: `cd teacher-assistant/backend && npm run dev`
2. Start frontend: `cd teacher-assistant/frontend && npm run dev`
3. Open app: `http://localhost:5173`
4. Login with test account

---

## Test B.1: Chat Summary on Home (2 min)

**Expected**: Chat summaries display on Home view

### Steps:
1. Navigate to Chat tab
2. Send 3 messages:
   - "Hallo"
   - "Ich brauche Hilfe"
   - "Erstelle einen Stundenplan"
3. Navigate to Home tab
4. Check "Letzte Chats" section

**Pass Criteria**:
- ✅ Chat shows summary (e.g., "Stundenplanung Hilfe")
- ✅ NOT showing "Neuer Chat" (summary was generated)
- ✅ No console errors

**Fail Criteria**:
- ❌ Shows "Neuer Chat" (summary not generated)
- ❌ Red error in console: `404 /api/chat/summary`

---

## Test B.2: Auto-Submit Prompt Tiles (3 min)

**Expected**: Prompt tiles create NEW chat + auto-submit

### Steps:
1. Navigate to Home tab
2. Note current chat count (e.g., 3 chats)
3. Click prompt tile: "Erstelle mir einen Stundenplan für Mathematik Klasse 7"
4. Wait 1 second

**Pass Criteria**:
- ✅ Navigates to Chat tab
- ✅ Empty chat history (NEW chat created)
- ✅ Prompt auto-submitted within 1 second
- ✅ AI response appears
- ✅ Navigate to Home → chat count increased by 1

**Fail Criteria**:
- ❌ Prompt appended to EXISTING chat (shows old messages)
- ❌ Prompt NOT auto-submitted (just prefilled in input)
- ❌ Chat count did NOT increase (no new chat created)

---

## Test B.3: Image Display in Chat (5 min)

**Expected**: Images display with click-to-preview

### Steps:
1. Navigate to Chat tab
2. Send: "Erstelle ein Bild von einem Löwen für den Biologie-Unterricht"
3. Wait for image generation (~10 seconds)
4. Verify image appears
5. Click image
6. Verify modal opens
7. Close modal

**Pass Criteria**:
- ✅ Image appears as thumbnail in chat message
- ✅ Image max-width ~300px
- ✅ Hover shows scale effect
- ✅ Click opens MaterialPreviewModal
- ✅ Modal shows full-size image
- ✅ Caption/description visible
- ✅ Close button works

**Fail Criteria**:
- ❌ Broken image icon
- ❌ No image displayed (just text)
- ❌ Click does nothing
- ❌ Modal doesn't open

---

## Test B.4: Image Awareness in Chat (5 min)

**Expected**: AI can reference previously generated images

### Steps:
1. Continue from Test B.3 (image of lion generated)
2. Send follow-up question: "Was zeigt das Bild?"
3. Wait for AI response
4. Send: "Kannst du das Bild beschreiben?"
5. Wait for AI response

**Pass Criteria**:
- ✅ AI references image content (e.g., "Das Bild zeigt einen Löwen...")
- ✅ AI uses image description in response
- ✅ AI doesn't say "Ich kann keine Bilder sehen"
- ✅ Follow-up works: "Kannst du das Bild beschreiben?" gets relevant answer

**Fail Criteria**:
- ❌ AI says "Ich kann das Bild nicht sehen"
- ❌ AI responds generically (no image context)
- ❌ Error in console about metadata parsing

---

## Browser Console Checks

**Open DevTools**: F12 → Console tab

### Expected Console Logs (GOOD):
```
[ChatView] Setting prefilled prompt: Erstelle mir einen...
[ChatView] Auto-submitting prefilled prompt
[useChat] Backend returned agentSuggestion
[ChatView] ✅ IMAGE DETECTED: {...}
[useChat] Failed to parse message metadata for image awareness (WARN - OK if occasional)
```

### BAD Console Errors (FAIL):
```
❌ 404 /api/chat/summary
❌ Failed to send message
❌ TypeError: Cannot read property 'metadata' of undefined
❌ Uncaught Error: Invalid message format
```

---

## Quick Debug Commands

### Check Backend Routes:
```bash
curl http://localhost:3006/api/health
# Should return: {"status":"healthy"}

curl -X POST http://localhost:3006/api/chat/summary \
  -H "Content-Type: application/json" \
  -d '{"chatId":"test-123","messages":[{"role":"user","content":"test"}]}'
# Should NOT return: 404
```

### Check Frontend Build:
```bash
cd teacher-assistant/frontend
npm run build
# Should complete without errors
```

---

## Success Summary

**All tests PASS** if:
- ✅ B.1: Chat summaries display
- ✅ B.2: Prompt tiles create NEW chat + auto-submit
- ✅ B.3: Images display and preview modal works
- ✅ B.4: AI can reference images in follow-up

**Any test FAILS** if:
- ❌ 404 errors in console
- ❌ Prompt appends to existing chat
- ❌ Images don't display
- ❌ AI can't reference images

---

**Estimated Total Time**: 15 minutes
**Pass Rate Target**: 100% (4/4 tests)
