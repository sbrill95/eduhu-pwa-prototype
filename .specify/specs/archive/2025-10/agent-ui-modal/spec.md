# Agent UI Modal - Specification

**Status**: Draft
**Created**: 2025-09-30
**Priority**: P0 (Critical - Enables LangGraph System)
**Related Roadmap**: Phase 1.3 - Agent UI Pattern

---

## Problem Statement

### Current Situation ❌

Das **LangGraph Agent System** ist im Backend vollständig implementiert, aber es gibt **keine UI**:

**Backend Status** (Code Inventory):
- ✅ `/routes/langGraphAgents.ts` - API Endpoints fertig
- ✅ `/agents/langGraphImageGenerationAgent.ts` - Image Agent fertig
- ✅ `/services/langGraphAgentService.ts` - Workflow Management fertig
- ✅ `/services/progressStreamingService.ts` - SSE Progress Streaming fertig
- ✅ Redis + LangGraph vollständig getestet

**Frontend Status**:
- ❌ Keine UI für Agent Confirmation
- ❌ Keine Progress Visualization
- ❌ Keine Result Display
- ❌ Chat erkennt nicht wenn Agent gebraucht wird

### Core Issues

1. **Invisible System**: User weiß nicht dass Agents existieren
2. **No Control**: Keine Confirmation vor Agent-Start (Kosten!)
3. **No Feedback**: User sieht nicht was Agent macht
4. **Results Lost**: Generated Content verschwindet oder ist schwer zu finden

### User Pain Points

> "Ich habe nach einem Bild gefragt, aber nichts passiert." — User Confusion

> "Wo ist das Bild das ich erstellt habe?" — Result Discovery Problem

> "Kann der Assistent überhaupt Bilder erstellen?" — Feature Discovery Problem

---

## Vision & Goals

### Vision

**Klare, kontrollierte Agent-Workflows** mit dediziertem Fullscreen Modal für Confirmation, Progress und Results - inspiriert vom Gemini Mockup "Generate" View.

### Goals

1. **Discovery**: User erfährt im Chat dass Agent verfügbar ist
2. **Control**: Explizite Confirmation vor Agent-Start
3. **Transparency**: Live Progress während Execution
4. **Results**: Professionelle Anzeige mit Download/Save
5. **Integration**: Automatisches Speichern in Library

---

## User Stories

### US-1: Agent Discovery im Chat

**Als** Lehrkraft
**möchte ich** vom Chat darauf hingewiesen werden dass ein Agent helfen kann
**damit** ich die Feature nutzen kann

**Acceptance Criteria**:
- ✅ ChatGPT erkennt wenn Agent nützlich wäre (z.B. "Erstelle ein Bild")
- ✅ ChatGPT antwortet: "Soll ich ein Bild für dich erstellen?"
- ✅ Inline Button im Chat: "Ja, Bild erstellen"
- ✅ Click öffnet Agent Modal

### US-2: Intelligente Vorbefüllung

**Als** Lehrkraft
**möchte ich** dass das Modal mit Chat-Context vorausgefüllt ist
**damit** ich nicht alles nochmal eingeben muss

**Acceptance Criteria**:
- ✅ Bildbeschreibung ist vorausgefüllt aus Chat-Context
- ✅ Backend analysiert letzte 2-3 Messages für Context
- ✅ User kann Beschreibung anpassen
- ✅ Bildstil hat sinnvollen Default

### US-3: Kontrollierte Agent-Ausführung

**Als** Lehrkraft
**möchte ich** sehen was der Agent machen wird und bestätigen
**damit** ich Kontrolle über Kosten habe

**Acceptance Criteria**:
- ✅ Modal zeigt alle Parameter (Beschreibung, Stil, Größe)
- ✅ "Bild generieren" Button startet Agent
- ✅ "Abbrechen" Button schließt Modal
- ✅ Voraussichtliche Wartezeit wird angezeigt

### US-4: Transparenter Progress

**Als** Lehrkraft
**möchte ich** sehen dass der Agent arbeitet
**damit** ich weiß was passiert

**Acceptance Criteria**:
- ✅ Modal zeigt Progress während Generation
- ✅ Status-Text: "Bild wird erstellt..."
- ✅ Abbrechen-Button (wenn möglich)
- ✅ Geschätzte Restzeit

### US-5: Professionelle Result-Anzeige

**Als** Lehrkraft
**möchte ich** das generierte Bild groß sehen und nutzen können
**damit** ich es direkt verwenden kann

**Acceptance Criteria**:
- ✅ Fullscreen Bild-Anzeige im Modal
- ✅ "Teilen" Button (Native Share API)
- ✅ "Download" Button
- ✅ "Zurück zum Chat" Button
- ✅ Bild wird automatisch in Library gespeichert

### US-6: Library-Integration mit Animation

**Als** Lehrkraft
**möchte ich** sehen dass das Bild in der Library gelandet ist
**damit** ich weiß wo ich es später finde

**Acceptance Criteria**:
- ✅ Beim Modal-Schließen: Kurze Notification "In Library gespeichert"
- ✅ (Phase 2: Animation "Bild fliegt in Library")
- ✅ Im Chat: Thumbnail-Message "Bild wurde erstellt 🖼️"

---

## Requirements

### Must Have (P0)

#### Frontend Components

**1. AgentFormModal (Fullscreen)**

Based on Gemini Mockup "Generate" View:

```typescript
interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentType: 'image-generation';  // only this for Phase 1
  prefilledData: {
    prompt?: string;
    style?: string;
    context?: string;
  };
  onSubmit: (params: AgentParams) => void;
}
```

**Design** (Gemini-inspired):
- Fullscreen: `h-full flex flex-col`
- Header: `p-6 pb-2 flex-shrink-0`
  - Title: `text-3xl font-bold` color `#FB6542`
  - Subtitle: `text-gray-500 mt-1`
- Form: `flex-grow overflow-y-auto px-6 py-4`
  - Labels: `text-sm font-medium text-gray-500`
  - Inputs: `bg-gray-50 border border-gray-200 rounded-lg p-3`
  - Focus: `focus:ring-2 focus:ring-[#FB6542]`
- Footer: `p-6 pt-2 flex-shrink-0`
  - Button: `w-full bg-[#FB6542] text-white font-bold py-4 rounded-xl`

**Form Fields**:
```typescript
interface ImageGenerationParams {
  description: string;    // Textarea, vorausgefüllt
  style?: string;         // Select: "Realistisch" | "Comic" | "Aquarell" | "Fotografie" | "Digital Art"
  aspectRatio?: string;   // Select: "Quadratisch (1:1)" | "Landschaft (16:9)" | "Hochformat (9:16)"
  quality?: string;       // Select: "Standard" | "HD" (default: Standard)
}
```

**2. AgentProgressView**

```typescript
interface AgentProgressViewProps {
  status: 'running' | 'completed' | 'failed';
  progress: number;  // 0-100
  message: string;   // "Bild wird erstellt..."
  estimatedTime?: number;  // seconds remaining
  onCancel?: () => void;
}
```

**Design**:
- Replace Form Content with Progress
- Spinner/Progress Bar
- Status Message (large, centered)
- "Abbrechen" Button (if cancelable)

**3. AgentResultView**

```typescript
interface AgentResultViewProps {
  result: {
    type: 'image';
    url: string;
    prompt: string;
    metadata: Record<string, any>;
  };
  onShare: () => void;
  onDownload: () => void;
  onClose: () => void;
}
```

**Design**:
- Fullscreen Image Display
- Image fills screen (max-width, centered)
- Actions at bottom:
  - "Teilen" Button (uses Web Share API)
  - "Herunterladen" Button
  - "Zurück zum Chat" Button (primary)

#### Backend Integration

**1. Agent Detection in Chat**

```typescript
// POST /api/chat (existing endpoint - enhance)
// Response includes:
interface ChatResponse {
  message: string;
  agentSuggestion?: {
    type: 'image-generation';
    confidence: number;  // 0-1
    prompt: string;      // extracted from conversation
    context: string;     // last 2-3 messages
  };
}
```

**Implementation**:
- ChatGPT erkennt Agent-Request via System Prompt
- Response enthält `agentSuggestion` wenn passend
- Frontend zeigt Button "Ja, Bild erstellen" im Chat

**2. Agent Execution API** (already exists ✅)

```typescript
// POST /api/langgraph-agents/execute
interface ExecuteRequest {
  agentId: 'image-generation-agent';
  params: {
    prompt: string;
    style?: string;
    aspectRatio?: string;
    quality?: string;
  };
  userId: string;
  sessionId?: string;
  progressLevel: 'user_friendly';  // simplified for UI
}

interface ExecuteResponse {
  success: true;
  data: {
    executionId: string;
    status: 'running';
    estimatedTime: number;
  };
}
```

**3. Progress Streaming** (already exists ✅)

```typescript
// SSE: /api/langgraph-agents/progress/:executionId
// Events:
{
  type: 'progress',
  data: {
    percentage: 50,
    message: 'Bild wird erstellt...',
    level: 'user_friendly'
  }
}

{
  type: 'completed',
  data: {
    result: {
      urls: ['https://...'],
      prompt: '...',
      metadata: {...}
    }
  }
}
```

**4. Save to Library** (NEW)

```typescript
// Auto-save after generation
// POST /api/materials (existing endpoint)
// Save generated image to InstantDB `generated_artifacts`
```

#### Chat Integration

**1. Agent Suggestion Message**

```typescript
// New Chat Message Type
interface AgentSuggestionMessage {
  type: 'agent-suggestion';
  agent: 'image-generation';
  prompt: string;
  confidence: number;
}
```

**UI**:
```tsx
<div className="chat-bubble-bot">
  <p>Soll ich ein Bild für dich erstellen?</p>
  <button
    className="mt-2 px-4 py-2 bg-[#FB6542] text-white rounded-lg"
    onClick={() => openAgentModal('image-generation', { prompt })}
  >
    Ja, Bild erstellen ✨
  </button>
  <button
    className="mt-2 ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
    onClick={() => continueChat()}
  >
    Nein, weiter chatten
  </button>
</div>
```

**2. Agent Result Message**

```typescript
interface AgentResultMessage {
  type: 'agent-result';
  agent: 'image-generation';
  result: {
    url: string;
    thumbnail: string;
  };
  timestamp: number;
}
```

**UI**:
```tsx
<div className="chat-bubble-bot">
  <p className="font-bold">🖼️ Bild wurde erstellt</p>
  <img src={thumbnail} className="mt-2 rounded-lg w-32 h-32 object-cover cursor-pointer"
       onClick={() => reopenResult(result)} />
  <p className="text-xs text-gray-500 mt-1">In Library gespeichert</p>
</div>
```

### Should Have (P1)

1. **Retry on Failure**:
   - Error View in Modal
   - "Nochmal versuchen" Button
   - Error Message (German)

2. **Library Notification**:
   - Toast: "Bild in Library gespeichert ✓"
   - Dismissable after 3s

3. **Multiple Image Styles**:
   - 5+ Style Presets
   - Preview Icons für Styles

### Nice to Have (P2)

1. **Animation "Bild fliegt in Library"**:
   - CSS Animation beim Modal-Close
   - Bild verkleinert sich und fliegt zum Library Tab
   - Requires: Library Tab visible animation trigger

2. **Agent History in Modal**:
   - "Kürzlich erstellt" Section
   - Quick Access zu letzten Generationen

3. **Batch Generation**:
   - "4 Varianten erstellen" Option
   - Grid View für Results

---

## Success Criteria

### Functional

- ✅ Chat erkennt Agent-Requests und zeigt Suggestion
- ✅ Modal öffnet mit vorausgefüllten Daten
- ✅ User kann Parameter anpassen
- ✅ Agent startet nach Confirmation
- ✅ Progress wird live angezeigt
- ✅ Result wird groß und klar angezeigt
- ✅ Download & Share funktionieren
- ✅ Bild wird in Library gespeichert
- ✅ Chat zeigt Thumbnail vom Ergebnis

### Non-Functional

- ✅ Modal öffnet in <200ms
- ✅ Progress Updates alle <1s
- ✅ Image Load in <2s
- ✅ Mobile Responsive (Fullscreen)
- ✅ Keine Memory Leaks (SSE cleanup)

### User Experience

- ✅ User versteht Workflow intuitiv
- ✅ Keine "Black Box" während Generation
- ✅ Results sind direkt nutzbar
- ✅ Library-Integration ist klar

---

## Scope & Constraints

### In Scope ✅

- Image Generation Agent UI (only)
- Fullscreen Modal (Gemini-inspired)
- Chat Integration (Suggestion + Result Messages)
- Progress Streaming (SSE)
- Library Auto-Save
- Download & Share Actions

### Out of Scope ❌

- Multiple Agents parallel
- Web Search Agent UI (separate spec)
- Complex Workflows (multi-step)
- Agent Settings/Preferences
- Animation "Bild fliegt in Library" (P2 - Phase 2)

### Constraints

1. **Backend Ready**: Kein Backend-Development nötig
2. **Mobile First**: Modal muss auf Mobile perfekt sein
3. **Gemini Design**: Folge Gemini Mockup Visual Language
4. **Single Agent**: Nur Image Generation für Phase 1

---

## Technical Architecture

### Component Hierarchy

```
App
├── ChatView
│   ├── MessageList
│   │   ├── UserMessage
│   │   ├── AssistantMessage
│   │   ├── AgentSuggestionMessage ⭐ NEW
│   │   └── AgentResultMessage ⭐ NEW
│   └── ChatInput
└── AgentModal ⭐ NEW (Fullscreen)
    ├── AgentFormView (initial)
    ├── AgentProgressView (during execution)
    └── AgentResultView (after completion)
```

### State Management

```typescript
// Global Agent State (Context or Zustand)
interface AgentState {
  isModalOpen: boolean;
  currentAgent: 'image-generation' | null;
  phase: 'form' | 'progress' | 'result';
  formData: AgentFormData | null;
  execution: {
    id: string;
    status: 'running' | 'completed' | 'failed';
    progress: number;
    message: string;
  } | null;
  result: AgentResult | null;
}

// Actions
const openAgentModal = (agent: string, prefill: any) => void;
const closeAgentModal = () => void;
const submitAgentForm = (data: any) => void;
const cancelExecution = () => void;
```

### Data Flow

```
1. User: "Erstelle ein Bild von einem Löwen"
   ↓
2. POST /api/chat → Response includes agentSuggestion
   ↓
3. Frontend: Render AgentSuggestionMessage mit Button
   ↓
4. User: Click "Ja, Bild erstellen"
   ↓
5. Frontend: Open AgentModal (phase='form', prefilled)
   ↓
6. User: Adjust params, click "Bild generieren"
   ↓
7. POST /api/langgraph-agents/execute → executionId
   ↓
8. SSE /api/langgraph-agents/progress/:executionId
   ↓
9. Modal: phase='progress', show spinner + updates
   ↓
10. SSE Event: type='completed' → result data
    ↓
11. Modal: phase='result', show image
    ↓
12. Auto-save: POST /api/materials (generated_artifact)
    ↓
13. User: Click "Zurück zum Chat"
    ↓
14. Modal closes, Chat shows AgentResultMessage (thumbnail)
    ↓
15. Optional: Toast "In Library gespeichert ✓"
```

---

## Design System (Gemini-inspired)

### Colors

```css
/* Primary */
--color-primary: #FB6542;  /* Orange/Coral */
--color-primary-hover: #e55532;

/* Background */
--color-bg-page: #D3E4E6;  /* Turquoise */
--color-bg-card: #f9f9f9;  /* Light Gray */
--color-bg-input: #f3f4f6; /* Gray-50 */

/* Text */
--color-text-primary: #1f2937;  /* Gray-800 */
--color-text-secondary: #6b7280; /* Gray-500 */
--color-text-tertiary: #9ca3af;  /* Gray-400 */

/* Borders */
--color-border: #e5e7eb;  /* Gray-200 */
```

### Typography

```css
/* Headings */
--font-family: 'Inter', sans-serif;
--text-3xl: 1.875rem;  /* 30px - Modal Title */
--text-lg: 1.125rem;   /* 18px - Section Titles */
--text-base: 1rem;     /* 16px - Body */
--text-sm: 0.875rem;   /* 14px - Labels */
--text-xs: 0.75rem;    /* 12px - Helper Text */
```

### Spacing

```css
--space-modal-padding: 1.5rem;  /* 24px - p-6 */
--space-input-padding: 0.75rem; /* 12px - p-3 */
--space-button-padding: 1rem;   /* 16px - py-4 */
```

### Components

**Modal Container**:
```tsx
<IonModal isOpen={isOpen} className="agent-modal">
  <div className="h-full flex flex-col bg-white">
    {/* Content */}
  </div>
</IonModal>
```

**Form Input**:
```tsx
<div>
  <label className="text-sm font-medium text-gray-500">
    Bildbeschreibung
  </label>
  <textarea
    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg p-3
               focus:outline-none focus:ring-2 focus:ring-[#FB6542]"
    rows={4}
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
</div>
```

**Primary Button**:
```tsx
<button
  className="w-full bg-[#FB6542] text-white text-base font-bold py-4 rounded-xl
             hover:opacity-90 transition-opacity disabled:opacity-50"
  onClick={handleSubmit}
  disabled={isLoading}
>
  Bild generieren ✨
</button>
```

---

## Risks & Mitigations

### Risk 1: SSE Connection Issues

**Impact**: High (no progress updates)
**Mitigation**:
- Timeout after 60s
- Fallback auf Polling (GET every 2s)
- Error Handling with Retry

### Risk 2: Chat überschreibt Agent Suggestion

**Impact**: Medium (User verliert Suggestion)
**Mitigation**:
- Agent Suggestion bleibt im Chat History
- Button clickable auch nach neuen Messages

### Risk 3: Image Generation dauert zu lange

**Impact**: Medium (User verliert Geduld)
**Mitigation**:
- Realistic estimated time (10-30s)
- Progress Messages ("Prompt wird optimiert...", "Bild wird heruntergeladen...")
- Cancel Button

### Risk 4: Library Save schlägt fehl

**Impact**: Medium (Bild ist lost)
**Mitigation**:
- Retry Logic (3 attempts)
- Fallback: User bekommt Download-Button
- Error Message: "Konnte nicht in Library speichern, bitte herunterladen"

---

## Open Questions

1. **Agent Detection - wie intelligent?**
   - Simple Keyword-Matching ("erstelle bild", "generiere", etc.)
   - Oder ChatGPT entscheidet? → **Empfehlung: ChatGPT** (flexibler)

2. **SSE vs Polling?**
   - SSE ist implementiert ✅
   - Aber Fallback auf Polling? → **Empfehlung: Ja** (robuster)

3. **Error Retry - automatisch oder manual?**
   - Auto-Retry (3x) bei Network Errors?
   - Oder immer Manual? → **Empfehlung: Auto für Network, Manual für API Errors**

---

## Dependencies

### Technical Dependencies

- ✅ Ionic Modal (`IonModal`)
- ✅ SSE Client (native `EventSource` oder `eventsource-polyfill`)
- ✅ Web Share API (native)
- ✅ LangGraph Backend APIs (fertig)

### Feature Dependencies

- ✅ Chat System (funktioniert)
- ✅ Library System (funktioniert)
- ✅ Image Generation Agent Backend (fertig)

### Blockers

- ❌ None

---

## Implementation Plan (High-Level)

### Phase A: Modal Components (4h)
1. Create `AgentModal.tsx` container
2. Create `AgentFormView.tsx` (Gemini design)
3. Create `AgentProgressView.tsx`
4. Create `AgentResultView.tsx`

### Phase B: Chat Integration (3h)
1. Enhance `/api/chat` Response (Agent Detection)
2. Create `AgentSuggestionMessage` component
3. Create `AgentResultMessage` component
4. Integrate Modal trigger from Chat

### Phase C: Agent Execution (3h)
1. Create `useAgentExecution` hook (SSE integration)
2. Connect Form → Execution → Result
3. Error Handling & Retry Logic
4. Auto-save to Library

### Phase D: Testing (2h)
1. Unit tests for Components
2. Integration tests for Chat Flow
3. E2E tests with Playwright (Modal open → Generate → Result)

### Phase E: Polish & Documentation (1h)
1. Loading states, animations
2. Session Log erstellen
3. Update README

**Total Time**: 13 hours

---

## Next Steps

1. **Review & Approve** diese Spec
2. **Create** `plan.md` (Detailed Component Architecture)
3. **Create** `tasks.md` (Actionable Task List mit Tests)
4. **Implement** (Frontend-Agent + Backend-Agent + QA-Agent)

---

## Appendix

### Backend API Endpoints (Reference)

```
POST   /api/langgraph-agents/execute
GET    /api/langgraph-agents/status
SSE    /api/langgraph-agents/progress/:executionId
POST   /api/materials (save to library)
```

### Gemini Mockup Reference

- **Colors**: `#FB6542` (Primary), `#D3E4E6` (BG)
- **Fonts**: Inter (400-800)
- **Pattern**: Fullscreen Views mit Form → Loading → Result

---

**Maintained by**: Frontend-Agent, Backend-Agent
**Status**: Ready for `/plan` (Technical Planning)