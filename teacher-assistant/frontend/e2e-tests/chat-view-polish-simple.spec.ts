import { test, expect } from '@playwright/test';

/**
 * Simplified Chat View Polish Verification
 * Takes screenshots to verify Gemini design implementation
 */

test.describe('Chat View Polish - Visual Verification', () => {
  test('Take screenshot of Chat View with polish improvements', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on Chat tab (using the button with Chat text)
    const chatButton = page.locator('button').filter({ hasText: 'Chat' });
    await chatButton.click();
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'chat-view-polish-full.png',
      fullPage: true
    });

    console.log('✅ Full screenshot saved: chat-view-polish-full.png');

    // Take viewport screenshot
    await page.screenshot({
      path: 'chat-view-polish-viewport.png',
      fullPage: false
    });

    console.log('✅ Viewport screenshot saved: chat-view-polish-viewport.png');

    // Scroll to input area
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    // Take screenshot of input area
    await page.screenshot({
      path: 'chat-view-input-area.png',
      fullPage: false
    });

    console.log('✅ Input area screenshot saved: chat-view-input-area.png');
  });
});
