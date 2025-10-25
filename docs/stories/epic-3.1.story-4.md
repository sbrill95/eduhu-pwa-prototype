# Story: Image Workflow E2E Tests

**Epic:** 3.1 - Image Agent: Creation + Editing
**Story ID:** epic-3.1.story-4
**Created:** 2025-10-21
**Status:** Ready for Development
**Priority:** P1 (High - Quality Assurance)
**Sprint:** Sprint 3 - Week 8-9 (Epic 3.1 Final Phase)
**Assignee:** Dev Agent
**Implementation Time:** 2-3 days (16-24 hours)

## Context

Epic 3.1 introduces image editing capabilities with Gemini integration and intelligent router classification. Story 3.1.4 creates comprehensive E2E tests to validate the complete image creation + editing workflow, ensuring all components work together seamlessly.

### Prerequisites
- ✅ Story 3.1.1: Gemini API Integration COMPLETE
- ✅ Story 3.1.2: Image Editing Sub-Agent COMPLETE
- ✅ Story 3.1.3: Router Classification COMPLETE
- ✅ Playwright test infrastructure from Epic 3.0 (Story 3.0.5)

### Why This Story Matters
Without comprehensive E2E tests, we cannot confidently deploy Epic 3.1 to production. This story validates that all new features work end-to-end and prevents regressions.

## Problem Statement

We need E2E tests to validate:
1. Complete image creation workflow (router → DALL-E agent)
2. Complete image editing workflow (router → Gemini editing)
3. Router correctly classifies creation vs editing (≥95% accuracy)
4. Manual override functionality works
5. Version management preserves originals
6. Usage tracking enforces 20 images/day limit
7. Error handling works gracefully
8. Performance meets requirements

## User Story

**As a** QA engineer validating Epic 3.1
**I want** comprehensive E2E tests covering all image workflows
**So that** we can confidently deploy image creation + editing to production

## Acceptance Criteria

### AC1: Image Creation Workflow E2E Test
- [ ] Playwright test: Complete creation workflow
  - User inputs creation prompt (German)
  - Router classifies as "create" (high confidence)
  - Request routed to DALL-E agent
  - Image generated successfully
  - Image saved to library
  - Image displayed in chat
- [ ] Screenshot capture:
  - **Before**: Chat input with creation prompt
  - **Router**: Classification result (create, confidence score)
  - **During**: Loading state while generating
  - **After**: Generated image displayed
- [ ] Validation:
  - Router confidence ≥0.9 for creation
  - Image appears in library
  - Zero console errors
  - Total time <15 seconds (excluding DALL-E API)

### AC2: Image Editing Workflow E2E Test
- [ ] Playwright test: Complete editing workflow
  - User uploads/selects existing image
  - User inputs editing instruction (German)
  - Router classifies as "edit" (high confidence)
  - Request routed to Gemini editing agent
  - Image edited successfully
  - Original image preserved
  - Edited image saved to library
  - Edited image displayed in chat
- [ ] Screenshot capture:
  - **Before**: Original image + edit instruction
  - **Router**: Classification result (edit, confidence score)
  - **During**: Loading state while editing
  - **After**: Edited image displayed
  - **Library**: Both original and edited version in library
- [ ] Validation:
  - Router confidence ≥0.9 for editing
  - Original image unchanged
  - Edited image has version metadata
  - Zero console errors
  - Total time <10 seconds (excluding Gemini API)

### AC3: Router Classification Accuracy Tests
- [ ] Playwright test: Router classifies 10 creation prompts
  - Test prompts covering diverse creation requests
  - All 10 classified correctly as "create"
  - Confidence scores ≥0.9 for clear prompts
- [ ] Playwright test: Router classifies 10 editing prompts
  - Test prompts covering diverse editing requests
  - All 10 classified correctly as "edit"
  - Confidence scores ≥0.9 for clear prompts
- [ ] Playwright test: Router handles 5 ambiguous prompts
  - Test prompts with unclear intent
  - Confidence scores <0.7 trigger manual selection
  - Manual override UI appears
  - User can select intent manually
- [ ] Overall accuracy: ≥95% on clear prompts (20/20)

### AC4: Manual Override Testing
- [ ] Playwright test: Low confidence triggers override
  - Input ambiguous prompt
  - Router returns confidence <0.7
  - Override button appears
  - UI shows: "Nicht richtig? Wähle manuell:"
- [ ] Playwright test: Manual selection works
  - Click override button
  - Select "Neues Bild erstellen" or "Bestehendes Bild bearbeiten"
  - Request routes to selected agent
  - Manual selection logged
- [ ] Screenshot capture:
  - **Override UI**: Button and dropdown visible
  - **Selection**: User selecting manual option
  - **Result**: Correct agent executed

### AC5: Version Management Validation
- [ ] Playwright test: Original image preserved
  - Create image A
  - Edit image A → creates version A-v1
  - Verify original A still exists in library
  - Verify A-v1 exists separately
  - Verify A metadata unchanged
  - Verify A-v1 has version metadata
- [ ] Playwright test: Multiple edits create multiple versions
  - Create image B
  - Edit B → B-v1
  - Edit B-v1 → B-v2
  - Edit B-v2 → B-v3
  - Verify all 4 versions exist (B, B-v1, B-v2, B-v3)
  - Verify version metadata correct
- [ ] Screenshot capture:
  - **Library**: All versions visible
  - **Metadata**: Version information displayed

### AC6: Usage Tracking & Limit Enforcement
- [ ] Playwright test: Usage counter increments
  - Generate 3 images (create)
  - Edit 2 images
  - Verify counter shows: "5/20 Bilder heute verwendet"
- [ ] Playwright test: 80% warning appears
  - Simulate 16/20 images used
  - Create or edit next image
  - Verify warning: "Limit bald erreicht (17/20)"
- [ ] Playwright test: Limit enforcement at 20/20
  - Simulate 20/20 images used
  - Attempt to create/edit image
  - Verify error: "Tägliches Limit erreicht. Morgen wieder verfügbar."
  - Verify image not generated
- [ ] Screenshot capture:
  - **Counter**: Usage indicator in UI
  - **Warning**: 80% warning message
  - **Limit**: Limit reached error

### AC7: Error Handling Tests
- [ ] Playwright test: Gemini API timeout
  - Simulate API timeout (>30 seconds)
  - Verify error message: "Bearbeitung fehlgeschlagen. Bitte erneut versuchen."
  - Verify graceful degradation (no crash)
- [ ] Playwright test: Unsupported image format
  - Upload .gif file (unsupported)
  - Verify error: "Bitte PNG, JPEG oder WebP verwenden"
- [ ] Playwright test: Image too large (>20 MB)
  - Upload 25 MB image
  - Verify error: "Bild zu groß (max 20 MB)"
- [ ] Playwright test: Router failure fallback
  - Simulate router timeout
  - Verify fallback to manual agent selection
- [ ] Screenshot capture:
  - **Error states**: All error messages captured

### AC8: Performance Validation
- [ ] Playwright test: Image creation performance
  - Measure time from input to image display
  - Exclude DALL-E API time (30-60s typical)
  - Frontend + Router + Backend: <5 seconds
- [ ] Playwright test: Image editing performance
  - Measure time from edit request to preview
  - Exclude Gemini API time (5-10s typical)
  - Frontend + Router + Backend: <5 seconds
- [ ] Playwright test: Router classification speed
  - Measure classification time
  - Must be <500ms
- [ ] Performance report generated with metrics

## Technical Requirements

### Test File Structure
```typescript
// teacher-assistant/frontend/e2e-tests/image-workflow-comprehensive.spec.ts

describe('Epic 3.1: Image Creation + Editing Workflows', () => {
  describe('AC1: Image Creation Workflow', () => {
    test('Complete creation workflow (router → DALL-E → save)')
    test('Screenshot capture at all stages')
    test('Performance validation (<15s total)')
  })

  describe('AC2: Image Editing Workflow', () => {
    test('Complete editing workflow (router → Gemini → save)')
    test('Original image preservation')
    test('Screenshot capture at all stages')
    test('Performance validation (<10s total)')
  })

  describe('AC3: Router Classification Accuracy', () => {
    test('Classifies 10 creation prompts correctly')
    test('Classifies 10 editing prompts correctly')
    test('Handles 5 ambiguous prompts')
    test('Overall accuracy ≥95%')
  })

  describe('AC4: Manual Override', () => {
    test('Low confidence triggers override UI')
    test('Manual selection bypasses router')
  })

  describe('AC5: Version Management', () => {
    test('Original preserved after edit')
    test('Multiple edits create multiple versions')
  })

  describe('AC6: Usage Tracking', () => {
    test('Counter increments correctly')
    test('80% warning appears')
    test('Limit enforced at 20/20')
  })

  describe('AC7: Error Handling', () => {
    test('Gemini timeout handled gracefully')
    test('Unsupported format rejected')
    test('Oversized image rejected')
    test('Router failure fallback works')
  })

  describe('AC8: Performance', () => {
    test('Creation workflow <5s (excluding API)')
    test('Editing workflow <5s (excluding API)')
    test('Router classification <500ms')
  })
})
```

### Console Error Monitoring (MANDATORY)
```typescript
test.beforeEach(async ({ page }) => {
  // ZERO tolerance for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });
});

test.afterEach(async ({ page }) => {
  // Assertion: ZERO console errors
  const errors = await page.evaluate(() => {
    return window.__consoleErrors__ || [];
  });
  expect(errors.length).toBe(0);
});
```

### Screenshot Naming Convention
```
docs/testing/screenshots/2025-10-21/story-3.1.4/
├── 01-creation-workflow-before.png
├── 02-creation-workflow-router-classification.png
├── 03-creation-workflow-loading.png
├── 04-creation-workflow-after.png
├── 05-editing-workflow-before.png
├── 06-editing-workflow-router-classification.png
├── 07-editing-workflow-loading.png
├── 08-editing-workflow-after.png
├── 09-editing-workflow-library-versions.png
├── 10-router-classification-accuracy.png
├── 11-manual-override-ui.png
├── 12-manual-override-selection.png
├── 13-version-management-library.png
├── 14-usage-counter.png
├── 15-usage-warning-80-percent.png
├── 16-usage-limit-reached.png
├── 17-error-timeout.png
├── 18-error-unsupported-format.png
├── 19-error-oversized.png
└── 20-performance-report.png
```

### Performance Benchmarks
| Metric | Target | Measurement |
|--------|--------|-------------|
| Router classification | <500ms | Time from request to classification result |
| Frontend + Backend (creation) | <5s | Time excluding DALL-E API call |
| Frontend + Backend (editing) | <5s | Time excluding Gemini API call |
| Total creation workflow | <15s | Including DALL-E (30-60s typical) |
| Total editing workflow | <10s | Including Gemini (5-10s typical) |

## Task Breakdown

### Task 1: Setup Test Infrastructure
- [ ] Create `image-workflow-comprehensive.spec.ts`
- [ ] Setup screenshot helpers
- [ ] Setup performance measurement utilities
- [ ] Configure console error monitoring
- [ ] Create test data fixtures

**Time Estimate**: 2 hours

### Task 2: Implement AC1 - Creation Workflow Tests
- [ ] Write complete creation workflow test
- [ ] Add screenshot capture at 4 stages
- [ ] Add performance validation
- [ ] Add console error assertions

**Time Estimate**: 3 hours

### Task 3: Implement AC2 - Editing Workflow Tests
- [ ] Write complete editing workflow test
- [ ] Add screenshot capture at 5 stages
- [ ] Add original preservation validation
- [ ] Add version metadata validation
- [ ] Add performance validation

**Time Estimate**: 3 hours

### Task 4: Implement AC3 - Router Classification Tests
- [ ] Create 10 creation test prompts
- [ ] Create 10 editing test prompts
- [ ] Create 5 ambiguous test prompts
- [ ] Write classification accuracy tests
- [ ] Calculate and validate ≥95% accuracy

**Time Estimate**: 3 hours

### Task 5: Implement AC4 - Manual Override Tests
- [ ] Test low confidence scenario
- [ ] Test override button appearance
- [ ] Test manual selection flow
- [ ] Add screenshot capture

**Time Estimate**: 2 hours

### Task 6: Implement AC5 - Version Management Tests
- [ ] Test original preservation
- [ ] Test multiple version creation
- [ ] Test version metadata
- [ ] Add screenshot capture

**Time Estimate**: 2 hours

### Task 7: Implement AC6 - Usage Tracking Tests
- [ ] Test counter increments
- [ ] Test 80% warning
- [ ] Test limit enforcement
- [ ] Add screenshot capture

**Time Estimate**: 2 hours

### Task 8: Implement AC7 - Error Handling Tests
- [ ] Test Gemini timeout
- [ ] Test unsupported format
- [ ] Test oversized image
- [ ] Test router fallback
- [ ] Add screenshot capture

**Time Estimate**: 2 hours

### Task 9: Implement AC8 - Performance Tests
- [ ] Measure creation workflow time
- [ ] Measure editing workflow time
- [ ] Measure router classification time
- [ ] Generate performance report

**Time Estimate**: 2 hours

### Task 10: Documentation & Reporting
- [ ] Create test execution report template
- [ ] Document test coverage metrics
- [ ] Create troubleshooting guide
- [ ] Update Epic 3.1 test documentation

**Time Estimate**: 1 hour

## Dependencies

### Technical Dependencies
- Stories 3.1.1, 3.1.2, 3.1.3 COMPLETE
- Playwright infrastructure from Epic 3.0
- Test environment with Gemini + DALL-E enabled
- Mock API responses for error scenarios

### Data Dependencies
- Test image dataset (various formats, sizes)
- Test prompt dataset (German + English)
- Expected classification results

### Story Dependencies
- **Depends On**: Stories 3.1.1, 3.1.2, 3.1.3
- **Blocks**: Epic 3.1 completion
- **Parallel**: Story 3.1.5 (Cost optimization)

## Success Criteria

Story 3.1.4 is complete when:
- ✅ All 8 acceptance criteria met
- ✅ 100% of tests passing consistently
- ✅ Router classification ≥95% accuracy validated
- ✅ 20 screenshots captured and verified
- ✅ ZERO console errors in all tests
- ✅ Performance benchmarks met
- ✅ Test execution time <10 minutes total
- ✅ Build clean (0 TypeScript errors)
- ✅ QA review PASS

## Definition of Done

- [ ] All 8 acceptance criteria met
- [ ] All 10 tasks completed
- [ ] All E2E tests written and passing
- [ ] 20 screenshots captured for all scenarios
- [ ] Performance metrics documented
- [ ] Zero console errors in tests
- [ ] Test data committed to repo
- [ ] Test execution report generated
- [ ] Session log created
- [ ] QA review PASS
- [ ] Code committed with tests

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flaky tests due to async operations | HIGH | Proper wait conditions, retry logic, no hard waits |
| API rate limits during testing | MEDIUM | Use mocked responses for bulk testing |
| Screenshot comparison brittle | LOW | Focus on element presence, not pixel-perfect |
| Performance varies by environment | MEDIUM | Baseline per environment, measure relative improvements |
| Test data bias affects accuracy | MEDIUM | Diverse test dataset, real user scenarios |

## Notes

### Test Strategy
1. **Unit tests**: Already covered in Stories 3.1.1, 3.1.2, 3.1.3
2. **Integration tests**: Already covered in individual stories
3. **E2E tests**: THIS STORY - Full workflow validation
4. **Manual testing**: User acceptance testing (UAT)

### Reference Story 3.0.5 Patterns
Story 3.0.5 (Router E2E Tests) provides proven patterns for:
- ✅ Console error monitoring
- ✅ Screenshot capture system
- ✅ Performance metrics collection
- ✅ Test execution reporting
- ✅ Playwright best practices

**Use Story 3.0.5 as template for Story 3.1.4 implementation.**

### Test Data Requirements
- **Images**: 5 test images (PNG, JPEG, WebP, various sizes)
- **Prompts**: 25 test prompts (10 create, 10 edit, 5 ambiguous)
- **Expected Results**: Pre-defined for accuracy validation

### Epic 3.1 Completion Dependency
Epic 3.1 CANNOT be marked COMPLETE until Story 3.1.4 passes with:
- ✅ 100% tests passing
- ✅ ≥95% router accuracy
- ✅ ZERO console errors
- ✅ All screenshots captured
- ✅ QA PASS quality gate

---

**Story Owner:** Dev Agent
**Reviewed By:** QA Agent (Quinn) - Pending
**Last Updated:** 2025-10-21

## Related Documentation
- Epic 3.1: `docs/epics/epic-3.1.md`
- Story 3.0.5: `docs/stories/epic-3.0.story-5.md` (E2E test reference)
- Router Tests: Story 3.0.5 patterns
- Sprint Planning Report: `docs/development-logs/sessions/2025-10-21/epic-3.1-sprint-planning-report.md`
