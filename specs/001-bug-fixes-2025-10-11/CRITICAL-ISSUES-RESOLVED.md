# Critical Issues Resolution: Bug Fixes 2025-10-11

**Date**: 2025-10-11
**Status**: RESOLVED - Ready for Task Generation
**Purpose**: Document resolution of 8 high-priority checklist issues identified in peer review

---

## CHK109: FR-004/FR-010 Conflict - Metadata Validation on JSON String

**Issue**: FR-004 states metadata stored as JSON string, but FR-010 requires validating metadata JSON. How is validation performed on a string?

**Root Cause**: Ambiguity about when string conversion happens in the data flow.

**Resolution**:
- **Validation timing**: Validation occurs on the JavaScript object BEFORE JSON.stringify()
- **Data flow**: `metadata object → Zod validation → JSON.stringify() → save to InstantDB`
- **Location**: Backend receives metadata as object in request body, validates with Zod schema, then stringifies for InstantDB storage

**Updated Requirements**:
- **FR-010** clarified: "System MUST validate metadata **object** before stringifying and saving to InstantDB"
- **FR-004** clarified: "System MUST stringify validated metadata object using JSON.stringify() for InstantDB storage"

**Impact**: No breaking changes - clarifies implementation approach.

---

## CHK111: FR-010a/FR-008 Conflict - Save Without Metadata vs. Preserve originalParams

**Issue**: FR-010a says "save without metadata" on validation failure, but FR-008 requires preserving originalParams for regeneration feature - conflict?

**Root Cause**: Unclear whether "save without metadata" means skip field entirely or save empty/null value.

**Resolution**:
- **Priority**: Data integrity over feature completeness
- **Behavior on validation failure**: Save core content (message/library_material) with metadata field set to `null` (not omitted)
- **Re-generation feature degradation**: If metadata is null, "Neu generieren" button shows disabled state or opens empty form (graceful degradation)
- **User feedback**: Show warning toast: "Bild wurde gespeichert, aber Metadaten konnten nicht validiert werden"

**Updated Requirements**:
- **FR-010a** clarified: "save core content with metadata field set to `null`" (was: "save without metadata field")
- **FR-008** clarified: "preserve originalParams where validation passes; gracefully degrade re-generation UI when metadata is null"

**Impact**: Allows partial success - image saved even if metadata invalid, user can still use image (but not re-generate).

---

## CHK113: Validation Location Ambiguity - Frontend, Backend, or Both?

**Issue**: Unclear where metadata validation occurs - frontend, backend, or both?

**Root Cause**: FR-010 doesn't specify validation enforcement point.

**Resolution**:
- **Frontend validation**: Immediate user feedback, non-blocking (can be bypassed by malicious users)
- **Backend validation**: Authoritative enforcement, security boundary
- **Strategy**: Defense in depth - validate in both locations

**Updated Requirements**:
- **FR-010b** (NEW): "Frontend MUST validate metadata before sending to backend and show validation errors in UI"
- **FR-010c** (NEW): "Backend MUST re-validate metadata as security enforcement; reject requests with invalid metadata (HTTP 400)"
- **FR-010** remains: Backend validation rules apply (required fields, sanitization, size limit)

**Impact**: Adds frontend validation requirement for better UX, clarifies backend is authoritative.

---

## CHK114: Schema Migration Procedure Ambiguity

**Issue**: What exactly is "schema migration" - code changes, CLI commands, or manual Dashboard actions?

**Root Cause**: FR-009 uses vague term "schema migration" without specifying tools/steps.

**Resolution**:
- **Tool**: Hybrid approach - InstantDB CLI for field additions, Dashboard for deletions
- **Reason**: CLI doesn't support dropping fields yet (per RT-002 research)
- **Procedure**:
  1. Update `instant.schema.ts` with new field definitions
  2. Run `npx instant-cli push` to add new fields
  3. Manually delete old fields via InstantDB Dashboard Explorer
  4. Verify schema with test query: `db.messages.get()`

**Updated Requirements**:
- **FR-009** expanded: "System MUST use InstantDB CLI (`npx instant-cli push`) to add metadata field, then manually drop old fields via Dashboard"
- **FR-009a** (NEW): "Developer MUST verify schema migration success by running test query and checking for zero schema errors (SC-006)"

**Impact**: Makes migration procedure explicit and testable.

---

## CHK008 & CHK015: Schema Migration Failure Recovery & Rollback

**Issues**:
- CHK008: No requirements for schema migration failure recovery
- CHK015: No rollback requirements if migration fails

**Root Cause**: Missing error handling and recovery procedures for destructive schema operation.

**Resolution**:
- **Limitation**: InstantDB doesn't support transactional schema changes or automated rollback
- **Mitigation**: Test-first approach + manual recovery procedures
- **Recovery steps**:
  1. Check InstantDB error logs for specific failure
  2. Restore from Dashboard version history if available (InstantDB may have snapshots)
  3. Re-run migration steps with fixes if fields partially created
  4. Worst case: manually recreate schema from backup definition

**Updated Requirements**:
- **FR-009b** (NEW): "Developer MUST test schema migration in development environment before applying to production"
- **FR-009c** (NEW): "If schema migration fails, developer MUST check InstantDB Dashboard error logs and attempt manual recovery via Dashboard version history"
- **FR-009d** (NEW): "System MUST log all schema migration steps to console (which fields added/dropped) for debugging"

**Updated Edge Cases**:
- Add: "If schema migration fails mid-operation (e.g., added new fields but couldn't drop old), recover by: checking Dashboard error logs, attempting rollback via Dashboard history, manually completing migration steps"

**Impact**: Acknowledges risk, provides manual recovery procedures, emphasizes testing.

---

## CHK019: Security Requirements Beyond "Prevent Injection"

**Issue**: FR-010 mentions "prevent injection" but doesn't specify attack vectors or sanitization method.

**Root Cause**: Vague security requirement without concrete implementation guidance.

**Resolution**:
- **Attack vectors to prevent**:
  1. **XSS (Cross-Site Scripting)**: `<script>`, `javascript:`, `on*` event handlers
  2. **Template injection**: `${}`, `{{}}` in user-controlled strings
  3. **Code injection**: `eval()`, `Function()` constructor
- **Sanitization library**: Use **DOMPurify** (industry standard) or manual regex
- **Scope**: Sanitize ALL string fields in metadata (title, description, subject, learningGroup)

**Updated Requirements**:
- **FR-010b** renamed to **FR-010d** and expanded: "System MUST sanitize metadata strings using DOMPurify.sanitize() to prevent XSS, removing: script tags, javascript: URLs, on* event handlers, eval/Function calls"
- **FR-010e** (NEW): "System MUST reject metadata containing template injection patterns: ${}, {{}}, <%=, #{}"

**Impact**: Makes security requirements concrete and testable.

---

## CHK035: Sanitization Specification - Specific Rules

**Issue**: "Sanitize all string values" (FR-010) lacks specific rules or library reference.

**Root Cause**: Ambiguous requirement without implementation guidance.

**Resolution**: Use DOMPurify library with specific configuration.

**Sanitization Rules**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizeMetadataString = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
    RETURN_DOM: false, // Return string
    RETURN_DOM_FRAGMENT: false,
  });
};
```

**Manual Alternative** (if DOMPurify unavailable):
```typescript
const sanitizeManual = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/eval\s*\(/gi, '') // Remove eval calls
    .replace(/Function\s*\(/gi, ''); // Remove Function constructor
};
```

**Updated Requirements**:
- **FR-010d** (from CHK019) now includes: "using DOMPurify.sanitize() with configuration: ALLOWED_TAGS=[], ALLOWED_ATTR=[], KEEP_CONTENT=true"

**Impact**: Provides concrete implementation with fallback option.

---

## Summary of Changes to Spec

### New Functional Requirements Added:
- **FR-009a**: Verify schema migration success with test query
- **FR-009b**: Test schema migration in development first
- **FR-009c**: Manual recovery procedure for failed migrations
- **FR-009d**: Log all schema migration steps to console
- **FR-010b**: Frontend validation for immediate user feedback
- **FR-010c**: Backend validation as authoritative security enforcement (HTTP 400 on invalid)
- **FR-010d**: DOMPurify sanitization with specific configuration
- **FR-010e**: Reject template injection patterns

### Functional Requirements Clarified:
- **FR-004**: Clarified that stringification happens AFTER validation
- **FR-008**: Added graceful degradation when metadata is null
- **FR-009**: Expanded with explicit CLI + Dashboard procedure
- **FR-010**: Clarified validation happens on object before stringification
- **FR-010a**: Changed "save without metadata field" to "save with metadata=null"

### Edge Cases Added:
- Schema migration failure recovery (manual Dashboard rollback)

### Success Criteria Updated:
- **SC-007**: Changed from "Manual testing confirms..." to "Automated E2E tests verify..." (see next section)

---

## Testing Strategy Change: Automated Tests Only

**Critical Update**: Since user cannot perform manual testing, ALL verification must be automated.

**Old SC-007**: "Manual testing confirms all 4 user stories work end-to-end"

**New SC-007**: "Automated E2E tests verify all 4 user stories work end-to-end (tests can be executed by qa-agent)"

**New SC-010**: "E2E test suite includes specific tests for: (a) navigation without page reload, (b) rapid click debouncing, (c) metadata validation & sanitization, (d) library materials display, (e) schema migration verification"

**QA Agent Role**:
- After implementation completes, qa-agent will:
  1. Run `VITE_TEST_MODE=true npx playwright test e2e-tests/bug-fixes-2025-10-11.spec.ts --project="Desktop Chrome - Chat Agent Testing" --reporter=list --workers=1`
  2. Verify SC-001: ≥90% E2E pass rate
  3. Verify SC-006: Zero InstantDB schema errors in console logs
  4. Verify SC-008: `npm run build` succeeds with 0 TypeScript errors
  5. Generate QA report with screenshots, console logs, test results

**E2E Test Requirements** (will be implemented in tasks):
```typescript
// e2e-tests/bug-fixes-2025-10-11.spec.ts
test.describe('Bug Fixes 2025-10-11', () => {
  test('BUG-030: Navigation to Chat tab (not Library)', async ({ page }) => {
    // Test FR-001, FR-002, FR-002a
  });

  test('BUG-025: Message persistence with correct schema', async ({ page }) => {
    // Test FR-003, FR-004, FR-009
  });

  test('BUG-020: Library displays materials (not placeholder)', async ({ page }) => {
    // Test FR-005, FR-006
  });

  test('BUG-019: Metadata persisted with originalParams', async ({ page }) => {
    // Test FR-007, FR-008, FR-010
  });

  test('Metadata validation and sanitization', async ({ page }) => {
    // Test FR-010b, FR-010c, FR-010d, FR-010e
  });

  test('Debouncing prevents duplicate navigation', async ({ page }) => {
    // Test FR-002a with rapid clicks
  });
});
```

---

## Parallelization Strategy

**Goal**: Allow multiple agents to work simultaneously without blocking.

**Parallelizable Tasks** (can run independently):
1. **BUG-030 (Navigation Fix)**: Modify AgentContext.tsx, AgentResultView.tsx
2. **BUG-020 (Library Display)**: Modify Library.tsx
3. **Validation Implementation**: Create validation utilities, Zod schemas
4. **Logging Implementation**: Create logger utility with ConsoleEventLogger

**Serial Tasks** (must run in order):
1. Schema migration (BUG-025, BUG-019) → MUST complete first (blocks data operations)
2. E2E test writing → After feature implementation
3. QA agent verification → After all implementations complete

**Task Dependency Graph**:
```
[Schema Migration] ────┐
                       ├─→ [Navigation Fix]  ──┐
[Validation Utils]     │                       │
                       ├─→ [Library Fix]      ├─→ [E2E Tests] ──→ [QA Agent Verification]
[Logging Utils]        │                       │
                       └─→ [Metadata Fix]  ────┘
```

**Recommendation**: Implement utilities first (validation, logging), then parallelize bug fixes, then write E2E tests, then run qa-agent.

---

## Approval Status

✅ **RESOLVED** - All 8 critical issues addressed with concrete requirements
✅ **TESTING STRATEGY UPDATED** - Manual testing replaced with automated E2E tests for qa-agent execution
✅ **PARALLELIZATION DEFINED** - Task dependency graph allows for parallel agent execution
✅ **READY FOR TASK GENERATION** - `/speckit.tasks` can now proceed

**Next Step**: Run `/speckit.tasks` to generate tasks.md with concrete implementation tasks
