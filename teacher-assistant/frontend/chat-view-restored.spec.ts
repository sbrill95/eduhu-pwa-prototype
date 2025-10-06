import { test } from '@playwright/test';

test('ChatView - Verify Gemini styling after revert', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for app to load
  await page.waitForLoadState('networkidle');

  // Click on Chat tab
  await page.click('ion-tab-button[tab="generieren"]');

  // Wait for chat view to load
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({
    path: 'chat-view-restored.png',
    fullPage: true
  });
});
