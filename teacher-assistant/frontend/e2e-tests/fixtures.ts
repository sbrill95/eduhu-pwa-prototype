/**
 * Custom Playwright Test Fixtures - Global Auth Bypass
 *
 * This file extends Playwright's base test to automatically inject
 * the TEST_MODE flag for authentication bypass in ALL tests.
 *
 * Usage in tests:
 * ```typescript
 * import { test, expect } from './fixtures';
 *
 * test('my test', async ({ page }) => {
 *   // Auth bypass is already active! No need to manually inject.
 *   await page.goto('/');
 *   // Test continues normally...
 * });
 * ```
 *
 * Benefits:
 * - Automatic auth bypass for ALL tests
 * - DRY principle (Don't Repeat Yourself)
 * - Impossible to forget auth bypass
 * - Single source of truth
 * - Easy to extend with more global setup
 *
 * Implementation: Option 2 (Global Setup)
 * Created: 2025-10-21
 * See: docs/testing/playwright-auth-bypass-pattern.md
 */

import { test as base, expect as baseExpect } from '@playwright/test';

/**
 * Extended Playwright test with automatic auth bypass injection
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // 🔑 CRITICAL: Inject TEST_MODE flag BEFORE every test
    // This bypasses InstantDB authentication for all tests
    await page.addInitScript(() => {
      (window as any).__VITE_TEST_MODE__ = true;
      console.log('🔧 [FIXTURE] TEST_MODE injected automatically via custom fixture');
    });

    // Optional: Add console error tracking globally
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        consoleErrors.push(errorText);
        console.error('❌ [FIXTURE] CONSOLE ERROR:', errorText);
      }
    });

    // Provide the page to the test
    await use(page);

    // After test: Report console errors if any
    if (consoleErrors.length > 0) {
      console.error(`\n❌ Test completed with ${consoleErrors.length} console errors:`);
      consoleErrors.forEach((err, i) => {
        console.error(`  ${i + 1}. ${err}`);
      });
    } else {
      console.log('✅ [FIXTURE] Test completed with ZERO console errors');
    }
  },
});

/**
 * Re-export expect for convenience
 */
export { baseExpect as expect };

/**
 * Type definitions for global window extensions
 */
declare global {
  interface Window {
    __VITE_TEST_MODE__?: boolean;
  }
}
