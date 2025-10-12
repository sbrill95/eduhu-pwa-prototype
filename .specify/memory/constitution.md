<!--
SYNC IMPACT REPORT
==================
Version: NEW → 1.0.0 (Initial Constitution)
Rationale: MINOR bump - Initial constitution establishment with core principles

Modified Principles: N/A (new constitution)
Added Sections:
  - Core Principles (5 principles)
  - Development Workflow
  - Quality Standards
  - Governance

Removed Sections: N/A (new constitution)

Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section aligns
  ✅ .specify/templates/spec-template.md - Requirements section aligns
  ✅ .specify/templates/tasks-template.md - Phase structure aligns with DoD
  ⚠ CLAUDE.md - Consider consolidating with constitution (currently redundant)

Follow-up TODOs: None
-->

# Teacher Assistant Constitution

## Core Principles

### I. SpecKit-First (NON-NEGOTIABLE)

**Rule**: ALL development work (features, bugs, refactoring) MUST follow the SpecKit workflow unless explicitly exempted.

**Process**:
- Before starting ANY task, check `.specify/specs/[feature-name]/` for existing SpecKit
- If no SpecKit exists: STOP and ask user whether to create one
- Work from `tasks.md` task list, reading `spec.md` and `plan.md` for context
- Mark tasks complete in `tasks.md` only when Definition of Done criteria met

**Exemptions** (require user approval):
- Critical hotfixes (<15 minutes work)
- Documentation-only updates
- Code cleanup without logic changes

**Rationale**: Prevents ad-hoc development, ensures requirements are captured, enables incremental delivery, and maintains project traceability.

### II. Definition of Done (NON-NEGOTIABLE)

**Rule**: A task is ONLY complete when ALL four quality gates pass:

1. **Build Clean**: `npm run build` → 0 TypeScript errors
2. **Tests Pass**: `npm test` → all tests pass
3. **Manual Test**: Feature works end-to-end (documented in session log)
4. **Pre-Commit Pass**: `git commit` succeeds (hooks pass)

**Agent Compliance**:
- Mark task as ✅ in `tasks.md` ONLY when all criteria met
- If blocked: keep task as ⏳ in_progress, document blocker, create resolution task
- Session log MUST include: build output, test results, manual verification

**Rationale**: Prevents incomplete work from being marked done, ensures code quality at commit time, provides audit trail for verification.

### III. TypeScript Everywhere

**Rule**: ALL code MUST be TypeScript - no `.js` files in `src/` directories.

**Standards**:
- Zero TypeScript errors in build
- No `@ts-ignore` or `@ts-expect-error` without explicit justification
- Shared types in `teacher-assistant/shared/types/` for cross-package consistency
- Functional React components with proper type definitions

**Rationale**: Type safety catches bugs early, improves IDE support, enables safe refactoring, and serves as living documentation.

### IV. Documentation & Traceability

**Rule**: Every development session MUST produce a session log with concrete evidence of work completed.

**Location Rules** (NEVER create files in repository root):
- **Session Logs**: `docs/development-logs/sessions/YYYY-MM-DD/session-XX-feature-name.md`
- **Bug Reports**: `docs/quality-assurance/resolved-issues/YYYY-MM-DD/`
- **QA Reports**: `docs/quality-assurance/verification-reports/YYYY-MM-DD/`
- **Test Reports**: `docs/testing/test-reports/YYYY-MM-DD/`

**Session Log Requirements**:
- Task ID and description
- Files modified
- Build output
- Test results
- Manual verification steps
- Any blockers or deviations

**Rationale**: Creates audit trail, enables knowledge transfer, facilitates debugging, and proves work completion.

### V. Tech Stack Consistency

**Mandatory Technologies**:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + InstantDB
- **Backend**: Node.js + Express + TypeScript + OpenAI SDK
- **Database**: InstantDB for auth, real-time queries, and storage
- **Testing**: Playwright for E2E, Jest/Vitest for unit tests
- **Linting**: ESLint + Prettier (enforced via pre-commit hooks)

**Architecture Rules**:
- Functional React components with hooks (no class components)
- Tailwind for ALL styling (no custom CSS files)
- InstantDB for ALL data operations (no direct database access)
- Shared types for backend/frontend contract enforcement

**Rationale**: Reduces cognitive load, prevents technology sprawl, ensures team consistency, and simplifies onboarding.

## Development Workflow

### SpecKit Structure

Every feature MUST have three artifacts in `.specify/specs/[feature-name]/`:

1. **spec.md**: WHAT & WHY (user stories, requirements, acceptance criteria)
2. **plan.md**: HOW (technical approach, architecture, implementation strategy)
3. **tasks.md**: CONCRETE STEPS (checkboxed task list with dependencies)

### Work Execution Flow

1. **Planning Phase**: User creates or approves SpecKit via `/speckit.specify` + `/speckit.plan`
2. **Task Generation**: Generate tasks via `/speckit.tasks` command
3. **Implementation**: Work through `tasks.md` sequentially or in parallel (marked [P])
4. **Quality Gates**: Each task must pass Definition of Done before marking complete
5. **Session Logging**: Create session log after each work session with evidence
6. **Bug Tracking**: Document any issues in `docs/quality-assurance/bug-tracking.md`

### Parallel Work

- Tasks marked `[P]` in `tasks.md` can run concurrently (different files, no dependencies)
- Use TodoWrite tool to track in-progress tasks (limit: ONE task in_progress at a time per agent)
- User stories should be independently testable and deliverable

## Quality Standards

### Pre-Commit Hooks (Enforced)

- TypeScript compilation check
- ESLint critical error check
- Test suite execution
- Formatting validation (Prettier)

**Configured via**: Husky in repository root

### Code Review Requirements

- All changes require explicit user approval before commit
- Pull requests must reference SpecKit spec and task IDs
- Breaking changes require constitution compliance justification

### Testing Discipline

- **Unit Tests**: Required for business logic and utilities
- **Integration Tests**: Required for API endpoints and database operations
- **E2E Tests**: Required for critical user journeys (Playwright)
- Tests MUST be written BEFORE implementation when using TDD approach
- Manual testing MUST be documented in session logs

## Governance

### Amendment Procedure

1. Propose changes via discussion with rationale
2. Update constitution with version bump (see versioning rules below)
3. Update dependent templates and documentation
4. Create sync impact report (HTML comment at top of this file)
5. Commit with message: `docs: amend constitution to vX.Y.Z (description)`

### Versioning Policy

- **MAJOR** (X.0.0): Backward-incompatible governance changes, principle removals
- **MINOR** (0.X.0): New principles added, material guidance expansions
- **PATCH** (0.0.X): Clarifications, wording fixes, typos

### Compliance Review

- Constitution supersedes all other documentation when conflicts arise
- All pull requests must verify compliance with applicable principles
- Complexity violations (e.g., adding new tech, skipping SpecKit) require explicit justification
- Agent instructions in `CLAUDE.md` must align with constitution principles

### Runtime Guidance

- **Primary Reference**: This constitution
- **Agent Instructions**: `CLAUDE.md` (must stay synchronized with constitution)
- **Template Reference**: `.specify/templates/` (plan, spec, tasks, DoD)
- **SpecKit Commands**: `.specify/templates/commands/*.md` (automated workflows)

**Version**: 1.0.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-10-11
