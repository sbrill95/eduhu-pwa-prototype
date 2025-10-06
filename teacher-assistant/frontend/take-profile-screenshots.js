/**
 * Profile Visual Verification - Screenshot Script
 *
 * Takes screenshots of the Profile View implementation
 * to verify it matches the Gemini design mockup.
 */

import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting Profile Visual Verification...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone SE
  });

  const page = await context.newPage();

  try {
    // Navigate to app
    console.log('📍 Navigating to http://localhost:5177...');
    await page.goto('http://localhost:5177', { waitUntil: 'networkidle' });

    // Wait for app to load
    console.log('⏳ Waiting for app to load...');
    await page.waitForTimeout(3000); // Wait for initial render

    // Click Profile icon in top-right corner (floating button)
    console.log('👆 Clicking Profile icon...');
    await page.click('.floating-profile-button');

    // Wait for Profile view to load
    await page.waitForSelector('text=Dein Profil', { timeout: 10000 });

    // TASK-017: Profile Sync Indicator
    console.log('\n✅ TASK-017: Taking screenshot - Profile Sync Indicator');
    await page.screenshot({
      path: 'profile-sync-indicator.png',
      fullPage: false
    });

    // TASK-018: Verify microcopy
    console.log('✅ TASK-018: Verifying encouraging microcopy...');
    const microcopy = await page.locator('text=Je mehr du mit eduhu interagierst').isVisible();
    console.log(`   Microcopy visible: ${microcopy ? 'YES ✓' : 'NO ✗'}`);

    // TASK-019: Gelernte Merkmale Tags
    console.log('✅ TASK-019: Taking screenshot - Gelernte Merkmale Tags');
    await page.screenshot({
      path: 'profile-tags-display.png',
      fullPage: false
    });

    // TASK-020: Add Tag Modal
    console.log('✅ TASK-020: Taking screenshot - Add Tag Modal');
    await page.click('text=Merkmal hinzufügen +');
    await page.waitForSelector('text=Merkmal hinzufügen', { timeout: 5000 });
    await page.screenshot({
      path: 'profile-add-tag-modal.png',
      fullPage: false
    });

    // Close modal (force click to bypass tab bar overlay)
    await page.click('text=Abbrechen', { force: true });
    await page.waitForTimeout(500);

    // TASK-021: General Info Section
    console.log('✅ TASK-021: Taking screenshot - General Info Section');
    await page.locator('text=Allgemeine Informationen').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: 'profile-general-info.png',
      fullPage: false
    });

    // TASK-022: Full Profile Screenshots
    console.log('\n✅ TASK-022: Taking full-page screenshots on multiple viewports');

    // iPhone SE (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: 'profile-full-iphone-se.png',
      fullPage: true
    });
    console.log('   - iPhone SE (375px) ✓');

    // iPhone 12 (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: 'profile-full-iphone-12.png',
      fullPage: true
    });
    console.log('   - iPhone 12 (390px) ✓');

    // Pixel 5 (393px)
    await page.setViewportSize({ width: 393, height: 851 });
    await page.screenshot({
      path: 'profile-full-pixel-5.png',
      fullPage: true
    });
    console.log('   - Pixel 5 (393px) ✓');

    console.log('\n🎉 All screenshots taken successfully!');
    console.log('\nScreenshots saved:');
    console.log('  - profile-sync-indicator.png');
    console.log('  - profile-tags-display.png');
    console.log('  - profile-add-tag-modal.png');
    console.log('  - profile-general-info.png');
    console.log('  - profile-full-iphone-se.png');
    console.log('  - profile-full-iphone-12.png');
    console.log('  - profile-full-pixel-5.png');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
