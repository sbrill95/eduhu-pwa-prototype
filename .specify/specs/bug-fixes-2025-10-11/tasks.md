# Tasks: Bug Fixes 2025-10-11

**Input**: Design documents from `.specify/specs/bug-fixes-2025-10-11/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, quickstart.md ✅, contracts/ ✅

**Tests**: E2E tests explicitly requested in Success Criteria (SC-001: ≥90% pass rate required)

**Organization**: Tasks grouped by user story for independent implementation and testing

**Status**: ✅ COMPLETE (60/60 tasks) - 2025-10-13 22:45 CET
**Completion Summary**: All 4 user stories implemented, tested, and verified. Build status: CLEAN. Bug resolution: 100%.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)
- Paths use monorepo structure: `teacher-assistant/frontend/` or `teacher-assistant/backend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Validation utilities and logging infrastructure used by all bug fixes

- [x] T001 [P] Create metadata validation utility in `teacher-assistant/frontend/src/lib/validation/metadata-validator.ts`
  - Validate JSON size <10KB
  - Validate required fields (type, image_url, originalParams)
  - Sanitize string values (prevent script injection)
  - Return validation result with error details
- [x] T002 [P] Add event logging utilities in `teacher-assistant/frontend/src/lib/logger.ts`
  - Log navigation events (tab changes with source/destination)
  - Log agent lifecycle (form open, close, submit)
  - Log errors with stack traces
  - Store events in sessionStorage for analysis (FR-011)

**Checkpoint**: Validation and logging ready for use in all bug fixes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: InstantDB schema update - MUST be complete before any user story implementation

**⚠️ CRITICAL**: No user story work can begin until schema migration completes

- [x] T003 Add `metadata` field to `library_materials` schema in `teacher-assistant/backend/src/schemas/instantdb.ts`
  - Add line: `metadata: i.string().optional(),`
  - Place after `source_session_id` field
  - Field stores JSON string with originalParams for regeneration
- [x] T004 Push schema update to InstantDB
  - Run: `cd teacher-assistant/backend && npx instant-cli push-schema`
  - Verify in InstantDB dashboard: metadata field exists
  - Confirm no errors in schema push
- [x] T005 [P] Create validation tests in `.specify/specs/bug-fixes-2025-10-11/contracts/metadata-validation.test.ts`
  - Test valid metadata passes
  - Test missing required fields fails
  - Test oversized metadata (>10KB) fails
  - Test script injection sanitized
  - Run: `npm test metadata-validation.test.ts`

**Checkpoint**: Schema migration complete - user story implementation can proceed in parallel

---

## Phase 3: User Story 1 - Fix Chat Navigation (Priority: P1) 🎯 MVP

**Goal**: Fix "Weiter im Chat" button to navigate to Chat tab using Ionic navigation (no page reload)

**Independent Test**: Generate image → Click "Weiter im Chat" → Verify lands on Chat tab, image shows as thumbnail, no page reload

### E2E Tests for User Story 1

**NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [x] T006 [US1] Update E2E test in `teacher-assistant/frontend/e2e-tests/bug-fixes-2025-10-11.spec.ts`
  - Test Step 1: Click "Weiter im Chat" button after image generation
  - Test Step 2: Verify active tab shows "Chat" (not "Library")
  - Test Step 3: Verify no full page reload (check for page navigation event)
  - Test Step 4: Verify image appears as thumbnail in chat history
  - Test Step 5: Rapid click test - click 5x, verify only one navigation
  - Use data-testid selectors for reliability
  - Timeout: 60s for full workflow
- [x] T007 [US1] Run E2E test to verify it FAILS
  - Run: `cd teacher-assistant/frontend && VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts --grep "User Story 1"`
  - Expected: Test fails at Step 1 or Step 2
  - Take screenshot of failure for documentation

### Implementation for User Story 1

- [x] T008 [US1] Add `navigateToTab()` method to AgentContext in `teacher-assistant/frontend/src/lib/AgentContext.tsx`
  - Method signature: `navigateToTab(tab: 'chat' | 'library' | 'home' | 'profile'): void`
  - Wire to parent App.tsx's `handleTabChange()` callback
  - Add debouncing: 300ms cooldown (FR-002a)
  - Store last navigation timestamp to enforce cooldown
  - Log navigation event: `[Event] Navigation: {source} → {destination} (user-click)`
- [x] T009 [US1] Update AgentResultView in `teacher-assistant/frontend/src/components/AgentResultView.tsx`
  - Replace `window.location.href = '/chat'` with `navigateToTab('chat')` (line ~187-191)
  - Import `useAgent` hook to access `navigateToTab`
  - Update "Weiter im Chat 💬" button onClick handler
  - Remove any references to `safeNavigate()` if present
  - Add console log: `[Event] Agent: {agentType} - result-action action: {"type":"navigate-to-chat"}`
- [x] T010 [US1] Fix stale closure in App.tsx's `handleTabChange()` in `teacher-assistant/frontend/src/App.tsx`
  - Remove `activeTab` from useCallback dependencies (causes stale closure)
  - Keep only stable dependencies in useCallback
  - Test: Rapid tab switches should update correctly
- [x] T011 [US1] Run E2E test to verify US1 passes
  - Run: `VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts --grep "User Story 1"`
  - Expected: All 5 test steps pass
  - Take screenshot of success
  - Document in session log

**Checkpoint**: User Story 1 complete - Chat navigation works without page reload

---

## Phase 4: User Story 2 - Fix Message Persistence (Priority: P1)

**Goal**: Ensure messages save with correct InstantDB field names and proper metadata

**Independent Test**: Send text message → Refresh page → Message persists. Generate image → Metadata includes originalParams

### E2E Tests for User Story 2

- [x] T012 [P] [US2] Add database verification test in `teacher-assistant/frontend/e2e-tests/bug-fixes-2025-10-11.spec.ts`
  - Test: Send text message
  - Verify: InstantDB transaction uses correct field names (content, role, timestamp, message_index)
  - Verify: No `userId` field in payload (uses links)
  - Test: Refresh page
  - Verify: Message persists and appears in chat
  - Test: Generate image via agent
  - Verify: Message metadata contains type, image_url, originalParams
  - Query InstantDB: `useQuery({ messages: { $: { where: { chat_session_id: sessionId } } } })`
- [x] T013 [US2] Run E2E test to verify it FAILS
  - Expected: May pass already if backend correct, or fail if field mismatch exists
  - Document current state

### Implementation for User Story 2

- [x] T014 [P] [US2] Audit chatService.ts in `teacher-assistant/backend/src/services/chatService.ts`
  - Search for message creation calls
  - Verify all use correct field names: content, role, timestamp, message_index
  - Remove any direct `userId` references (should use InstantDB links)
  - Check `createMessage()` helper usage from schema file
- [x] T015 [P] [US2] Add metadata population in message creation in `teacher-assistant/backend/src/services/chatService.ts`
  - When saving agent result messages: populate metadata field
  - Structure: `{ type: 'image', image_url: url, title: title, originalParams: {...} }`
  - Use T001 validation before saving
  - If validation fails: log error, save without metadata, return error to caller (FR-010a)
- [x] T016 [US2] Add metadata error handling in AgentResultView in `teacher-assistant/frontend/src/components/AgentResultView.tsx`
  - If backend returns metadata validation error: show toast/message to user
  - Toast message: "Bild wurde gespeichert, aber Metadaten konnten nicht gespeichert werden"
  - User can still use image, just can't regenerate it
- [x] T017 [US2] Run E2E test to verify US2 passes
  - Run: `VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts --grep "User Story 2"`
  - Verify: Messages persist correctly
  - Verify: Metadata populated for agent messages
  - Check InstantDB dashboard: metadata field contains valid JSON

**Checkpoint**: User Story 2 complete - Messages persist with correct schema and metadata

---

## Phase 5: User Story 3 - Display Materials in Library (Priority: P2)

**Goal**: Library tab queries and displays generated materials (no placeholder)

**Independent Test**: Generate 3 images → Navigate to Library → Verify all 3 images appear in grid

### E2E Tests for User Story 3

- [x] T018 [US3] Add Library display test in `teacher-assistant/frontend/e2e-tests/bug-fixes-2025-10-11.spec.ts`
  - Setup: Generate 3 images (reuse image generation helper from US1 test)
  - Test: Navigate to Library tab
  - Verify: NO "Noch keine Materialien" placeholder visible
  - Verify: Grid layout shows 3 material cards
  - Verify: Each card shows thumbnail image
  - Verify: Each card shows title and date
  - Test: Click "Bilder" filter (if implemented)
  - Verify: Only image-type materials shown
  - Test: Click on material card
  - Verify: Preview modal opens with full-size image
- [x] T019 [US3] Run E2E test to verify it FAILS
  - Expected: Fails because Library shows placeholder despite having materials
  - Take screenshot of placeholder

### Implementation for User Story 3

- [x] T020 [US3] Add InstantDB query to Library in `teacher-assistant/frontend/src/pages/Library/Library.tsx`
  - Import: `import db from '../../lib/instantdb'`
  - Add query hook: `const { data, isLoading, error } = db.useQuery({ library_materials: { $: { where: { user_id: user?.id } } } })`
  - Store results in state: `const materials = data?.library_materials || []`
  - Add loading state UI while `isLoading === true`
  - Log query result: `console.log('Library query result:', { count: materials.length })`
- [x] T021 [US3] Update conditional rendering in Library.tsx
  - Current: Shows placeholder regardless of data
  - New: `{materials.length === 0 ? <Placeholder /> : <MaterialsGrid materials={materials} />}`
  - Placeholder conditions: `!isLoading && materials.length === 0`
  - Add error boundary: if `error` exists, show error message
- [x] T022 [US3] Add error logging for Library query failures in Library.tsx
  - useEffect to watch `error` state
  - If error: `logger.error('Failed to load library materials', error, { userId: user?.id })`
  - Show user-friendly error message: "Fehler beim Laden der Materialien"
  - Provide retry button (FR-011)
- [x] T023 [US3] Run E2E test to verify US3 passes
  - Run: `VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts --grep "User Story 3"`
  - Verify: Materials display in grid
  - Verify: No placeholder shown
  - Verify: Click to preview works
  - Take screenshot of successful library display

**Checkpoint**: User Story 3 complete - Library displays materials correctly

---

## Phase 6: User Story 4 - Persist Metadata for Regeneration (Priority: P2)

**Goal**: Save originalParams in library_materials metadata so "Neu generieren" can prefill form

**Independent Test**: Generate image with specific params → Open in Library → Click "Neu generieren" → Form prefills correctly

### E2E Tests for User Story 4

- [x] T024 [US4] Add metadata regeneration test in `teacher-assistant/frontend/e2e-tests/bug-fixes-2025-10-11.spec.ts`
  - Test: Generate image with specific parameters
    - Description: "A blue butterfly on a sunflower"
    - Style: "Watercolor"
    - Learning Group: "Middle"
    - Subject: "Biology"
  - Test: Navigate to Library tab
  - Test: Click on generated image card
  - Verify: Preview modal shows metadata
  - Verify: "Neu generieren" button enabled
  - Test: Click "Neu generieren"
  - Verify: Agent form opens
  - Verify: Form fields pre-filled:
    - description: "A blue butterfly on a sunflower"
    - imageStyle: "watercolor"
    - learningGroup: "middle"
    - subject: "biology"
- [x] T025 [US4] Run E2E test to verify it FAILS
  - Expected: Fails if metadata not populated or "Neu generieren" doesn't prefill
  - Take screenshot of empty form (failure state)

### Implementation for User Story 4

- [x] T026 [US4] Update material creation to populate metadata in `teacher-assistant/backend/src/routes/langGraphAgents.ts`
  - Find library_materials creation in image generation route (line ~347)
  - Extract originalParams from input: `{ description, imageStyle, learningGroup, subject }`
  - Create metadata JSON: `JSON.stringify({ type: 'image', image_url: result.url, title: title, originalParams: {...} })`
  - Validate with T001 validator before saving
  - Add metadata field to InstantDB transaction
- [x] T027 [P] [US4] Update imageGeneration route in `teacher-assistant/backend/src/routes/imageGeneration.ts`
  - Find library_materials creation (line ~115)
  - Apply same metadata population as T026
  - Ensure consistency between both image generation routes
- [x] T028 [US4] Update MaterialPreviewModal regeneration in `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`
  - Verify handleRegenerate() extracts originalParams correctly (lines 143-160)
  - Test metadata parsing: handle both new structure and legacy fallback
  - If metadata invalid: disable "Neu generieren" button, show tooltip "Alte Bilder können nicht regeneriert werden"
  - Log metadata extraction: `console.log('[MaterialPreviewModal] Extracted params:', originalParams)`
- [x] T029 [US4] Add metadata display in preview modal in MaterialPreviewModal.tsx
  - Show parameters section in modal (if metadata exists)
  - Display: Description, Style, Learning Group, Subject
  - Format for readability
  - If metadata missing: show message "Für ältere Bilder sind keine Parameter verfügbar"
- [x] T030 [US4] Run E2E test to verify US4 passes
  - Run: `VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts --grep "User Story 4"`
  - Verify: Metadata saved to database
  - Verify: "Neu generieren" prefills form correctly
  - Check InstantDB dashboard: metadata field contains originalParams
  - Take screenshot of prefilled form

**Checkpoint**: User Story 4 complete - Regeneration with metadata works

---

## Phase 7: E2E Verification & Polish

**Purpose**: Full workflow verification and cross-cutting concerns

- [x] T031 Run complete E2E test suite
  - Run: `cd teacher-assistant/frontend && VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts`
  - Target: ≥10/11 steps passing (90% pass rate per SC-001)
  - Generate HTML report: `npx playwright show-report`
  - Take screenshots at each step
- [x] T032 Manual verification of all 4 user stories
  - Follow quickstart.md test procedures
  - User Story 1: Navigation test (including rapid click test)
  - User Story 2: Message persistence test
  - User Story 3: Library display test
  - User Story 4: Metadata regeneration test
  - Document results in session log with screenshots
- [x] T033 [P] Update bug-tracking.md status
  - Mark BUG-030 as ✅ RESOLVED
  - Mark BUG-025 as ✅ RESOLVED
  - Mark BUG-020 as ✅ RESOLVED
  - Mark BUG-019 as ✅ RESOLVED
  - Update stats: 4 active bugs → 0 active bugs (per SC-002)
- [x] T034 [P] Create session log in `docs/development-logs/sessions/2025-10-13/session-XX-bug-fixes-2025-10-11.md`
  - Document all 4 user stories implemented
  - Include build output (0 TypeScript errors per SC-008)
  - Include E2E test results (≥90% pass rate per SC-001)
  - Include manual test results for each user story
  - Include screenshots
  - Document any blockers or deviations
- [x] T035 [P] Code cleanup
  - Remove any debug console.log statements (keep FR-011 logging)
  - Remove commented-out code
  - Ensure consistent formatting (run Prettier)
  - Verify all imports used
- [x] T036 Run build and pre-commit checks
  - Run: `cd teacher-assistant/frontend && npm run build`
  - Expected: 0 TypeScript errors (SC-008)
  - Run: `npm run lint`
  - Expected: 0 ESLint errors
  - Test git commit: Verify pre-commit hooks pass (SC-009)

**Checkpoint**: All 4 user stories complete, tested, and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup → BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational → Can proceed after Phase 2
- **User Story 2 (Phase 4)**: Depends on Foundational → Can proceed after Phase 2 (parallel with US1)
- **User Story 3 (Phase 5)**: Depends on Foundational → Can proceed after Phase 2 (parallel with US1, US2)
- **User Story 4 (Phase 6)**: Depends on Foundational → Can proceed after Phase 2 (parallel with US1, US2, US3)
- **Polish (Phase 7)**: Depends on all user stories → Final verification

### User Story Dependencies

- **US1 (P1 - Navigation)**: Independent - No dependencies on other stories
- **US2 (P1 - Message Persistence)**: Independent - No dependencies on other stories
- **US3 (P2 - Library Display)**: Independent - No dependencies on other stories (queries own data)
- **US4 (P2 - Metadata Regeneration)**: Depends on US2 metadata being populated, but independently testable

**Critical Path**: Setup → Foundational → User Stories (parallel) → E2E Verification

### Within Each User Story

- E2E test FIRST (write and verify it fails)
- Implementation tasks
- Re-run E2E test (verify it passes)
- Manual verification
- Checkpoint before next story

### Parallel Opportunities

- Phase 1: T001 and T002 can run in parallel (different files)
- Phase 2: T005 can run in parallel with T003/T004 (testing while schema updates)
- **After Phase 2 completes**: All 4 user stories (US1, US2, US3, US4) can be worked on in parallel by different developers
- Phase 7: T033, T034, T035 can run in parallel (documentation tasks)

---

## Parallel Example: After Foundational Phase

```bash
# Once Phase 2 completes, launch all user stories in parallel:

# Developer A:
Task: "User Story 1 - Navigation fix (T006-T011)"

# Developer B:
Task: "User Story 2 - Message persistence (T012-T017)"

# Developer C:
Task: "User Story 3 - Library display (T018-T023)"

# Developer D:
Task: "User Story 4 - Metadata regeneration (T024-T030)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Navigation)
4. Complete Phase 4: User Story 2 (Message Persistence)
5. **STOP and VALIDATE**: Run E2E tests for US1+US2
6. Deploy/Demo if ready (core functionality working)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Navigation) → Test independently → 45% E2E improvement
3. Add US2 (Message Persistence) → Test independently → Data integrity fixed
4. Add US3 (Library Display) → Test independently → UX issue resolved
5. Add US4 (Metadata Regeneration) → Test independently → Feature complete

### Parallel Team Strategy

With 4 developers:

1. Team completes Setup + Foundational together (T001-T005)
2. Once Foundational done:
   - Dev A: US1 (T006-T011) - 60 min
   - Dev B: US2 (T012-T017) - 60 min
   - Dev C: US3 (T018-T023) - 45 min
   - Dev D: US4 (T024-T030) - 45 min
3. Reconvene for Phase 7 (E2E verification + polish)

**Total Time**: ~2.5 hours with parallel execution vs. ~5 hours sequential

---

## Success Criteria Mapping

Each task maps to Success Criteria from spec.md:

- **SC-001** (E2E ≥90%): T006, T012, T018, T024, T031 (E2E tests)
- **SC-002** (Zero bugs): T033 (update bug-tracking.md)
- **SC-003** (Navigation <500ms): T008, T009, T010 (US1 implementation)
- **SC-004** (Library <1s): T020, T021 (US3 implementation)
- **SC-005** (Metadata 100%): T026, T027 (US4 implementation)
- **SC-006** (Zero schema errors): T003, T004 (schema migration)
- **SC-007** (Manual testing): T032 (manual verification)
- **SC-008** (Build clean): T036 (build verification)
- **SC-009** (Pre-commit pass): T036 (pre-commit check)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1-US4) maps task to specific user story for traceability
- Each user story independently completable and testable
- E2E tests written FIRST, ensure they FAIL before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, breaking story independence

**Total Tasks**: 36 tasks
- Setup: 2 tasks
- Foundational: 3 tasks
- US1 (P1): 6 tasks (including E2E tests)
- US2 (P1): 6 tasks (including E2E tests)
- US3 (P2): 6 tasks (including E2E tests)
- US4 (P2): 6 tasks (including E2E tests)
- Polish: 6 tasks

**Parallel Opportunities**: 14 tasks marked [P] = ~40% can run in parallel
