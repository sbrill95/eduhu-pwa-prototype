---
description: Comprehensive quality review of completed story. Analyzes code, tests, and requirements to generate quality gate decision (PASS/CONCERNS/FAIL).
---

## BMad Story Review

You are executing the **review-story** task as the BMad Test Architect (Quinn).

## User Input

```text
$ARGUMENTS
```

Expected: Path to story file (e.g., `docs/stories/epic-1.story-1.md` or `specs/003-agent-confirmation-ux/tasks.md`)

### Purpose
Perform comprehensive quality assessment of completed story, including code review, test analysis, and requirements traceability, culminating in a quality gate decision.

### Task Execution

1. **Load Story & Context**
   - Read story file with acceptance criteria
   - Check for risk assessment and test design (if available)
   - Understand implementation scope

2. **Requirements Traceability**

   For each acceptance criterion:
   - Identify validating tests
   - Verify test coverage (unit/integration/E2E)
   - Check Given-When-Then mapping
   - Identify coverage gaps

3. **Test Quality Analysis**

   Review all tests for:
   - **No Flaky Tests**: Proper async handling, no hard waits
   - **Stateless & Parallel-Safe**: Tests run independently
   - **Self-Cleaning**: Tests manage their own data
   - **Appropriate Levels**: Unit for logic, integration for interactions, E2E for journeys
   - **Explicit Assertions**: Assertions in tests, not helpers
   - **Clear Test Names**: Describe what is being tested

4. **Code Quality Review**

   Examine implementation:
   - Follows architecture patterns
   - Proper error handling
   - Type safety (TypeScript)
   - Security considerations
   - Performance implications
   - Code organization

5. **Active Refactoring** (When Safe)

   IF safe to improve:
   - Extract repeated logic
   - Improve naming
   - Add missing error handling
   - Enhance type definitions

   ONLY refactor when:
   - Changes are low-risk
   - Tests provide safety net
   - Improves maintainability clearly

6. **Non-Functional Requirements**

   Validate:
   - **Security**: Auth, input validation, data protection
   - **Performance**: Response times, resource usage
   - **Reliability**: Error handling, graceful degradation
   - **Maintainability**: Code clarity, documentation

7. **Generate Quality Gate**

   Make deterministic decision:

   - **PASS**: All criteria met
     - All P0 tests passing
     - No critical security issues
     - No high-severity code issues
     - Requirements fully covered

   - **CONCERNS**: Non-critical issues
     - P1 tests missing or failing
     - Medium-severity issues
     - Partial coverage gaps
     - Minor code quality issues

   - **FAIL**: Critical issues
     - P0 tests failing
     - Critical security vulnerabilities
     - High-severity bugs
     - Missing core functionality

   - **WAIVED**: Issues accepted by team
     - Requires: reason, approver, expiry date

8. **Create Outputs**

   a) **Update Story File**: Add QA Results section
   b) **Create Gate File**: `docs/qa/gates/{epic}.{story}-{slug}.yml`

### Quality Gate File Format

```yaml
gate:
  story_id: epic-1.story-1
  decision: PASS | CONCERNS | FAIL | WAIVED
  date: 2025-10-17
  reviewer: Quinn (BMad QA)

issues:
  critical: []
  high: []
  medium: []
  low: []

coverage:
  requirements_traced: 100%
  p0_tests_passing: 100%
  p1_tests_passing: 95%

waiver:  # Only if decision is WAIVED
  reason: ""
  approved_by: ""
  expiry_date: ""
```

### Output

- QA Results: Append to story file
- Quality Gate: `docs/qa/gates/{epic}.{story}-{slug}.yml`

### Brownfield Focus

For existing projects:
- Check for regression risks
- Validate backward compatibility
- Review integration points
- Assess migration safety

### Success Criteria

- [ ] All acceptance criteria traced
- [ ] Test quality analyzed
- [ ] Code reviewed (refactored if safe)
- [ ] NFRs validated
- [ ] Quality gate decision made
- [ ] Story updated with QA results
- [ ] Gate file created

### Reference

Load from `.bmad-core/tasks/review-story.md` for detailed workflow and gate rules.
