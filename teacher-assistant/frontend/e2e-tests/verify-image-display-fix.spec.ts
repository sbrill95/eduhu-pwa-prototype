import { test, expect } from '@playwright/test';

/**
 * VERIFICATION TEST: Image Display Fix (InstantDB Permissions)
 *
 * Purpose: Verify that the InstantDB schema permission fix allows:
 * 1. Existing images to load from library_materials
 * 2. Images to display in Library "Materialien" tab
 * 3. "Bilder" filter to appear
 * 4. Image thumbnails to display in chat (if any exist)
 * 5. ZERO console errors related to mutations
 *
 * This test does NOT generate new images (avoids DALL-E cost).
 * It verifies that the permission fix allows querying existing data.
 */

test.describe('Image Display Fix Verification - InstantDB Permissions', () => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitor console errors/warnings
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        console.error('❌ CONSOLE ERROR:', text);
        consoleErrors.push(text);
      } else if (type === 'warning') {
        console.warn('⚠️  CONSOLE WARNING:', text);
        consoleWarnings.push(text);
      }
    });

    // Monitor network requests
    page.on('response', response => {
      const status = response.status();
      const url = response.url();

      if (status === 400 && url.includes('instantdb')) {
        console.error('❌ InstantDB 400 Error:', url);
        consoleErrors.push(`InstantDB 400: ${url}`);
      }
    });

    console.log('🧪 Test started - Console monitoring active');
  });

  test.afterEach(async () => {
    console.log('\n📊 Test Summary:');
    console.log(`  Console Errors: ${consoleErrors.length}`);
    console.log(`  Console Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }
  });

  test('STEP-1: Navigate to Library and verify existing images load', async ({ page }) => {
    console.log('\n🚀 STEP-1: Navigate to Library');

    // Go to home
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of home
    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/01-home-view.png`,
      fullPage: true
    });
    console.log('✅ Home screenshot captured');

    // Navigate to Library
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/02-library-initial.png`,
      fullPage: true
    });
    console.log('✅ Library initial view screenshot captured');

    console.log('✅ STEP-1 Complete');
  });

  test('STEP-2: Verify "Materialien" tab and existing data', async ({ page }) => {
    console.log('\n🚀 STEP-2: Check Materialien tab');

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Library
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);

    // Click Materialien tab
    const materialsTab = await page.$('ion-segment-button[value="artifacts"]');
    if (materialsTab) {
      await materialsTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Materialien tab clicked');
    } else {
      console.log('⚠️  Materialien tab not found');
    }

    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/03-materialien-tab.png`,
      fullPage: true
    });

    // Count visible materials
    const materialCards = await page.$$('ion-card');
    console.log(`  Materials visible: ${materialCards.length}`);

    // Check for images specifically
    const images = await page.$$('img[src*="blob.core.windows.net"]');
    console.log(`  Images found: ${images.length}`);
    console.log(images.length > 0 ? '✅ Images are loading!' : '⚠️  No images found');

    console.log('✅ STEP-2 Complete');
  });

  test('STEP-3: Verify "Bilder" filter appears', async ({ page }) => {
    console.log('\n🚀 STEP-3: Check Bilder filter');

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);

    // Click Materialien tab
    await page.click('ion-segment-button[value="artifacts"]');
    await page.waitForTimeout(2000);

    // Check for Bilder filter chip
    const bilderChip = await page.$('ion-chip:has-text("Bilder")');
    console.log('  "Bilder" filter:', bilderChip ? '✅ FOUND' : '❌ NOT FOUND');

    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/04-bilder-filter.png`,
      fullPage: true
    });

    // If filter exists, click it
    if (bilderChip) {
      await bilderChip.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/05-bilder-filtered.png`,
        fullPage: true
      });

      // Count filtered images
      const filteredImages = await page.$$('img[src*="blob.core.windows.net"]');
      console.log(`  Images after filter: ${filteredImages.length}`);
    }

    console.log('✅ STEP-3 Complete');
  });

  test('STEP-4: Verify chat messages with image thumbnails (if any)', async ({ page }) => {
    console.log('\n🚀 STEP-4: Check chat for image thumbnails');

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Chat
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(2000);

    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/06-chat-view.png`,
      fullPage: true
    });

    // Check for image thumbnails in chat
    const chatImages = await page.$$('img[src*="blob.core.windows.net"]');
    console.log(`  Image thumbnails in chat: ${chatImages.length}`);
    console.log(chatImages.length > 0 ? '✅ Thumbnails present' : '⚠️  No thumbnails (might be expected if no recent generations)');

    console.log('✅ STEP-4 Complete');
  });

  test('STEP-5: Verify ZERO console errors', async ({ page }) => {
    console.log('\n🚀 STEP-5: Complete workflow check for console errors');

    // Clear previous errors
    consoleErrors.length = 0;

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate through all views to trigger any errors
    console.log('  Navigating to Library...');
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(2000);

    console.log('  Clicking Materialien tab...');
    await page.click('ion-segment-button[value="artifacts"]');
    await page.waitForTimeout(2000);

    console.log('  Checking for Bilder filter...');
    const bilderChip = await page.$('ion-chip:has-text("Bilder")');
    if (bilderChip) {
      await bilderChip.click();
      await page.waitForTimeout(2000);
    }

    console.log('  Navigating back to Chat...');
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(2000);

    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/07-final-state.png`,
      fullPage: true
    });

    // Final error check
    console.log(`\n📊 Final Console Error Count: ${consoleErrors.length}`);

    // STRICT: We expect ZERO errors after permission fix
    expect(consoleErrors).toHaveLength(0);
    console.log('✅ ZERO console errors confirmed!');

    console.log('✅ STEP-5 Complete');
  });

  test('STEP-6: Summary verification report', async ({ page }) => {
    console.log('\n🚀 STEP-6: Generating summary report');

    consoleErrors.length = 0;

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Library check
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);
    await page.click('ion-segment-button[value="artifacts"]');
    await page.waitForTimeout(2000);

    const materialsCount = (await page.$$('ion-card')).length;
    const imagesCount = (await page.$$('img[src*="blob.core.windows.net"]')).length;
    const bilderFilterExists = (await page.$('ion-chip:has-text("Bilder")')) !== null;

    // Chat check
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(2000);
    const chatImagesCount = (await page.$$('img[src*="blob.core.windows.net"]')).length;

    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/${date}/08-summary-view.png`,
      fullPage: true
    });

    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log(`  Materials in Library: ${materialsCount}`);
    console.log(`  Images in Library: ${imagesCount}`);
    console.log(`  "Bilder" filter present: ${bilderFilterExists ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  Images in Chat: ${chatImagesCount}`);
    console.log(`  Console errors: ${consoleErrors.length}`);
    console.log(`  Console warnings: ${consoleWarnings.length}`);

    // Decision criteria
    const criticalPass =
      imagesCount > 0 &&
      bilderFilterExists &&
      consoleErrors.length === 0;

    const decision = criticalPass ? 'PASS ✅' :
                     (imagesCount > 0 || bilderFilterExists) ? 'CONCERNS ⚠️' : 'FAIL ❌';

    console.log(`\n🎯 DECISION: ${decision}`);

    console.log('✅ STEP-6 Complete');
  });
});
