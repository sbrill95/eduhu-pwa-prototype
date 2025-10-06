import { test } from '@playwright/test';

test('Final Bubble Screenshot', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({
    path: 'bubble-polish-final.png',
    fullPage: true
  });

  console.log('✅ Final screenshot saved: bubble-polish-final.png');
});
