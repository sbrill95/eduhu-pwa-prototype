import { test } from '@playwright/test';

test('Verify Home Screen Redesign', async ({ page }) => {
  console.log('📸 Taking screenshots of new Home Screen design...');

  try {
    // Navigate to app
    await page.goto('http://localhost:5174', {
      timeout: 30000,
      waitUntil: 'networkidle'
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take full page screenshot
    await page.screenshot({
      path: 'home-screen-redesign-full.png',
      fullPage: true
    });

    console.log('✅ Full page screenshot saved: home-screen-redesign-full.png');

    // Take viewport screenshot (above the fold)
    await page.screenshot({
      path: 'home-screen-redesign-viewport.png',
      fullPage: false
    });

    console.log('✅ Viewport screenshot saved: home-screen-redesign-viewport.png');

    // Take screenshot of just the home tab content
    const homeContent = page.locator('[role="tabpanel"]').first();
    if (await homeContent.count() > 0) {
      await homeContent.screenshot({
        path: 'home-screen-redesign-content.png'
      });
      console.log('✅ Content screenshot saved: home-screen-redesign-content.png');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
});
