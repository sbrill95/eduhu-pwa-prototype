import { test, expect } from '@playwright/test';

test('Home View Polish - Gemini Design Verification', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for auth and navigation
  await page.waitForTimeout(2000);

  // Take screenshot of Home view
  await page.screenshot({
    path: 'home-polish-gemini-verification.png',
    fullPage: true
  });

  console.log('Screenshot saved: home-polish-gemini-verification.png');
});
