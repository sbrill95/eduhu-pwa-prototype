# Image Generation Improvements - Tasks

**Feature**: Image Generation UX/Library Improvements
**Version**: 1.0
**Created**: 2025-10-04
**Status**: 📋 Planning

---

## Task Overview

**Total Tasks**: 24
**Estimated Time**: 15-21 hours
**Priority**: P0 (High)

---

## Phase 1: Quick Wins (2-3 hours)

### ✅ TASK-001: Remove duplicate footer in AgentProgressView
**Priority**: P0 | **Effort**: XS (15 min) | **Agent**: Frontend

**Description**:
Remove duplicate footer text in `AgentProgressView.tsx` (lines 201-209) to clean up UI.

**Acceptance Criteria**:
- [ ] Lines 201-209 deleted
- [ ] Only loading card remains with "Dein Bild wird erstellt..." and "Das kann bis zu 1 Minute dauern"
- [ ] Cancel button still visible and functional
- [ ] Visual verification with Playwright screenshot

**Files**:
- `teacher-assistant/frontend/src/components/AgentProgressView.tsx`

**Testing**:
```bash
# Start generation, verify only one "Das kann bis zu 1 Minute dauern" text
npx playwright test e2e-tests/agent-progress-cleanup.spec.ts
```

---

### ✅ TASK-002: Reduce min character validation to 3
**Priority**: P0 | **Effort**: XS (10 min) | **Agent**: Frontend

**Description**:
Change minimum character validation from 10 to 3 in `AgentFormView.tsx`.

**Acceptance Criteria**:
- [ ] Line 28 changed: `>= 10` → `>= 3`
- [ ] Error message updated: "mindestens 3 Zeichen"
- [ ] Submit button disabled for < 3 characters
- [ ] Test inputs: "", "ab", "abc" (should enable at "abc")

**Files**:
- `teacher-assistant/frontend/src/components/AgentFormView.tsx`

**Testing**:
```typescript
// Unit test
expect(isValidForm("ab")).toBe(false);
expect(isValidForm("abc")).toBe(true);
```

---

### ✅ TASK-003: Implement style mapping in backend
**Priority**: P0 | **Effort**: M (1.5 hours) | **Agent**: Backend

**Description**:
Add style mapping function to convert frontend styles to DALL-E 3 parameters + enhanced prompts.

**Acceptance Criteria**:
- [ ] Mapping function created:
  ```typescript
  const styleMapping = {
    realistic: { dalle: 'natural', suffix: 'realistic illustration' },
    cartoon: { dalle: 'vivid', suffix: 'cartoon style' },
    illustrative: { dalle: 'natural', suffix: 'educational illustration' },
    abstract: { dalle: 'vivid', suffix: 'abstract art' }
  };
  ```
- [ ] Enhanced prompt includes suffix
- [ ] Logging added: `logInfo('Style mapping: realistic → natural')`
- [ ] All 4 styles tested with curl

**Files**:
- `teacher-assistant/backend/src/agents/imageGenerationAgent.ts`

**Testing**:
```bash
# Test realistic style
curl -X POST http://localhost:3006/api/langgraph/agents/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId":"langgraph-image-generation","input":"{\"prompt\":\"Löwe\",\"style\":\"realistic\"}","context":{},"confirmExecution":true}' | jq

# Verify logs show: "Style mapping: realistic → natural"
# Verify enhanced_prompt contains "realistic illustration"
```

---

### ✅ TASK-003.5: Generate German title via ChatGPT
**Priority**: P0 | **Effort**: S (30 min) | **Agent**: Backend

**Description**:
After DALL-E generates the image, call ChatGPT to generate a short German title (3-5 words) for better UX in Library and Chat.

**Acceptance Criteria**:
- [ ] After successful DALL-E generation, make ChatGPT call:
  ```typescript
  const titlePrompt = `Erstelle einen kurzen deutschen Titel (maximal 3-5 Wörter) für dieses Bild: ${revisedPrompt}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Du bist ein Assistent der prägnante Bildtitel generiert.' },
      { role: 'user', content: titlePrompt }
    ],
    max_tokens: 20
  });
  const germanTitle = response.choices[0].message.content.trim();
  ```
- [ ] Fallback: If ChatGPT fails, use DALL-E title (English)
- [ ] Return both `title` (German) and `dalle_title` (English) in response
- [ ] Log cost: `title_generation_cost` in metadata
- [ ] Test: "A lion in the savannah" → "Löwe in der Savanne"

**Files**:
- `teacher-assistant/backend/src/agents/imageGenerationAgent.ts`

**Testing**:
```bash
# Generate image
curl -X POST http://localhost:3006/api/langgraph/agents/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId":"langgraph-image-generation","input":"{\"prompt\":\"Löwe\",\"style\":\"realistic\"}","context":{},"confirmExecution":true}' | jq

# Verify response has:
# - data.title = "Löwe in Savanne" (German)
# - data.dalle_title = "A lion in the savannah" (English)
```

---

## Phase 2: Core Features (6-8 hours)

### 🔧 TASK-004: Save images to library_materials
**Priority**: P0 | **Effort**: M (2 hours) | **Agent**: Backend

**Description**:
Update `langGraphAgents.ts` route to save generated images to `library_materials` with `type: 'image'`.

**Acceptance Criteria**:
- [ ] After image generation, create `library_materials` entry:
  ```typescript
  {
    user_id: userId,
    title: result.data.title,
    type: 'image',
    content: result.data.image_url,
    description: result.data.revised_prompt,
    tags: JSON.stringify(result.data.tags || []),
    created_at: Date.now(),
    is_favorite: false
  }
  ```
- [ ] Return `library_id` in response
- [ ] Keep `generated_artifacts` save (backward compatibility)
- [ ] Verify with InstantDB dashboard

**Files**:
- `teacher-assistant/backend/src/routes/langGraphAgents.ts`
- `teacher-assistant/backend/src/schemas/instantdb.ts` (verify type support)

**Testing**:
```bash
# Generate image
curl -X POST ...

# Check InstantDB
# SELECT * FROM library_materials WHERE type = 'image' LIMIT 1
```

---

### 🔧 TASK-005: Create chat message with image after generation
**Priority**: P0 | **Effort**: M (1.5 hours) | **Agent**: Backend

**Description**:
After image generation, create assistant chat message with image URL (NO PROMPT shown in chat).

**Acceptance Criteria**:
- [ ] Create message in `messages` table:
  ```typescript
  {
    session_id: sessionId,
    user_id: userId,
    role: 'assistant',
    content: 'Ich habe ein Bild für dich erstellt.', // NO TITLE, clean
    timestamp: Date.now(),
    metadata: JSON.stringify({
      type: 'image',
      image_url: imageUrl,
      library_id: libraryId,
      artifact_id: artifactId
      // NO PROMPT, NO TITLE in metadata (clean UI)
    })
  }
  ```
- [ ] Return `message_id` in response
- [ ] Verify message appears in InstantDB

**Files**:
- `teacher-assistant/backend/src/routes/langGraphAgents.ts`

**Testing**:
```sql
-- Check message created
SELECT * FROM messages WHERE role = 'assistant' AND content LIKE '%Bild%' LIMIT 1;
```

---

### 🔧 TASK-006: Add "Bilder" filter to Library
**Priority**: P0 | **Effort**: M (2 hours) | **Agent**: Frontend

**Description**:
Add new filter category "Bilder" in Library.tsx to show only images.

**Acceptance Criteria**:
- [ ] Filter buttons: `[Alle] [Materialien] [Bilder]`
- [ ] Active filter state: `useState<'all' | 'materials' | 'images'>('all')`
- [ ] Query logic:
  ```typescript
  where: {
    user_id: user?.id,
    ...(filter === 'images' && { type: 'image' }),
    ...(filter === 'materials' && { type: { $ne: 'image' } })
  }
  ```
- [ ] Display images in grid (3 columns on desktop, 2 on mobile)
- [ ] Image thumbnail + title + date
- [ ] Click → Open preview modal

**Files**:
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`

**Testing**:
```typescript
// Generate 3 images
// Navigate to Library
// Click "Bilder" filter
// Verify 3 images shown
```

---

### 🔧 TASK-007: Render image messages in ChatView
**Priority**: P0 | **Effort**: L (3 hours) | **Agent**: Frontend

**Description**:
Display assistant messages with images in chat view.

**Acceptance Criteria**:
- [ ] Detect `message.metadata.type === 'image'`
- [ ] Render image component (CLEAN UI, NO PROMPT):
  ```tsx
  <div className="flex justify-start mb-3">
    <div className="bg-background-teal rounded-2xl rounded-bl-md p-4 max-w-[80%]">
      <img
        src={metadata.image_url}
        alt="AI-generiertes Bild"
        className="w-full max-w-[300px] rounded-lg mb-3 cursor-pointer"
        onClick={() => openPreviewModal(metadata)}
      />
      <p className="text-gray-900">
        Ich habe ein Bild für dich erstellt.
      </p>
      {/* NO TITLE, NO PROMPT, NO METADATA shown */}
    </div>
  </div>
  ```
- [ ] Click image → Open `MaterialPreviewModal` with image
- [ ] Test scroll performance with multiple images

**Files**:
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx` (enhance for images)

**Testing**:
```typescript
// Generate image
// Check chat view
// Verify image appears
// Click image → Preview modal opens
// Close modal → Can continue chatting
```

---

### 🔧 TASK-008: Implement prompt prefill from chat message
**Priority**: P1 | **Effort**: M (1.5 hours) | **Agent**: Frontend

**Description**:
Extract user prompt from chat message and prefill agent form.

**Acceptance Criteria**:
- [ ] Parse user message in `AgentContext.tsx`:
  ```typescript
  // User: "Erstelle ein Bild von einem Baum"
  const extractedPrompt = message.replace(/erstelle (ein )?bild (von|mit|für)/i, '').trim();
  // Result: "einem Baum"
  ```
- [ ] Set `state.formData.description = extractedPrompt`
- [ ] `AgentFormView` receives prefilled value via `useEffect`
- [ ] User can still edit before submitting

**Files**:
- `teacher-assistant/frontend/src/lib/AgentContext.tsx`
- `teacher-assistant/frontend/src/components/AgentFormView.tsx`

**Testing**:
```typescript
// Chat: "Erstelle ein Bild von einem Löwen"
// Agent triggers
// Click "Ja"
// Form opens with "einem Löwen" prefilled
```

---

## Phase 3: Polish & UX Enhancements (4-6 hours)

### 🎨 TASK-009: Redesign AgentConfirmationModal mit 2 Optionen (Gemini Style)
**Priority**: P1 | **Effort**: M (2 hours) | **Agent**: Frontend / Emotional Design

**Description**:
Redesign agent confirmation modal with Gemini design language and TWO button options.

**Acceptance Criteria**:
- [ ] Teal background: `bg-background-teal`
- [ ] White card: `bg-white rounded-2xl shadow-lg p-6`
- [ ] Orange gradient icon:
  ```tsx
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
    <IonIcon icon={sparkles} className="w-6 h-6 text-white" />
  </div>
  ```
- [ ] Heading: "Möchtest du ein Bild erstellen?" (`text-lg font-semibold text-gray-900`)
- [ ] Subtitle: "Ich generiere ein Bild für deinen Unterricht." (`text-sm text-gray-600 mb-4`)
- [ ] **TWO Buttons**:
  - Primary: "Ja, Bild erstellen 🎨" (`bg-primary text-white rounded-xl px-6 py-3 font-medium hover:bg-primary-600`) → Opens Agent Form
  - Secondary: "Weiter im Chat 💬" (`bg-gray-100 text-gray-700 rounded-xl px-6 py-3 font-medium hover:bg-gray-200`) → Closes Modal, continues chat
- [ ] Framer Motion slide-up animation

**Files**:
- `teacher-assistant/frontend/src/components/AgentConfirmationModal.tsx`
- `teacher-assistant/frontend/src/lib/motion-tokens.ts` (use `slideUp` animation)

**Testing**:
```bash
# Visual regression test
npx playwright test e2e-tests/agent-confirmation-gemini.spec.ts
# Take screenshot, compare to Gemini prototype
```

---

### 🔧 TASK-010: Add "Neu generieren" button to AgentResultView
**Priority**: P1 | **Effort**: M (1.5 hours) | **Agent**: Frontend

**Description**:
Add re-generation button to preview modal to regenerate with same parameters.

**Acceptance Criteria**:
- [ ] Button added in footer (next to "Weiter im Chat"):
  ```tsx
  <button
    onClick={handleRegenerate}
    className="flex-1 border border-primary text-primary rounded-xl px-4 py-3 font-medium hover:bg-primary-50"
  >
    <IonIcon icon={refresh} className="inline mr-2" />
    Neu generieren
  </button>
  ```
- [ ] `handleRegenerate` function:
  ```typescript
  const handleRegenerate = () => {
    // Store current formData
    const currentParams = {
      description: state.result?.metadata?.original_prompt,
      imageStyle: state.result?.metadata?.style
    };

    // Re-open agent form with prefilled data
    openAgentModal('image-generation', currentParams);
  };
  ```
- [ ] New image generated → Both saved to library
- [ ] Both images appear in chat history

**Files**:
- `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- `teacher-assistant/frontend/src/lib/AgentContext.tsx`

**Testing**:
```typescript
// Generate image
// Preview opens
// Click "Neu generieren"
// Form opens with same params
// Submit
// Both images in library + chat
```

---

### 🔧 TASK-011: Store original params for re-generation
**Priority**: P1 | **Effort**: S (30 min) | **Agent**: Backend

**Description**:
Include original user parameters in response metadata for re-generation.

**Acceptance Criteria**:
- [ ] Response includes:
  ```typescript
  metadata: {
    ...existing,
    original_prompt: imageParams.prompt, // Before enhancement
    style: imageParams.style,
    aspectRatio: imageParams.aspectRatio || '1:1'
  }
  ```
- [ ] Frontend stores in `state.result.metadata`

**Files**:
- `teacher-assistant/backend/src/routes/langGraphAgents.ts`

**Testing**:
```bash
# Generate image
curl ... | jq '.metadata.original_prompt'
# Should return user's original prompt (not enhanced)
```

---

## Phase 4: Testing & QA (3-4 hours)

### 🧪 TASK-012: E2E test for full image generation flow
**Priority**: P0 | **Effort**: M (1.5 hours) | **Agent**: QA

**Description**:
Comprehensive E2E test covering entire flow from chat to library.

**Acceptance Criteria**:
- [ ] Test covers:
  1. Send chat message "Erstelle Bild von Baum"
  2. Agent confirmation appears (Gemini style)
  3. Click "Ja" → Form opens with "Baum" prefilled
  4. Submit → Progress view
  5. Result view appears with image
  6. Click "Weiter im Chat" → Image in chat
  7. Navigate to Library → Image in "Bilder" tab
  8. Click image → Preview opens
- [ ] All steps pass without errors
- [ ] Screenshots saved for each step

**Files**:
- `teacher-assistant/frontend/e2e-tests/image-generation-full-flow.spec.ts`

**Testing**:
```bash
npx playwright test e2e-tests/image-generation-full-flow.spec.ts --headed
```

---

### 🧪 TASK-013: E2E test for re-generation
**Priority**: P1 | **Effort**: M (1 hour) | **Agent**: QA

**Description**:
Test re-generation workflow and verify both images saved.

**Acceptance Criteria**:
- [ ] Generate first image (realistic style)
- [ ] Click "Neu generieren" in preview
- [ ] Form pre-filled with same params
- [ ] Generate second image
- [ ] Verify both images in Library (count = 2)
- [ ] Verify both images in Chat (2 assistant messages with images)

**Files**:
- `teacher-assistant/frontend/e2e-tests/image-regeneration.spec.ts`

**Testing**:
```bash
npx playwright test e2e-tests/image-regeneration.spec.ts
```

---

### 🧪 TASK-014: Backend style mapping verification
**Priority**: P0 | **Effort**: S (30 min) | **Agent**: Backend

**Description**:
Verify all 4 styles map correctly to DALL-E 3 parameters.

**Acceptance Criteria**:
- [ ] Test `realistic` → logs show "natural" + "realistic illustration"
- [ ] Test `cartoon` → logs show "vivid" + "cartoon style"
- [ ] Test `illustrative` → logs show "natural" + "educational illustration"
- [ ] Test `abstract` → logs show "vivid" + "abstract art"
- [ ] All 4 tests pass

**Files**:
- `teacher-assistant/backend/src/agents/imageGenerationAgent.test.ts`

**Testing**:
```typescript
describe('Style Mapping', () => {
  test('realistic maps to natural', async () => {
    const result = await agent.execute({ style: 'realistic', prompt: 'test' }, userId);
    expect(result.metadata.dalle_style).toBe('natural');
    expect(result.data.enhanced_prompt).toContain('realistic illustration');
  });

  // ... 3 more tests
});
```

---

### 🧪 TASK-015: Visual regression tests for Gemini styling
**Priority**: P1 | **Effort**: M (1 hour) | **Agent**: Frontend / QA

**Description**:
Screenshot-based visual testing for Gemini-style components.

**Acceptance Criteria**:
- [ ] Screenshot: Agent Confirmation Modal (Gemini Style)
- [ ] Screenshot: Progress View (after cleanup)
- [ ] Screenshot: Chat View with Image Message
- [ ] Screenshot: Library "Bilder" Tab
- [ ] Compare to Gemini prototype (manual visual inspection)

**Files**:
- `teacher-assistant/frontend/e2e-tests/visual-regression/image-generation.spec.ts`

**Testing**:
```bash
npx playwright test e2e-tests/visual-regression/image-generation.spec.ts
# Screenshots saved to playwright-report/screenshots/
```

---

## Additional Tasks

### 📝 TASK-016: Update API documentation
**Priority**: P2 | **Effort**: S (30 min) | **Agent**: Backend

**Description**:
Update API docs to reflect new response structure.

**Acceptance Criteria**:
- [ ] Document `library_id` in response
- [ ] Document `message_id` in response
- [ ] Document `metadata.original_prompt`
- [ ] Add example response

**Files**:
- `teacher-assistant/backend/README.md` or `/docs/api/`

---

### 📝 TASK-017: Update user documentation
**Priority**: P2 | **Effort**: S (30 min) | **Agent**: QA

**Description**:
Update user guide for new image features.

**Acceptance Criteria**:
- [ ] Document "Bilder" Library tab
- [ ] Document chat integration (images appear in chat)
- [ ] Document re-generation workflow
- [ ] Add screenshots

**Files**:
- `/docs/guides/bildgenerierung.md`

---

### 🔧 TASK-018: Handle image URL expiry gracefully
**Priority**: P2 | **Effort**: S (1 hour) | **Agent**: Frontend

**Description**:
Show fallback UI if DALL-E URL expires (after ~1 hour).

**Acceptance Criteria**:
- [ ] Detect image load error (404 or CORS)
- [ ] Show placeholder: "Bild abgelaufen. Neu generieren?"
- [ ] Link to re-generation with same params

**Files**:
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`

**Testing**:
```typescript
// Mock expired URL
<img src="expired-url" onError={handleExpiry} />
// Verify fallback UI appears
```

---

### 🔧 TASK-019: Add loading states for Library images
**Priority**: P2 | **Effort**: S (30 min) | **Agent**: Frontend

**Description**:
Add skeleton loading for Library image grid.

**Acceptance Criteria**:
- [ ] Show 6 skeleton cards while loading
- [ ] Replace with actual images when loaded
- [ ] Smooth fade-in animation

**Files**:
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`

**Testing**:
```typescript
// Navigate to Library
// Verify skeletons appear
// Wait for images to load
// Verify smooth transition
```

---

### 🔧 TASK-020: Optimize chat scroll performance
**Priority**: P3 | **Effort**: M (1 hour) | **Agent**: Frontend

**Description**:
Ensure chat remains smooth with many images.

**Acceptance Criteria**:
- [ ] Lazy load images with `loading="lazy"`
- [ ] Implement virtualization if > 50 messages
- [ ] Test with 20 image messages (smooth scroll)

**Files**:
- `teacher-assistant/frontend/src/components/ChatView.tsx`

**Testing**:
```typescript
// Generate 20 images
// Scroll chat up/down
// Measure FPS (should be > 30fps)
```

---

### 🔧 TASK-021: Add error handling for failed image saves
**Priority**: P1 | **Effort**: S (30 min) | **Agent**: Backend

**Description**:
Handle errors when saving to library_materials or messages fails.

**Acceptance Criteria**:
- [ ] Try-catch around InstantDB writes
- [ ] Log errors: `logError('Failed to save to library', error)`
- [ ] Return partial success (image generated, but not saved to library)
- [ ] Frontend shows warning: "Bild generiert, aber nicht in Bibliothek gespeichert"

**Files**:
- `teacher-assistant/backend/src/routes/langGraphAgents.ts`

**Testing**:
```typescript
// Mock InstantDB error
// Verify error logged
// Verify user gets meaningful error message
```

---

### 🔧 TASK-022: Add "Favorit" toggle for images in Library
**Priority**: P3 | **Effort**: S (30 min) | **Agent**: Frontend

**Description**:
Allow users to favorite images in Library.

**Acceptance Criteria**:
- [ ] Heart icon on each image thumbnail
- [ ] Click → Toggle `is_favorite` in InstantDB
- [ ] Filter: "Favoriten" shows only favorites
- [ ] Visual feedback (filled heart vs outline)

**Files**:
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`

**Testing**:
```typescript
// Click heart on image
// Verify InstantDB updated
// Filter by "Favoriten"
// Verify image appears
```

---

### 🧪 TASK-023: Test edge cases
**Priority**: P1 | **Effort**: M (1 hour) | **Agent**: QA

**Description**:
Test unusual inputs and edge cases.

**Acceptance Criteria**:
- [ ] Very long prompt (500 characters) → Truncate or error
- [ ] Special characters in prompt (emoji, umlauts) → Works correctly
- [ ] Rapid re-generation (click "Neu generieren" 3x fast) → No duplicates
- [ ] Generate while offline → Graceful error
- [ ] Generate with expired auth → Re-login prompt

**Files**:
- `teacher-assistant/frontend/e2e-tests/image-generation-edge-cases.spec.ts`

**Testing**:
```bash
npx playwright test e2e-tests/image-generation-edge-cases.spec.ts
```

---

### 📝 TASK-024: Code review and cleanup
**Priority**: P0 | **Effort**: M (1 hour) | **Agent**: QA / Lead Developer

**Description**:
Final code review before merging to main.

**Acceptance Criteria**:
- [ ] All console.log statements reviewed (keep debugging ones, remove verbose)
- [ ] TypeScript types correct (no `any`)
- [ ] No unused imports
- [ ] Comments added for complex logic
- [ ] All TODOs addressed or documented in backlog
- [ ] Code follows project style guide (ESLint passes)

**Testing**:
```bash
npm run lint
npm run type-check
```

---

## Task Dependencies

```
TASK-001 ─┐
TASK-002 ─┼─> PHASE 1 COMPLETE
TASK-003 ─┘

TASK-004 ─┐
TASK-005 ─┼─> PHASE 2 COMPLETE ──> TASK-012 (E2E Test)
TASK-006 ─┤
TASK-007 ─┤
TASK-008 ─┘

TASK-009 ─┐
TASK-010 ─┼─> PHASE 3 COMPLETE ──> TASK-013 (Re-gen Test)
TASK-011 ─┘

TASK-012 ─┐
TASK-013 ─┼─> PHASE 4 COMPLETE
TASK-014 ─┤
TASK-015 ─┘

TASK-016-024 ─> OPTIONAL / POLISH
```

---

## Task Assignment Recommendations

### Frontend Agent Tasks
- TASK-001, TASK-002, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-018, TASK-019, TASK-020, TASK-022

### Backend Agent Tasks
- TASK-003, TASK-004, TASK-005, TASK-011, TASK-014, TASK-016, TASK-021

### QA Agent Tasks
- TASK-012, TASK-013, TASK-015, TASK-017, TASK-023, TASK-024

### Emotional Design Agent Tasks
- TASK-009 (Gemini styling - collaborate with Frontend)

---

## Sprint Planning

### Sprint 1 (Week 1): Core Functionality
**Focus**: Get images into Library and Chat (P0 tasks)

**Tasks**: TASK-001 to TASK-008, TASK-012, TASK-014, TASK-021
**Estimated**: 12-14 hours
**Deliverable**: Images appear in Library + Chat after generation

### Sprint 2 (Week 2): UX Polish & Re-Generation
**Focus**: Gemini styling, re-generation, edge cases (P1 tasks)

**Tasks**: TASK-009 to TASK-011, TASK-013, TASK-015, TASK-018, TASK-023, TASK-024
**Estimated**: 8-10 hours
**Deliverable**: Polished UI, re-generation works, all tests pass

### Sprint 3 (Optional): Nice-to-Haves
**Focus**: Performance, favorites, documentation (P2-P3 tasks)

**Tasks**: TASK-016, TASK-017, TASK-019, TASK-020, TASK-022
**Estimated**: 4-5 hours
**Deliverable**: Optimized, documented, production-ready

---

## Done Criteria (Definition of Done)

A task is considered **DONE** when:

- ✅ Code implemented and self-reviewed
- ✅ Unit tests written and passing
- ✅ E2E tests passing (if applicable)
- ✅ Visual verification with Playwright screenshot (UI tasks)
- ✅ Code reviewed by peer
- ✅ No ESLint/TypeScript errors
- ✅ Documentation updated (if applicable)
- ✅ Tested on mobile AND desktop
- ✅ Session log created in `/docs/development-logs/`

---

## Progress Tracking

Update this section as tasks are completed:

**Phase 1**: ⬜ 0/3 tasks completed
**Phase 2**: ⬜ 0/5 tasks completed
**Phase 3**: ⬜ 0/3 tasks completed
**Phase 4**: ⬜ 0/4 tasks completed
**Additional**: ⬜ 0/9 tasks completed

**Overall Progress**: ⬜ 0/24 tasks (0%)

---

## Notes

- Start with Phase 1 (Quick Wins) to get immediate UX improvements
- Phase 2 is critical path - prioritize over Phase 3 if time constrained
- TASK-012 (E2E test) should be run after every phase to catch regressions
- Visual screenshots should be saved to `/teacher-assistant/frontend/` for documentation
- All backend changes should be tested with curl before frontend integration

---

**Last Updated**: 2025-10-04
**Next Review**: After Phase 1 completion
