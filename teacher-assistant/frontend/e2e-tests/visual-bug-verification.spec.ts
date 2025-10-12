/**
 * Visual Bug Verification Test Suite
 * Date: 2025-10-12
 * Purpose: Capture screenshots of reported critical UI bugs
 *
 * Reported Issues:
 * 1. Agent confirmation button NOT VISIBLE (design/contrast problem)
 * 2. Library modal doesn't show images - only displaced buttons
 * 3. Modal functionality broken despite E2E tests passing
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = '../../../docs/testing/screenshots/2025-10-12/bugs';

test.describe('Critical Visual Bug Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto(FRONTEND_URL);

    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('BUG-001: Agent Confirmation Button Visibility', async ({ page }) => {
    console.log('🔍 Testing Bug 001: Agent confirmation button visibility');

    // Navigate to Chat tab
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    // Take screenshot of initial chat state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-001a-chat-initial.png`,
      fullPage: true
    });

    // Find textarea and send message
    const textarea = page.locator('ion-textarea[placeholder*="Nachricht"], ion-textarea').first();
    await textarea.click();
    await textarea.fill('Erstelle ein Bild von einem Löwen');

    // Take screenshot with message typed
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-001b-message-typed.png`,
      fullPage: true
    });

    // Find and click send button
    const sendButton = page.locator('ion-button:has-text("Senden"), button:has-text("Senden")').first();
    await sendButton.click();

    console.log('⏳ Waiting for agent confirmation to appear...');

    // Wait for agent confirmation card to appear (up to 15 seconds)
    try {
      await page.waitForSelector('.agent-confirmation-card, [class*="confirmation"]', {
        timeout: 15000,
        state: 'visible'
      });

      await page.waitForTimeout(2000); // Let animations settle

      // Take screenshot of confirmation card
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/bug-001c-agent-confirmation-appeared.png`,
        fullPage: true
      });

      // Focus on the confirmation card area
      const confirmationCard = page.locator('.agent-confirmation-card, [class*="confirmation"]').first();
      if (await confirmationCard.isVisible()) {
        await confirmationCard.screenshot({
          path: `${SCREENSHOT_DIR}/bug-001d-confirmation-card-zoomed.png`
        });
      }

      // Check for button visibility
      const confirmButton = page.locator('ion-button:has-text("Bestätigen"), button:has-text("Bestätigen")');
      const isButtonVisible = await confirmButton.isVisible();

      console.log(`✅ Confirmation button visible: ${isButtonVisible}`);

      // Get button styles for analysis
      if (isButtonVisible) {
        const buttonHandle = await confirmButton.elementHandle();
        if (buttonHandle) {
          const styles = await buttonHandle.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              display: computed.display,
              visibility: computed.visibility,
              opacity: computed.opacity,
              position: computed.position,
              zIndex: computed.zIndex
            };
          });
          console.log('🎨 Button styles:', JSON.stringify(styles, null, 2));
        }
      }

    } catch (error) {
      console.error('❌ Agent confirmation did not appear:', error);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/bug-001e-confirmation-timeout.png`,
        fullPage: true
      });
    }

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(`${msg.type()}: ${msg.text()}`));

    // Take final screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-001f-final-state.png`,
      fullPage: true
    });
  });

  test('BUG-002: Library Modal - Image Not Showing', async ({ page }) => {
    console.log('🔍 Testing Bug 002: Library modal image display');

    // Navigate to Library tab
    await page.click('ion-tab-button[tab="library"]');
    await page.waitForTimeout(1000);

    // Click on Materialien segment if exists
    const materialienButton = page.locator('ion-segment-button[value="materialien"]');
    if (await materialienButton.isVisible()) {
      await materialienButton.click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot of library grid
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-002a-library-grid.png`,
      fullPage: true
    });

    // Find first image thumbnail
    const thumbnails = page.locator('ion-img, img[class*="thumbnail"], [class*="library-item"] img');
    const thumbnailCount = await thumbnails.count();

    console.log(`📸 Found ${thumbnailCount} thumbnails in library`);

    if (thumbnailCount > 0) {
      // Click on first thumbnail
      const firstThumbnail = thumbnails.first();

      // Take screenshot before clicking
      await firstThumbnail.screenshot({
        path: `${SCREENSHOT_DIR}/bug-002b-thumbnail-before-click.png`
      });

      await firstThumbnail.click();
      await page.waitForTimeout(1500); // Wait for modal animation

      // Take screenshot after clicking
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/bug-002c-modal-opened.png`,
        fullPage: true
      });

      // Check if modal is visible
      const modal = page.locator('ion-modal[is-open="true"], .modal-open, [role="dialog"]');
      const isModalOpen = await modal.isVisible();

      console.log(`🪟 Modal open: ${isModalOpen}`);

      if (isModalOpen) {
        // Take zoomed screenshot of modal content
        await modal.screenshot({
          path: `${SCREENSHOT_DIR}/bug-002d-modal-content-zoomed.png`
        });

        // Check for image in modal
        const modalImage = modal.locator('img, ion-img');
        const modalImageCount = await modalImage.count();
        console.log(`🖼️ Images in modal: ${modalImageCount}`);

        // Check for buttons
        const modalButtons = modal.locator('ion-button, button');
        const buttonCount = await modalButtons.count();
        console.log(`🔘 Buttons in modal: ${buttonCount}`);

        // Get button texts
        for (let i = 0; i < buttonCount; i++) {
          const buttonText = await modalButtons.nth(i).textContent();
          console.log(`  Button ${i + 1}: "${buttonText}"`);
        }

        // Analyze modal structure
        const modalHTML = await modal.evaluate((el) => el.innerHTML);
        console.log('📋 Modal HTML structure available for analysis');

        // Check for CSS issues
        const modalStyles = await modal.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            zIndex: computed.zIndex,
            position: computed.position
          };
        });
        console.log('🎨 Modal styles:', JSON.stringify(modalStyles, null, 2));

      } else {
        console.error('❌ Modal did not open after clicking thumbnail');
      }

    } else {
      console.log('⚠️ No library items found to test modal');

      // Take screenshot showing empty library
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/bug-002e-no-library-items.png`,
        fullPage: true
      });
    }

    // Final screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-002f-final-state.png`,
      fullPage: true
    });
  });

  test('BUG-003: Complete User Flow with Visual Verification', async ({ page }) => {
    console.log('🔍 Testing Bug 003: Complete flow from chat to library modal');

    // Step 1: Chat interaction
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-003-step1-chat.png`,
      fullPage: true
    });

    // Send message
    const textarea = page.locator('ion-textarea[placeholder*="Nachricht"], ion-textarea').first();
    await textarea.click();
    await textarea.fill('Erstelle ein Bild von einem Tiger');

    const sendButton = page.locator('ion-button:has-text("Senden"), button:has-text("Senden")').first();
    await sendButton.click();

    // Wait and screenshot confirmation if it appears
    try {
      await page.waitForSelector('.agent-confirmation-card, [class*="confirmation"]', {
        timeout: 10000,
        state: 'visible'
      });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/bug-003-step2-confirmation.png`,
        fullPage: true
      });

      // Try to click confirmation button
      const confirmButton = page.locator('ion-button:has-text("Bestätigen"), button:has-text("Bestätigen")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/bug-003-step3-after-confirm.png`,
          fullPage: true
        });
      }

    } catch (error) {
      console.log('⚠️ No confirmation appeared in flow test');
    }

    // Step 2: Check library
    await page.waitForTimeout(3000); // Give time for image generation
    await page.click('ion-tab-button[tab="library"]');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-003-step4-library.png`,
      fullPage: true
    });

    // Step 3: Try to open modal
    const thumbnails = page.locator('ion-img, img[class*="thumbnail"]');
    const thumbnailCount = await thumbnails.count();

    if (thumbnailCount > 0) {
      await thumbnails.first().click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/bug-003-step5-modal-attempt.png`,
        fullPage: true
      });
    }

    // Final comprehensive screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-003-step6-final.png`,
      fullPage: true
    });
  });

  test('BUG-004: CSS and Layout Analysis', async ({ page }) => {
    console.log('🔍 Testing Bug 004: CSS and layout issues');

    // Go to library
    await page.click('ion-tab-button[tab="library"]');
    await page.waitForTimeout(1000);

    // Take desktop viewport screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-004a-desktop-viewport.png`,
      fullPage: true
    });

    // Take tablet viewport screenshot
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-004b-tablet-viewport.png`,
      fullPage: true
    });

    // Take mobile viewport screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-004c-mobile-viewport.png`,
      fullPage: true
    });

    // Check for any console errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('🔴 Page error:', error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🔴 Console error:', msg.text());
      }
    });

    // Wait to collect errors
    await page.waitForTimeout(3000);

    console.log(`📊 Total console errors: ${errors.length}`);
  });
});
