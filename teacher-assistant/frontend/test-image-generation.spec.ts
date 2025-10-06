import { test, expect } from '@playwright/test';

test('Image Generation End-to-End Test', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });

  // Navigate to app
  console.log('1. Navigating to app...');
  await page.goto('http://localhost:5178');
  await page.waitForTimeout(2000);

  // Go to Chat tab
  console.log('2. Clicking Chat tab...');
  await page.click('ion-tab-button[tab="chat"]');
  await page.waitForTimeout(1000);

  // Type image generation request
  console.log('3. Typing message...');
  const input = page.locator('textarea, input[type="text"]').last();
  await input.fill('Erstelle ein Bild von einem Baum');
  await page.waitForTimeout(500);

  // Send message
  console.log('4. Sending message...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  // Wait for agent confirmation modal
  console.log('5. Waiting for agent confirmation modal...');
  const confirmButton = page.locator('button:has-text("Ja")');
  await confirmButton.waitFor({ timeout: 5000 });

  console.log('6. Clicking confirmation...');
  await confirmButton.click();
  await page.waitForTimeout(1000);

  // Wait for agent form modal
  console.log('7. Waiting for agent form...');
  const descriptionInput = page.locator('textarea[placeholder*="Beschreibe"]').first();
  await descriptionInput.waitFor({ timeout: 5000 });

  console.log('8. Filling form...');
  await descriptionInput.fill('Ein schöner großer Baum mit grünen Blättern');
  await page.waitForTimeout(500);

  // Submit form
  console.log('9. Submitting form (clicking "Bild generieren")...');
  const generateButton = page.locator('button:has-text("Bild generieren")');
  await generateButton.click();

  // Wait for progress view
  console.log('10. Waiting for progress view...');
  await page.waitForSelector('text=/In Bearbeitung|wird erstellt/i', { timeout: 5000 });

  console.log('11. Progress view appeared. Waiting for result (max 60 seconds)...');

  // Wait for EITHER result view OR check console logs
  const startTime = Date.now();
  let foundResult = false;

  while (Date.now() - startTime < 60000) {
    // Check if result view appeared
    const resultImage = page.locator('img[src*="blob.core.windows.net"]').first();
    const isVisible = await resultImage.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✅ SUCCESS: Result image found!');
      foundResult = true;

      // Take screenshot
      await page.screenshot({ path: 'image-generation-success.png', fullPage: true });
      console.log('Screenshot saved: image-generation-success.png');
      break;
    }

    // Check if still in progress view
    const progressView = page.locator('text=/In Bearbeitung|wird erstellt/i').first();
    const stillInProgress = await progressView.isVisible().catch(() => false);

    if (stillInProgress) {
      console.log(`Still in progress view... (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
    }

    await page.waitForTimeout(2000);
  }

  if (!foundResult) {
    console.log('❌ FAILED: No result after 60 seconds');

    // Take screenshot of stuck state
    await page.screenshot({ path: 'image-generation-stuck.png', fullPage: true });
    console.log('Screenshot saved: image-generation-stuck.png');

    // Get page state
    const currentPhase = await page.evaluate(() => {
      return {
        url: window.location.href,
        html: document.body.innerHTML.substring(0, 500)
      };
    });
    console.log('Current page state:', currentPhase);
  }

  expect(foundResult).toBe(true);
});
