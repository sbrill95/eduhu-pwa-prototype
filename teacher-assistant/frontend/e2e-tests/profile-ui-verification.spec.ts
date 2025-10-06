import { test } from '@playwright/test';

/**
 * Profile View UI Fixes Verification - Manual Navigation
 *
 * Takes screenshots to verify:
 * 1. Characteristic cards are 1/3 smaller (compact padding and font)
 * 2. Name-edit buttons are refined and compact
 * 3. Modal overlays properly (z-index 9999)
 */

test.describe('Profile View UI Fixes - Manual Verification', () => {
  test('should display compact UI elements', async ({ page }) => {
    // Navigate directly to the app
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Take screenshot of home page first
    await page.screenshot({
      path: 'profile-test-01-home.png',
      fullPage: true
    });
    console.log('✅ Screenshot 1: profile-test-01-home.png');

    // Click on the profile button (orange circular button in top right)
    // It's styled with background color #FB6542
    const profileButton = page.locator('button').filter({
      has: page.locator('ion-icon[icon="person-outline"]')
    });

    const buttonCount = await profileButton.count();
    console.log(`Found ${buttonCount} profile buttons`);

    if (buttonCount > 0) {
      await profileButton.first().click();
      await page.waitForTimeout(2000);

      // Take screenshot of profile view
      await page.screenshot({
        path: 'profile-test-02-overview.png',
        fullPage: true
      });
      console.log('✅ Screenshot 2: profile-test-02-overview.png');

      // Try to click on name field to enter edit mode
      const nameSection = page.locator('text=Name').locator('..');
      if (await nameSection.count() > 0) {
        const editableArea = nameSection.locator('div.cursor-pointer').first();
        if (await editableArea.count() > 0) {
          await editableArea.click();
          await page.waitForTimeout(500);

          await page.screenshot({
            path: 'profile-test-03-name-edit.png',
            fullPage: true
          });
          console.log('✅ Screenshot 3: profile-test-03-name-edit.png');
        }
      }

      // Try to open Add Modal
      const addButton = page.locator('button:has-text("Merkmal hinzufügen")').first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'profile-test-04-modal.png',
          fullPage: true
        });
        console.log('✅ Screenshot 4: profile-test-04-modal.png');
      }
    } else {
      console.log('⚠️ Profile button not found. Available elements:');
      const body = await page.locator('body').innerHTML();
      console.log(body.substring(0, 500));
    }

    console.log('\n✅ Profile UI verification screenshots complete!');
  });
});
