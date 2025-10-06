import { test, expect } from '@playwright/test';

test('Simple connection test', async ({ page }) => {
  console.log('🔍 Testing connection to http://localhost:5173');

  try {
    await page.goto('http://localhost:5173', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });

    console.log('✅ Successfully loaded page');

    // Take screenshot
    await page.screenshot({ path: 'test-connection-success.png' });

    // Check title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    expect(title).toBeTruthy();

  } catch (error) {
    console.error('❌ Failed to load page:', error);
    throw error;
  }
});
