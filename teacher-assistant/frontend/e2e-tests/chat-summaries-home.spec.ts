import { test, expect } from '@playwright/test';

test.describe('Chat Summaries - Home View', () => {
  test('should display chat summary in Home view', async ({ page }) => {
    // Set mobile viewport (390px - iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to app
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Wait for Home view
    await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });

    // Take screenshot of Home view with chat summaries
    await page.screenshot({
      path: 'home-chat-summary.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: home-chat-summary.png');
  });
});
