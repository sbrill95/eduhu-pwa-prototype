# Image Generation Modal - KORRIGIERTE Bildgenerierungs-Tasks

**Status**: ⚠️ IN PROGRESS - Requirements korrigiert (2025-10-03)
**Created**: 2025-10-02 (Original), 2025-10-03 (Korrigiert)
**Related**: [spec.md](spec.md) | [plan.md](plan.md)

---

## 🔴 WICHTIG: Requirements-Korrektur

Die ursprünglichen Tasks basierten auf **FALSCHEN Requirements** (Thema/Lerngruppe/DAZ/Lernschwierigkeiten). Diese waren für **ARBEITSBLATT-Generierung**, nicht für **BILD-Generierung**.

**Korrekte Requirements für Bildgenerierung**:
1. Form-Felder: **Beschreibung** (Textarea) + **Bildstil** (Dropdown)
2. Buttons: **"Bild generieren"** + **"Zurück zum Chat"**
3. Workflow: Confirmation → Form → Ladescreen → Preview → Animation → Library
4. Auto-Tagging: Titel + Tags automatisch generieren

---

## Task Overview

**Total Tasks**: 18 (15 original + 3 neue)
**Estimated Total Time**: 14-16 hours
**Complexity**: Medium-High
**Risk Level**: Medium
**Status**: ⚠️ IN PROGRESS

---

## Task List

### Phase 1: Confirmation Message (2 hours) ✅ TEILWEISE COMPLETED

#### TASK-001: Create AgentConfirmationMessage Component
**Status**: ✅ `completed`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1 hour
**Completed**: 2025-10-02

**Description**:
Create chat message component for agent confirmation prompts.

**Acceptance Criteria**:
- [x] File created: `AgentConfirmationMessage.tsx`
- [x] Renders confirmation card with button
- [x] Button calls `openModal()` with prefill data
- [x] Gemini-inspired design

**Status**: ✅ **COMPLETED** - Component funktioniert korrekt

---

#### TASK-002: Write AgentConfirmationMessage Unit Tests
**Status**: ✅ `completed`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 30 minutes
**Completed**: 2025-10-02

**Status**: ✅ **COMPLETED** - Tests passing

---

#### TASK-003: Integrate Confirmation Message in ChatView
**Status**: ✅ `completed`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 30 minutes
**Completed**: 2025-10-02

**Status**: ✅ **COMPLETED** - Integration funktioniert

---

### Phase 2: Bild-Generierungs-Form (3 hours) ❌ MUSS NEU GEMACHT WERDEN

#### TASK-004: Update ImageGenerationFormData Type ⚠️ KORRIGIEREN
**Status**: ❌ `needs-rework`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 15 minutes

**Description**:
Update TypeScript interface für **BILD-Generierung** (nicht Arbeitsblatt!).

**ALTE Implementation** (FALSCH):
```typescript
interface ImageGenerationFormData {
  theme: string;
  learningGroup: string;
  dazSupport: boolean;
  learningDifficulties: boolean;
}
```

**NEUE Implementation** (KORREKT):
```typescript
interface ImageGenerationFormData {
  description: string;        // "Was soll das Bild zeigen?"
  imageStyle: string;         // "Realistisch" | "Cartoon" | "Illustrativ" | "Abstrakt"
}
```

**Acceptance Criteria**:
- [ ] File updated: `teacher-assistant/frontend/src/lib/types.ts`
- [ ] Interface `ImageGenerationFormData` mit KORREKTEN Feldern
- [ ] Export interface
- [ ] TypeScript compilation succeeds

**Files to Modify**:
- [ ] `teacher-assistant/frontend/src/lib/types.ts`

---

#### TASK-005: Redesign AgentFormView für Bildgenerierung ⚠️ KORRIGIEREN
**Status**: ❌ `needs-rework`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 2 hours

**Description**:
AgentFormView komplett umschreiben für **BILD-Generierung**.

**ALTE Implementation** (FALSCH - Arbeitsblatt):
- Header: "← Generieren"
- Fields: Thema, Lerngruppe, DaZ, Lernschwierigkeiten
- Button: "Idee entfalten ✨"

**NEUE Implementation** (KORREKT - Bild):
- Header: "Bildgenerierung" (KEIN Zurück-Pfeil, KEIN X!)
- Title: "Erstelle ein maßgeschneidertes Bild für deinen Unterricht."
- **Field 1**: "Was soll das Bild zeigen?" (Textarea, min-height 100px, vorausgefüllt)
- **Field 2**: "Bildstil" (Dropdown: Realistisch/Cartoon/Illustrativ/Abstrakt)
- **Button 1**: "Bild generieren" (Orange, full-width, startet Generierung)
- **Button 2**: "Zurück zum Chat" (Text-only, gray, schließt Modal)

**Acceptance Criteria**:
- [ ] File updated: `teacher-assistant/frontend/src/components/AgentFormView.tsx`
- [ ] 2 Form-Felder (Beschreibung + Bildstil)
- [ ] 2 Buttons ("Bild generieren" + "Zurück zum Chat")
- [ ] KEIN X-Button
- [ ] KEIN Zurück-Pfeil
- [ ] Gemini Design (Orange #FB6542, Teal #D3E4E6)
- [ ] Mobile-first responsive
- [ ] Pre-fill funktioniert

**Files to Modify**:
- [ ] `teacher-assistant/frontend/src/components/AgentFormView.tsx`

**Visual Verification**:
- [ ] Playwright Screenshot zeigt korrekte Form

---

#### TASK-006: Write AgentFormView Unit Tests ⚠️ ANPASSEN
**Status**: ❌ `needs-rework`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent
**Estimate**: 45 minutes

**Description**:
Unit tests für NEUE Bild-Generierungs-Form.

**Acceptance Criteria**:
- [ ] Test: Renders "Beschreibung" textarea
- [ ] Test: Renders "Bildstil" dropdown
- [ ] Test: "Bild generieren" button exists
- [ ] Test: "Zurück zum Chat" button exists
- [ ] Test: Pre-fill works for description
- [ ] Test: Submit calls API with correct data structure
- [ ] All tests passing (6+ tests)

**Files to Modify**:
- [ ] `teacher-assistant/frontend/src/components/AgentFormView.test.tsx`

---

### Phase 2.5: Ladescreen & Preview (NEU!) 🆕

#### TASK-016: Implement Ladescreen während Generierung 🆕
**Status**: ⏳ `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1 hour

**Description**:
Ladescreen anzeigen während Bildgenerierung läuft.

**Acceptance Criteria**:
- [ ] Component created: `AgentLoadingView.tsx` (oder in AgentProgressView integrieren)
- [ ] Zeigt Loading-Spinner (z.B. Ionic `ion-spinner`)
- [ ] Text: "Dein Bild wird erstellt..."
- [ ] Optional: Progress-Text wenn verfügbar
- [ ] Keine User-Interaktion möglich (no buttons)
- [ ] Gemini Design (Teal background)

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/components/AgentProgressView.tsx` (oder neue Datei)

---

#### TASK-017: Implement Preview-Modal nach Generierung 🆕
**Status**: ⏳ `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1.5 hours

**Description**:
Preview-Modal öffnet **AUTOMATISCH** nach erfolgreicher Bildgenerierung.

**Acceptance Criteria**:
- [ ] Modal öffnet automatisch wenn Bild generiert
- [ ] Zeigt generiertes Bild (Fullscreen)
- [ ] Zeigt Badge: "✅ In Library gespeichert"
- [ ] **2 Buttons**:
  - [ ] "Teilen 🔗" (grauer Border, ruft Web Share API auf)
  - [ ] "Weiter im Chat 💬" (orange, startet Animation)
- [ ] Gemini Design
- [ ] Mobile-first

**Implementation Notes**:
```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: 'Generiertes Bild',
      text: result.description,
      url: result.imageUrl
    });
  } else {
    await navigator.clipboard.writeText(result.imageUrl);
    toast.success('Link kopiert!');
  }
};
```

**Files to Modify**:
- [ ] `teacher-assistant/frontend/src/components/AgentResultView.tsx`

---

#### TASK-018: Auto-Save mit Titel + Tags in Library 🆕
**Status**: ⏳ `todo`
**Priority**: `P1` (High)
**Agent**: Backend-Agent + Frontend-Agent
**Estimate**: 2 hours

**Description**:
Bild automatisch in Library speichern mit generiertem Titel und Tags.

**Backend Part**:
- [ ] File updated: `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.ts`
- [ ] Funktion: `generateTitleAndTags(description: string)`
- [ ] Nutzt ChatGPT um Titel zu generieren (z.B. "Photosynthese Diagramm")
- [ ] Extrahiert Tags aus Beschreibung (z.B. ["Photosynthese", "Biologie", "Klasse 7"])
- [ ] Speichert in InstantDB mit Titel + Tags

**Frontend Part**:
- [ ] Tags sind NICHT sichtbar in Library UI
- [ ] Library-Suche nutzt Tags im Hintergrund
- [ ] User kann nach "Photosynthese" suchen → Bild wird gefunden

**Acceptance Criteria**:
- [ ] Titel wird automatisch generiert
- [ ] 3-5 Tags werden extrahiert
- [ ] Tags helfen bei Suche
- [ ] Tags sind unsichtbar für User

**Files to Modify**:
- [ ] `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.ts`
- [ ] `teacher-assistant/backend/src/routes/materials.ts` (wenn nötig)

---

### Phase 3: Result View Enhancement (2 hours) ✅ TEILWEISE COMPLETED

#### TASK-007: Add "Teilen" and "Weiter im Chat" Buttons
**Status**: ⚠️ `needs-verification`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1 hour
**Completed**: 2025-10-02

**Description**:
Update AgentResultView mit neuen Buttons.

**Status**: ⚠️ **NEEDS VERIFICATION** - Buttons existieren, aber Preview-Modal fehlt

---

#### TASK-008: Write AgentResultView Unit Tests
**Status**: ⚠️ `needs-verification`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent
**Estimate**: 30 minutes
**Completed**: 2025-10-02

**Status**: ⚠️ **NEEDS VERIFICATION**

---

### Phase 4: Animation Implementation (2 hours) ✅ COMPLETED

#### TASK-009: Implement "Bild fliegt zur Library" Animation
**Status**: ✅ `completed`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1.5 hours
**Completed**: 2025-10-02

**Status**: ✅ **COMPLETED** - Animation funktioniert perfekt (600ms, 60fps)

---

#### TASK-010: Add Animation CSS
**Status**: ✅ `completed`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 15 minutes
**Completed**: 2025-10-02

**Status**: ✅ **COMPLETED**

---

#### TASK-011: Write Animation Tests
**Status**: ✅ `completed`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent
**Estimate**: 30 minutes
**Completed**: 2025-10-02

**Status**: ✅ **COMPLETED** - 28/28 tests passing

---

### Phase 5: Backend Integration (1 hour) ⚠️ KORRIGIEREN

#### TASK-012: Update Backend Prompt für Bildgenerierung ⚠️ ANPASSEN
**Status**: ❌ `needs-rework`
**Priority**: `P1` (High)
**Agent**: Backend-Agent
**Estimate**: 45 minutes

**Description**:
Backend Prompt-Engineering für **BILD-Generierung** (nicht Arbeitsblatt!).

**ALTE Implementation** (FALSCH):
```typescript
const buildPrompt = (formData) => {
  let prompt = `Thema: ${formData.theme}`;
  prompt += `Lerngruppe: ${formData.learningGroup}`;
  if (formData.dazSupport) { ... }
  if (formData.learningDifficulties) { ... }
};
```

**NEUE Implementation** (KORREKT):
```typescript
interface ImageGenerationParams {
  description: string;        // User input
  imageStyle: string;         // "realistic" | "cartoon" | "illustrative" | "abstract"
}

const buildImagePrompt = (params: ImageGenerationParams): string => {
  const stylePrompts = {
    realistic: 'photorealistic, detailed, educational',
    cartoon: 'cartoon style, friendly, colorful',
    illustrative: 'illustrated, clear, pedagogical',
    abstract: 'abstract, conceptual, thought-provoking'
  };

  return `
Create an educational image with the following description:
${params.description}

Style: ${stylePrompts[params.imageStyle]}

Requirements:
- Educational context
- Clear visual elements
- Suitable for classroom use
- High quality
`;
};
```

**Acceptance Criteria**:
- [ ] Backend accepts: `{ description, imageStyle }`
- [ ] Prompt ist optimiert für DALL-E/Midjourney
- [ ] Style-Varianten funktionieren
- [ ] Backend unit tests passing

**Files to Modify**:
- [ ] `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.ts`
- [ ] `teacher-assistant/backend/src/routes/langGraphAgents.ts` (Validation bereits gefixt in BUG-002!)

---

### Phase 6: Integration & QA (3 hours)

#### TASK-013: Write Full Workflow Integration Test
**Status**: ⏳ `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1 hour

**Description**:
Integration test für **KORREKTEN** Bildgenerierungs-Workflow.

**Test Flow**:
1. Confirmation Message erscheint
2. User klickt "Ja, Bild erstellen"
3. **Modal öffnet mit Beschreibung + Bildstil**
4. User klickt "Bild generieren"
5. Ladescreen erscheint
6. Preview-Modal öffnet mit Bild
7. User klickt "Weiter im Chat"
8. Animation startet
9. Modal schließt
10. Bild in Library gespeichert

**Files to Create**:
- [ ] `teacher-assistant/frontend/src/components/AgentModal.integration.test.tsx`

---

#### TASK-014: Write Playwright E2E Tests
**Status**: ⏳ `todo`
**Priority**: `P0` (Critical)
**Agent**: QA-Agent
**Estimate**: 1.5 hours

**Description**:
E2E Tests für vollständigen Workflow.

**Test Scenarios**:
1. ✅ Full workflow (Chat → Confirmation → Form → Ladescreen → Preview → Animation)
2. ✅ Form validation (empty description → disabled button)
3. ✅ "Zurück zum Chat" schließt Modal ohne zu generieren
4. ✅ "Teilen" button functionality
5. ✅ Animation visual verification
6. ✅ Library search findet Bild über Tags

**Files to Create**:
- [ ] `teacher-assistant/frontend/e2e-tests/image-generation-workflow.spec.ts`

---

#### TASK-015: Run Full Test Suite & Documentation
**Status**: ⏳ `todo`
**Priority**: `P0` (Critical)
**Agent**: QA-Agent
**Estimate**: 30 minutes

**Description**:
Final QA + Session Log.

**Acceptance Criteria**:
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Playwright screenshots zeigen korrekte UI
- [ ] Session log created

**Files to Create**:
- [ ] `docs/development-logs/sessions/2025-10-03/session-02-image-generation-corrected.md`

---

## Task Dependencies Graph

```
TASK-001 (Confirmation) ──▶ TASK-003 (ChatView Integration) ✅ DONE
                               │
                               ▼
TASK-004 (Type Update) ──▶ TASK-005 (Form Redesign) ⚠️ NEEDS REWORK
                               │
                               ├──▶ TASK-006 (Form Tests)
                               │
                               ├──▶ TASK-016 (Ladescreen) 🆕
                               │
                               └──▶ TASK-017 (Preview Modal) 🆕
                                        │
                                        ▼
TASK-009 (Animation) ──────────────▶ Works with Preview ✅ DONE
                                        │
                                        ▼
TASK-012 (Backend Prompt) ──▶ TASK-018 (Auto-Tagging) 🆕
                                        │
                                        ▼
All Tasks ──────────────────────▶ TASK-013 (Integration Tests)
                                        │
                                        ▼
                                   TASK-014 (E2E Tests)
                                        │
                                        ▼
                                   TASK-015 (Final QA)
```

---

## Progress Tracking

### Checklist

**Phase 1: Confirmation (2h)** ✅ COMPLETED
- [x] TASK-001: AgentConfirmationMessage ✅
- [x] TASK-002: Unit Tests ✅
- [x] TASK-003: ChatView Integration ✅

**Phase 2: Bild-Form (3h)** ❌ NEEDS REWORK
- [ ] TASK-004: Type Definition (description + imageStyle) ⚠️
- [ ] TASK-005: Form Redesign (2 Felder, 2 Buttons) ⚠️
- [ ] TASK-006: Form Tests ⚠️

**Phase 2.5: Ladescreen & Preview (2.5h)** 🆕 NEW
- [ ] TASK-016: Ladescreen ⏳
- [ ] TASK-017: Preview Modal ⏳
- [ ] TASK-018: Auto-Tagging ⏳

**Phase 3: Result Enhancement (2h)** ⚠️ VERIFY
- [x] TASK-007: Buttons (verify Preview integration) ⚠️
- [x] TASK-008: Button Tests ⚠️

**Phase 4: Animation (2h)** ✅ COMPLETED
- [x] TASK-009: Animation ✅
- [x] TASK-010: CSS ✅
- [x] TASK-011: Animation Tests ✅

**Phase 5: Backend (1h)** ⚠️ NEEDS REWORK
- [ ] TASK-012: Prompt Engineering (description + imageStyle) ⚠️

**Phase 6: QA (3h)** ⏳ PENDING
- [ ] TASK-013: Integration Tests ⏳
- [ ] TASK-014: E2E Tests ⏳
- [ ] TASK-015: Final QA & Docs ⏳

---

## Critical Path

**MUST DO NEXT** (in order):
1. **TASK-004**: Fix Type Definition (15 min)
2. **TASK-005**: Rewrite AgentFormView (2 hours)
3. **TASK-012**: Fix Backend Prompt (45 min)
4. **TASK-016**: Add Ladescreen (1 hour)
5. **TASK-017**: Add Preview Modal (1.5 hours)
6. **TASK-018**: Implement Auto-Tagging (2 hours)
7. **TASK-014**: E2E Tests (1.5 hours)
8. **TASK-015**: Final QA (30 min)

**Total Remaining**: ~9.5 hours

---

## Status Summary

**Completed**: 8/18 tasks (44%)
**Needs Rework**: 3 tasks (TASK-004, TASK-005, TASK-012)
**New Tasks**: 3 tasks (TASK-016, TASK-017, TASK-018)
**Remaining**: 10 tasks

**Deployment Status**: ❌ **NOT READY** - Form implementation is incorrect

---

**Last Updated**: 2025-10-03
**Maintained By**: General-Purpose Agent
**Status**: ⚠️ **IN PROGRESS** - Requirements korrigiert, Implementation pending
