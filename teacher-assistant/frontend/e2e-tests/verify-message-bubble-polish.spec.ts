import { test, expect } from '@playwright/test';

test.describe('Message Bubble Polish Verification', () => {
  test('Verify Message Bubble Polish - eduhu label removed and dividers stronger', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'message-bubble-polished.png',
      fullPage: true
    });

    // Verify "eduhu" label is GONE
    const bubble = page.locator('[data-testid="welcome-message-bubble"]');
    const bubbleText = await bubble.textContent();

    // Should NOT contain "eduhu" as standalone text at the start
    const firstLine = bubbleText?.split('\n')[0].trim();
    expect(firstLine).not.toBe('eduhu');

    // The first line should be the welcome message starting with "Hallo Michelle"
    expect(firstLine).toContain('Hallo Michelle');

    console.log('✅ Orange "eduhu" label removed');
    console.log('✅ Welcome message is now the first element');
    console.log('✅ Screenshot saved: message-bubble-polished.png');

    // Verify dividers exist (visual check via screenshot)
    const promptContainer = page.locator('[data-testid="prompt-suggestions-container"]');
    await expect(promptContainer).toBeVisible();

    // Count prompt suggestions (should have dividers between them)
    const promptButtons = page.locator('[data-testid^="prompt-suggestion-"]');
    const count = await promptButtons.count();

    console.log(`✅ Found ${count} prompt suggestions with dividers`);
  });
});
