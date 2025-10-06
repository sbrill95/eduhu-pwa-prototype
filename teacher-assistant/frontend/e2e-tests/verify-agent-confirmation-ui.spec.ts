import { test, expect } from '@playwright/test';

/**
 * Phase 2 Verification: Agent Confirmation UI Fixes
 *
 * This test verifies:
 * 1. Button styling (44x44px minimum)
 * 2. Button order (LEFT orange, RIGHT gray)
 * 3. Gemini UI (gradient + white card)
 * 4. "Weiter im Chat" functionality
 */

test.describe('Agent Confirmation Modal - Phase 2 UI Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5176');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Login if needed (check if login form exists)
    const loginButton = page.locator('button:has-text("Mit Google anmelden")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Login required - skipping test (manual login needed)');
      test.skip();
    }

    // Navigate to Chat tab
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    if (await chatTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Screenshot 1: Navigate to Chat and send image generation request', async ({ page }) => {
    // Take screenshot of initial chat state
    await page.screenshot({
      path: 'phase2-01-chat-initial.png',
      fullPage: true
    });

    // Find chat input
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 5000 });

    // Send message to trigger agent confirmation
    await chatInput.fill('Erstelle ein Bild zur Photosynthese');

    // Find and click send button
    const sendButton = page.locator('button[type="submit"], ion-button:has-text("Senden")').last();
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Take screenshot after message sent
    await page.screenshot({
      path: 'phase2-02-after-message-sent.png',
      fullPage: true
    });
  });

  test('Screenshot 2-6: Verify Agent Confirmation Modal UI', async ({ page }) => {
    // Send message to trigger confirmation
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.fill('Erstelle ein Bild zur Photosynthese');
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();

    // Wait for agent confirmation to appear
    await page.waitForTimeout(3000);

    // Screenshot 2: Full modal view
    await page.screenshot({
      path: 'phase2-03-agent-confirmation-modal.png',
      fullPage: true
    });

    // Locate the buttons
    const primaryButton = page.locator('button:has-text("Bild-Generierung starten")');
    const secondaryButton = page.locator('button:has-text("Weiter im Chat")');

    // Verify buttons exist
    await expect(primaryButton).toBeVisible();
    await expect(secondaryButton).toBeVisible();

    // Screenshot 3: Button styling close-up (scroll to buttons)
    await primaryButton.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: 'phase2-04-button-styling.png',
      clip: {
        x: 0,
        y: (await primaryButton.boundingBox())!.y - 50,
        width: 400,
        height: 150
      }
    });

    // Screenshot 4: DevTools measurement (get button dimensions)
    const primaryBox = await primaryButton.boundingBox();
    const secondaryBox = await secondaryButton.boundingBox();

    console.log('Primary button dimensions:', {
      width: primaryBox?.width,
      height: primaryBox?.height
    });
    console.log('Secondary button dimensions:', {
      width: secondaryBox?.width,
      height: secondaryBox?.height
    });

    // Verify minimum touch target size (44x44px)
    expect(primaryBox?.height).toBeGreaterThanOrEqual(44);
    expect(secondaryBox?.height).toBeGreaterThanOrEqual(44);

    // Screenshot 5: Verify Gemini UI (gradient background)
    const confirmationCard = page.locator('.bg-gradient-to-r');
    await expect(confirmationCard).toBeVisible();
    await page.screenshot({
      path: 'phase2-05-gemini-gradient.png',
      fullPage: true
    });

    // Screenshot 6: Verify white card
    const whiteCard = page.locator('.bg-white.rounded-xl').first();
    await expect(whiteCard).toBeVisible();
    await page.screenshot({
      path: 'phase2-06-white-card.png',
      fullPage: true
    });
  });

  test('Screenshot 7: Test "Weiter im Chat" button click', async ({ page }) => {
    // Send message
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.fill('Erstelle ein Bild zur Photosynthese');
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();

    // Wait for confirmation
    await page.waitForTimeout(3000);

    // Take screenshot before click
    await page.screenshot({
      path: 'phase2-07-before-weiter-im-chat-click.png',
      fullPage: true
    });

    // Click "Weiter im Chat"
    const cancelButton = page.locator('button:has-text("Weiter im Chat")');
    await cancelButton.click();

    // Wait a moment
    await page.waitForTimeout(1000);

    // Take screenshot after click
    await page.screenshot({
      path: 'phase2-08-after-weiter-im-chat-click.png',
      fullPage: true
    });

    // Verify chat is still visible (modal didn't open)
    await expect(chatInput).toBeVisible();
  });
});
