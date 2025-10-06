import { test, expect } from '@playwright/test';

test.describe('Image Generation - Current State Documentation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('1. Capture Agent Confirmation Modal (Touch Target Check)', async ({ page }) => {
    // Type message to trigger agent detection
    const input = page.locator('textarea[placeholder*="Nachricht"]');
    await input.fill('Erstelle ein Bild von einem Löwen für Klasse 7');

    // Submit
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for agent confirmation to appear
    await page.waitForTimeout(2000);

    // Capture screenshot
    await page.screenshot({
      path: 'agent-confirmation-current-state.png',
      fullPage: false
    });

    console.log('✅ Agent Confirmation screenshot saved');
  });

  test('2. Capture Agent Form Modal (Button Layout)', async ({ page }) => {
    // Trigger agent
    const input = page.locator('textarea[placeholder*="Nachricht"]');
    await input.fill('Erstelle ein Bild zur Photosynthese');
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Click "Ja" to open form
    const yesButton = page.locator('button:has-text("Ja")').first();
    if (await yesButton.isVisible()) {
      await yesButton.click();
      await page.waitForTimeout(1000);

      // Capture form modal
      await page.screenshot({
        path: 'agent-form-current-state.png',
        fullPage: false
      });

      console.log('✅ Agent Form screenshot saved');
    }
  });

  test('3. Capture Progress View (Double Animation Check)', async ({ page }) => {
    // Note: This will start actual generation, so we capture quickly
    const input = page.locator('textarea[placeholder*="Nachricht"]');
    await input.fill('ein Baum');
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Click Ja
    const yesButton = page.locator('button:has-text("Ja")').first();
    if (await yesButton.isVisible()) {
      await yesButton.click();
      await page.waitForTimeout(1000);

      // Click "Bild generieren" (or similar)
      const generateButton = page.locator('button:has-text("generieren")').first();
      if (await generateButton.isVisible()) {
        await generateButton.click();

        // Wait a bit for progress view
        await page.waitForTimeout(3000);

        // Capture progress screen
        await page.screenshot({
          path: 'agent-progress-current-state.png',
          fullPage: false
        });

        console.log('✅ Progress View screenshot saved');
      }
    }
  });

  test('4. Measure Touch Target Sizes', async ({ page }) => {
    // Trigger agent
    const input = page.locator('textarea[placeholder*="Nachricht"]');
    await input.fill('Erstelle ein Bild');
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Measure button sizes
    const buttons = page.locator('button:has-text("Ja"), button:has-text("Nein"), button:has-text("Chat")');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        const text = await button.textContent();

        console.log(`Button "${text}": ${box?.width}px × ${box?.height}px`);

        // Check against minimum touch target (44x44px iOS, 48x48px Android)
        if (box && (box.width < 44 || box.height < 44)) {
          console.log(`⚠️  PROBLEM: "${text}" is TOO SMALL for touch (< 44x44px)`);
        }
      }
    }
  });

  test('5. Check Library Current State', async ({ page }) => {
    // Navigate to Library
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();
    await page.waitForTimeout(1000);

    // Capture library
    await page.screenshot({
      path: 'library-current-state.png',
      fullPage: true
    });

    console.log('✅ Library screenshot saved');
  });
});
