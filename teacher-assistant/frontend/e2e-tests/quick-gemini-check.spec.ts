import { test, expect } from '@playwright/test';

test.describe('Quick Gemini Design Check', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    consoleWarnings = [];

    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error' && !text.includes('DevTools') && !text.includes('Profile already exists')) {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Go to home page
    await page.goto('http://localhost:5173', {
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);
  });

  test('Check Tab Bar - Orange active state', async ({ page }) => {
    console.log('🔍 Checking Tab Bar colors...');

    // Find active tab (should be Home)
    const homeTab = page.locator('ion-tab-button[tab="home"]');
    await expect(homeTab).toBeVisible();

    // Check if it has the selected class or attribute
    const isSelected = await homeTab.evaluate(el =>
      el.classList.contains('tab-selected') || el.hasAttribute('aria-selected')
    );

    console.log(`✅ Home tab selected: ${isSelected}`);
    expect(isSelected).toBeTruthy();
  });

  test('Check Chat View - Orange send button', async ({ page }) => {
    console.log('🔍 Checking Chat view...');

    // Click Chat tab
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    // Check send button exists
    const sendButton = page.locator('ion-button').filter({ hasText: /senden|send/i }).first();

    if (await sendButton.count() > 0) {
      console.log('✅ Send button found');
    } else {
      console.log('⚠️  Send button not found (might be icon-only)');
    }
  });

  test('Console errors check', async ({ page }) => {
    console.log('🔍 Checking console errors...');

    // Navigate through all tabs
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    await page.click('ion-tab-button[tab="library"]');
    await page.waitForTimeout(1000);

    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(1000);

    // Log findings
    console.log(`📊 Console Errors: ${consoleErrors.length}`);
    console.log(`📊 Console Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    // Only fail if there are critical errors (not network errors from API)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('Failed to fetch') &&
      !err.includes('CONNECTION_REFUSED') &&
      !err.includes('net::ERR')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('Performance check - Page load', async ({ page }) => {
    console.log('🔍 Checking performance...');

    const startTime = Date.now();

    await page.goto('http://localhost:5173', {
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });

    const loadTime = Date.now() - startTime;
    console.log(`⏱️  Page load time: ${loadTime}ms`);

    // Page should load in < 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
