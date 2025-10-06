# Technical Plan: Chat Summaries

**Feature**: Automatic Chat Summaries
**Version**: 1.0
**Date**: 2025-10-03

---

## 1. Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  HomeView    │  │  LibraryView │  │  ChatView    │      │
│  │  (display)   │  │  (display)   │  │  (trigger)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                            ▼                                 │
│                   ┌─────────────────┐                        │
│                   │  useChatSummary │                        │
│                   │  (custom hook)  │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             POST /api/chat/summary                   │   │
│  │  - Receives chatId + messages                        │   │
│  │  - Generates summary via OpenAI                      │   │
│  │  - Stores in InstantDB                               │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           summaryService.ts                         │    │
│  │  - generateSummary(messages): Promise<string>       │    │
│  │  - Enforces 20-char limit                           │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   OpenAI ChatGPT     │
              │   (gpt-4o-mini)      │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     InstantDB        │
              │  chats.summary       │
              └──────────────────────┘
```

---

## 2. Database Schema

### InstantDB Schema Update

```typescript
// teacher-assistant/backend/src/schemas/instantdb.ts

export const instantDBSchema = {
  chats: {
    id: string,
    user_id: string,
    session_id: string,
    timestamp: date,
    summary: string | null, // NEW FIELD - max 20 characters
    // ... existing fields
  }
}
```

**Migration Notes**:
- Field is nullable - existing chats will have `summary: null`
- No backfill migration for MVP
- New chats will populate summary automatically

---

## 3. Backend Implementation

### 3.1 New Service: `summaryService.ts`

**Location**: `teacher-assistant/backend/src/services/summaryService.ts`

```typescript
import { openai } from '../config/openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class SummaryService {
  /**
   * Generates a summary for a chat (max 20 characters)
   * @param messages - First 3-4 messages of the chat
   * @returns Summary string (≤20 characters)
   */
  async generateSummary(messages: Message[]): Promise<string> {
    const prompt = this.buildPrompt(messages);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Assistent, der prägnante Zusammenfassungen erstellt. Antworte NUR mit der Zusammenfassung, maximal 20 Zeichen.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.3,
      });

      const summary = response.choices[0].message.content?.trim() || 'Neuer Chat';

      // Enforce 20-character limit
      return summary.slice(0, 20);

    } catch (error) {
      console.error('Summary generation failed:', error);
      return 'Zusammenfassung fehlt';
    }
  }

  private buildPrompt(messages: Message[]): string {
    const conversation = messages
      .map(m => `${m.role === 'user' ? 'Lehrer' : 'Assistant'}: ${m.content}`)
      .join('\n');

    return `
Erstelle eine SEHR kurze Zusammenfassung (max 20 Zeichen) für dieses Gespräch auf Deutsch.
Die Zusammenfassung soll das Hauptthema erfassen.

Konversation:
${conversation}

Zusammenfassung (max 20 Zeichen):
    `.trim();
  }
}

export const summaryService = new SummaryService();
```

### 3.2 New Route: `POST /api/chat/summary`

**Location**: `teacher-assistant/backend/src/routes/index.ts`

```typescript
import { summaryService } from '../services/summaryService';
import { instantdbService } from '../services/instantdbService';

// POST /api/chat/summary
router.post('/chat/summary', async (req, res) => {
  try {
    const { chatId, messages } = req.body;

    // Validate input
    if (!chatId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Take first 3-4 messages
    const relevantMessages = messages.slice(0, 4);

    // Generate summary
    const summary = await summaryService.generateSummary(relevantMessages);

    // Store in InstantDB
    await instantdbService.updateChat(chatId, { summary });

    res.json({ summary });
  } catch (error) {
    console.error('Summary route error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});
```

---

## 4. Frontend Implementation

### 4.1 Custom Hook: `useChatSummary`

**Location**: `teacher-assistant/frontend/src/hooks/useChatSummary.ts`

```typescript
import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatSummaryOptions {
  chatId: string;
  messages: Message[];
  enabled: boolean;
}

export const useChatSummary = ({ chatId, messages, enabled }: UseChatSummaryOptions) => {
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    // Don't generate if already generated
    if (hasGeneratedRef.current || !enabled) return;

    // Trigger summary generation after 3 messages
    if (messages.length >= 3) {
      generateSummary();
    }

    // Cleanup: generate summary when component unmounts (user leaves chat)
    return () => {
      if (!hasGeneratedRef.current && messages.length > 0) {
        generateSummary();
      }
    };
  }, [messages.length]);

  const generateSummary = async () => {
    if (hasGeneratedRef.current) return;

    hasGeneratedRef.current = true;

    try {
      await api.post('/chat/summary', {
        chatId,
        messages: messages.slice(0, 4)
      });
    } catch (error) {
      console.error('Failed to generate summary:', error);
      hasGeneratedRef.current = false; // Retry on next trigger
    }
  };

  return null; // No UI returned
};
```

### 4.2 Integration in ChatView

**Location**: `teacher-assistant/frontend/src/components/ChatView.tsx`

```typescript
import { useChatSummary } from '../hooks/useChatSummary';

export const ChatView = () => {
  const { messages, currentChatId } = useChat();

  // Auto-generate summary
  useChatSummary({
    chatId: currentChatId,
    messages,
    enabled: !!currentChatId
  });

  // ... rest of ChatView
}
```

### 4.3 Display in HomeView

**Location**: `teacher-assistant/frontend/src/components/HomeView.tsx`

```typescript
import { getDynamicFontSize } from '../lib/utils';

const ChatPreview = ({ chat }) => {
  const summary = chat.summary || 'Neuer Chat';
  const fontSize = getDynamicFontSize(summary);

  return (
    <div className="p-3 bg-white rounded-xl">
      <p className={`${fontSize} text-gray-700 truncate`}>
        {summary}
      </p>
      <span className="text-xs text-gray-500">
        {formatDate(chat.timestamp)}
      </span>
    </div>
  );
};
```

### 4.4 Display in LibraryView

**Location**: `teacher-assistant/frontend/src/pages/Library/Library.tsx`

```typescript
const ChatItem = ({ chat }) => {
  const summary = chat.summary || 'Neuer Chat';
  const fontSize = getDynamicFontSize(summary);

  return (
    <div className="flex items-center justify-between p-4 bg-background-teal rounded-xl">
      <div className="flex-1">
        <h3 className={`${fontSize} font-medium text-gray-900 truncate`}>
          {summary}
        </h3>
        <p className="text-xs text-gray-500">{formatDate(chat.timestamp)}</p>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </div>
  );
};
```

### 4.5 Utility: Dynamic Font Size

**Location**: `teacher-assistant/frontend/src/lib/utils.ts`

```typescript
/**
 * Returns dynamic Tailwind font size class based on text length
 * - Short text (≤10 chars): text-sm (14px)
 * - Medium text (11-15 chars): text-xs (12px)
 * - Long text (16-20 chars): text-xs (12px) - minimum readable size
 */
export const getDynamicFontSize = (text: string): string => {
  const length = text.length;

  if (length <= 10) return 'text-sm';
  if (length <= 15) return 'text-xs';
  return 'text-xs'; // Minimum font size for readability
};
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Backend**:
- `summaryService.test.ts`:
  - ✅ Generates summary ≤20 characters
  - ✅ Handles OpenAI API errors gracefully
  - ✅ Returns fallback text on failure

**Frontend**:
- `useChatSummary.test.ts`:
  - ✅ Triggers after 3 messages
  - ✅ Triggers on component unmount
  - ✅ Doesn't generate duplicate summaries
- `utils.test.ts`:
  - ✅ `getDynamicFontSize()` returns correct class for different lengths

### 5.2 Integration Tests

- `chat-summary.integration.test.ts`:
  - ✅ End-to-end: send 3 messages → summary generated → stored in InstantDB
  - ✅ User leaves chat with 2 messages → summary generated on exit

### 5.3 E2E Tests (Playwright)

**Test Suite**: `chat-summaries.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Summaries', () => {
  test('displays summary in Home view after 3 messages', async ({ page }) => {
    // 1. Login
    // 2. Navigate to Chat
    // 3. Send 3 messages
    // 4. Wait for summary generation (API call)
    // 5. Navigate to Home
    // 6. Take screenshot: home-chat-summary.png
    // 7. Verify summary is visible and ≤20 chars
  });

  test('displays summary in Library view', async ({ page }) => {
    // 1. Open chat with existing summary
    // 2. Navigate to Library
    // 3. Take screenshot: library-chat-summary.png
    // 4. Verify summary matches expected format
  });

  test('responsive font sizing on mobile', async ({ page }) => {
    // Test on multiple viewports
    const viewports = [
      { width: 375, height: 667, name: 'iphone-se' },
      { width: 390, height: 844, name: 'iphone-12' },
      { width: 393, height: 851, name: 'pixel-5' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      // Navigate to Home
      // Take screenshot: chat-summary-${viewport.name}.png
      // Verify text is readable (not cut off)
    }
  });

  test('handles long summaries with ellipsis', async ({ page }) => {
    // 1. Mock API to return 20-char summary
    // 2. Verify text truncates with ellipsis
    // 3. Screenshot: chat-summary-truncated.png
  });
});
```

**Visual Regression**:
- Compare screenshots against design mockups
- Verify font sizes, spacing, truncation
- Test on all target mobile viewports

---

## 6. API Documentation

### `POST /api/chat/summary`

**Request**:
```json
{
  "chatId": "chat-123-abc",
  "messages": [
    { "role": "user", "content": "Ich brauche ein Arbeitsblatt zur Bruchrechnung" },
    { "role": "assistant", "content": "Gerne! Für welche Klassenstufe?" },
    { "role": "user", "content": "Klasse 7" }
  ]
}
```

**Response** (Success):
```json
{
  "summary": "Bruchrechnung Kl. 7"
}
```

**Response** (Error):
```json
{
  "error": "Failed to generate summary"
}
```

**Rate Limiting**: 10 requests/minute per user

---

## 7. Performance Considerations

1. **Async Generation**: Summary generation happens asynchronously - doesn't block chat UI
2. **Caching**: Once generated, summary is never regenerated (static)
3. **Timeout**: OpenAI API call timeout: 10 seconds
4. **Retry Logic**: 1 retry on failure, then fallback text
5. **Debouncing**: Hook prevents duplicate API calls with `useRef` flag

---

## 8. Deployment Plan

### Phase 1: Backend Deployment
1. Deploy `summaryService.ts` to Vercel
2. Add `/api/chat/summary` route
3. Update InstantDB schema (add `summary` field)
4. Smoke test: curl POST request

### Phase 2: Frontend Deployment
1. Deploy `useChatSummary` hook
2. Integrate in `ChatView.tsx`
3. Update `HomeView.tsx` and `LibraryView.tsx` displays
4. Deploy utility functions

### Phase 3: Testing & Verification
1. Run Playwright E2E tests
2. Visual verification: screenshots vs. design
3. Manual QA on staging
4. Monitor error rates (OpenAI API failures)

### Phase 4: Production Release
1. Feature flag: `ENABLE_CHAT_SUMMARIES=true`
2. Gradual rollout: 10% → 50% → 100%
3. Monitor performance metrics
4. User feedback collection

---

## 9. Rollback Plan

If critical issues occur:
1. Set feature flag `ENABLE_CHAT_SUMMARIES=false`
2. Revert frontend changes (display logic)
3. Backend remains (no harm if route unused)
4. Database field remains (`summary` can be null)

---

## 10. Future Enhancements

**Post-MVP Considerations**:
- 📌 Update summaries when chat continues (currently static)
- 📌 User-editable summaries
- 📌 Multi-language support
- 📌 Backfill summaries for existing chats
- 📌 A/B test different character limits (20 vs 30 vs 40)

---

## 11. Open Technical Questions

- ❓ Should we use `gpt-4o-mini` or `gpt-3.5-turbo` for summaries? (Decision: `gpt-4o-mini` for better German quality)
- ❓ Rate limiting strategy for summary endpoint? (Decision: 10 req/min per user)
- ❓ Should summary generation be retriable by user? (Decision: No manual retry for MVP)
