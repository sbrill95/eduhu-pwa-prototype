import { test, expect } from '@playwright/test';

test('Verify test mode flags are properly injected', async ({ page }) => {
  // Navigate to test verification page
  await page.goto('http://localhost:5174/test-mode-check.html');
  await page.waitForLoadState('networkidle');

  // Wait for page to render
  await page.waitForSelector('h1:has-text("Test Mode Verification")');

  // Take a screenshot
  await page.screenshot({ path: 'test-mode-verification.png', fullPage: true });

  // Get the summary text
  const summary = await page.locator('h2').textContent();
  console.log('Summary:', summary);

  // Check if all checks passed
  const allPassed = summary?.includes('4/4');

  if (!allPassed) {
    // If checks failed, log details
    const rows = await page.locator('table tr').all();
    for (const row of rows) {
      const text = await row.textContent();
      console.log(text);
    }
  }

  // Assert that all checks passed
  expect(summary).toContain('4/4 checks passing');
});
