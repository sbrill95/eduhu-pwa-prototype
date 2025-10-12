# Image Generation UX V2 - Complete E2E Workflow

**Max**: 150 lines | **Status**: Ready for Implementation | **Priority**: P0

## Problem Statement

Der **komplette Bildgenerierungs-Workflow ist defekt**. User können aktuell KEINE Bilder generieren.

### 🔴 CRITICAL BLOCKER: Backend TypeScript Error
```
chatService.ts:92 - TS2375: Type mismatch in agentSuggestion.prefillData
Backend startet NICHT → Chat komplett defekt → "Failed to fetch" im Frontend
```

### Weitere kritische Issues:
1. **Chat-Fehler**: Backend TypeScript Error verhindert Server-Start
2. **Workflow kaputt**: User-Journey funktioniert nicht End-to-End
3. **Bild im Chat fehlt**: Generiertes Bild erscheint nicht im Chat-Verlauf
4. **Library-Integration fehlt**: Bilder nicht automatisch gespeichert
5. **Re-Generation fehlt**: Kein "Neu generieren" Button
6. **Animation doppelt**: Progress-Animation erscheint 2x

## User Story: Kompletter Workflow

**Als** Lehrkraft
**möchte ich** einfach und schnell Unterrichtsbilder generieren
**damit** ich meinen Unterricht visuell unterstützen kann

### Happy Path Workflow:
```
1. Chat öffnen → Nachricht schreiben "Erstelle ein Bild vom Satz des Pythagoras"
   ↓
2. Chat funktioniert (Backend sendet Antwort + agentSuggestion)
   ↓
3. Agent Confirmation erscheint im Chat (Orange Card mit 2 Buttons)
   ↓
4. User klickt "Bild-Generierung starten ✨"
   ↓
5. Fullscreen Agent Form öffnet (vorausgefüllt mit Chat-Kontext)
   ↓
6. User klickt "Generieren" (oder editiert Beschreibung)
   ↓
7. Progress Animation (EINE, mittig)
   ↓
8. Nach <30s: Bild erscheint in Preview (Fullscreen)
   ↓
9. User sieht 3 Optionen:
      - "Weiter im Chat 💬" → Bild erscheint als Mini-Thumbnail im Chat
      - "In Library öffnen 📚" → Navigiert zu Library → Bilder
      - "Neu generieren 🔄" → Form öffnet mit gleichen Parametern
   ↓
10. Bild ist AUTOMATISCH in Library gespeichert (Kategorie "Bilder")
    ↓
11. Im Chat: Bild als klickbares Thumbnail → Klick öffnet Preview
    ↓
12. In Library: Bild anklicken → Preview öffnet → "Neu generieren" Button
```

### Acceptance Criteria (Definition of Done):
- [ ] Backend startet ohne TypeScript-Fehler
- [ ] Chat funktioniert (POST /api/chat returns 200)
- [ ] Agent Confirmation erscheint im Chat (orange Card)
- [ ] Form öffnet fullscreen mit vorausgefüllten Daten
- [ ] Bild wird generiert (<30s)
- [ ] Bild erscheint im Chat als Thumbnail (klickbar)
- [ ] Bild ist automatisch in Library unter "Bilder"
- [ ] Preview hat "Neu generieren" Button
- [ ] Clicking Bild im Chat → Preview öffnet
- [ ] Clicking Bild in Library → Preview öffnet
- [ ] "Neu generieren" → Form mit Original-Params
- [ ] Nur EINE Progress-Animation (mittig)

## Technical Requirements

### 🔴 CRITICAL: Backend TypeScript Fix
**File**: `teacher-assistant/backend/src/services/chatService.ts:92`

**Problem**:
```typescript
// Line 92 - Type Error
const response: ChatResponse = {
  success: true,
  data: {
    agentSuggestion?: {
      prefillData: Record<string, unknown> | ImageGenerationPrefillData  // ❌ CONFLICT
    }
  }
}
```

**Root Cause**:
- `shared/types/api.ts:48` definiert `prefillData: Record<string, unknown>`
- `shared/types/agents.ts:24` definiert `prefillData: ImageGenerationPrefillData | Record<string, unknown>`
- TypeScript `exactOptionalPropertyTypes: true` → Type mismatch

**Fix Required**:
1. Entweder: `api.ts:48` ändern zu `prefillData: ImageGenerationPrefillData | Record<string, unknown>`
2. Oder: `chatService.ts:92` casten: `prefillData: agentSuggestion.prefillData as Record<string, unknown>`

### Frontend Components

#### 1. AgentConfirmationMessage.tsx
- Orange Gradient Card (Gemini Design)
- 2 Buttons (>= 44px height):
  - Links: "Bild-Generierung starten ✨" (bg-primary orange)
  - Rechts: "Weiter im Chat 💬" (bg-gray-100)

#### 2. AgentFormView.tsx
- Prefill `description` from `agentSuggestion.prefillData.description`
- Fullscreen (nicht Modal)

#### 3. AgentProgressView.tsx
- FIX: Entferne doppelte Animation ("oben links" duplicate)

#### 4. AgentResultView.tsx (Preview)
- 3 Action Buttons:
  - "Weiter im Chat 💬" → Navigate to Chat + Insert Thumbnail
  - "In Library öffnen 📚" → Navigate to Library (filter: Bilder)
  - "Neu generieren 🔄" → Re-open Form with same params

#### 5. ChatView.tsx
- Render `<img>` for messages with `metadata.type === 'image'`
- Thumbnail klickbar → Opens MaterialPreviewModal

#### 6. Library.tsx
- Filter Chip "Bilder" (imageOutline icon)
- Query: `type === 'image'`

#### 7. MaterialPreviewModal.tsx
- "Neu generieren 🔄" Button
- Opens AgentFormView with original params

### Backend Services

#### langGraphImageGenerationAgent.ts
- ✅ ALREADY IMPLEMENTED: Saves to library_materials
- ✅ ALREADY IMPLEMENTED: Creates chat message with metadata
- Verify: `metadata.type === 'image'`
- Verify: `metadata.image_url` set correctly

#### chatService.ts
- 🔴 FIX TypeScript error Line 92
- ✅ ALREADY IMPLEMENTED: Returns agentSuggestion

## Out of Scope

- Image editing (crop, resize, filters)
- Batch generation (multiple images at once)
- Background/async generation
- Image-to-Image (upload base image)
- Custom models (DALL-E 2, Stable Diffusion)

## Success Metrics

**Before**:
- ❌ Backend crashed (TypeScript error)
- ❌ Chat failed to fetch
- ❌ No images in Chat
- ❌ No images in Library

**After**:
- ✅ Backend starts clean
- ✅ Chat works end-to-end
- ✅ Images in Chat (thumbnails)
- ✅ Images in Library (auto-saved)
- ✅ Re-generation works
- ✅ ONE progress animation
- ✅ TypeScript: 0 errors
- ✅ Build: Clean
- ✅ E2E Test: Pass
