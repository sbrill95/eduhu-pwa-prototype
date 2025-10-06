# Image Generation UX Improvements V2 - Specification

**Feature Name**: Image Generation Complete Workflow Fix
**Version**: 2.0
**Status**: Specification
**Created**: 2025-10-05
**Priority**: P0 - CRITICAL

---

## 1. Problem Statement

### Current Issues (User-Reported)

Die Bildgenerierungs-Funktion hat **kritische UX- und funktionale Probleme**:

#### 1.1 Agent Confirmation Modal
**Problem**: Klick-Elemente zu klein für Touch-Bedienung
- Buttons entsprechen **nicht** Touch-Standards (< 44x44px)
- **Falsche Button-Reihenfolge**:
  - IST: Links "Weiter im Chat", Rechts "Bild-Generierung starten"
  - SOLL: Links "Bild-Generierung starten", Rechts "Weiter im Chat"
- **Falsche UI** wird angezeigt (OLD green button statt NEW Gemini orange)

#### 1.2 Datenübernahme fehlt
**Problem**: Chat-Kontext wird nicht ins Agent-Formular übertragen
- User schreibt: "Erstelle ein Bild zur Photosynthese für Klasse 7"
- Modal öffnet sich → Felder sind **leer**
- User muss alles **nochmal** eingeben (frustrierend!)

#### 1.3 Generierungs-Animation
**Problem**: Animation erscheint **doppelt**
- Einmal in der Mitte (korrekt)
- Einmal "oben links" (redundant, muss entfernt werden)

#### 1.4 Library-Speicherung fehlerhaft
**Problem**: Meldung "In Library gespeichert" erscheint, aber Bild ist **nicht** da
- Backend speichert vermutlich in falsche Tabelle
- Filter "Bilder" fehlt oder funktioniert nicht

#### 1.5 Bild fehlt im Chat
**Problem**: Nach Generierung erscheint Bild **nicht** im Chat-Verlauf
- User kann sich in Follow-up-Messages **nicht** auf Bild beziehen
- ChatGPT hat **keinen** visuellen Kontext

#### 1.6 Preview-Funktion fehlt
**Problem**: Klick auf Bild im Chat öffnet keine Preview
- Keine Möglichkeit zum **Teilen**
- Keine Möglichkeit zur **Neu-Generierung**

---

## 2. Solution Vision

### 2.1 User Journey (SOLL-Zustand)

```
1. USER schreibt: "Erstelle ein Bild zur Photosynthese für Klasse 7"
   ↓
2. SYSTEM erkennt: Bildgenerierungs-Request (Backend Agent Detection)
   ↓
3. CHAT zeigt: Agent Confirmation (Gemini Design, Orange/Teal)
   - Links: "Bild-Generierung starten" (Orange Primary)
   - Rechts: "Weiter im Chat" (Gray Secondary)
   - Touch-Targets: Mindestens 44x44px
   ↓
4. USER klickt: "Bild-Generierung starten"
   ↓
5. MODAL öffnet: Agent Form (vorausgefüllt!)
   - Beschreibung: "Photosynthese für Klasse 7" (aus Chat)
   - Bildstil: "Realistisch" (Default)
   ↓
6. USER klickt: "Bild generieren"
   ↓
7. PROGRESS angezeigt:
   - Nur EINE Animation in der Mitte
   - Kein redundanter Text "oben links"
   ↓
8. GENERIERUNG abgeschlossen:
   - Bild wird in `library_materials` gespeichert (type: 'image')
   - Chat-Message wird erstellt mit Bild-URL
   ↓
9. PREVIEW-MODAL öffnet automatisch:
   - Zeigt generiertes Bild
   - Buttons: "Teilen" + "Weiter im Chat" + "Neu generieren"
   ↓
10. USER klickt: "Weiter im Chat"
    ↓
11. CHAT aktualisiert:
    - Bild erscheint im Verlauf (klickbar)
    - ChatGPT kann über Bild sprechen
    ↓
12. USER kann:
    - Bild in Library finden (Filter "Bilder")
    - Auf Bild klicken → Preview mit Teilen/Neu generieren
    - Follow-up fragen: "Mach das Bild bunter"
```

---

## 3. User Stories

### US-1: Touch-gerechte Agent Confirmation
**Als** Lehrkraft auf mobilem Gerät
**möchte ich** dass Buttons groß genug zum Antippen sind
**damit** ich nicht versehentlich den falschen Button treffe

**Acceptance Criteria**:
- [ ] Alle Buttons mindestens 44x44px (iOS Standard)
- [ ] Button-Reihenfolge: Links "Bild-Generierung", Rechts "Chat"
- [ ] Primary Action (Bild-Generierung) visuell prominenter (Orange)
- [ ] Secondary Action (Chat) weniger prominent (Gray)

---

### US-2: Chat-Kontext automatisch übernehmen
**Als** Lehrkraft
**möchte ich** dass meine Chat-Nachricht ins Formular übernommen wird
**damit** ich nicht zweimal tippen muss

**Acceptance Criteria**:
- [ ] Agent Form öffnet mit vorausgefüllter Beschreibung aus Chat
- [ ] Relevante Kontext-Daten (Fach, Klassenstufe) werden extrahiert
- [ ] User kann Felder vor Generierung anpassen

---

### US-3: Saubere Progress-Animation
**Als** Lehrkraft
**möchte ich** eine klare, einfache Ladeanimation sehen
**damit** ich weiß, dass das System arbeitet

**Acceptance Criteria**:
- [ ] Nur EINE Animation in der Mitte des Bildschirms
- [ ] Keine doppelten/redundanten Texte
- [ ] Progress-Indikator zeigt Status klar an

---

### US-4: Bild in Library speichern
**Als** Lehrkraft
**möchte ich** generierte Bilder in der Library unter "Bilder" finden
**damit** ich sie später wiederverwenden kann

**Acceptance Criteria**:
- [ ] Bild wird in `library_materials` gespeichert (`type: 'image'`)
- [ ] Library hat Filter "Bilder" (neben "Alle", "Materialien")
- [ ] Bild erscheint sofort nach Generierung in Library
- [ ] Metadaten: Titel, Beschreibung, imageUrl, Tags

---

### US-5: Bild im Chat anzeigen
**Als** Lehrkraft
**möchte ich** das generierte Bild im Chat sehen
**damit** ich mich in Follow-up-Nachrichten darauf beziehen kann

**Acceptance Criteria**:
- [ ] Nach Generierung erscheint Bild-Message im Chat
- [ ] Message zeigt Thumbnail (max 300px width)
- [ ] Klick auf Bild öffnet Preview-Modal
- [ ] ChatGPT erhält Bild-URL im Conversation-Context

---

### US-6: Preview mit Teilen/Neu generieren
**Als** Lehrkraft
**möchte ich** das Bild teilen oder neu generieren können
**damit** ich schnell iterieren kann

**Acceptance Criteria**:
- [ ] Preview-Modal zeigt 3 Buttons:
  - "Teilen 🔗" (Web Share API)
  - "Weiter im Chat 💬" (schließt Modal)
  - "Neu generieren 🔄" (öffnet Form mit gleichen Params)
- [ ] Klick auf "Neu generieren" öffnet Agent Form vorausgefüllt
- [ ] Beide Bilder (Original + Neu) landen in Library

---

## 4. Technical Requirements

### 4.1 Frontend Changes

#### A) Agent Confirmation (AgentConfirmationMessage.tsx)
**Current Issue**: OLD green button interface erscheint statt NEW Gemini

**Root Cause** (aus QA Report):
```typescript
// useChat.ts:704-810 - OLD client-side detection runs FIRST
// Frontend ignoriert backend agentSuggestion Response!
```

**Required Fix**:
1. **Disable OLD client-side detection** (useChat.ts:704)
2. **Check backend `response.agentSuggestion` FIRST** (useChat.ts:903)
3. **Render NEW Gemini interface** (AgentConfirmationMessage.tsx:254-302)

**Touch-Target Requirements**:
- Minimum button height: **44px** (iOS) / **48px** (Android)
- Minimum button width: **140px** (für Text-Lesbarkeit)
- Gap zwischen Buttons: **8px**

**Button Layout**:
```tsx
<div className="flex gap-2">
  {/* PRIMARY - Left */}
  <button className="flex-1 bg-primary-500 text-white h-12">
    Bild-Generierung starten ✨
  </button>

  {/* SECONDARY - Right */}
  <button className="flex-1 bg-gray-100 text-gray-700 h-12">
    Weiter im Chat 💬
  </button>
</div>
```

---

#### B) Data Prefill (AgentFormView.tsx)
**Current Issue**: Formular-Felder sind leer, obwohl Chat-Kontext verfügbar

**Required**:
1. Extract `description` from `agentSuggestion.prefillData`
2. Auto-populate `description` textarea
3. Extract context (Fach, Klassenstufe) from Chat-History

**Implementation**:
```tsx
// AgentFormView.tsx
const AgentFormView = ({ formData, sessionId }) => {
  const [description, setDescription] = useState(
    formData?.description || formData?.theme || '' // Support both fields
  );

  useEffect(() => {
    // Prefill from Chat context
    if (formData?.description) {
      setDescription(formData.description);
    }
  }, [formData]);

  // ...
};
```

---

#### C) Progress Animation (AgentProgressView.tsx)
**Current Issue**: Doppelte Animation ("oben links" + Mitte)

**Required Fix**: Identify and remove duplicate progress indicator

**Investigation needed**:
1. Where is "oben links" animation rendered?
2. Is it in AgentProgressView itself or parent component?
3. Remove redundant element

---

#### D) Library Integration (Library.tsx)
**Current Issue**: Filter "Bilder" fehlt oder funktioniert nicht

**From Existing Spec** (image-generation-improvements):
```tsx
// Library.tsx - Filter Tabs
const artifactTypes = [
  { key: 'all', label: 'Alle', icon: gridOutline },
  { key: 'materials', label: 'Materialien', icon: documentTextOutline },
  { key: 'images', label: 'Bilder', icon: imagesOutline } // ✅ ADD THIS
];
```

**Required**:
1. Add "Bilder" filter chip
2. Query `library_materials` where `type === 'image'`
3. Display image thumbnails in grid

---

#### E) Chat Image Display (ChatView.tsx)
**Current Issue**: Generierte Bilder erscheinen nicht im Chat

**Required**:
1. Detect messages with `metadata.type === 'image'`
2. Render image thumbnail (max 300px)
3. Make clickable → opens Preview Modal

**Implementation**:
```tsx
// ChatView.tsx - Message Rendering
{message.metadata?.type === 'image' && (
  <div
    className="cursor-pointer"
    onClick={() => openPreviewModal(message.metadata.image_url)}
  >
    <img
      src={message.metadata.image_url}
      alt="Generated Image"
      className="max-w-[300px] rounded-lg"
    />
  </div>
)}
```

---

#### F) Preview Modal with Re-Generation (MaterialPreviewModal.tsx)
**Current Issue**: Kein "Neu generieren" Button

**Required**: Add 3rd button to existing modal
```tsx
<div className="flex gap-2 mt-4">
  <button onClick={handleShare}>Teilen 🔗</button>
  <button onClick={handleClose}>Weiter im Chat 💬</button>
  <button onClick={handleRegenerate}>Neu generieren 🔄</button>
</div>
```

**handleRegenerate**:
```tsx
const handleRegenerate = () => {
  const originalParams = {
    description: material.description,
    imageStyle: material.image_style || 'realistic'
  };

  closePreviewModal();
  openAgentModal('image-generation', originalParams, sessionId);
};
```

---

### 4.2 Backend Changes

#### A) InstantDB Save (langGraphAgents.ts)
**Current Status** (from QA Report): ✅ Already implemented (Lines 323-344)

**Verification needed**:
1. Confirm `library_materials` save happens
2. Confirm `messages` save with image metadata
3. Confirm `sessionId` is propagated correctly

**Expected Flow**:
```typescript
// langGraphAgents.ts:323-344
if (result.success && agentId === 'langgraph-image-generation') {
  // 1. Save to library_materials
  await db.transact([
    db.tx.library_materials[imageLibraryId].update({
      type: 'image',
      content: result.data.image_url,
      title: generatedTitle,
      // ...
    })
  ]);

  // 2. Save to messages (chat history)
  if (sessionId) {
    await db.transact([
      db.tx.messages[imageChatMessageId].update({
        role: 'assistant',
        content: 'Ich habe ein Bild für dich erstellt.',
        metadata: JSON.stringify({
          type: 'image',
          image_url: result.data.image_url,
          library_id: imageLibraryId
        })
      })
    ]);
  }
}
```

---

#### B) Chat Context for Image
**Required**: ChatGPT should know about generated image

**Implementation**: Include image in OpenAI messages
```typescript
// chatService.ts - Build messages array
const messages = [
  { role: 'system', content: systemPrompt },
  ...previousMessages.map(msg => {
    if (msg.metadata?.type === 'image') {
      return {
        role: 'assistant',
        content: [
          { type: 'text', text: msg.content },
          {
            type: 'image_url',
            image_url: { url: msg.metadata.image_url }
          }
        ]
      };
    }
    return { role: msg.role, content: msg.content };
  }),
  { role: 'user', content: currentMessage }
];
```

---

## 5. Success Criteria

### Functional
- [ ] Agent Confirmation shows NEW Gemini interface (orange/teal)
- [ ] Buttons are min 44x44px (touch-compliant)
- [ ] Button order: Left "Bild-Generierung", Right "Chat"
- [ ] Agent Form prefills description from Chat
- [ ] Only ONE progress animation (no duplicates)
- [ ] Generated image saved to `library_materials` (type: 'image')
- [ ] Library filter "Bilder" shows generated images
- [ ] Image appears in Chat after generation
- [ ] Click on Chat image opens Preview Modal
- [ ] Preview Modal has "Neu generieren" button
- [ ] Re-generation uses previous parameters
- [ ] Both images saved to Library
- [ ] ChatGPT can reference image in follow-ups

### Non-Functional
- [ ] Touch targets comply with iOS HIG / Material Design
- [ ] Animations smooth (60fps)
- [ ] No visual glitches on mobile
- [ ] E2E test coverage > 80%

---

## 6. Out of Scope

- Image editing (crop, filter)
- Batch generation (multiple images)
- Background generation (async jobs)
- Image-to-Image (upload + modify)

---

## 7. Dependencies

### Existing Features (Must Not Break)
- ✅ Agent Detection (backend `agentSuggestion`)
- ✅ Library Materials System
- ✅ Chat Message History
- ✅ Material Preview Modal

### External Dependencies
- InstantDB (storage)
- OpenAI DALL-E 3 (image generation)
- Web Share API (sharing)

---

## 8. Open Questions for User

### Q1: Touch Target Sizes
**User hat bereits angegeben**: "Zu klein für Touch"
**Vorgeschlagene Lösung**: 44x44px minimum (iOS Standard)
**Frage**: Akzeptiert? Oder andere Mindestgröße gewünscht?

### Q2: Button Layout
**User hat angegeben**: "Links Bild-Generierung, Rechts Chat"
**Vorgeschlagene Umsetzung**:
- Links: Orange Primary (prominent)
- Rechts: Gray Secondary (subtle)
**Frage**: Visual Hierarchy korrekt?

### Q3: Doppelte Animation "oben links"
**Frage**: Wo genau ist diese Animation?
- Im Progress-Modal selbst?
- Im Chat-Header?
- In einem anderen UI-Element?

### Q4: Library-Speicherung
**Frage**: Sollen Bilder:
- NUR unter "Bilder" erscheinen? ✅
- ODER auch unter "Alle" (mit Materialien gemischt)? ✅

### Q5: Bild im Chat
**Frage**: Wie soll das Bild dargestellt werden?
- Als Thumbnail (300px) im Message-Bubble? ✅ (vorgeschlagen)
- Als Full-Width Image?
- Mit Metadaten (Prompt, Stil) sichtbar? ❌ (vorgeschlagen: versteckt)

### Q6: "Neu generieren" Workflow
**Frage**: Was passiert nach "Neu generieren"?
- Form öffnet mit gleichen Params → User kann anpassen → Neu-Gen ✅
- Direkt neu generieren ohne Form (gleiche Params, keine Anpassung)? ❌

---

## 9. Related Documents

- **QA Report**: `docs/quality-assurance/verification-reports/FINAL-QA-REPORT-IMAGE-GENERATION.md`
- **Previous Spec**: `.specify/specs/image-generation-improvements/spec.md`
- **Gemini Modal Spec**: `.specify/specs/image-generation-modal-gemini/spec.md`
- **Bug Tracking**: `docs/quality-assurance/bug-tracking.md`
- **Session Logs**: `docs/development-logs/sessions/2025-10-04/`

---

## 10. Approval

**Status**: ⏳ Awaiting User Feedback on Open Questions
**Next Step**: After Q&A → Create `plan.md` (Technical Design)
**Estimated Effort**: 2-3 days (Frontend + Backend + E2E Testing)

---

**Created**: 2025-10-05
**Author**: General-Purpose Agent
**Reviewed By**: [Pending]
