# Technical Plan - Image Generation UX V2

**Max**: 100 lines | **Focus**: E2E Workflow Implementation

## Architecture Overview

```
┌─────────────┐    POST /api/chat     ┌─────────────┐
│   ChatView  │ ───────────────────→  │ chatService │
│  (Frontend) │                       │  (Backend)  │
└─────────────┘                       └─────────────┘
       │                                     │
       │ agentSuggestion                    │ returns agentSuggestion
       ↓                                     ↓
┌──────────────────────┐            ┌──────────────────┐
│ AgentConfirmation    │            │ AgentIntent      │
│ Message (Orange Card)│            │ Service          │
└──────────────────────┘            └──────────────────┘
       │
       │ "Bild generieren"
       ↓
┌──────────────────────┐    POST /api/langgraph/agents/execute
│ AgentFormView        │ ──────────────────────→
│ (Fullscreen, prefill)│
└──────────────────────┘
       │
       │ Submit
       ↓
┌──────────────────────┐            ┌──────────────────┐
│ AgentProgressView    │            │ LangGraph Image  │
│ (ONE animation)      │  ←─────────│ Generation Agent │
└──────────────────────┘            └──────────────────┘
       │                                     │
       │ Success                             │
       ↓                                     ↓
┌──────────────────────┐            ┌──────────────────┐
│ AgentResultView      │            │ library_materials│
│ (Preview + 3 Buttons)│            │ + messages (DB)  │
└──────────────────────┘            └──────────────────┘
       │                                     │
       │ "Weiter im Chat"                    │
       ↓                                     ↓
┌──────────────────────┐            ┌──────────────────┐
│ ChatView             │  ←─────────│ Message with     │
│ (shows thumbnail)    │            │ metadata.type    │
└──────────────────────┘            └──────────────────┘
```

## Phase 1: Critical Backend Fix (BLOCKER)

### TASK-001: Fix TypeScript Error in chatService.ts:92

**Problem**:
```typescript
// shared/types/api.ts Line 48
agentSuggestion?: {
  prefillData: Record<string, unknown>;  // ❌ Too restrictive
}

// shared/types/agents.ts Line 24
agentSuggestion: {
  prefillData: ImageGenerationPrefillData | Record<string, unknown>;  // ✅ Correct
}
```

**Solution A (Preferred)**: Fix Shared Type Definition
```typescript
// File: shared/types/api.ts Line 45-50
agentSuggestion?: {
  agentType: 'image-generation' | 'worksheet' | 'lesson-plan';
  reasoning: string;
  prefillData: ImageGenerationPrefillData | Record<string, unknown>;  // ← FIX HERE
};
```

**Solution B (Quick Fix)**: Type Cast in chatService.ts
```typescript
// File: backend/src/services/chatService.ts Line 101
...(agentSuggestion && {
  agentSuggestion: {
    ...agentSuggestion,
    prefillData: agentSuggestion.prefillData as Record<string, unknown>
  }
}),
```

**Verification**:
```bash
cd teacher-assistant/backend
npm run dev  # Should start WITHOUT errors
```

## Phase 2: Frontend Component Updates

### TASK-002: AgentConfirmationMessage.tsx - Gemini Design
**File**: `frontend/src/components/AgentConfirmationMessage.tsx`

**Changes**:
```tsx
// Orange gradient card with 2 touch-friendly buttons
<div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-primary rounded-2xl p-4">
  <p className="text-sm text-gray-700 mb-3">{reasoning}</p>
  <div className="flex gap-3">
    <button
      className="flex-1 h-12 bg-primary text-white rounded-xl"
      onClick={handleStartAgent}
    >
      Bild-Generierung starten ✨
    </button>
    <button
      className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl"
      onClick={handleContinueChat}
    >
      Weiter im Chat 💬
    </button>
  </div>
</div>
```

### TASK-003: AgentFormView.tsx - Prefill Logic
**File**: `frontend/src/components/AgentFormView.tsx`

**Changes**:
```tsx
// Extract prefillData from agentSuggestion
const prefillData = agentSuggestion?.prefillData as ImageGenerationPrefillData | undefined;

// Initialize form with prefilled description
const [formData, setFormData] = useState({
  description: prefillData?.description || '',
  imageStyle: prefillData?.imageStyle || 'illustrative',
  learningGroup: prefillData?.learningGroup || '',
  subject: prefillData?.subject || ''
});
```

### TASK-004: AgentProgressView.tsx - Remove Duplicate
**File**: `frontend/src/components/AgentProgressView.tsx`

**Action**:
- Inspect component tree for 2 instances
- Find "oben links" duplicate animation
- Remove or conditionally render only ONE

### TASK-005: AgentResultView.tsx - 3 Action Buttons
**File**: `frontend/src/components/AgentResultView.tsx`

**Changes**:
```tsx
<div className="flex gap-3 mt-6">
  <button onClick={handleContinueInChat}>
    Weiter im Chat 💬
  </button>
  <button onClick={handleOpenInLibrary}>
    In Library öffnen 📚
  </button>
  <button onClick={handleRegenerate}>
    Neu generieren 🔄
  </button>
</div>
```

**Logic**:
```tsx
const handleContinueInChat = () => {
  // 1. Create message with metadata.type = 'image'
  // 2. Navigate to /chat
  // 3. Scroll to bottom
};

const handleRegenerate = () => {
  // Re-open AgentFormView with original params
  setAgentState({
    view: 'form',
    prefillData: result.metadata.originalParams
  });
};
```

### TASK-006: ChatView.tsx - Render Image Thumbnail
**File**: `frontend/src/pages/Chat/ChatView.tsx`

**Changes**:
```tsx
// In message rendering logic
if (message.metadata?.type === 'image') {
  return (
    <div
      className="cursor-pointer"
      onClick={() => openPreview(message.metadata.image_url)}
    >
      <img
        src={message.metadata.image_url}
        alt={message.metadata.title || 'Generated Image'}
        className="max-w-[200px] rounded-lg shadow-md hover:shadow-lg transition-shadow"
      />
    </div>
  );
}
```

### TASK-007: Library.tsx - Add "Bilder" Filter
**File**: `frontend/src/pages/Library/Library.tsx`

**Changes**:
```tsx
const filterChips = [
  { key: 'all', label: 'Alle', icon: folderOutline },
  { key: 'image', label: 'Bilder', icon: imageOutline },  // ← ADD
  { key: 'chat', label: 'Chats', icon: chatbubbleOutline },
  // ...
];

// Filter query
const filteredMaterials = materials.filter(m => {
  if (activeFilter === 'image') return m.type === 'image';
  // ...
});
```

### TASK-008: MaterialPreviewModal.tsx - Regenerate Button
**File**: `frontend/src/components/MaterialPreviewModal.tsx`

**Changes**:
```tsx
// Add button in modal footer
<button
  className="btn-secondary"
  onClick={handleRegenerate}
>
  Neu generieren 🔄
</button>

// Handler
const handleRegenerate = () => {
  const originalParams = material.metadata?.originalParams;
  openAgentForm('image-generation', originalParams);
  closeModal();
};
```

## Phase 3: Backend Verification

### TASK-009: Verify langGraphImageGenerationAgent.ts
**File**: `backend/src/agents/langGraphImageGenerationAgent.ts`

**Check**:
- ✅ Saves to `library_materials` with `type: 'image'`
- ✅ Creates chat message with `metadata.type = 'image'`
- ✅ Sets `metadata.image_url` correctly
- ✅ Stores `metadata.originalParams` for re-generation

## Data Flow Summary

```
1. User: "Erstelle Bild vom Pythagoras"
   → POST /api/chat

2. Backend: Returns agentSuggestion
   → { agentType: 'image-generation', prefillData: { description: '...' } }

3. Frontend: Renders AgentConfirmationMessage
   → User clicks "Bild-Generierung starten"

4. Frontend: Opens AgentFormView (prefilled)
   → User clicks "Generieren"

5. Frontend: POST /api/langgraph/agents/execute
   → Backend generates image via DALL-E

6. Backend: Saves to library_materials + creates message
   → Returns { imageUrl, title, tags }

7. Frontend: Shows AgentResultView
   → User clicks "Weiter im Chat"

8. Frontend: Navigates to Chat
   → Thumbnail appears in chat history
   → Clicking thumbnail → MaterialPreviewModal
```

## Testing Strategy

**Unit Tests**:
- Form prefill logic (AgentFormView)
- Filter logic (Library)
- Image rendering (ChatView)

**Integration Tests**:
- agentSuggestion → confirmation flow
- Form submit → backend → result

**E2E Test**:
- Full workflow from chat message to library
- Screenshot at each step
