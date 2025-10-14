# Tasks: Agent Confirmation UX + Auto-Tagging

**Input**: Design documents from `specs/003-agent-confirmation-ux/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, research.md ✅, quickstart.md ✅, contracts/ ✅

**Tests**: E2E tests explicitly requested in spec.md (SC-010: ≥90% pass rate required)

**Organization**: Tasks grouped by user story for independent implementation and testing

**Status**: ⏳ IN PROGRESS (US1 ✅ US3 ✅ US4 ✅ US6 ✅ Complete | US2 ⏳ Next | Manual Testing Phase - 2025-10-14)

---

## 📋 NEXT STEPS BEFORE IMPLEMENTATION

### Manual Testing Phase (Do This First!)
Before starting implementation tasks, manually test all remaining user stories to identify what already works:

**Test Order**:
1. [⚠️] **US2 (Library Navigation)** - Code analysis: "In Library öffnen" button exists BUT doesn't pass materialId or auto-open modal - NEEDS IMPLEMENTATION
2. [✅] **US4 (MaterialPreviewModal Content)** - ✅ **COMPLETE** (2025-10-14) - Modal visibility fixed, UX improved, all content rendering - READY FOR E2E TESTS
3. [✅] **US6 (Session Persistence)** - Already verified working (backend logs show sessionId propagates)
4. [❌] **US5 (Automatic Tagging)** - Requires backend implementation (Vision API endpoint doesn't exist yet) - Skip for now

**Why Manual Test First?**
- US3 was already working when tested (backend implemented, just needed styling fix)
- Manual testing takes 5-10 minutes vs. hours of implementation
- Identifies what needs implementation vs. what just needs E2E tests

**After Manual Testing**: Document results in this file, then start implementation tasks for features that DON'T work.

---

## 🧪 MANUAL TEST RESULTS (2025-10-14)

### Test 1: US2 - Library Navigation after Image Generation

**Test Procedure**: Generate image → Click "In Library öffnen" button in AgentResultView → Observe result

**Results**:
- ✅ Library tab opens successfully
- ❌ **Library shows "Chats" tab instead of "Materials" tab**
- ❌ **MaterialPreviewModal does NOT auto-open with new image**
- ❌ No `[Library] Received navigate-library-tab event:` in console

**Root Cause Analysis**:
1. **Missing Event Dispatch** (File: `AgentResultView.tsx`, line ~356-390)
   - Current: `handleOpenInLibrary()` only calls `navigateToTab('library')`
   - Missing: No `window.dispatchEvent(new CustomEvent('navigate-library-tab', {...}))` call
   - Impact: Library doesn't know which tab to show or which material to open

2. **Missing materialId Parameter** (File: `langGraphAgents.ts`, backend)
   - Current: Backend returns `library_id` in agent result
   - Status: Backend logs show `libraryMaterialId: 0e457ee7-ea5c-4519-9e1d-a01d3d7d41fa`
   - Question: Does `state.result?.data?.library_id` exist in frontend? Need verification.

3. **Event Handler Missing Modal Open** (File: `Library.tsx`, line ~114-129)
   - Current: Event handler only switches tab to 'artifacts'
   - Missing: No code to find material by ID and open modal
   - Impact: Even if event fired with materialId, modal wouldn't auto-open

**What Needs Implementation**:
- [T014] Add event dispatch in `AgentResultView.tsx` handleOpenInLibrary:
  ```tsx
  const materialId = state.result?.data?.library_id || state.result?.metadata?.library_id;
  window.dispatchEvent(new CustomEvent('navigate-library-tab', {
    detail: { tab: 'materials', materialId, source: 'AgentResultView' }
  }));
  ```
- [T015] Extend Library event handler to handle materialId:
  ```tsx
  if (customEvent.detail?.materialId) {
    const material = materials.find(m => m.id === customEvent.detail.materialId);
    if (material) {
      setSelectedMaterial(convertArtifactToUnifiedMaterial(material));
      setIsModalOpen(true);
    }
  }
  ```
- [T016] Verify backend returns library_id in correct location (may already be done)

---

### Test 2: US4 - MaterialPreviewModal Content Display

**Test Procedure**: Navigate to Library → Click "Materialien" tab → Click image material card → Observe modal

**Results (2025-10-14 - FIXED)**:
- ✅ Modal opens successfully (IonModal component renders)
- ✅ **Image preview: FULLY VISIBLE (full-size image renders correctly)**
- ✅ **Title: Visible below image with edit functionality**
- ✅ **Metadata: Shows "KI-generiert" and creation date**
- ✅ **Action buttons: All visible (Regenerieren, Download, Favorite, Share, Delete)**

**Fix Applied**: Option A - Replaced IonContent with plain div (bypassed Ionic Shadow DOM height collapse issue)
**File Modified**: `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`
**Status**: ✅ **RESOLVED** - All modal content rendering correctly, UX improved per user feedback

---

### 🎯 ROOT CAUSE CONFIRMED (Debug Session 2025-10-14)

**Debug Output Analysis**:

```javascript
// Raw artifact from InstantDB (useLibraryMaterials hook)
{
  id: 'd3281a21-ac75-4a4a-980a-a140340dd9a3',
  title: 'einem Löwen für den Biologie-Unterricht',
  type: 'image',
  description: 'https://instant-storage.s3.amazonaws.com/...',  // ✅ URL is present
  source: 'chat_generated',
  metadata: undefined,  // ❌ ROOT CAUSE - Not parsed from JSON string!
  is_favorite: false
}

// After convertArtifactToUnifiedMaterial() mapper
{
  type: 'image',  // ✅ Correct
  source: 'agent-generated',  // ✅ Correct mapping
  title: 'einem Löwen für den Biologie-Unterricht',  // ✅ Correct
  metadata: {
    artifact_data: {
      url: 'https://instant-storage.s3.amazonaws.com/...'  // ✅ Correctly created from description
    },
    image_data: undefined,  // ⚠️ Missing
    agent_name: undefined   // ❌ Missing - Should be 'Bildgenerierungs-Agent' or similar
  }
}
```

**Root Cause Identified**:
- **File**: `teacher-assistant/frontend/src/hooks/useLibraryMaterials.ts` (line ~50-60)
- **Issue**: InstantDB stores `metadata` as a JSON string: `'{"originalParams": {...}, "agent_name": "Bildgenerierungs-Agent"}'`
- **Problem**: Hook passes `metadata` field directly to mapper WITHOUT parsing the JSON string
- **Result**: Mapper receives `undefined` instead of parsed object
- **Impact**:
  - MaterialPreviewModal rendering conditions fail (metadata.artifact_data exists but metadata.agent_name doesn't)
  - Modal shows no content because conditions at line 270 and 279 are too strict

**What Mapper SHOULD Receive**:
```javascript
metadata: {
  originalParams: { description: "...", imageStyle: "...", ... },
  agent_name: "Bildgenerierungs-Agent",
  agent_id: "image-generation",
  createdAt: 1729123456789
}
```

**What Mapper ACTUALLY Receives**: `undefined`

---

### 🔧 SOLUTION (Ready to Implement)

**File to Modify**: `teacher-assistant/frontend/src/hooks/useLibraryMaterials.ts`

**Line to Fix**: Around line 50-60 (where materials are mapped from InstantDB query result)

**Code Change**:
```typescript
// BEFORE (current broken code)
const material = {
  ...rawMaterial,
  metadata: rawMaterial.metadata  // ❌ JSON string not parsed
};

// AFTER (correct implementation)
let parsedMetadata = undefined;
if (rawMaterial.metadata) {
  try {
    parsedMetadata = typeof rawMaterial.metadata === 'string'
      ? JSON.parse(rawMaterial.metadata)
      : rawMaterial.metadata;  // Handle if already an object
  } catch (error) {
    console.warn('[useLibraryMaterials] Failed to parse metadata for material:', rawMaterial.id, error);
    parsedMetadata = {};  // Graceful fallback
  }
}

const material = {
  ...rawMaterial,
  metadata: parsedMetadata  // ✅ Parsed object
};
```

**Why This Fixes US4**:
1. Mapper will receive `metadata.agent_name` → Modal can display Agent field
2. Mapper will receive `metadata.originalParams` → Regenerate button works
3. Modal rendering conditions will pass → Image, metadata, and buttons all render

**Testing Plan**:
1. Apply fix to `useLibraryMaterials.ts`
2. Refresh Library page
3. Click material card → Modal should show full content
4. Write Playwright E2E test to verify fix persists

---

## ✅ Verified Working (Code Analysis + Manual Testing 2025-10-14)
- **US1 (Agent Confirmation Card)**: ✅ FIXED - Tailwind v4 @theme directive added to index.css, orange gradient and buttons now render correctly
- **US3 (Images in Chat)**: Backend creates image messages with metadata, frontend renders thumbnails correctly (200px), message ordering correct, sessionId propagates
- **US4 (MaterialPreviewModal Content)**: ✅ **FULLY WORKING** - Modal visibility fixed via Option A (plain div workaround), image preview renders, metadata simplified (AI-generated + date), all action buttons working (Regenerate/Download/Favorite/Share/Delete), UX improved with title below image
- **US6 (Session Persistence)**: Backend logs confirm sessionId maintained across agent workflow (no new sessions created)
- **Image Thumbnail Sizing**: Fixed to 200px (ChatGPT-style inline thumbnails)
- **Message Ordering**: Chronological sorting verified correct

## 🔧 Root Cause Fixed - US1

**Issue**: Tailwind custom colors not compiling
**Root Cause**: Tailwind v4 requires `@theme` directive in CSS, not `tailwind.config.js`
**Fix Applied**: Added `@theme` block to `index.css` with primary color scale
**File Modified**: `teacher-assistant/frontend/src/index.css` (lines 4-16)
**Status**: ✅ RESOLVED - User confirmed working (orange gradient, buttons visible with proper contrast)

---

## 🔧 Implementation Status (Updated 2025-10-14 After Debug Session)

### ✅ DEBUG COMPLETE - Root Causes Identified for US2 and US4

### Priority 1: US2 - Library Navigation (READY TO IMPLEMENT)
- **Status**: ✅ Root cause identified, clear implementation path
- **Root Cause**: Missing event dispatch with materialId in AgentResultView.tsx
- **Required Tasks**: T014 (event dispatch), T015 (event handler), T016 (verify backend)
- **Estimate**: 30-45 minutes
- **Blocker**: None

### Priority 2: US4 - MaterialPreviewModal Content ✅ COMPLETE
- **Status**: ✅ **IMPLEMENTED AND VERIFIED** - User confirmed working (2025-10-14)
- **Root Cause**: IonContent Shadow DOM height collapse (0px height despite 570px content)
- **Fix Applied**: Option A - Replaced IonContent with plain `<div>` styled with `maxHeight: 80vh` and `overflowY: auto`
- **UX Improvements**:
  - Title moved from header to below image with edit button
  - Metadata simplified: Shows only "KI-generiert" (if AI) and creation date
  - Removed: Type and Agent fields (per user request)
- **File Modified**: `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx` (lines 235-377)
- **Next Step**: Write E2E test (T027-T028) to verify fix persists

### E2E Tests
- **Status**: Not yet created (T012-T013, T027-T028)
- **Dependency**: Should be written AFTER US2+US4 fixes confirmed working manually

### Recommended Implementation Order (with Playwright E2E):
1. ✅ **DEBUG US4**: Debug logging added → Manual test executed → Root cause confirmed (metadata parsing)
2. **FIX US2**: Implement T014-T016 (event dispatch + handler) + Write Playwright E2E test `library-navigation.spec.ts`
3. **FIX US4**: Implement metadata parsing in useLibraryMaterials.ts + Write Playwright E2E test `material-preview-modal.spec.ts`
4. **E2E VERIFICATION**: Run both Playwright tests together to verify US2+US4 integration
5. **COMMIT**: Git commit with passing E2E tests as evidence

### Playwright E2E Test Strategy (Test-After Pattern):
Each fix follows this pattern:
```
1. Implement fix → Manual verification
2. Write Playwright E2E test that verifies the fix
3. Run E2E test → Should PASS on first run (proves fix works)
4. Commit code + test together
```

**Why Test-After (not Test-First) for this feature:**
- Manual testing already identified what works/doesn't work
- Fixes have clear acceptance criteria from manual tests
- E2E tests serve as regression prevention, not discovery
- Faster iteration: Fix → Verify → Automate (vs Write → Fail → Fix → Pass)

**E2E Tests to Create:**
- `library-navigation.spec.ts` - US2: Verifies "In Library öffnen" → Materials tab + modal auto-open
- `material-preview-modal.spec.ts` - US4: Verifies modal content renders (image, metadata, buttons)
- `library-navigation-integration.spec.ts` - Combined: Full workflow from image generation to Library modal

## Format: `[ID] [P?] [AGENT:type] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[AGENT:frontend]**: Assigned to react-frontend-developer
- **[AGENT:backend]**: Assigned to backend-node-developer
- **[AGENT:qa]**: Assigned to qa-integration-reviewer (testing tasks)
- **[Story]**: User story label (US1, US2, US3, US4, US5, US6)
- Paths use monorepo structure: `teacher-assistant/frontend/` or `teacher-assistant/backend/`

## Verification Protocol (ALL Implementation Tasks)
Before marking ANY task ✅ complete, MUST show evidence:
1. ✅ Build output: `npm run build` → 0 errors
2. ✅ Test results: Relevant tests pass
3. ✅ Manual verification: Screenshot/log of feature working
4. ✅ Pre-commit: `git add . && git commit -m "test"` succeeds

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TypeScript interfaces and utilities used by all bug fixes

- [ ] T001 [P] [AGENT:frontend] Create metadata types in `teacher-assistant/frontend/src/types/metadata.ts`
  - Define MessageMetadata interface (type, image_url, thumbnail_url, title, originalParams, agentSuggestion)
  - Define LibraryMaterialMetadata interface (type, tags, tagging, originalParams, agent metadata)
  - Define LibraryNavigationEvent interface (tab, materialId, source)
  - Define AgentContextState interface (activeAgent, isModalOpen, sessionId, prefillData)
  - Export type guards: isImageMessage, hasRegenParams, hasTags
  - **Verify**: `npm run build` (0 errors), import types in test file, pre-commit passes
- [ ] T002 [P] [AGENT:frontend] Create ImageMessage component in `teacher-assistant/frontend/src/components/ImageMessage.tsx`
  - Functional component for rendering image thumbnails in chat
  - Props: imageUrl, thumbnailUrl?, title, onClick?
  - Use proxied image URL via imageProxy.ts
  - Clickable thumbnail opens full-size preview
  - Responsive layout (mobile/desktop)
  - **Verify**: `npm run build` (0 errors), render in storybook/browser, screenshot, pre-commit passes

**Checkpoint**: Shared types and components ready for all user stories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend Vision API setup - MUST be complete before User Story 5 (auto-tagging)

**⚠️ CRITICAL**: User Story 5 cannot begin until Vision service is ready. All other stories are independent.

- [ ] T003 [AGENT:backend] Create Vision service in `teacher-assistant/backend/src/services/visionService.ts`
  - Method: `async tagImage(imageUrl: string, context?: object): Promise<string[]>`
  - OpenAI GPT-4o integration with vision capabilities
  - Prompt template for educational tagging (5-10 tags in German)
  - Tag normalization: lowercase, deduplicate, max 15 tags
  - Error handling: timeout after 30s, graceful degradation
  - Return confidence level: 'high' | 'medium' | 'low'
  - **Verify**: Backend build (0 errors), unit test with mock OpenAI, log output, pre-commit passes
- [ ] T004 [AGENT:backend] Create Vision API route in `teacher-assistant/backend/src/routes/visionTagging.ts`
  - POST /api/vision/tag-image endpoint
  - Request body: { imageUrl, context?: { title, description, subject, grade } }
  - Response: { tags, confidence, model, processingTime }
  - Rate limiting: 100/hour, 10/min per user
  - Error responses: 400, 401, 404, 429, 500, 503 per contracts/vision-tagging-api.md
  - **Verify**: Backend build (0 errors), curl/Postman test, response format matches contract, pre-commit passes
- [ ] T005 [AGENT:backend] Register Vision routes in `teacher-assistant/backend/src/server.ts`
  - Import visionTagging routes
  - Mount at /api/vision
  - Add CORS middleware
  - Add authentication middleware
  - **Verify**: Backend build (0 errors), server starts, /api/vision endpoint accessible, pre-commit passes

**Checkpoint**: Vision API ready for User Story 5. Other stories can proceed in parallel.

---

## Phase 3: User Story 1 - Agent Confirmation Card Visibility (Priority: P1) 🎯 MVP

**Goal**: Fix white-on-white rendering by enhancing contrast with shadows and rings

**Independent Test**: Chat with AI → Ask for image creation → Agent Confirmation Card visible with orange gradient, readable text, two distinct buttons

### E2E Tests for User Story 1

**NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [ ] T006 [AGENT:qa] [US1] Create E2E test in `teacher-assistant/frontend/tests/e2e/agent-confirmation-visibility.spec.ts`
  - Test Step 1: Send message "Erstelle ein Bild von einem Löwen"
  - Test Step 2: Wait for Agent Confirmation Card to appear
  - Test Step 3: Verify card has visible gradient background (bg-gradient-to-r from-primary-50 to-primary-100)
  - Test Step 4: Verify card has orange border (border-primary-500)
  - Test Step 5: Verify card has shadow (shadow-lg)
  - Test Step 6: Verify both buttons visible ("Bild-Generierung starten" orange, "Weiter im Chat" gray)
  - Test Step 7: Check WCAG contrast ratio ≥4.5:1 for text
  - Use data-testid selectors for reliability
  - Timeout: 30s for full workflow
- [ ] T007 [AGENT:qa] [US1] Run E2E test to verify it FAILS
  - Run: `cd teacher-assistant/frontend && VITE_TEST_MODE=true npx playwright test agent-confirmation-visibility.spec.ts`
  - Expected: Test fails at Step 3 or Step 5 (insufficient contrast/shadow)
  - Take screenshot of failure for documentation

### Implementation for User Story 1

- [ ] T008 [AGENT:frontend] [US1] Enhance AgentConfirmationMessage styling in `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx`
  - Add shadow to card: `shadow-lg` (line ~254)
  - Add ring to primary button: `ring-2 ring-white ring-offset-2` (line ~278)
  - Ensure gradient classes present: `bg-gradient-to-r from-primary-50 to-primary-100`
  - Ensure border classes present: `border-2 border-primary-500`
  - Verify button classes: primary (`bg-primary-600 text-white`), secondary (`bg-gray-100 text-gray-700`)
  - Test hover states: `hover:bg-primary-700`, `hover:bg-gray-200`
  - **Verify**: Frontend build (0 errors), inspect in browser (screenshot), contrast validated, pre-commit passes
- [ ] T009 [AGENT:frontend] [US1] Add responsive layout for mobile in AgentConfirmationMessage.tsx
  - Buttons stack vertically on mobile: `flex-col sm:flex-row`
  - Ensure touch-friendly button heights: `h-12` (48px minimum)
  - Test viewport widths: 390px (mobile), 768px (tablet), 1024px (desktop)
  - Verify no horizontal scroll on narrow viewports
  - **Verify**: Frontend build (0 errors), mobile/desktop screenshots, pre-commit passes
- [ ] T010 [AGENT:frontend] [US1] Add data-testid attributes in AgentConfirmationMessage.tsx
  - Card: `data-testid="agent-confirmation-card"`
  - Primary button: `data-testid="agent-confirm-button"`
  - Secondary button: `data-testid="agent-skip-button"`
  - Reasoning text: `data-testid="agent-reasoning"`
  - **Verify**: Frontend build (0 errors), inspect elements in browser, pre-commit passes
- [ ] T011 [AGENT:qa] [US1] Run E2E test to verify US1 passes
  - Run: `VITE_TEST_MODE=true npx playwright test agent-confirmation-visibility.spec.ts`
  - Expected: All 7 test steps pass
  - Take screenshot of success
  - Document in session log

**Checkpoint**: User Story 1 complete - Agent Confirmation Card visible with proper contrast

---

## Phase 4: User Story 2 - Library Navigation after Image Creation (Priority: P1) 🎯 MVP

**Goal**: Navigate to Library tab with auto-opened MaterialPreviewModal after image generation

**Independent Test**: Generate image → Click "Weiter im Chat" → Verify Library tab active, Materials section visible, Modal showing new image

### E2E Tests for User Story 2

- [ ] T012 [AGENT:qa] [P] [US2] Create E2E test in `teacher-assistant/frontend/tests/e2e/library-navigation.spec.ts`
  - Test: Generate image via agent (reuse helper from US1 test)
  - Test: Click "Weiter im Chat" button in AgentResultView
  - Verify: Tab changes from Chat to Library
  - Verify: Library "Materials" tab is active (not "Chats")
  - Verify: MaterialPreviewModal opens automatically
  - Verify: Modal shows newly created image (full size)
  - Verify: Modal displays title, metadata, action buttons
  - Verify: Custom event fired with correct materialId
- [ ] T013 [AGENT:qa] [US2] Run E2E test to verify it FAILS
  - Expected: Fails because "Weiter im Chat" doesn't pass materialId or modal doesn't auto-open
  - Take screenshot of failure

### Implementation for User Story 2

- [ ] T014 [AGENT:frontend] [US2] Extend navigate-library-tab event in `teacher-assistant/frontend/src/components/AgentResultView.tsx`
  - Locate "Weiter im Chat" button onClick handler (line ~187-191)
  - Dispatch custom event with materialId parameter:
    ```tsx
    window.dispatchEvent(new CustomEvent('navigate-library-tab', {
      detail: {
        tab: 'materials',
        materialId: materialId, // From agent result
        source: 'AgentResultView'
      }
    }));
    ```
  - Import materialId from agent execution result
  - Add console log: `[Event] Library navigation: tab=materials, materialId=${materialId}`
- [ ] T015 [AGENT:frontend] [US2] Update Library event handler in `teacher-assistant/frontend/src/pages/Library/Library.tsx`
  - Locate navigate-library-tab listener (line ~114-129)
  - Extend handler to process materialId parameter
  - If materialId provided: Find material in materials array
  - Convert to UnifiedMaterial via convertArtifactToUnifiedMaterial
  - Set selectedMaterial state and open modal (setIsModalOpen(true))
  - Add console log: `[Library] Opening modal for material: ${materialId}`
  - Add error handling: If material not found, log warning and skip modal open
- [ ] T016 [AGENT:backend] [US2] Add materialId to AgentResult metadata in `teacher-assistant/backend/src/routes/langGraphAgents.ts`
  - After image generation success (line ~347)
  - After creating library_materials entry
  - Return materialId in agent response JSON
  - Ensure materialId propagates to AgentResultView component
  - **Verify**: Backend build (0 errors), test API response includes materialId, pre-commit passes
- [ ] T017 [AGENT:qa] [US2] Run E2E test to verify US2 passes
  - Run: `VITE_TEST_MODE=true npx playwright test library-navigation.spec.ts`
  - Verify: Library navigation works
  - Verify: Modal opens with correct image
  - Take screenshot of success

**Checkpoint**: User Story 2 complete - Library navigation with auto-open modal works

---

## Phase 5: User Story 3 - Image in Chat History (Priority: P1) 🎯 MVP

**Goal**: Display generated images as thumbnails in chat with Vision context support

**Independent Test**: Generate image → Return to chat → Verify image appears as thumbnail, chat session persists, Vision context works ("Was zeigt das Bild?")

### E2E Tests for User Story 3

- [ ] T018 [AGENT:qa] [US3] Create E2E test in `teacher-assistant/frontend/tests/e2e/chat-image-integration.spec.ts`
  - Test: Generate image via agent
  - Test: Navigate back to Chat tab
  - Verify: Image message visible in chat history
  - Verify: Message has thumbnail (not just text)
  - Verify: Caption/title displayed
  - Verify: Thumbnail is clickable
  - Test: Send message "Was zeigt das Bild?"
  - Verify: AI response demonstrates vision analysis (mentions specific image content)
  - Verify: sessionId remains same before/after agent
  - Verify: All previous messages still visible (history preserved)
- [ ] T019 [AGENT:qa] [US3] Run E2E test to verify it FAILS
  - Expected: Fails because image message not created or not rendered
  - Take screenshot of empty chat history

### Implementation for User Story 3

- [ ] T020 [AGENT:backend] [US3] Create image message after generation in `teacher-assistant/backend/src/routes/langGraphAgents.ts`
  - After image saved to library_materials (line ~347)
  - Create new message in InstantDB with role: 'assistant'
  - Populate metadata as JSON string:
    ```json
    {
      "type": "image",
      "image_url": "https://...",
      "thumbnail_url": "https://...",
      "title": "Anatomischer Löwe",
      "originalParams": { description, imageStyle, learningGroup, subject }
    }
    ```
  - Use current sessionId (NOT new session)
  - Calculate correct message_index (query last message + 1)
  - Link to user and session via InstantDB links
- [ ] T021 [AGENT:frontend] [US3] Update ChatView to render image messages in `teacher-assistant/frontend/src/components/ChatView.tsx`
  - Parse message.metadata as MessageMetadata
  - Check if metadata.type === 'image'
  - If true: Render ImageMessage component (from T002)
  - Pass props: imageUrl, thumbnailUrl, title
  - Add onClick handler to open full-size preview
  - Maintain existing text message rendering for type !== 'image'
- [ ] T022 [AGENT:frontend] [US3] Pass sessionId to AgentConfirmationMessage in ChatView.tsx
  - Locate AgentConfirmationMessage rendering (line ~XXX)
  - Add sessionId prop: `<AgentConfirmationMessage sessionId={currentSessionId} ... />`
  - Ensure currentSessionId state is available in ChatView
- [ ] T023 [AGENT:frontend] [US3] Update AgentContext to store sessionId in `teacher-assistant/frontend/src/lib/AgentContext.tsx`
  - Add sessionId to state: `const [sessionId, setSessionId] = useState<string | undefined>(undefined)`
  - Update openModal method signature: `openModal(agentType, prefillData?, sessionId?)`
  - Store sessionId when modal opens: `setSessionId(sessionId)`
  - Expose sessionId in context value
  - Clear sessionId when modal closes
- [ ] T024 [AGENT:frontend] [US3] Pass sessionId from AgentConfirmationMessage to AgentContext
  - Update handleConfirm method in AgentConfirmationMessage.tsx
  - Call openModal with sessionId parameter: `openModal(agentType, prefillData, props.sessionId)`
  - Ensure sessionId flows through to agent execution
  - **Verify**: Frontend build (0 errors), console log shows sessionId passed, pre-commit passes
- [ ] T025 [AGENT:backend] [US3] Add Vision context building in `teacher-assistant/backend/src/routes/chat.ts`
  - Locate message array building for OpenAI (line ~XXX)
  - Parse metadata for each message
  - If metadata.type === 'image' and metadata.image_url exists:
    - Convert message to vision format:
      ```json
      {
        "role": "assistant",
        "content": [
          { "type": "text", "text": "Bild wurde erstellt." },
          { "type": "image_url", "image_url": { "url": "https://...", "detail": "low" } }
        ]
      }
      ```
  - If metadata.type !== 'image': Use standard text format
  - Add error handling for expired image URLs (404 → skip image, send text only)
- [ ] T026 [AGENT:qa] [US3] Run E2E test to verify US3 passes
  - Run: `VITE_TEST_MODE=true npx playwright test chat-image-integration.spec.ts`
  - Verify: Image appears in chat
  - Verify: Vision context works
  - Verify: Session persistence maintained
  - Take screenshot of success

**Checkpoint**: User Story 3 complete - Images appear in chat with Vision context

---

## Phase 6: User Story 4 - MaterialPreviewModal Content (Priority: P2)

**Goal**: Fix modal content rendering to show full image preview and action buttons

**Independent Test**: Open Library → Click material card → Verify modal shows image, metadata, buttons (not just title)

### E2E Tests for User Story 4

- [ ] T027 [AGENT:qa] [US4] Create E2E test in `teacher-assistant/frontend/tests/e2e/material-preview-modal.spec.ts`
  - Test: Navigate to Library → Materials tab
  - Test: Click on image material card
  - Verify: Modal opens
  - Verify: Large image preview visible (not placeholder)
  - Verify: Image scales correctly (responsive)
  - Verify: Metadata section visible (Type, Source, Date, Agent)
  - Verify: Action buttons visible (Regenerieren, Download, Favorit, Teilen, Löschen)
  - Test: Click "Regenerieren" → Verify AgentFormView opens with prefilled data
  - Test: Click "Download" → Verify file downloads
  - Test: Mobile scroll → Verify all content reachable
- [ ] T028 [AGENT:qa] [US4] Run E2E test to verify it FAILS
  - Expected: Fails because modal content not rendering
  - Take screenshot of empty modal

### Implementation for User Story 4

- [ ] T029 [AGENT:frontend] [US4] Fix image rendering in `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`
  - Locate image preview section (line ~XXX)
  - Ensure image src uses proxied URL: `getProxiedImageUrl(material.content)`
  - Verify img tag has correct classes for responsive scaling: `max-w-full h-auto`
  - Add loading state: Show skeleton while image loads
  - Add error boundary: If image fails to load (404), show fallback message
  - Verify aspect ratio preserved: `object-contain`
- [ ] T030 [AGENT:frontend] [US4] Fix metadata section rendering in MaterialPreviewModal.tsx
  - Locate metadata section (line ~XXX)
  - Parse metadata JSON: `const metadata = JSON.parse(material.metadata || '{}')`
  - Display fields:
    - Type: `metadata.type || 'image'`
    - Source: "KI-generiert" if metadata.agent_id, else "Hochgeladen"
    - Date: Format createdAt in German (DD.MM.YYYY)
    - Agent: `metadata.agent_name || 'Bildgenerierung'`
  - Add type guards for safe access
  - Handle missing metadata gracefully
- [ ] T031 [AGENT:frontend] [US4] Fix action buttons rendering in MaterialPreviewModal.tsx
  - Verify "Regenerieren" button visible when `metadata.originalParams` exists
  - Verify "Download" button always visible
  - Verify "Favorit" button with correct icon (outline vs filled)
  - Verify "Teilen" button (may be placeholder)
  - Verify "Löschen" button with danger styling
  - Ensure buttons have correct onClick handlers
- [ ] T032 [AGENT:frontend] [US4] Add modal scroll support for mobile
  - Ensure modal content div is scrollable: `overflow-y-auto max-h-[90vh]`
  - Fix sticky header (close button always visible): `sticky top-0`
  - Test on narrow viewports (390px width)
  - Verify all buttons reachable after scroll
  - **Verify**: Frontend build (0 errors), test on mobile viewport (screenshot), pre-commit passes
- [ ] T033 [AGENT:qa] [US4] Run E2E test to verify US4 passes
  - Run: `VITE_TEST_MODE=true npx playwright test material-preview-modal.spec.ts`
  - Verify: All modal content renders
  - Verify: All buttons work
  - Take screenshot of success

**Checkpoint**: User Story 4 complete - MaterialPreviewModal shows full content

---

## Phase 7: User Story 5 - Automatic Image Tagging (Priority: P2)

**Goal**: Automatically generate 5-10 searchable tags per image via Vision API

**Independent Test**: Generate image → Wait 5s → Verify tags saved to metadata → Search by tag → Verify image appears in results

**Dependencies**: Requires Phase 2 (Vision API) to be complete

### E2E Tests for User Story 5

- [ ] T034 [AGENT:qa] [US5] Create E2E test in `teacher-assistant/frontend/tests/e2e/automatic-tagging.spec.ts`
  - Test: Generate image with specific description ("Anatomischer Löwe für Biologieunterricht")
  - Test: Wait 5 seconds for Vision API tagging
  - Verify: Backend logs show Vision API call
  - Verify: InstantDB material record updated with tags array
  - Verify: 5-10 tags generated, all lowercase, no duplicates
  - Test: Search Library for one tag (e.g., "anatomie")
  - Verify: Material appears in search results
  - Verify: Tags NOT visible in MaterialPreviewModal UI (check for absence of tag elements, no "Tags:" label in metadata section)
  - Test: Vision API failure → Verify image still saved with empty tags
- [ ] T035 [AGENT:qa] [US5] Run E2E test to verify it FAILS
  - Expected: Fails because tagging not triggered or tags not saved
  - Check backend logs for missing Vision API call

### Implementation for User Story 5

- [ ] T036 [AGENT:backend] [US5] Trigger Vision API tagging after image creation in `teacher-assistant/backend/src/routes/langGraphAgents.ts`
  - After library_materials created (line ~347)
  - Call visionService.tagImage() asynchronously (non-blocking)
  - Pass imageUrl and context (title, description, subject, grade)
  - Handle async call with Promise.catch() for error tolerance
  - Log tagging start: `[Vision] Tagging image: ${imageUrl}`
  - Don't await tagging (image creation must not block)
- [ ] T037 [AGENT:backend] [US5] Update library_materials metadata with tags in visionService.ts
  - After Vision API returns tags
  - Build updated metadata JSON:
    ```json
    {
      ...existingMetadata,
      "tags": ["anatomie", "biologie", "löwe", ...],
      "tagging": {
        "generatedAt": Date.now(),
        "model": "gpt-4o",
        "confidence": "high"
      }
    }
    ```
  - Update InstantDB material record via db.transact()
  - Log success: `[Vision] Generated tags: ${tags.join(', ')}`
  - On error: Log warning, leave tags empty: `[Vision] Tagging failed: ${error.message}`
- [ ] T038 [AGENT:backend] [P] [US5] Add tag normalization in visionService.ts
  - Lowercase all tags: `tags.map(t => t.toLowerCase())`
  - Deduplicate: `[...new Set(tags)]`
  - Limit to 15 tags: `tags.slice(0, 15)`
  - Trim whitespace: `tags.map(t => t.trim())`
  - Filter empty strings: `tags.filter(t => t.length > 0)`
- [ ] T039 [AGENT:frontend] [US5] Update Library search to include tags in `teacher-assistant/frontend/src/hooks/useLibraryMaterials.ts`
  - Locate search filter function (line ~XXX)
  - Parse metadata for each material: `const metadata = JSON.parse(material.metadata || '{}')`
  - Add tag search: `metadata.tags?.some(tag => tag.includes(lowercaseQuery))`
  - Existing searches (title, content) remain unchanged
  - Case-insensitive tag matching
- [ ] T040 [AGENT:backend] [P] [US5] Add Vision API unit tests in `teacher-assistant/backend/tests/unit/visionService.test.ts`
  - Test: Tag normalization (lowercase, deduplicate, max 15)
  - Test: Error handling (timeout, 4xx, 5xx responses)
  - Test: Graceful degradation (empty tags on failure)
  - Mock OpenAI API responses
- [ ] T041 [AGENT:qa] [US5] Run E2E test to verify US5 passes
  - Run: `VITE_TEST_MODE=true npx playwright test automatic-tagging.spec.ts`
  - Verify: Tags generated and saved
  - Verify: Tag-based search works
  - Verify: Tags NOT visible in UI
  - Take screenshot of success

**Checkpoint**: User Story 5 complete - Automatic tagging works, images are searchable by tags

---

## Phase 8: User Story 6 - Chat Session Persistence (Priority: P2)

**Goal**: Maintain chat session ID across agent workflow (no new sessions)

**Independent Test**: Chat 5 messages → Start agent → Generate image → Verify sessionId unchanged, all messages preserved, new messages append correctly

### E2E Tests for User Story 6

- [ ] T042 [AGENT:qa] [US6] Create E2E test in `teacher-assistant/frontend/tests/e2e/session-persistence.spec.ts`
  - Test: Start chat, send 5 messages, capture sessionId
  - Test: Trigger agent, generate image
  - Test: Capture sessionId after agent completes
  - Verify: sessionId is identical before/after
  - Verify: All 5 original messages still visible
  - Verify: Agent confirmation message visible
  - Verify: Image result message visible
  - Test: Send 2 more messages after agent
  - Verify: New messages append to same session
  - Verify: message_index sequence is continuous (no gaps)
- [ ] T043 [AGENT:qa] [US6] Run E2E test to verify it FAILS
  - Expected: Fails because new session created during agent workflow
  - Document sessionId before/after (should be different if failing)

### Implementation for User Story 6

- [ ] T044 [AGENT:backend] [US6] Ensure sessionId passed to agent messages in `teacher-assistant/backend/src/routes/langGraphAgents.ts`
  - Verify message creation uses provided sessionId (NOT new session)
  - Query for last message_index in session
  - Calculate next index: `lastIndex + 1`
  - Link message to existing session via InstantDB link
  - Log session usage: `[Message] Adding to session: ${sessionId}, index: ${message_index}`
- [ ] T045 [AGENT:frontend] [US6] Add session persistence validation in ChatView.tsx
  - After agent completes, log sessionId: `console.log('[ChatView] Session after agent:', currentSessionId)`
  - Verify sessionId remains constant
  - If sessionId changes: Log warning and report to error tracking
- [ ] T046 [AGENT:frontend] [P] [US6] .*frontend/tests/unit/chat-session.test.ts`
  - Test: Session ID remains constant across agent workflow
  - Test: message_index increments correctly
  - Test: No gaps in message_index sequence
  - Mock InstantDB responses
- [ ] T047 [AGENT:qa] [US6] Run E2E test to verify US6 passes
  - Run: `VITE_TEST_MODE=true npx playwright test session-persistence.spec.ts`
  - Verify: sessionId unchanged
  - Verify: All messages preserved
  - Verify: message_index continuous
  - Take screenshot of success

**Checkpoint**: User Story 6 complete - Session persistence maintained through agent workflow

---

## Phase 9: E2E Verification & Polish

**Purpose**: Full workflow verification and cross-cutting concerns

- [ ] T048 [AGENT:qa] Run complete E2E test suite
  - Run: `cd teacher-assistant/frontend && VITE_TEST_MODE=true npx playwright test e2e-tests/`
  - Target: ≥27/30 steps passing (90% pass rate per SC-010)
  - Generate HTML report: `npx playwright show-report`
  - Take screenshots at each step
- [ ] T049 [AGENT:qa] Manual verification of all 6 user stories
  - Follow quickstart.md test procedures (27 test cases)
  - User Story 1: Agent Confirmation visibility (4 tests)
  - User Story 2: Library navigation (4 tests)
  - User Story 3: Chat image integration (4 tests)
  - User Story 4: MaterialPreviewModal (4 tests)
  - User Story 5: Automatic tagging (4 tests)
  - User Story 6: Session persistence (3 tests)
  - Edge cases: (4 tests)
  - Document results in session log with screenshots
- [ ] T050 [AGENT:qa] [P] Create backend integration tests in `teacher-assistant/backend/tests/integration/vision-tagging.test.ts`
  - Test: POST /api/vision/tag-image with valid image URL
  - Test: Rate limiting (100/hour, 10/min)
  - Test: Error responses (400, 401, 404, 429, 500, 503)
  - Test: Timeout handling (>30s)
  - Use Supertest for HTTP requests
- [ ] T051 [AGENT:frontend] [P] Create frontend unit tests in `teacher-assistant/frontend/tests/unit/metadata-parsing.test.ts`
  - Test: parseMessageMetadata() handles invalid JSON
  - Test: isImageMessage() type guard works
  - Test: hasRegenParams() type guard works
  - Test: hasTags() type guard works
  - Test: Tag normalization in search
- [ ] T052 [AGENT:frontend] [P] Code cleanup
  - Remove debug console.log statements (keep FR-011 logging)
  - Remove commented-out code
  - Ensure consistent formatting (run Prettier)
  - Verify all imports used
  - Check for unused variables
- [ ] T053 [AGENT:qa] [P] Update documentation
  - Update bug-tracking.md: Mark related bugs as RESOLVED
  - Create session log in `docs/development-logs/sessions/2025-10-14/session-XX-agent-confirmation-ux.md`
  - Document all 6 user stories implemented
  - Include build output (0 TypeScript errors per SC-009)
  - Include E2E test results (≥90% pass rate per SC-010)
  - Include manual test results
  - Include screenshots
- [ ] T054 [AGENT:qa] Run build and pre-commit checks
  - Run: `cd teacher-assistant/frontend && npm run build`
  - Expected: 0 TypeScript errors (SC-009)
  - Run: `cd teacher-assistant/backend && npm run build`
  - Expected: 0 TypeScript errors
  - Run: `npm run lint` (frontend + backend)
  - Expected: 0 ESLint errors
  - Test git commit: Verify pre-commit hooks pass

**Checkpoint**: All 6 user stories complete, tested, and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup → BLOCKS only User Story 5 (auto-tagging)
- **User Story 1 (Phase 3 - P1)**: Independent - Can start after Setup
- **User Story 2 (Phase 4 - P1)**: Independent - Can start after Setup
- **User Story 3 (Phase 5 - P1)**: Independent - Can start after Setup
- **User Story 4 (Phase 6 - P2)**: Independent - Can start after Setup
- **User Story 5 (Phase 7 - P2)**: Depends on Foundational (Vision API) - Can start after Phase 2
- **User Story 6 (Phase 8 - P2)**: Independent - Can start after Setup
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1 - Agent Card Visibility)**: Independent - No dependencies
- **US2 (P1 - Library Navigation)**: Independent - No dependencies (but integrates with US1 workflow)
- **US3 (P1 - Chat Image Integration)**: Independent - No dependencies
- **US4 (P2 - Modal Content)**: Independent - No dependencies (but benefits from US2 navigation)
- **US5 (P2 - Auto-Tagging)**: Depends on Vision API (Phase 2) - Otherwise independent
- **US6 (P2 - Session Persistence)**: Independent - No dependencies (but tested via US3 workflow)

**Critical Path**: Setup → [US1, US2, US3, US4, US6 in parallel] + [Foundational → US5] → E2E Verification

### Within Each User Story

- E2E test FIRST (write and verify it fails)
- Implementation tasks
- Re-run E2E test (verify it passes)
- Manual verification
- Checkpoint before next story

### Parallel Opportunities

- Phase 1: T001 and T002 can run in parallel (different files)
- Phase 2: T003, T004, T005 are sequential (service → route → registration)
- **After Phase 1 completes**: User Stories 1, 2, 3, 4, 6 can be worked on in parallel (independent)
- **After Phase 2 completes**: User Story 5 can join parallel work
- Phase 9: T050, T051, T052, T053 can run in parallel (different files)

---

## Parallel Example: MVP Phase (P1 Stories Only)

```bash
# Once Phase 1 (Setup) completes, launch all P1 user stories in parallel:

# Developer A:
Task: "User Story 1 - Agent Confirmation visibility (T006-T011)"

# Developer B:
Task: "User Story 2 - Library navigation (T012-T017)"

# Developer C:
Task: "User Story 3 - Chat image integration (T018-T026)"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only - All P1)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 3: User Story 1 (Agent Confirmation visibility)
3. Complete Phase 4: User Story 2 (Library navigation)
4. Complete Phase 5: User Story 3 (Chat image integration)
5. **STOP and VALIDATE**: Run E2E tests for US1+US2+US3
6. Deploy/Demo if ready (core UX issues fixed)

### Incremental Delivery

1. Setup → Foundation ready
2. Add US1 (Agent Card) → Test independently → 17% of feature complete
3. Add US2 (Library Nav) → Test independently → 33% of feature complete
4. Add US3 (Chat Images) → Test independently → 50% of feature complete (MVP!)
5. Add US4 (Modal Content) → Test independently → 67% of feature complete
6. Add US5 (Auto-Tagging) → Test independently → 83% of feature complete
7. Add US6 (Session Persist) → Test independently → 100% of feature complete

### Parallel Team Strategy

With 4 developers:

1. Team completes Setup together (T001-T002) - 30 min
2. Developer X completes Foundational (T003-T005) - 90 min
3. Once Setup done, split P1 stories:
   - Dev A: US1 (T006-T011) - 60 min
   - Dev B: US2 (T012-T017) - 90 min
   - Dev C: US3 (T018-T026) - 120 min
4. Once Foundational done:
   - Dev X: US5 (T034-T041) - 90 min
5. Remaining P2 stories:
   - Dev A: US4 (T027-T033) - 60 min
   - Dev B: US6 (T042-T047) - 60 min
6. Reconvene for Phase 9 (E2E verification + polish)

**Total Time**: ~4 hours with parallel execution vs. ~10 hours sequential

---

## Success Criteria Mapping

Each task maps to Success Criteria from spec.md:

- **SC-001** (Agent Card visible 100%): T006-T011 (US1)
- **SC-002** (Library nav works 100%): T012-T017 (US2)
- **SC-003** (Image in chat 100%): T018-T026 (US3)
- **SC-004** (Vision context ≥90%): T018-T026 (US3 Vision API integration)
- **SC-005** (7-10 tags per image): T034-T041 (US5)
- **SC-006** (Tag search ≥80% precision): T034-T041 (US5 search integration)
- **SC-007** (Modal content 100%): T027-T033 (US4)
- **SC-008** (Session persists 100%): T042-T047 (US6)
- **SC-009** (Build clean): T054 (build verification)
- **SC-010** (E2E ≥90% pass): T048 (E2E test suite)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1-US6) maps task to specific user story for traceability
- Each user story independently completable and testable
- E2E tests written FIRST, ensure they FAIL before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, breaking story independence

**Total Tasks**: 54 tasks
- Setup: 2 tasks
- Foundational: 3 tasks (BLOCKS only US5)
- US1 (P1): 6 tasks (including E2E tests)
- US2 (P1): 6 tasks (including E2E tests)
- US3 (P1): 9 tasks (including E2E tests)
- US4 (P2): 7 tasks (including E2E tests)
- US5 (P2): 8 tasks (including E2E tests)
- US6 (P2): 6 tasks (including E2E tests)
- Polish: 7 tasks

**Parallel Opportunities**: 12 tasks marked [P] = ~22% can run in parallel
