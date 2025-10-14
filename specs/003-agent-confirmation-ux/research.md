# Research: Agent Confirmation UX Fixes + Auto-Tagging

**Feature**: `003-agent-confirmation-ux`
**Phase**: 0 (Research)
**Date**: 2025-10-14

## Executive Summary

This research document captures technical decisions for fixing 6 critical UX issues in the agent confirmation workflow and implementing automatic image tagging via Vision API.

**Key Findings**:
1. **Tailwind classes ARE rendering** - Primary colors defined correctly, issue is component styling logic
2. **Library navigation requires custom event pattern** - Already implemented for modal-open parameter
3. **Vision API integration pattern exists** - Use OpenAI GPT-4o with vision for background tagging
4. **Message metadata structure defined** - InstantDB schema supports metadata JSON field

## Technical Context Summary

- **Language**: TypeScript (4.9+)
- **Frontend**: React 18 + Vite 4 + Tailwind CSS 3.4 + Ionic 8
- **Backend**: Node.js 18 + Express 4 + TypeScript 5
- **Database**: InstantDB (real-time sync, JSON metadata fields)
- **AI**: OpenAI API (GPT-4o with vision support)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Build**: TypeScript strict mode, ESM modules

## Research Questions & Decisions

### Q1: Why are Tailwind primary-* classes not rendering in Agent Confirmation Card?

**Problem**: Agent Confirmation Card appears as white box on white background, despite Tailwind primary colors being defined.

**Investigation**:
- Checked `tailwind.config.js`: Primary colors ARE defined correctly (50-900 scale)
- Checked `AgentConfirmationMessage.tsx`: Classes ARE used correctly (`bg-gradient-to-r from-primary-50 to-primary-100`, `border-primary-500`, `bg-primary-600`)
- Checked Vite config: No CSP issues, no Tailwind JIT compilation issues

**Root Cause**: Component is rendering correctly, but the gradient colors (primary-50 to primary-100) provide insufficient contrast against white backgrounds. The orange brand color (#fb6542) is defined but the lighter shades (50-100) are very pale.

**Decision**:
- Keep existing Tailwind classes but enhance contrast
- Add shadow to card for depth: `shadow-lg`
- Ensure primary-600 button has sufficient contrast (passes WCAG AA)
- Add ring to primary button for emphasis: `ring-2 ring-white ring-offset-2`

**Implementation**:
```tsx
// Current (insufficient contrast)
<div className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-500">

// Enhanced (better visibility)
<div className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-500 shadow-lg">
  <button className="bg-primary-600 ring-2 ring-white ring-offset-2">
```

**Validation**: Manual visual test + WCAG contrast ratio tool

---

### Q2: How to implement Library navigation with materialId parameter?

**Problem**: After image creation, "Weiter im Chat" button needs to navigate to Library tab AND open MaterialPreviewModal with the new image.

**Current Implementation**: Library.tsx already listens for `navigate-library-tab` custom event (lines 114-129):
```tsx
useEffect(() => {
  const handleLibraryNav = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.tab === 'materials') {
      setSelectedTab('artifacts');
    }
  };
  window.addEventListener('navigate-library-tab', handleLibraryNav);
  return () => window.removeEventListener('navigate-library-tab', handleLibraryNav);
}, []);
```

**Decision**: Extend existing custom event pattern to include materialId parameter

**Implementation Pattern**:
```tsx
// Sender (AgentResultView.tsx - "Weiter im Chat" button)
window.dispatchEvent(new CustomEvent('navigate-library-tab', {
  detail: {
    tab: 'materials',
    materialId: 'abc123' // Newly created material ID
  }
}));

// Receiver (Library.tsx - event handler)
const handleLibraryNav = (event: Event) => {
  const customEvent = event as CustomEvent;
  if (customEvent.detail?.tab === 'materials') {
    setSelectedTab('artifacts');

    // NEW: Open modal if materialId provided
    if (customEvent.detail?.materialId) {
      // Find material by ID
      const material = materials.find(m => m.id === customEvent.detail.materialId);
      if (material) {
        setSelectedMaterial(convertArtifactToUnifiedMaterial(material));
        setIsModalOpen(true);
      }
    }
  }
};
```

**Rationale**:
- Consistent with existing navigation pattern
- No prop drilling required
- Works across Ionic tab boundaries
- Decoupled components

**Alternative Rejected**:
- URL parameters (`/library?materialId=xyz`) - Rejected because Ionic tabs don't expose URL state cleanly
- React Context - Rejected because navigation needs to work cross-tab (Context resets)
- Props drilling through App.tsx - Rejected due to high coupling

---

### Q3: How to integrate Vision API for automatic background tagging?

**Problem**: Need to automatically generate 5-10 relevant tags for each created image for searchability, without blocking user workflow.

**Research Findings**:
- OpenAI API already integrated in backend (routes/chat.ts, routes/imageGeneration.ts)
- GPT-4o supports vision capabilities (analyze images, extract content)
- InstantDB library_materials.metadata field is JSON string (can store tags array)

**Decision**: Create dedicated `/api/vision/tag-image` endpoint with async processing

**API Pattern**:
```typescript
// POST /api/vision/tag-image
interface TagImageRequest {
  imageUrl: string;
  context?: {
    title: string;
    description: string;
  };
}

interface TagImageResponse {
  tags: string[]; // Max 15 tags, lowercase, deduplicated
  confidence: 'high' | 'medium' | 'low';
}
```

**Vision Prompt Template**:
```
Analysiere dieses Bildungsmaterial und generiere 5-10 relevante Tags auf Deutsch für Suchzwecke.

Berücksichtige:
- Fachgebiet (z.B. Mathematik, Biologie, Geschichte)
- Thema/Konzept (z.B. Pythagoras, Anatomie, Weltkrieg)
- Visuelle Elemente (z.B. Diagramm, Illustration, Foto)
- Bildungskontext (z.B. Grundschule, Sekundarstufe, Studium)
- Perspektive/Stil (z.B. Seitenansicht, abstrakt, realistisch)

Kontext:
Titel: {title}
Beschreibung: {description}

Antwort als JSON array: ["tag1", "tag2", ...]
Maximal 10 Tags, keine Duplikate, alles lowercase.
```

**Processing Flow**:
1. Image generation completes → Save to library_materials with empty tags
2. Trigger async tagging request (non-blocking)
3. Vision API analyzes image → Returns tags array
4. Update library_materials.metadata.tags with results
5. If Vision API fails → Log error, leave tags empty (graceful degradation)

**Error Handling**:
- Timeout after 30 seconds → Skip tagging
- 4xx/5xx errors → Log to error tracking, continue
- Rate limit exceeded → Queue for retry (max 3 attempts)

**Cost Consideration**:
- GPT-4o vision: ~$0.01 per image
- Acceptable for MVP (<100 images/day)
- Can optimize later with caching or cheaper models

**Alternative Considered**:
- CLIP embeddings (HuggingFace) - Rejected due to infrastructure complexity
- Pre-trained German tagger - Rejected due to lack of education-specific models

---

### Q4: What is the message metadata schema for image thumbnails?

**Problem**: Need to store image thumbnail data in chat messages for display in ChatView history.

**Current Schema** (instantdb.ts lines 52-53):
```typescript
messages: i.entity({
  // ... other fields
  metadata: i.string().optional(), // JSON object for agent suggestions
})
```

**Decision**: Define structured metadata format for image messages

**Metadata Schema**:
```typescript
interface MessageMetadata {
  type?: 'text' | 'image' | 'agent_confirmation' | 'agent_result';

  // For image messages (type: 'image')
  image_url?: string;           // Full-size image URL (InstantDB storage)
  thumbnail_url?: string;        // Thumbnail URL (optional, falls back to image_url)
  title?: string;                // Image title for caption
  originalParams?: {             // For regeneration
    description: string;
    imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
    learningGroup?: string;
    subject?: string;
  };

  // For agent confirmation messages (type: 'agent_confirmation')
  agentSuggestion?: {
    agentType: 'image-generation' | 'quiz-generator' | 'lesson-planner';
    reasoning: string;
    prefillData?: Record<string, any>;
  };
}
```

**Storage Format** (InstantDB):
```typescript
// When creating image message
db.transact(db.tx.messages[messageId].update({
  metadata: JSON.stringify({
    type: 'image',
    image_url: 'https://api.instantdb.com/storage/...',
    thumbnail_url: 'https://api.instantdb.com/storage/.../thumb',
    title: 'Anatomischer Löwe - Seitenansicht',
    originalParams: {
      description: 'Anatomischer Löwe für Biologieunterricht',
      imageStyle: 'realistic'
    }
  })
}));
```

**Parsing Pattern** (Frontend):
```typescript
const metadata = message.metadata
  ? JSON.parse(message.metadata) as MessageMetadata
  : {};

if (metadata.type === 'image') {
  return <ImageMessage
    imageUrl={metadata.image_url}
    title={metadata.title}
  />;
}
```

**Rationale**:
- Uses existing metadata field (no schema migration)
- Typed interface for TypeScript safety
- Extensible for future message types
- Backward compatible (metadata optional)

---

### Q5: How to implement Vision Context for chat continuity?

**Problem**: After image is created, user should be able to ask questions about the image (e.g., "What does this show?") and AI should analyze it.

**Current Implementation**: Backend chat route already supports OpenAI vision via messages array

**Decision**: Include image_url in ChatGPT messages array when referenced

**Implementation Pattern**:
```typescript
// Backend: routes/chat.ts
const messages = await buildMessagesArray(sessionId);

// Convert messages to OpenAI format
const openAIMessages = messages.map(msg => {
  const metadata = msg.metadata ? JSON.parse(msg.metadata) : {};

  if (metadata.type === 'image' && metadata.image_url) {
    // Image message → Send as vision content
    return {
      role: msg.role,
      content: [
        {
          type: 'text',
          text: msg.content || metadata.title || 'Generated image'
        },
        {
          type: 'image_url',
          image_url: {
            url: metadata.image_url,
            detail: 'low' // Cheaper, sufficient for context
          }
        }
      ]
    };
  } else {
    // Text message → Normal format
    return {
      role: msg.role,
      content: msg.content
    };
  }
});

// Send to OpenAI with vision support
const response = await openai.chat.completions.create({
  model: 'gpt-4o', // Supports vision
  messages: openAIMessages
});
```

**Error Handling**:
- If image URL expired (404) → Send text-only message with fallback: "Bild nicht mehr verfügbar"
- If vision API fails → Continue with text-only context
- Log all vision failures for monitoring

**Cost**:
- Vision tokens: ~$0.001 per image per message (low detail mode)
- Acceptable for MVP

---

### Q6: How to maintain chat session persistence across agent workflow?

**Problem**: Currently, starting an agent creates a new chat session, losing conversation history.

**Current Issue**: AgentContext.tsx likely creates new session when opening modal

**Investigation**: Need to pass sessionId to AgentFormView and preserve it through workflow

**Decision**: Pass sessionId through entire agent workflow

**Implementation Flow**:
```typescript
// 1. User confirms agent in chat
<AgentConfirmationMessage
  sessionId={currentSessionId} // Pass current session
  message={...}
/>

// 2. AgentConfirmationMessage passes sessionId to AgentContext
openModal('image-generation', prefillData, currentSessionId);

// 3. AgentContext stores sessionId in state
const [sessionId, setSessionId] = useState<string | undefined>(undefined);

openModal: (agentType, prefillData, sessionId) => {
  setSessionId(sessionId); // Store for later
  setActiveAgent(agentType);
  setIsModalOpen(true);
}

// 4. AgentFormView reads sessionId from context
const { sessionId } = useAgent();

// 5. On image generation success, create message in SAME session
await db.transact(db.tx.messages[newId].update({
  session: sessionId, // Use existing session, not new one
  role: 'assistant',
  content: 'Image created successfully',
  metadata: JSON.stringify({ type: 'image', ... })
}));
```

**Validation**:
- Check sessionId remains constant before/after agent workflow
- Verify all messages have same sessionId
- Ensure message_index increments correctly

---

## Technology Choices

### Tailwind CSS Contrast Fix
**Choice**: Enhance existing classes with shadows and rings
**Rationale**: No configuration changes needed, purely component-level fixes
**Risk**: Low - Visual-only changes

### Custom Event Pattern for Navigation
**Choice**: Extend existing `navigate-library-tab` event
**Rationale**: Already proven pattern in codebase, works across Ionic tabs
**Risk**: Low - Incremental enhancement of existing code

### OpenAI GPT-4o for Vision
**Choice**: Use existing OpenAI integration with vision capabilities
**Rationale**: Already authenticated, no new dependencies
**Cost**: ~$0.01 per image (acceptable for MVP)
**Risk**: Medium - API rate limits, cost scaling

### InstantDB JSON Metadata
**Choice**: Store tags/params as JSON strings in metadata field
**Rationale**: No schema migration, flexible, already in use
**Risk**: Low - Parsing errors handled gracefully

## Open Questions

None - All research questions resolved with concrete decisions.

## Next Steps (Phase 1)

1. Create `data-model.md` with complete metadata schemas
2. Create `contracts/` directory with Vision API specs
3. Create `quickstart.md` with manual test procedures
4. Update `plan.md` with filled Technical Context
5. Generate `tasks.md` via `/speckit.tasks` command

## References

- `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx` (lines 254-294)
- `teacher-assistant/frontend/tailwind.config.js` (lines 6-18)
- `teacher-assistant/backend/src/schemas/instantdb.ts` (lines 42-53, 89-103)
- `teacher-assistant/frontend/src/pages/Library/Library.tsx` (lines 114-129, 283-298)
- OpenAI Vision API Docs: https://platform.openai.com/docs/guides/vision
- WCAG Contrast Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
