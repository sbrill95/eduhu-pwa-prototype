# Test Execution Commands - Agent Confirmation UX

Quick reference for running E2E tests for Feature 003.

---

## Quick Start

```bash
# Navigate to frontend directory
cd teacher-assistant/frontend

# Run all 4 user story tests (30 test cases)
npx playwright test agent-confirmation-visibility.spec.ts library-navigation-after-generation.spec.ts chat-image-history.spec.ts material-preview-modal-content.spec.ts
```

---

## Individual User Stories

### US1: Agent Confirmation Card Visibility (7 tests)
```bash
npx playwright test agent-confirmation-visibility.spec.ts
```

**Expected Duration**: 2-3 minutes
**Test Cases**: TC1-TC7 (gradient, border, buttons, contrast, mobile, text, distinction)

---

### US2: Library Navigation (7 tests)
```bash
npx playwright test library-navigation-after-generation.spec.ts
```

**Expected Duration**: 3-4 minutes
**Test Cases**: TC1-TC7 (navigation, event, tab, modal, content, buttons, performance)

---

### US3: Image in Chat History (8 tests)
```bash
npx playwright test chat-image-history.spec.ts
```

**Expected Duration**: 4-5 minutes
**Test Cases**: TC1-TC8 (thumbnail, metadata, caption, clickable, session, history, ordering, vision)

---

### US4: MaterialPreviewModal Content (8 tests)
```bash
npx playwright test material-preview-modal-content.spec.ts
```

**Expected Duration**: 3-4 minutes
**Test Cases**: TC1-TC8 (opens, image, title, metadata, buttons, regenerate, scroll, mobile)

---

## Targeted Test Execution

### Run Single Test Case
```bash
# Example: Run only TC1 from US1
npx playwright test agent-confirmation-visibility.spec.ts -g "TC1"

# Example: Run only TC4 from US3
npx playwright test chat-image-history.spec.ts -g "TC4"
```

---

### Run Tests by Priority

#### P1 Tests Only (US1, US2, US3)
```bash
npx playwright test agent-confirmation-visibility.spec.ts library-navigation-after-generation.spec.ts chat-image-history.spec.ts
```

**Duration**: ~10 minutes
**Coverage**: 22 tests (MVP features)

---

#### P2 Tests Only (US4)
```bash
npx playwright test material-preview-modal-content.spec.ts
```

**Duration**: ~3 minutes
**Coverage**: 8 tests (modal enhancement)

---

## Debug Mode

### UI Mode (Interactive Visual Debugging)
```bash
# All tests
npx playwright test --ui

# Specific user story
npx playwright test --ui agent-confirmation-visibility.spec.ts
```

**Features**:
- Visual test execution
- Step-by-step debugging
- Screenshot preview
- Test replay
- Console log inspection

---

### Headed Mode (Show Browser)
```bash
npx playwright test agent-confirmation-visibility.spec.ts --headed
```

**Use Case**: Watch test execution in real browser

---

### Debug with Browser Inspector
```bash
npx playwright test agent-confirmation-visibility.spec.ts --debug
```

**Features**:
- Pause on failure
- Playwright Inspector GUI
- Step through test actions
- Inspect elements

---

## Reporting

### HTML Report (Recommended)
```bash
# Run tests with HTML reporter
npx playwright test agent-confirmation-visibility.spec.ts library-navigation-after-generation.spec.ts chat-image-history.spec.ts material-preview-modal-content.spec.ts --reporter=html

# Open report in browser
npx playwright show-report
```

**Output**: `playwright-report/index.html`

---

### JSON Report
```bash
npx playwright test agent-confirmation-visibility.spec.ts --reporter=json
```

**Output**: `test-results.json`

**Use Case**: CI/CD integration, programmatic analysis

---

### List Reporter (Detailed Console Output)
```bash
npx playwright test agent-confirmation-visibility.spec.ts --reporter=list
```

**Use Case**: Real-time test execution feedback

---

### Multiple Reporters
```bash
npx playwright test agent-confirmation-visibility.spec.ts --reporter=html,json,list
```

---

## Advanced Options

### Run Tests in Parallel (Not Recommended for This Suite)
```bash
npx playwright test agent-confirmation-visibility.spec.ts --workers=4
```

**Note**: Tests use shared state (chat sessions, library), sequential execution recommended

---

### Retry Failed Tests
```bash
npx playwright test agent-confirmation-visibility.spec.ts --retries=2
```

**Use Case**: Flaky test detection

---

### Run Specific Browser
```bash
# Chrome (default)
npx playwright test agent-confirmation-visibility.spec.ts --project="Mock Tests (Fast)"

# Firefox
npx playwright test agent-confirmation-visibility.spec.ts --project="Desktop Firefox"
```

**Note**: Config defines 2 projects: Mock Tests (Fast) and Real API Tests (Smoke)

---

### Update Snapshots (Visual Regression Testing)
```bash
npx playwright test agent-confirmation-visibility.spec.ts --update-snapshots
```

**Note**: Current tests use screenshots but not snapshot comparisons

---

### Trace on First Retry
```bash
npx playwright test agent-confirmation-visibility.spec.ts --trace on-first-retry
```

**Output**: `test-results/.../trace.zip` (open with `npx playwright show-trace`)

---

## Performance Testing

### Measure Test Duration
```bash
time npx playwright test agent-confirmation-visibility.spec.ts
```

---

### Run with Minimal Output
```bash
npx playwright test agent-confirmation-visibility.spec.ts --reporter=dot
```

**Use Case**: CI/CD pipelines where output must be concise

---

## Filtering

### Run Tests by Tag (Custom Implementation Needed)
```bash
# Example: If tests are tagged
npx playwright test -g "@smoke"
```

---

### Run Tests by File Pattern
```bash
# All US1-US3 tests
npx playwright test agent-confirmation-*.spec.ts library-*.spec.ts chat-*.spec.ts

# All US4 tests
npx playwright test material-*.spec.ts
```

---

## Environment Control

### Override Test Mode
```bash
# Force test mode
VITE_TEST_MODE=true npx playwright test agent-confirmation-visibility.spec.ts

# Disable test mode (use real auth)
VITE_TEST_MODE=false npx playwright test agent-confirmation-visibility.spec.ts
```

**Note**: Config already sets `VITE_TEST_MODE=true` by default

---

### Custom Backend URL
```bash
# Use different backend (requires playwright.config.ts modification)
API_URL=http://localhost:3002 npx playwright test agent-confirmation-visibility.spec.ts
```

---

## Screenshot Management

### Capture Screenshots on All Tests
```bash
npx playwright test agent-confirmation-visibility.spec.ts --screenshot=on
```

**Output**: `test-results/<test-name>/screenshots/`

---

### Capture Screenshots Only on Failure
```bash
npx playwright test agent-confirmation-visibility.spec.ts --screenshot=only-on-failure
```

**Note**: Already configured in playwright.config.ts

---

### Capture Full-Page Screenshots
```bash
npx playwright test agent-confirmation-visibility.spec.ts --full-page-screenshot
```

---

## Video Recording

### Record Video on Failure
```bash
npx playwright test agent-confirmation-visibility.spec.ts --video=on-failure
```

**Output**: `test-results/<test-name>/videos/`

---

### Record All Tests
```bash
npx playwright test agent-confirmation-visibility.spec.ts --video=on
```

**Warning**: Large storage usage (~100MB per test)

---

## CI/CD Integration

### GitHub Actions
```bash
# Run in CI mode (headless, no colors)
CI=true npx playwright test agent-confirmation-visibility.spec.ts library-navigation-after-generation.spec.ts chat-image-history.spec.ts material-preview-modal-content.spec.ts
```

---

### Generate JUnit XML Report
```bash
npx playwright test agent-confirmation-visibility.spec.ts --reporter=junit
```

**Output**: `test-results.xml`

**Use Case**: Jenkins, GitLab CI, Azure DevOps integration

---

## Cleanup

### Remove Test Results
```bash
# Windows
rmdir /s /q test-results playwright-report

# macOS/Linux
rm -rf test-results playwright-report
```

---

### Clean Playwright Cache
```bash
npx playwright clean
```

---

## Common Workflows

### Quick Verification (Run US1 Only)
```bash
npx playwright test agent-confirmation-visibility.spec.ts --headed
```

**Duration**: ~2 minutes
**Use Case**: Verify Agent Confirmation Card styling after changes

---

### Pre-Commit Check (All P1 Tests)
```bash
npx playwright test agent-confirmation-visibility.spec.ts library-navigation-after-generation.spec.ts chat-image-history.spec.ts --reporter=list
```

**Duration**: ~10 minutes
**Use Case**: Verify no regressions before committing

---

### Full QA Verification (All Tests + Report)
```bash
npx playwright test agent-confirmation-visibility.spec.ts library-navigation-after-generation.spec.ts chat-image-history.spec.ts material-preview-modal-content.spec.ts --reporter=html

npx playwright show-report
```

**Duration**: ~13 minutes
**Use Case**: QA sign-off before deployment

---

### Debug Failing Test
```bash
npx playwright test agent-confirmation-visibility.spec.ts -g "TC4" --debug
```

**Use Case**: Investigate specific test failure

---

## Expected Output Examples

### Successful Run
```
Running 7 tests using 1 worker

  ✓  agent-confirmation-visibility.spec.ts:30:3 › TC1: Agent Confirmation Card renders with orange gradient background (12s)
  ✓  agent-confirmation-visibility.spec.ts:56:3 › TC2: Agent Confirmation Card has orange border and shadow (10s)
  ✓  agent-confirmation-visibility.spec.ts:95:3 › TC3: Both action buttons are visible and correctly styled (15s)
  ✓  agent-confirmation-visibility.spec.ts:143:3 › TC4: Text contrast meets WCAG AA standards (4.5:1) (18s)
  ✓  agent-confirmation-visibility.spec.ts:195:3 › TC5: Mobile responsive - buttons stack vertically (20s)
  ✓  agent-confirmation-visibility.spec.ts:245:3 › TC6: Reasoning text is visible and readable (11s)
  ✓  agent-confirmation-visibility.spec.ts:265:3 › TC7: Card visually stands out from chat background (14s)

  7 passed (2m 30s)
```

---

### Test with Warnings (Implementation Incomplete)
```
Running 7 tests using 1 worker

  ✓  library-navigation-after-generation.spec.ts:50:3 › TC1: "In Library öffnen" button navigates to Library tab (18s)
  ✓  library-navigation-after-generation.spec.ts:85:3 › TC2: Custom event is dispatched with materialId parameter (15s)
  ⚠  library-navigation-after-generation.spec.ts:125:3 › TC3: Library opens to "Materialien" tab (not "Chats") (12s)
     └─ WARNING: Materialien tab may not be active (check implementation)
  ⚠  library-navigation-after-generation.spec.ts:160:3 › TC4: MaterialPreviewModal opens automatically after navigation (14s)
     └─ WARNING: MaterialPreviewModal did not auto-open (check T015 implementation)
  ✓  library-navigation-after-generation.spec.ts:200:3 › TC5: Modal displays newly created image with title and metadata (20s)
  ✓  library-navigation-after-generation.spec.ts:240:3 › TC6: Modal displays action buttons (Regenerieren, Download) (16s)
  ✓  library-navigation-after-generation.spec.ts:280:3 › TC7: Performance - Navigation completes within 2 seconds (8s)

  7 passed (3m 15s)
```

---

### Failed Test
```
Running 7 tests using 1 worker

  ✓  agent-confirmation-visibility.spec.ts:30:3 › TC1: ... (12s)
  ✓  agent-confirmation-visibility.spec.ts:56:3 › TC2: ... (10s)
  ✗  agent-confirmation-visibility.spec.ts:95:3 › TC3: Both action buttons are visible and correctly styled (8s)

    Error: expect(received).toContain(expected)

    Expected substring: "bg-primary-600"
    Received string:    "bg-gray-500 text-white ..."

      99 |     const confirmButtonClasses = await confirmButton.getAttribute('class');
      100|     expect(confirmButtonClasses).toContain('bg-primary-600');
         |                                   ^

  2 passed, 1 failed (30s)
```

---

## Troubleshooting

### Test Timeout
**Symptom**: `Test timeout of 150000ms exceeded`

**Solution**:
```bash
# Increase timeout
npx playwright test agent-confirmation-visibility.spec.ts --timeout=300000
```

---

### Port Already in Use
**Symptom**: `Error: Port 5173 is already in use`

**Solution**: Kill existing Vite dev server or use `--reuse-existing-server=true` (default in config)

---

### Mock Server Not Working
**Symptom**: Tests hang waiting for API responses

**Solution**: Verify `setupMockServer(page)` is called in `beforeEach`

---

## Next Steps

After running tests:

1. **Review HTML Report**: `npx playwright show-report`
2. **Check Screenshots**: `test-results/` folder
3. **Fix Failing Tests**: Implement missing features (see tasks.md)
4. **Update Documentation**: Add new test cases if features added
5. **Commit Test Results**: Include in session log

---

## Related Files

- **Test Files**: `e2e-tests/agent-confirmation-*.spec.ts`, etc.
- **Mock Setup**: `e2e-tests/mocks/setup.ts`
- **Mock Handlers**: `e2e-tests/mocks/handlers.ts`
- **Config**: `playwright.config.ts`
- **README**: `e2e-tests/README-003-AGENT-CONFIRMATION-UX.md`

---

**Last Updated**: 2025-10-14
**Feature**: specs/003-agent-confirmation-ux
**Test Coverage**: 30 test cases across 4 user stories
