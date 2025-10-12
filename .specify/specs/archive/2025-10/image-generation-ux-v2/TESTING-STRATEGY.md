# Testing Strategy - Image Generation UX V2

**Status**: Ready for Implementation | **Priority**: P0

## Warum dieser Test-Plan?

Basierend auf **PM-Analysis-Brutal-Honest.md** und **ROOT-CAUSE-ANALYSIS-WHY-WE-FAIL.md** haben wir gelernt:

### ❌ Was in der Vergangenheit schiefging:
1. **E2E Tests broken** → Features konnten nicht verified werden
2. **TypeScript Errors ignored** → Code committed trotz Build-Fehler
3. **Partial Implementation** → Tasks als ✅ markiert ohne "Definition of Done"
4. **Quick-Fix Kultur** → Symptome behandelt, Root Cause bleibt
5. **Field Name Mismatches** → Frontend ↔ Backend Diskrepanzen unbemerkt
6. **No Integration Verification** → Komponenten isoliert OK, zusammen broken

### ✅ Was wir DIESMAL anders machen:

1. **BACKEND MUSS STARTEN** → Kein Code ohne laufenden Server
2. **BUILD MUSS PASSEN** → TypeScript 0 Errors PFLICHT
3. **MANUAL E2E VERIFICATION** → Jeder Task manuell getestet (bis E2E Tests fixed)
4. **SCREENSHOTS ALS PROOF** → Visueller Beweis dass Feature funktioniert
5. **DEFINITION OF DONE** → Task nur ✅ wenn ALLE Kriterien erfüllt

---

## 3-Stufen Verification System

### Stufe 1: PRE-FLIGHT CHECKS (Vor jedem Task)
**MUSS erfüllt sein BEVOR Task gestartet wird**

```bash
# Check 1: Backend startet
cd teacher-assistant/backend
npm run dev
# → Server MUSS starten ohne Errors
# → Console zeigt: "Server running on http://localhost:3006"
# → KEIN TypeScript-Fehler

# Check 2: Frontend compiles
cd teacher-assistant/frontend
npm run build
# → Build MUSS durchlaufen
# → 0 TypeScript Errors
# → Output: "✓ built in XXXms"

# Check 3: Frontend startet
npm run dev
# → Server MUSS starten
# → http://localhost:5173 erreichbar
```

**WENN einer dieser Checks fehlschlägt**:
→ STOPP! Task NICHT starten
→ Fix Pre-Flight Issue FIRST
→ Erst wenn alle 3 Checks ✅ → Task beginnen

---

### Stufe 2: TASK-LEVEL VERIFICATION (Pro Task)

Jeder Task aus `tasks.md` hat **4 Verification Gates**:

#### Gate 1: TypeScript Clean
```bash
# Nach Code-Änderungen
npm run build -- --mode development

# MUST OUTPUT:
# ✓ X modules transformed
# ✓ built in XXXms
# NO TypeScript errors

# IF errors appear:
# → FIX immediately
# → DO NOT continue to next gate
```

#### Gate 2: Backend Test (wenn Backend geändert)
```bash
# Test Backend Endpoint
curl -X POST http://localhost:3006/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Erstelle ein Bild vom Pythagoras"}],
    "userId": "test-user-123"
  }'

# MUST RETURN:
# {
#   "success": true,
#   "data": {
#     "message": "...",
#     "agentSuggestion": {  ← CHECK THIS EXISTS
#       "agentType": "image-generation",
#       "reasoning": "...",
#       "prefillData": {
#         "description": "..."  ← CHECK FIELD NAME
#       }
#     }
#   }
# }
```

#### Gate 3: Manual E2E Test
**WARUM MANUAL?**
- E2E Tests sind aktuell broken (Auth-Bypass funktioniert nicht)
- Manual Test = IMMEDIATE FEEDBACK
- Screenshot = PROOF dass Feature funktioniert

**WIE DURCHFÜHREN?**
```markdown
1. Browser öffnen: http://localhost:5173
2. In DevTools Console prüfen: NO ERRORS
3. User Flow durchführen (siehe Task-spezifische Steps)
4. Screenshot machen (Cmd+Shift+4 / Win+Shift+S)
5. Screenshot speichern in: docs/testing/screenshots/2025-10-07/TASK-XXX-proof.png
```

**Task-spezifische Manual Tests**:

##### TASK-001: Backend TypeScript Fix
```
1. Server startet ohne Error ✅
2. curl /api/chat returns 200 ✅
3. Response hat agentSuggestion ✅
```

##### TASK-002: Agent Confirmation Message
```
1. Chat öffnen
2. Nachricht: "Erstelle Bild vom Pythagoras"
3. Orange Card erscheint (NICHT grüner Button) ✅
4. 2 Buttons sichtbar >= 44px ✅
5. Button-Order: Links Orange, Rechts Gray ✅
6. Screenshot: confirmation-card.png
```

##### TASK-003: Agent Form Prefill
```
1. Confirmation Card klicken: "Bild-Generierung starten"
2. Fullscreen Form öffnet ✅
3. Description field IST VORAUSGEFÜLLT mit "Pythagoras" ✅
4. User kann Text editieren ✅
5. Screenshot: form-prefilled.png
```

##### TASK-004: Progress Animation Fix
```
1. Form submit
2. NUR EINE Animation sichtbar (mittig) ✅
3. KEINE Animation "oben links" ✅
4. Screenshot: single-animation.png
```

##### TASK-005: Agent Result View Buttons
```
1. Nach Generierung: 3 Buttons sichtbar ✅
2. "Weiter im Chat 💬" → klick → Chat öffnet ✅
3. "In Library öffnen 📚" → klick → Library öffnet ✅
4. "Neu generieren 🔄" → klick → Form öffnet mit Params ✅
5. Screenshot: result-buttons.png
```

##### TASK-006: Image Thumbnail in Chat
```
1. Im Chat: Bild als Thumbnail sichtbar (max 200px) ✅
2. Klick auf Thumbnail → Preview öffnet ✅
3. Screenshot: chat-thumbnail.png
```

##### TASK-007: Library Filter "Bilder"
```
1. Library öffnen
2. Filter-Chip "Bilder" sichtbar ✅
3. Klick auf "Bilder" → nur Images angezeigt ✅
4. Screenshot: library-filter.png
```

##### TASK-008: MaterialPreview "Neu generieren"
```
1. Library → Bild klicken → Preview öffnet ✅
2. "Neu generieren" Button sichtbar ✅
3. Klick → Form öffnet mit Original-Params ✅
4. Screenshot: preview-regenerate.png
```

#### Gate 4: Session Log Documentation
**Task ist NUR complete wenn Session Log existiert**

```markdown
# Template: docs/development-logs/sessions/2025-10-07/session-XX-task-XXX.md

## Task
TASK-XXX: [Name from tasks.md]

## Implementation
[Was wurde implementiert]

## Verification Results

### TypeScript Check
```bash
npm run build -- --mode development
# Output: ✓ built in XXXms
# Errors: 0
```

### Backend Test (if applicable)
```bash
curl http://localhost:3006/api/chat
# Response: [paste JSON]
```

### Manual E2E Test
- [ ] Step 1: ... ✅
- [ ] Step 2: ... ✅
- [ ] Step 3: ... ✅

### Screenshots
![Proof](../../testing/screenshots/2025-10-07/TASK-XXX-proof.png)

## Files Changed
- file1.ts (Lines 10-50)
- file2.tsx (Lines 200-250)

## Status
✅ COMPLETE - All 4 Gates passed
```

---

### Stufe 3: FEATURE-LEVEL VERIFICATION (Am Ende)

**ERST wenn ALLE 10 Tasks ✅**:

#### Final E2E Manual Test (Complete Workflow)
```markdown
# Complete User Journey - Image Generation

## START: Fresh Browser Session
1. Browser öffnen: http://localhost:5173
2. DevTools Console öffnen
3. Prüfen: KEINE Errors

## STEP 1: Chat Message
1. Chat Tab öffnen
2. Eingabe: "Erstelle ein Bild vom Satz des Pythagoras"
3. Send Button klicken
4. Screenshot: 01-chat-message.png

## STEP 2: Backend Response
1. Console prüfen: NO "Failed to fetch" ✅
2. Agent Confirmation erscheint ✅
3. Orange Card (NICHT grün) ✅
4. Screenshot: 02-confirmation-card.png

## STEP 3: Form Opens
1. "Bild-Generierung starten" klicken
2. Fullscreen Form öffnet ✅
3. Description vorausgefüllt: "Satz des Pythagoras" ✅
4. Screenshot: 03-form-prefilled.png

## STEP 4: Generate
1. "Generieren" Button klicken
2. NUR EINE Progress Animation (mittig) ✅
3. Screenshot: 04-progress-animation.png
4. Warten (<30s)

## STEP 5: Preview Opens
1. Bild erscheint in Fullscreen ✅
2. 3 Buttons sichtbar ✅
3. Screenshot: 05-preview-result.png

## STEP 6: Continue in Chat
1. "Weiter im Chat 💬" klicken
2. Chat Tab öffnet ✅
3. Bild als Thumbnail sichtbar (max 200px) ✅
4. Screenshot: 06-chat-thumbnail.png

## STEP 7: Thumbnail Clickable
1. Thumbnail klicken
2. Preview Modal öffnet ✅
3. "Neu generieren" Button sichtbar ✅
4. Screenshot: 07-preview-from-chat.png

## STEP 8: Library Auto-Save
1. Library Tab öffnen
2. Filter "Bilder" klicken
3. Generiertes Bild sichtbar ✅
4. Screenshot: 08-library-image.png

## STEP 9: Library Preview
1. Bild in Library klicken
2. Preview öffnet ✅
3. "Neu generieren" Button sichtbar ✅
4. Screenshot: 09-library-preview.png

## STEP 10: Regenerate from Library
1. "Neu generieren" klicken
2. Form öffnet mit Original-Params ✅
3. Description field hat "Satz des Pythagoras" ✅
4. Screenshot: 10-regenerate-form.png

## RESULT
✅ All 10 Steps completed
✅ 10 Screenshots als Proof
✅ NO Console Errors
✅ Feature funktioniert E2E
```

#### Final Build Verification
```bash
# Frontend Build
cd teacher-assistant/frontend
npm run build

# MUST OUTPUT:
# ✓ built in XXXms
# dist/index.html  X.XX kB
# NO TypeScript Errors ✅

# Backend Compilation Check
cd teacher-assistant/backend
npx tsc --noEmit

# MUST OUTPUT:
# (nothing - no errors) ✅
```

---

## Definition of Done - Feature Complete

### Feature ist COMPLETE wenn:

#### 1. Backend ✅
- [ ] Server startet ohne TypeScript Errors
- [ ] `curl http://localhost:3006/api/health` returns 200
- [ ] `curl http://localhost:3006/api/chat` returns agentSuggestion
- [ ] `agentSuggestion.prefillData.description` exists (NOT theme)

#### 2. Frontend ✅
- [ ] `npm run build` completes mit 0 errors
- [ ] `npm run dev` startet ohne Errors
- [ ] Console zeigt NO "Failed to fetch"
- [ ] Console zeigt NO TypeScript Errors

#### 3. All 10 Tasks ✅
- [ ] TASK-001: Backend TypeScript Fix ✅
- [ ] TASK-002: Agent Confirmation (Gemini) ✅
- [ ] TASK-003: Form Prefill ✅
- [ ] TASK-004: Single Animation ✅
- [ ] TASK-005: Result View Buttons ✅
- [ ] TASK-006: Chat Thumbnail ✅
- [ ] TASK-007: Library Filter ✅
- [ ] TASK-008: Preview Regenerate ✅
- [ ] TASK-009: Backend Verification ✅
- [ ] TASK-010: E2E Manual Test ✅

#### 4. Manual E2E Test ✅
- [ ] Complete 10-Step User Journey funktioniert
- [ ] 10 Screenshots als Proof existieren
- [ ] NO Console Errors während Journey
- [ ] Feature funktioniert E2E

#### 5. Documentation ✅
- [ ] Session Logs für alle 10 Tasks existieren
- [ ] Screenshots in `docs/testing/screenshots/2025-10-07/`
- [ ] Final E2E Report in `docs/testing/test-reports/2025-10-07/`
- [ ] tasks.md alle Tasks als ✅ markiert

---

## Was tun wenn Tests fehlschlagen?

### Scenario 1: Pre-Flight Check failed (Backend startet nicht)
**SYMPTOM**: TypeScript Error in chatService.ts:92

**ACTION**:
1. STOPP alle weiteren Tasks
2. FIX TypeScript Error (TASK-001)
3. Verify: `npm run dev` startet
4. ERST DANN: Continue mit TASK-002

### Scenario 2: Manual Test failed (Feature funktioniert nicht)
**SYMPTOM**: Form ist NICHT vorausgefüllt

**ACTION**:
1. NICHT Task als ✅ markieren
2. DEBUG: Console Logs prüfen
3. DEBUG: Backend Response prüfen (curl test)
4. FIX Field Name Mismatch
5. RE-TEST Manual E2E
6. Nur wenn PASS: Task als ✅

### Scenario 3: Build failed (TypeScript Errors)
**SYMPTOM**: `npm run build` zeigt 12 Errors

**ACTION**:
1. NICHT committen
2. FIX alle TypeScript Errors
3. RE-RUN `npm run build`
4. Verify: 0 Errors
5. Nur wenn 0 Errors: Commit allowed

---

## Success Metrics

### Before (Baseline):
```
Backend: Crashed (TypeScript Error)
Frontend: Build broken (12 TS Errors)
E2E Tests: 2/7 passing
Feature: 0/10 Tasks complete
Screenshots: 0
```

### After (Target):
```
Backend: Running ✅ (0 TS Errors)
Frontend: Build clean ✅ (0 TS Errors)
E2E Manual: 10/10 Steps complete ✅
Feature: 10/10 Tasks complete ✅
Screenshots: 10+ Proof screenshots ✅
```

---

## Timeline & Checkpoints

### Day 1: Backend + Core Frontend (TASK-001 to TASK-003)
**Checkpoint 1 (End of Day 1)**:
- [ ] Backend startet ohne Errors
- [ ] Form öffnet mit Prefill
- [ ] 3 Screenshots als Proof

### Day 2: Workflow Integration (TASK-004 to TASK-006)
**Checkpoint 2 (End of Day 2)**:
- [ ] Bild wird generiert
- [ ] Bild erscheint im Chat
- [ ] 3 Screenshots als Proof

### Day 3: Library & Final Polish (TASK-007 to TASK-010)
**Checkpoint 3 (End of Day 3)**:
- [ ] Library Filter funktioniert
- [ ] Regenerate funktioniert
- [ ] Complete E2E Manual Test PASS
- [ ] 10+ Screenshots als Proof

**FINAL CHECKPOINT**:
- [ ] All 10 Tasks ✅
- [ ] Build: 0 Errors
- [ ] 10-Step E2E Manual Test: PASS
- [ ] Documentation: Complete

---

**Status**: Ready for Implementation
**Estimated Time**: 3 Days (mit robusten Verifications)
**Guarantee**: Wenn dieser Test-Plan befolgt wird → Feature WIRD funktionieren

**Unterschied zu früher**:
- ✅ KEINE Quick-Fixes (proper fixes only)
- ✅ KEINE Partial Implementation (task nur ✅ wenn complete)
- ✅ KEINE TypeScript Errors ignored (0 errors PFLICHT)
- ✅ KEINE Manual Tests übersprungen (screenshots PFLICHT)
- ✅ KEINE Documentation missing (session logs PFLICHT)
