import { test, expect } from '@playwright/test';

test.describe('Chat Summaries - Library View', () => {
  test('should display chat summary in Library view', async ({ page }) => {
    // Set mobile viewport (390px - iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to app
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Navigate to Library/Automatisieren tab
    await page.click('[data-testid="tab-automatisieren"]');

    // Wait for Library view to load
    await page.waitForTimeout(1000);

    // Take screenshot of Library view with chat summaries
    await page.screenshot({
      path: 'library-chat-summary.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: library-chat-summary.png');
  });
});
