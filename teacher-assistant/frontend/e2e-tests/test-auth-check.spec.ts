import { test, expect } from '@playwright/test';

test('Check if test mode is enabled', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5174');

  // Take initial screenshot
  await page.screenshot({ path: 'qa-screenshots/auth-check-initial.png', fullPage: true });

  // Check if VITE_TEST_MODE is available in the browser
  const testMode = await page.evaluate(() => {
    return {
      viteTestMode: (import.meta as any).env?.VITE_TEST_MODE,
      viteNodeEnv: (import.meta as any).env?.VITE_NODE_ENV,
      allEnvVars: (import.meta as any).env,
    };
  });

  console.log('Environment variables:', JSON.stringify(testMode, null, 2));

  // Check if we see sign-in or the app
  const signInVisible = await page.locator('text=Sign In').isVisible({ timeout: 5000 }).catch(() => false);
  const chatTabVisible = await page.locator('[aria-label="Chat"]').isVisible({ timeout: 2000 }).catch(() => false);

  console.log('Sign In visible:', signInVisible);
  console.log('Chat tab visible:', chatTabVisible);

  // If test mode is not enabled, we expect to see Sign In
  if (testMode.viteTestMode === 'true') {
    console.log('✅ Test mode is enabled');
    expect(chatTabVisible).toBe(true);
  } else {
    console.log('❌ Test mode is NOT enabled - will see Sign In page');
    expect(signInVisible).toBe(true);
  }
});
