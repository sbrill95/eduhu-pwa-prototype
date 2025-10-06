import { test, expect } from '@playwright/test';

test.describe('Chat Summary Verification', () => {
  test('verify summaries are displayed in Library', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5176');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Click on Library tab
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();

    // Wait for Library content to load
    await page.waitForTimeout(1500);

    // Take screenshot of Library view
    await page.screenshot({
      path: 'library-summary-check.png',
      fullPage: true
    });

    console.log('Library screenshot saved as library-summary-check.png');
  });

  test('verify summaries are displayed in Home', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5176');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Take screenshot of Home view (should show "Letzte Chats" with summaries)
    await page.screenshot({
      path: 'home-summary-check.png',
      fullPage: true
    });

    console.log('Home screenshot saved as home-summary-check.png');
  });
});
