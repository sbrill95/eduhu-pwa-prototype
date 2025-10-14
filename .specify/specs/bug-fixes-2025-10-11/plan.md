# Implementation Plan: Bug Fixes 2025-10-11

**Branch**: `bug-fixes-2025-10-11` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: 4 active bugs blocking Image Generation UX V2 completion

## Summary

This plan addresses 4 critical bugs affecting the Teacher Assistant application's image generation and library features. The fixes involve navigation improvements, database schema corrections, metadata persistence, and query implementation. Success criteria include achieving ≥90% E2E test pass rate and zero active bugs.

**Primary Requirements**:
- Fix "Weiter im Chat" navigation to use Ionic tab system with debouncing
- Correct InstantDB schema field mismatches in messages table
- Implement library materials query to display generated content
- Add metadata field to library_materials schema for regeneration feature

**Technical Approach**:
- Frontend: Update AgentResultView navigation, Library query logic
- Backend: Add metadata field to InstantDB schema
- Validation: Implement metadata validation with error handling
- Logging: Add navigation and error event tracking

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend)
**Primary Dependencies**:
- Frontend: React 18.x, Vite, Tailwind CSS, Ionic Framework, InstantDB Client
- Backend: Node.js 18+, Express, InstantDB Admin SDK
**Storage**: InstantDB (cloud-hosted, real-time database)
**Testing**: Playwright for E2E, manual verification required
**Target Platform**: Web application (desktop + mobile browsers)
**Project Type**: Web (monorepo with frontend + backend)
**Performance Goals**: <500ms navigation, <1s library load, <150s image generation
**Constraints**:
- No page reloads (SPA navigation)
- Metadata < 10KB per record
- Backward compatibility with existing materials
**Scale/Scope**: 4 bug fixes, 7 file modifications, 4 user stories, 15 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: SpecKit-First

**Status**: COMPLIANT
- ✅ SpecKit exists at `.specify/specs/bug-fixes-2025-10-11/`
- ✅ spec.md contains 4 user stories with acceptance criteria
- ✅ This plan.md provides technical approach
- ✅ data-model.md documents schema changes
- ✅ quickstart.md provides testing guide
- ✅ tasks.md will be generated via `/speckit.tasks` command

### ✅ Principle II: Definition of Done

**Criteria** (all must pass):
1. **Build Clean**: `npm run build` → 0 TypeScript errors
2. **Tests Pass**: E2E test pass rate ≥90% (10/11 steps)
3. **Manual Test**: All 4 user stories verified (doc in session log)
4. **Pre-Commit Pass**: Hooks pass (TypeScript, ESLint, tests)

**Current Baseline**: 27% E2E pass rate (3/11 steps) - BUG-028 blocker

### ✅ Principle III: TypeScript Everywhere

**Status**: COMPLIANT
- All modifications in TypeScript files (.ts, .tsx)
- No `.js` files to be created or modified
- Shared types use `teacher-assistant/shared/types/`
- Zero `@ts-ignore` without justification

### ✅ Principle IV: Documentation & Traceability

**Required Documentation**:
- Session log: `docs/development-logs/sessions/2025-10-13/session-XX-bug-fixes-2025-10-11.md`
- Bug reports: Already exist in `docs/quality-assurance/bug-tracking.md`
- Updated: BUG-019, BUG-020, BUG-025, BUG-030 status changes

### ✅ Principle V: Tech Stack Consistency

**Mandatory Technologies** (all compliant):
- ✅ Frontend: React + TypeScript + Vite + Tailwind + InstantDB
- ✅ Backend: Node.js + Express + TypeScript
- ✅ Database: InstantDB for all data operations
- ✅ Testing: Playwright E2E tests
- ✅ Styling: Tailwind CSS only (no custom CSS)

**No violations - all fixes use existing tech stack**

## Project Structure

### Documentation (this feature)

```
.specify/specs/bug-fixes-2025-10-11/
├── spec.md              # Feature requirements (✅ exists)
├── plan.md              # This file (✅ created)
├── data-model.md        # InstantDB schema changes (✅ exists)
├── quickstart.md        # Testing guide (✅ exists)
├── contracts/           # Validation schemas (✅ exists)
└── tasks.md             # Implementation tasks (⏳ to be generated)
```

### Source Code (repository root)

**Web Application Structure**:

```
teacher-assistant/
├── backend/
│   └── src/
│       ├── schemas/
│       │   └── instantdb.ts                    # Schema changes (BUG-019)
│       └── services/
│           └── chatService.ts                  # Field validation (BUG-025)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── AgentResultView.tsx             # Navigation fix (BUG-030)
        │   └── MaterialPreviewModal.tsx        # Metadata display
        ├── pages/
        │   └── Library/
        │       └── Library.tsx                 # Query impl (BUG-020)
        ├── lib/
        │   ├── AgentContext.tsx                # Navigation helpers
        │   └── validation/
        │       └── metadata-validator.ts       # Validation logic (FR-010)
        └── hooks/
            └── useLibraryMaterials.tsx        # InstantDB query hook
```

**Structure Decision**: Using existing web application monorepo structure (frontend + backend). No new directories required - all changes modify existing files or add validation utilities.

## Complexity Tracking

*No Constitution violations - all fixes use existing architecture*

## Technical Architecture

### Bug-030: Chat Navigation Fix

**Current State**: Uses `window.location.href` causing full page reload

**Target State**: Use Ionic tab navigation system with debouncing

**Implementation**:
1. Create `navigateToTab()` method in `AgentContext.tsx`
2. Wire to App.tsx's `handleTabChange()` callback
3. Update `AgentResultView.tsx` to use `navigateToTab('chat')`
4. Add 300ms debounce to prevent rapid clicks
5. Log navigation events for observability

**Files Modified**:
- `frontend/src/lib/AgentContext.tsx` (+48 lines)
- `frontend/src/components/AgentResultView.tsx` (+18, -7 lines)
- `frontend/src/App.tsx` (+1, -3 lines - fix stale closure)

### Bug-025: Message Field Mismatch

**Current State**: Messages may use incorrect field names

**Target State**: All messages use correct InstantDB schema fields

**Implementation**:
1. Audit `chatService.ts` for field name consistency
2. Ensure `content`, `role`, `timestamp`, `message_index` used
3. Remove any direct `userId` field references (use links)
4. Add metadata field population for agent messages
5. Validate metadata before save

**Files Modified**:
- `backend/src/services/chatService.ts` (audit + fixes)
- No schema migration needed (schema already correct)

### Bug-020: Library Display

**Current State**: Library shows placeholder despite having materials

**Target State**: Library queries and displays materials

**Implementation**:
1. Add InstantDB `useQuery` hook in `Library.tsx`
2. Query `library_materials` with `user_id` filter
3. Conditionally render materials grid vs. placeholder
4. Add loading state handling
5. Log query results for debugging

**Files Modified**:
- `frontend/src/pages/Library/Library.tsx` (+30 lines query logic)
- `frontend/src/hooks/useLibraryMaterials.tsx` (potentially create hook)

### Bug-019: Metadata Field

**Current State**: `library_materials` schema missing `metadata` field

**Target State**: Metadata field exists and stores originalParams

**Implementation**:
1. Add `metadata: i.string().optional()` to schema
2. Push schema update: `npx instant-cli push-schema`
3. Update material creation code to populate metadata
4. Implement metadata validation (FR-010)
5. Handle validation failures gracefully (FR-010a)

**Files Modified**:
- `backend/src/schemas/instantdb.ts` (+1 line schema field)
- `backend/src/services/materialService.ts` (metadata population)
- `frontend/src/lib/validation/metadata-validator.ts` (NEW FILE - validation)

## Implementation Phases

### Phase 0: Preparation

**No research needed** - all technical decisions already made in spec clarifications

**Prerequisites Check**:
- ✅ InstantDB schema documented in data-model.md
- ✅ Navigation approach decided (Ionic tab system)
- ✅ Validation rules specified (FR-010)
- ✅ Error handling defined (FR-010a)
- ✅ Logging requirements specified (FR-011)

### Phase 1: Schema & Validation

**Objective**: Prepare database and validation infrastructure

**Tasks**:
1. Add `metadata` field to `library_materials` schema
2. Push schema update to InstantDB
3. Create metadata validation utility
4. Add validation tests
5. Document validation rules in contracts/

**Deliverables**:
- Updated `instantdb.ts` schema file
- New `metadata-validator.ts` utility
- Validation tests in contracts/
- Schema migration logged

**Success Criteria**:
- Schema update succeeds without errors
- Validation utility handles all edge cases (FR-010)
- Tests cover valid, invalid, oversized, malicious inputs

### Phase 2: Navigation Fix

**Objective**: Fix "Weiter im Chat" navigation

**Tasks**:
1. Add `navigateToTab()` to AgentContext
2. Wire navigation callback to App.tsx
3. Update AgentResultView to use new navigation
4. Add debouncing (300ms cooldown)
5. Add navigation event logging

**Deliverables**:
- Updated AgentContext with navigation method
- Updated AgentResultView button handlers
- Fixed stale closure in App.tsx
- Navigation event logs

**Success Criteria**:
- No page reload on navigation
- Lands on Chat tab (not Library)
- Rapid clicks handled gracefully
- Console shows navigation events

### Phase 3: Library Query

**Objective**: Display materials in Library tab

**Tasks**:
1. Add InstantDB query to Library.tsx
2. Implement conditional rendering
3. Add loading state handling
4. Test with 0, 1, and many materials
5. Add query error handling

**Deliverables**:
- Library query implementation
- Conditional grid vs. placeholder rendering
- Loading spinner during query
- Error boundary for query failures

**Success Criteria**:
- Materials display when present
- Placeholder shows when empty
- Query completes in <1 second
- No console errors

### Phase 4: Message Persistence

**Objective**: Fix message field names and metadata

**Tasks**:
1. Audit chatService.ts for field consistency
2. Fix any field name mismatches
3. Add metadata population for agent messages
4. Implement metadata validation on save
5. Add error logging for validation failures

**Deliverables**:
- Audited chatService.ts with fixes
- Metadata population in message creation
- Validation integrated in save flow
- Error handling for invalid metadata

**Success Criteria**:
- All messages use correct field names
- Agent messages include metadata
- Validation prevents invalid data
- Graceful degradation on validation failure

### Phase 5: E2E Verification

**Objective**: Achieve ≥90% test pass rate

**Tasks**:
1. Run full E2E test suite
2. Document test results in session log
3. Fix any remaining blockers
4. Manual verification of all 4 user stories
5. Update bug-tracking.md status

**Deliverables**:
- E2E test report with ≥90% pass rate
- Session log with manual verification
- Updated bug status in bug-tracking.md
- Screenshots for each user story

**Success Criteria**:
- ≥10/11 E2E test steps pass
- All 4 user stories verified manually
- Zero active bugs in bug-tracking.md
- Definition of Done met

## Dependencies & Risks

### External Dependencies

- InstantDB schema push service (available)
- OpenAI API for image generation tests (available)
- Playwright test infrastructure (configured)

### Technical Risks

**Risk 1**: InstantDB schema migration fails
- **Mitigation**: Test schema update in development first
- **Fallback**: Manual schema correction in InstantDB dashboard

**Risk 2**: Navigation still goes to wrong tab after fix
- **Mitigation**: Add extensive logging to diagnose
- **Fallback**: Investigate Ionic tab state management

**Risk 3**: Library query returns empty despite data
- **Mitigation**: Test query in InstantDB dashboard first
- **Fallback**: Check user_id filter and permissions

**Risk 4**: E2E tests still fail after fixes
- **Mitigation**: Incremental testing after each phase
- **Fallback**: Manual verification + diagnostic screenshots

### Timeline Estimates

- Phase 1 (Schema & Validation): 45 min
- Phase 2 (Navigation Fix): 60 min
- Phase 3 (Library Query): 45 min
- Phase 4 (Message Persistence): 60 min
- Phase 5 (E2E Verification): 90 min
- **Total**: ~5 hours (1 work session)

## Quality Assurance

### Testing Strategy

**E2E Tests** (primary verification):
- Run `npx playwright test` after all phases complete
- Target: ≥10/11 steps passing (90%)
- Generate HTML report for documentation

**Manual Tests** (required):
- User Story 1: Navigation test (click "Weiter im Chat" 5x)
- User Story 2: Message persistence test (send + refresh)
- User Story 3: Library display test (generate 3 images)
- User Story 4: Metadata regeneration test (pre-fill check)

**Unit Tests** (optional):
- Metadata validation utility tests
- Navigation debounce logic tests

### Success Metrics

**From spec.md Success Criteria**:
- SC-001: E2E pass rate 54.5% → ≥90% ✅
- SC-002: 4 active bugs → 0 active bugs ✅
- SC-003: Navigation <500ms without reload ✅
- SC-004: Library load <1s ✅
- SC-005: 100% new images have metadata ✅
- SC-006: Zero InstantDB schema errors ✅
- SC-007: All 4 user stories verified ✅
- SC-008: Build with 0 TypeScript errors ✅
- SC-009: All pre-commit hooks pass ✅

## References

- **Feature Spec**: [spec.md](./spec.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Testing Guide**: [quickstart.md](./quickstart.md)
- **Validation Schemas**: [contracts/](./contracts/)
- **Bug Reports**: `docs/quality-assurance/bug-tracking.md` (BUG-019, BUG-020, BUG-025, BUG-030)
- **E2E Test**: `teacher-assistant/frontend/e2e-tests/bug-fixes-2025-10-11.spec.ts`
- **InstantDB Schema**: `teacher-assistant/backend/src/schemas/instantdb.ts`

## Next Steps

1. ✅ Plan complete (this file)
2. **Next**: Run `/speckit.tasks` to generate tasks.md with concrete implementation steps
3. **Then**: Execute tasks sequentially, following Definition of Done for each
4. **Finally**: Document work in session log with evidence

---

**Plan Status**: ✅ COMPLETE - Ready for task generation
**Prepared by**: SpecKit Planning Workflow
**Date**: 2025-10-13
