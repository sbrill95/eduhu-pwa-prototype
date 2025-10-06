# Comprehensive P0 Fixes - Complete Specification

**Created**: 2025-10-05
**Priority**: P0 - CRITICAL
**Status**: Specification Phase
**Estimated Duration**: 2-3 days (with parallelization)

---

## 🎯 Executive Summary

Nach User-Feedback wurden **13 kritische P0-Issues** identifiziert, die in **3 parallelen Workstreams** behoben werden müssen. **Keine Quick-Fixes** - jede Änderung wird vollständig geplant, implementiert und durch automatisierte QA mit Playwright verifiziert.

**Iteration Strategy**: QA-Loop läuft kontinuierlich bis alle Fehler behoben sind (Screenshots + Console Log Monitoring).

---

## 📊 Problem Analysis

### User-Reported Issues (Kategorisiert)

#### **Category A: Home View Issues**
1. ❌ **Chat Summary fehlt** - Letzte Chats haben keine Zusammenfassung (wie Library)
2. ❌ **Auto-Submit Prompt-Vorschläge** - Wird in bestehenden Chat eingefügt statt neuen zu erstellen, laden schlägt fehl

#### **Category B: Chat View Issues**
3. ❌ **Bildgenerierung E2E** - Komplett nicht funktional
4. ❌ **Bild im Chat anzeigen** - Kein Thumbnail nach Generierung
5. ❌ **Bild im Chatverlauf** - Generierte Bilder nicht in Context berücksichtigt

#### **Category C: Library View Issues**
6. ❌ **Bilder nicht sichtbar** - Generierte Bilder erscheinen nicht in Library
7. ❌ **Chat-Zusammenfassung fehlt** - Keine Summary bei Library-Chats
8. ❌ **Falsche Anrede** - "Ihr" statt "du"
9. ❌ **Deutscher Name fehlt** - "Library" statt "Bibliothek"

#### **Category D: Profile View Issues**
10. ❌ **Profile Route disabled** - Backend route commented out (404 errors)
11. ❌ **Chat-Summary Route disabled** - Backend route commented out
12. ❌ **Merkmale speichern** - Hinzufügen-Button funktioniert nicht (404)
13. ❌ **Button-Position** - Hinzufügen-Button zu weit unten (nicht sichtbar)
14. ❌ **Auto-Extraktion** - Funktionierte mal, jetzt nicht mehr

---

## 🎯 Goals & Success Criteria

### Primary Goals
1. **100% Feature Completion** - Alle 14 Issues behoben
2. **Zero Regressions** - Keine bestehenden Features kaputt machen
3. **Automated QA** - Playwright E2E Tests für jeden Fix
4. **Clean Architecture** - Keine Quick-Fixes, saubere Integration

### Success Criteria
- ✅ Alle 14 Issues marked as RESOLVED
- ✅ Playwright Tests: 100% GREEN
- ✅ Manual QA: Zero console errors
- ✅ Screenshots: Pixel-perfect vs. expected behavior
- ✅ No 404 errors in network tab
- ✅ No TypeScript errors in build

---

## 🏗️ Architecture & Dependencies

### System Components Affected

```
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  Routes (3 changes)                                          │
│  ├─ routes/index.ts                                          │
│  │  └─ ENABLE: chatSummaryRouter (line 9)                   │
│  │  └─ ENABLE: profileRouter (line 10)                      │
│  ├─ routes/chat-summary.ts (verify TypeScript)              │
│  └─ routes/profile.ts (verify TypeScript)                   │
│                                                              │
│  Image Generation (1 change)                                 │
│  └─ routes/imageGeneration.ts                                │
│     └─ ADD: InstantDB integration (library_materials + messages)│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                               │
├─────────────────────────────────────────────────────────────┤
│  Home View (2 changes)                                       │
│  ├─ pages/Home/Home.tsx                                      │
│  │  └─ ADD: Chat summary display for "Letzte Chats"         │
│  │  └─ FIX: Auto-submit creates NEW chat (not append)       │
│  └─ hooks/useChatSummary.ts (verify exists)                 │
│                                                              │
│  Chat View (3 changes)                                       │
│  ├─ components/ChatView.tsx                                  │
│  │  └─ ADD: Image thumbnail display for messages            │
│  │  └─ ADD: Image in context (metadata parsing)             │
│  └─ components/AgentResultView.tsx                           │
│     └─ VERIFY: Image preview modal works                    │
│                                                              │
│  Library View (4 changes)                                    │
│  ├─ pages/Library/Library.tsx                                │
│  │  └─ ADD: "Bilder" filter displays generated images       │
│  │  └─ ADD: Chat summary for each chat item                 │
│  │  └─ FIX: "Ihr" → "du" (search & replace)                 │
│  │  └─ FIX: "Library" → "Bibliothek" (UI labels)            │
│  └─ Tab Bar Labels                                           │
│     └─ App.tsx: "Library" → "Bibliothek"                    │
│                                                              │
│  Profile View (3 changes)                                    │
│  ├─ components/ProfileView.tsx                               │
│  │  └─ FIX: Hinzufügen button position (sticky/visible)     │
│  ├─ hooks/useProfileCharacteristics.ts                       │
│  │  └─ VERIFY: Calls /api/profile/characteristics/add       │
│  └─ components/ChatView.tsx                                  │
│     └─ ADD: Trigger profile extraction after chat ends      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Detailed Requirements

### FR-1: Home View - Chat Summary

**Problem**: Letzte Chats zeigen keine Zusammenfassung

**Solution**:
```typescript
// pages/Home/Home.tsx

import { useChatSummary } from '../hooks/useChatSummary';

// For each chat in "Letzte Chats"
{recentChats.map(chat => {
  const { summary, isLoading } = useChatSummary(chat.id);

  return (
    <div className="chat-item">
      <h3>{chat.title}</h3>
      {isLoading ? (
        <p className="text-sm text-gray-500">Lädt Zusammenfassung...</p>
      ) : (
        <p className="text-sm text-gray-600">{summary || 'Keine Zusammenfassung'}</p>
      )}
    </div>
  );
})}
```

**Dependencies**:
- Backend: `/api/chat/summary` route enabled
- Frontend: `useChatSummary.ts` hook exists

**Acceptance Criteria**:
- ✅ Summary displays for each chat
- ✅ Loading state shows while fetching
- ✅ Fallback text if no summary available
- ✅ No console errors

---

### FR-2: Home View - Auto-Submit Prompt-Vorschläge

**Problem**: Klick auf Prompt-Tile → fügt in bestehenden Chat ein, sollte aber neuen Chat erstellen

**Current Behavior**:
```typescript
// PromptTile.tsx - WRONG
onClick={() => {
  navigateToChat(); // Goes to current chat
  appendMessage(prompt); // Appends to existing
}}
```

**Expected Behavior**:
```typescript
// PromptTile.tsx - CORRECT
onClick={async () => {
  // 1. Create new chat session
  const newChatId = await createNewChatSession();

  // 2. Navigate to new chat
  setCurrentChatSessionId(newChatId);
  navigateToTab('chat');

  // 3. Auto-submit prompt
  await sendMessage(prompt, newChatId);
}}
```

**Acceptance Criteria**:
- ✅ Click on Prompt Tile creates NEW chat
- ✅ Prompt is auto-submitted to new chat
- ✅ Navigation happens correctly (Home → Chat)
- ✅ No loading failures
- ✅ Chat history shows new session

---

### FR-3: Chat View - Bildgenerierung E2E (InstantDB Integration)

**Problem**: Bild wird generiert, aber nicht in Library oder Chat gespeichert

**Current State**:
```typescript
// routes/imageGeneration.ts - INCOMPLETE
router.post('/agents/execute', async (req, res) => {
  // ... DALL-E generation ...

  return res.json({
    success: true,
    data: {
      image_url: imageUrl,
      // Missing: library_id, message_id
    }
  });
});
```

**Required Changes**:
```typescript
// routes/imageGeneration.ts - COMPLETE
import { db } from '../services/instantdbService';

router.post('/agents/execute', async (req, res) => {
  const { agentType, parameters, sessionId } = req.body;

  // 1. Generate image with DALL-E
  const response = await openai.images.generate({...});
  const imageUrl = response.data?.[0]?.url;
  const revisedPrompt = response.data?.[0]?.revised_prompt;

  // 2. Save to library_materials
  const libraryMaterial = await db.tx.library_materials[db.id()].update({
    title: parameters.theme,
    type: 'image',
    url: imageUrl,
    description: revisedPrompt,
    created_at: Date.now(),
    metadata: JSON.stringify({
      dalle_title: parameters.theme,
      revised_prompt: revisedPrompt,
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',
    })
  });

  const libraryId = libraryMaterial.id;

  // 3. Save to chat messages (if sessionId provided)
  let messageId = null;
  if (sessionId) {
    const message = await db.tx.messages[db.id()].update({
      content: `Bild generiert: ${parameters.theme}`,
      role: 'assistant',
      chat_session_id: sessionId,
      created_at: Date.now(),
      metadata: JSON.stringify({
        type: 'image',
        image_url: imageUrl,
        library_id: libraryId,
        revised_prompt: revisedPrompt,
      })
    });
    messageId = message.id;
  }

  // 4. Return complete response
  return res.json({
    success: true,
    data: {
      executionId: `exec-${Date.now()}`,
      image_url: imageUrl,
      library_id: libraryId,
      message_id: messageId,
      revised_prompt: revisedPrompt,
      title: parameters.theme,
    }
  });
});
```

**Acceptance Criteria**:
- ✅ Image saved to `library_materials` table
- ✅ Image saved to `messages` table with metadata
- ✅ Response includes `library_id` and `message_id`
- ✅ No 500 errors, no TypeScript errors

---

### FR-4: Chat View - Bild im Chat anzeigen

**Problem**: Generierte Bilder erscheinen nicht im Chat

**Solution**:
```typescript
// components/ChatView.tsx

const renderMessage = (message: Message) => {
  // Parse metadata for image messages
  if (message.metadata) {
    try {
      const metadata = typeof message.metadata === 'string'
        ? JSON.parse(message.metadata)
        : message.metadata;

      if (metadata.type === 'image' && metadata.image_url) {
        return (
          <div className="image-message-container mb-3">
            {/* Image Thumbnail */}
            <img
              src={metadata.image_url}
              alt={message.content}
              className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openImagePreview(metadata.image_url)}
            />

            {/* Caption */}
            <p className="text-sm text-gray-600 mt-2">{message.content}</p>

            {/* Revised Prompt (if available) */}
            {metadata.revised_prompt && (
              <p className="text-xs text-gray-500 mt-1 italic">
                "{metadata.revised_prompt}"
              </p>
            )}
          </div>
        );
      }
    } catch (e) {
      console.error('Failed to parse message metadata:', e);
    }
  }

  // Regular text message
  return <p className="text-sm">{message.content}</p>;
};
```

**Acceptance Criteria**:
- ✅ Image appears as thumbnail (max 200px)
- ✅ Click opens full-size preview modal
- ✅ Caption shows below image
- ✅ Revised prompt shown (if available)
- ✅ No broken images, no console errors

---

### FR-5: Chat View - Bild im Chatverlauf berücksichtigen

**Problem**: Generierte Bilder nicht in Chat-Context für AI

**Solution**:
```typescript
// services/chatService.ts

const buildChatContext = (messages: Message[]): ChatMessage[] => {
  return messages.map(msg => {
    // Check if message contains image
    let content = msg.content;

    if (msg.metadata) {
      try {
        const metadata = typeof msg.metadata === 'string'
          ? JSON.parse(msg.metadata)
          : msg.metadata;

        if (metadata.type === 'image' && metadata.image_url) {
          // Include image reference in context
          content = `[Generiertes Bild: ${metadata.image_url}]\n${msg.content}`;

          // If revised_prompt exists, include it
          if (metadata.revised_prompt) {
            content += `\n(DALL-E Prompt: ${metadata.revised_prompt})`;
          }
        }
      } catch (e) {
        console.error('Failed to parse metadata in context:', e);
      }
    }

    return {
      role: msg.role,
      content: content
    };
  });
};
```

**Acceptance Criteria**:
- ✅ AI receives image URL in context
- ✅ AI can reference previously generated images
- ✅ Revised prompt included in context
- ✅ No context-building errors

---

### FR-6: Library View - Bilder anzeigen

**Problem**: Generierte Bilder erscheinen nicht in Library → Bilder Filter

**Solution**:
```typescript
// pages/Library/Library.tsx

const { data: libraryMaterials } = useQuery({
  library_materials: {
    $: {
      where: {
        // Filter by type if "Bilder" tab selected
        ...(selectedTab === 'images' ? { type: 'image' } : {})
      },
      order: {
        created_at: 'desc'
      }
    }
  }
});

// Render image cards
{libraryMaterials.map(material => {
  if (material.type === 'image') {
    return (
      <div key={material.id} className="library-image-card">
        <img
          src={material.url}
          alt={material.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <h3 className="font-semibold">{material.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {material.description}
          </p>
        </div>
      </div>
    );
  }

  // Regular material card
  return <MaterialCard key={material.id} material={material} />;
})}
```

**Acceptance Criteria**:
- ✅ "Bilder" filter shows only type='image'
- ✅ Image cards display thumbnail + title + description
- ✅ Click opens preview modal
- ✅ No broken images

---

### FR-7: Library View - Chat-Zusammenfassung

**Problem**: Library-Chats haben keine Zusammenfassung

**Solution**: Same as FR-1 (reuse `useChatSummary` hook)

```typescript
// pages/Library/Library.tsx

import { useChatSummary } from '../../hooks/useChatSummary';

// For each chat in library
{chats.map(chat => {
  const { summary, isLoading } = useChatSummary(chat.id);

  return (
    <div className="library-chat-item">
      <h3>{chat.title}</h3>
      {isLoading ? (
        <p className="text-sm text-gray-500">Zusammenfassung lädt...</p>
      ) : (
        <p className="text-sm text-gray-600">{summary || 'Keine Zusammenfassung'}</p>
      )}
    </div>
  );
})}
```

**Acceptance Criteria**: Same as FR-1

---

### FR-8: Library View - Anrede ändern (ihr → du)

**Problem**: Formale Anrede "Ihr" statt informales "du"

**Solution**:
```bash
# Search & replace in all frontend files
cd teacher-assistant/frontend/src

# Find all instances
grep -r "Ihr " . --include="*.tsx" --include="*.ts"

# Replace with "Dein"/"Deine" (context-dependent)
# Manual review each occurrence
```

**Files likely affected**:
- `pages/Library/Library.tsx`
- `components/MaterialPreviewModal.tsx`
- `pages/Profile/ProfileView.tsx`

**Acceptance Criteria**:
- ✅ No "Ihr/Ihre" anywhere in UI
- ✅ Consistent "du/dein/deine" throughout
- ✅ Manual QA review

---

### FR-9: Library View - Umbenennen (Library → Bibliothek)

**Problem**: Englischer Name statt Deutsch

**Solution**:
```typescript
// App.tsx - Tab Bar
<IonTabButton tab="library">
  <IonIcon icon={libraryOutline} />
  <IonLabel>Bibliothek</IonLabel> {/* Changed from "Library" */}
</IonTabButton>

// pages/Library/Library.tsx - Page Title
<h1 className="text-2xl font-bold">Bibliothek</h1> {/* Changed from "Library" */}

// Any other UI references
```

**Acceptance Criteria**:
- ✅ Tab Bar shows "Bibliothek"
- ✅ Page title shows "Bibliothek"
- ✅ No English "Library" in UI
- ✅ Route still `/library` (no breaking changes)

---

### FR-10: Backend - Enable Routes

**Problem**: Profile + Chat-Summary routes disabled (commented out)

**Solution**:
```typescript
// teacher-assistant/backend/src/routes/index.ts

// Line 9-10: UNCOMMENT
import chatSummaryRouter from './chat-summary';
import profileRouter from './profile';

// Line 32-33: UNCOMMENT
router.use('/chat', chatSummaryRouter);
router.use('/profile', profileRouter);
```

**Pre-Enable Checklist**:
1. ✅ Check for TypeScript errors in `chat-summary.ts`
2. ✅ Check for TypeScript errors in `profile.ts`
3. ✅ Verify no conflicting routes
4. ✅ Test endpoints with curl after enabling

**Acceptance Criteria**:
- ✅ `/api/chat/summary` returns 200 (not 404)
- ✅ `/api/profile/characteristics` returns 200
- ✅ `/api/profile/characteristics/add` returns 200
- ✅ No TypeScript compilation errors
- ✅ Backend server starts without errors

---

### FR-11: Profile View - Merkmale speichern

**Problem**: Hinzufügen-Button calls `/api/profile/characteristics/add` → 404

**Root Cause**: Backend route disabled (see FR-10)

**Solution**: Enable route (FR-10) + verify frontend hook

```typescript
// hooks/useProfileCharacteristics.ts - VERIFY

export const useProfileCharacteristics = () => {
  const { user } = useAuth();

  const addCharacteristic = async (characteristic: string) => {
    // This should work after FR-10
    const response = await api.post('/profile/characteristics/add', {
      userId: user?.id,
      characteristic
    });

    if (!response.ok) {
      throw new Error('Failed to add characteristic');
    }

    // Refetch to update UI
    refetch();
  };

  return { addCharacteristic, ... };
};
```

**Acceptance Criteria**:
- ✅ Click "Hinzufügen" → no 404 error
- ✅ Characteristic appears in list immediately
- ✅ Characteristic saved to InstantDB
- ✅ No console errors

---

### FR-12: Profile View - Button-Position

**Problem**: Hinzufügen-Button zu weit unten (nicht sichtbar ohne Scroll)

**Solution**:
```typescript
// components/ProfileView.tsx

// Move button ABOVE "Allgemeine Informationen" section
// OR make it sticky at bottom

<div className="profile-characteristics-section">
  {/* Tag chips */}
  <div className="flex flex-wrap gap-2 mb-4">
    {characteristics.map(char => <TagChip key={char.id} {...char} />)}
  </div>

  {/* Hinzufügen Button - MOVE HERE (not at bottom) */}
  <button
    onClick={handleAddCharacteristic}
    className="w-full mt-4 bg-primary-500 text-white py-3 rounded-xl sticky bottom-20 z-10"
  >
    Merkmal hinzufügen +
  </button>
</div>

{/* General Info Section - BELOW button */}
<div className="general-info-section mt-6">
  <h2>Allgemeine Informationen</h2>
  ...
</div>
```

**Acceptance Criteria**:
- ✅ Button visible without scrolling
- ✅ Button always accessible (sticky if needed)
- ✅ UI feels intuitive
- ✅ Mobile + Desktop tested

---

### FR-13: Profile View - Auto-Extraktion

**Problem**: Auto-Extraktion funktionierte mal, jetzt nicht mehr

**Root Cause Analysis Needed**:
1. Backend route disabled? (FR-10 fixes this)
2. Frontend trigger missing?
3. Extraction service broken?

**Solution**:
```typescript
// components/ChatView.tsx - ADD extraction trigger

import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export const ChatView = () => {
  const { user } = useAuth();
  const { messages, currentChatId } = useChat();
  const hasExtractedRef = useRef(false);

  // Trigger extraction when user navigates away from chat
  useEffect(() => {
    return () => {
      // Cleanup: Extract profile when leaving chat
      if (!hasExtractedRef.current && messages.length >= 3) {
        extractProfileCharacteristics();
      }
    };
  }, []);

  const extractProfileCharacteristics = async () => {
    if (hasExtractedRef.current || !user?.id) return;
    hasExtractedRef.current = true;

    try {
      await api.post('/profile/extract', {
        userId: user.id,
        messages: messages.slice(0, 10) // Send first 10 for context
      });
    } catch (error) {
      console.error('Profile extraction failed:', error);
    }
  };

  // ... rest of component
};
```

**Acceptance Criteria**:
- ✅ After 3+ message chat, profile extraction triggers
- ✅ New characteristics appear in profile (count incremented)
- ✅ No errors in console
- ✅ Extraction happens async (non-blocking)

---

## 🧪 QA Strategy - Comprehensive Testing

### Phase 1: Automated E2E Tests (Playwright)

**Test Suite**: `.specify/specs/comprehensive-p0-fixes/tests/complete.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { testAuth } from '../../../teacher-assistant/frontend/src/lib/test-auth';

test.describe('Comprehensive P0 Fixes - E2E Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Bypass auth
    await page.goto('http://localhost:5175');
    await page.evaluate(() => {
      localStorage.setItem('test-auth-bypass', 'true');
      localStorage.setItem('test-user-id', 'test-user-123');
    });
    await page.reload();
  });

  // ========================================
  // FR-1: Home - Chat Summary
  // ========================================
  test('FR-1: Home shows chat summary for recent chats', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-home"]').click();

    // Wait for "Letzte Chats" section
    const chatsSection = page.locator('.recent-chats-section');
    await expect(chatsSection).toBeVisible();

    // Verify at least one chat has summary
    const firstChat = chatsSection.locator('.chat-item').first();
    const summary = firstChat.locator('.chat-summary');

    await expect(summary).toBeVisible();
    await expect(summary).not.toHaveText('');

    // Screenshot
    await page.screenshot({ path: 'qa-screenshots/fr-1-home-chat-summary.png', fullPage: true });

    // Console check
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    const errors = consoleLogs.filter(log => log.includes('error') || log.includes('Error'));
    expect(errors).toHaveLength(0);
  });

  // ========================================
  // FR-2: Home - Auto-Submit Prompt
  // ========================================
  test('FR-2: Prompt tile creates new chat and auto-submits', async ({ page }) => {
    await page.goto('http://localhost:5175');

    // Click first prompt tile
    const promptTile = page.locator('.prompt-tile').first();
    const promptText = await promptTile.locator('h3').textContent();
    await promptTile.click();

    // Should navigate to Chat tab
    await expect(page.locator('[data-testid="tab-chat"]')).toHaveAttribute('aria-selected', 'true');

    // Verify new chat created (not appended to existing)
    const chatMessages = page.locator('.chat-message');
    await expect(chatMessages).toHaveCount(1); // Only the auto-submitted message

    // Verify prompt was sent
    const firstMessage = chatMessages.first();
    await expect(firstMessage).toContainText(promptText || '');

    // Screenshot
    await page.screenshot({ path: 'qa-screenshots/fr-2-auto-submit-prompt.png', fullPage: true });
  });

  // ========================================
  // FR-3-6: Image Generation E2E
  // ========================================
  test('FR-3-6: Image generation E2E workflow', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-chat"]').click();

    // 1. Request image generation
    const input = page.locator('textarea[placeholder*="Nachricht"]');
    await input.fill('Erstelle ein Bild zum Thema Photosynthese');
    await page.keyboard.press('Enter');

    // 2. Wait for agent confirmation
    const confirmButton = page.locator('button:has-text("Bild-Generierung starten")');
    await expect(confirmButton).toBeVisible({ timeout: 10000 });
    await confirmButton.click();

    // 3. Wait for image generation (max 30s)
    const imageMessage = page.locator('.image-message-container img');
    await expect(imageMessage).toBeVisible({ timeout: 30000 });

    // FR-4: Verify image appears in chat
    await expect(imageMessage).toHaveAttribute('src', /https:\/\//);
    await page.screenshot({ path: 'qa-screenshots/fr-4-image-in-chat.png', fullPage: true });

    // FR-5: Verify image in context (send follow-up message)
    await input.fill('Was zeigt das Bild?');
    await page.keyboard.press('Enter');

    // Assistant should reference the image
    const response = page.locator('.chat-message.assistant').last();
    await expect(response).toBeVisible({ timeout: 15000 });
    // (Cannot verify AI response content, but check it exists)

    // FR-6: Verify image in Library
    await page.locator('[data-testid="tab-library"]').click();
    await page.locator('button:has-text("Bilder")').click();

    const libraryImage = page.locator('.library-image-card img').first();
    await expect(libraryImage).toBeVisible();
    await expect(libraryImage).toHaveAttribute('src', /https:\/\//);

    await page.screenshot({ path: 'qa-screenshots/fr-6-image-in-library.png', fullPage: true });
  });

  // ========================================
  // FR-7: Library - Chat Summary
  // ========================================
  test('FR-7: Library shows chat summaries', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-library"]').click();

    // Navigate to Chats section
    await page.locator('button:has-text("Chats")').click();

    const chatItem = page.locator('.library-chat-item').first();
    const summary = chatItem.locator('.chat-summary');

    await expect(summary).toBeVisible();
    await expect(summary).not.toHaveText('');

    await page.screenshot({ path: 'qa-screenshots/fr-7-library-chat-summary.png', fullPage: true });
  });

  // ========================================
  // FR-8: Library - Anrede (ihr → du)
  // ========================================
  test('FR-8: Library uses informal address (du)', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-library"]').click();

    const pageText = await page.locator('body').textContent();

    // Should NOT contain formal "Ihr/Ihre"
    expect(pageText?.toLowerCase()).not.toContain('ihr ');
    expect(pageText?.toLowerCase()).not.toContain('ihre ');

    // Should contain informal "du/dein/deine"
    expect(pageText?.toLowerCase()).toMatch(/(du|dein|deine)/);

    await page.screenshot({ path: 'qa-screenshots/fr-8-library-informal-address.png', fullPage: true });
  });

  // ========================================
  // FR-9: Library - Name (Library → Bibliothek)
  // ========================================
  test('FR-9: Tab bar shows "Bibliothek" not "Library"', async ({ page }) => {
    await page.goto('http://localhost:5175');

    const tabBar = page.locator('ion-tab-bar');
    const libraryTab = tabBar.locator('ion-tab-button[tab="library"]');

    await expect(libraryTab).toContainText('Bibliothek');
    await expect(libraryTab).not.toContainText('Library');

    await page.screenshot({ path: 'qa-screenshots/fr-9-bibliothek-tab.png', fullPage: true });
  });

  // ========================================
  // FR-10-11: Profile - Merkmale speichern
  // ========================================
  test('FR-10-11: Profile characteristics can be added', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-profile"]').click();

    // Click "Merkmal hinzufügen +" button
    const addButton = page.locator('button:has-text("Merkmal hinzufügen")');
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Fill input modal
    const input = page.locator('input[placeholder*="Projektbasiertes Lernen"]');
    await expect(input).toBeVisible();
    await input.fill('Differenzierung');

    // Click "Hinzufügen" in modal
    const confirmButton = page.locator('button:has-text("Hinzufügen")').last();
    await confirmButton.click();

    // Verify tag appears
    const newTag = page.locator('.profile-tag:has-text("Differenzierung")');
    await expect(newTag).toBeVisible({ timeout: 5000 });

    // Check network: should NOT be 404
    const response = await page.waitForResponse(resp =>
      resp.url().includes('/api/profile/characteristics/add')
    );
    expect(response.status()).toBe(200);

    await page.screenshot({ path: 'qa-screenshots/fr-11-profile-add-characteristic.png', fullPage: true });
  });

  // ========================================
  // FR-12: Profile - Button Position
  // ========================================
  test('FR-12: Profile "Hinzufügen" button is visible', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-profile"]').click();

    const addButton = page.locator('button:has-text("Merkmal hinzufügen")');

    // Check button is in viewport (without scrolling)
    const isVisible = await addButton.isVisible();
    expect(isVisible).toBe(true);

    // Check button is not cut off
    const boundingBox = await addButton.boundingBox();
    expect(boundingBox).not.toBeNull();

    // Viewport height check (button should be above fold)
    const viewportHeight = page.viewportSize()?.height || 0;
    expect(boundingBox!.y + boundingBox!.height).toBeLessThan(viewportHeight);

    await page.screenshot({ path: 'qa-screenshots/fr-12-profile-button-visible.png', fullPage: false });
  });

  // ========================================
  // FR-13: Profile - Auto-Extraction
  // ========================================
  test('FR-13: Profile auto-extraction after chat', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-chat"]').click();

    // Send 3+ messages mentioning "Mathematik"
    const input = page.locator('textarea[placeholder*="Nachricht"]');

    await input.fill('Ich unterrichte Mathematik in Klasse 7');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await input.fill('Kannst du mir ein Arbeitsblatt für Mathematik erstellen?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await input.fill('Die Mathematik-Stunde ist morgen');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Navigate away (triggers extraction)
    await page.locator('[data-testid="tab-profile"]').click();
    await page.waitForTimeout(3000); // Wait for extraction to complete

    // Check if "Mathematik" appears in profile
    const profileTags = page.locator('.profile-tag');
    const mathematikTag = profileTags.filter({ hasText: 'Mathematik' });

    // Should appear after count >= 3
    await expect(mathematikTag).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'qa-screenshots/fr-13-profile-auto-extraction.png', fullPage: true });
  });

  // ========================================
  // Network Tab - No 404 Errors
  // ========================================
  test('QA: No 404 errors in network tab', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', response => {
      if (response.status() === 404) {
        failedRequests.push(response.url());
      }
    });

    // Navigate through all tabs
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-home"]').click();
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="tab-chat"]').click();
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="tab-library"]').click();
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="tab-profile"]').click();
    await page.waitForTimeout(2000);

    // Verify no 404s
    expect(failedRequests).toHaveLength(0);

    if (failedRequests.length > 0) {
      console.error('404 Errors found:', failedRequests);
    }
  });

  // ========================================
  // Console - No Errors
  // ========================================
  test('QA: No console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through all tabs
    await page.goto('http://localhost:5175');
    await page.locator('[data-testid="tab-home"]').click();
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="tab-chat"]').click();
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="tab-library"]').click();
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="tab-profile"]').click();
    await page.waitForTimeout(2000);

    // Verify no errors
    expect(consoleErrors).toHaveLength(0);

    if (consoleErrors.length > 0) {
      console.error('Console errors found:', consoleErrors);
    }
  });
});
```

---

### Phase 2: Manual QA Checklist

**File**: `.specify/specs/comprehensive-p0-fixes/MANUAL-QA-CHECKLIST.md`

```markdown
# Manual QA Checklist - Comprehensive P0 Fixes

**Tester**: _________
**Date**: _________
**Build**: _________

---

## Pre-Testing Setup

- [ ] Backend server running (`npm run dev` in teacher-assistant/backend)
- [ ] Frontend server running (`npm run dev` in teacher-assistant/frontend)
- [ ] Test auth bypass enabled (`localStorage.setItem('test-auth-bypass', 'true')`)
- [ ] Browser console open (F12 → Console tab)
- [ ] Browser network tab open (F12 → Network tab)

---

## FR-1: Home - Chat Summary

- [ ] Navigate to Home tab
- [ ] "Letzte Chats" section visible
- [ ] Each chat shows summary text (not "Lädt..." or empty)
- [ ] Summary text is meaningful (not error message)
- [ ] No console errors
- [ ] Screenshot saved: `manual-qa/fr-1-home-chat-summary.png`

---

## FR-2: Home - Auto-Submit Prompt

- [ ] Navigate to Home tab
- [ ] Click first Prompt Tile
- [ ] **VERIFY**: Navigates to Chat tab ✅
- [ ] **VERIFY**: NEW chat created (not appended to existing) ✅
- [ ] **VERIFY**: Prompt auto-submitted ✅
- [ ] **VERIFY**: AI responds to prompt ✅
- [ ] No console errors
- [ ] Screenshot saved: `manual-qa/fr-2-auto-submit-prompt.png`

---

## FR-3-6: Image Generation E2E

### Step 1: Request Image
- [ ] Navigate to Chat tab
- [ ] Type: "Erstelle ein Bild zur Photosynthese"
- [ ] Press Enter
- [ ] Agent confirmation appears ✅
- [ ] Click "Bild-Generierung starten" ✅

### Step 2: Image Generated
- [ ] Wait max 30 seconds
- [ ] Image appears in chat as thumbnail ✅ (FR-4)
- [ ] Image is not broken (shows actual image, not 404) ✅
- [ ] Caption visible below image ✅
- [ ] Click image → opens full-size preview modal ✅
- [ ] No console errors
- [ ] Screenshot: `manual-qa/fr-4-image-in-chat.png`

### Step 3: Image in Context
- [ ] Type follow-up: "Was zeigt das Bild?"
- [ ] AI response references the generated image ✅ (FR-5)
- [ ] No console errors

### Step 4: Image in Library
- [ ] Navigate to Library tab
- [ ] Click "Bilder" filter
- [ ] Generated image appears in list ✅ (FR-6)
- [ ] Image thumbnail visible
- [ ] Title matches ("Photosynthese")
- [ ] Click image → preview opens
- [ ] No console errors
- [ ] Screenshot: `manual-qa/fr-6-image-in-library.png`

---

## FR-7: Library - Chat Summary

- [ ] Navigate to Library tab
- [ ] Click "Chats" filter
- [ ] Each chat shows summary ✅
- [ ] Summary text meaningful (not empty/error)
- [ ] No console errors
- [ ] Screenshot: `manual-qa/fr-7-library-chat-summary.png`

---

## FR-8: Library - Anrede (ihr → du)

- [ ] Navigate to Library tab
- [ ] Read all visible text carefully
- [ ] **VERIFY**: No "Ihr" or "Ihre" anywhere ✅
- [ ] **VERIFY**: Uses "du/dein/deine" instead ✅
- [ ] Check tooltips/modals too
- [ ] Screenshot: `manual-qa/fr-8-library-informal-address.png`

---

## FR-9: Library - Name (Bibliothek)

- [ ] Check Tab Bar at bottom
- [ ] **VERIFY**: Shows "Bibliothek" (not "Library") ✅
- [ ] Navigate to Library tab
- [ ] **VERIFY**: Page title shows "Bibliothek" ✅
- [ ] No English "Library" visible anywhere
- [ ] Screenshot: `manual-qa/fr-9-bibliothek-tab.png`

---

## FR-10-11: Profile - Merkmale speichern

- [ ] Navigate to Profile tab
- [ ] Click "Merkmal hinzufügen +" button ✅
- [ ] Modal/input appears ✅
- [ ] Type: "Differenzierung"
- [ ] Click "Hinzufügen" ✅
- [ ] **VERIFY**: Tag appears immediately in list ✅
- [ ] **CHECK NETWORK TAB**: `/api/profile/characteristics/add` returns 200 (not 404) ✅
- [ ] **CHECK CONSOLE**: No errors ✅
- [ ] Reload page → tag still visible (persisted)
- [ ] Screenshot: `manual-qa/fr-11-profile-add-characteristic.png`

---

## FR-12: Profile - Button Position

- [ ] Navigate to Profile tab
- [ ] **WITHOUT SCROLLING**: Check if "Merkmal hinzufügen +" button visible ✅
- [ ] Button should be in viewport (not cut off at bottom)
- [ ] If tags list is long, button should be sticky/accessible
- [ ] Mobile view: Button still accessible
- [ ] Screenshot: `manual-qa/fr-12-profile-button-visible.png`

---

## FR-13: Profile - Auto-Extraction

### Setup
- [ ] Navigate to Chat tab
- [ ] Start NEW chat

### Extraction Trigger
- [ ] Send 3+ messages mentioning "Mathematik":
  - "Ich unterrichte Mathematik in Klasse 7"
  - "Kannst du mir ein Arbeitsblatt für Mathematik erstellen?"
  - "Die Mathematik-Stunde ist morgen"
- [ ] Wait 2 seconds after each message

### Verification
- [ ] Navigate to Profile tab (triggers extraction on unmount)
- [ ] Wait 5 seconds
- [ ] **VERIFY**: "Mathematik" tag appears in profile ✅
- [ ] **CHECK NETWORK TAB**: `/api/profile/extract` called (200 response) ✅
- [ ] **CHECK CONSOLE**: No errors ✅
- [ ] Screenshot: `manual-qa/fr-13-profile-auto-extraction.png`

---

## Overall QA Checks

### Network Tab
- [ ] Clear network log
- [ ] Navigate through all tabs: Home → Chat → Library → Profile
- [ ] **VERIFY**: No 404 errors ✅
- [ ] **VERIFY**: No 500 errors ✅
- [ ] Screenshot: `manual-qa/network-tab-no-errors.png`

### Console Tab
- [ ] Clear console
- [ ] Navigate through all tabs
- [ ] **VERIFY**: No red errors ✅
- [ ] **VERIFY**: No TypeScript errors ✅
- [ ] Yellow warnings OK (if not critical)
- [ ] Screenshot: `manual-qa/console-no-errors.png`

### Backend Server
- [ ] Check backend terminal output
- [ ] **VERIFY**: No crashes ✅
- [ ] **VERIFY**: No unhandled errors ✅
- [ ] Screenshot: `manual-qa/backend-server-healthy.png`

---

## Regression Testing

### Test Previously Working Features
- [ ] Chat: Send regular message (no agent) → works ✅
- [ ] Chat: Agent suggestions appear → work ✅
- [ ] Home: Navigate to tabs → works ✅
- [ ] Library: Filter materials → works ✅
- [ ] Profile: View existing tags → works ✅

---

## Final Approval

- [ ] All checkboxes above marked ✅
- [ ] All screenshots saved in `manual-qa/` folder
- [ ] No critical bugs found
- [ ] Ready for deployment

**Tester Signature**: _________
**QA Manager Approval**: _________
**Date**: _________
```

---

## 🔄 QA Iteration Loop

### Iteration Process

```
┌──────────────────────────────────────────────────────────────┐
│  ITERATION LOOP (Repeat until all tests GREEN)              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ 1. Run Playwright   │
                    │    E2E Tests        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ 2. Check Results    │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
           ┌────────────────┐    ┌────────────────┐
           │  ALL GREEN ✅  │    │  FAILURES ❌   │
           └────────┬───────┘    └────────┬───────┘
                    │                     │
                    │                     ▼
                    │          ┌─────────────────────┐
                    │          │ 3. Analyze Failures │
                    │          │    - Screenshots    │
                    │          │    - Console logs   │
                    │          │    - Network errors │
                    │          └──────────┬──────────┘
                    │                     │
                    │                     ▼
                    │          ┌─────────────────────┐
                    │          │ 4. Fix Issues       │
                    │          │    - Code changes   │
                    │          │    - Config updates │
                    │          └──────────┬──────────┘
                    │                     │
                    │                     ▼
                    │          ┌─────────────────────┐
                    │          │ 5. Commit Fix       │
                    │          └──────────┬──────────┘
                    │                     │
                    │                     ▼
                    │          ┌─────────────────────┐
                    │          │ 6. Re-run Tests     │
                    │          └──────────┬──────────┘
                    │                     │
                    │                     │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ 7. Manual QA Check  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ 8. DEPLOYMENT ✅    │
                    └─────────────────────┘
```

### Failure Handling Protocol

**When a test fails**:
1. **Screenshot Review**: Check `qa-screenshots/*.png` for visual issues
2. **Console Log Review**: Check console errors in test output
3. **Network Log Review**: Check for 404/500 errors
4. **Root Cause Analysis**: Identify exact issue (code, config, timing)
5. **Fix Implementation**: Make targeted fix (no quick hacks)
6. **Re-test**: Run ONLY failed test first, then full suite
7. **Document**: Log fix in `QA-ITERATION-LOG.md`

---

## 📦 Deliverables

### Documentation
- [ ] This spec (`spec.md`)
- [ ] Implementation plan (`plan.md`)
- [ ] Parallel task breakdown (`tasks.md`)
- [ ] QA test suite (Playwright E2E)
- [ ] Manual QA checklist
- [ ] QA iteration log (created during testing)

### Code Changes
- [ ] Backend: 2 route enables (`chat-summary`, `profile`)
- [ ] Backend: 1 route enhancement (`imageGeneration` + InstantDB)
- [ ] Frontend: 13 component/page updates
- [ ] Frontend: Search & replace (ihr → du)

### Test Artifacts
- [ ] 15+ Playwright E2E tests
- [ ] 20+ QA screenshots
- [ ] Console log captures
- [ ] Network log captures
- [ ] QA approval sign-off

---

## ⏱️ Timeline Estimate

### Parallelized Workstreams

**Workstream A: Backend (1 developer, 4 hours)**
- Enable chat-summary route (30 min)
- Enable profile route (30 min)
- Enhance imageGeneration route (2 hours)
- Test all endpoints (1 hour)

**Workstream B: Frontend - Home/Chat (1 developer, 6 hours)**
- FR-1: Chat summary on Home (1 hour)
- FR-2: Auto-submit prompts (1.5 hours)
- FR-4: Image in chat (1 hour)
- FR-5: Image in context (1 hour)
- Testing (1.5 hours)

**Workstream C: Frontend - Library/Profile (1 developer, 6 hours)**
- FR-6: Images in library (1 hour)
- FR-7: Chat summary in library (30 min)
- FR-8: ihr → du (30 min)
- FR-9: Library → Bibliothek (15 min)
- FR-11-13: Profile fixes (2.5 hours)
- Testing (1.5 hours)

**Workstream D: QA (1 developer, ongoing)**
- Write Playwright tests (2 hours)
- Run E2E suite (30 min per iteration)
- Manual QA (1 hour)
- Iteration loops (variable - until all green)

**Total Time (Parallelized)**: **2-3 days** (depends on QA iterations)

---

## 🎯 Success Metrics

- **Automated Tests**: 100% pass rate (15/15 tests green)
- **Manual QA**: All checklist items ✅
- **404 Errors**: 0
- **Console Errors**: 0
- **TypeScript Errors**: 0
- **Backend Crashes**: 0
- **User-Reported Issues**: 14/14 resolved

---

## 🔗 Dependencies

### External
- InstantDB API (for profile/library storage)
- OpenAI API (for DALL-E image generation)
- OpenAI API (for profile extraction)

### Internal
- Backend services: `profileExtractionService`, `instantdbService`, `chatService`
- Frontend hooks: `useChatSummary`, `useProfileCharacteristics`, `useAuth`
- Test infrastructure: Playwright, test-auth bypass

---

## 📚 References

- `.specify/specs/remaining-features-fix/spec.md` (original spec)
- `.specify/specs/CONSOLIDATED-GAP-ANALYSIS.md` (gap analysis)
- `teacher-assistant/backend/src/routes/` (backend routes)
- `teacher-assistant/frontend/src/` (frontend code)

---

**Spec Status**: ✅ Ready for Implementation
**Next Step**: Create `plan.md` and `tasks.md`
**Approval**: Pending user review

---

**Created**: 2025-10-05
**Author**: General-Purpose Agent
**Version**: 1.0
