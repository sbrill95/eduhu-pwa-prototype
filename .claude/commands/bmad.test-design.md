---
description: Create comprehensive test strategy for a story. Defines test scenarios, levels (unit/integration/E2E), priorities, and execution approach.
---

## BMad Test Design

You are executing the **test-design** task as the BMad Test Architect (Quinn).

## User Input

```text
$ARGUMENTS
```

Expected: Path to story file or feature spec (e.g., `specs/003-agent-confirmation-ux/spec.md`)

### Purpose
Create a comprehensive, risk-based test strategy that guides developers on what tests to write and how to prioritize them.

### Task Execution

1. **Load Story/Spec**
   - Read the provided story or spec file
   - Extract user stories and acceptance criteria
   - Understand technical implementation approach

2. **Map Test Scenarios**

   For each acceptance criterion:
   - Create specific test scenarios
   - Use Given-When-Then format for clarity
   - Include positive and negative cases
   - Cover edge cases and error conditions

3. **Determine Test Levels**

   For each scenario, assign appropriate level:

   - **Unit Tests**: Pure logic, individual functions/methods
     - Fast, isolated, no external dependencies
     - Mock all external interactions

   - **Integration Tests**: Component interactions
     - Database operations, API calls
     - Service layer testing
     - Component integration

   - **E2E Tests**: Complete user journeys
     - Browser automation (Playwright/Cypress)
     - Full application flows
     - Critical paths only

4. **Prioritize Tests**

   Use risk-based prioritization:

   - **P0 (Must Have)**: Critical functionality, high-risk areas
     - Linked to risks scored ≥7 from risk assessment
     - Core user journeys
     - Security-critical paths

   - **P1 (Should Have)**: Important but not critical
     - Medium risks (4-6 score)
     - Common use cases
     - Integration points

   - **P2 (Nice to Have)**: Low-risk, edge cases
     - Low risks (1-3 score)
     - Rare scenarios
     - Additional validation

5. **Define Test Data & Mocks**

   - Required test data fixtures
   - Mock strategies for external services
   - Test database setup/teardown
   - API mocking approach

6. **Create Execution Strategy**

   - CI/CD integration points
   - Test running order
   - Parallel execution opportunities
   - Performance benchmarks

7. **Generate Test Design Document**

   Include:
   - Test summary (total, by level, by priority)
   - Detailed scenario breakdown
   - Test data requirements
   - Execution strategy
   - Success metrics

### Output

Save to: `docs/qa/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md`

### Test Summary Format

```yaml
test_summary:
  total: 24
  by_level:
    unit: 15
    integration: 7
    e2e: 2
  by_priority:
    P0: 8    # Must have - critical paths
    P1: 10   # Should have - important cases
    P2: 6    # Nice to have - edge cases
```

### Success Criteria

- [ ] All acceptance criteria have test scenarios
- [ ] Test levels appropriately assigned
- [ ] Risk-based prioritization applied
- [ ] Test data/mock strategy defined
- [ ] Execution strategy documented
- [ ] Output saved to correct location

### Reference

Load from `.bmad-core/tasks/test-design.md` for detailed workflow if needed.
