/**
 * Example Test Using Global Auth Bypass Fixture
 *
 * This test demonstrates the NEW pattern using custom fixtures.
 * Auth bypass is automatically injected - no manual setup needed!
 *
 * Key differences from old pattern:
 * ✅ Import from './fixtures' instead of '@playwright/test'
 * ✅ NO manual addInitScript needed
 * ✅ Auth bypass works automatically
 * ✅ Console error tracking included
 *
 * Created: 2025-10-21
 * Purpose: Example of Option 2 (Global Setup) implementation
 */

import { test, expect } from './fixtures'; // ✅ NEW: Import from fixtures

test.describe('Example: Global Auth Bypass', () => {
  // ✅ NEW: No beforeEach needed for auth bypass!
  // The fixture handles it automatically

  test('should load home page with auth bypass active', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify auth bypass worked - should NOT see login screen
    const loginButton = page.locator('text=Anmelden');
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    // Assert: Login button should NOT be visible (auth bypassed)
    expect(isLoginVisible).toBe(false);

    console.log('✅ Test passed: Auth bypass is working via global fixture!');
  });

  test('should have TEST_MODE flag set in window', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if TEST_MODE flag is set
    const testModeActive = await page.evaluate(() => {
      return (window as any).__VITE_TEST_MODE__ === true;
    });

    // Assert: TEST_MODE should be true
    expect(testModeActive).toBe(true);

    console.log('✅ Test passed: window.__VITE_TEST_MODE__ = true');
  });

  test('should show console log confirming fixture injection', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for console messages to appear
    await page.waitForTimeout(1000);

    // Check if fixture injection message appeared
    const fixtureLogFound = consoleLogs.some(log =>
      log.includes('[FIXTURE] TEST_MODE injected automatically')
    );

    expect(fixtureLogFound).toBe(true);

    console.log('✅ Test passed: Fixture injection logged to console');
  });
});

/**
 * COMPARISON: Old vs New Pattern
 *
 * OLD PATTERN (Manual injection in every test):
 * ```typescript
 * import { test, expect } from '@playwright/test';
 *
 * test.beforeEach(async ({ page }) => {
 *   // ❌ Had to manually inject in EVERY test file
 *   await page.addInitScript(() => {
 *     (window as any).__VITE_TEST_MODE__ = true;
 *   });
 * });
 *
 * test('my test', async ({ page }) => {
 *   // Test code...
 * });
 * ```
 *
 * NEW PATTERN (Automatic via fixture):
 * ```typescript
 * import { test, expect } from './fixtures'; // ✅ Use custom fixture
 *
 * // ✅ No beforeEach needed!
 *
 * test('my test', async ({ page }) => {
 *   // Auth bypass already active automatically!
 * });
 * ```
 */
