# Implementation Plan: Bug Fixes 2025-10-11

**Branch**: `001-bug-fixes-2025-10-11` | **Date**: 2025-10-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bug-fixes-2025-10-11/spec.md`

## Summary

This feature resolves 4 critical bugs blocking completion of the Image Generation UX V2 workflow. The fixes address: (1) incorrect tab navigation after image generation (BUG-030), (2) InstantDB schema field mismatches in messages table (BUG-025), (3) Library.tsx showing placeholder instead of materials (BUG-020), and (4) missing metadata field preventing re-generation feature (BUG-019). Success criteria: E2E test pass rate increases from 54.5% to ≥90%, zero active bugs remaining, and all 4 user stories working end-to-end.

**Technical Approach**: Fix Ionic tab navigation in AgentContext, apply InstantDB schema migration for messages table, implement Library.tsx query logic, and ensure metadata field is properly configured in InstantDB schema. Add observability (error logs + navigation event logging), metadata validation (field checking + sanitization + 10KB limit), and debouncing (300ms cooldown with leading: true, trailing: false) to prevent race conditions.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend), Node.js 20.x (backend runtime)
**Primary Dependencies**:
- Frontend: React 18, Vite 5, Tailwind CSS 3, Ionic Framework 7, InstantDB SDK
- Backend: Express 4, OpenAI SDK 4, InstantDB Admin SDK
- Shared: Zod (validation), date-fns (utilities)

**Storage**: InstantDB (cloud-hosted) for messages, library_materials, user auth
**Testing**: Playwright 1.55 (E2E), Vitest (unit tests - if needed), manual verification
**Target Platform**: Web (desktop Chrome + mobile Safari), backend on Node.js server
**Project Type**: Web application (frontend + backend monorepo structure)
**Performance Goals**:
- Navigation: <500ms (SC-003)
- Library load: <1s (SC-004)
- E2E test pass rate: ≥90% (SC-001)

**Constraints**:
- Zero TypeScript errors (constitution + SC-008)
- Pre-commit hooks must pass (SC-009)
- No breaking changes to existing working features
- Metadata JSON <10KB (clarification)

**Scale/Scope**:
- Single-user development environment
- ~10-20 test materials in library
- 4 bug fixes, 11 functional requirements
- Target: 10/11 E2E test steps passing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. SpecKit-First (NON-NEGOTIABLE)
✅ **PASS** - SpecKit created: spec.md with 4 user stories, plan.md (this file), tasks.md (pending)

### II. Definition of Done (NON-NEGOTIABLE)
✅ **PASS** - Success criteria explicitly require:
- SC-008: Build succeeds with 0 TypeScript errors
- SC-009: All pre-commit hooks pass
- SC-007: Manual testing documented
- E2E tests as validation

###III. TypeScript Everywhere
✅ **PASS** - All fixes in .ts/.tsx files (AgentContext.tsx, Library.tsx, instantdbService.ts, chatService.ts)

### IV. Documentation & Traceability
✅ **PASS** - Session logs required by constitution, bug tracking in docs/quality-assurance/bug-tracking.md

### V. Tech Stack Consistency
✅ **PASS** - No new technologies introduced. Using existing stack:
- React + TypeScript + Vite + Tailwind + InstantDB (frontend)
- Node.js + Express + TypeScript (backend)
- Playwright (E2E testing)

**Result**: ✅ ALL GATES PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```
specs/001-bug-fixes-2025-10-11/
├── plan.md              # This file
├── research.md          # Phase 0 output (bug analysis + patterns)
├── data-model.md        # Phase 1 output (schema changes)
├── quickstart.md        # Phase 1 output (testing guide)
├── contracts/           # Phase 1 output (validation schemas)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```
teacher-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentConfirmationMessage.tsx (existing - no changes)
│   │   │   ├── AgentFormView.tsx (existing - add logging)
│   │   │   ├── AgentResultView.tsx (MODIFY - fix navigation)
│   │   │   └── MaterialPreviewModal.tsx (existing - no changes)
│   │   ├── pages/
│   │   │   ├── Chat/ChatView.tsx (existing - add logging)
│   │   │   └── Library/Library.tsx (MODIFY - fix query + placeholder)
│   │   ├── lib/
│   │   │   ├── AgentContext.tsx (MODIFY - fix tab navigation)
│   │   │   ├── api.ts (existing - no changes)
│   │   │   └── types.ts (existing - verify Message type)
│   │   └── hooks/
│   │       └── useChat.ts (existing - verify deduplication logic)
│   └── e2e-tests/
│       └── image-generation-complete-workflow.spec.ts (VERIFY - re-run)
│
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── chatService.ts (VERIFY - metadata handling)
│   │   │   └── instantdbService.ts (MODIFY - add validation utility)
│   │   ├── agents/
│   │   │   └── langGraphImageGenerationAgent.ts (VERIFY - originalParams)
│   │   └── routes/
│   │       ├── chat.ts (existing - no changes)
│   │       └── langGraphAgents.ts (VERIFY - metadata logging)
│   └── tests/
│       └── (unit tests if needed)
│
└── shared/
    └── types/
        ├── api.ts (VERIFY - AgentSuggestion.prefillData type)
        └── agents.ts (existing - no changes)
```

**Structure Decision**: Web application (Option 2) with existing `teacher-assistant/` monorepo containing frontend/, backend/, and shared/. No new directories needed - all fixes modify existing files or add utilities. InstantDB schema changes handled via instant.schema.ts in repository root.

## Complexity Tracking

*No constitution violations - section not needed*

---

# Phase 0: Outline & Research

## Research Tasks

### RT-001: Ionic Framework Tab Navigation Best Practices

**Question**: How to programmatically navigate between Ionic tabs without triggering page reload?

**Context**: BUG-030 shows that `navigateToTab('chat')` activates wrong tab (Library instead of Chat). Current implementation in AgentContext.tsx uses callback to App.tsx's `handleTabChange`, but wrong tab activates.

**Research Needed**:
- Ionic 7 documentation for programmatic tab switching
- Common pitfalls with React + Ionic integration
- How Ionic Router vs. React Router affects tab state
- Proper way to set active tab programmatically

### RT-002: InstantDB Schema Migration Patterns

**Question**: What is the correct procedure for migrating InstantDB schema fields in a single transaction?

**Context**: BUG-025 indicates messages table has field mismatches. Clarification specifies aggressive migration (drop old, create new, migrate data in single transaction). Need to understand InstantDB's migration capabilities.

**Research Needed**:
- InstantDB schema evolution documentation
- How to drop and recreate fields
- Transaction support for schema changes
- Data migration scripts or built-in tools

### RT-003: Metadata JSON Validation & Sanitization in TypeScript

**Question**: What is the best pattern for validating and sanitizing JSON metadata before saving to InstantDB?

**Context**: FR-010 requires validation of required fields, string sanitization, and <10KB size limit. Need to prevent XSS/injection while allowing legitimate metadata.

**Research Needed**:
- Zod schema validation for nested JSON
- String sanitization libraries (DOMPurify, sanitize-html, or manual)
- Size limit checking patterns
- Error handling for validation failures (per FR-010a)

### RT-004: Debouncing in React Components

**Question**: Best practice for debouncing button clicks in React to prevent rapid-fire events?

**Context**: Clarification specifies 300ms debounce for "Weiter im Chat" button. Need React-friendly debounce pattern that works with event handlers.

**Research Needed**:
- `lodash.debounce` vs. custom hook
- `useCallback` with debounce
- Preventing state updates after unmount
- Testing debounced functions

### RT-005: Browser Console Logging Best Practices

**Question**: What logging pattern provides good observability without impacting performance?

**Context**: FR-011 requires error logs + navigation event logs. Need structured logging that's easy to filter in DevTools.

**Research Needed**:
- `console.error` vs. `console.warn` vs. `console.log` conventions
- Structured logging formats (JSON vs. string)
- Performance impact of console logging
- Conditional logging (development vs. production)

---

# Phase 1: Design & Contracts

## Data Model Changes

See [data-model.md](./data-model.md) (generated in Phase 1)

**Preview**:
- InstantDB `messages` table schema update
- InstantDB `library_materials` metadata field configuration
- Metadata JSON structure validation schema

## API Contracts

See [contracts/](./contracts/) (generated in Phase 1)

**Preview**:
- `metadata-validation.schema.json` - Zod schema for FR-010
- `navigation-events.schema.json` - TypeScript interfaces for logging
- `instantdb-schema.ts` - Schema migration definition

## Quickstart Guide

See [quickstart.md](./quickstart.md) (generated in Phase 1)

**Preview**:
- How to run E2E tests
- How to verify bug fixes manually
- How to check console logs for navigation events
- How to test metadata validation

---

**Note**: This plan stops after Phase 1. Phase 2 (task generation) will be triggered by `/speckit.tasks` command after plan approval.
