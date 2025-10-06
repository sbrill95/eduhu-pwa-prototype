import { test, expect } from '@playwright/test';

test('Gemini Form Redesign Screenshot', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for app to load
  await page.waitForLoadState('networkidle');

  // Check if we're logged in or need to skip auth
  const isLoggedIn = await page.locator('[data-testid="chat-input"]').isVisible({ timeout: 2000 }).catch(() => false);

  if (!isLoggedIn) {
    console.log('Not logged in - attempting to access home directly');
    // Try to navigate to home
    await page.goto('http://localhost:5173/#/home');
    await page.waitForTimeout(1000);
  }

  // Now try to trigger the agent form
  // Method 1: Try clicking a prompt tile if available
  const promptTile = page.locator('[data-testid="prompt-tile"]').first();
  const hasPromptTile = await promptTile.isVisible({ timeout: 2000 }).catch(() => false);

  if (hasPromptTile) {
    console.log('Clicking prompt tile to open form...');
    await promptTile.click();
  } else {
    // Method 2: Use browser console to trigger modal directly
    console.log('Manually triggering agent modal via console...');
    await page.evaluate(() => {
      // Simulate the openModal call
      const event = new CustomEvent('open-agent-modal', {
        detail: {
          agentType: 'image-generation',
          prefillData: { theme: 'Satz des Pythagoras' }
        }
      });
      window.dispatchEvent(event);
    });
  }

  // Wait for modal to appear
  await page.waitForTimeout(1000);

  // Take screenshot of the full form
  await page.screenshot({
    path: 'gemini-form-redesign.png',
    fullPage: true
  });

  console.log('Screenshot saved: gemini-form-redesign.png');
});
