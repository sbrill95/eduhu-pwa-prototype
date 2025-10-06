# Image Generation Modal - Gemini Workflow

**Feature Name**: Image Generation Modal (Gemini Design)
**Priority**: ⭐⭐⭐ P0 (Critical - Phase 3.2)
**Created**: 2025-10-02
**Status**: Specification
**Related Roadmap**: Phase 3.2 - Agent UI Enhancement

---

## 🎯 Problem Statement

### Current Situation ❌

Es existiert bereits ein **Agent-UI-Modal** (aus Phase 1.3), aber:

**Bestehende Lösung:**
- ✅ Agent-Modal mit Form → Progress → Result funktioniert
- ✅ Backend LangGraph Integration vorhanden
- ✅ Bildgenerierung technisch möglich

**Probleme:**
- ❌ **Keine User-Confirmation**: Agent startet sofort ohne Rückfrage (Kostenfalle!)
- ❌ **Nicht Gemini-konform**: Design passt nicht zum neuen Gemini-Mockup
- ❌ **Keine visuellen Hinweise**: User sieht nicht, dass Bild in Library gespeichert wurde
- ❌ **Fehlende Sharing-Optionen**: "Teilen"-Button existiert nicht
- ❌ **Alte Parameter**: Form-Felder basieren auf altem System, nicht auf neue Anforderungen

### User Pain Points

> "Der Agent hat einfach losgelegt und ich wollte das gar nicht. Das kostet doch Geld!" — Lehrkraft

> "Ich weiß nicht, wo mein generiertes Bild gelandet ist. Ist es in der Library?" — Lehrkraft

> "Ich möchte das Bild direkt teilen können, aber es gibt nur 'Download' und 'Zurück zum Chat'." — Lehrkraft

> "Die Parameter passen nicht. Ich brauche z.B. 'Lernschwierigkeiten' als Toggle, nicht 'Quality'." — Lehrkraft (aus alter Software)

---

## 💡 Solution Vision

### Desired State

Ein **2-Step-Workflow** mit Gemini-Design:

**Step 1: Confirmation**
- Chat erkennt: "User möchte Bild generieren"
- **Kleines Confirmation-Modal**: "Möchtest du jetzt die Bildgenerierung starten?"
- User kann ablehnen → weiter chatten
- User kann bestätigen → Agent-Modal öffnet

**Step 2: Bild-Generierungs-Modal**
- **Großes Fullscreen-Modal**
- **Vorausgefüllt** mit Chat-Context (z.B. "Ein Diagramm zur Photosynthese für Klasse 7")
- **Form-Fields**:
  - Beschreibung (Textarea, vorausgefüllt)
  - Bildstil (Dropdown: Realistisch, Cartoon, Illustrativ, Abstrakt)
- **2 Buttons**:
  - "Bild generieren" (startet Generierung)
  - "Zurück zum Chat" (schließt Modal ohne zu generieren)

**Step 3: Ladescreen**
- Zeigt während der Bildgenerierung
- Loading-Spinner + Text: "Dein Bild wird erstellt..."
- Keine User-Interaktion möglich

**Step 4: Preview-Modal**
- **Öffnet AUTOMATISCH** nach erfolgreicher Generierung
- Zeigt:
  - Generiertes Bild (Fullscreen)
  - **2 Buttons**: "Teilen 🔗" + "Weiter im Chat 💬"
  - Hinweis: "✅ In Library gespeichert"
- **Auto-Save** in Library mit Titel + Tags (im Hintergrund)

**Step 5: Visual Feedback**
- User klickt "Weiter im Chat"
- **Animation**: Bild-Miniatur fliegt zum Library-Tab (600ms)
- Preview-Modal schließt
- Chat zeigt Thumbnail-Message mit Bild

### Key Improvements

1. ✅ **User Control**: Explizite Confirmation vor Agent-Start
2. ✅ **Gemini-Design**: Form wie im Screenshot, ohne 4 Tabs
3. ✅ **Visual Feedback**: Animation zeigt, wo Bild gespeichert wurde
4. ✅ **Sharing**: Direkter "Teilen"-Button
5. ✅ **Parameter-Alignment**: Form-Fields basieren auf pädagogischen Anforderungen

---

## 🎨 User Stories

### US-1: Als Lehrkraft möchte ich gefragt werden, bevor der Agent startet

**Als** Lehrkraft
**möchte ich** explizit bestätigen, dass ich eine Bildgenerierung starten will
**damit** ich Kontrolle über Kosten und Aktionen habe

**Acceptance Criteria**:
- [ ] Chat erkennt Bildgenerierungs-Request
- [ ] ChatGPT antwortet: "Soll ich ein Bild für dich erstellen?"
- [ ] Inline-Button im Chat: "Ja, Bildgenerierung starten"
- [ ] Button öffnet großes Agent-Modal
- [ ] Wenn User "Nein" → Chat geht normal weiter

**Wireframe**: Confirmation-Message im Chat
```
┌────────────────────────────────────┐
│ 🤖 ChatGPT:                        │
│ Ich kann ein Bild zum Satz des     │
│ Pythagoras für dich erstellen.     │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 🖼️ Bildgenerierung             │ │
│ │ Erstelle ein maßgeschneidertes │ │
│ │ Bild für deinen Unterricht.    │ │
│ │                                │ │
│ │ [Ja, Bild erstellen ✨]        │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

---

### US-2: Als Lehrkraft möchte ich ein vorausgefülltes Formular sehen

**Als** Lehrkraft
**möchte ich** dass das Modal bereits die Chat-Informationen enthält
**damit** ich nicht alles nochmal eingeben muss

**Acceptance Criteria**:
- [ ] Modal öffnet mit "Beschreibung" vorausgefüllt (aus Chat-Context)
- [ ] Bildstil hat sinnvollen Default (z.B. "Realistisch")
- [ ] User kann beide Felder anpassen
- [ ] "Bild generieren"-Button startet Bildgenerierung
- [ ] "Zurück zum Chat"-Button schließt Modal ohne zu generieren

**Wireframe**: Bild-Generierungs-Modal (Gemini-Design)
```
┌────────────────────────────────────────────┐
│ Bildgenerierung                            │
│                                            │
│ Erstelle ein maßgeschneidertes Bild für   │
│ deinen Unterricht.                         │
│                                            │
│ Was soll das Bild zeigen?                 │
│ ┌────────────────────────────────────────┐ │
│ │ Ein Diagramm zur Photosynthese mit     │ │
│ │ beschrifteten Chloroplasten für        │ │
│ │ Klasse 7                               │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Bildstil                                   │
│ ┌────────────────────────────────────────┐ │
│ │ Realistisch                       ▼   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │   Bild generieren                      │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Zurück zum Chat                            │
└────────────────────────────────────────────┘
```

---

### US-3: Als Lehrkraft möchte ich das Bild direkt teilen können

**Als** Lehrkraft
**möchte ich** das generierte Bild direkt aus dem Modal teilen
**damit** ich es schnell an Kollegen oder Schüler schicken kann

**Acceptance Criteria**:
- [ ] Result-View zeigt 2 Buttons: "Teilen" + "Weiter im Chat"
- [ ] "Teilen"-Button nutzt Web Share API (wenn verfügbar)
- [ ] Fallback: Copy Link oder Download
- [ ] Share-Dialog öffnet sich nativ (iOS/Android)
- [ ] Nach Share: User kann weiter im Modal bleiben oder schließen

**Wireframe**: Result-View
```
┌────────────────────────────────────────────┐
│                                      [X]   │
│                                            │
│        ┌──────────────────────┐            │
│        │                      │            │
│        │   [Generated Image]  │            │
│        │                      │            │
│        └──────────────────────┘            │
│                                            │
│ ✅ In Bibliothek gespeichert               │
│                                            │
│ ┌──────────────┐  ┌──────────────────────┐ │
│ │ Teilen 🔗   │  │ Weiter im Chat 💬   │ │
│ └──────────────┘  └──────────────────────┘ │
└────────────────────────────────────────────┘
```

---

### US-4: Als Lehrkraft möchte ich sehen, dass das Bild gespeichert wurde

**Als** Lehrkraft
**möchte ich** visuell sehen, dass das Bild in der Library gelandet ist
**damit** ich weiß, wo ich es später finde

**Acceptance Criteria**:
- [ ] Beim Klick auf "Weiter im Chat": Animation startet
- [ ] Bild-Miniatur "fliegt" vom Modal zum Library-Tab
- [ ] Animation: 600ms, smooth easing
- [ ] Nach Animation: Modal schließt
- [ ] Im Chat: Thumbnail-Message "Bild wurde erstellt 🖼️"
- [ ] Notification (optional): "In Library gespeichert ✓"

**Animation-Flow**:
```
1. User klickt "Weiter im Chat"
2. Bild im Modal verkleinert sich (scale: 1 → 0.2)
3. Bild bewegt sich zur Library-Tab-Position (transform: translate)
4. Bild faded out (opacity: 1 → 0)
5. Modal schließt
6. Chat scrollt zu neuer Thumbnail-Message
```

---

### US-5: Als Lehrkraft möchte ich das Bild mit Tags finden können

**Als** Lehrkraft
**möchte ich** dass generierte Bilder automatisch mit Tags versehen werden
**damit** ich sie später in der Library schnell wiederfinden kann

**Acceptance Criteria**:
- [ ] Backend analysiert Bildbeschreibung automatisch
- [ ] Titel wird aus Beschreibung generiert (z.B. "Photosynthese Diagramm")
- [ ] Tags werden automatisch extrahiert (z.B. "Photosynthese", "Biologie", "Klasse 7")
- [ ] Tags sind in Library NICHT sichtbar (nur für Suche)
- [ ] Library-Suche findet Bild über Tags
- [ ] User kann in Library nach "Photosynthese" suchen → Bild wird gefunden

**Parameter-Mapping** (für Backend):
```typescript
interface ImageGenerationParams {
  description: string;        // "Ein Diagramm zur Photosynthese..."
  imageStyle: string;         // "realistic" | "cartoon" | "illustrative" | "abstract"
}

interface SavedImageMaterial {
  id: string;
  imageUrl: string;
  title: string;              // Auto-generiert: "Photosynthese Diagramm"
  description: string;        // Original user input
  tags: string[];            // Auto-generiert: ["Photosynthese", "Biologie", "Klasse 7"]
  imageStyle: string;
  createdAt: Date;
  userId: string;
}
```

---

## 🔍 Requirements

### Functional Requirements

#### FR-1: Confirmation-Modal im Chat

**Component**: `AgentConfirmationMessage.tsx`

```typescript
interface AgentConfirmationMessageProps {
  message: {
    content: string;
    agentSuggestion: {
      agentType: 'image-generation';
      reasoning: string;
      prefillData: {
        theme: string;
        learningGroup?: string;
      };
    };
  };
}
```

**Design** (Gemini-inspired):
- Gradient Background: `from-primary-50 to-background-teal/30`
- Card: White, rounded-xl, shadow-sm
- Icon: Sparkles (🎨 oder ✨)
- Button: Orange (`bg-primary-500`), "Ja, Bild erstellen"

---

#### FR-2: Bild-Generierungs-Modal mit Form

**Component**: `AgentFormView.tsx` (MODIFY existing)

**Form-Fields** (KORREKT für Bildgenerierung):
```typescript
interface ImageGenerationFormData {
  description: string;        // Textarea, required, vorausgefüllt aus Chat
  imageStyle: string;         // Dropdown: "Realistisch" | "Cartoon" | "Illustrativ" | "Abstrakt"
}
```

**Design** (Gemini-konform):
- Header: "Bildgenerierung" (KEIN Zurück-Pfeil, KEIN X-Button!)
- Title: "Erstelle ein maßgeschneidertes Bild für deinen Unterricht."
- Labels: `text-sm text-gray-700 font-medium mb-2`
- Textarea (Beschreibung): `bg-gray-50 rounded-lg p-3 min-h-[100px]`
- Dropdown (Bildstil): `bg-gray-50 rounded-lg p-3`
- **2 Buttons**:
  1. "Bild generieren" (Orange `bg-primary`, full-width, startet Generierung)
  2. "Zurück zum Chat" (Text-only, `text-gray-600`, schließt Modal)

**WICHTIG**:
- KEIN X-Button zum Schließen
- KEINE 4 Tabs unten
- Nur Formular + 2 Buttons

---

#### FR-3: Result-View mit 2 Buttons

**Component**: `AgentResultView.tsx` (MODIFY existing)

**Changes**:
- Replace "Download" + "Zurück zum Chat" Buttons
- **New Buttons**:
  1. **"Teilen 🔗"**: Web Share API + Fallback
  2. **"Weiter im Chat 💬"**: Trigger Animation + Close Modal

**Share-Funktion**:
```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: 'Generiertes Bild',
      text: result.metadata.prompt,
      url: result.data.imageUrl
    });
  } else {
    // Fallback: Copy Link
    await navigator.clipboard.writeText(result.data.imageUrl);
    toast.success('Link kopiert!');
  }
};
```

---

#### FR-4: Animation "Bild fliegt zur Library"

**Component**: `AgentResultView.tsx` (Animation-Trigger)

**Implementation**:
```typescript
const animateToLibrary = () => {
  const imageElement = document.querySelector('.result-image');
  const libraryTab = document.querySelector('ion-tab-button[tab="library"]');

  const imageRect = imageElement.getBoundingClientRect();
  const libraryRect = libraryTab.getBoundingClientRect();

  const deltaX = libraryRect.left - imageRect.left;
  const deltaY = libraryRect.top - imageRect.top;

  // Clone image for animation
  const clone = imageElement.cloneNode(true);
  clone.classList.add('flying-image');
  document.body.appendChild(clone);

  // Animate
  clone.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`, opacity: 0 }
  ], {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }).onfinish = () => {
    clone.remove();
    closeModal();
  };
};
```

**CSS**:
```css
.flying-image {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
}
```

---

### Non-Functional Requirements

#### NFR-1: Performance

- Animation: 60fps (CSS transform + opacity only)
- Modal öffnet in <200ms
- Share-Dialog öffnet in <500ms

#### NFR-2: Mobile-First

- Confirmation-Modal: Mobile-optimiert (max-width: 100%)
- Agent-Modal: Fullscreen auf Mobile
- Animation: Touch-friendly

#### NFR-3: Gemini Design Consistency

- Alle Farben aus Gemini-Palette
- Typography: Inter Font
- Spacing: Tailwind Standard
- Keine Abweichungen vom Screenshot

---

## 🔗 Dependencies

### Backend Dependencies

**Keine neuen Backend-Änderungen!**

Bestehende APIs:
- ✅ `POST /api/chat` (Agent-Detection via ChatGPT)
- ✅ `POST /api/langgraph-agents/execute` (Bildgenerierung)
- ✅ `SSE /api/langgraph-agents/progress/:id` (Progress)
- ✅ `POST /api/materials` (Library-Speicherung)

**Nur Parameter-Mapping anpassen**:
```typescript
// Backend: langGraphImageGenerationAgent.ts
// Map neue Form-Felder auf Prompt
const prompt = `
  Erstelle ein Bild für das Thema "${theme}".
  Zielgruppe: ${learningGroup}
  ${dazSupport ? 'Berücksichtige DaZ-Lernende (einfache Sprache, visuelle Unterstützung)' : ''}
  ${learningDifficulties ? 'Berücksichtige Lernschwierigkeiten (klare Struktur, weniger Ablenkung)' : ''}
`;
```

### Frontend Dependencies

- ✅ Ionic Modal
- ✅ Web Share API (native)
- ✅ Framer Motion (optional, für komplexere Animationen)
- ✅ Existing AgentContext

---

## 🚀 Success Criteria

### Functional

- [ ] Chat erkennt Bildgenerierungs-Request
- [ ] Confirmation-Message erscheint im Chat
- [ ] User kann bestätigen oder ablehnen
- [ ] Bild-Generierungs-Modal öffnet mit vorausgefüllter Beschreibung
- [ ] Formular zeigt 2 Felder: "Beschreibung" (Textarea) + "Bildstil" (Dropdown)
- [ ] 2 Buttons: "Bild generieren" + "Zurück zum Chat"
- [ ] KEIN X-Button zum Schließen
- [ ] "Bild generieren"-Button startet Generierung
- [ ] Ladescreen erscheint während Generierung
- [ ] Preview-Modal öffnet AUTOMATISCH nach Generierung
- [ ] Preview zeigt Bild + 2 Buttons ("Teilen", "Weiter im Chat")
- [ ] "Teilen"-Button funktioniert (Web Share API)
- [ ] "Weiter im Chat" startet Animation (Bild fliegt zur Library)
- [ ] Animation ist smooth (600ms, 60fps)
- [ ] Preview-Modal schließt nach Animation
- [ ] Chat zeigt Thumbnail-Message mit Bild
- [ ] Bild ist in Library gespeichert mit Titel + Tags
- [ ] Tags sind NICHT sichtbar in Library (nur für Suche)

### Non-Functional

- [ ] Animation: 60fps, 600ms Dauer
- [ ] Keine visuellen Bugs auf Mobile
- [ ] Share-Dialog öffnet nativ (iOS/Android)
- [ ] Kein Memory-Leak nach Animation
- [ ] TypeScript strict mode: No errors
- [ ] Playwright E2E Test: Animation verifiziert

### User Experience

- [ ] User versteht Workflow intuitiv
- [ ] Confirmation verhindert ungewollte Starts
- [ ] Formular fühlt sich "Gemini" an
- [ ] Animation macht Spaß, ist nicht nervig
- [ ] Share funktioniert out-of-the-box

---

## 🎯 Scope & Constraints

### In Scope ✅

1. Confirmation-Modal im Chat
2. Agent-Modal mit Gemini-Form (ohne Tabs)
3. Result-View mit "Teilen" + "Weiter im Chat"
4. Animation "Bild fliegt zur Library"
5. Parameter: Thema, Lerngruppe, DaZ, Lernschwierigkeiten
6. Auto-Save in Library (wie bisher)

### Out of Scope ❌

1. **4 Tabs** aus dem Screenshot (Home, Generieren, Automatisieren, Profil)
   → Nur das Modal selbst!
2. Weitere Agents (nur Image Generation)
3. Batch-Generierung (mehrere Bilder)
4. Komplexe Animations (nur "Bild fliegt")
5. Offline-Mode
6. Voice-Input

### Constraints

- **Design**: Exakt wie Gemini-Screenshot (Modal-Teil)
- **Backend**: Keine Breaking Changes
- **Mobile**: Muss perfekt funktionieren
- **Zeit**: 2-3 Tage Implementierung

---

## 📊 Analytics & Monitoring

### Events to Track

- `agent_confirmation_shown` - Confirmation-Modal angezeigt
- `agent_confirmation_accepted` - User bestätigt
- `agent_confirmation_rejected` - User lehnt ab
- `agent_modal_opened` - Agent-Modal öffnet
- `agent_form_submitted` - Formular abgeschickt
- `agent_result_shared` - "Teilen"-Button geklickt
- `agent_animation_triggered` - Animation gestartet
- `agent_image_saved_to_library` - Auto-Save erfolgreich

### Metrics to Monitor

- Confirmation-Acceptance-Rate (Ziel: >80%)
- Time-to-Generate (Ziel: <60s)
- Share-Click-Rate (Ziel: >30%)
- Animation-Completion-Rate (Ziel: 100%)

---

## 🎯 Constraints & Assumptions

### Constraints

- Gemini-Design ist führend (kein Abweichen vom Screenshot)
- Backend-APIs bleiben unverändert
- Mobile-First (Desktop ist nice-to-have)

### Assumptions

- Web Share API ist auf modernen Browsers verfügbar
- CSS Animations werden hardwarebeschleunigt
- User haben InstantDB-Zugriff (Library)
- ChatGPT kann verlässlich Bildgenerierungs-Requests erkennen

---

## 📚 References

- **Gemini Mockup**: `.specify/specs/Screenshot 2025-10-02 080256.png`
- **Bestehende Agent-UI**: `.specify/specs/agent-ui-modal/`
- **Roadmap**: `docs/project-management/roadmap-redesign-2025.md`
- **Design System**: `CLAUDE.md` (Gemini Design Language)

---

## ✅ Approval

**Specification Status**: ✅ Ready for Planning
**Next Step**: Create `plan.md` (Technical Design)
**Assigned Agents**:
- Frontend-Agent: Component Implementation
- Emotional-Design-Agent: Animation Polish
- QA-Agent: E2E Testing (Animation)

---

**Created**: 2025-10-02
**Author**: General-Purpose Agent
**Review Status**: Awaiting User Approval
