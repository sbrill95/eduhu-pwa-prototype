/**
 * Visual Verification - Current Implementation vs Gemini Prototype
 *
 * This test takes screenshots of the current implementation to compare
 * with the Gemini prototype screenshots.
 */

import { test } from '@playwright/test';

test.describe('Current Implementation Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Screenshot 1: Home View - Current', async ({ page }) => {
    // Navigate to home
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(1000);

    // Full page screenshot
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-home-full.png',
      fullPage: true
    });

    // Viewport screenshot
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-home-viewport.png',
      fullPage: false
    });
  });

  test('Screenshot 2: Chat View - Current', async ({ page }) => {
    // Navigate to chat
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    // Full page screenshot
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-chat-full.png',
      fullPage: true
    });

    // Viewport screenshot
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-chat-viewport.png',
      fullPage: false
    });

    // Zoom into chat input area
    const chatInput = page.locator('textarea[placeholder*="Nachricht"]');
    if (await chatInput.count() > 0) {
      await chatInput.screenshot({
        path: 'e2e-tests/screenshots/current-chat-input-detail.png'
      });
    }
  });

  test('Screenshot 3: Library View - Current', async ({ page }) => {
    // Navigate to library
    await page.click('ion-tab-button[tab="library"]');
    await page.waitForTimeout(1000);

    // Full page screenshot
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-library-full.png',
      fullPage: true
    });

    // Viewport screenshot
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-library-viewport.png',
      fullPage: false
    });
  });

  test('Screenshot 4: Try to trigger Agent Modal', async ({ page }) => {
    // Navigate to chat
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    // Take screenshot before message
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-chat-before-message.png',
      fullPage: true
    });

    // Type message that should trigger agent
    const chatInput = page.locator('textarea[placeholder*="Nachricht"]');
    await chatInput.fill('Ich brauche ein Bild zur Photosynthese für Klasse 7');

    // Screenshot with typed message
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-chat-message-typed.png',
      fullPage: true
    });

    // Send message
    const sendButton = page.locator('ion-button:has(ion-icon)').last();
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Screenshot after message sent
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-chat-after-send.png',
      fullPage: true
    });

    // Check if modal appeared
    const modal = page.locator('ion-modal');
    const modalCount = await modal.count();

    if (modalCount > 0) {
      await page.screenshot({
        path: 'e2e-tests/screenshots/current-modal-appeared.png',
        fullPage: true
      });
    } else {
      console.log('❌ No modal appeared - this is the problem!');
    }

    // Check if confirmation message appeared
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    const confirmCount = await confirmButton.count();

    if (confirmCount > 0) {
      await page.screenshot({
        path: 'e2e-tests/screenshots/current-confirmation-message.png',
        fullPage: true
      });
    } else {
      console.log('❌ No confirmation message appeared');
    }
  });

  test('Screenshot 5: Mobile Viewport - Current', async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Home
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-mobile-home.png',
      fullPage: true
    });

    // Chat
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-mobile-chat.png',
      fullPage: true
    });

    // Library
    await page.click('ion-tab-button[tab="library"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-mobile-library.png',
      fullPage: true
    });
  });

  test('Screenshot 6: Check for existing modals', async ({ page }) => {
    // Navigate to chat
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    // Check what modals exist in the DOM
    const allModals = await page.locator('ion-modal').count();
    console.log(`Total modals in DOM: ${allModals}`);

    // Check for agent-related components
    const agentConfirmation = await page.locator('[class*="agent"]').count();
    console.log(`Agent-related elements: ${agentConfirmation}`);

    // Take screenshot of entire page structure
    await page.screenshot({
      path: 'e2e-tests/screenshots/current-dom-structure.png',
      fullPage: true
    });
  });
});
