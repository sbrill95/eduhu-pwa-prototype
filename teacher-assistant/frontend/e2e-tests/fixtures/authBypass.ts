/**
 * Shared Auth Bypass Fixture for E2E Tests
 *
 * Automatically injects TEST_MODE flag into all tests to bypass authentication.
 * Eliminates "forgot auth bypass" mistakes (saved 3-6 hours in past incidents).
 *
 * Usage:
 *   import { test } from './fixtures/authBypass';
 *
 *   test('My test', async ({ page }) => {
 *     // Auth bypass automatically active ✅
 *     await page.goto('/library');
 *   });
 */

import { test as base, expect } from '@playwright/test';

/**
 * Extended test with automatic auth bypass
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // 🔑 CRITICAL: Inject auth bypass BEFORE any navigation
    await page.addInitScript(() => {
      (window as any).__VITE_TEST_MODE__ = true;
      console.log('🔧 TEST_MODE injected via Playwright authBypass fixture');
    });

    // Verify auth bypass is active
    await page.goto('/');

    const testModeActive = await page.evaluate(() => {
      return (window as any).__VITE_TEST_MODE__ === true;
    });

    if (!testModeActive) {
      throw new Error(
        '❌ Auth bypass FAILED!\n' +
        '  TEST_MODE flag not active after injection.\n' +
        '  Check: teacher-assistant/frontend/src/lib/test-auth.ts\n' +
        '  Ensure TEST_MODE check happens BEFORE InstantDB init.'
      );
    }

    // Verify NOT on login page
    const isLoginPage = await page.locator('text=Anmelden').isVisible().catch(() => false);

    if (isLoginPage) {
      throw new Error(
        '❌ Auth bypass FAILED!\n' +
        '  Test is on login page despite TEST_MODE injection.\n' +
        '  Possible causes:\n' +
        '    1. test-auth.ts not checking __VITE_TEST_MODE__\n' +
        '    2. Auth check happens before addInitScript completes\n' +
        '    3. TEST_MODE flag cleared somewhere\n' +
        '  Fix: See docs/testing/playwright-auth-bypass-pattern.md'
      );
    }

    console.log('✅ Auth bypass verified - TEST_MODE active, not on login page');

    // Use page in test
    await use(page);
  },
});

/**
 * Re-export expect for convenience
 */
export { expect };

/**
 * Helper: Verify auth bypass is working
 * Use in test.beforeEach if you want extra verification
 */
export async function verifyAuthBypass(page: any): Promise<void> {
  const testModeActive = await page.evaluate(() => (window as any).__VITE_TEST_MODE__);

  if (!testModeActive) {
    throw new Error('Auth bypass not active! TEST_MODE flag is false.');
  }

  const isLoginPage = await page.locator('text=Anmelden').isVisible().catch(() => false);

  if (isLoginPage) {
    throw new Error('Auth bypass failed! Test is on login page.');
  }
}
