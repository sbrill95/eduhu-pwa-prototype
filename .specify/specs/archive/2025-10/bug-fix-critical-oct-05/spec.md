# Critical Bug Fixes - Specification

**Feature Name**: Critical Bug Fixes (Agent Detection, Navigation, Date Format, Console Errors)
**Version**: 1.0
**Status**: Specification
**Created**: 2025-10-05
**Priority**: P0 - CRITICAL

---

## 1. Problem Statement

### Current Issues (User-Reported + Testing)

Die Teacher Assistant PWA hat **9 kritische Bugs** die Core-Funktionalität brechen:

#### 1.1 Agent Detection funktioniert nicht ⛔
**Problem**: Bildgenerierungs-Workflow ist komplett kaputt
- Backend sendet `agentSuggestion` korrekt ✅ (verifiziert in Logs 14:46:01)
- Frontend ignoriert `agentSuggestion` komplett ❌
- Kein Agent Confirmation Modal erscheint ❌
- User kann keine Bilder generieren ❌

**Root Cause**: Frontend nutzt noch OLD client-side detection statt backend `agentSuggestion`

#### 1.2 Homepage Prompt-Vorschläge - Kein Auto-Submit
**Problem**: Schlechte UX beim Klick auf Prompt-Tiles
- User klickt auf Prompt-Vorschlag
- Text wird nur eingefügt (nicht gesendet)
- User muss manuell auf "Senden" klicken ❌
- Erwartet: Sofortiges Absenden + KI-Antwort

#### 1.3 Homepage Material-Link - Falsche Navigation
**Problem**: Material-Arrow führt zu falschem Ort
- Klick auf "Alle Materialien anzeigen" Arrow
- Öffnet Library Tab (korrekt)
- Aber: Zeigt "Chats" Tab statt "Materialien" Tab ❌
- User muss manuell zu Materialien wechseln

#### 1.4 Library Datum-Formatierung inkonsistent
**Problem**: Library zeigt andere Datumsformate als Homepage
- Homepage: "14:30", "Gestern", "vor 2 Tagen"
- Library: "05.10.2025" (uneinheitlich) ❌
- User erwartet gleiches Format überall

#### 1.5 Console Errors (Profile API 404)
**Problem**: Zahllose Console-Errors verschmutzen Debug-Log
- Errors: `POST /api/profile/extract - 404`
- Errors: `POST /api/chat/summary - 404`
- Errors: `POST /api/teacher-profile/extract - 404`
- Frontend ruft nicht-existierende Backend-Routes auf
- Backend-Routes sind nicht registriert in `routes/index.ts`

#### 1.6 Profil - Merkmal hinzufügen ohne Bestätigung ⛔
**Problem**: Merkmal-Hinzufügen-Modal hat keinen Bestätigungsbutton
- User öffnet "Merkmal hinzufügen" Modal
- User kann Text eingeben
- Aber: Kein Button "Bestätigen" oder "Hinzufügen" ❌
- User kann Merkmal NICHT speichern
- Modal-UX ist unvollständig

#### 1.7 Profil - Name ändern wird nicht gespeichert ⛔
**Problem**: Name-Änderung funktioniert nicht
- User klickt auf Stift-Icon neben Namen
- User gibt neuen Namen ein
- Aber: Änderung wird NICHT übernommen ❌
- Nach Schließen ist alter Name wieder da
- apiClient.updateUserName() schlägt fehl?

#### 1.8 Library - Falsche Akzentfarbe (Blau statt Orange) ⛔
**Problem**: Library nutzt blaue Akzentfarbe statt Corporate Orange
- Chats-Tab: Blau (#4A90E2 oder ähnlich) ❌
- Materialien-Tab: Blau ❌
- Soll: Orange (#FB6542) überall ✅
- Inkonsistent mit Rest der App (Gemini Design)

#### 1.9 Library - Chat-Tagging fehlt ⛔
**Problem**: Chats haben keine Tags und sind nicht durchsuchbar
- Chats werden NICHT automatisch mit Tags versehen
- Keine Möglichkeit, nach Schlagworten zu suchen
- Keine Volltextsuche in Chat-Inhalten
- User kann Chats NICHT effizient finden

---

## 2. Solution Vision

### 2.1 User Journeys (SOLL-Zustand)

#### Journey 1: Bildgenerierung (Agent Detection)
```
1. USER schreibt: "Erstelle ein Bild zur Photosynthese"
   ↓
2. BACKEND erkennt: Bildgenerierungs-Request
   ↓
3. BACKEND sendet: response.agentSuggestion
   ↓
4. FRONTEND zeigt: Agent Confirmation Message
   - Orange Button "Ja, Bild erstellen"
   - Gray Button "Weiter im Chat"
   ↓
5. USER klickt: "Ja, Bild erstellen"
   ↓
6. MODAL öffnet: Agent Form (pre-filled mit "Photosynthese")
   ↓
7. Workflow läuft erfolgreich ✅
```

#### Journey 2: Homepage Prompt Auto-Submit
```
1. USER klickt: Prompt-Tile "Wie plane ich eine Unterrichtsstunde?"
   ↓
2. APP navigiert: Zum Chat Tab
   ↓
3. APP sendet: Prompt automatisch ab
   ↓
4. KI-ANTWORT: Erscheint sofort
   ↓
5. INPUT-FELD: Ist leer (bereit für Follow-up) ✅
```

#### Journey 3: Material-Link Navigation
```
1. USER klickt: Material-Arrow auf Homepage
   ↓
2. APP navigiert: Zum Library Tab
   ↓
3. APP aktiviert: "Materialien" Sub-Tab (nicht "Chats")
   ↓
4. USER sieht: Alle generierten Materialien ✅
```

#### Journey 4: Konsistente Datumsformate
```
1. USER sieht auf Homepage: "14:30" (heute)
   ↓
2. USER wechselt zu Library
   ↓
3. USER sieht GLEICHEN Chat: "14:30" (identisch) ✅
```

#### Journey 5: Keine Console Errors
```
1. USER öffnet App
   ↓
2. DEVELOPER öffnet Console
   ↓
3. CONSOLE zeigt: Keine 404 Errors ✅
   (Profile-API Calls sind deaktiviert)
```

#### Journey 6: Profil-Merkmal hinzufügen
```
1. USER klickt: "Merkmal hinzufügen" auf Profil-Tab
   ↓
2. MODAL öffnet: Input-Feld für neues Merkmal
   ↓
3. USER gibt ein: "Gruppenarbeit"
   ↓
4. USER klickt: "Hinzufügen" Button (ORANGE) ✅
   ↓
5. MODAL schließt
   ↓
6. PROFIL zeigt: Neues Merkmal in Tag-Liste ✅
```

#### Journey 7: Profil-Name ändern
```
1. USER klickt: Stift-Icon neben Namen
   ↓
2. INPUT erscheint: Inline-Editing aktiviert
   ↓
3. USER gibt ein: "Frau Müller"
   ↓
4. USER klickt: Bestätigen-Icon (Checkmark) ✅
   ↓
5. API speichert: apiClient.updateUserName() ✅
   ↓
6. NAME aktualisiert: "Frau Müller" wird angezeigt ✅
```

#### Journey 8: Library mit Orange Akzentfarbe
```
1. USER wechselt zu: Library Tab
   ↓
2. INTERFACE zeigt: Orange Akzentfarbe (#FB6542) ✅
   - Tab-Indicator: Orange ✅
   - Filter-Chips: Orange bei Auswahl ✅
   - Buttons: Orange Primary ✅
```

#### Journey 9: Chat-Tagging & Suche
```
1. USER beendet Chat über: "Unterrichtsplanung Mathematik"
   ↓
2. BACKEND extrahiert Tags: ["Mathematik", "Unterrichtsplanung"] ✅
   ↓
3. USER öffnet Library → Chats
   ↓
4. USER sieht Tags: Unter jedem Chat angezeigt ✅
   ↓
5. USER sucht: "Mathematik" in Suchfeld
   ↓
6. FILTER zeigt: Nur Mathe-Chats ✅ (Tag-Match + Volltext)
```

#### Journey 10: Bildgenerierung End-to-End (KRITISCH!)
**Referenz**: `.specify/specs/image-generation-ux-v2/spec.md` (TASK-001 bis TASK-015)

```
1. USER im Chat: "Erstelle ein Bild zur Photosynthese"
   ↓
2. BACKEND erkennt: Bildgenerierungs-Request (agentSuggestion)
   ↓
3. CHAT zeigt: Agent Confirmation (Gemini Design, Orange)
   - Links: "Ja, Bild erstellen" (Orange Primary) ✅
   - Rechts: "Weiter im Chat" (Gray Secondary) ✅
   ↓
4. USER klickt: "Ja, Bild erstellen"
   ↓
5. MODAL öffnet: Agent Form VORAUSGEFÜLLT
   - Beschreibung: "Photosynthese" (aus Chat) ✅
   - Bildstil: "Realistisch" (wählbar) ✅
   ↓
6. USER wählt: Stil anpassen (optional)
   ↓
7. USER klickt: "Bild generieren"
   ↓
8. PROGRESS zeigt: Animation in Mitte (KEINE Duplikate) ✅
   ↓
9. GENERIERUNG abgeschlossen:
   - Bild → library_materials (type: 'image') ✅
   - Bild → Chat-Message (metadata mit image_url) ✅
   ↓
10. PREVIEW-MODAL öffnet automatisch:
    - Zeigt: Generiertes Bild
    - Buttons: "Teilen 🔗" | "Weiter im Chat 💬" | "Neu generieren 🔄"
   ↓
11. USER klickt: "Weiter im Chat"
   ↓
12. CHAT aktualisiert:
    - Bild erscheint als Miniatur (klickbar) ✅
    - ChatGPT Vision erhält: Bild-URL im Context ✅
   ↓
13. USER fragt: "Mach das Bild bunter"
   ↓
14. CHATGPT antwortet: Mit Bezug auf das Bild ✅
   ↓
15. LIBRARY zeigt:
    - Bild unter "Bilder" Filter ✅
    - Mit Titel (ChatGPT-generiert) ✅
    - Durchsuchbar + teilbar ✅
```

---

## 3. User Stories

### US-1: Agent Detection Frontend
**Als** Lehrkraft
**möchte ich** dass Bildgenerierung funktioniert wenn ich danach frage
**damit** ich visuelle Materialien für den Unterricht erstellen kann

**Acceptance Criteria**:
- [ ] User schreibt "Erstelle ein Bild zur Photosynthese"
- [ ] Agent Confirmation Message erscheint (Orange Button links)
- [ ] Klick auf "Ja" öffnet Modal mit prefilled Form
- [ ] Form enthält "Photosynthese" im Thema-Feld
- [ ] Generierung funktioniert End-to-End

**Test**: Playwright E2E mit Screenshot-Verifikation

---

### US-2: Prompt Auto-Submit
**Als** Lehrkraft
**möchte ich** dass Prompt-Vorschläge sofort abgeschickt werden
**damit** ich nicht zweimal klicken muss

**Acceptance Criteria**:
- [ ] Klick auf Prompt-Tile navigiert zu Chat
- [ ] Nachricht wird automatisch abgeschickt
- [ ] KI-Antwort erscheint ohne weiteren Klick
- [ ] Input-Feld ist leer (bereit für Follow-up)

**Test**: Playwright E2E mit Screenshot-Verifikation

---

### US-3: Material-Link Navigation
**Als** Lehrkraft
**möchte ich** dass Material-Link direkt zu Materialien führt
**damit** ich schnell auf meine Materialien zugreifen kann

**Acceptance Criteria**:
- [ ] Klick auf Material-Arrow öffnet Library
- [ ] "Materialien" Tab ist aktiv (nicht "Chats")
- [ ] Materialliste ist sichtbar

**Test**: Playwright E2E mit Screenshot-Verifikation

---

### US-4: Konsistente Datumsformate
**Als** Lehrkraft
**möchte ich** einheitliche Datumsanzeige überall
**damit** ich Chats zeitlich einordnen kann

**Acceptance Criteria**:
- [ ] Homepage: "14:30" für heute, "Gestern", "vor 2 Tagen"
- [ ] Library: Identisches Format wie Homepage
- [ ] Gleicher Chat → gleiches Datum in beiden Views

**Test**: Playwright E2E mit Screenshot-Vergleich

---

### US-5: Saubere Console (Entwickler-UX)
**Als** Entwickler
**möchte ich** keine 404-Errors in der Console sehen
**damit** ich echte Probleme schneller erkennen kann

**Acceptance Criteria**:
- [ ] Keine `/api/profile/extract` 404-Errors
- [ ] Keine `/api/chat/summary` 404-Errors
- [ ] Console ist sauber beim App-Start

**Test**: Playwright E2E mit Console-Error-Check

---

## 4. Technical Requirements

### 4.1 Frontend Changes

#### Agent Detection Integration
**Files**:
- `teacher-assistant/frontend/src/hooks/useChat.ts`
- `teacher-assistant/frontend/src/components/ChatView.tsx`

**Requirements**:
- Check `response.agentSuggestion` from backend
- Store in React state
- Render `AgentConfirmationMessage` when present
- Pass `prefillData` to AgentModal
- NO design changes, use existing components

#### Prompt Auto-Submit
**Files**:
- `teacher-assistant/frontend/src/pages/Home/Home.tsx`
- `teacher-assistant/frontend/src/components/ChatView.tsx`

**Requirements**:
- Navigate to Chat tab on tile click
- Auto-submit prompt via CustomEvent
- Clear input after submit
- Wait for KI response

#### Material Navigation
**Files**:
- `teacher-assistant/frontend/src/pages/Home/Home.tsx`
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`

**Requirements**:
- Navigate to Library tab on arrow click
- Activate "Materialien" sub-tab via CustomEvent
- Show materials list

#### Date Formatting
**Files**:
- `teacher-assistant/frontend/src/lib/formatRelativeDate.ts` (NEW)
- `teacher-assistant/frontend/src/pages/Home/Home.tsx`
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`

**Requirements**:
- Create shared `formatRelativeDate` utility
- Return "HH:MM" for today
- Return "Gestern" for yesterday
- Return "vor X Tagen" for < 7 days
- Return date for older

#### Console Errors
**Files**:
- `teacher-assistant/frontend/src/hooks/useChatSummary.ts` (or similar)
- `teacher-assistant/frontend/src/hooks/useProfileExtraction.ts` (or similar)

**Requirements**:
- Disable Profile API calls (feature flag or conditional)
- Prevent 404 errors

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Agent Detection: Response < 100ms (backend already fast)
- Auto-Submit: Trigger < 50ms after navigation
- Date Formatting: < 1ms per call

### 5.2 Compatibility
- Works on Desktop (Chrome, Firefox)
- Works on Mobile (iOS Safari, Android Chrome)
- Works on Tablet (iPad)

### 5.3 Testing
**Mandatory**:
- ✅ Playwright E2E tests with screenshots
- ✅ Screenshot comparison (before/after)
- ✅ Console error monitoring
- ✅ NO background/unit tests alone (they miss issues)

**Test Coverage**:
- Agent Detection: Full workflow E2E
- Auto-Submit: Click → Send → Response
- Navigation: Homepage → Library → Materials
- Date Format: Visual comparison
- Console: Error count assertion

---

## 6. Out of Scope

**What we are NOT doing:**
- ❌ NO UI redesign (use existing components)
- ❌ NO new layouts (keep Gemini design)
- ❌ NO agent form changes (already has Gemini style)
- ❌ NO backend changes (agent detection works)
- ❌ NO database schema changes

**Why minimal approach:**
- Prevent design loss (learned from past issues)
- Focus on functionality, not aesthetics
- Reduce risk of breaking existing features

---

## 7. Success Criteria

**Feature is DONE when:**
1. ✅ All 5 User Stories have passing Playwright E2E tests
2. ✅ Screenshots prove visual correctness
3. ✅ Console has zero 404 errors
4. ✅ Agent Detection works End-to-End
5. ✅ Auto-Submit works smoothly
6. ✅ Navigation is correct
7. ✅ Date formats are consistent
8. ✅ QA Agent reviewed and approved
9. ✅ Feature Branch merged to main

**Verification Method**:
- Run: `npm run test:e2e -- bug-fix-critical.spec.ts`
- Check: All tests green ✅
- Compare: Before/After screenshots
- Confirm: User acceptance

---

## 8. Risks & Mitigation

### Risk 1: Breaking Existing Design
**Mitigation**:
- Feature Branch with rollback
- Screenshot comparison
- Use existing components only
- No CSS changes

### Risk 2: Tests Still Miss Issues
**Mitigation**:
- E2E Playwright ONLY (no background tests)
- Screenshot-based verification
- Manual QA after automation

### Risk 3: Agent Creates Wrong Code
**Mitigation**:
- Human reviews every Agent output
- Code-Diff approval before commit
- Incremental commits (easy rollback)

---

## 9. Open Questions

**Q1**: Welche Profile-API Files genau deaktivieren?
- `useChatSummary.ts`?
- `useProfileExtraction.ts`?
- Andere?

**Q2**: Soll Auto-Submit verzögert werden (UX)?
- Sofort oder 200ms delay?

**Q3**: Sollen alte Agent Detection Codes entfernt werden?
- Oder nur deaktiviert (flag)?

---

**Specification Version**: 1.0
**Last Updated**: 2025-10-05
**Approval Status**: ⏳ Awaiting User Review
