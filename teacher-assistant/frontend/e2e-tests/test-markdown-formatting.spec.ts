import { test, expect } from '@playwright/test';

test.describe('Markdown Formatting in Chat', () => {
  test('should render markdown formatting correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5178');

    // Wait for the app to load
    await page.waitForTimeout(2000);

    // Find the chat input
    const chatInput = page.locator('ion-input');

    // Send a message that will trigger markdown response
    await chatInput.fill('Erkläre mir die Photosynthese mit Formatierung');

    // Click send button
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(8000);

    // Take screenshot to verify markdown rendering
    await page.screenshot({
      path: 'teacher-assistant/frontend/markdown-test-full.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: markdown-test-full.png');
  });
});
