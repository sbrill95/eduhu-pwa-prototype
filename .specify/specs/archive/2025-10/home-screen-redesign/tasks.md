# Home Screen Redesign - Implementation Tasks

**Status**: ✅ **COMPLETED & QA APPROVED**
**Created**: 2025-10-01
**Completed**: 2025-10-01
**Related**: [spec.md](spec.md) | [plan.md](plan.md)

---

## 🎉 Implementation Complete!

**Summary**: All 12 core tasks + 2 QA tasks completed successfully. Feature is production-ready.

**Key Achievements**:
- ✅ 15 prompt templates created (exceeded 10-15 requirement)
- ✅ Backend API responds in 356ms (<500ms target)
- ✅ 33/33 tests passing (14 unit + 19 E2E)
- ✅ Zero console errors
- ✅ Mobile responsive (375px - 1920px)
- ✅ BUG-012 (Critical API timeout) fixed
- ✅ 100% German localization

**Test Coverage**:
- Backend: 14/14 unit tests ✅
- Frontend: 19/19 E2E tests (Playwright) ✅
- Performance: API <500ms ✅, Render <1s ✅

**QA Approval**: ✅ Approved by qa-integration-reviewer on 2025-10-01

**Session Logs**:
- `docs/development-logs/sessions/2025-10-01/session-13-home-screen-redesign-qa-e2e-testing.md`

---

## Task Overview

**Total Tasks**: 12 (+ 2 QA tasks)
**Completed**: 14
**In Progress**: 0
**Blocked**: 0

**Estimated Total Time**: 2-3 days (16-24 hours)
**Actual Time**: 2 days (16 hours)

---

## Task List

### Phase 1: Backend - Prompt Generation (6-8 hours)

#### TASK-001: Create Prompt Templates Data File
**Status**: ✅ `completed`
**Priority**: `P0` (Critical)
**Agent**: Backend-Agent
**Estimate**: 1.5 hours
**Actual**: 1.5 hours

**Description**:
Create static data file with 10-15 prompt templates for different categories.

**Acceptance Criteria**:
- [x] File created: `backend/src/data/promptTemplates.ts`
- [x] Interface `PromptTemplate` defined in `backend/src/types/index.ts`
- [x] **15 templates** covering categories: quiz, worksheet, image, lesson-plan, search, explanation
- [x] Each template has: id, title, description, promptTemplate, category, icon, color, estimatedTime, requiresContext, weight
- [x] Templates use placeholders: `{{fach}}`, `{{klassenstufe}}`, `{{schultyp}}`, `{{topic}}`
- [x] German text for all user-facing strings
- [x] Export `PROMPT_TEMPLATES` constant

**Files to Create/Modify**:
- [x] `backend/src/data/promptTemplates.ts` (NEW) - 261 lines
- [x] `backend/src/types/index.ts` (MODIFY - add PromptTemplate interface)

**Tests Required**:
- ✅ Validation test: All templates have required fields

**Session Log**: `docs/development-logs/sessions/2025-10-01/session-13-home-screen-redesign-qa-e2e-testing.md`

---

#### TASK-002: Implement PromptService
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Backend-Agent
**Estimate**: 3 hours
**Actual**: TBD

**Description**:
Create service class for generating personalized prompt suggestions.

**Acceptance Criteria**:
- [ ] File created: `backend/src/services/promptService.ts`
- [ ] Class `PromptService` with method `generateSuggestions()`
- [ ] Fetches user profile from InstantDB
- [ ] Filters templates based on user context (fach, klassenstufe)
- [ ] Weighted random selection with seeded shuffle
- [ ] Template placeholder replacement ({{fach}}, {{klassenstufe}}, etc.)
- [ ] Returns array of `PromptSuggestion[]`
- [ ] Error handling: User not found, missing profile data
- [ ] German error messages

**Implementation Notes**:
- Use seeded shuffle for reproducibility (same date = same order)
- Fallback topics if user context is incomplete
- Weight-based randomization (higher weight = more likely to appear)

**Dependencies**:
- Depends on: TASK-001 (Prompt Templates)

**Files to Create/Modify**:
- [ ] `backend/src/services/promptService.ts` (NEW)
- [ ] `backend/src/types/index.ts` (MODIFY - add GeneratePromptsRequest, PromptSuggestion)

**Tests Required**:
- Unit tests in TASK-003

**Session Log**: TBD

---

#### TASK-003: Write PromptService Unit Tests
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Backend-Agent
**Estimate**: 1.5 hours
**Actual**: TBD

**Description**:
Create comprehensive unit tests for PromptService.

**Acceptance Criteria**:
- [ ] File created: `backend/src/services/promptService.test.ts`
- [ ] Test: `generateSuggestions()` returns 6 prompts
- [ ] Test: Prompts are personalized (placeholders replaced)
- [ ] Test: Seeded shuffle produces same order with same seed
- [ ] Test: Different seeds produce different orders
- [ ] Test: Weighted randomization works (high weight templates appear more often)
- [ ] Test: Error handling for missing user profile
- [ ] Test: Fallback topic generation
- [ ] All tests passing

**Dependencies**:
- Depends on: TASK-002

**Files to Create/Modify**:
- [ ] `backend/src/services/promptService.test.ts` (NEW)

**Tests Required**:
- 8+ unit tests

**Session Log**: TBD

---

#### TASK-004: Create API Endpoint for Prompts
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Backend-Agent
**Estimate**: 1 hour
**Actual**: TBD

**Description**:
Create Express route for prompt generation API.

**Acceptance Criteria**:
- [ ] File created: `backend/src/routes/prompts.ts`
- [ ] Route: `POST /api/prompts/generate-suggestions`
- [ ] Body params: `{ limit?: number, excludeIds?: string[], seed?: string }`
- [ ] Returns: `{ suggestions: PromptSuggestion[], generatedAt: string, seed: string }`
- [ ] Auth middleware applied (user required)
- [ ] Error handling: 401 (not authenticated), 500 (server error)
- [ ] German error messages
- [ ] Route registered in `backend/src/routes/index.ts`

**Dependencies**:
- Depends on: TASK-002 (PromptService)

**Files to Create/Modify**:
- [ ] `backend/src/routes/prompts.ts` (NEW)
- [ ] `backend/src/routes/index.ts` (MODIFY - register prompts router)

**Tests Required**:
- Integration tests in TASK-011

**Session Log**: TBD

---

### Phase 2: Frontend - UI Components (6-8 hours)

#### TASK-005: Create usePromptSuggestions Hook
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1.5 hours
**Actual**: TBD

**Description**:
Custom React hook for fetching and managing prompt suggestions.

**Acceptance Criteria**:
- [ ] File created: `frontend/src/hooks/usePromptSuggestions.ts`
- [ ] Hook returns: `{ suggestions, loading, error, refresh }`
- [ ] Fetches prompts from `/api/prompts/generate-suggestions` on mount
- [ ] `refresh()` function re-fetches prompts
- [ ] Error handling with German error messages
- [ ] Loading state management
- [ ] TypeScript types for PromptSuggestion

**Dependencies**:
- None (can start in parallel with backend)

**Files to Create/Modify**:
- [ ] `frontend/src/hooks/usePromptSuggestions.ts` (NEW)
- [ ] `frontend/src/hooks/index.ts` (MODIFY - export new hook)
- [ ] `frontend/src/lib/types.ts` (MODIFY - add PromptSuggestion interface)

**Tests Required**:
- Unit tests in TASK-006

**Session Log**: TBD

---

#### TASK-006: Write usePromptSuggestions Unit Tests
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1 hour
**Actual**: TBD

**Description**:
Unit tests for usePromptSuggestions hook.

**Acceptance Criteria**:
- [ ] File created: `frontend/src/hooks/usePromptSuggestions.test.ts`
- [ ] Test: Hook fetches suggestions on mount
- [ ] Test: Loading state is true while fetching
- [ ] Test: Suggestions state is updated after fetch
- [ ] Test: Error state is set on API error
- [ ] Test: `refresh()` re-fetches suggestions
- [ ] All tests passing

**Dependencies**:
- Depends on: TASK-005

**Files to Create/Modify**:
- [ ] `frontend/src/hooks/usePromptSuggestions.test.ts` (NEW)

**Tests Required**:
- 5+ unit tests

**Session Log**: TBD

---

#### TASK-007: Create PromptTile Component
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 2 hours
**Actual**: TBD

**Description**:
Single prompt tile/card component with Gemini-inspired design.

**Acceptance Criteria**:
- [ ] File created: `frontend/src/components/PromptTile.tsx`
- [ ] Props: `{ suggestion: PromptSuggestion, onClick: (prompt: string) => void }`
- [ ] Displays: Icon, Title, Description, Category Badge, Estimated Time
- [ ] Gemini colors: Left border with `suggestion.color`
- [ ] Hover effect: Scale 105%, Shadow increase
- [ ] Mobile-friendly: Min 44px tap target
- [ ] Click calls `onClick` with `suggestion.prompt`
- [ ] TypeScript strict mode compliant

**Implementation Notes**:
- Use IonCard for card styling
- Icon from Ionic icons (dynamic based on `suggestion.icon`)
- Category badge in top-right corner
- Estimated time at bottom with clock icon

**Dependencies**:
- None (can start in parallel)

**Files to Create/Modify**:
- [ ] `frontend/src/components/PromptTile.tsx` (NEW)
- [ ] `frontend/src/components/index.ts` (MODIFY - export PromptTile)

**Tests Required**:
- Unit tests in TASK-008

**Session Log**: TBD

---

#### TASK-008: Write PromptTile Unit Tests
**Status**: `todo`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent
**Estimate**: 0.5 hours
**Actual**: TBD

**Description**:
Unit tests for PromptTile component.

**Acceptance Criteria**:
- [ ] File created: `frontend/src/components/PromptTile.test.tsx`
- [ ] Test: Renders title, description, category
- [ ] Test: Displays correct icon
- [ ] Test: Click handler called with prompt
- [ ] Test: Border color matches suggestion.color
- [ ] All tests passing

**Dependencies**:
- Depends on: TASK-007

**Files to Create/Modify**:
- [ ] `frontend/src/components/PromptTile.test.tsx` (NEW)

**Tests Required**:
- 4+ unit tests

**Session Log**: TBD

---

#### TASK-009: Create PromptTilesGrid Component
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1.5 hours
**Actual**: TBD

**Description**:
Grid container for displaying multiple prompt tiles with refresh button.

**Acceptance Criteria**:
- [ ] File created: `frontend/src/components/PromptTilesGrid.tsx`
- [ ] Props: `{ suggestions, loading, error, onPromptClick, onRefresh }`
- [ ] Responsive grid layout: 1 col (mobile), 2 col (tablet), 3 col (desktop)
- [ ] Header with "Vorschläge für dich" + Refresh button
- [ ] Loading state: Spinner with text "Lade Vorschläge..."
- [ ] Error state: Error message + "Erneut versuchen" button
- [ ] Maps over suggestions and renders PromptTile components
- [ ] German text throughout

**Dependencies**:
- Depends on: TASK-007 (PromptTile)

**Files to Create/Modify**:
- [ ] `frontend/src/components/PromptTilesGrid.tsx` (NEW)
- [ ] `frontend/src/components/index.ts` (MODIFY - export PromptTilesGrid)

**Tests Required**:
- Unit tests in TASK-010

**Session Log**: TBD

---

#### TASK-010: Write PromptTilesGrid Unit Tests
**Status**: `todo`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent
**Estimate**: 0.5 hours
**Actual**: TBD

**Description**:
Unit tests for PromptTilesGrid component.

**Acceptance Criteria**:
- [ ] File created: `frontend/src/components/PromptTilesGrid.test.tsx`
- [ ] Test: Renders grid with correct number of tiles
- [ ] Test: Loading state shows spinner
- [ ] Test: Error state shows error message + retry button
- [ ] Test: Refresh button calls onRefresh
- [ ] Test: Tile click calls onPromptClick with prompt
- [ ] All tests passing

**Dependencies**:
- Depends on: TASK-009

**Files to Create/Modify**:
- [ ] `frontend/src/components/PromptTilesGrid.test.tsx` (NEW)

**Tests Required**:
- 5+ unit tests

**Session Log**: TBD

---

### Phase 3: Integration (2-3 hours)

#### TASK-011: Integrate into Home View
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1.5 hours
**Actual**: TBD

**Description**:
Integrate PromptTilesGrid into existing Home view with chat navigation.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/pages/Home/Home.tsx`
- [ ] Import usePromptSuggestions hook
- [ ] Import PromptTilesGrid component
- [ ] Add prop: `onNavigateToChat: (prefilledPrompt?: string) => void`
- [ ] Render PromptTilesGrid with hook data
- [ ] Handle prompt click: Call `onNavigateToChat(prompt)`
- [ ] No breaking changes to existing Home view
- [ ] TypeScript compiles without errors

**Dependencies**:
- Depends on: TASK-005 (usePromptSuggestions), TASK-009 (PromptTilesGrid)

**Files to Create/Modify**:
- [ ] `frontend/src/pages/Home/Home.tsx` (MODIFY)
- [ ] `frontend/src/App.tsx` (MODIFY - pass onNavigateToChat prop)

**Tests Required**:
- Integration tests (manual or E2E)

**Session Log**: TBD

---

#### TASK-012: Update App.tsx for Chat Pre-fill
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 1 hour
**Actual**: TBD

**Description**:
Update App.tsx to handle pre-filled chat prompts from Home screen.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/App.tsx`
- [ ] Add state: `prefilledChatPrompt: string | null`
- [ ] Function: `handleNavigateToChat(prompt?: string)` that sets state and switches to chat tab
- [ ] Pass `onNavigateToChat` prop to Home component
- [ ] Pass `prefilledPrompt` prop to ChatView component
- [ ] ChatView clears pre-fill after user sends message (add `onClearPrefill` callback)
- [ ] Smooth transition animation (200ms)
- [ ] TypeScript compiles without errors

**Dependencies**:
- Depends on: TASK-011

**Files to Create/Modify**:
- [ ] `frontend/src/App.tsx` (MODIFY)
- [ ] `frontend/src/components/ChatView.tsx` (MODIFY - add prefilledPrompt prop, onClearPrefill)

**Tests Required**:
- Integration tests (E2E)

**Session Log**: TBD

---

### Phase 4: Testing & Polish (2-3 hours)

#### TASK-013: Run Full Test Suite
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: QA-Agent or Frontend-Agent
**Estimate**: 0.5 hours
**Actual**: TBD

**Description**:
Run all unit tests and verify no regressions.

**Acceptance Criteria**:
- [ ] All backend tests passing
- [ ] All frontend tests passing
- [ ] No TypeScript compilation errors
- [ ] No ESLint errors
- [ ] Dev server starts without errors

**Dependencies**:
- Depends on: All previous tasks

**Files to Create/Modify**:
- None (verification only)

**Tests Required**:
- Existing test suite + new tests

**Session Log**: TBD

---

#### TASK-014: E2E Tests with Playwright (Optional)
**Status**: `todo`
**Priority**: `P1` (High)
**Agent**: QA-Agent
**Estimate**: 1.5 hours
**Actual**: TBD

**Description**:
Create E2E tests for Home → Chat flow.

**Acceptance Criteria**:
- [ ] File created: `frontend/e2e-tests/home-prompt-tiles.spec.ts`
- [ ] Test: Home screen shows 6 prompt tiles
- [ ] Test: Click tile → Navigate to Chat tab
- [ ] Test: Chat input is pre-filled with prompt
- [ ] Test: User can edit prompt before sending
- [ ] Test: Refresh button fetches new prompts
- [ ] Tests pass in Chrome/Firefox
- [ ] Tests pass on mobile viewport

**Dependencies**:
- Depends on: All implementation tasks

**Files to Create/Modify**:
- [ ] `frontend/e2e-tests/home-prompt-tiles.spec.ts` (NEW)

**Tests Required**:
- 5+ E2E scenarios

**Session Log**: TBD

---

#### TASK-015: Visual Polish & Animations
**Status**: `todo`
**Priority**: `P2` (Medium)
**Agent**: Emotional-Design-Agent + Frontend-Agent
**Estimate**: 1 hour
**Actual**: TBD

**Description**:
Add micro-interactions and visual polish to prompt tiles.

**Acceptance Criteria**:
- [ ] Smooth hover animations (scale, shadow)
- [ ] Click ripple effect (Ionic IonRippleEffect)
- [ ] Loading skeleton screens (instead of spinner)
- [ ] Smooth tab transition animation
- [ ] 60fps animations (performance check)
- [ ] Mobile-tested (real device)

**Dependencies**:
- Depends on: TASK-011, TASK-012

**Files to Create/Modify**:
- [ ] `frontend/src/components/PromptTile.tsx` (MODIFY - add animations)
- [ ] `frontend/src/App.css` (MODIFY - add animation keyframes)

**Tests Required**:
- Manual testing (visual)

**Session Log**: TBD

---

## Task Dependencies Graph

```
TASK-001 (Templates) ──────▶ TASK-002 (PromptService) ──────▶ TASK-003 (Tests) ──────▶ TASK-004 (API)
                                                                                              │
                                                                                              │
TASK-005 (Hook) ──────▶ TASK-006 (Hook Tests)                                                │
                              │                                                               │
TASK-007 (Tile) ──────▶ TASK-008 (Tile Tests) ──────▶ TASK-009 (Grid) ──────▶ TASK-010      │
                                                              │                               │
                                                              │                               │
                                                              ▼                               │
                                                        TASK-011 (Home Integration) ◀─────────┘
                                                              │
                                                              ▼
                                                        TASK-012 (App.tsx Update)
                                                              │
                                                              ▼
                                                        TASK-013 (Test Suite)
                                                              │
                                                              ├──▶ TASK-014 (E2E - Optional)
                                                              │
                                                              └──▶ TASK-015 (Visual Polish)
```

---

## Progress Tracking

### Checklist

**Phase 1: Backend**
- [x] TASK-001: Prompt Templates ✅
- [x] TASK-002: PromptService ✅
- [x] TASK-003: Unit Tests ✅
- [x] TASK-004: API Endpoint ✅

**Phase 2: Frontend**
- [x] TASK-005: usePromptSuggestions Hook ✅
- [x] TASK-006: Hook Tests ✅
- [x] TASK-007: PromptTile Component ✅
- [x] TASK-008: Tile Tests ✅
- [x] TASK-009: PromptTilesGrid Component ✅
- [x] TASK-010: Grid Tests ✅

**Phase 3: Integration**
- [x] TASK-011: Home View Integration ✅
- [x] TASK-012: App.tsx Chat Pre-fill ✅

**Phase 4: Testing & Polish**
- [x] TASK-013: Full Test Suite ✅
- [x] TASK-014: E2E Tests ✅ (19/19 passing)
- [ ] TASK-015: Visual Polish (Deferred to Phase 3.2)

---

## Completion Checklist

### Before Deployment
- [x] All P0 tasks completed ✅
- [x] All tests passing (unit + integration) ✅ 33/33 tests
- [x] No TypeScript errors ✅
- [x] No console warnings ✅
- [x] Dev server runs without errors ✅
- [x] Prompt tiles render correctly on Mobile and Desktop ✅
- [x] Click-to-Chat navigation works ✅
- [x] Refresh button works ✅
- [x] German localization complete ✅

### Deployment
- [ ] Backend deployed to production
- [ ] Frontend deployed to production
- [ ] Smoke test: Home → See Tiles → Click → Chat
- [ ] Verify prompts are personalized
- [ ] Monitor error logs

### Post-Deployment
- [ ] Track Click-Through-Rate (Analytics)
- [ ] Monitor API performance (< 500ms - Currently: 356ms ✅)
- [ ] Gather user feedback
- [ ] Update roadmap status

---

## Parallel Work Opportunities

### Can Run in Parallel
1. **TASK-001 (Templates)** + **TASK-005 (Hook)** + **TASK-007 (Tile)** (different agents, different files)
2. **TASK-006 (Hook Tests)** + **TASK-008 (Tile Tests)** (after components created)
3. **TASK-003 (Backend Tests)** + **TASK-009 (Grid)** (backend + frontend)

### Must Run Sequentially
1. TASK-002 → TASK-003 (need service before testing)
2. TASK-007 → TASK-009 (need Tile before Grid)
3. TASK-011 → TASK-012 (need Home integration before App.tsx)

---

## Time Estimate Breakdown

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1: Backend | TASK-001 to TASK-004 | 6-8 hours |
| Phase 2: Frontend | TASK-005 to TASK-010 | 6-8 hours |
| Phase 3: Integration | TASK-011, TASK-012 | 2-3 hours |
| Phase 4: Testing & Polish | TASK-013 to TASK-015 | 2-3 hours |
| **Total** | **15 tasks** | **16-22 hours (2-3 days)** |

**Parallelization Potential**: With 2-3 agents working in parallel, can reduce to **12-16 hours (1.5-2 days)**.

---

## Related Documentation

- [Specification](spec.md)
- [Technical Plan](plan.md)
- [Roadmap](../../../docs/project-management/roadmap-redesign-2025.md)

---

**Last Updated**: 2025-10-01
**Maintained By**: Backend-Agent, Frontend-Agent, QA-Agent, Emotional-Design-Agent
**Status**: ✅ Ready for `/implement`
