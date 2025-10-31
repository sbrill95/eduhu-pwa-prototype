# E2E Test Infrastructure

This directory contains end-to-end tests for the Teacher Assistant application using Playwright.

## Test Modes

We have two test modes to balance speed and thoroughness:

### 1. Mock Tests (Fast) - Default

**What:** Tests run with mocked API responses using Playwright's route interception.

**Why:**
- Fast execution (< 30 seconds for full suite)
- No API costs
- Reliable and deterministic
- Perfect for CI/CD and rapid development

**When to use:**
- During active development
- In CI/CD pipelines
- Before committing changes
- Quick validation of UI logic

**How to run:**
```bash
cd teacher-assistant/frontend
VITE_TEST_MODE=true npx playwright test --project="Mock Tests (Fast)"
```

**Expected results:**
- Full test suite completes in < 30 seconds
- 95%+ pass rate expected
- No real API calls (all mocked)
- Instant image generation (500ms instead of 60-90s)

---

### 2. Real API Tests (Smoke) - Integration

**What:** Tests run with actual API calls to OpenAI DALL-E 3.

**Why:**
- Validates real integration with external APIs
- Catches issues that mocks might miss
- Tests actual network behavior and error handling
- Verifies API contract compliance

**When to use:**
- Before production deployments
- Weekly smoke test runs
- After major backend changes
- Validating new API integrations

**How to run:**
```bash
cd teacher-assistant/frontend
VITE_TEST_MODE=true npx playwright test --project="Real API Tests (Smoke)"
```

**Expected results:**
- Full test suite takes 5-10 minutes (DALL-E 3 is slow)
- May have occasional failures due to API rate limits
- Incurs real API costs (~$0.04 per image)
- Tests actual image generation quality

**WARNING:** Real API tests call actual OpenAI DALL-E 3 and incur costs. Run selectively.

---

## Test Files

### `bug-fixes-2025-10-11.spec.ts` (Mock Mode)
Main test suite with 10+ comprehensive E2E tests covering:
- US1 (BUG-030): Chat Navigation After Image Generation
- US2 (BUG-025): Message Persistence with Metadata
- US3 (BUG-020): Library Materials Grid Display
- US4 (BUG-019): Image Metadata Persistence for Re-generation
- Performance assertions
- Console logging verification
- Schema migration validation

**Features:**
- All API calls mocked
- Fast execution (< 30s total)
- Perfect for CI/CD

### `bug-fixes-2025-10-11-real-api.spec.ts` (Real API Mode)
Identical test suite but with real API calls for integration validation.

**Features:**
- Actual OpenAI DALL-E 3 calls
- Slow execution (5-10 min)
- Validates real integration
- Incurs API costs

---

## Mock Infrastructure

### `mocks/handlers.ts`
Defines mock API responses using MSW (Mock Service Worker) patterns.

**Mocked endpoints:**
- `POST /api/chat` → Returns instant mock agent suggestion
- `POST /api/langgraph-agents/execute` → Returns mock SVG image (no OpenAI)
- `GET /api/langgraph/agents/available` → Returns mock agent list
- `POST /api/chat/summary` → Returns mock summary

### `mocks/setup.ts`
Sets up Playwright route interception for mock mode.

**How it works:**
1. Intercepts HTTP requests in browser context
2. Returns instant mock responses
3. Logs all intercepted calls for debugging
4. No service worker needed (uses Playwright's native routing)

---

## Commands

### Run all mock tests (default)
```bash
npm run test:e2e
# or
VITE_TEST_MODE=true npx playwright test --project="Mock Tests (Fast)"
```

### Run all real API tests (smoke)
```bash
VITE_TEST_MODE=true npx playwright test --project="Real API Tests (Smoke)"
```

### Run specific test file (mock)
```bash
VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts
```

### Run specific test file (real API)
```bash
VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11-real-api.spec.ts
```

### Run with UI mode for debugging
```bash
VITE_TEST_MODE=true npx playwright test --ui
```

### Run in headed mode (see browser)
```bash
VITE_TEST_MODE=true npx playwright test --headed
```

### Generate test report
```bash
npx playwright show-report
```

---

## Configuration

Test configuration is in `playwright.config.ts`:

- **Mock Tests Project:** Runs all `*.spec.ts` files (excludes `*-real-api.spec.ts`)
- **Real API Tests Project:** Runs only `*-real-api.spec.ts` files
- **Global timeout:** 150 seconds per test
- **Action timeout:** 15 seconds
- **Navigation timeout:** 30 seconds
- **Retries:** 1 retry on failure (2 in CI)

---

## Timeouts

### Mock Mode Timeouts
- Test timeout: 60 seconds (fast mocks)
- Agent confirmation: 10 seconds
- Image generation: 10 seconds (instant mock)

### Real API Mode Timeouts
- Test timeout: 300 seconds (5 minutes)
- Agent confirmation: 90 seconds (AI processing)
- Image generation: 120 seconds (DALL-E 3 is slow)

---

## Test Data

Tests use `VITE_TEST_MODE=true` to bypass authentication and use a test user.

**Test user:**
- Automatically created in test mode
- Has access to all features
- Isolated from production data

---

## Debugging

### Enable verbose logging
```bash
DEBUG=pw:api VITE_TEST_MODE=true npx playwright test
```

### Take screenshots on failure
Screenshots are automatically saved to `test-results/` on failure.

### Record video
Videos are automatically recorded for failed tests in:
- `test-results/videos/mock/` (mock tests)
- `test-results/videos/real-api/` (real API tests)

### View trace
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests (Mock Mode)
  run: |
    cd teacher-assistant/frontend
    VITE_TEST_MODE=true npx playwright test --project="Mock Tests (Fast)"

- name: Run E2E Smoke Tests (Real API - Weekly)
  if: github.event.schedule == '0 0 * * 0' # Sunday midnight
  run: |
    cd teacher-assistant/frontend
    VITE_TEST_MODE=true npx playwright test --project="Real API Tests (Smoke)"
```

---

## Troubleshooting

### Tests timeout in mock mode
- Check if mock server is set up correctly in `beforeEach`
- Verify route interception is working (check console logs)
- Increase timeout if needed (rare)

### Tests fail in real API mode
- Check OpenAI API key is set in environment
- Verify API rate limits aren't exceeded
- Check network connectivity
- DALL-E 3 can be slow (60-90s per image is normal)

### Route interception not working
- Ensure `setupMockServer(page)` is called in `beforeEach`
- Check console logs for `[MOCK]` messages
- Verify Playwright version is up to date

### Image generation fails
- Mock mode: Check mock SVG is correctly encoded
- Real API mode: Check OpenAI API key and credits
- Verify backend is running and accessible

---

## Performance Expectations

### Mock Mode
- Full suite: < 30 seconds
- Single test: 2-5 seconds
- Image generation: ~500ms

### Real API Mode
- Full suite: 5-10 minutes
- Single test: 1-5 minutes
- Image generation: 60-90 seconds (DALL-E 3)

---

## Best Practices

1. **Default to mock mode** for development
2. **Run real API tests weekly** or before production deploys
3. **Use `--ui` mode** for debugging failing tests
4. **Keep timeouts realistic** (DALL-E 3 is slow)
5. **Monitor API costs** for real API test runs
6. **Use test.setTimeout()** for tests with many images
7. **Check console logs** for debugging (all events logged)

---

## Future Enhancements

- [ ] Add mobile device testing (iPhone, Android)
- [ ] Add Firefox and Safari cross-browser testing
- [ ] Implement visual regression testing
- [ ] Add performance budgets
- [ ] Add accessibility testing
- [ ] Mock more agent types (lesson planner, etc.)

---

## Questions?

For questions about E2E tests, check:
- Playwright docs: https://playwright.dev
- MSW docs: https://mswjs.io
- Project README: `../../README.md`
