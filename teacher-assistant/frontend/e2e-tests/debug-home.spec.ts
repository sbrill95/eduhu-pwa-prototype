import { test, expect } from '@playwright/test';

test('debug home page structure', async ({ page }) => {
  // Capture network requests
  const requests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('api')) {
      requests.push(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });
  page.on('response', response => {
    if (response.url().includes('api')) {
      requests.push(`[RESPONSE] ${response.status()} ${response.url()}`);
    }
  });

  // Navigate to home page with hard reload to bypass cache
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Hard reload to get latest code
  await page.reload({ waitUntil: 'networkidle' });

  // Take screenshot
  await page.screenshot({ path: 'home-debug.png', fullPage: true });

  // Get page HTML
  const html = await page.content();
  console.log('Page HTML length:', html.length);

  // Log API requests
  console.log('\nAPI Requests:', requests.join('\n'));

  // Check what's actually on the page
  const bodyText = await page.locator('body').textContent();
  console.log('Body text:', bodyText);

  // Check for specific elements
  const promptGrid = page.locator('[data-testid="prompt-grid"]');
  const promptGridVisible = await promptGrid.isVisible().catch(() => false);
  console.log('Prompt grid visible:', promptGridVisible);

  const promptTiles = page.locator('[data-testid^="prompt-tile-"]');
  const tileCount = await promptTiles.count();
  console.log('Prompt tiles count:', tileCount);

  // Check for any errors in console
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Wait a bit to capture console messages
  await page.waitForTimeout(2000);

  console.log('Console messages:', consoleMessages);

  // Check for InstantDB auth
  const authButton = page.locator('button:has-text("Anmelden"), button:has-text("Sign in")');
  const authButtonVisible = await authButton.isVisible().catch(() => false);
  console.log('Auth button visible:', authButtonVisible);

  // Check for home content
  const homeContent = page.locator('text=Vorschläge für dich');
  const homeContentVisible = await homeContent.isVisible().catch(() => false);
  console.log('Home content visible:', homeContentVisible);

  // Check for loading indicator
  const loading = page.locator('[data-testid="prompt-grid-loading"]');
  const loadingVisible = await loading.isVisible().catch(() => false);
  console.log('Loading indicator visible:', loadingVisible);

  // Check for error
  const error = page.locator('[data-testid="prompt-grid-error"]');
  const errorVisible = await error.isVisible().catch(() => false);
  console.log('Error indicator visible:', errorVisible);
});
