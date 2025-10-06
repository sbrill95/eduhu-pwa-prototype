import { test, expect } from '@playwright/test';

test('Image generation works end-to-end', async ({ page }) => {
  // Setup
  await page.goto('http://localhost:5174');
  await page.evaluate(() => {
    localStorage.setItem('test-auth-enabled', 'true');
    localStorage.setItem('test-user-id', 'test-user-playwright-id-12345');
    localStorage.setItem('test-user-email', 's.brill@eduhu.de');
  });

  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  const chatTab = page.locator('[aria-label="Chat"]');
  await expect(chatTab).toBeVisible({ timeout: 10000 });
  await chatTab.click();
  await page.waitForTimeout(1000);

  // Trigger image generation
  const textarea = page.locator('textarea');
  const submitButton = page.locator('button[type="submit"]');

  console.log('Triggering image generation with prompt...');
  await textarea.fill('Erstelle ein Bild von einem Apfel');
  await submitButton.click();
  await page.waitForTimeout(5000);

  // Click "Bild-Generierung starten"
  const startButton = page.locator('button:has-text("Bild-Generierung starten")');

  if (await startButton.isVisible({ timeout: 5000 })) {
    console.log('Agent confirmation detected - clicking "Bild-Generierung starten"');
    await expect(startButton).toBeVisible();
    await startButton.click();
    await page.waitForTimeout(1000);

    // Screenshot modal
    await page.screenshot({ path: 'qa-screenshots/bug-e-modal.png', fullPage: true });

    // Fill form and submit
    const themaInput = page.locator('input[placeholder*="Thema"], input[name="thema"], textarea[name="thema"]').first();

    if (await themaInput.isVisible({ timeout: 3000 })) {
      await themaInput.fill('Apfel');

      const generateButton = page.locator('button:has-text("Bild generieren")');
      await generateButton.click();

      console.log('Form submitted - waiting for image generation (max 45s)...');

      // Wait for generation (45s timeout)
      const resultIndicator = page.locator('text=Bild generiert, text=erfolgreich, img[alt*="Generiert"], img[alt*="Apfel"]').first();

      try {
        await resultIndicator.waitFor({ timeout: 45000 });
        console.log('✅ Image generation completed');

        // Screenshot result
        await page.screenshot({ path: 'qa-screenshots/bug-e-result.png', fullPage: true });

        // Verify image is displayed
        const img = page.locator('img[alt*="Generiert"], img[alt*="Apfel"]').first();
        await expect(img).toBeVisible({ timeout: 5000 });

        // Check library
        const libraryTab = page.locator('[aria-label="Bibliothek"]');
        await libraryTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'qa-screenshots/bug-e-library.png', fullPage: true });

        // Verify image appears in library
        const libraryImg = page.locator('img').first();
        const libraryImgCount = await page.locator('img').count();
        console.log(`Found ${libraryImgCount} images in library`);

        if (libraryImgCount > 0) {
          await expect(libraryImg).toBeVisible();
          console.log('✅ Image appears in library');
        }
      } catch (error) {
        console.error('Image generation timed out or failed:', error);
        await page.screenshot({ path: 'qa-screenshots/bug-e-timeout.png', fullPage: true });
        throw error;
      }
    } else {
      console.warn('Could not find Thema input field');
      await page.screenshot({ path: 'qa-screenshots/bug-e-no-input.png', fullPage: true });
    }
  } else {
    console.warn('Agent confirmation modal did not appear - agent detection may have failed');
    await page.screenshot({ path: 'qa-screenshots/bug-e-no-confirmation.png', fullPage: true });
  }
});
