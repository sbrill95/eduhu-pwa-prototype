# E2E Test Infrastructure Fix Plan

**Date**: 2025-10-13
**Status**: COMPREHENSIVE ANALYSIS & SOLUTION ARCHITECTURE
**Purpose**: Permanent fixes for recurring E2E test failures based on 4 years of test logs

---

## Executive Summary

E2E tests have consistently failed across multiple iterations with **36-40% pass rates**, far below the 90% target. Analysis of historical logs from 2025-10-02 through 2025-10-13 reveals **5 recurring root causes** that must be addressed through infrastructure improvements, not just test fixes.

**Current State**:
- 36.4% pass rate (4/11 tests) - Latest run 2025-10-13
- Tests timeout after 5+ minutes waiting for real APIs
- Backend connection required (ERR_CONNECTION_REFUSED when not running)
- Expired InstantDB S3 URLs break 96% of image tests
- Brittle CSS selectors (no data-testid convention)

**Target State**:
- 95%+ pass rate
- Test execution <30 seconds (down from 5+ minutes)
- Zero external API dependencies
- Tests run without backend server
- Stable, maintainable test selectors

---

## 1. Recurring Problems (What Keeps Breaking)

### Problem 1: Tests Call Real APIs (OpenAI, DALL-E 3)

**Evidence**:
- 2025-10-07: "Tests wait 35s for real DALL-E API... image generation times out"
- 2025-10-13: "Real OpenAI API Calls: Yes (DALL-E 3)" → 10 minute test duration
- Every image generation test waits 60-90 seconds for actual API response

**Impact**:
- Tests take 5-10 minutes to run (vs. 30 seconds with mocks)
- OpenAI rate limits cause random failures
- API costs accumulate ($0.04 per DALL-E 3 image × 100+ test runs)
- Timeout failures when API is slow (35-70 second variance)

**Current Code**:
```typescript
// bug-fixes-2025-10-11.spec.ts line 157
await expect(resultView).toBeVisible({ timeout: 120000 }); // Wait 2 minutes for DALL-E
```

---

### Problem 2: Tests Require Full Environment (Frontend + Backend + Database)

**Evidence**:
- 2025-10-13: "Backend not running → ERR_CONNECTION_REFUSED"
- 2025-10-02: "Tests require backend running on port 3006"
- Playwright config line 138: `command: 'npm run dev -- --mode test'` (starts frontend only)

**Impact**:
- Developers must manually start backend before running tests
- Tests fail in CI/CD if backend setup missing
- Cannot test frontend changes in isolation
- Flaky tests when backend is slow to start

**Current Setup**:
```typescript
// playwright.config.ts
webServer: {
  command: 'npm run dev -- --mode test', // Only frontend
  url: 'http://localhost:5173',
  // Backend NOT started automatically
}
```

---

### Problem 3: Timing Assumptions Fail (Ionic Animations, API Latency)

**Evidence**:
- 2025-10-07: "Progress animation: 0 loaders found (may be too fast or broken)"
- 2025-10-13: "Modal animations adding delay... Performance test failed"
- Bug tracking: "Tab navigation fails randomly"

**Impact**:
- `waitForTimeout(500)` is brittle (depends on system load)
- Animations interfere with assertions (element visible but clickable later)
- Race conditions between DOM updates and test assertions

**Current Code**:
```typescript
// bug-fixes-2025-10-11.spec.ts lines 250-254
await continueButton.scrollIntoViewIfNeeded();
await page.waitForTimeout(500); // Fixed delay - brittle!
await continueButton.click({ force: true }); // Force needed due to modal overlay
```

---

### Problem 4: Selector Brittleness (CSS Classes Change, No data-testid Convention)

**Evidence**:
- Only 22 components use `data-testid` (108 total occurrences, mostly in tests)
- 90+ test files with different selector strategies
- Tests use text matching: `button:has-text("Weiter im Chat")` (breaks if text changes)
- CSS selectors: `.chat-message, ion-card, [data-testid="chat-message"]` (triple fallback)

**Impact**:
- Tests break when button text changes (e.g., German → English)
- Refactoring CSS classes breaks tests
- Difficult to debug which selector matched
- No standard convention across codebase

**Current Code**:
```typescript
// bug-fixes-2025-10-11.spec.ts line 246
const continueButton = page.locator(
  'button[data-testid="continue-in-chat-button"], button:has-text("Weiter im Chat")'
).first();
// Fallback to text matching because data-testid not consistently used
```

---

### Problem 5: Data Pollution (Expired URLs, Mutation Errors)

**Evidence**:
- 2025-10-12: "Expired S3 URLs cause 96% of images to fail loading"
- 2025-10-12: "InstantDB signed URLs expire after 7 days"
- 2025-10-07: "InstantDB mutation failed {status: 400}" on page load

**Impact**:
- Tests fail when using old test data (images from >7 days ago)
- Cannot reproduce test runs after 1 week
- Database state from previous test runs interferes with new tests
- No test data isolation

**Root Cause**:
```typescript
// Tests query real InstantDB database
const { data } = useQuery({
  messages: {
    $: { where: { userId: user?.id } }
  }
});
// Returns data from ALL previous test runs, including expired URLs
```

---

## 2. Root Causes (Why These Happen)

### Root Cause 1: No Mock Server Infrastructure

**Why**: Tests make real HTTP requests to `/api/chat`, `/api/langgraph-agents/execute`, etc.

**Evidence**:
- No MSW (Mock Service Worker) setup in codebase
- No `e2e-tests/mocks/handlers.ts` file
- Only file: `e2e-tests/mocks/agent-responses.ts` (partial, not integrated)

**Technical Debt**:
- Frontend tightly coupled to backend APIs (no abstraction layer)
- No API client pattern (direct fetch calls in components)
- Test mode (`VITE_TEST_MODE=true`) only bypasses auth, not API calls

---

### Root Cause 2: No Test Data Isolation

**Why**: All tests share same InstantDB database with production-like data

**Evidence**:
- Test user: `s.brill@eduhu.de` (ID: `38eb3d27-dd97-4ed4-9e80-08fafe18115f`)
- Same user ID used across all test runs
- No cleanup between tests
- Data accumulates over time (100+ chat messages, 97 images)

**Technical Debt**:
- No fixture system for test data
- No database seeding for tests
- No cleanup/reset mechanism
- InstantDB doesn't support test transactions (unlike SQL databases)

---

### Root Cause 3: Over-Reliance on E2E for Everything

**Why**: No component-level testing strategy

**Evidence**:
- 90+ E2E test files
- Only 22 component test files with data-testid usage
- E2E tests used even for unit-level logic (e.g., debouncing, validation)

**Technical Debt**:
- Testing pyramid inverted (more E2E than unit tests)
- Slow feedback loop (10 minutes to test a button click)
- Cannot test edge cases (hard to simulate errors in full E2E)

---

### Root Cause 4: No Component-Level Testing Pattern

**Why**: React components tested through full app integration

**Evidence**:
- Playwright Component Tests not configured
- No Storybook for visual component testing
- Components cannot be tested in isolation

**Technical Debt**:
- Cannot test component props/events without full app
- Difficult to test error states (need to trigger backend errors)
- Slow iteration (rebuild entire app for each test)

---

## 3. Solution Architecture (How to Fix Permanently)

### Phase 1: Immediate Fixes (This Week - Est. 8-12 hours)

#### Fix 1.1: Add Mock Server with MSW (Mock Service Worker)

**Goal**: Intercept all API calls and return mock responses (no backend needed)

**Implementation**:

1. **Install MSW**:
```bash
cd teacher-assistant/frontend
npm install -D msw@latest
npx msw init public/ --save
```

2. **Create Mock Handlers** (`e2e-tests/mocks/handlers.ts`):
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock chat API (agent suggestions)
  http.post('/api/chat', async () => {
    return HttpResponse.json({
      message: "Ich kann dir helfen, ein Bild zu erstellen!",
      agentSuggestion: {
        agentType: 'image-generation',
        reasoning: 'User asked for image generation',
        suggestedParams: {
          description: 'Satz des Pythagoras',
          imageStyle: 'illustrative'
        }
      }
    }, { status: 200 });
  }),

  // Mock image generation (no DALL-E call)
  http.post('/api/langgraph-agents/execute', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1s processing

    return HttpResponse.json({
      success: true,
      result: {
        image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 red pixel
        description: 'Mock generated image',
        artifact_data: {
          type: 'image',
          url: 'data:image/png;base64,...',
          metadata: {
            originalParams: {
              description: 'Satz des Pythagoras',
              imageStyle: 'illustrative'
            }
          }
        }
      }
    }, { status: 200 });
  }),

  // Mock InstantDB storage (stable URLs, no expiration)
  http.get('/api/storage/*', async () => {
    return HttpResponse.arrayBuffer(
      new Uint8Array([/* PNG header */]).buffer,
      { headers: { 'Content-Type': 'image/png' } }
    );
  }),
];
```

3. **Setup MSW in Tests** (`e2e-tests/setup-msw.ts`):
```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './mocks/handlers';

export const worker = setupWorker(...handlers);

// Start MSW before tests
export async function setupMSW() {
  if (process.env.VITE_TEST_MODE === 'true') {
    await worker.start({
      onUnhandledRequest: 'warn', // Log unmocked requests
    });
    console.log('✅ MSW mock server started');
  }
}
```

4. **Update Playwright Global Setup** (`e2e-tests/global-setup.ts`):
```typescript
import { setupMSW } from './setup-msw';

export default async function globalSetup() {
  console.log('🔧 Global test setup...');
  await setupMSW();
  console.log('✅ Global setup complete');
}
```

5. **Update Playwright Config**:
```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './e2e-tests/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    // MSW runs in browser context, no backend needed
  },
  webServer: {
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5173',
    // Backend NOT required anymore
  },
});
```

**Benefits**:
- Tests run in 5-10 seconds (vs. 5-10 minutes)
- No OpenAI API costs ($0 vs. $4+ per test run)
- No backend dependency (frontend only)
- Stable, predictable responses (no API variance)

**Success Metric**: Test suite completes in <30 seconds

---

#### Fix 1.2: Add Stable Test Selectors (data-testid Convention)

**Goal**: Add `data-testid` to all interactive elements (buttons, inputs, cards)

**Convention**:
```
data-testid="[feature]-[action]-[element]"

Examples:
- data-testid="chat-send-button"
- data-testid="agent-confirm-button"
- data-testid="image-result-view"
- data-testid="library-filter-bilder"
- data-testid="material-card"
- data-testid="material-preview-modal"
```

**Implementation**:

1. **Update Components** (Priority: High-Traffic Pages):
```typescript
// src/components/AgentResultView.tsx
<IonButton
  data-testid="continue-in-chat-button" // ✅ Add this
  onClick={handleContinueInChat}
>
  Weiter im Chat
</IonButton>

// src/pages/Chat/ChatView.tsx
<IonButton
  data-testid="chat-send-button" // ✅ Add this
  type="submit"
>
  Senden
</IonButton>

// src/pages/Library/Library.tsx
<div data-testid="material-card" className="material-card">
  <img data-testid="material-thumbnail" src={material.url} />
</div>
```

2. **Update Tests to Use Stable Selectors**:
```typescript
// BEFORE (brittle)
const continueButton = page.locator(
  'button[data-testid="continue-in-chat-button"], button:has-text("Weiter im Chat")'
).first();

// AFTER (stable)
const continueButton = page.locator('[data-testid="continue-in-chat-button"]');
```

3. **Create Selector Helper**:
```typescript
// e2e-tests/helpers/selectors.ts
export const selectors = {
  chat: {
    input: '[data-testid="chat-message-input"]',
    sendButton: '[data-testid="chat-send-button"]',
    messageList: '[data-testid="chat-message-list"]',
    message: '[data-testid="chat-message"]',
  },
  agent: {
    confirmButton: '[data-testid="agent-confirm-button"]',
    formView: '[data-testid="agent-form-view"]',
    resultView: '[data-testid="agent-result-view"]',
    continueButton: '[data-testid="continue-in-chat-button"]',
  },
  library: {
    grid: '[data-testid="library-grid"]',
    materialCard: '[data-testid="material-card"]',
    filterBilder: '[data-testid="library-filter-bilder"]',
    previewModal: '[data-testid="material-preview-modal"]',
  },
  tabs: {
    home: '[data-testid="tab-home"]',
    chat: '[data-testid="tab-chat"]',
    library: '[data-testid="tab-library"]',
  },
};

// Usage in tests
await page.locator(selectors.chat.sendButton).click();
```

**Benefits**:
- Tests survive refactoring (CSS classes can change)
- Tests survive i18n (text can change to English)
- Clear intent (testid names document purpose)
- Easier debugging (know which element test is targeting)

**Success Metric**: 0 text-based selectors in tests (100% data-testid)

---

#### Fix 1.3: Add Test Data Fixtures

**Goal**: Pre-defined test data for each test (no database pollution)

**Implementation**:

1. **Create Fixture File** (`e2e-tests/fixtures/testData.ts`):
```typescript
export const testData = {
  users: {
    teacher: {
      id: 'test-user-001',
      email: 'test@eduhu-e2e.de',
      name: 'Test Teacher',
    },
  },

  sessions: {
    emptySession: {
      id: 'session-empty',
      messages: [],
    },
    chatWithImages: {
      id: 'session-images',
      messages: [
        {
          id: 'msg-001',
          role: 'user',
          content: 'Erstelle ein Bild zur Photosynthese',
        },
        {
          id: 'msg-002',
          role: 'assistant',
          content: 'Hier ist dein Bild',
          metadata: {
            type: 'image',
            url: 'data:image/png;base64,...',
            originalParams: {
              description: 'Photosynthese',
              imageStyle: 'illustrative',
            },
          },
        },
      ],
    },
  },

  materials: {
    sampleImages: [
      {
        id: 'material-001',
        title: 'Photosynthese Bild',
        type: 'image',
        url: 'data:image/png;base64,...', // Stable data URL
        metadata: {
          originalParams: {
            description: 'Photosynthese',
            imageStyle: 'illustrative',
          },
        },
        createdAt: new Date().toISOString(),
      },
      // ... more fixtures
    ],
  },
};
```

2. **Mock InstantDB Queries**:
```typescript
// e2e-tests/mocks/handlers.ts
import { testData } from '../fixtures/testData';

export const handlers = [
  // Mock InstantDB query for messages
  http.post('/api/instantdb/query', async ({ request }) => {
    const body = await request.json();

    if (body.query.messages) {
      return HttpResponse.json({
        data: {
          messages: testData.sessions.chatWithImages.messages,
        },
      });
    }

    if (body.query.library_materials) {
      return HttpResponse.json({
        data: {
          library_materials: testData.materials.sampleImages,
        },
      });
    }
  }),
];
```

3. **Reset State Between Tests**:
```typescript
// e2e-tests/helpers/testHelper.ts
export class TestHelper {
  async resetTestData() {
    // Clear browser state
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => indexedDB.deleteDatabase(db.name!));
      });
    });

    console.log('✅ Test data reset');
  }
}

// In tests
test.beforeEach(async ({ page }) => {
  const helper = new TestHelper(page);
  await helper.resetTestData();
});
```

**Benefits**:
- Tests start with known state (no surprises)
- No expired URLs (data URLs don't expire)
- Fast (no database queries)
- Reproducible (same data every run)

**Success Metric**: 0 InstantDB query errors in tests

---

### Phase 2: Infrastructure (Next Week - Est. 12-16 hours)

#### Fix 2.1: Component Testing with Playwright Component Tests

**Goal**: Test React components in isolation (no full app)

**Implementation**:

1. **Install Playwright Component Testing**:
```bash
npm install -D @playwright/experimental-ct-react
```

2. **Configure Component Tests** (`playwright-ct.config.ts`):
```typescript
import { defineConfig } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src/components',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

3. **Write Component Test Example**:
```typescript
// src/components/AgentResultView.component.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import AgentResultView from './AgentResultView';

test('AgentResultView: "Weiter im Chat" button calls onContinue', async ({ mount }) => {
  let clicked = false;

  const component = await mount(
    <AgentResultView
      imageUrl="data:image/png;base64,..."
      onContinue={() => { clicked = true; }}
      onSaveToLibrary={() => {}}
      onRegenerate={() => {}}
    />
  );

  await component.locator('[data-testid="continue-in-chat-button"]').click();

  expect(clicked).toBe(true);
});
```

**Benefits**:
- Faster than E2E (no full app load)
- More reliable (no backend, no routing)
- Better error messages (component-level failures)
- Test props/events directly

**Success Metric**: 50+ component tests covering critical UI

---

#### Fix 2.2: Test Environment Management with Docker Compose

**Goal**: One command to start all dependencies (frontend + backend + database)

**Implementation**:

1. **Create Docker Compose** (`docker-compose.test.yml`):
```yaml
version: '3.8'
services:
  frontend:
    build: ./teacher-assistant/frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_TEST_MODE=true
    depends_on:
      - backend

  backend:
    build: ./teacher-assistant/backend
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@db:5432/test

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=test
    ports:
      - "5432:5432"
```

2. **Update Test Script**:
```json
// package.json
{
  "scripts": {
    "test:e2e": "docker-compose -f docker-compose.test.yml up -d && npx playwright test && docker-compose -f docker-compose.test.yml down"
  }
}
```

**Benefits**:
- Consistent environment (same on all machines)
- No manual setup (one command)
- Clean slate (tear down after tests)
- CI/CD ready (Docker in GitHub Actions)

**Success Metric**: `npm run test:e2e` works on fresh machine

---

#### Fix 2.3: Visual Regression Testing

**Goal**: Automatically detect UI changes (no manual verification)

**Implementation**:

1. **Install Percy or Chromatic**:
```bash
npm install -D @percy/cli @percy/playwright
```

2. **Add Visual Snapshots**:
```typescript
// e2e-tests/visual-regression.spec.ts
import { percySnapshot } from '@percy/playwright';

test('Agent Confirmation Card - Visual Regression', async ({ page }) => {
  await page.goto('/chat');

  // Trigger agent confirmation
  await page.locator(selectors.chat.sendButton).click();
  await page.locator(selectors.agent.confirmButton).waitFor();

  // Capture snapshot
  await percySnapshot(page, 'Agent Confirmation Card');
});
```

3. **Run Visual Tests**:
```bash
PERCY_TOKEN=<token> npx percy exec -- npx playwright test visual-regression.spec.ts
```

**Benefits**:
- Catch CSS regressions automatically
- Visual diffs in PR reviews
- Reduce manual QA time
- Document UI state over time

**Success Metric**: 20+ visual snapshots covering critical UI

---

### Phase 3: Long-term (This Month - Est. 16-20 hours)

#### Fix 3.1: CI/CD Integration with GitHub Actions

**Goal**: Run tests automatically on every PR

**Implementation**:

1. **Create Workflow** (`.github/workflows/e2e-tests.yml`):
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd teacher-assistant/frontend
          npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_TEST_MODE: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

2. **Add Branch Protection**:
```yaml
# GitHub repo settings
branches:
  main:
    protection:
      required_status_checks:
        - E2E Tests
```

**Benefits**:
- Catch regressions before merge
- Automated quality gate
- Test results in PR comments
- Historical test data

**Success Metric**: 0 PRs merged with failing tests

---

#### Fix 3.2: Test Coverage Metrics

**Goal**: Track which features are tested (identify gaps)

**Implementation**:

1. **Generate Coverage Report**:
```bash
npx playwright test --reporter=html,json
```

2. **Create Coverage Dashboard** (`scripts/test-coverage.ts`):
```typescript
import { readFileSync } from 'fs';

const results = JSON.parse(readFileSync('test-results.json', 'utf-8'));

const coverage = {
  total: results.suites.length,
  passing: results.suites.filter(s => s.status === 'passed').length,
  features: {
    'Image Generation': calculateCoverage('image-generation'),
    'Chat': calculateCoverage('chat'),
    'Library': calculateCoverage('library'),
  },
};

console.log(`Coverage: ${coverage.passing}/${coverage.total} (${(coverage.passing / coverage.total * 100).toFixed(1)}%)`);
```

3. **Add to CI**:
```yaml
- name: Generate coverage report
  run: node scripts/test-coverage.ts

- name: Comment PR
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        body: `## Test Coverage\n${coverage}`
      })
```

**Benefits**:
- Identify untested features
- Track coverage over time
- Enforce coverage minimums
- Document test status

**Success Metric**: 80% E2E coverage for critical paths

---

## 4. Implementation Guide

### Quick Start: Fix Current Tests (2-3 hours)

**Goal**: Get tests from 36% to 90% pass rate

**Steps**:

1. **Install MSW**:
```bash
cd teacher-assistant/frontend
npm install -D msw@latest
npx msw init public/ --save
```

2. **Create Mock Handlers**:
```bash
mkdir -p e2e-tests/mocks
touch e2e-tests/mocks/handlers.ts
```

Copy the handler code from Fix 1.1 above.

3. **Setup Global Test Config**:
```bash
touch e2e-tests/global-setup.ts
```

Copy the setup code from Fix 1.1 above.

4. **Update Playwright Config**:
```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './e2e-tests/global-setup.ts',
  timeout: 30000, // Reduce from 150s to 30s (no real API calls)
  // ... rest of config
});
```

5. **Update Test to Use Mocks**:
```typescript
// bug-fixes-2025-10-11.spec.ts
test.beforeEach(async ({ page }) => {
  // MSW automatically intercepts requests
  await page.goto('/');
  await helper.waitForChatInterface();
});
```

6. **Run Tests**:
```bash
VITE_TEST_MODE=true npx playwright test bug-fixes-2025-10-11.spec.ts --reporter=list
```

**Expected Result**:
- ✅ Tests complete in 20-30 seconds (vs. 10 minutes)
- ✅ No backend required (ERR_CONNECTION_REFUSED fixed)
- ✅ No API timeouts (mock responses instant)
- ✅ Pass rate: 90%+ (9-11/11 tests)

---

### Code Examples

#### MSW Handler for Image Generation

```typescript
// e2e-tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// Generate a stable mock image (1x1 red pixel PNG)
const MOCK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

export const handlers = [
  // Mock chat API - returns agent suggestion
  http.post('/api/chat', async ({ request }) => {
    const body = await request.json();
    const userMessage = body.message;

    // Detect image generation request
    const isImageRequest = /bild|image|erstelle|generate/i.test(userMessage);

    if (isImageRequest) {
      return HttpResponse.json({
        message: 'Ich kann dir helfen, ein Bild zu erstellen!',
        agentSuggestion: {
          agentType: 'image-generation',
          reasoning: 'User fragte nach Bildgenerierung',
          suggestedParams: {
            description: userMessage.replace(/erstelle ein bild |zur |vom /gi, ''),
            imageStyle: 'illustrative'
          }
        }
      }, { status: 200 });
    }

    // Normal chat response
    return HttpResponse.json({
      message: 'Das ist eine normale Antwort.',
      agentSuggestion: null
    }, { status: 200 });
  }),

  // Mock image generation - no DALL-E call
  http.post('/api/langgraph-agents/execute', async ({ request }) => {
    const body = await request.json();
    const { description, imageStyle } = body.params;

    // Simulate processing time (1 second vs. 60 seconds for real DALL-E)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return HttpResponse.json({
      success: true,
      result: {
        image_url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
        description: description,
        imageStyle: imageStyle,
        artifact_data: {
          type: 'image',
          url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
          metadata: {
            originalParams: {
              description,
              imageStyle,
              prompt: `Create an image of ${description} in ${imageStyle} style`,
            },
            generatedAt: new Date().toISOString(),
          }
        }
      }
    }, { status: 200 });
  }),

  // Mock InstantDB queries
  http.post('https://api.instantdb.com/runtime/query', async ({ request }) => {
    const body = await request.json();

    // Mock messages query
    if (body.query?.messages) {
      return HttpResponse.json({
        data: {
          messages: [
            {
              id: 'msg-001',
              role: 'user',
              content: 'Erstelle ein Bild zur Photosynthese',
              createdAt: Date.now(),
            },
            {
              id: 'msg-002',
              role: 'assistant',
              content: 'Hier ist dein Bild',
              metadata: JSON.stringify({
                type: 'image',
                url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
              }),
              createdAt: Date.now() + 1000,
            }
          ]
        }
      });
    }

    // Mock library_materials query
    if (body.query?.library_materials) {
      return HttpResponse.json({
        data: {
          library_materials: [
            {
              id: 'material-001',
              title: 'Photosynthese Bild',
              type: 'image',
              url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
              metadata: JSON.stringify({
                originalParams: {
                  description: 'Photosynthese',
                  imageStyle: 'illustrative',
                }
              }),
              createdAt: Date.now(),
            }
          ]
        }
      });
    }

    // Default empty response
    return HttpResponse.json({ data: {} });
  }),
];
```

#### Test Fixture Creation

```typescript
// e2e-tests/fixtures/testData.ts
export const MOCK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

export const testData = {
  users: {
    teacher: {
      id: 'test-user-001',
      email: 'test@eduhu-e2e.de',
      name: 'Test Teacher',
      createdAt: new Date().toISOString(),
    },
  },

  chatSessions: {
    empty: {
      id: 'session-empty',
      userId: 'test-user-001',
      messages: [],
    },

    withImages: {
      id: 'session-images',
      userId: 'test-user-001',
      messages: [
        {
          id: 'msg-text-001',
          role: 'user',
          content: 'Hallo, ich brauche Hilfe',
          metadata: null,
          createdAt: new Date('2025-10-13T10:00:00Z').toISOString(),
        },
        {
          id: 'msg-text-002',
          role: 'assistant',
          content: 'Gerne! Wie kann ich dir helfen?',
          metadata: null,
          createdAt: new Date('2025-10-13T10:00:05Z').toISOString(),
        },
        {
          id: 'msg-image-001',
          role: 'user',
          content: 'Erstelle ein Bild zur Photosynthese',
          metadata: null,
          createdAt: new Date('2025-10-13T10:01:00Z').toISOString(),
        },
        {
          id: 'msg-image-002',
          role: 'assistant',
          content: 'Hier ist dein Bild zur Photosynthese',
          metadata: JSON.stringify({
            type: 'image',
            url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
            originalParams: {
              description: 'Photosynthese',
              imageStyle: 'illustrative',
            }
          }),
          createdAt: new Date('2025-10-13T10:01:30Z').toISOString(),
        },
      ],
    },
  },

  libraryMaterials: {
    sampleImages: [
      {
        id: 'material-001',
        userId: 'test-user-001',
        title: 'Photosynthese',
        type: 'image',
        url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
        thumbnailUrl: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
        metadata: JSON.stringify({
          originalParams: {
            description: 'Photosynthese - Chlorophyll und Lichtenergie',
            imageStyle: 'illustrative',
            prompt: 'Create an educational illustration showing photosynthesis...'
          },
          generatedAt: new Date('2025-10-13T09:00:00Z').toISOString(),
        }),
        createdAt: new Date('2025-10-13T09:00:00Z').toISOString(),
      },
      {
        id: 'material-002',
        userId: 'test-user-001',
        title: 'Satz des Pythagoras',
        type: 'image',
        url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
        thumbnailUrl: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
        metadata: JSON.stringify({
          originalParams: {
            description: 'Satz des Pythagoras a² + b² = c²',
            imageStyle: 'realistic',
          }
        }),
        createdAt: new Date('2025-10-13T08:00:00Z').toISOString(),
      },
      {
        id: 'material-003',
        userId: 'test-user-001',
        title: 'DNA Struktur',
        type: 'image',
        url: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
        thumbnailUrl: `data:image/png;base64,${MOCK_IMAGE_BASE64}`,
        metadata: JSON.stringify({
          originalParams: {
            description: 'DNA Doppelhelix mit Basenpaaren',
            imageStyle: 'illustrative',
          }
        }),
        createdAt: new Date('2025-10-13T07:00:00Z').toISOString(),
      },
    ],
  },
};
```

#### Component Test Example

```typescript
// src/components/AgentResultView.component.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import AgentResultView from './AgentResultView';
import { MOCK_IMAGE_BASE64 } from '../../e2e-tests/fixtures/testData';

test.describe('AgentResultView - Component Tests', () => {
  test('renders image correctly', async ({ mount }) => {
    const imageUrl = `data:image/png;base64,${MOCK_IMAGE_BASE64}`;

    const component = await mount(
      <AgentResultView
        imageUrl={imageUrl}
        onContinue={() => {}}
        onSaveToLibrary={() => {}}
        onRegenerate={() => {}}
      />
    );

    const img = component.locator('[data-testid="result-image"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', imageUrl);
  });

  test('"Weiter im Chat" button calls onContinue', async ({ mount }) => {
    let continueClicked = false;

    const component = await mount(
      <AgentResultView
        imageUrl={`data:image/png;base64,${MOCK_IMAGE_BASE64}`}
        onContinue={() => { continueClicked = true; }}
        onSaveToLibrary={() => {}}
        onRegenerate={() => {}}
      />
    );

    await component.locator('[data-testid="continue-in-chat-button"]').click();

    expect(continueClicked).toBe(true);
  });

  test('debouncing prevents multiple clicks', async ({ mount }) => {
    let clickCount = 0;

    const component = await mount(
      <AgentResultView
        imageUrl={`data:image/png;base64,${MOCK_IMAGE_BASE64}`}
        onContinue={() => { clickCount++; }}
        onSaveToLibrary={() => {}}
        onRegenerate={() => {}}
      />
    );

    const button = component.locator('[data-testid="continue-in-chat-button"]');

    // Click 5 times rapidly
    await button.click();
    await button.click();
    await button.click();
    await button.click();
    await button.click();

    // Wait for debounce to settle
    await component.page().waitForTimeout(500);

    // Should only register 1 click (debounce with leading: true, trailing: false)
    expect(clickCount).toBe(1);
  });

  test('"In Bibliothek speichern" button calls onSaveToLibrary', async ({ mount }) => {
    let saveClicked = false;

    const component = await mount(
      <AgentResultView
        imageUrl={`data:image/png;base64,${MOCK_IMAGE_BASE64}`}
        onContinue={() => {}}
        onSaveToLibrary={() => { saveClicked = true; }}
        onRegenerate={() => {}}
      />
    );

    await component.locator('[data-testid="save-to-library-button"]').click();

    expect(saveClicked).toBe(true);
  });
});
```

#### Stable Selector Usage

```typescript
// e2e-tests/helpers/selectors.ts
export const selectors = {
  chat: {
    messageInput: '[data-testid="chat-message-input"]',
    sendButton: '[data-testid="chat-send-button"]',
    messageList: '[data-testid="chat-message-list"]',
    message: '[data-testid="chat-message"]',
    userMessage: '[data-testid="chat-message-user"]',
    assistantMessage: '[data-testid="chat-message-assistant"]',
  },

  agent: {
    confirmationCard: '[data-testid="agent-confirmation-card"]',
    confirmButton: '[data-testid="agent-confirm-button"]',
    cancelButton: '[data-testid="agent-cancel-button"]',

    formView: '[data-testid="agent-form-view"]',
    descriptionInput: '[data-testid="agent-description-input"]',
    styleSelect: '[data-testid="agent-style-select"]',
    generateButton: '[data-testid="agent-generate-button"]',

    progressView: '[data-testid="agent-progress-view"]',
    progressSpinner: '[data-testid="agent-progress-spinner"]',
    progressText: '[data-testid="agent-progress-text"]',

    resultView: '[data-testid="agent-result-view"]',
    resultImage: '[data-testid="result-image"]',
    continueButton: '[data-testid="continue-in-chat-button"]',
    saveButton: '[data-testid="save-to-library-button"]',
    regenerateButton: '[data-testid="regenerate-button"]',
  },

  library: {
    grid: '[data-testid="library-grid"]',
    placeholder: '[data-testid="library-placeholder"]',
    materialCard: '[data-testid="material-card"]',
    materialThumbnail: '[data-testid="material-thumbnail"]',
    materialTitle: '[data-testid="material-title"]',

    filterAll: '[data-testid="library-filter-all"]',
    filterBilder: '[data-testid="library-filter-bilder"]',
    filterDokumente: '[data-testid="library-filter-dokumente"]',

    previewModal: '[data-testid="material-preview-modal"]',
    previewImage: '[data-testid="preview-modal-image"]',
    previewTitle: '[data-testid="preview-modal-title"]',
    previewCloseButton: '[data-testid="preview-close-button"]',
    previewRegenerateButton: '[data-testid="preview-regenerate-button"]',
    previewDeleteButton: '[data-testid="preview-delete-button"]',
  },

  tabs: {
    home: '[data-testid="tab-home"]',
    chat: '[data-testid="tab-chat"]',
    library: '[data-testid="tab-library"]',
  },

  home: {
    promptGrid: '[data-testid="prompt-grid"]',
    promptTile: '[data-testid="prompt-tile"]',
  },
};

// Usage in tests:
import { selectors } from './helpers/selectors';

test('User can generate image', async ({ page }) => {
  // Clear, self-documenting selectors
  await page.locator(selectors.chat.messageInput).fill('Erstelle ein Bild');
  await page.locator(selectors.chat.sendButton).click();
  await page.locator(selectors.agent.confirmButton).click();
  await page.locator(selectors.agent.generateButton).click();

  await expect(page.locator(selectors.agent.resultImage)).toBeVisible();
});
```

---

## 5. Success Metrics

### Immediate Metrics (Phase 1 - Week 1)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Test Execution Time** | 5-10 minutes | <30 seconds | `time npx playwright test` |
| **Test Pass Rate** | 36.4% (4/11) | ≥95% (11/11) | Playwright HTML report |
| **Backend Dependency** | Required | None | Tests run with backend off |
| **API Costs** | $4+ per run | $0 | OpenAI API bill |
| **External API Calls** | 3-5 per test | 0 | MSW console logs |
| **Timeout Failures** | 7/11 tests | 0 | Playwright JSON report |

### Infrastructure Metrics (Phase 2 - Week 2)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Component Test Coverage** | 0 tests | 50+ tests | Playwright CT report |
| **Visual Snapshots** | 0 | 20+ | Percy dashboard |
| **Test Data Pollution** | 97 old images | 0 | Clean state between runs |
| **Selector Stability** | 30% data-testid | 100% | Grep `data-testid` count |

### CI/CD Metrics (Phase 3 - Month 1)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **CI Test Duration** | N/A (no CI) | <5 minutes | GitHub Actions logs |
| **PR Test Failures** | N/A | <5% | GitHub PR stats |
| **E2E Coverage** | Unknown | 80% critical paths | Custom coverage script |
| **Flaky Test Rate** | Unknown | <2% | Playwright flakiness API |

### Overall Success Criteria

**Definition of Success** (by end of Month 1):

1. ✅ **Test suite runs in <30 seconds** (down from 5-10 minutes)
2. ✅ **95%+ pass rate** (up from 36%)
3. ✅ **Zero external API calls** (all mocked)
4. ✅ **Tests run without backend** (frontend only)
5. ✅ **Tests run in CI/CD** (GitHub Actions green)
6. ✅ **Component tests for critical UI** (50+ tests)
7. ✅ **Visual regression testing** (20+ snapshots)
8. ✅ **100% data-testid coverage** (no text selectors)
9. ✅ **Zero data pollution** (clean state between tests)
10. ✅ **80% E2E coverage** (critical user paths)

---

## 6. Risk Mitigation

### Risk 1: MSW Not Intercepting Requests

**Symptom**: Tests still call real APIs despite MSW setup

**Mitigation**:
1. Verify MSW worker starts before tests:
```typescript
test.beforeAll(async () => {
  const worker = setupWorker(...handlers);
  await worker.start();
  console.log('✅ MSW worker started:', worker.listHandlers());
});
```

2. Add unhandled request logging:
```typescript
worker.start({
  onUnhandledRequest: (req, print) => {
    console.warn('🚨 Unhandled request:', req.method, req.url);
    print.warning();
  }
});
```

3. Verify handlers match actual API endpoints:
```bash
# Check network tab in browser DevTools during test
# URLs should show (mocked) badge
```

---

### Risk 2: Component Tests Don't Render Ionic Components

**Symptom**: `IonButton`, `IonInput` not rendering in component tests

**Mitigation**:
1. Setup Ionic in component test config:
```typescript
// playwright-ct.config.ts
import { IonicReact } from '@ionic/react';

export default defineConfig({
  use: {
    ctViteConfig: {
      plugins: [react()],
    },
    ctPort: 3100,
    ctTemplateDir: './tests/component',
  },
});
```

2. Wrap components in Ionic provider:
```typescript
// tests/component/index.tsx
import { IonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';

export default function App({ children }) {
  return (
    <IonicReact>
      {children}
    </IonicReact>
  );
}
```

---

### Risk 3: Data-testid Refactoring Too Time-Consuming

**Symptom**: 100+ components need updates, taking multiple days

**Mitigation**:
1. **Prioritize high-impact components first**:
   - AgentResultView (critical for US1)
   - Library.tsx (critical for US3)
   - ChatView.tsx (critical for regression tests)

2. **Use codemod for bulk updates**:
```typescript
// scripts/add-testids.ts
import { Project } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths('src/**/*.tsx');

for (const sourceFile of project.getSourceFiles()) {
  sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement).forEach(element => {
    const tagName = element.getOpeningElement().getTagNameNode().getText();

    if (['IonButton', 'button'].includes(tagName)) {
      // Add data-testid if missing
      if (!element.getAttribute('data-testid')) {
        const testId = generateTestId(element);
        element.addAttribute({
          name: 'data-testid',
          initializer: `"${testId}"`
        });
      }
    }
  });

  sourceFile.save();
}
```

3. **Allow hybrid approach temporarily**:
```typescript
// Helper allows fallback during transition
const locator = (testId: string, fallbackSelector: string) => {
  return page.locator(`[data-testid="${testId}"], ${fallbackSelector}`);
};

await locator('chat-send-button', 'button:has-text("Senden")').click();
```

---

## 7. Lessons Learned & Prevention

### Lesson 1: Test Strategy Must Be Defined Before Implementation

**What Went Wrong**:
- 90+ E2E test files created ad-hoc
- No testing pyramid (more E2E than unit tests)
- No mocking strategy defined

**Prevention**:
- Document testing strategy in `.specify/templates/TESTING-STRATEGY.md`
- Require test plan in SpecKit spec.md before implementation
- Review test approach in planning phase

**Template**:
```markdown
## Testing Strategy

### Unit Tests (70% of tests)
- Component props/events
- Utility functions
- State management logic
- **Tools**: Vitest, React Testing Library

### Integration Tests (20% of tests)
- Component combinations
- API integration (mocked)
- Routing
- **Tools**: Playwright Component Tests

### E2E Tests (10% of tests)
- Critical user journeys only
- Happy path scenarios
- Smoke tests
- **Tools**: Playwright E2E with MSW mocks
```

---

### Lesson 2: Selectors Must Be Stable from Day 1

**What Went Wrong**:
- Tests used text matching (`button:has-text("Weiter im Chat")`)
- Tests broke when changing German → English text
- No data-testid convention enforced

**Prevention**:
- Add `data-testid` linting rule (ESLint plugin)
- PR template checklist: "All interactive elements have data-testid"
- Document convention in CLAUDE.md

**Linting Rule**:
```json
// .eslintrc.json
{
  "plugins": ["jsx-a11y", "testing-library"],
  "rules": {
    "testing-library/prefer-screen-queries": "error",
    "jsx-a11y/prefer-testid": "warn" // Custom rule
  }
}
```

---

### Lesson 3: Mock External Dependencies Early

**What Went Wrong**:
- Tests used real OpenAI API from day 1
- No MSW setup until infrastructure became painful
- Expensive and slow to iterate

**Prevention**:
- Setup MSW in project scaffolding (before first test)
- Default to mocks, opt-in to real APIs (not vice versa)
- Document mocking patterns in CLAUDE.md

**Project Template**:
```bash
# New project setup script
npx create-react-app teacher-assistant
cd teacher-assistant
npm install -D msw playwright
npx msw init public/ --save
mkdir -p e2e-tests/mocks
cp ../templates/msw-handlers.ts e2e-tests/mocks/handlers.ts
```

---

## 8. Appendix

### A. Related Documentation

- **Test Strategy**: `docs/testing/test-strategy.md`
- **Bug Tracking**: `docs/quality-assurance/bug-tracking.md`
- **Historical Test Reports**:
  - `docs/testing/test-reports/2025-10-07/e2e-complete-workflow-report.md`
  - `docs/testing/test-reports/2025-10-11/bug-fixes-e2e-test-suite-summary.md`
  - `docs/development-logs/sessions/2025-10-13/session-01-qa-phase-bug-fixes-2025-10-11.md`
- **Bug Investigation**: `docs/testing/bug-investigation-report-2025-10-12.md`

---

### B. MSW Resources

- **Official Docs**: https://mswjs.io/docs/
- **Playwright Integration**: https://mswjs.io/docs/integrations/browser#playwright
- **Best Practices**: https://kentcdodds.com/blog/stop-mocking-fetch
- **MSW v2 Migration**: https://mswjs.io/docs/migrations/1.x-to-2.x

---

### C. Playwright Resources

- **Component Testing**: https://playwright.dev/docs/test-components
- **Visual Comparisons**: https://playwright.dev/docs/test-snapshots
- **Network Mocking**: https://playwright.dev/docs/network
- **Best Practices**: https://playwright.dev/docs/best-practices

---

### D. Testing Pyramid Reference

```
        E2E Tests (10%)
    /                    \
   /  Integration (20%)   \
  /                        \
 /   Unit Tests (70%)       \
/____________________________\

Characteristics:
- Unit: Fast (<1s), isolated, many
- Integration: Medium (<10s), combined, some
- E2E: Slow (<30s), full stack, few
```

**Current State** (Inverted Pyramid - BAD):
```
 \____________________________/
  \                        /
   \  Integration (5%)   /
    \                  /
        Unit (5%)
        E2E (90%) ❌
```

**Target State** (Proper Pyramid - GOOD):
```
        E2E (10%)
    /                    \
   /  Integration (20%)   \
  /                        \
 /   Unit (70%)             \
/____________________________\
```

---

### E. Quick Reference Commands

```bash
# Install MSW
npm install -D msw@latest
npx msw init public/ --save

# Run E2E tests (with mocks)
VITE_TEST_MODE=true npx playwright test

# Run specific test file
npx playwright test bug-fixes-2025-10-11.spec.ts

# Debug test (headed browser)
npx playwright test --headed --debug

# Generate HTML report
npx playwright show-report

# Run component tests
npx playwright test --config=playwright-ct.config.ts

# Check test coverage
node scripts/test-coverage.ts

# Run visual tests
PERCY_TOKEN=<token> npx percy exec -- npx playwright test visual-regression.spec.ts

# Start test environment
docker-compose -f docker-compose.test.yml up

# Clean test environment
docker-compose -f docker-compose.test.yml down -v
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-13
**Status**: Ready for Implementation
**Estimated Total Effort**: 36-48 hours (spread over 3-4 weeks)
**ROI**: 10x improvement in test reliability, 20x faster execution, $1000+ saved in API costs per year
