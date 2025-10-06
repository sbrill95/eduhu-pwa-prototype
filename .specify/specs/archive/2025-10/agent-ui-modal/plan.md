# Agent UI Modal - Technical Implementation Plan

**Status**: Ready for Implementation
**Created**: 2025-09-30
**Related**: [spec.md](spec.md) | [tasks.md](tasks.md)

---

## Overview

This plan details the technical implementation for the Agent UI Modal system, enabling teachers to execute LangGraph agents (starting with Image Generation) through a beautiful, Gemini-inspired fullscreen modal interface.

**Estimated Time**: 8-10 hours
**Complexity**: Medium-High
**Risk Level**: Medium

---

## Architecture Overview

### Component Hierarchy

```
ChatView.tsx
├── AgentSuggestionMessage.tsx         # NEW - Shows agent suggestion in chat
│   └── [Button] "Ja, Bild erstellen"
│
├── AgentModal.tsx                     # NEW - Fullscreen modal container
│   ├── AgentFormView.tsx              # NEW - Form phase (Step 1)
│   │   ├── Header (Breadcrumb, Close)
│   │   ├── Form Fields (Dynamic)
│   │   └── CTA Button "Generieren"
│   │
│   ├── AgentProgressView.tsx          # NEW - Progress phase (Step 2)
│   │   ├── Header (Breadcrumb)
│   │   ├── Progress Bar
│   │   ├── Progress Messages (SSE)
│   │   └── Cancel Button
│   │
│   └── AgentResultView.tsx            # NEW - Result phase (Step 3)
│       ├── Header (Close)
│       ├── Fullscreen Result Display
│       └── Action Buttons (Download, Share)
│
└── AgentResultMessage.tsx             # NEW - Shows result thumbnail in chat
```

### State Management

We'll use **React Context** for simplicity (no external library needed):

```typescript
// lib/AgentContext.tsx (NEW)
interface AgentExecutionState {
  isOpen: boolean;
  phase: 'form' | 'progress' | 'result' | null;
  agentType: 'image-generation' | null;
  formData: Record<string, any>;
  executionId: string | null;
  progress: {
    percentage: number;
    message: string;
    currentStep: string;
  };
  result: {
    artifactId: string;
    data: any;
    metadata: any;
  } | null;
  error: string | null;
}

interface AgentContextValue {
  state: AgentExecutionState;
  openModal: (agentType: string, prefillData?: any) => void;
  closeModal: () => void;
  submitForm: (formData: any) => Promise<void>;
  cancelExecution: () => void;
  saveToLibrary: () => Promise<void>;
}
```

---

## Component Specifications

### 1. AgentSuggestionMessage.tsx

**Purpose**: Display agent suggestion in chat with action button

**Props**:
```typescript
interface AgentSuggestionMessageProps {
  message: {
    content: string;
    agentSuggestion?: {
      agentType: 'image-generation';
      reasoning: string;
      prefillData: {
        prompt: string;
        style?: string;
        aspectRatio?: string;
      };
    };
  };
}
```

**UI Design** (Gemini-inspired):
```tsx
<div className="bg-gradient-to-r from-[#FB6542]/10 to-[#D3E4E6]/30 rounded-2xl p-4 border border-[#FB6542]/20">
  {/* Message content */}
  <p className="text-gray-800 mb-3">{message.content}</p>

  {/* Agent suggestion card */}
  {message.agentSuggestion && (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#FB6542]/10 flex items-center justify-center">
          <IonIcon icon={sparklesOutline} className="text-[#FB6542] text-xl" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            Bild-Agent vorgeschlagen
          </h4>
          <p className="text-sm text-gray-600">
            {message.agentSuggestion.reasoning}
          </p>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => openAgentModal('image-generation', message.agentSuggestion.prefillData)}
        className="w-full bg-[#FB6542] text-white font-bold py-3 rounded-xl hover:bg-[#FB6542]/90 transition-colors"
      >
        Ja, Bild erstellen
      </button>
    </div>
  )}
</div>
```

**Integration Point**: Modify `ChatView.tsx` message rendering to check for `agentSuggestion` property.

---

### 2. AgentModal.tsx

**Purpose**: Fullscreen modal container with phase transitions

**UI Structure**:
```tsx
<IonModal
  isOpen={state.isOpen}
  onDidDismiss={closeModal}
  className="agent-modal-fullscreen"
>
  <div className="h-full flex flex-col bg-[#D3E4E6]">
    {/* Dynamic phase rendering */}
    {state.phase === 'form' && (
      <AgentFormView
        agentType={state.agentType}
        prefillData={state.formData}
        onSubmit={submitForm}
        onClose={closeModal}
      />
    )}

    {state.phase === 'progress' && (
      <AgentProgressView
        executionId={state.executionId}
        progress={state.progress}
        onCancel={cancelExecution}
      />
    )}

    {state.phase === 'result' && (
      <AgentResultView
        result={state.result}
        onClose={closeModal}
        onSaveToLibrary={saveToLibrary}
      />
    )}
  </div>
</IonModal>
```

**CSS** (Gemini-inspired fullscreen):
```css
/* teacher-assistant/frontend/src/App.css */
.agent-modal-fullscreen {
  --width: 100%;
  --height: 100%;
  --border-radius: 0;
}

.agent-modal-fullscreen ion-backdrop {
  display: none;
}
```

---

### 3. AgentFormView.tsx

**Purpose**: Dynamic form for agent parameters

**Form Fields** (Image Generation):
```typescript
interface ImageGenerationFormData {
  prompt: string;           // Textarea, pre-filled
  negativePrompt?: string;  // Optional
  style: 'realistic' | 'artistic' | 'cartoon' | 'minimal';
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
  quality: 'standard' | 'hd';
  numberOfImages: 1 | 2 | 3 | 4;
}
```

**UI Design**:
```tsx
<div className="h-full flex flex-col bg-[#D3E4E6]">
  {/* Header with breadcrumb */}
  <header className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
          <IonIcon icon={arrowBackOutline} className="text-2xl" />
        </button>
        <div className="text-sm text-gray-500">
          Chat → <span className="text-[#FB6542] font-semibold">Bild generieren</span>
        </div>
      </div>
    </div>
  </header>

  {/* Scrollable form content */}
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Bild generieren
      </h1>
      <p className="text-gray-600 mb-8">
        Beschreibe das Bild, das du erstellen möchtest
      </p>

      {/* Form fields */}
      <div className="space-y-6">
        {/* Prompt */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bildbeschreibung *
          </label>
          <textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl p-4 min-h-[120px] focus:border-[#FB6542] focus:ring-2 focus:ring-[#FB6542]/20 outline-none transition-all"
            placeholder="Beschreibe das Bild im Detail..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Je detaillierter, desto besser das Ergebnis
          </p>
        </div>

        {/* Style Selection (Segmented Control) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Stil
          </label>
          <IonSegment
            value={formData.style}
            onIonChange={(e) => setFormData({ ...formData, style: e.detail.value })}
          >
            <IonSegmentButton value="realistic">
              <IonLabel>Realistisch</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="artistic">
              <IonLabel>Künstlerisch</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="cartoon">
              <IonLabel>Cartoon</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="minimal">
              <IonLabel>Minimalistisch</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Aspect Ratio (Icon Grid) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Format
          </label>
          <div className="grid grid-cols-4 gap-3">
            {['1:1', '16:9', '9:16', '4:3'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setFormData({ ...formData, aspectRatio: ratio })}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${formData.aspectRatio === ratio
                    ? 'border-[#FB6542] bg-[#FB6542]/5'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-sm font-semibold text-gray-700">
                  {ratio}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Toggle */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
          <div>
            <div className="font-semibold text-gray-900">HD Qualität</div>
            <div className="text-sm text-gray-500">Höhere Auflösung (dauert länger)</div>
          </div>
          <IonToggle
            checked={formData.quality === 'hd'}
            onIonChange={(e) => setFormData({ ...formData, quality: e.detail.checked ? 'hd' : 'standard' })}
          />
        </div>
      </div>
    </div>
  </div>

  {/* Fixed CTA Button */}
  <div className="bg-white border-t border-gray-200 px-6 py-4">
    <button
      onClick={handleSubmit}
      disabled={!formData.prompt.trim() || isSubmitting}
      className="w-full bg-[#FB6542] text-white font-bold py-4 rounded-xl hover:bg-[#FB6542]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
    >
      {isSubmitting ? 'Wird gestartet...' : 'Bild generieren'}
    </button>
  </div>
</div>
```

**Validation**:
- Prompt: Required, min 10 characters
- Style: Default = 'realistic'
- Aspect Ratio: Default = '1:1'
- Quality: Default = 'standard'

---

### 4. AgentProgressView.tsx

**Purpose**: Real-time progress display with SSE

**SSE Integration**:
```typescript
const useAgentProgress = (executionId: string) => {
  const [progress, setProgress] = useState({
    percentage: 0,
    message: '',
    currentStep: ''
  });

  useEffect(() => {
    if (!executionId) return;

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/langgraph-agents/progress/${executionId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress({
        percentage: data.percentage,
        message: data.message,
        currentStep: data.currentStep
      });
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [executionId]);

  return progress;
};
```

**UI Design**:
```tsx
<div className="h-full flex flex-col bg-[#D3E4E6]">
  {/* Header */}
  <header className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="text-sm text-gray-500">
      Chat → Bild generieren → <span className="text-[#FB6542] font-semibold">Generierung läuft...</span>
    </div>
  </header>

  {/* Progress content */}
  <div className="flex-1 flex items-center justify-center px-6">
    <div className="max-w-md w-full">
      {/* Animated icon */}
      <div className="w-24 h-24 mx-auto mb-8 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <IonIcon icon={sparklesOutline} className="text-[#FB6542] text-5xl" />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {progress.currentStep}
          </span>
          <span className="text-sm font-bold text-[#FB6542]">
            {progress.percentage}%
          </span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#FB6542] to-[#FB6542]/70 transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Progress message */}
      <p className="text-center text-gray-600 mb-8">
        {progress.message}
      </p>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-white transition-colors"
      >
        Abbrechen
      </button>
    </div>
  </div>

  {/* Estimated time footer */}
  <div className="bg-white border-t border-gray-200 px-6 py-4">
    <p className="text-center text-sm text-gray-500">
      Geschätzte Wartezeit: {estimatedTime}
    </p>
  </div>
</div>
```

**Progress Messages** (User-friendly):
```typescript
const PROGRESS_MESSAGES = {
  0: 'Anfrage wird vorbereitet...',
  10: 'Agent wird gestartet...',
  30: 'Prompt wird analysiert...',
  50: 'Bild wird generiert... (Das kann 30-60 Sekunden dauern)',
  80: 'Qualität wird optimiert...',
  95: 'Bild wird gespeichert...',
  100: 'Fertig!'
};
```

---

### 5. AgentResultView.tsx

**Purpose**: Display fullscreen result with actions

**UI Design**:
```tsx
<div className="h-full flex flex-col bg-[#D3E4E6]">
  {/* Header with close */}
  <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-4 absolute top-0 left-0 right-0 z-10">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-gray-900">
        Dein generiertes Bild
      </h2>
      <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
        <IonIcon icon={closeOutline} className="text-3xl" />
      </button>
    </div>
  </header>

  {/* Fullscreen image */}
  <div className="flex-1 flex items-center justify-center px-6 py-20">
    <img
      src={result.data.imageUrl}
      alt={result.metadata.prompt}
      className="max-w-full max-h-full rounded-2xl shadow-2xl"
    />
  </div>

  {/* Action buttons */}
  <div className="bg-white border-t border-gray-200 px-6 py-4 space-y-3">
    {/* Primary: Save to Library (auto-done) */}
    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
      <IonIcon icon={checkmarkCircleOutline} className="text-green-600 text-2xl" />
      <div className="flex-1">
        <p className="font-semibold text-green-900">In Bibliothek gespeichert</p>
        <p className="text-sm text-green-700">Jederzeit unter "Bibliothek" abrufbar</p>
      </div>
    </div>

    {/* Secondary actions */}
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
      >
        <IonIcon icon={downloadOutline} className="text-xl" />
        Download
      </button>
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 py-3 bg-[#FB6542] text-white font-semibold rounded-xl hover:bg-[#FB6542]/90 transition-colors"
      >
        <IonIcon icon={shareOutline} className="text-xl" />
        Teilen
      </button>
    </div>

    {/* Close and return to chat */}
    <button
      onClick={onClose}
      className="w-full py-3 text-gray-600 font-semibold hover:text-gray-900 transition-colors"
    >
      Zurück zum Chat
    </button>
  </div>
</div>
```

**Auto-Save Logic**:
```typescript
const autoSaveToLibrary = async (result: AgentResult) => {
  try {
    await db.transact(db.tx['generated-artifacts'][result.artifactId].update({
      saved_to_library: true,
      saved_at: new Date().toISOString()
    }));

    console.log('[AgentModal] Auto-saved to library:', result.artifactId);
  } catch (error) {
    console.error('[AgentModal] Auto-save failed:', error);
    // Show retry option
  }
};
```

---

### 6. AgentResultMessage.tsx

**Purpose**: Show result thumbnail in chat after completion

**UI Design**:
```tsx
<div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
  <div className="flex items-start gap-3 mb-3">
    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
      <IonIcon icon={checkmarkCircleOutline} className="text-green-600 text-xl" />
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900 mb-1">
        Bild erfolgreich generiert
      </h4>
      <p className="text-sm text-gray-600">
        {result.metadata.prompt.substring(0, 80)}...
      </p>
    </div>
  </div>

  {/* Thumbnail */}
  <img
    src={result.data.thumbnailUrl || result.data.imageUrl}
    alt="Generated image"
    className="w-full rounded-xl mb-3 cursor-pointer hover:opacity-90 transition-opacity"
    onClick={() => openImageModal(result)}
  />

  {/* Actions */}
  <div className="flex gap-2">
    <button
      onClick={() => openLibrary()}
      className="flex-1 py-2 text-sm font-semibold text-[#FB6542] hover:bg-[#FB6542]/5 rounded-lg transition-colors"
    >
      In Bibliothek öffnen
    </button>
    <button
      onClick={() => handleDownload(result)}
      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <IonIcon icon={downloadOutline} />
    </button>
  </div>
</div>
```

---

## Backend Integration

### Existing Backend APIs (Already Implemented)

**Execute Agent**:
```typescript
POST /api/langgraph-agents/execute
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "session_456",
  "agentType": "image-generation",
  "input": {
    "prompt": "A lion in a jungle",
    "style": "realistic",
    "aspectRatio": "1:1",
    "quality": "hd"
  }
}

Response:
{
  "executionId": "exec_789",
  "status": "running",
  "estimatedDuration": "45s"
}
```

**Progress Stream (SSE)**:
```typescript
GET /api/langgraph-agents/progress/:executionId

SSE Events:
data: {"percentage": 10, "message": "Agent wird gestartet...", "currentStep": "initialization"}
data: {"percentage": 50, "message": "Bild wird generiert...", "currentStep": "generation"}
data: {"percentage": 100, "message": "Fertig!", "currentStep": "completed", "result": {...}}
```

**Cancel Execution**:
```typescript
POST /api/langgraph-agents/cancel/:executionId

Response:
{
  "status": "cancelled"
}
```

### Chat Integration (New)

Modify `POST /api/chat` to include agent detection:

```typescript
// backend/src/routes/index.ts
router.post('/chat', async (req, res) => {
  const { message, context, history } = req.body;

  // Get response from OpenAI
  const response = await chatService.getResponse(message, context, history);

  // Agent detection (via system prompt)
  const agentSuggestion = chatService.detectAgentSuggestion(response, message);

  res.json({
    message: response,
    agentSuggestion // NEW: null or { agentType, reasoning, prefillData }
  });
});
```

**Agent Detection Logic** (Already in backend via system prompt):
```typescript
// System prompt includes:
// "If the user requests image generation, include in your response:
// [AGENT_SUGGESTION:image-generation]
// Reasoning: <why this agent is appropriate>
// Prefill: <JSON with suggested parameters>"

const detectAgentSuggestion = (response: string, userMessage: string) => {
  const match = response.match(/\[AGENT_SUGGESTION:(\w+)\]/);
  if (!match) return null;

  const agentType = match[1];
  const reasoning = extractReasoning(response);
  const prefillData = extractPrefillData(response, userMessage);

  return { agentType, reasoning, prefillData };
};
```

---

## State Management Implementation

### AgentContext.tsx

```typescript
// teacher-assistant/frontend/src/lib/AgentContext.tsx (NEW)
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { api } from './api';
import db from './instantdb';

interface AgentExecutionState {
  isOpen: boolean;
  phase: 'form' | 'progress' | 'result' | null;
  agentType: 'image-generation' | null;
  formData: Record<string, any>;
  executionId: string | null;
  sessionId: string | null;
  progress: {
    percentage: number;
    message: string;
    currentStep: string;
  };
  result: {
    artifactId: string;
    data: any;
    metadata: any;
  } | null;
  error: string | null;
}

interface AgentContextValue {
  state: AgentExecutionState;
  openModal: (agentType: string, prefillData?: any, sessionId?: string) => void;
  closeModal: () => void;
  submitForm: (formData: any) => Promise<void>;
  cancelExecution: () => Promise<void>;
  saveToLibrary: () => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AgentExecutionState>({
    isOpen: false,
    phase: null,
    agentType: null,
    formData: {},
    executionId: null,
    sessionId: null,
    progress: { percentage: 0, message: '', currentStep: '' },
    result: null,
    error: null
  });

  const openModal = useCallback((agentType: string, prefillData = {}, sessionId = null) => {
    setState({
      isOpen: true,
      phase: 'form',
      agentType: agentType as any,
      formData: prefillData,
      executionId: null,
      sessionId,
      progress: { percentage: 0, message: '', currentStep: '' },
      result: null,
      error: null
    });
  }, []);

  const closeModal = useCallback(() => {
    setState({
      isOpen: false,
      phase: null,
      agentType: null,
      formData: {},
      executionId: null,
      sessionId: null,
      progress: { percentage: 0, message: '', currentStep: '' },
      result: null,
      error: null
    });
  }, []);

  const submitForm = useCallback(async (formData: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Transition to progress phase
      setState(prev => ({ ...prev, phase: 'progress', formData }));

      // Execute agent
      const response = await api.post('/langgraph-agents/execute', {
        userId: user.id,
        sessionId: state.sessionId,
        agentType: state.agentType,
        input: formData
      });

      const { executionId, estimatedDuration } = response;

      setState(prev => ({ ...prev, executionId }));

      // SSE will update progress via useAgentProgress hook
      // Result will be received via final SSE event

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Fehler beim Starten des Agents',
        phase: 'form'
      }));
    }
  }, [user, state.agentType, state.sessionId]);

  const cancelExecution = useCallback(async () => {
    if (!state.executionId) return;

    try {
      await api.post(`/langgraph-agents/cancel/${state.executionId}`);
      closeModal();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  }, [state.executionId, closeModal]);

  const saveToLibrary = useCallback(async () => {
    if (!state.result) return;

    try {
      await db.transact(
        db.tx['generated-artifacts'][state.result.artifactId].update({
          saved_to_library: true,
          saved_at: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('Save to library failed:', error);
    }
  }, [state.result]);

  const value: AgentContextValue = {
    state,
    openModal,
    closeModal,
    submitForm,
    cancelExecution,
    saveToLibrary
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
};
```

---

## Testing Strategy

### Unit Tests

**featureFlags.test.ts** (if adding agent feature flag):
```typescript
import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS } from './featureFlags';

describe('Feature Flags - Agent UI', () => {
  it('should have ENABLE_AGENT_UI flag', () => {
    expect(FEATURE_FLAGS).toHaveProperty('ENABLE_AGENT_UI');
  });

  it('should default ENABLE_AGENT_UI to true', () => {
    expect(FEATURE_FLAGS.ENABLE_AGENT_UI).toBe(true);
  });
});
```

**AgentContext.test.tsx**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AgentProvider, useAgent } from './AgentContext';
import * as api from './api';

vi.mock('./api');
vi.mock('./auth-context', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, isLoading: false })
}));

describe('AgentContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open modal with prefill data', () => {
    const wrapper = ({ children }) => <AgentProvider>{children}</AgentProvider>;
    const { result } = renderHook(() => useAgent(), { wrapper });

    act(() => {
      result.current.openModal('image-generation', { prompt: 'Test prompt' });
    });

    expect(result.current.state.isOpen).toBe(true);
    expect(result.current.state.phase).toBe('form');
    expect(result.current.state.formData.prompt).toBe('Test prompt');
  });

  it('should submit form and transition to progress', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      executionId: 'exec_123',
      estimatedDuration: '45s'
    });

    const wrapper = ({ children }) => <AgentProvider>{children}</AgentProvider>;
    const { result } = renderHook(() => useAgent(), { wrapper });

    act(() => {
      result.current.openModal('image-generation');
    });

    await act(async () => {
      await result.current.submitForm({ prompt: 'Test' });
    });

    expect(result.current.state.phase).toBe('progress');
    expect(result.current.state.executionId).toBe('exec_123');
  });

  it('should close modal and reset state', () => {
    const wrapper = ({ children }) => <AgentProvider>{children}</AgentProvider>;
    const { result } = renderHook(() => useAgent(), { wrapper });

    act(() => {
      result.current.openModal('image-generation', { prompt: 'Test' });
      result.current.closeModal();
    });

    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.phase).toBe(null);
    expect(result.current.state.formData).toEqual({});
  });
});
```

### Integration Tests

**AgentModal.integration.test.tsx**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentProvider } from './lib/AgentContext';
import AgentModal from './components/AgentModal';

vi.mock('./lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'test-user' } })
}));

describe('Agent Modal Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show form view when opened', async () => {
    const { result: agentHook } = renderHook(() => useAgent(), {
      wrapper: AgentProvider
    });

    render(
      <AgentProvider>
        <AgentModal />
      </AgentProvider>
    );

    act(() => {
      agentHook.current.openModal('image-generation', { prompt: 'A lion' });
    });

    await waitFor(() => {
      expect(screen.getByText('Bild generieren')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A lion')).toBeInTheDocument();
    });
  });

  it('should transition to progress view after form submit', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      executionId: 'exec_123',
      estimatedDuration: '45s'
    });

    render(
      <AgentProvider>
        <AgentModal />
      </AgentProvider>
    );

    const { result } = renderHook(() => useAgent(), { wrapper: AgentProvider });

    act(() => {
      result.current.openModal('image-generation');
    });

    // Fill form
    const promptInput = screen.getByPlaceholderText(/Beschreibe das Bild/i);
    await userEvent.type(promptInput, 'A beautiful sunset');

    // Submit
    const submitButton = screen.getByText('Bild generieren');
    await userEvent.click(submitButton);

    // Should show progress view
    await waitFor(() => {
      expect(screen.getByText(/Generierung läuft/i)).toBeInTheDocument();
      expect(screen.getByText(/Abbrechen/i)).toBeInTheDocument();
    });
  });

  it('should show result view after completion', async () => {
    // Mock SSE completion
    const mockEventSource = {
      onmessage: null,
      onerror: null,
      close: vi.fn()
    };

    global.EventSource = vi.fn(() => mockEventSource);

    render(
      <AgentProvider>
        <AgentModal />
      </AgentProvider>
    );

    // ... trigger execution
    // Simulate SSE completion event
    act(() => {
      mockEventSource.onmessage({
        data: JSON.stringify({
          percentage: 100,
          message: 'Fertig!',
          currentStep: 'completed',
          result: {
            artifactId: 'artifact_123',
            data: { imageUrl: 'https://example.com/image.png' },
            metadata: { prompt: 'A lion' }
          }
        })
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Dein generiertes Bild')).toBeInTheDocument();
      expect(screen.getByText(/In Bibliothek gespeichert/i)).toBeInTheDocument();
    });
  });

  it('should close modal and return to chat', async () => {
    render(
      <AgentProvider>
        <AgentModal />
      </AgentProvider>
    );

    const { result } = renderHook(() => useAgent(), { wrapper: AgentProvider });

    act(() => {
      result.current.openModal('image-generation');
    });

    const closeButton = screen.getByLabelText(/close/i);
    await userEvent.click(closeButton);

    expect(result.current.state.isOpen).toBe(false);
  });
});
```

### E2E Tests (Playwright)

**agent-ui-modal.spec.ts** (NEW):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Agent UI Modal - Image Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    // Assume already logged in
  });

  test('should suggest agent when user asks for image', async ({ page }) => {
    // Navigate to Chat
    await page.click('ion-tab-button[tab="chat"]');

    // Send message requesting image
    const chatInput = page.locator('textarea[placeholder*="Nachricht"]');
    await chatInput.fill('Erstelle ein Bild von einem Löwen im Dschungel');
    await page.click('button:has-text("Senden")');

    // Wait for agent suggestion
    await expect(page.locator('text=/Bild-Agent vorgeschlagen/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Ja, Bild erstellen")')).toBeVisible();
  });

  test('should open modal and show pre-filled form', async ({ page }) => {
    // Trigger agent suggestion (from previous test)
    await page.click('button:has-text("Ja, Bild erstellen")');

    // Modal should open with form view
    await expect(page.locator('text=/Bild generieren/i').first()).toBeVisible();

    // Check pre-filled prompt
    const promptField = page.locator('textarea[placeholder*="Beschreibe"]');
    await expect(promptField).toHaveValue(/Löwen/i);
  });

  test('should show progress view during generation', async ({ page }) => {
    // Fill and submit form
    const promptField = page.locator('textarea[placeholder*="Beschreibe"]');
    await promptField.fill('Ein Löwe im Dschungel bei Sonnenuntergang');

    await page.click('button:has-text("Bild generieren")');

    // Should transition to progress view
    await expect(page.locator('text=/Generierung läuft/i')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/Agent wird gestartet/i')).toBeVisible();

    // Progress bar should be visible
    await expect(page.locator('div[class*="bg-gradient-to-r"]')).toBeVisible();

    // Cancel button should be visible
    await expect(page.locator('button:has-text("Abbrechen")')).toBeVisible();
  });

  test('should show result view after completion', async ({ page }) => {
    // Wait for generation to complete (may take 30-60s in real scenario)
    await expect(page.locator('text=/Dein generiertes Bild/i')).toBeVisible({ timeout: 90000 });

    // Check result elements
    await expect(page.locator('img[alt*="generated"]').first()).toBeVisible();
    await expect(page.locator('text=/In Bibliothek gespeichert/i')).toBeVisible();

    // Action buttons
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
    await expect(page.locator('button:has-text("Teilen")')).toBeVisible();
  });

  test('should show result in chat after closing modal', async ({ page }) => {
    // Close modal
    await page.click('button:has-text("Zurück zum Chat")');

    // Should see result message in chat
    await expect(page.locator('text=/Bild erfolgreich generiert/i')).toBeVisible();
    await expect(page.locator('img[alt*="Generated"]')).toBeVisible();

    // Should have "In Bibliothek öffnen" button
    await expect(page.locator('button:has-text("In Bibliothek öffnen")')).toBeVisible();
  });

  test('should allow cancelling during progress', async ({ page }) => {
    // Start generation
    await page.click('button:has-text("Ja, Bild erstellen")');
    await page.click('button:has-text("Bild generieren")');

    // Wait for progress to start
    await expect(page.locator('text=/Generierung läuft/i')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Abbrechen")');

    // Modal should close
    await expect(page.locator('text=/Bild generieren/i')).not.toBeVisible({ timeout: 3000 });
  });

  test('should verify image is saved to library', async ({ page }) => {
    // After generation completes, navigate to library
    await page.click('button:has-text("Zurück zum Chat")');
    await page.click('ion-tab-button[tab="library"]');

    // Should see generated image in library
    await expect(page.locator('text=/Generierte Materialien/i')).toBeVisible();
    await expect(page.locator('img[alt*="Ein Löwe"]').first()).toBeVisible();
  });
});
```

---

## Migration Strategy

### Phase 1: Foundation (2 hours)
1. Create AgentContext.tsx with state management
2. Add feature flag `ENABLE_AGENT_UI = true`
3. Write unit tests for AgentContext
4. **Deploy & Verify**: No UI changes yet

### Phase 2: Modal Components (3 hours)
1. Create AgentModal.tsx (container)
2. Create AgentFormView.tsx (with Image Generation fields)
3. Create AgentProgressView.tsx (with SSE)
4. Create AgentResultView.tsx (with auto-save)
5. Write component unit tests
6. **Deploy & Verify**: Modal works in isolation

### Phase 3: Chat Integration (2 hours)
1. Create AgentSuggestionMessage.tsx
2. Create AgentResultMessage.tsx
3. Modify ChatView.tsx to render agent messages
4. Write integration tests
5. **Deploy & Verify**: Full workflow works

### Phase 4: Testing & Polish (1-2 hours)
1. Run all existing tests
2. Write E2E tests with Playwright
3. Test error scenarios (network failures, cancellations)
4. Polish animations and transitions
5. **Deploy & Verify**: Production-ready

---

## Rollback Plan

### If Issues Arise

**Quick Rollback** (< 5 minutes):
```bash
# Disable via feature flag
VITE_ENABLE_AGENT_UI=false

# Rebuild and deploy
npm run build
# deploy
```

**Code Rollback**:
```bash
git revert <commit-hash>
git push
```

**Data Integrity**:
- ✅ No database schema changes
- ✅ InstantDB tables already exist (`generated-artifacts`)
- ✅ Backend APIs are separate (no breaking changes)

---

## Performance Considerations

### Bundle Size
- **AgentModal + Components**: ~15-20 KB (minified + gzipped)
- **AgentContext**: ~2 KB
- **Total Impact**: < 25 KB (acceptable)

### Runtime Performance
- **SSE Connection**: Minimal overhead, closed after completion
- **Modal Rendering**: Fullscreen, but lazy-loaded
- **Image Display**: Use progressive loading for large images

### Network
- **SSE Traffic**: ~1-2 KB/update, ~10-20 updates per execution
- **Image Upload**: Handled by backend, streamed to client
- **Cancel Latency**: < 500ms

---

## Security Considerations

### Input Validation
- **Prompt**: Max 2000 characters, sanitize special characters
- **Parameters**: Validate against allowed enums (style, aspectRatio, quality)
- **User Auth**: Always verify `userId` in backend

### Rate Limiting
- **Agent Execution**: Max 5 executions per user per hour (backend enforced)
- **SSE Connections**: Max 3 concurrent connections per user
- **Cancel Requests**: No rate limit (allow immediate cancellation)

### Data Privacy
- **Generated Images**: Stored in user's InstantDB space (private by default)
- **Prompts**: Logged for debugging, but not shared across users
- **SSE Messages**: User-specific, no cross-contamination

---

## Documentation Updates

### README.md (teacher-assistant/frontend/)

Add section:

```markdown
## Agent UI System

This app includes an Agent UI Modal system for executing LangGraph agents (e.g., Image Generation).

### How It Works

1. **Agent Detection**: ChatGPT detects when an agent is appropriate
2. **Agent Suggestion**: User sees a "Ja, [Action]" button in chat
3. **Modal Workflow**: Form → Progress → Result
4. **Auto-Save**: Results are automatically saved to Library

### Using the Agent Modal

```tsx
import { useAgent } from './lib/AgentContext';

const { openModal } = useAgent();

// Open modal with pre-filled data
openModal('image-generation', {
  prompt: 'A lion in a jungle',
  style: 'realistic'
});
```

### Available Agents

| Agent Type | Description | Parameters |
|------------|-------------|------------|
| `image-generation` | Generate images with DALL-E | `prompt`, `style`, `aspectRatio`, `quality` |

### Testing

Run agent UI tests:

```bash
npm run test -- AgentModal
npm run test:e2e -- agent-ui-modal.spec.ts
```

### Disabling Agent UI

To disable the agent UI:

```bash
# .env
VITE_ENABLE_AGENT_UI=false
```
```

---

## Success Metrics

### Functional Metrics
- ✅ Agent suggestion appears in chat within 2 seconds
- ✅ Modal opens with pre-filled data
- ✅ Progress updates every 1-2 seconds via SSE
- ✅ Result displays within 1 second of completion
- ✅ Auto-save to library succeeds 100% of the time
- ✅ Cancel works within 500ms

### User Experience Metrics
- ✅ Time from "Ja" button to result < 60 seconds (for image generation)
- ✅ Modal feels smooth and responsive (60fps animations)
- ✅ Progress messages are clear and reassuring
- ✅ Result is displayed fullscreen and beautiful

### Technical Metrics
- ✅ Zero breaking changes to existing chat/library
- ✅ Bundle size increase < 30 KB
- ✅ All tests passing (unit + integration + E2E)
- ✅ No console errors or warnings

---

## Future Enhancements

### Phase 2 (Later)

1. **More Agents**:
   - Worksheet Generation (PDF)
   - Quiz Generation (JSON)
   - Lesson Plan Generation (Markdown)

2. **Advanced Features**:
   - Multi-image generation (carousel)
   - Image editing (regenerate, variants)
   - Batch operations (generate 10 images)

3. **UX Improvements**:
   - Animation: "Image flies to library"
   - Haptic feedback on mobile
   - Voice-over progress (accessibility)

---

## Related Files

### Code (To Create)
- `teacher-assistant/frontend/src/lib/AgentContext.tsx`
- `teacher-assistant/frontend/src/components/AgentModal.tsx`
- `teacher-assistant/frontend/src/components/AgentFormView.tsx`
- `teacher-assistant/frontend/src/components/AgentProgressView.tsx`
- `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- `teacher-assistant/frontend/src/components/AgentSuggestionMessage.tsx`
- `teacher-assistant/frontend/src/components/AgentResultMessage.tsx`

### Tests (To Create)
- `teacher-assistant/frontend/src/lib/AgentContext.test.tsx`
- `teacher-assistant/frontend/src/components/AgentModal.integration.test.tsx`
- `teacher-assistant/frontend/e2e-tests/agent-ui-modal.spec.ts`

### Code (To Modify)
- `teacher-assistant/frontend/src/ChatView.tsx` (add agent message rendering)
- `teacher-assistant/frontend/src/App.tsx` (wrap with AgentProvider)
- `teacher-assistant/frontend/src/lib/featureFlags.ts` (add ENABLE_AGENT_UI)

### Documentation
- `teacher-assistant/frontend/README.md`
- `docs/development-logs/sessions/2025-09-30/session-XX-agent-ui-modal.md`

---

**Maintained by**: Frontend-Agent
**Status**: ✅ Ready for `/tasks` (Task Breakdown)