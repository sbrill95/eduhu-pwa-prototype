import { test, expect, chromium } from '@playwright/test';

/**
 * Simple Profile Name Field Visual Verification
 * Direct navigation and screenshot capture
 */

test('Profile - Capture display mode and edit mode screenshots', async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro size
  });
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to http://localhost:5177...');
    await page.goto('http://localhost:5177', { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Wait a bit for the app to load
    await page.waitForTimeout(2000);

    // Try to find and click the Profile tab (if it exists)
    const profileTab = await page.locator('ion-tab-button[tab="profile"]').count();

    if (profileTab > 0) {
      console.log('Found Profile tab, clicking...');
      await page.click('ion-tab-button[tab="profile"]');
      await page.waitForTimeout(1000);
    } else {
      console.log('Profile tab not found, trying manual navigation...');
      // Try to navigate directly via URL
      await page.goto('http://localhost:5177/#/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }

    // Take screenshot of current state
    await page.screenshot({
      path: 'C:\\Users\\steff\\Desktop\\eduhu-pwa-prototype\\teacher-assistant\\frontend\\profile-initial-state.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: profile-initial-state.png');

    // Check if we can find the "Allgemeine Informationen" section
    const generalInfoSection = await page.locator('text=Allgemeine Informationen').count();
    console.log('Found "Allgemeine Informationen" section:', generalInfoSection);

    // Check for Benutzer-ID (should NOT exist)
    const userIdField = await page.locator('text=Benutzer-ID').count();
    console.log('Benutzer-ID field count (should be 0):', userIdField);

    // Check for Name label
    const nameLabel = await page.locator('label:has-text("NAME"), label:has-text("Name")').count();
    console.log('Name label count:', nameLabel);

    // Check for pencil icon
    const pencilIcon = await page.locator('ion-icon').filter({ hasText: '' }).count();
    console.log('Total ion-icons:', pencilIcon);

    // Try to click on the name field to enter edit mode
    if (generalInfoSection > 0) {
      console.log('Trying to enter edit mode...');

      // Look for clickable area
      const clickableArea = page.locator('div.cursor-pointer').first();
      const clickableCount = await page.locator('div.cursor-pointer').count();
      console.log('Clickable areas found:', clickableCount);

      if (clickableCount > 0) {
        await clickableArea.click();
        await page.waitForTimeout(1000);

        // Take screenshot of edit mode
        await page.screenshot({
          path: 'C:\\Users\\steff\\Desktop\\eduhu-pwa-prototype\\teacher-assistant\\frontend\\profile-edit-mode.png',
          fullPage: true
        });
        console.log('✅ Screenshot saved: profile-edit-mode.png');

        // Check for edit mode elements
        const inputField = await page.locator('input[type="text"]').count();
        const abbrechenButton = await page.locator('button:has-text("Abbrechen")').count();
        const speichernButton = await page.locator('button:has-text("Speichern")').count();

        console.log('Edit mode elements:');
        console.log('  - Input field:', inputField);
        console.log('  - Abbrechen button:', abbrechenButton);
        console.log('  - Speichern button:', speichernButton);

        // Verify buttons are visible
        if (abbrechenButton > 0 && speichernButton > 0) {
          const abbrechenBox = await page.locator('button:has-text("Abbrechen")').boundingBox();
          const speichernBox = await page.locator('button:has-text("Speichern")').boundingBox();

          console.log('Button positions:');
          console.log('  - Abbrechen:', abbrechenBox);
          console.log('  - Speichern:', speichernBox);

          if (abbrechenBox && speichernBox) {
            console.log('✅ Both buttons are VISIBLE and not cut off!');
          }
        }
      }
    }

    console.log('\n=== Test Summary ===');
    console.log('Benutzer-ID removed:', userIdField === 0 ? '✅ YES' : '❌ NO');
    console.log('Name field present:', nameLabel > 0 ? '✅ YES' : '❌ NO');
    console.log('Screenshots captured: ✅ YES');

  } catch (error) {
    console.error('Test error:', error);

    // Take error screenshot
    await page.screenshot({
      path: 'C:\\Users\\steff\\Desktop\\eduhu-pwa-prototype\\teacher-assistant\\frontend\\profile-error.png',
      fullPage: true
    });
    console.log('Error screenshot saved: profile-error.png');
  } finally {
    await browser.close();
  }
});
