# Image Generation Modal - Technical Implementation Plan

**Feature**: Gemini-Workflow für Bildgenerierung
**Created**: 2025-10-02
**Status**: Technical Planning
**Related**: [spec.md](spec.md)

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Chat Layer                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ChatView.tsx (MODIFY)                                        │  │
│  │  ├── Message Rendering Logic                                  │  │
│  │  │   └─▶ Check for agentSuggestion property                  │  │
│  │  └── AgentConfirmationMessage.tsx (NEW)                       │  │
│  │      ├── Display: "Bildgenerierung starten?"                  │  │
│  │      ├── Button: "Ja, Bild erstellen"                         │  │
│  │      └── onClick: openAgentModal()                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Agent Modal Layer                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  AgentModal.tsx (EXISTING - NO CHANGES)                       │  │
│  │  ├── Phase: 'form' | 'progress' | 'result'                    │  │
│  │  └── Fullscreen Container                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         ▼                    ▼                    ▼                 │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │ FormView    │     │ ProgressView │     │ ResultView   │         │
│  │ (MODIFY)    │     │ (EXISTING)   │     │ (MODIFY)     │         │
│  └─────────────┘     └──────────────┘     └──────────────┘         │
│         │                                         │                 │
│         │ Gemini Form:                            │ New Buttons:    │
│         │ - Thema                                 │ - Teilen 🔗     │
│         │ - Lerngruppe                            │ - Weiter 💬     │
│         │ - DaZ Toggle                            │                 │
│         │ - Lernschwierigkeiten                   │ Animation:      │
│         │                                         │ ▶ flyToLibrary()│
│         │                                         │                 │
│         └─────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Animation Layer                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  animateToLibrary() (NEW)                                     │  │
│  │  ├── Clone image element                                      │  │
│  │  ├── Calculate Library Tab position                           │  │
│  │  ├── CSS Animation: transform + scale + opacity               │  │
│  │  ├── Duration: 600ms                                          │  │
│  │  └── onFinish: closeModal() + showThumbnail()                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Model

### Form Data Structure (NEW)

```typescript
// teacher-assistant/frontend/src/lib/types.ts (MODIFY)

interface ImageGenerationFormData {
  // Core fields
  theme: string;                    // "Satz des Pythagoras"
  learningGroup: string;            // "Klasse 8a"

  // Differenzierung
  dazSupport: boolean;              // DaZ-Unterstützung Toggle
  learningDifficulties: boolean;    // Lernschwierigkeiten Toggle

  // Optional (für spätere Erweiterung)
  imageStyle?: 'educational' | 'realistic' | 'illustrative';
  aspectRatio?: '1:1' | '16:9' | '4:3';
}
```

### AgentSuggestion Structure (EXTEND existing)

```typescript
// Existing structure in agent-ui-modal
interface AgentSuggestion {
  agentType: 'image-generation';
  reasoning: string;
  prefillData: Record<string, any>;
}

// NEW: Add specific type for Image Generation
interface ImageGenerationSuggestion extends AgentSuggestion {
  agentType: 'image-generation';
  prefillData: {
    theme: string;          // Extracted from chat
    learningGroup?: string; // From teacher profile or default
  };
}
```

---

## 🔧 Implementation Details

### Component 1: AgentConfirmationMessage.tsx (NEW)

**Purpose**: Show confirmation prompt in chat before opening agent modal

**File**: `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx`

**Props**:
```typescript
interface AgentConfirmationMessageProps {
  message: {
    content: string;
    agentSuggestion?: ImageGenerationSuggestion;
  };
}
```

**UI Implementation**:

```tsx
import React from 'react';
import { IonIcon } from '@ionic/react';
import { sparklesOutline } from 'ionicons/icons';
import { useAgent } from '../lib/AgentContext';

export const AgentConfirmationMessage: React.FC<AgentConfirmationMessageProps> = ({ message }) => {
  const { openModal } = useAgent();

  if (!message.agentSuggestion) {
    return <div className="text-gray-800">{message.content}</div>;
  }

  const handleConfirm = () => {
    openModal(
      message.agentSuggestion.agentType,
      message.agentSuggestion.prefillData
    );
  };

  return (
    <div className="bg-gradient-to-r from-primary-50 to-background-teal/30 rounded-2xl p-4 border border-primary-100">
      {/* ChatGPT Message */}
      <p className="text-gray-800 mb-3">{message.content}</p>

      {/* Agent Suggestion Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <IonIcon icon={sparklesOutline} className="text-primary-500 text-xl" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              Bildgenerierung
            </h4>
            <p className="text-sm text-gray-600">
              {message.agentSuggestion.reasoning}
            </p>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors"
        >
          Ja, Bild erstellen ✨
        </button>
      </div>
    </div>
  );
};
```

**Styling**:
- Gradient background: `from-primary-50 to-background-teal/30`
- Card: White with subtle shadow
- Button: Gemini Orange (`#FB6542`)
- Mobile-first: Full-width on small screens

---

### Component 2: AgentFormView.tsx (MODIFY existing)

**Purpose**: Update existing form to use Gemini design and new parameters

**File**: `teacher-assistant/frontend/src/components/AgentFormView.tsx` (EXISTING - MODIFY)

**Changes**:

1. **Update Form Fields** (replace old fields):

```tsx
// OLD (remove):
// - prompt (textarea)
// - style (segmented)
// - aspectRatio (grid)
// - quality (toggle)

// NEW (add):
const [formData, setFormData] = useState<ImageGenerationFormData>({
  theme: prefillData.theme || '',
  learningGroup: prefillData.learningGroup || 'Klasse 8a',
  dazSupport: false,
  learningDifficulties: false
});
```

2. **Update UI to Match Gemini Screenshot**:

```tsx
<div className="h-full flex flex-col bg-background-teal">
  {/* Header */}
  <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
    <div className="flex items-center gap-3">
      <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
        <IonIcon icon={arrowBackOutline} className="text-2xl" />
      </button>
      <span className="text-lg font-semibold text-gray-900">Generieren</span>
    </div>
  </header>

  {/* Content */}
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Maßgeschneidertes Arbeitsmaterial in Minuten.
      </h1>

      {/* Form */}
      <div className="space-y-6 mt-8">
        {/* Thema */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">
            Thema
          </label>
          <textarea
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[80px] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            placeholder="z.B. Satz des Pythagoras"
          />
        </div>

        {/* Lerngruppe */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">
            Lerngruppe
          </label>
          <select
            value={formData.learningGroup}
            onChange={(e) => setFormData({ ...formData, learningGroup: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
          >
            <option value="Klasse 5a">Klasse 5a</option>
            <option value="Klasse 6a">Klasse 6a</option>
            <option value="Klasse 7a">Klasse 7a</option>
            <option value="Klasse 8a">Klasse 8a</option>
            <option value="Klasse 9a">Klasse 9a</option>
            <option value="Klasse 10a">Klasse 10a</option>
            <option value="Klasse 11">Klasse 11</option>
            <option value="Klasse 12">Klasse 12</option>
            <option value="Klasse 13">Klasse 13</option>
          </select>
        </div>

        {/* Differenzierung */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-3">
            Differenzierung
          </label>

          <div className="space-y-3">
            {/* DaZ-Unterstützung */}
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">DaZ-Unterstützung</span>
              <IonToggle
                checked={formData.dazSupport}
                onIonChange={(e) => setFormData({ ...formData, dazSupport: e.detail.checked })}
                color="primary"
              />
            </div>

            {/* Lernschwierigkeiten */}
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Lernschwierigkeiten</span>
              <IonToggle
                checked={formData.learningDifficulties}
                onIonChange={(e) => setFormData({ ...formData, learningDifficulties: e.detail.checked })}
                color="primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* CTA Button (Fixed) */}
  <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
    <button
      onClick={handleSubmit}
      disabled={!formData.theme.trim()}
      className="w-full bg-primary-500 text-white font-bold py-4 rounded-xl hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
    >
      Idee entfalten ✨
    </button>
  </div>
</div>
```

**Validation**:
- Thema: Required, min 5 characters
- Lerngruppe: Default = "Klasse 8a"
- Toggles: Default = false

---

### Component 3: AgentResultView.tsx (MODIFY existing)

**Purpose**: Add "Teilen" button and animation trigger

**File**: `teacher-assistant/frontend/src/components/AgentResultView.tsx` (EXISTING - MODIFY)

**Changes**:

1. **Replace Action Buttons**:

```tsx
// OLD (remove):
// <button>Download</button>
// <button>Zurück zum Chat</button>

// NEW (add):
<div className="bg-white border-t border-gray-200 px-6 py-4 space-y-3">
  {/* Success Badge */}
  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
    <IonIcon icon={checkmarkCircleOutline} className="text-green-600 text-2xl" />
    <div className="flex-1">
      <p className="font-semibold text-green-900">In Bibliothek gespeichert</p>
      <p className="text-sm text-green-700">Jederzeit abrufbar</p>
    </div>
  </div>

  {/* Action Buttons */}
  <div className="grid grid-cols-2 gap-3">
    {/* Teilen */}
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
    >
      <IonIcon icon={shareOutline} className="text-xl" />
      Teilen
    </button>

    {/* Weiter im Chat (triggers animation) */}
    <button
      onClick={handleContinueChat}
      className="flex items-center justify-center gap-2 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
    >
      <IonIcon icon={chatbubbleOutline} className="text-xl" />
      Weiter im Chat
    </button>
  </div>
</div>
```

2. **Add Share Function**:

```tsx
const handleShare = async () => {
  if (!result) return;

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Generiertes Bild',
        text: `Bild zum Thema: ${result.metadata.theme}`,
        url: result.data.imageUrl
      });
    } else {
      // Fallback: Copy link
      await navigator.clipboard.writeText(result.data.imageUrl);
      // TODO: Show toast "Link kopiert!"
    }
  } catch (error) {
    console.error('Share failed:', error);
  }
};
```

3. **Add Animation Trigger**:

```tsx
const handleContinueChat = () => {
  // Trigger animation before closing
  animateToLibrary();
  // Modal closes in animation's onFinish callback
};
```

---

### Animation Implementation

**File**: `teacher-assistant/frontend/src/components/AgentResultView.tsx` (add function)

**Implementation**:

```typescript
const animateToLibrary = () => {
  // Get elements
  const imageElement = document.querySelector('.agent-result-image') as HTMLElement;
  const libraryTab = document.querySelector('ion-tab-button[tab="library"]') as HTMLElement;

  if (!imageElement || !libraryTab) {
    console.warn('Animation elements not found, closing modal');
    closeModal();
    return;
  }

  // Get positions
  const imageRect = imageElement.getBoundingClientRect();
  const libraryRect = libraryTab.getBoundingClientRect();

  // Calculate delta
  const deltaX = libraryRect.left + libraryRect.width / 2 - (imageRect.left + imageRect.width / 2);
  const deltaY = libraryRect.top + libraryRect.height / 2 - (imageRect.top + imageRect.height / 2);

  // Clone image for animation
  const clone = imageElement.cloneNode(true) as HTMLElement;
  clone.classList.add('flying-image');
  clone.style.position = 'fixed';
  clone.style.top = `${imageRect.top}px`;
  clone.style.left = `${imageRect.left}px`;
  clone.style.width = `${imageRect.width}px`;
  clone.style.height = `${imageRect.height}px`;
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';
  clone.style.borderRadius = '1rem';

  document.body.appendChild(clone);

  // Animate using Web Animations API
  const animation = clone.animate([
    {
      transform: 'translate(0, 0) scale(1)',
      opacity: 1,
      borderRadius: '1rem'
    },
    {
      transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`,
      opacity: 0,
      borderRadius: '50%'
    }
  ], {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards'
  });

  // Cleanup and close modal after animation
  animation.onfinish = () => {
    clone.remove();
    closeModal();

    // Optional: Show toast notification
    // toast.success('Bild in Bibliothek gespeichert ✓');
  };
};
```

**CSS** (add to `App.css`):

```css
.flying-image {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  will-change: transform, opacity;
}

.agent-result-image {
  /* Ensure this class is on the result image */
  border-radius: 1rem;
}
```

**Performance Optimization**:
- Use `will-change: transform, opacity` for GPU acceleration
- Only animate `transform` and `opacity` (60fps properties)
- Clean up clone immediately after animation

---

## 🔌 Backend Integration

### No Backend Changes Required ✅

**Existing APIs work as-is:**

1. **Chat with Agent Detection**:
   ```
   POST /api/chat
   Response: { message, agentSuggestion }
   ```

2. **Agent Execution**:
   ```
   POST /api/langgraph-agents/execute
   Body: { agentType, input: ImageGenerationFormData, userId }
   ```

3. **Progress Streaming**:
   ```
   SSE /api/langgraph-agents/progress/:executionId
   ```

4. **Library Save**:
   ```
   POST /api/materials
   (Auto-triggered in AgentContext.saveToLibrary())
   ```

### Parameter Mapping (Backend-Side)

**File**: `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.ts` (MODIFY)

**Update Prompt Engineering**:

```typescript
// OLD prompt:
const prompt = input.prompt;

// NEW prompt (enhanced with pedagogy):
const buildPrompt = (formData: ImageGenerationFormData): string => {
  let prompt = `Erstelle ein pädagogisch wertvolles Bild für das Thema: ${formData.theme}.\n`;
  prompt += `Zielgruppe: ${formData.learningGroup}.\n`;

  if (formData.dazSupport) {
    prompt += `Berücksichtige DaZ-Lernende (Deutsch als Zweitsprache):\n`;
    prompt += `- Einfache, klare visuelle Elemente\n`;
    prompt += `- Keine komplexen Texteinblendungen\n`;
    prompt += `- Universell verständliche Symbole\n`;
  }

  if (formData.learningDifficulties) {
    prompt += `Berücksichtige Lernschwierigkeiten:\n`;
    prompt += `- Klare, strukturierte Darstellung\n`;
    prompt += `- Wenig visuelle Ablenkung\n`;
    prompt += `- Fokus auf Kernkonzept\n`;
  }

  prompt += `Stil: Pädagogisch, ansprechend, altersgerecht für ${formData.learningGroup}.`;

  return prompt;
};

const enhancedPrompt = buildPrompt(input as ImageGenerationFormData);
```

---

## 🧪 Testing Strategy

### Unit Tests

#### 1. AgentConfirmationMessage.test.tsx (NEW)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentConfirmationMessage } from './AgentConfirmationMessage';
import { AgentProvider } from '../lib/AgentContext';

vi.mock('../lib/AgentContext', () => ({
  AgentProvider: ({ children }) => children,
  useAgent: () => ({
    openModal: vi.fn()
  })
}));

describe('AgentConfirmationMessage', () => {
  it('renders normal message without agentSuggestion', () => {
    const message = { content: 'Hello world' };
    render(<AgentConfirmationMessage message={message} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByText(/Bildgenerierung/)).not.toBeInTheDocument();
  });

  it('renders confirmation card with agentSuggestion', () => {
    const message = {
      content: 'Ich kann ein Bild erstellen.',
      agentSuggestion: {
        agentType: 'image-generation',
        reasoning: 'Zum Thema Pythagoras',
        prefillData: { theme: 'Satz des Pythagoras' }
      }
    };

    render(<AgentConfirmationMessage message={message} />);

    expect(screen.getByText('Bildgenerierung')).toBeInTheDocument();
    expect(screen.getByText(/Zum Thema Pythagoras/)).toBeInTheDocument();
    expect(screen.getByText(/Ja, Bild erstellen/)).toBeInTheDocument();
  });

  it('calls openModal on button click', () => {
    const openModal = vi.fn();
    vi.mocked(useAgent).mockReturnValue({ openModal });

    const message = {
      content: 'Test',
      agentSuggestion: {
        agentType: 'image-generation',
        reasoning: 'Test',
        prefillData: { theme: 'Test' }
      }
    };

    render(<AgentConfirmationMessage message={message} />);
    fireEvent.click(screen.getByText(/Ja, Bild erstellen/));

    expect(openModal).toHaveBeenCalledWith('image-generation', { theme: 'Test' });
  });
});
```

#### 2. AgentFormView.test.tsx (MODIFY existing)

Add tests for new fields:

```typescript
it('renders Gemini form fields', () => {
  render(<AgentFormView agentType="image-generation" prefillData={{ theme: 'Pythagoras' }} />);

  expect(screen.getByLabelText(/Thema/)).toHaveValue('Pythagoras');
  expect(screen.getByLabelText(/Lerngruppe/)).toBeInTheDocument();
  expect(screen.getByText(/DaZ-Unterstützung/)).toBeInTheDocument();
  expect(screen.getByText(/Lernschwierigkeiten/)).toBeInTheDocument();
});

it('submits form with Gemini data', async () => {
  const submitForm = vi.fn();
  vi.mocked(useAgent).mockReturnValue({ submitForm });

  render(<AgentFormView agentType="image-generation" prefillData={{}} />);

  // Fill form
  fireEvent.change(screen.getByLabelText(/Thema/), { target: { value: 'Test' } });
  // Toggle DaZ
  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  // Submit
  fireEvent.click(screen.getByText(/Idee entfalten/));

  expect(submitForm).toHaveBeenCalledWith({
    theme: 'Test',
    learningGroup: 'Klasse 8a',
    dazSupport: true,
    learningDifficulties: false
  });
});
```

#### 3. AgentResultView.test.tsx (MODIFY existing)

Add tests for new buttons:

```typescript
it('renders Teilen and Weiter im Chat buttons', () => {
  const result = {
    artifactId: '123',
    data: { imageUrl: 'https://example.com/image.png' },
    metadata: { theme: 'Test' }
  };

  render(<AgentResultView result={result} />);

  expect(screen.getByText(/Teilen/)).toBeInTheDocument();
  expect(screen.getByText(/Weiter im Chat/)).toBeInTheDocument();
});

it('calls share function on Teilen click', async () => {
  const mockShare = vi.fn();
  global.navigator.share = mockShare;

  const result = { /* ... */ };
  render(<AgentResultView result={result} />);

  fireEvent.click(screen.getByText(/Teilen/));

  await waitFor(() => {
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Generiertes Bild',
      text: expect.stringContaining('Test'),
      url: 'https://example.com/image.png'
    });
  });
});

it('triggers animation on Weiter im Chat click', () => {
  const animateSpy = vi.spyOn(window.Element.prototype, 'animate');

  render(<AgentResultView result={result} />);
  fireEvent.click(screen.getByText(/Weiter im Chat/));

  expect(animateSpy).toHaveBeenCalled();
  // Verify animation properties
  expect(animateSpy.mock.calls[0][1].duration).toBe(600);
});
```

### Integration Tests

**File**: `AgentModal.integration.test.tsx` (MODIFY existing)

Add test scenario for full Gemini workflow:

```typescript
it('completes Gemini workflow: Confirmation → Form → Result → Animation', async () => {
  render(<App />);

  // 1. Send chat message
  const chatInput = screen.getByPlaceholderText(/Nachricht/);
  fireEvent.change(chatInput, { target: { value: 'Erstelle Bild zum Satz des Pythagoras' } });
  fireEvent.click(screen.getByText(/Senden/));

  // 2. Wait for confirmation message
  await waitFor(() => {
    expect(screen.getByText(/Bildgenerierung/)).toBeInTheDocument();
  });

  // 3. Click confirmation
  fireEvent.click(screen.getByText(/Ja, Bild erstellen/));

  // 4. Verify modal opened with Gemini form
  await waitFor(() => {
    expect(screen.getByText(/Maßgeschneidertes Arbeitsmaterial/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thema/)).toHaveValue('Satz des Pythagoras');
  });

  // 5. Submit form
  fireEvent.click(screen.getByText(/Idee entfalten/));

  // 6. Wait for result
  await waitFor(() => {
    expect(screen.getByText(/In Bibliothek gespeichert/)).toBeInTheDocument();
  }, { timeout: 10000 });

  // 7. Click "Weiter im Chat"
  fireEvent.click(screen.getByText(/Weiter im Chat/));

  // 8. Verify animation triggered (check for clone element)
  expect(document.querySelector('.flying-image')).toBeInTheDocument();

  // 9. Wait for animation to finish and modal to close
  await waitFor(() => {
    expect(screen.queryByText(/Maßgeschneidertes Arbeitsmaterial/)).not.toBeInTheDocument();
  }, { timeout: 1000 });
});
```

### E2E Tests (Playwright)

**File**: `e2e-tests/image-generation-gemini-workflow.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Image Generation - Gemini Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    // Assume logged in
  });

  test('should complete full Gemini workflow with animation', async ({ page }) => {
    // Navigate to Chat
    await page.click('ion-tab-button[tab="chat"]');

    // Send message requesting image
    await page.fill('textarea[placeholder*="Nachricht"]', 'Erstelle ein Bild zum Satz des Pythagoras');
    await page.click('button:has-text("Senden")');

    // Wait for confirmation message
    await expect(page.locator('text=/Bildgenerierung/i')).toBeVisible({ timeout: 10000 });

    // Click confirmation button
    await page.click('button:has-text("Ja, Bild erstellen")');

    // Modal should open with Gemini form
    await expect(page.locator('text=/Maßgeschneidertes Arbeitsmaterial/i')).toBeVisible();

    // Verify pre-filled theme
    const themeInput = page.locator('textarea[placeholder*="Thema"]');
    await expect(themeInput).toHaveValue(/Pythagoras/i);

    // Toggle Lernschwierigkeiten
    await page.click('ion-toggle:near(:text("Lernschwierigkeiten"))');

    // Submit form
    await page.click('button:has-text("Idee entfalten")');

    // Wait for progress view
    await expect(page.locator('text=/wird erstellt/i')).toBeVisible({ timeout: 3000 });

    // Wait for result view
    await expect(page.locator('text=/In Bibliothek gespeichert/i')).toBeVisible({ timeout: 90000 });

    // Verify image is displayed
    await expect(page.locator('img.agent-result-image')).toBeVisible();

    // Click "Weiter im Chat"
    await page.click('button:has-text("Weiter im Chat")');

    // Verify animation (flying-image element appears)
    await expect(page.locator('.flying-image')).toBeVisible({ timeout: 100 });

    // Wait for modal to close (after animation)
    await expect(page.locator('text=/Maßgeschneidertes Arbeitsmaterial/i')).not.toBeVisible({ timeout: 1000 });

    // Verify result thumbnail in chat
    await expect(page.locator('text=/Bild erfolgreich generiert/i')).toBeVisible();
  });

  test('should share image using Web Share API', async ({ page, context }) => {
    // ... open modal and generate image ...

    // Mock share dialog (Playwright limitation: can't test native share)
    await page.evaluate(() => {
      navigator.share = async (data) => {
        console.log('Share called:', data);
        return Promise.resolve();
      };
    });

    // Click Teilen button
    await page.click('button:has-text("Teilen")');

    // Verify share was called (check console log)
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.waitForTimeout(500);
    expect(logs.some(log => log.includes('Share called'))).toBeTruthy();
  });
});
```

---

## 🚀 Deployment Plan

### Phase 1: Confirmation Message (2 hours)

**Tasks**:
1. Create `AgentConfirmationMessage.tsx`
2. Modify `ChatView.tsx` to render confirmation messages
3. Update chat message type to include `agentSuggestion`
4. Write unit tests
5. Verify in dev environment

**Deliverables**:
- Confirmation message renders in chat
- Button opens existing agent modal

---

### Phase 2: Gemini Form Redesign (3 hours)

**Tasks**:
1. Modify `AgentFormView.tsx` with new fields
2. Update form validation
3. Update `ImageGenerationFormData` type
4. Write unit tests
5. Visual verification (screenshot)

**Deliverables**:
- Form matches Gemini screenshot
- Pre-fill works from chat context
- "Idee entfalten" button starts agent

---

### Phase 3: Result View Enhancement (2 hours)

**Tasks**:
1. Modify `AgentResultView.tsx` buttons
2. Implement share function
3. Implement animation trigger
4. Write unit tests
5. Test Web Share API on mobile

**Deliverables**:
- "Teilen" and "Weiter im Chat" buttons work
- Share opens native dialog

---

### Phase 4: Animation Implementation (2 hours)

**Tasks**:
1. Implement `animateToLibrary()` function
2. Add CSS for `.flying-image`
3. Test animation performance (60fps)
4. Add cleanup logic
5. Write integration tests

**Deliverables**:
- Animation plays smoothly
- Modal closes after animation
- No memory leaks

---

### Phase 5: Integration & QA (2 hours)

**Tasks**:
1. Integration tests (full workflow)
2. Playwright E2E tests
3. Visual regression testing
4. Mobile device testing (iOS + Android)
5. Performance audit

**Deliverables**:
- All tests passing
- Animation verified on mobile
- No performance issues

---

## 📊 Success Metrics

### Functional

- ✅ Confirmation message appears when appropriate
- ✅ Modal opens with Gemini design
- ✅ Form pre-fills from chat context
- ✅ Share function works on mobile
- ✅ Animation plays at 60fps
- ✅ Modal closes after animation

### Non-Functional

- ✅ Animation duration: 600ms
- ✅ FPS: ≥ 60fps (use Chrome DevTools)
- ✅ Bundle size increase: < 5kb
- ✅ No console errors

### User Experience

- ✅ Workflow feels natural
- ✅ Animation delights, not annoys
- ✅ Share works out-of-the-box

---

## 🔄 Rollback Plan

**If issues arise**:

1. **Quick Disable** (Feature Flag):
   ```bash
   VITE_ENABLE_GEMINI_WORKFLOW=false
   ```

2. **Partial Rollback** (keep confirmation, disable animation):
   ```typescript
   const ENABLE_ANIMATION = false;
   ```

3. **Full Rollback** (git revert):
   ```bash
   git revert <commit-hash>
   ```

---

## 📚 Related Files

### Files to CREATE:
- `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx`
- `teacher-assistant/frontend/src/components/AgentConfirmationMessage.test.tsx`
- `teacher-assistant/frontend/e2e-tests/image-generation-gemini-workflow.spec.ts`

### Files to MODIFY:
- `teacher-assistant/frontend/src/components/AgentFormView.tsx`
- `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/src/lib/types.ts`
- `teacher-assistant/frontend/src/App.css`
- `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.ts`

### Files to READ (for reference):
- `.specify/specs/agent-ui-modal/spec.md`
- `.specify/specs/visual-redesign-gemini/spec.md`
- `teacher-assistant/frontend/src/lib/AgentContext.tsx`

---

**Status**: ✅ Ready for `tasks.md`
**Next Step**: Create implementation task list
**Estimated Time**: 11-13 hours total

---

**Created**: 2025-10-02
**Author**: General-Purpose Agent
