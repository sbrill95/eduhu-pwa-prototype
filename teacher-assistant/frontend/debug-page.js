import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:5177');
  await page.waitForTimeout(5000); // Wait 5 seconds

  // Take screenshot of what's actually there
  await page.screenshot({ path: 'debug-current-page.png', fullPage: true });

  // Print page title and URL
  console.log('Title:', await page.title());
  console.log('URL:', page.url());

  // Check if tab bar exists
  const tabBar = await page.locator('ion-tab-bar').count();
  console.log('Tab bars found:', tabBar);

  // Check if Profile text exists
  const profile = await page.locator('text=Dein Profil').count();
  console.log('Profile text found:', profile);

  // Close after 30 seconds so we can inspect
  await page.waitForTimeout(30000);
  await browser.close();
})();
