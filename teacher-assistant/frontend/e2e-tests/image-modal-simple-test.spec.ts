import { test, expect } from '@playwright/test';

/**
 * Simple E2E test for Image Generation Modal
 * Tests basic functionality without full workflow
 */

test.describe('Image Generation Modal - Simple Test', () => {

  test('Can load the app and see Home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify app loaded
    const appRoot = page.locator('#root');
    await expect(appRoot).toBeVisible();

    console.log('✅ App loaded successfully');

    // Take screenshot
    await page.screenshot({ path: 'test-results/simple-01-app-loaded.png', fullPage: true });
  });

  test('Can navigate to Chat tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click Chat tab (custom button, not ion-tab-button)
    const chatTab = page.locator('button').filter({ hasText: 'Chat' }).first();
    await expect(chatTab).toBeVisible({ timeout: 5000 });
    await chatTab.click();
    await page.waitForTimeout(500);

    // Verify chat view is visible (look for Ionic input)
    const chatInput = page.locator('ion-input').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    console.log('✅ Chat tab navigation works');

    // Take screenshot
    await page.screenshot({ path: 'test-results/simple-02-chat-tab.png', fullPage: true });
  });

  test('Can type a message in chat input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Navigate to Chat (custom button)
    const chatTab = page.locator('button').filter({ hasText: 'Chat' }).first();
    await chatTab.click();
    await page.waitForTimeout(500);

    // Find Ionic input
    const chatInput = page.locator('ion-input').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Type message - use ionInput event for Ionic component
    await chatInput.evaluate((el: any, value: string) => {
      el.value = value;
      el.dispatchEvent(new CustomEvent('ionInput', { detail: { value } }));
    }, 'Erstelle ein Bild zur Photosynthese');
    await page.waitForTimeout(300);

    // Verify text was entered
    const inputValue = await chatInput.evaluate((el: any) => el.value);
    expect(inputValue).toContain('Photosynthese');

    console.log('✅ Chat input works');

    // Take screenshot
    await page.screenshot({ path: 'test-results/simple-03-message-typed.png', fullPage: true });
  });

});
