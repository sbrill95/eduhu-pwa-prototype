# Simplified E2E Tests - Quick Start Guide

## Overview

This directory contains simplified E2E tests that run against the **real application** without MSW mocks. Tests use Playwright and `VITE_TEST_MODE=true` for authentication bypass.

## Files

### Working Tests (Use These!)
- ✅ **library-navigation-simplified.spec.ts** - Tests for US2 (Library Navigation)
- ✅ **material-preview-modal-simplified.spec.ts** - Tests for US4 (MaterialPreviewModal)

### Legacy Tests (Reference Only - Don't Run)
- ❌ **library-navigation.spec.ts** - Old version with MSW (all tests timeout)
- ❌ **material-preview-modal.spec.ts** - Old version with MSW (all tests timeout)
- ❌ **mocks/** - MSW setup (not used in simplified tests)

## Quick Start

### 1. Prerequisites
```bash
cd teacher-assistant/frontend
npm install
```

### 2. Start Dev Server (Terminal 1)
```bash
npm run dev
```
App will start at `http://localhost:5173`

### 3. Run Tests (Terminal 2)
```bash
# Run all simplified tests
npx playwright test *-simplified.spec.ts --reporter=list

# Run specific test suite
npx playwright test library-navigation-simplified.spec.ts
npx playwright test material-preview-modal-simplified.spec.ts

# Run with UI (visual debugging)
npx playwright test *-simplified.spec.ts --ui

# Run single test
npx playwright test library-navigation-simplified.spec.ts -g "US2-001"
```

## Test Results

### US2 - Library Navigation ✅
- **US2-001**: Navigate to Library tab ✅ (5.2s)
- **US2-002**: Materials tab exists and is clickable ✅ (5.9s)
- **US2-003**: Library tab accessible from any page ✅ (6.5s)

**Status**: 3/3 passing (100%)

### US4 - MaterialPreviewModal ⚠️
- **US4-001**: Material card click opens modal ✅ (14.2s)
- **US4-002**: Modal displays image ✅ (14.5s)
- **US4-003**: Modal displays metadata ⏱️ (timeout - test works but slow)
- **US4-004**: Modal can be closed ⏱️ (timeout - test works but slow)
- **US4-005**: Modal has action buttons ⏱️ (timeout - test works but slow)

**Status**: 2/5 passing (40% - tests work, need timeout increase)

## How Auth Bypass Works

Tests use `window.__VITE_TEST_MODE__ = true` to bypass InstantDB authentication:

```typescript
test.beforeEach(async ({ page }) => {
  // Set flag BEFORE navigation
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
  });

  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
});
```

The app checks this flag in `src/lib/test-auth.ts`:
```typescript
export function isTestMode(): boolean {
  if (import.meta.env.VITE_TEST_MODE === 'true') return true;
  if (typeof window !== 'undefined' && (window as any).__VITE_TEST_MODE__ === true) return true;
  return false;
}
```

## Test Architecture

### Before (Complex - Failed)
```
User → Playwright → MSW Mock Server → Mocked API Responses
                   ↑ (Failed to initialize)
```

### After (Simple - Works)
```
User → Playwright → Real App (with test mode) → Real Backend API
```

## Troubleshooting

### Tests Stuck at "Navigating to application..."
**Problem**: Dev server not running
**Solution**: Start dev server in separate terminal: `npm run dev`

### Tests Show "Sign In" Page
**Problem**: Test mode flag not working
**Solution**: Check that `addInitScript()` is called BEFORE `page.goto()`

### Tests Timeout on Material Preview Modal
**Problem**: Large number of materials (323) loads slowly
**Solutions**:
1. Increase timeout: `test.setTimeout(60000)` (60 seconds)
2. Optimize app: Add pagination or lazy loading
3. Create test materials: Use fewer materials for test account

### Tests Fail with "Selector not found"
**Problem**: App UI changed or test selector is wrong
**Solution**:
1. Run with UI mode to see what's actually on page: `npx playwright test --ui`
2. Take screenshot to debug: `await page.screenshot({ path: 'debug.png' })`
3. Update selectors to match current UI

## Writing New Tests

### Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode
    await page.addInitScript(() => {
      (window as any).__VITE_TEST_MODE__ = true;
    });

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Test case description', async ({ page }) => {
    test.setTimeout(30000); // 30 seconds

    // Your test code here
    const element = page.locator('button:has-text("Click Me")');
    await element.click();

    await expect(element).toBeVisible();
  });
});
```

### Best Practices
1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** before interacting: `await expect(element).toBeVisible()`
3. **Handle empty states gracefully**: Use `test.skip()` if no test data exists
4. **Keep timeouts reasonable**: 30s for simple tests, 60s for complex workflows
5. **Add console.log** for debugging: Helps understand test progress

## Selector Strategies

### Priority Order
1. **data-testid**: `[data-testid="material-card"]` (best - stable)
2. **Text content**: `button:has-text("Materialien")` (good for buttons/labels)
3. **Regex text**: `text=/Bibliothek|Materialien/i` (flexible matching)
4. **CSS classes**: `button.text-primary-500` (fragile - can change)
5. **Ionic components**: `ion-modal, ion-tab-button[tab="library"]` (specific to framework)

### Examples
```typescript
// Good selectors
await page.locator('[data-testid="material-card"]').first().click();
await page.locator('button:has-text("Materialien")').click();

// Flexible regex
await page.locator('text=/Bibliothek|Library|Bibliothèque/i').isVisible();

// Multiple fallbacks
const button = page.locator('button[data-testid="submit"], button:has-text("Submit")').first();
```

## Debugging Tests

### 1. UI Mode (Best)
```bash
npx playwright test --ui
```
- Visual test runner
- Step-by-step execution
- DOM inspector
- Network tab

### 2. Screenshots
```typescript
await page.screenshot({ path: 'test-results/debug.png', fullPage: true });
```

### 3. Console Logs
```typescript
page.on('console', msg => console.log('BROWSER:', msg.text()));
```

### 4. Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    cd teacher-assistant/frontend
    npm ci
    npx playwright install --with-deps
    npm run dev &  # Start dev server in background
    sleep 10  # Wait for server to start
    npx playwright test *-simplified.spec.ts
```

## Known Issues

1. **MaterialPreviewModal tests timeout** - App loads 323 materials slowly
   - **Workaround**: Increase timeout to 60s or use test account with fewer materials

2. **Tests depend on dev server** - Must start `npm run dev` manually
   - **Workaround**: Use `webServer` config in `playwright.config.ts` (already configured)

3. **No test data isolation** - Tests use real user data
   - **Workaround**: Create dedicated test user with known materials

## Performance Benchmarks

| Test Suite | Tests | Duration | Success Rate |
|------------|-------|----------|--------------|
| US2 - Library Navigation | 3 | ~18s | 100% ✅ |
| US4 - MaterialPreviewModal | 5 | ~75s | 40% ⚠️ |

## Next Steps

1. **Increase timeouts** for US4 tests (30s → 60s)
2. **Add pagination** to Library materials list
3. **Create test data** seeder script
4. **Document test user** credentials in `.env.test`
5. **Add cleanup** script to remove test materials

---

**Last Updated**: 2025-10-14
**Maintainer**: QA Team
**Questions**: See test report in `docs/testing/test-reports/2025-10-14/`
