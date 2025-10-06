import { test, expect } from '@playwright/test';

/**
 * Visual Verification Test for Image Generation Issues
 *
 * Tests:
 * 1. Image appears in chat history after generation
 * 2. Image appears in Library under "Bilder"
 * 3. Library filter tabs are correct size
 */

test.describe('Image Generation - Issue Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for app to be ready
    await page.waitForTimeout(2000);
  });

  test('ISSUE-1: Verify Library filter tabs size', async ({ page }) => {
    console.log('[Test] Navigating to Library...');

    // Click Library tab
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);

    // Take screenshot of Library view
    await page.screenshot({
      path: 'library-filter-tabs-check.png',
      fullPage: false
    });

    console.log('[Test] ✅ Screenshot saved: library-filter-tabs-check.png');

    // Check if filter tabs exist
    const filterButtons = await page.$$('[role="button"]');
    console.log(`[Test] Found ${filterButtons.length} buttons in Library`);

    // Look for "Bilder" filter
    const bilderButton = await page.$('button:has-text("Bilder")');
    if (bilderButton) {
      const box = await bilderButton.boundingBox();
      console.log(`[Test] "Bilder" button size:`, box);
    } else {
      console.log('[Test] ⚠️ "Bilder" button NOT FOUND');
    }
  });

  test('ISSUE-2 & ISSUE-3: Generate image and verify chat + library', async ({ page }) => {
    console.log('[Test] Step 1: Navigate to Chat');

    // Click Chat tab
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);

    // Take screenshot of Chat initial state
    await page.screenshot({
      path: 'chat-before-image-gen.png',
      fullPage: false
    });

    console.log('[Test] Step 2: Trigger image generation');

    // Type message to trigger agent
    const input = await page.$('textarea, input[type="text"]');
    if (input) {
      await input.fill('Erstelle ein Bild von einem Löwen');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Take screenshot of agent suggestion
      await page.screenshot({
        path: 'agent-confirmation-message.png',
        fullPage: false
      });

      // Check if agent confirmation appears
      const confirmButton = await page.$('button:has-text("Bild erstellen")');
      if (confirmButton) {
        console.log('[Test] ✅ Agent confirmation found');

        // Click to start generation
        await confirmButton.click();
        await page.waitForTimeout(1000);

        // Take screenshot of form
        await page.screenshot({
          path: 'agent-form-view.png',
          fullPage: false
        });

        console.log('[Test] Step 3: Wait for form and submit');

        // Check if form opened
        const submitButton = await page.$('button:has-text("Bild generieren")');
        if (submitButton) {
          console.log('[Test] ✅ Form opened');

          // Fill description if empty
          const textarea = await page.$('textarea#description-input');
          if (textarea) {
            const value = await textarea.inputValue();
            if (!value || value.length < 3) {
              await textarea.fill('Ein Löwe in der Savanne');
            }
          }

          // Submit form
          await submitButton.click();
          console.log('[Test] ⏳ Waiting for image generation (max 60s)...');

          // Wait for progress or result
          await page.waitForTimeout(5000);

          // Take screenshot during generation
          await page.screenshot({
            path: 'generation-progress.png',
            fullPage: false
          });

          // Wait longer for result
          await page.waitForTimeout(25000);

          // Take screenshot of result
          await page.screenshot({
            path: 'generation-result.png',
            fullPage: false
          });

          console.log('[Test] Step 4: Check if image appears in chat');

          // Look for "Weiter im Chat" or close button
          const continueButton = await page.$('button:has-text("Weiter im Chat")');
          if (continueButton) {
            await continueButton.click();
            await page.waitForTimeout(2000);
          }

          // Take screenshot of chat after generation
          await page.screenshot({
            path: 'chat-after-image-gen.png',
            fullPage: true
          });

          // Check if image appears in chat history
          const chatImages = await page.$$('img[alt*="Uploaded"], img[alt*="Bild"]');
          console.log(`[Test] Found ${chatImages.length} images in chat`);

          if (chatImages.length === 0) {
            console.log('[Test] ❌ ISSUE-2 CONFIRMED: Image NOT in chat history');
          } else {
            console.log('[Test] ✅ Image found in chat');
          }

          console.log('[Test] Step 5: Check Library for image');

          // Navigate to Library
          await page.click('button:has-text("Library")');
          await page.waitForTimeout(2000);

          // Take screenshot of Library
          await page.screenshot({
            path: 'library-after-image-gen.png',
            fullPage: true
          });

          // Click "Bilder" filter if exists
          const bilderFilter = await page.$('button:has-text("Bilder")');
          if (bilderFilter) {
            await bilderFilter.click();
            await page.waitForTimeout(1000);

            await page.screenshot({
              path: 'library-bilder-filter.png',
              fullPage: true
            });
          }

          // Check for images in library
          const libraryImages = await page.$$('img');
          console.log(`[Test] Found ${libraryImages.length} images in Library`);

          if (libraryImages.length === 0) {
            console.log('[Test] ❌ ISSUE-3 CONFIRMED: Image NOT in Library');
          } else {
            console.log('[Test] ✅ Image found in Library');
          }
        } else {
          console.log('[Test] ❌ Form did NOT open');
        }
      } else {
        console.log('[Test] ❌ Agent confirmation did NOT appear');
      }
    } else {
      console.log('[Test] ❌ Chat input NOT FOUND');
    }
  });
});
