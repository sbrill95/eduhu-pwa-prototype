# Comprehensive P0 Fixes - Implementation Plan

**Created**: 2025-10-05
**Status**: Planning
**Related**: [spec.md](spec.md)

---

## 🎯 Parallelization Strategy

### 3 Parallel Workstreams + 1 QA Stream

```
DAY 1 (8 hours)
┌─────────────────────────────────────────────────────────────────┐
│ Workstream A: Backend (Backend-Node-Developer Agent)           │
│ ├─ Hour 1-2: Enable routes + fix TypeScript errors             │
│ ├─ Hour 3-6: Enhance imageGeneration.ts (InstantDB)            │
│ └─ Hour 7-8: Test endpoints with curl                          │
├─────────────────────────────────────────────────────────────────┤
│ Workstream B: Frontend Home/Chat (React-Frontend-Developer)    │
│ ├─ Hour 1-2: FR-1 Chat Summary on Home                         │
│ ├─ Hour 3-4: FR-2 Auto-Submit Prompts                          │
│ ├─ Hour 5-6: FR-4 Image in Chat                                │
│ └─ Hour 7-8: FR-5 Image in Context                             │
├─────────────────────────────────────────────────────────────────┤
│ Workstream C: Frontend Library/Profile (React-Frontend-Dev)    │
│ ├─ Hour 1-2: FR-6 Images in Library                            │
│ ├─ Hour 3: FR-7 Chat Summary in Library                        │
│ ├─ Hour 4: FR-8,9 Anrede + Bibliothek                          │
│ └─ Hour 5-8: FR-11-13 Profile Fixes                            │
├─────────────────────────────────────────────────────────────────┤
│ Workstream D: QA (QA-Integration-Reviewer Agent)               │
│ ├─ Hour 1-3: Write Playwright E2E tests                        │
│ └─ Hour 4-8: Continuous testing (as code lands)                │
└─────────────────────────────────────────────────────────────────┘

DAY 2 (8 hours)
┌─────────────────────────────────────────────────────────────────┐
│ All Streams: QA Iteration Loop                                 │
│ ├─ Hour 1-2: Run full E2E test suite                           │
│ ├─ Hour 3-6: Fix failures, iterate                             │
│ └─ Hour 7-8: Manual QA + Final approval                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Workstream A: Backend (Agent: backend-node-developer)

### Phase A1: Enable Routes (2 hours)

**File**: `teacher-assistant/backend/src/routes/index.ts`

#### Step A1.1: Uncomment Routes (5 min)
```typescript
// Line 9-10: UNCOMMENT
import chatSummaryRouter from './chat-summary';
import profileRouter from './profile';

// Line 32-33: UNCOMMENT
router.use('/chat', chatSummaryRouter);
router.use('/profile', profileRouter);
```

#### Step A1.2: Check TypeScript Errors (15 min)
```bash
cd teacher-assistant/backend
npm run build

# If errors found, analyze:
# - chat-summary.ts: Check for type mismatches
# - profile.ts: Check for deprecated methods
```

**Common Errors (from langGraphAgents debugging)**:
- `ApiResponse<Record<string, unknown>>` → Replace with proper type
- `getInstantDB()` deprecated → Use `db` directly
- Missing imports

#### Step A1.3: Fix TypeScript Errors (30 min)

**Example Fix**:
```typescript
// routes/chat-summary.ts

// BEFORE (may have errors)
import { getInstantDB } from '../services/instantdbService';

router.post('/summary', async (req: Request, res: Response) => {
  const db = getInstantDB(); // ← Deprecated
  // ...
});

// AFTER (fixed)
import { db } from '../services/instantdbService';

router.post('/summary', async (req: Request, res: Response<ApiResponse<{ summary: string }>>) {
  // ...
  return res.json({
    success: true,
    data: { summary: 'Generated summary...' }
  });
});
```

#### Step A1.4: Test Endpoints (30 min)
```bash
# Start backend server
npm run dev

# Test chat-summary endpoint
curl -X POST http://localhost:3006/api/chat/summary \
  -H "Content-Type: application/json" \
  -d '{"chatId":"test-123"}'

# Expected: 200 OK (not 404)

# Test profile endpoints
curl -X GET "http://localhost:3006/api/profile/characteristics?userId=test-user-123"

curl -X POST http://localhost:3006/api/profile/characteristics/add \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","characteristic":"Mathematik"}'

# Expected: 200 OK (not 404)
```

#### Step A1.5: Restart Backend (5 min)
```bash
# Kill old process
taskkill //F //IM node.exe

# Restart with new routes enabled
npm run dev
```

**Deliverables**:
- ✅ Routes enabled (no 404 errors)
- ✅ No TypeScript compilation errors
- ✅ Backend server starts without crashes
- ✅ Endpoints return 200 OK

---

### Phase A2: Enhance Image Generation (4 hours)

**File**: `teacher-assistant/backend/src/routes/imageGeneration.ts`

#### Step A2.1: Add InstantDB Imports (5 min)
```typescript
import { db } from '../services/instantdbService';
```

#### Step A2.2: Add Library Storage After DALL-E (1 hour)
```typescript
router.post('/agents/execute', async (req: Request, res: Response) => {
  const { agentType, parameters, sessionId } = req.body;

  // ... existing DALL-E generation code ...

  const imageUrl = response.data?.[0]?.url;
  const revisedPrompt = response.data?.[0]?.revised_prompt;

  if (!imageUrl) {
    throw new Error('No image URL returned from DALL-E');
  }

  // ====== NEW: Save to library_materials ======
  const libraryMaterialId = db.id(); // Generate ID

  await db.transact([
    db.tx.library_materials[libraryMaterialId].update({
      title: parameters.theme || 'Generiertes Bild',
      type: 'image',
      url: imageUrl,
      description: revisedPrompt || enhancedPrompt,
      created_at: Date.now(),
      metadata: JSON.stringify({
        dalle_title: parameters.theme,
        revised_prompt: revisedPrompt,
        enhanced_prompt: enhancedPrompt,
        model: 'dall-e-3',
        size: '1024x1024',
        quality: 'standard',
        style: parameters.style || 'realistic',
        educationalLevel: parameters.educationalLevel,
      })
    })
  ]);

  console.log('[ImageGen] Saved to library_materials:', libraryMaterialId);

  // ... continue ...
});
```

#### Step A2.3: Add Chat Message Storage (1 hour)
```typescript
// ... after library storage ...

let messageId = null;

if (sessionId) {
  messageId = db.id(); // Generate ID

  await db.transact([
    db.tx.messages[messageId].update({
      content: `Bild generiert: ${parameters.theme}`,
      role: 'assistant',
      chat_session_id: sessionId,
      created_at: Date.now(),
      metadata: JSON.stringify({
        type: 'image',
        image_url: imageUrl,
        library_id: libraryMaterialId,
        revised_prompt: revisedPrompt,
        dalle_title: parameters.theme,
      })
    })
  ]);

  console.log('[ImageGen] Saved to messages:', messageId);
}
```

#### Step A2.4: Update Response (30 min)
```typescript
// Return complete response with IDs
return res.json({
  success: true,
  data: {
    executionId: `exec-${Date.now()}`,
    image_url: imageUrl,
    library_id: libraryMaterialId,
    message_id: messageId,
    revised_prompt: revisedPrompt,
    enhanced_prompt: enhancedPrompt,
    title: parameters.theme,
    dalle_title: parameters.theme,
    quality_score: 0.9,
    educational_optimized: true,
    cost: 0.04,
    metadata: {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',
    }
  }
});
```

#### Step A2.5: Error Handling (30 min)
```typescript
try {
  // ... image generation + storage ...
} catch (error: any) {
  console.error('[ImageGen] Error:', error);

  // Differentiate error types
  if (error.message?.includes('DALL-E')) {
    return res.status(500).json({
      success: false,
      error: 'Image generation failed',
      details: error.message
    });
  }

  if (error.message?.includes('InstantDB')) {
    // Still return image URL, but flag storage failure
    return res.status(207).json({
      success: true,
      data: { image_url: imageUrl },
      warning: 'Image generated but storage failed'
    });
  }

  return res.status(500).json({
    success: false,
    error: error.message || 'Image generation failed'
  });
}
```

#### Step A2.6: Test E2E (1 hour)
```bash
# Test full workflow
curl -X POST http://localhost:3006/api/langgraph/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "image-generation",
    "parameters": {
      "theme": "Photosynthese",
      "style": "realistic",
      "educationalLevel": "Klasse 7"
    },
    "sessionId": "test-session-123"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "image_url": "https://...",
#     "library_id": "...",
#     "message_id": "..."
#   }
# }

# Verify in InstantDB:
# - library_materials table has new entry
# - messages table has new entry with metadata
```

**Deliverables**:
- ✅ Library storage works (library_materials entry created)
- ✅ Chat message storage works (messages entry with metadata)
- ✅ Response includes library_id and message_id
- ✅ Error handling robust
- ✅ No crashes, no data loss

---

## 📋 Workstream B: Frontend Home/Chat (Agent: react-frontend-developer)

### Phase B1: FR-1 - Chat Summary on Home (2 hours)

**File**: `teacher-assistant/frontend/src/pages/Home/Home.tsx`

#### Step B1.1: Import Hook (5 min)
```typescript
import { useChatSummary } from '../../hooks/useChatSummary';
```

#### Step B1.2: Verify Hook Exists (10 min)
```bash
# Check if hook exists
ls teacher-assistant/frontend/src/hooks/useChatSummary.ts

# If missing, create minimal version:
```

```typescript
// hooks/useChatSummary.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useChatSummary = (chatId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['chat-summary', chatId],
    queryFn: async () => {
      const response = await api.post('/chat/summary', { chatId });
      return response.data;
    },
    enabled: !!chatId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    summary: data?.summary || null,
    isLoading,
    error
  };
};
```

#### Step B1.3: Update Home Component (1 hour)
```typescript
// pages/Home/Home.tsx

// Find "Letzte Chats" section
const recentChatsSection = (
  <div className="recent-chats-section mb-6">
    <h2 className="text-lg font-semibold mb-3">Letzte Chats</h2>

    {recentChats.map(chat => {
      // ====== NEW: Use summary hook ======
      const { summary, isLoading } = useChatSummary(chat.id);

      return (
        <div
          key={chat.id}
          className="chat-item bg-white rounded-xl p-4 mb-3 cursor-pointer hover:shadow-md transition"
          onClick={() => handleChatClick(chat.id)}
        >
          {/* Chat Title */}
          <h3 className="font-semibold text-gray-900 mb-1">
            {chat.title || 'Untitled Chat'}
          </h3>

          {/* ====== NEW: Summary Display ====== */}
          <div className="chat-summary">
            {isLoading ? (
              <p className="text-sm text-gray-500 italic">Lädt Zusammenfassung...</p>
            ) : summary ? (
              <p className="text-sm text-gray-600 line-clamp-2">{summary}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">Keine Zusammenfassung verfügbar</p>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-400 mt-2">
            {formatDate(chat.created_at)}
          </p>
        </div>
      );
    })}
  </div>
);
```

#### Step B1.4: Styling (30 min)
```css
/* Add to App.css or inline styles */

.chat-summary {
  font-size: 14px;
  color: #6b7280; /* gray-600 */
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Max 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chat-summary.loading {
  font-style: italic;
  color: #9ca3af; /* gray-500 */
}
```

#### Step B1.5: Test (15 min)
```typescript
// Manual test:
// 1. Navigate to Home
// 2. Check "Letzte Chats" section
// 3. Verify summaries appear (not "Lädt..." forever)
// 4. Check console for errors
```

**Deliverables**:
- ✅ Summary displays for each chat
- ✅ Loading state shows while fetching
- ✅ Fallback text if no summary
- ✅ No console errors

---

### Phase B2: FR-2 - Auto-Submit Prompts (2 hours)

**File**: `teacher-assistant/frontend/src/components/PromptTile.tsx`

#### Step B2.1: Find Current onClick Handler (10 min)
```typescript
// Locate current implementation
// Likely in PromptTile.tsx or PromptTilesGrid.tsx

// BEFORE (buggy):
onClick={() => {
  // Probably doing something like:
  setCurrentChatSessionId(existingChatId); // Wrong!
  sendMessage(prompt); // Appends to existing
}}
```

#### Step B2.2: Implement Correct Flow (1 hour)
```typescript
// components/PromptTile.tsx

import { useChat } from '../hooks/useChat';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/instantdb';

interface PromptTileProps {
  title: string;
  description: string;
  prompt: string;
  icon: string;
  category: string;
}

export const PromptTile: React.FC<PromptTileProps> = ({
  title,
  description,
  prompt,
  icon,
  category
}) => {
  const { user } = useAuth();
  const { sendMessage } = useChat();
  const navigate = useNavigate();

  const handlePromptClick = async () => {
    try {
      // 1. Create new chat session
      const newChatId = db.id();

      await db.transact([
        db.tx.chat_sessions[newChatId].update({
          title: title, // Use prompt title as chat title
          user_id: user?.id,
          created_at: Date.now(),
          updated_at: Date.now(),
        })
      ]);

      console.log('[PromptTile] Created new chat:', newChatId);

      // 2. Navigate to Chat tab with new session
      setCurrentChatSessionId(newChatId);
      navigate('/chat');

      // 3. Auto-submit prompt (wait for navigation)
      setTimeout(async () => {
        await sendMessage(prompt, newChatId);
      }, 300);

    } catch (error) {
      console.error('[PromptTile] Failed to create chat:', error);
    }
  };

  return (
    <div
      className="prompt-tile cursor-pointer hover:shadow-lg transition"
      onClick={handlePromptClick}
    >
      {/* Tile content */}
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};
```

#### Step B2.3: Update App.tsx Navigation (30 min)
```typescript
// App.tsx - Ensure chat session state is shared

const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(null);

// Pass to PromptTile via context or props
<PromptTilesGrid
  onPromptClick={(prompt) => {
    // Handle in parent to ensure state sync
    createNewChatAndSubmit(prompt);
  }}
/>
```

#### Step B2.4: Test (20 min)
```typescript
// Manual test:
// 1. Go to Home
// 2. Click any Prompt Tile
// 3. VERIFY: Creates NEW chat (check chat history)
// 4. VERIFY: Prompt auto-submitted
// 5. VERIFY: No loading failures
// 6. Check console for errors
```

**Deliverables**:
- ✅ Click creates NEW chat (not append to existing)
- ✅ Prompt auto-submitted to new chat
- ✅ Navigation works (Home → Chat)
- ✅ No loading failures

---

### Phase B3: FR-4 - Image in Chat (2 hours)

**File**: `teacher-assistant/frontend/src/components/ChatView.tsx`

#### Step B3.1: Add Image Message Rendering (1 hour)
```typescript
// components/ChatView.tsx

const renderMessage = (message: Message) => {
  // ====== NEW: Check for image metadata ======
  if (message.metadata) {
    try {
      const metadata = typeof message.metadata === 'string'
        ? JSON.parse(message.metadata)
        : message.metadata;

      // If message contains image
      if (metadata.type === 'image' && metadata.image_url) {
        return (
          <div className="image-message-container mb-4">
            {/* Thumbnail */}
            <img
              src={metadata.image_url}
              alt={message.content}
              className="max-w-[200px] rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleImageClick(metadata.image_url)}
              onError={(e) => {
                console.error('Image failed to load:', metadata.image_url);
                e.currentTarget.src = '/placeholder-image.png'; // Fallback
              }}
            />

            {/* Caption */}
            <p className="text-sm text-gray-700 mt-2">
              {message.content}
            </p>

            {/* Revised Prompt (if available) */}
            {metadata.revised_prompt && (
              <p className="text-xs text-gray-500 mt-1 italic">
                DALL-E: "{metadata.revised_prompt}"
              </p>
            )}
          </div>
        );
      }
    } catch (error) {
      console.error('Failed to parse message metadata:', error);
      // Fall through to regular message rendering
    }
  }

  // Regular text message
  return (
    <div className="text-message">
      <p className="text-sm text-gray-800">{message.content}</p>
    </div>
  );
};
```

#### Step B3.2: Add Image Preview Modal (30 min)
```typescript
// components/ChatView.tsx

const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

const handleImageClick = (imageUrl: string) => {
  setPreviewImageUrl(imageUrl);
};

const closeImagePreview = () => {
  setPreviewImageUrl(null);
};

// Render modal
{previewImageUrl && (
  <div
    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
    onClick={closeImagePreview}
  >
    <div className="relative max-w-4xl max-h-screen p-4">
      <img
        src={previewImageUrl}
        alt="Preview"
        className="max-w-full max-h-full rounded-lg shadow-2xl"
      />
      <button
        className="absolute top-6 right-6 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"
        onClick={closeImagePreview}
      >
        ✕
      </button>
    </div>
  </div>
)}
```

#### Step B3.3: Test (30 min)
```typescript
// Manual test:
// 1. Generate image in chat
// 2. VERIFY: Image appears as thumbnail (~200px)
// 3. Click image → full-size preview opens
// 4. Click X or background → preview closes
// 5. No broken images (check network tab)
// 6. Console clean (no errors)
```

**Deliverables**:
- ✅ Image appears as thumbnail
- ✅ Click opens full-size preview
- ✅ Caption + revised prompt shown
- ✅ No broken images, no errors

---

### Phase B4: FR-5 - Image in Context (2 hours)

**File**: `teacher-assistant/backend/src/services/chatService.ts`

#### Step B4.1: Update buildChatContext (1 hour)
```typescript
// services/chatService.ts

const buildChatContext = (messages: Message[]): ChatMessage[] => {
  return messages.map(msg => {
    let content = msg.content;

    // ====== NEW: Include image metadata in context ======
    if (msg.metadata) {
      try {
        const metadata = typeof msg.metadata === 'string'
          ? JSON.parse(msg.metadata)
          : msg.metadata;

        if (metadata.type === 'image' && metadata.image_url) {
          // Include image reference for AI
          content = `[Generated Image: ${metadata.image_url}]\n${msg.content}`;

          // Include DALL-E's revised prompt (useful context)
          if (metadata.revised_prompt) {
            content += `\n(DALL-E Description: "${metadata.revised_prompt}")`;
          }
        }
      } catch (error) {
        console.error('Failed to parse metadata in context:', error);
      }
    }

    return {
      role: msg.role,
      content: content
    };
  });
};
```

#### Step B4.2: Frontend - Verify Context Sent (30 min)
```typescript
// frontend/src/hooks/useChat.ts

const sendMessage = async (userMessage: string, chatId?: string) => {
  // ... existing code ...

  // Build context including image messages
  const contextMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    metadata: msg.metadata // Include metadata
  }));

  // Send to backend
  const response = await api.post('/chat', {
    message: userMessage,
    sessionId: chatId,
    context: contextMessages // Backend will parse metadata
  });

  // ... handle response ...
};
```

#### Step B4.3: Test (30 min)
```typescript
// Manual test:
// 1. Generate image ("Erstelle Bild zur Photosynthese")
// 2. Send follow-up: "Was zeigt das Bild?"
// 3. VERIFY: AI response references the image
// 4. Check backend logs: context should include image URL
// 5. Console clean
```

**Deliverables**:
- ✅ AI receives image URL in context
- ✅ AI can reference previously generated images
- ✅ Revised prompt included
- ✅ No context-building errors

---

## 📋 Workstream C: Frontend Library/Profile (Agent: react-frontend-developer)

### Phase C1: FR-6 - Images in Library (2 hours)

**File**: `teacher-assistant/frontend/src/pages/Library/Library.tsx`

#### Step C1.1: Add "Bilder" Filter (30 min)
```typescript
// pages/Library/Library.tsx

const [selectedTab, setSelectedTab] = useState<'all' | 'artifacts' | 'chats' | 'images'>('all');

// Filter tabs
<div className="filter-tabs mb-4 flex gap-2">
  <button
    onClick={() => setSelectedTab('all')}
    className={`tab ${selectedTab === 'all' ? 'active' : ''}`}
  >
    Alle
  </button>
  <button
    onClick={() => setSelectedTab('artifacts')}
    className={`tab ${selectedTab === 'artifacts' ? 'active' : ''}`}
  >
    Materialien
  </button>
  <button
    onClick={() => setSelectedTab('chats')}
    className={`tab ${selectedTab === 'chats' ? 'active' : ''}`}
  >
    Chats
  </button>
  {/* ====== NEW: Bilder Tab ====== */}
  <button
    onClick={() => setSelectedTab('images')}
    className={`tab ${selectedTab === 'images' ? 'active' : ''}`}
  >
    Bilder
  </button>
</div>
```

#### Step C1.2: Query Image Materials (30 min)
```typescript
// Query library_materials where type='image'

const { data: libraryMaterials, isLoading } = useQuery({
  library_materials: {
    $: {
      where: {
        ...(selectedTab === 'images' ? { type: 'image' } : {}),
        ...(selectedTab === 'artifacts' ? { type: { $ne: 'image' } } : {})
      },
      order: {
        created_at: 'desc'
      }
    }
  }
});
```

#### Step C1.3: Render Image Cards (1 hour)
```typescript
// Render image cards

{libraryMaterials?.filter(m => selectedTab === 'all' || selectedTab === 'images').map(material => {
  if (material.type === 'image') {
    return (
      <div
        key={material.id}
        className="library-image-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer"
        onClick={() => handleImageClick(material)}
      >
        {/* Image Thumbnail */}
        <img
          src={material.url}
          alt={material.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-image.png';
          }}
        />

        {/* Card Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {material.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {material.description || 'Generiertes Bild'}
          </p>

          {/* Metadata (if available) */}
          {material.metadata && (() => {
            try {
              const meta = JSON.parse(material.metadata);
              return (
                <p className="text-xs text-gray-500 mt-2">
                  {meta.model} • {meta.size}
                </p>
              );
            } catch {
              return null;
            }
          })()}
        </div>
      </div>
    );
  }

  // Regular material card (non-image)
  return <MaterialCard key={material.id} material={material} />;
})}
```

**Deliverables**:
- ✅ "Bilder" filter shows only images
- ✅ Image cards display thumbnail + title + description
- ✅ Click opens preview
- ✅ No broken images

---

### Phase C2: FR-7 - Chat Summary in Library (1 hour)

**File**: `teacher-assistant/frontend/src/pages/Library/Library.tsx`

**Solution**: Reuse FR-1 implementation

```typescript
import { useChatSummary } from '../../hooks/useChatSummary';

// In chat rendering section
{libraryChats.map(chat => {
  const { summary, isLoading } = useChatSummary(chat.id);

  return (
    <div key={chat.id} className="library-chat-item">
      <h3>{chat.title}</h3>

      {/* ====== NEW: Summary ====== */}
      {isLoading ? (
        <p className="text-sm text-gray-500 italic">Zusammenfassung lädt...</p>
      ) : (
        <p className="text-sm text-gray-600 line-clamp-2">
          {summary || 'Keine Zusammenfassung'}
        </p>
      )}
    </div>
  );
})}
```

**Deliverables**: Same as FR-1

---

### Phase C3: FR-8,9 - Anrede + Bibliothek (1 hour)

#### Step C3.1: Search & Replace "ihr" → "du" (30 min)
```bash
cd teacher-assistant/frontend/src

# Find all instances
grep -rn "Ihr " . --include="*.tsx" --include="*.ts" > ihr-instances.txt

# Manual review each instance
# Common replacements:
# "Ihre" → "Deine"
# "Ihr" → "Dein"
# "Ihnen" → "Dir"
```

**Files likely affected**:
- `pages/Library/Library.tsx`
- `components/MaterialPreviewModal.tsx`
- `pages/Profile/ProfileView.tsx`

#### Step C3.2: Rename "Library" → "Bibliothek" (30 min)
```typescript
// App.tsx - Tab Bar
<IonTabButton tab="library">
  <IonIcon icon={libraryOutline} />
  <IonLabel>Bibliothek</IonLabel>
</IonTabButton>

// pages/Library/Library.tsx
<h1 className="text-2xl font-bold text-gray-900">Bibliothek</h1>

// Any other UI references (search for "Library")
```

**Deliverables**:
- ✅ No "Ihr/Ihre" in UI
- ✅ Consistent "du/dein"
- ✅ Tab shows "Bibliothek"
- ✅ Route still `/library` (no breaking changes)

---

### Phase C4: FR-11-13 - Profile Fixes (3 hours)

#### Step C4.1: FR-11 - Verify Hook (30 min)

**File**: `teacher-assistant/frontend/src/hooks/useProfileCharacteristics.ts`

Verify hook calls correct endpoint:
```typescript
const addCharacteristic = async (characteristic: string) => {
  const response = await api.post('/profile/characteristics/add', {
    userId: user?.id,
    characteristic
  });

  if (!response.ok) {
    throw new Error('Failed to add characteristic');
  }

  refetch(); // Refresh list
};
```

**Test**: After backend route enabled, this should work (no 404)

#### Step C4.2: FR-12 - Button Position (1 hour)

**File**: `teacher-assistant/frontend/src/components/ProfileView.tsx`

**Current Problem**: Button at bottom (requires scroll)

**Solution**: Move button OR make sticky

```typescript
// OPTION A: Move button ABOVE "Allgemeine Informationen"

<div className="profile-characteristics-section px-4">
  <h2 className="text-lg font-semibold mb-3">Gelernte Merkmale</h2>

  {/* Tag chips */}
  <div className="flex flex-wrap gap-2 mb-4">
    {characteristics.map(char => <TagChip {...char} />)}
  </div>

  {/* ====== MOVE BUTTON HERE (not at bottom) ====== */}
  <button
    onClick={handleAddCharacteristic}
    className="w-full mt-4 bg-primary-500 text-white font-medium py-3 rounded-xl hover:bg-primary-600 transition"
  >
    Merkmal hinzufügen +
  </button>
</div>

{/* General Info - BELOW button */}
<div className="general-info-section px-4 mt-6">
  <h2>Allgemeine Informationen</h2>
  {/* ... */}
</div>

// OPTION B: Make button sticky
<button
  className="sticky bottom-20 w-full bg-primary-500 text-white py-3 rounded-xl z-10"
>
  Merkmal hinzufügen +
</button>
```

**Deliverables**:
- ✅ Button visible without scrolling
- ✅ Button always accessible
- ✅ Mobile + Desktop tested

#### Step C4.3: FR-13 - Auto-Extraction Trigger (1.5 hours)

**File**: `teacher-assistant/frontend/src/components/ChatView.tsx`

```typescript
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export const ChatView = () => {
  const { user } = useAuth();
  const { messages, currentChatId } = useChat();
  const hasExtractedRef = useRef(false);

  // ====== NEW: Trigger extraction on unmount ======
  useEffect(() => {
    return () => {
      // Cleanup: extract when leaving chat
      if (!hasExtractedRef.current && messages.length >= 3) {
        extractProfile();
      }
    };
  }, []); // Empty deps - only on unmount

  const extractProfile = async () => {
    if (hasExtractedRef.current || !user?.id) return;
    hasExtractedRef.current = true;

    try {
      console.log('[ChatView] Triggering profile extraction...');

      await api.post('/profile/extract', {
        userId: user.id,
        messages: messages.slice(0, 10) // First 10 for context
      });

      console.log('[ChatView] Profile extraction complete');
    } catch (error) {
      console.error('[ChatView] Profile extraction failed:', error);
    }
  };

  // ... rest of component
};
```

**Deliverables**:
- ✅ After 3+ message chat, extraction triggers on tab switch
- ✅ New characteristics increment count
- ✅ No errors
- ✅ Extraction async (non-blocking)

---

## 📋 Workstream D: QA (Agent: qa-integration-reviewer)

### Phase D1: Write Playwright Tests (3 hours)

See spec.md for complete test suite.

**Files to Create**:
- `.specify/specs/comprehensive-p0-fixes/tests/complete.spec.ts`
- `.specify/specs/comprehensive-p0-fixes/tests/playwright.config.ts`

### Phase D2: Continuous Testing (5 hours)

**Process**:
1. As code lands from Workstreams A/B/C, run relevant tests
2. Report failures immediately to developers
3. Iterate until all tests GREEN

### Phase D3: Manual QA (1 hour)

Use checklist from spec.md

---

## 🔄 Integration & Iteration

### Day 2: QA Loop

```
Hour 1-2: Full Test Suite
├─ Run all Playwright tests
├─ Collect screenshots
└─ Log failures

Hour 3-4: Fix Iteration 1
├─ Analyze failures
├─ Developers fix issues
└─ Re-run failed tests

Hour 5-6: Fix Iteration 2
├─ Analyze remaining failures
├─ Fix critical issues
└─ Re-run full suite

Hour 7-8: Final QA
├─ Manual checklist
├─ Network/console verification
└─ Approval sign-off
```

---

## 📊 Success Metrics

- ✅ All 15 Playwright tests GREEN
- ✅ Manual QA checklist 100% complete
- ✅ Zero 404 errors
- ✅ Zero console errors
- ✅ Zero TypeScript errors
- ✅ Backend stable (no crashes)

---

**Plan Status**: ✅ Ready for Execution
**Next Step**: Create `tasks.md` with actionable task breakdown
