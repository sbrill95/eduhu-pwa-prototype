# Story: E2E Tests for Router + Basic Image Agent

**Epic:** 3.0 - Foundation & Migration
**Story ID:** epic-3.0.story-5
**Created:** 2025-10-20
**Status:** Ready for Development
**Priority:** P0 (Critical - Testing Infrastructure)
**Sprint:** Next Sprint (after Story 4 completion)
**Assignee:** Dev Agent

## Context

With the OpenAI Agents SDK setup complete (Story 1), router agent implemented (Story 2), DALL-E migration done (Story 3), and dual-path support in place (Story 4), we need comprehensive E2E tests to validate the entire new agent system. This story ensures the router correctly classifies intents and routes to the appropriate agents, with full end-to-end verification.

### Prerequisites
- ✅ Story 3.0.1: SDK Setup & Authentication COMPLETE
- ✅ Story 3.0.2: Router Agent Implementation COMPLETE
- ✅ Story 3.0.3: DALL-E Migration COMPLETE
- ✅ Story 3.0.4: Dual-Path Support COMPLETE
- ✅ Existing E2E test infrastructure working

## Problem Statement

We need comprehensive E2E tests to validate:
1. Router agent correctly classifies user intents (create vs edit)
2. Proper routing from router to specialized agents
3. Manual override functionality for router decisions
4. Complete user journey from input to image generation
5. Performance meets requirements (≤15s response time)

Without these tests, we cannot confidently deploy the new agent system to production.

## User Story

**As a** QA engineer validating the new agent system
**I want** comprehensive E2E tests covering all router and agent interactions
**So that** we can ensure the migration maintains quality and performance

## Acceptance Criteria

### AC1: Router Intent Classification Tests
- [ ] E2E test for "create image" intent classification
  - Test inputs: "Create an image of...", "Generate a picture...", "Make an illustration..."
  - Verify router returns "create" intent with ≥95% confidence
  - Capture screenshots of router response
- [ ] E2E test for "edit image" intent classification
  - Test inputs: "Edit this image...", "Modify the picture...", "Change the background..."
  - Verify router returns "edit" intent with ≥95% confidence
  - Capture screenshots of router response
- [ ] E2E test for ambiguous intent handling
  - Test inputs with unclear intent
  - Verify router provides confidence score
  - Verify fallback to manual selection when confidence <70%

### AC2: End-to-End Image Creation Flow
- [ ] Complete workflow test: User input → Router → Image Agent → Result
  - Start from chat interface
  - Input image creation request
  - Verify router classification appears
  - Verify routing to image agent
  - Verify image generation completes
  - Verify image displays in chat
  - Capture screenshots at each step
- [ ] Performance validation
  - Measure total time from input to image display
  - Must complete in ≤15 seconds
  - Log timing for each step

### AC3: Manual Override Testing
- [ ] Test manual override button appearance
  - When router confidence is low (<70%)
  - When user hovers over router decision
- [ ] Test override functionality
  - Click override button
  - Select different agent manually
  - Verify request routes to selected agent
  - Capture screenshots of override UI

### AC4: Entity Extraction Validation
- [ ] Test entity extraction from prompts
  - Subject detection (e.g., "dinosaur", "math worksheet")
  - Grade level detection (e.g., "5th grade", "elementary")
  - Topic detection (e.g., "biology", "geometry")
  - Style detection (e.g., "cartoon", "realistic")
- [ ] Verify entities passed to image agent
  - Check API request payload
  - Verify enhanced prompt includes entities

### AC5: Error Handling & Edge Cases
- [ ] Test router timeout handling (>5 seconds)
- [ ] Test fallback when router fails
- [ ] Test with empty/invalid inputs
- [ ] Test with very long prompts (>1000 chars)
- [ ] Verify graceful degradation to direct agent selection

### AC6: Screenshot Documentation
- [ ] All tests capture before/after screenshots
- [ ] Screenshots saved to `docs/testing/screenshots/YYYY-MM-DD/`
- [ ] Naming convention: `test-name-step-description.png`
- [ ] Full page captures for workflow verification

## Technical Requirements

### Test Structure
```typescript
// teacher-assistant/frontend/e2e-tests/router-agent-tests.spec.ts

describe('Router Agent E2E Tests', () => {
  describe('Intent Classification', () => {
    test('Classifies create intent correctly')
    test('Classifies edit intent correctly')
    test('Handles ambiguous intent with low confidence')
  })

  describe('End-to-End Workflow', () => {
    test('Complete image creation via router')
    test('Performance meets <15s requirement')
  })

  describe('Manual Override', () => {
    test('Shows override button on low confidence')
    test('Manual selection bypasses router')
  })

  describe('Entity Extraction', () => {
    test('Extracts subject, grade, topic, style')
    test('Entities enhance final prompt')
  })

  describe('Error Handling', () => {
    test('Handles router timeout gracefully')
    test('Falls back to manual selection on error')
  })
})
```

### Test Data Requirements
- Minimum 20 test prompts for each intent type
- Include edge cases and ambiguous prompts
- Test data file: `test-data/router-test-prompts.json`

### Performance Benchmarks
- Router classification: <500ms
- Total end-to-end: <15s
- Manual override response: <100ms

## Task Breakdown

### Task 1: Setup Test Infrastructure
- [ ] Create `router-agent-tests.spec.ts` file
- [ ] Setup test data structure and fixtures
- [ ] Configure screenshot capture helpers
- [ ] Setup performance measurement utilities

### Task 2: Implement Intent Classification Tests
- [ ] Write tests for create intent classification
- [ ] Write tests for edit intent classification
- [ ] Write tests for ambiguous intent handling
- [ ] Add confidence score validation

### Task 3: Implement End-to-End Workflow Tests
- [ ] Write complete workflow test
- [ ] Add performance timing measurement
- [ ] Implement screenshot capture at each step
- [ ] Add API request/response validation

### Task 4: Implement Manual Override Tests
- [ ] Write tests for override button visibility
- [ ] Write tests for manual agent selection
- [ ] Test override persistence across sessions
- [ ] Add screenshot verification

### Task 5: Implement Entity Extraction Tests
- [ ] Write tests for subject extraction
- [ ] Write tests for grade level extraction
- [ ] Write tests for topic extraction
- [ ] Write tests for style extraction
- [ ] Validate entity propagation to agents

### Task 6: Implement Error Handling Tests
- [ ] Write timeout handling tests
- [ ] Write fallback mechanism tests
- [ ] Write invalid input tests
- [ ] Write edge case tests

### Task 7: Documentation and Reporting
- [ ] Create test execution report template
- [ ] Document test coverage metrics
- [ ] Create visual test result dashboard
- [ ] Write troubleshooting guide

## Dependencies

### Technical Dependencies
- Stories 3.0.1-4 must be COMPLETE
- OpenAI SDK agents must be deployed
- Router agent must be accessible via API
- Test environment with SDK enabled

### Data Dependencies
- Test prompt dataset prepared
- Expected classification results defined
- Performance baseline established

## Success Criteria

Story is complete when:
- ✅ All 6 acceptance criteria met
- ✅ 100% of tests passing consistently
- ✅ Test execution time <5 minutes total
- ✅ Screenshot verification complete
- ✅ Performance benchmarks validated
- ✅ Test coverage ≥90% for router logic
- ✅ Documentation and reports generated

## Definition of Done

- [ ] All E2E tests written and passing
- [ ] Screenshots captured for all scenarios
- [ ] Performance metrics documented
- [ ] Zero console errors in tests
- [ ] Test data committed to repo
- [ ] CI/CD pipeline updated to run new tests
- [ ] Test execution report generated
- [ ] Code review completed
- [ ] Documentation updated

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flaky tests due to async router | HIGH | Proper wait conditions, retry logic |
| Test data bias affecting results | MEDIUM | Diverse test dataset, regular updates |
| Performance varies by environment | MEDIUM | Baseline per environment, relative metrics |
| Screenshot comparison brittle | LOW | Focus on element presence, not pixel-perfect |

## Notes

- This story can be worked on in parallel with Story 4 completion
- Focus on reliability over speed in test implementation
- Consider using test tags for selective execution
- Ensure tests work in both headless and headed modes

---

**Story Owner:** Dev Agent
**Reviewed By:** QA Agent (Quinn)
**Last Updated:** 2025-10-20