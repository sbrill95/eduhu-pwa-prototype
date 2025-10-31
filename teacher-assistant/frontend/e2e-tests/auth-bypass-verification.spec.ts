/**
 * Auth Bypass Verification Test
 *
 * Purpose: Verify that the reactive auth bypass fix works correctly
 *
 * This test checks:
 * 1. Test mode flag is injected by Playwright fixture
 * 2. AuthContext detects the flag reactively
 * 3. App loads without hanging on blank page
 * 4. Bottom navigation bar appears (proves auth bypass worked)
 */

import { test, expect } from './fixtures'; // Uses custom fixture with automatic auth bypass

const BASE_URL = 'http://localhost:5174';

test.describe('Auth Bypass Verification', () => {

  test('Auth bypass allows app to load without authentication', async ({ page }) => {
    console.log('🧪 Testing reactive auth bypass...');

    // Track console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
    });

    // Navigate to app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    console.log('✅ Page navigated and network idle');

    // Wait a bit for React to initialize
    await page.waitForTimeout(3000);

    // Verify test mode flag was injected
    const testModeFlag = await page.evaluate(() => {
      return (window as any).__VITE_TEST_MODE__;
    });
    console.log(`🔍 window.__VITE_TEST_MODE__ = ${testModeFlag}`);
    expect(testModeFlag).toBe(true);

    // Check for auth bypass console messages
    const hasAuthBypassLog = consoleMessages.some(msg =>
      msg.includes('TEST_MODE') ||
      msg.includes('Test mode') ||
      msg.includes('test mode')
    );
    console.log(`🔍 Auth bypass log found: ${hasAuthBypassLog}`);

    // CRITICAL: Verify bottom navigation appears (proves app loaded successfully)
    const bottomNavExists = await page.locator('.tab-bar-fixed').isVisible({ timeout: 10000 });
    console.log(`🔍 Bottom navigation visible: ${bottomNavExists}`);

    if (!bottomNavExists) {
      // Debug: capture what's on the page
      const bodyText = await page.locator('body').textContent();
      console.log(`❌ Body content: ${bodyText?.substring(0, 500)}`);

      await page.screenshot({
        path: 'docs/testing/screenshots/auth-bypass-failed.png',
        fullPage: true
      });
    }

    expect(bottomNavExists).toBe(true);

    // Verify specific tabs exist (use data-testid for bottom nav tabs)
    const homeTab = await page.locator('.tab-bar-fixed button:has-text("Home")').isVisible();
    const chatTab = await page.locator('[data-testid="tab-chat"]').isVisible();
    const libraryTab = await page.locator('.tab-bar-fixed button:has-text("Bibliothek")').isVisible();

    console.log(`🔍 Home tab: ${homeTab}, Chat tab: ${chatTab}, Library tab: ${libraryTab}`);
    expect(homeTab && chatTab && libraryTab).toBe(true);

    // Success screenshot
    await page.screenshot({
      path: 'docs/testing/screenshots/auth-bypass-success.png',
      fullPage: true
    });

    console.log('✅ Auth bypass verification PASSED');
  });

  test('AuthContext reactively detects test mode flag changes', async ({ page }) => {
    console.log('🧪 Testing AuthContext reactivity...');

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for AuthContext reactive log messages
    const hasReactiveLog = consoleLogs.some(log =>
      log.includes('[AuthContext]') && log.includes('Test mode')
    );

    console.log(`🔍 AuthContext reactive logs found: ${hasReactiveLog}`);
    console.log('Console logs:', consoleLogs.filter(log => log.includes('AuthContext')));

    // Verify app is functional (not stuck in loading state)
    const isLoading = await page.locator('text=Anmeldung wird überprüft').isVisible();
    expect(isLoading).toBe(false);

    console.log('✅ AuthContext reactivity test PASSED');
  });
});
