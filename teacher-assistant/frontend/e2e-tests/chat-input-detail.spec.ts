import { test, expect } from '@playwright/test';

/**
 * Chat Input Area Detail Test
 * Specifically tests the horizontal layout of input controls
 */

test.describe('Chat Input Area - Detail Verification', () => {
  test('Capture input area with controls visible', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on Chat tab
    const chatButton = page.locator('button').filter({ hasText: 'Chat' });
    await chatButton.click();
    await page.waitForTimeout(2000);

    // Scroll to bottom to ensure input area is visible
    await page.evaluate(() => {
      const container = document.querySelector('ion-content');
      if (container) {
        container.scrollToBottom(0);
      }
    });
    await page.waitForTimeout(1000);

    // Take screenshot of full page
    await page.screenshot({
      path: 'chat-input-detail-full.png',
      fullPage: true
    });

    console.log('✅ Full page screenshot saved');

    // Try to find and screenshot the form specifically
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      await form.screenshot({
        path: 'chat-input-form.png'
      });
      console.log('✅ Form screenshot saved');
    }

    // Check for floating plus button
    const plusButtons = page.locator('button:has(ion-icon)');
    const count = await plusButtons.count();
    console.log(`Found ${count} buttons with icons`);

    // Take final viewport screenshot
    await page.screenshot({
      path: 'chat-final-verification.png',
      fullPage: false
    });

    console.log('✅ Final verification screenshot saved');
  });
});
