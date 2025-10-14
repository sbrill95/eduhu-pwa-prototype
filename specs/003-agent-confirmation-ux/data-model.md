# Data Model: Agent Confirmation UX + Auto-Tagging

**Feature**: `003-agent-confirmation-ux`
**Phase**: 1 (Design)
**Date**: 2025-10-14

## Overview

This document defines the data structures for messages, library materials, and navigation state required for agent confirmation UX fixes and automatic image tagging.

## Core Entities

### 1. Message Metadata Structure

**Location**: `messages.metadata` field (JSON string in InstantDB)

**TypeScript Interface**:
```typescript
/**
 * Metadata for chat messages
 * Stored as JSON string in InstantDB messages.metadata field
 */
interface MessageMetadata {
  /**
   * Message type discriminator
   * - 'text': Standard text message (default)
   * - 'image': Message containing generated image
   * - 'agent_confirmation': Agent suggestion prompt
   * - 'agent_result': Agent execution result
   */
  type?: 'text' | 'image' | 'agent_confirmation' | 'agent_result';

  // ===== IMAGE MESSAGE FIELDS (type: 'image') =====

  /**
   * Full-size image URL from InstantDB storage
   * Required for image messages
   * @example "https://api.instantdb.com/storage/abc123/image.png"
   */
  image_url?: string;

  /**
   * Thumbnail URL (optional)
   * If not provided, image_url is used for thumbnails
   * @example "https://api.instantdb.com/storage/abc123/image_thumb.png"
   */
  thumbnail_url?: string;

  /**
   * Image title/caption
   * Displayed in chat history and library
   * @example "Anatomischer Löwe - Seitenansicht für Biologieunterricht"
   */
  title?: string;

  /**
   * Original generation parameters for regeneration
   * Enables "Regenerate" button with prefilled form
   */
  originalParams?: {
    description: string;
    imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
    learningGroup?: string;
    subject?: string;
    theme?: string;
  };

  // ===== AGENT CONFIRMATION FIELDS (type: 'agent_confirmation') =====

  /**
   * Agent suggestion data for confirmation prompts
   */
  agentSuggestion?: {
    agentType: 'image-generation' | 'quiz-generator' | 'lesson-planner';
    reasoning: string; // Why the agent is recommended
    prefillData?: Record<string, any>; // Data to prefill agent form
  };

  // ===== AGENT RESULT FIELDS (type: 'agent_result') =====

  /**
   * Reference to created library material
   */
  materialId?: string;

  /**
   * Agent execution metadata
   */
  agentMetadata?: {
    agentType: string;
    executionTime: number; // milliseconds
    success: boolean;
    error?: string;
  };
}
```

**Example Usage**:

```typescript
// Creating image message
const imageMetadata: MessageMetadata = {
  type: 'image',
  image_url: 'https://api.instantdb.com/storage/xyz789/lion.png',
  thumbnail_url: 'https://api.instantdb.com/storage/xyz789/lion_thumb.png',
  title: 'Anatomischer Löwe - Seitenansicht',
  originalParams: {
    description: 'Anatomischer Löwe für Biologieunterricht, Klasse 8a',
    imageStyle: 'realistic',
    learningGroup: 'Klasse 8a',
    subject: 'Biologie',
    theme: 'Anatomie'
  }
};

// Store in InstantDB
await db.transact(db.tx.messages[messageId].update({
  content: 'Bild wurde erfolgreich erstellt.',
  role: 'assistant',
  metadata: JSON.stringify(imageMetadata)
}));
```

**Parsing Pattern**:
```typescript
// Frontend: Parse metadata safely
const parseMessageMetadata = (metadataString?: string): MessageMetadata => {
  if (!metadataString) return {};
  try {
    return JSON.parse(metadataString) as MessageMetadata;
  } catch (error) {
    console.error('Failed to parse message metadata:', error);
    return {};
  }
};

// Usage in component
const metadata = parseMessageMetadata(message.metadata);
if (metadata.type === 'image') {
  return <ImageMessage imageUrl={metadata.image_url} title={metadata.title} />;
}
```

---

### 2. Library Material Metadata Structure

**Location**: `library_materials.metadata` field (JSON string in InstantDB)

**TypeScript Interface**:
```typescript
/**
 * Metadata for library materials
 * Stored as JSON string in InstantDB library_materials.metadata field
 */
interface LibraryMaterialMetadata {
  /**
   * Material type discriminator
   */
  type: 'image' | 'document' | 'worksheet' | 'quiz' | 'lesson_plan';

  // ===== IMAGE FIELDS =====

  /**
   * Full-size image URL (InstantDB storage)
   * @example "https://api.instantdb.com/storage/abc123/image.png"
   */
  image_url?: string;

  /**
   * Image generation style
   */
  image_style?: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';

  /**
   * Original generation prompt/description
   */
  prompt?: string;

  // ===== AUTO-GENERATED TAGS (NEW) =====

  /**
   * Automatically generated tags via Vision API
   * Used for search functionality (not displayed in UI)
   * Max 15 tags, lowercase, deduplicated
   * @example ["anatomie", "biologie", "löwe", "seitenansicht", "säugetier"]
   */
  tags?: string[];

  /**
   * Tag generation metadata
   */
  tagging?: {
    generatedAt: number; // timestamp
    model: string; // e.g., "gpt-4o"
    confidence: 'high' | 'medium' | 'low';
    error?: string; // If tagging failed
  };

  // ===== REGENERATION PARAMETERS =====

  /**
   * Original generation parameters for regeneration
   * Enables "Regenerate" button in MaterialPreviewModal
   */
  originalParams?: {
    description: string;
    imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
    learningGroup?: string;
    subject?: string;
    theme?: string;
  };

  // ===== AGENT METADATA =====

  /**
   * Which agent created this material
   */
  agent_id?: string;
  agent_name?: string;
  model_used?: string; // e.g., "dall-e-3", "gpt-4"

  // ===== EDUCATIONAL CONTEXT =====

  subject?: string; // e.g., "Biologie"
  grade?: string; // e.g., "Klasse 8a"
  theme?: string; // e.g., "Anatomie"

  // ===== FILE METADATA (for uploads) =====

  filename?: string;
  file_url?: string;
  file_type?: string; // MIME type
  image_data?: string; // Base64 (legacy support)

  // ===== ARTIFACT DATA =====

  artifact_data?: {
    url?: string;
    [key: string]: any;
  };
}
```

**Example Usage**:

```typescript
// Creating library material with tags
const materialMetadata: LibraryMaterialMetadata = {
  type: 'image',
  image_url: 'https://api.instantdb.com/storage/xyz789/lion.png',
  image_style: 'realistic',
  prompt: 'Anatomischer Löwe für Biologieunterricht',
  tags: ['anatomie', 'biologie', 'löwe', 'seitenansicht', 'säugetier', 'muskulatur'],
  tagging: {
    generatedAt: Date.now(),
    model: 'gpt-4o',
    confidence: 'high'
  },
  originalParams: {
    description: 'Anatomischer Löwe für Biologieunterricht',
    imageStyle: 'realistic',
    learningGroup: 'Klasse 8a',
    subject: 'Biologie'
  },
  agent_id: 'image-generation',
  agent_name: 'Bildgenerierung',
  model_used: 'dall-e-3',
  subject: 'Biologie',
  grade: 'Klasse 8a',
  theme: 'Anatomie'
};

// Store in InstantDB
await db.transact(db.tx.library_materials[materialId].update({
  title: 'Anatomischer Löwe - Seitenansicht',
  type: 'image',
  content: 'https://api.instantdb.com/storage/xyz789/lion.png',
  metadata: JSON.stringify(materialMetadata),
  user_id: userId,
  created_at: Date.now(),
  updated_at: Date.now(),
  is_favorite: false,
  usage_count: 0
}));
```

**Search Integration**:
```typescript
// Frontend: Search materials by tags
const searchMaterials = (query: string, materials: LibraryMaterial[]) => {
  const lowercaseQuery = query.toLowerCase();

  return materials.filter(material => {
    // Parse metadata
    const metadata = material.metadata
      ? JSON.parse(material.metadata) as LibraryMaterialMetadata
      : {};

    // Search in title
    if (material.title.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }

    // Search in tags (NEW)
    if (metadata.tags?.some(tag => tag.includes(lowercaseQuery))) {
      return true;
    }

    // Search in description/content
    if (material.content?.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }

    return false;
  });
};
```

---

### 3. Library Navigation State

**Location**: Custom event dispatched from AgentResultView, received in Library.tsx

**Event Interface**:
```typescript
/**
 * Custom event for Library tab navigation
 * Dispatched when user should be navigated to Library with specific material
 */
interface LibraryNavigationEvent extends CustomEvent {
  detail: {
    /**
     * Which Library sub-tab to show
     * - 'chats': Chat history tab
     * - 'materials': Materials/artifacts tab
     */
    tab: 'chats' | 'materials';

    /**
     * Material ID to auto-open in MaterialPreviewModal
     * If provided, modal opens automatically on navigation
     * @example "abc123"
     */
    materialId?: string;

    /**
     * Additional context for debugging
     */
    source?: string; // e.g., "AgentResultView", "Homepage"
  };
}
```

**Dispatch Pattern**:
```typescript
// Sender: AgentResultView.tsx (after image generation)
const navigateToLibrary = (materialId: string) => {
  window.dispatchEvent(new CustomEvent('navigate-library-tab', {
    detail: {
      tab: 'materials',
      materialId: materialId,
      source: 'AgentResultView'
    }
  }));

  // Also trigger tab change in parent
  if (onTabChange) {
    onTabChange('library');
  }
};
```

**Receiver Pattern**:
```typescript
// Receiver: Library.tsx
useEffect(() => {
  const handleLibraryNav = (event: Event) => {
    const customEvent = event as CustomEvent<LibraryNavigationEvent['detail']>;
    console.log('[Library] Received navigation event:', customEvent.detail);

    // Switch to materials tab
    if (customEvent.detail?.tab === 'materials') {
      setSelectedTab('artifacts');
    }

    // Open modal if materialId provided
    if (customEvent.detail?.materialId) {
      // Find material by ID
      const material = materials.find(m => m.id === customEvent.detail.materialId);

      if (material) {
        // Convert to UnifiedMaterial and open modal
        const unifiedMaterial = convertArtifactToUnifiedMaterial(material);
        setSelectedMaterial(unifiedMaterial);
        setIsModalOpen(true);
      } else {
        console.warn('[Library] Material not found:', customEvent.detail.materialId);
      }
    }
  };

  window.addEventListener('navigate-library-tab', handleLibraryNav);
  return () => window.removeEventListener('navigate-library-tab', handleLibraryNav);
}, [materials]); // Re-register when materials change
```

---

### 4. Chat Session Persistence

**Location**: AgentContext state + chat_sessions table

**State Interface**:
```typescript
/**
 * Agent Context state for session persistence
 */
interface AgentContextState {
  /**
   * Currently active agent type
   */
  activeAgent: 'image-generation' | 'quiz-generator' | 'lesson-planner' | null;

  /**
   * Modal open state
   */
  isModalOpen: boolean;

  /**
   * Chat session ID to preserve during agent workflow
   * If undefined, a new session will be created
   * If provided, messages are added to existing session
   */
  sessionId?: string;

  /**
   * Prefill data for agent form
   */
  prefillData?: Record<string, any>;
}

/**
 * Method to open agent modal with session preservation
 */
interface AgentContextMethods {
  openModal: (
    agentType: string,
    prefillData?: Record<string, any>,
    sessionId?: string // NEW: Pass session ID to preserve context
  ) => void;

  closeModal: () => void;
}
```

**Usage Pattern**:
```typescript
// Component: AgentConfirmationMessage.tsx
const AgentConfirmationMessage: React.FC<Props> = ({ message, sessionId }) => {
  const { openModal } = useAgent();

  const handleConfirm = () => {
    // Pass sessionId to preserve chat context
    openModal(
      message.agentSuggestion!.agentType,
      message.agentSuggestion!.prefillData,
      sessionId // <-- Preserve existing session
    );
  };

  // ...
};

// Component: AgentFormView (inside modal)
const AgentFormView: React.FC = () => {
  const { sessionId } = useAgent();

  const handleSubmit = async (formData: FormData) => {
    // Create image...
    const imageUrl = await generateImage(formData);

    // Create message in EXISTING session (not new one)
    await db.transact(db.tx.messages[newMessageId].update({
      session: sessionId, // <-- Use existing session ID
      role: 'assistant',
      content: 'Bild wurde erfolgreich erstellt.',
      message_index: await getNextMessageIndex(sessionId),
      metadata: JSON.stringify({
        type: 'image',
        image_url: imageUrl,
        title: formData.description,
        originalParams: formData
      })
    }));
  };
};
```

**Validation**:
```typescript
// Helper: Ensure message_index increments correctly
const getNextMessageIndex = async (sessionId: string): Promise<number> => {
  const { data } = await db.useQuery({
    messages: {
      $: {
        where: { 'session.id': sessionId },
        order: { message_index: 'desc' },
        limit: 1
      }
    }
  });

  const lastMessage = data?.messages?.[0];
  return (lastMessage?.message_index ?? -1) + 1;
};
```

---

## Data Flow Diagrams

### Flow 1: Image Creation with Chat Integration

```
1. User asks: "Erstelle ein Bild von einem Löwen"
   ↓
2. ChatGPT suggests agent
   ↓
3. Create message with type: 'agent_confirmation'
   metadata: { agentSuggestion: { agentType: 'image-generation', ... } }
   ↓
4. AgentConfirmationMessage renders with sessionId
   ↓
5. User clicks "Bild-Generierung starten"
   ↓
6. openModal('image-generation', prefillData, sessionId)
   ↓
7. Agent generates image → Save to InstantDB storage
   ↓
8. Create library_materials entry with metadata (including empty tags)
   ↓
9. Create chat message in SAME session
   metadata: { type: 'image', image_url, originalParams }
   ↓
10. Trigger async Vision API tagging (non-blocking)
    ↓
11. Update library_materials.metadata.tags with results
    ↓
12. Navigate to Library with materialId
    ↓
13. MaterialPreviewModal opens with full image
```

### Flow 2: Tag-Based Search

```
1. User searches "anatomie" in Library
   ↓
2. Query materials where:
   - title contains "anatomie" OR
   - metadata.tags contains "anatomie" OR
   - content contains "anatomie"
   ↓
3. Display matching materials in grid
   ↓
4. User clicks material card
   ↓
5. MaterialPreviewModal opens (tags NOT visible in UI)
```

---

## Migration Notes

**No schema migration required** - All changes use existing JSON metadata fields.

**Backward Compatibility**:
- Existing messages without metadata: Treated as type='text'
- Existing materials without tags: Search still works (title/content only)
- Existing originalParams: Parsed correctly (fallback to old structure)

**Data Validation**:
- All JSON parsing wrapped in try-catch
- Missing fields have sensible defaults
- Invalid metadata logs warning but doesn't break UI

---

## Type Definitions File

**Location**: `teacher-assistant/frontend/src/types/metadata.ts`

```typescript
// Export all interfaces for use across codebase
export interface MessageMetadata {
  // ... (full interface from above)
}

export interface LibraryMaterialMetadata {
  // ... (full interface from above)
}

export interface LibraryNavigationEvent extends CustomEvent {
  // ... (full interface from above)
}

export interface AgentContextState {
  // ... (full interface from above)
}

// Helper type guards
export const isImageMessage = (metadata: MessageMetadata): boolean => {
  return metadata.type === 'image' && !!metadata.image_url;
};

export const hasRegenParams = (metadata: LibraryMaterialMetadata): boolean => {
  return !!metadata.originalParams;
};

export const hasTags = (metadata: LibraryMaterialMetadata): boolean => {
  return !!metadata.tags && metadata.tags.length > 0;
};
```

---

## References

- InstantDB Schema: `teacher-assistant/backend/src/schemas/instantdb.ts`
- Message Types: `teacher-assistant/frontend/src/lib/types.ts`
- Material Mappers: `teacher-assistant/frontend/src/lib/materialMappers.ts`
- Library Component: `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- Agent Context: `teacher-assistant/frontend/src/lib/AgentContext.tsx`
