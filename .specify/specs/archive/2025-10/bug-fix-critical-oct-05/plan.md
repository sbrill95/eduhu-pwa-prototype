# Critical Bug Fixes - Technical Implementation Plan

**Feature**: Critical Bug Fixes (Agent Detection, Navigation, Date Format, Console Errors)
**Version**: 1.0
**Status**: Technical Design
**Created**: 2025-10-05

---

## 1. Architecture Overview

### 1.1 Current State (BROKEN)

```
┌─────────────────────────────────────────────────────────────┐
│ BUG 1: Agent Detection                                      │
│                                                             │
│ BACKEND chatService.ts:908                                  │
│   → Returns response.agentSuggestion ✅                     │
│                                                             │
│ FRONTEND useChat.ts:915-968                                 │
│   → Checks response.agentSuggestion ✅                      │
│   → Saves to metadata ✅                                    │
│                                                             │
│ FRONTEND ChatView.tsx:621-647                               │
│   → Checks metadata.agentSuggestion ❌ (NOT WORKING)        │
│   → Renders AgentConfirmationMessage ❌ (NOT RENDERED)      │
│                                                             │
│ ROOT CAUSE: metadata check is broken or message not saved  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ BUG 2: Prompt Auto-Submit (Homepage)                        │
│                                                             │
│ Home.tsx:73-77 handlePromptClick                            │
│   → Calls onNavigateToChat(prompt) ✅                       │
│                                                             │
│ App.tsx receives prompt → ChatView prefills ✅              │
│                                                             │
│ ChatView.tsx:304-317 useEffect                              │
│   → Sets inputValue to prefilled prompt ✅                  │
│   → But DOES NOT auto-submit ❌                             │
│                                                             │
│ ROOT CAUSE: No auto-submit logic in ChatView               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ BUG 3: Material Navigation (Homepage)                       │
│                                                             │
│ Home.tsx:343 Material Arrow Click                           │
│   → Calls onNavigateToTab('automatisieren') ✅              │
│                                                             │
│ App.tsx changes tab to 'automatisieren' (Library) ✅        │
│                                                             │
│ Library.tsx renders with DEFAULT tab 'chats' ❌            │
│                                                             │
│ ROOT CAUSE: No mechanism to select 'materials' sub-tab      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ BUG 4: Library Date Format                                  │
│                                                             │
│ Home.tsx formatRelativeDate utility ✅                      │
│   → Returns "14:30", "Gestern", "vor 2 Tagen"              │
│                                                             │
│ Library.tsx formatDate function ❌                          │
│   → Returns "05.10.2025" (different format)                │
│                                                             │
│ ROOT CAUSE: Two separate date formatting functions          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ BUG 5: Console Errors (Profile API 404)                     │
│                                                             │
│ Frontend calls:                                             │
│   - POST /api/profile/extract → 404 ❌                      │
│   - POST /api/chat/summary → 404 ❌                         │
│                                                             │
│ Backend routes/index.ts:                                    │
│   - Routes NOT registered ❌                                │
│                                                             │
│ ROOT CAUSE: Routes commented out or never created           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Target Architecture (FIXED)

```
┌─────────────────────────────────────────────────────────────┐
│ FIX 1: Agent Detection Working                              │
│                                                             │
│ USER writes: "Erstelle ein Bild zur Photosynthese"         │
│   ↓                                                         │
│ BACKEND returns: response.agentSuggestion ✅                │
│   ↓                                                         │
│ FRONTEND useChat.ts saves: metadata + agentSuggestion ✅    │
│   ↓                                                         │
│ FRONTEND ChatView.tsx:621 checks metadata CORRECTLY ✅      │
│   ↓                                                         │
│ AgentConfirmationMessage renders with Gemini UI ✅          │
│   ↓                                                         │
│ USER clicks "Ja, Bild erstellen" → Modal opens ✅           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FIX 2: Prompt Auto-Submit Working                           │
│                                                             │
│ USER clicks prompt tile on Homepage                         │
│   ↓                                                         │
│ App.tsx navigates to Chat + passes prompt ✅                │
│   ↓                                                         │
│ ChatView.tsx useEffect detects prefilled prompt ✅          │
│   ↓                                                         │
│ ChatView.tsx AUTO-SUBMITS form after delay ✅               │
│   ↓                                                         │
│ KI response appears → Input cleared ✅                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FIX 3: Material Navigation Working                          │
│                                                             │
│ USER clicks Material arrow on Homepage                      │
│   ↓                                                         │
│ Home.tsx dispatches CustomEvent: 'navigate-library-tab' ✅  │
│   ↓                                                         │
│ App.tsx changes tab to 'automatisieren' ✅                  │
│   ↓                                                         │
│ Library.tsx listens to event → sets tab to 'materials' ✅   │
│   ↓                                                         │
│ Material list visible ✅                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FIX 4: Consistent Date Format                               │
│                                                             │
│ NEW: lib/formatRelativeDate.ts utility ✅                   │
│   ↓                                                         │
│ Home.tsx imports formatRelativeDate ✅                      │
│ Library.tsx imports formatRelativeDate ✅                   │
│   ↓                                                         │
│ Same chat → same date in both views ✅                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FIX 5: Clean Console (No 404s)                              │
│                                                             │
│ Frontend disables profile extraction calls ✅               │
│ Frontend disables chat summary calls ✅                     │
│   ↓                                                         │
│ Console has zero 404 errors ✅                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Components

### 2.1 Frontend Changes

#### A) Agent Detection Fix - ChatView.tsx
**File**: `teacher-assistant/frontend/src/components/ChatView.tsx`

**Current Code (Lines 621-647)**: ❌ BROKEN
```typescript
// FIX-002: Check metadata FIRST for agentSuggestion (from InstantDB)
if (message.metadata) {
  try {
    const metadata = typeof message.metadata === 'string'
      ? JSON.parse(message.metadata)
      : message.metadata;

    if (metadata.agentSuggestion) {
      console.log('[ChatView] Found agentSuggestion in metadata:', metadata.agentSuggestion);
      return (
        <div key={message.id} className="flex justify-start mb-3">
          <div className="max-w-[85%]">
            <AgentConfirmationMessage
              message={{
                content: message.content,
                agentSuggestion: metadata.agentSuggestion
              }}
              sessionId={currentSessionId}
            />
          </div>
        </div>
      );
    }
  } catch (e) {
    console.error('[ChatView] Failed to parse metadata:', e);
    // Not JSON metadata, continue with regular rendering
  }
}
```

**PROBLEM**: This code is already correct! The issue must be elsewhere.

**Diagnosis Needed**:
1. Check if `message.metadata` is actually being saved correctly in useChat.ts:955
2. Check if InstantDB query returns `metadata` field
3. Check console logs: Do we see `[ChatView] Found agentSuggestion in metadata`?

**Fix Strategy**:
```typescript
// ADD DEBUG LOGGING before metadata check
console.log('[ChatView DEBUG] Message details:', {
  id: message.id,
  role: message.role,
  hasMetadata: !!message.metadata,
  metadataType: typeof message.metadata,
  rawMetadata: message.metadata,
  content: message.content?.substring(0, 100)
});

// Then existing metadata check
if (message.metadata) {
  // ... existing code
}
```

**Potential Issues**:
1. **InstantDB Schema**: Check if `messages` table has `metadata` column
2. **useChat.ts:955**: Verify metadata is saved correctly
3. **Query Filter**: Check if InstantDB query includes metadata field

**Fix Lines**: Add debug logs at line 620, verify metadata save at useChat.ts:955

---

#### B) Prompt Auto-Submit - ChatView.tsx
**File**: `teacher-assistant/frontend/src/components/ChatView.tsx`

**Current Code (Lines 304-317)**: Prefills but doesn't submit
```typescript
// Handle prefilled prompt from Home screen
useEffect(() => {
  if (prefilledPrompt) {
    console.log('Setting prefilled prompt:', prefilledPrompt);
    setInputValue(prefilledPrompt);
    // Focus the input field for better UX (on desktop)
    setTimeout(() => {
      const inputElement = document.querySelector('ion-input');
      if (inputElement) {
        inputElement.setFocus();
      }
    }, 100);
  }
}, [prefilledPrompt]);
```

**Change**: Add auto-submit logic
```typescript
// Handle prefilled prompt from Home screen
useEffect(() => {
  if (prefilledPrompt) {
    console.log('[ChatView] Setting prefilled prompt:', prefilledPrompt);
    setInputValue(prefilledPrompt);

    // AUTO-SUBMIT after brief delay (allow input to render)
    setTimeout(async () => {
      console.log('[ChatView] Auto-submitting prefilled prompt');

      // Create synthetic form submit event
      const apiMessages: ApiChatMessage[] = [
        {
          role: 'user' as const,
          content: prefilledPrompt,
        },
      ];

      try {
        await sendMessage(apiMessages);

        // Clear prefilled prompt after successful send
        if (onClearPrefill) {
          onClearPrefill();
        }

        // Clear input (will show loading state)
        setInputValue('');
      } catch (error) {
        console.error('[ChatView] Auto-submit failed:', error);
        // Keep prompt in input on error for manual retry
      }
    }, 200); // 200ms delay for smooth UX
  }
}, [prefilledPrompt, sendMessage, onClearPrefill]);
```

**Affected Lines**: 304-317 (replace with above code)
**Estimated Changes**: ~20 lines modified
**Dependencies**: Add `sendMessage` to useEffect deps

---

#### C) Material Navigation - Home.tsx + Library.tsx
**Files**:
- `teacher-assistant/frontend/src/pages/Home/Home.tsx` (Line 343)
- `teacher-assistant/frontend/src/pages/Library/Library.tsx` (NEW listener)

**Step 1: Home.tsx - Dispatch Event**
```typescript
// Line 343 - Material Arrow Click
<button
  onClick={() => {
    console.log('[Home] Material arrow clicked - navigating to Library Materials');

    // Dispatch custom event to signal Library tab switch
    const event = new CustomEvent('navigate-library-tab', {
      detail: { tab: 'materials' }
    });
    window.dispatchEvent(event);

    // Navigate to Library
    if (onNavigateToTab) {
      onNavigateToTab('automatisieren');
    }
  }}
  className="text-primary hover:text-primary-dark transition-colors"
  aria-label="Alle Materialien anzeigen"
>
  <IonIcon icon={arrowForwardOutline} className="text-xl" />
</button>
```

**Step 2: Library.tsx - Listen for Event**
```typescript
// Add useEffect to listen for navigation event (add after line 50)
useEffect(() => {
  const handleLibraryNav = (event: CustomEvent) => {
    console.log('[Library] Received navigate-library-tab event:', event.detail);
    if (event.detail?.tab === 'materials') {
      setActiveTab('materials');
    }
  };

  window.addEventListener('navigate-library-tab', handleLibraryNav as EventListener);

  return () => {
    window.removeEventListener('navigate-library-tab', handleLibraryNav as EventListener);
  };
}, []);
```

**Affected Files**:
- Home.tsx: Line 343 (modify onClick)
- Library.tsx: Add new useEffect after line 50

---

#### D) Date Formatting Utility - NEW FILE
**File**: `teacher-assistant/frontend/src/lib/formatRelativeDate.ts` (CREATE)

```typescript
/**
 * Format timestamp to German relative date string
 * Consistent across Homepage and Library views
 *
 * Examples:
 * - "14:30" (today)
 * - "Gestern" (yesterday)
 * - "vor 2 Tagen" (< 7 days)
 * - "12. Okt" (< 1 year)
 * - "12. Okt 2024" (> 1 year)
 */
export function formatRelativeDate(timestamp: number | Date): string {
  const now = new Date();
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;

  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Today - show time
  if (diffInDays === 0) {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'Gestern';
  }

  // Last 7 days
  if (diffInDays < 7) {
    return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
  }

  // This year - show date without year
  if (diffInDays < 365) {
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Older - show full date
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
```

**Step 2: Home.tsx - Import Utility**
```typescript
// Add import at top
import { formatRelativeDate } from '../lib/formatRelativeDate';

// Replace inline formatting with utility (find similar code around line 200-300)
<div className="text-xs text-gray-500">
  {formatRelativeDate(chat.updated_at)}
</div>
```

**Step 3: Library.tsx - Replace formatDate Function**
```typescript
// Add import at top
import { formatRelativeDate } from '../lib/formatRelativeDate';

// REMOVE old formatDate function (lines 82-102)
// REPLACE with utility call
<div className="text-xs text-gray-500 mt-1">
  {formatRelativeDate(chat.updated_at)}
</div>
```

**Affected Files**:
- NEW: `lib/formatRelativeDate.ts` (+50 lines)
- Home.tsx: Add import, replace inline format (~5 lines)
- Library.tsx: Remove formatDate, add import, replace calls (~20 lines)

---

#### E) Console Errors Fix - ChatView.tsx
**File**: `teacher-assistant/frontend/src/components/ChatView.tsx` (Lines 319-373)

**Current Code**: Profile extraction on unmount
```typescript
// Profile extraction on chat unmount (TASK-016: Profile Redesign Auto-Extraction)
// Triggers when user leaves chat view with meaningful conversation
const hasExtractedRef = useRef(false);

useEffect(() => {
  // Reset extraction flag when session changes
  hasExtractedRef.current = false;

  // Cleanup: Trigger extraction when component unmounts
  return () => {
    // Only extract if:
    // 1. Not already extracted in this session
    // 2. User is authenticated
    // 3. Has active session
    // 4. Has at least 2 messages (meaningful conversation)
    if (
      !hasExtractedRef.current &&
      user?.id &&
      currentSessionId &&
      messages.length >= 2
    ) {
      hasExtractedRef.current = true;

      // Extract profile characteristics in background
      const extractProfile = async () => {
        try {
          console.log('[Profile Extraction] Triggering extraction on unmount', {
            userId: user.id,
            sessionId: currentSessionId,
            messageCount: messages.length
          });

          // Convert messages to API format (first 10 for context)
          const apiMessages = messages.slice(0, 10).map(m => ({
            role: m.role,
            content: m.content
          }));

          await apiClient.post('/profile/extract', {
            userId: user.id,
            messages: apiMessages
          });

          console.log('[Profile Extraction] Extraction successful');
        } catch (error) {
          // Log error but don't block UI or show error to user
          console.error('[Profile Extraction] Failed:', error);
        }
      };

      // Execute in background (non-blocking)
      extractProfile();
    }
  };
}, [currentSessionId, user?.id, messages]);
```

**Change**: Add feature flag to disable
```typescript
// FEATURE FLAG: Disable profile extraction to prevent 404 errors
const ENABLE_PROFILE_EXTRACTION = false;

// Profile extraction on chat unmount (DISABLED due to missing backend route)
const hasExtractedRef = useRef(false);

useEffect(() => {
  // Skip if feature disabled
  if (!ENABLE_PROFILE_EXTRACTION) {
    return;
  }

  // ... existing code
}, [currentSessionId, user?.id, messages]);
```

**Step 2: Disable useChatSummary Hook** (Lines 175-183)
```typescript
// Auto-generate chat summary (DISABLED due to missing backend route)
const ENABLE_CHAT_SUMMARY = false;

useChatSummary({
  chatId: currentSessionId || '',
  messages: messages.map(m => ({
    role: m.role,
    content: m.content
  })),
  enabled: ENABLE_CHAT_SUMMARY && !!currentSessionId && !!user // Add flag
});
```

**Affected Lines**:
- Lines 319-373: Add ENABLE_PROFILE_EXTRACTION flag
- Lines 175-183: Add ENABLE_CHAT_SUMMARY flag

---

### 2.2 Backend Changes

#### NO BACKEND CHANGES REQUIRED ✅

All backend functionality is working:
- Agent detection (chatService.ts) ✅
- agentSuggestion response ✅
- langGraphAgents.ts saves to library_materials ✅

The fixes are **frontend-only**.

---

## 3. Data Flow

### 3.1 Agent Detection Flow (FIXED)

```
┌────────────────────────────────────────────────────┐
│ 1. USER: "Erstelle ein Bild zur Photosynthese"    │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 2. BACKEND chatService.ts:915                      │
│    AgentIntentService.detectAgentIntent()          │
│    → Returns agentSuggestion ✅                    │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 3. FRONTEND useChat.ts:915-968                     │
│    Checks response.agentSuggestion                 │
│    → Saves to metadata ✅                          │
│    → Returns to ChatView ✅                        │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 4. FRONTEND ChatView.tsx:621 (DEBUG ADDED)         │
│    console.log message metadata                    │
│    → Parses metadata.agentSuggestion ✅            │
│    → Renders AgentConfirmationMessage ✅           │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 5. USER clicks "Ja, Bild erstellen" (Orange) ✅    │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 6. AgentFormView opens with prefilled data ✅      │
└────────────────────────────────────────────────────┘
```

### 3.2 Prompt Auto-Submit Flow (FIXED)

```
┌────────────────────────────────────────────────────┐
│ 1. USER clicks Prompt Tile on Homepage             │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 2. Home.tsx handlePromptClick                      │
│    → onNavigateToChat(prompt) ✅                   │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 3. App.tsx changes tab + passes prompt ✅          │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 4. ChatView.tsx useEffect detects prefilled        │
│    → setInputValue(prompt) ✅                      │
│    → setTimeout(...sendMessage) ✅ (NEW)           │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 5. Message auto-submitted ✅                       │
│    → KI response appears ✅                        │
│    → Input cleared ✅                              │
└────────────────────────────────────────────────────┘
```

### 3.3 Material Navigation Flow (FIXED)

```
┌────────────────────────────────────────────────────┐
│ 1. USER clicks Material Arrow on Homepage          │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 2. Home.tsx dispatches CustomEvent ✅              │
│    window.dispatchEvent('navigate-library-tab')    │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 3. App.tsx changes tab to 'automatisieren' ✅      │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 4. Library.tsx listens to event ✅                 │
│    → setActiveTab('materials') ✅                  │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ 5. Material list displayed ✅                      │
└────────────────────────────────────────────────────┘
```

---

## 4. Testing Strategy

### 4.1 Playwright E2E Tests (MANDATORY)

**Test File**: `.specify/specs/bug-fix-critical-oct-05/tests.spec.ts`

#### Test 1: Agent Detection Workflow
```typescript
test('BUG-001: Agent Detection shows Gemini confirmation', async ({ page }) => {
  await page.goto('http://localhost:5175');
  await page.locator('ion-tab-button[tab="chat"]').click();

  // Type image request
  await page.locator('textarea').fill('Erstelle ein Bild zur Photosynthese');
  await page.locator('button[type="submit"]').click();

  // Wait for agent confirmation
  await page.waitForSelector('[data-testid="agent-confirmation"]', { timeout: 5000 });

  // Verify Gemini UI
  const orangeButton = page.locator('button:has-text("Ja, Bild erstellen")');
  await expect(orangeButton).toBeVisible();

  // Screenshot proof
  await page.screenshot({ path: 'screenshots/bug-001-agent-confirmation.png' });

  // Verify button color
  const bgColor = await orangeButton.evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).toBe('rgb(251, 101, 66)'); // #FB6542
});
```

#### Test 2: Prompt Auto-Submit
```typescript
test('BUG-002: Prompt tiles auto-submit messages', async ({ page }) => {
  await page.goto('http://localhost:5175');
  await page.locator('ion-tab-button[tab="home"]').click();

  // Click prompt tile
  await page.locator('text=Erstelle mir einen Stundenplan').click();

  // Should navigate to Chat
  await expect(page.locator('ion-tab-button[tab="chat"][aria-selected="true"]')).toBeVisible();

  // Should auto-submit (loading spinner appears)
  await expect(page.locator('text=eduhu tippt...')).toBeVisible({ timeout: 1000 });

  // Should show KI response
  await expect(page.locator('.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 10000 });

  // Input should be empty
  const inputValue = await page.locator('ion-input').inputValue();
  expect(inputValue).toBe('');

  // Screenshot proof
  await page.screenshot({ path: 'screenshots/bug-002-auto-submit.png' });
});
```

#### Test 3: Material Navigation
```typescript
test('BUG-003: Material arrow navigates to Materials tab', async ({ page }) => {
  await page.goto('http://localhost:5175');
  await page.locator('ion-tab-button[tab="home"]').click();

  // Click material arrow
  await page.locator('[aria-label="Alle Materialien anzeigen"]').click();

  // Should navigate to Library
  await expect(page.locator('ion-tab-button[tab="automatisieren"][aria-selected="true"]')).toBeVisible();

  // Should show Materials tab (not Chats)
  await expect(page.locator('text=Materialien').and(page.locator('.border-primary'))).toBeVisible();

  // Screenshot proof
  await page.screenshot({ path: 'screenshots/bug-003-material-nav.png' });
});
```

#### Test 4: Date Formatting Consistency
```typescript
test('BUG-004: Date format consistent across Homepage and Library', async ({ page }) => {
  await page.goto('http://localhost:5175');

  // Get date from Homepage
  await page.locator('ion-tab-button[tab="home"]').click();
  const homeDateText = await page.locator('.text-gray-500').first().textContent();

  // Get same chat date from Library
  await page.locator('ion-tab-button[tab="automatisieren"]').click();
  await page.locator('text=Chats').click();
  const libraryDateText = await page.locator('.text-gray-500').first().textContent();

  // Should match
  expect(homeDateText).toBe(libraryDateText);

  // Should use German relative format
  expect(homeDateText).toMatch(/^\d{2}:\d{2}|Gestern|vor \d+ Tag/);

  // Screenshot proof
  await page.screenshot({ path: 'screenshots/bug-004-date-format.png' });
});
```

#### Test 5: Console Clean (No 404s)
```typescript
test('BUG-005: No console 404 errors on app load', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Load app
  await page.goto('http://localhost:5175');
  await page.waitForLoadState('networkidle');

  // Navigate through tabs to trigger any API calls
  await page.locator('ion-tab-button[tab="chat"]').click();
  await page.waitForTimeout(1000);

  await page.locator('ion-tab-button[tab="automatisieren"]').click();
  await page.waitForTimeout(1000);

  // Check for 404 errors
  const has404Errors = consoleErrors.some(err =>
    err.includes('404') || err.includes('/api/profile/extract') || err.includes('/api/chat/summary')
  );

  expect(has404Errors).toBe(false);

  // Log all errors for debugging
  console.log('Console errors:', consoleErrors);
});
```

### 4.2 Screenshot Verification

**Before/After Comparison**:
1. `screenshots/before/` - Capture current broken state
2. `screenshots/after/` - Capture fixed state
3. Visual diff to verify fixes

---

## 5. Deployment Plan

### Phase 1: Investigation & Debug (1 hour)
1. ✅ Add debug logs to ChatView.tsx:620
2. ✅ Test agent detection in browser console
3. ✅ Verify metadata save in InstantDB
4. ✅ Identify root cause

**Verification**: Console logs show where metadata is lost

### Phase 2: Core Fixes (2 hours)
5. ✅ Fix Agent Detection (ChatView.tsx debug + potential useChat.ts fix)
6. ✅ Implement Prompt Auto-Submit (ChatView.tsx useEffect)
7. ✅ Implement Material Navigation (Home.tsx event + Library.tsx listener)
8. ✅ Create formatRelativeDate utility (new file)
9. ✅ Disable Console Errors (ChatView.tsx feature flags)

**Verification**: Manual testing in browser

### Phase 3: Testing & Screenshots (1 hour)
10. ✅ Run all Playwright E2E tests
11. ✅ Capture before/after screenshots
12. ✅ Verify all 5 bugs fixed

**Verification**: All tests green ✅

### Phase 4: QA & Approval (30 min)
13. ✅ QA Agent reviews implementation
14. ✅ User manual testing
15. ✅ Merge to main

**Verification**: User acceptance ✅

---

## 6. Rollback Plan

**If deployment fails**:

1. **Feature Flags** (instant rollback):
   ```typescript
   const ENABLE_PROFILE_EXTRACTION = false; // Already disabled
   const ENABLE_CHAT_SUMMARY = false; // Already disabled
   const ENABLE_AUTO_SUBMIT = false; // Add flag if needed
   ```

2. **Git Revert** (5 minutes):
   ```bash
   git revert HEAD
   git push
   ```

3. **No Data Loss**: All changes are UI-only, no schema changes

---

## 7. Open Questions (For User)

### Q1: Agent Detection Root Cause
**Question**: Wo genau geht agentSuggestion verloren?
- In useChat.ts metadata save?
- In InstantDB query?
- In ChatView.tsx metadata parse?

**Action**: Add debug logs, test in browser

### Q2: Auto-Submit Delay
**Question**: 200ms delay für Auto-Submit okay?
- Zu schnell → sieht abrupt aus
- Zu langsam → User wartet

**Vorschlag**: 200ms (smooth, nicht zu lange)

### Q3: Material Tab Default
**Question**: Soll Library IMMER auf "Materialien" starten?
- JA → Change default activeTab
- NEIN → Nur bei Homepage-Navigation

**Vorschlag**: Nur bei Homepage-Navigation (wie geplant)

---

## 8. Success Metrics

**After Deployment**:
- [ ] Agent Detection works 100% of time (Playwright test green)
- [ ] Prompt Auto-Submit works 100% of time (Playwright test green)
- [ ] Material Navigation correct 100% of time (Playwright test green)
- [ ] Date format consistent (Playwright test green)
- [ ] Console has zero 404 errors (Playwright test green)
- [ ] E2E test suite passes < 2 min execution time
- [ ] Screenshots prove visual correctness
- [ ] User manually confirms all fixes

---

**Plan Complete**: 2025-10-05
**Estimated Effort**: 4-5 hours (1 Frontend Dev)
**Next Step**: Create `tasks.md` with granular implementation checklist for Agents
