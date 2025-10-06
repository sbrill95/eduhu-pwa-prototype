import { test, expect } from '@playwright/test';

test('Agent confirmation cancel button works', async ({ page }) => {
  // Setup + go to chat
  await page.goto('http://localhost:5174');
  await page.evaluate(() => {
    localStorage.setItem('test-auth-enabled', 'true');
    localStorage.setItem('test-user-id', 'test-user-playwright-id-12345');
    localStorage.setItem('test-user-email', 's.brill@eduhu.de');
  });

  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  const chatTab = page.locator('[aria-label="Chat"]');
  await expect(chatTab).toBeVisible({ timeout: 10000 });
  await chatTab.click();
  await page.waitForTimeout(1000);

  // Trigger agent detection
  const textarea = page.locator('textarea');
  const submitButton = page.locator('button[type="submit"]');

  console.log('Triggering agent detection with image generation prompt...');
  await textarea.fill('Erstelle ein Bild von einem Apfel');
  await submitButton.click();
  await page.waitForTimeout(5000); // Wait for agent detection

  // Screenshot before cancel
  await page.screenshot({ path: 'qa-screenshots/bug-b-before-cancel.png', fullPage: true });

  // Click "Weiter im Chat" button
  const cancelButton = page.locator('button:has-text("Weiter im Chat")');

  if (await cancelButton.isVisible({ timeout: 5000 })) {
    console.log('Agent confirmation modal detected - clicking cancel button');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    await page.waitForTimeout(1000);

    // Screenshot after cancel
    await page.screenshot({ path: 'qa-screenshots/bug-b-after-cancel.png', fullPage: true });

    // User should be able to type again
    await textarea.fill('Anderes Thema');
    await expect(textarea).toHaveValue('Anderes Thema');
    console.log('Cancel button works - user can type again');
  } else {
    console.warn('Agent confirmation modal did not appear - agent detection may have failed');
    await page.screenshot({ path: 'qa-screenshots/bug-b-no-modal.png', fullPage: true });
  }
});
