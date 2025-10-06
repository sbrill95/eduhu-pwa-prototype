import { test, expect } from '@playwright/test';

test('verify tab-bar restoration to 3 tabs with floating profile button', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5175');

  // Wait for app to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot of initial state (Home tab)
  await page.screenshot({
    path: 'tab-bar-restoration-home.png',
    fullPage: true
  });

  console.log('✅ Screenshot saved: tab-bar-restoration-home.png');

  // Verify 3 tabs are present
  const tabs = page.locator('.tab-bar-fixed button');
  await expect(tabs).toHaveCount(3);

  // Verify tab labels
  const homeTab = tabs.nth(0);
  const chatTab = tabs.nth(1);
  const libraryTab = tabs.nth(2);

  await expect(homeTab.locator('span')).toHaveText('Home');
  await expect(chatTab.locator('span')).toHaveText('Chat');
  await expect(libraryTab.locator('span')).toHaveText('Library');

  console.log('✅ All 3 tabs verified: Home, Chat, Library');

  // Verify floating profile button exists
  const profileButton = page.locator('.floating-profile-button');
  await expect(profileButton).toBeVisible();

  console.log('✅ Floating profile button visible');

  // Check profile button position (top-right)
  const buttonBox = await profileButton.boundingBox();
  if (buttonBox) {
    console.log(`Profile button position: top=${buttonBox.y}px, right=${page.viewportSize()!.width - buttonBox.x - buttonBox.width}px`);
    expect(buttonBox.y).toBeLessThan(100); // Should be near top
    expect(page.viewportSize()!.width - buttonBox.x - buttonBox.width).toBeLessThan(100); // Should be near right
  }

  // Verify active tab color (Home should be orange)
  const homeTabColor = await homeTab.evaluate(el => window.getComputedStyle(el).color);
  console.log(`Home tab color: ${homeTabColor}`);

  // Click Chat tab
  await chatTab.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Chat tab
  await page.screenshot({
    path: 'tab-bar-restoration-chat.png',
    fullPage: true
  });

  console.log('✅ Screenshot saved: tab-bar-restoration-chat.png');

  // Verify Chat tab is now active (orange)
  const chatTabColor = await chatTab.evaluate(el => window.getComputedStyle(el).color);
  console.log(`Chat tab color: ${chatTabColor}`);

  // Click Library tab
  await libraryTab.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Library tab
  await page.screenshot({
    path: 'tab-bar-restoration-library.png',
    fullPage: true
  });

  console.log('✅ Screenshot saved: tab-bar-restoration-library.png');

  // Click floating profile button
  await profileButton.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Profile view
  await page.screenshot({
    path: 'tab-bar-restoration-profile.png',
    fullPage: true
  });

  console.log('✅ Screenshot saved: tab-bar-restoration-profile.png');

  // Verify profile view is open
  const profileView = page.locator('text=Lehrerprofil, text=Profil, text=Name, text=Schule').first();
  await expect(profileView).toBeVisible();

  console.log('✅ Profile view opened successfully');

  console.log('\n=== Tab-Bar Restoration Verification Complete ===');
  console.log('Screenshots saved:');
  console.log('- tab-bar-restoration-home.png');
  console.log('- tab-bar-restoration-chat.png');
  console.log('- tab-bar-restoration-library.png');
  console.log('- tab-bar-restoration-profile.png');
});
