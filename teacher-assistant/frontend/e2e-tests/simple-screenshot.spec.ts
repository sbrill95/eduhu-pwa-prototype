/**
 * Simple Screenshot Test - Current Implementation
 */

import { test } from '@playwright/test';

test('Take screenshot of current app', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  // Full page
  await page.screenshot({
    path: 'current-app-full.png',
    fullPage: true
  });

  // Viewport
  await page.screenshot({
    path: 'current-app-viewport.png',
    fullPage: false
  });

  console.log('✅ Screenshots saved');
});
