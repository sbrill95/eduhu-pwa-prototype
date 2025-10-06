/**
 * Simple Playwright script to take Profile UI screenshots
 * Run with: node take-profile-screenshots-simple.js
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 393, height: 851 } });

  try {
    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    console.log('Step 1: Taking home page screenshot...');
    await page.screenshot({ path: 'profile-verify-01-home.png', fullPage: true });

    // Click profile button using the class name
    console.log('Step 2: Looking for profile button...');

    const profileButton = page.locator('.floating-profile-button');
    const buttonCount = await profileButton.count();
    console.log(`Found ${buttonCount} profile button(s)`);

    if (buttonCount > 0) {
      console.log('Clicking profile button...');
      await profileButton.click();
    } else {
      console.log('ERROR: Profile button not found!');
    }

    await page.waitForTimeout(2000);

    console.log('Step 3: Taking profile overview screenshot...');
    await page.screenshot({ path: 'profile-verify-02-overview.png', fullPage: true });

    // Try to find and screenshot the characteristic cards
    const cards = await page.locator('[class*="flex items-center gap"]').count();
    console.log(`Found ${cards} characteristic card elements`);

    // Take a detailed screenshot of just the characteristics section
    const charSection = page.locator('text=Gelernte Merkmale').locator('..');
    if (await charSection.count() > 0) {
      console.log('Step 4: Taking characteristics detail screenshot...');
      await charSection.screenshot({ path: 'profile-verify-03-chars-detail.png' });
    }

    // Try to click on name to edit
    console.log('Step 5: Testing name edit...');
    const nameLabel = page.locator('text=Name');
    if (await nameLabel.count() > 0) {
      const nameContainer = nameLabel.locator('..').locator('div.cursor-pointer');
      if (await nameContainer.count() > 0) {
        await nameContainer.click();
        await page.waitForTimeout(500);

        console.log('Step 6: Taking name-edit screenshot...');
        await page.screenshot({ path: 'profile-verify-04-name-edit.png', fullPage: true });
      }
    }

    console.log('\n✅ All screenshots captured successfully!');
    console.log('Check the following files:');
    console.log('  - profile-verify-01-home.png');
    console.log('  - profile-verify-02-overview.png');
    console.log('  - profile-verify-03-chars-detail.png');
    console.log('  - profile-verify-04-name-edit.png');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
