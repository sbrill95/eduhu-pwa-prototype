import { test, expect } from '@playwright/test';

test.describe('Teacher Assistant App', () => {
  test('should display the main page correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);

    // Check for the main heading
    await expect(page.locator('h1')).toContainText('Teacher Assistant Frontend');

    // Check for the counter button
    await expect(page.locator('button', { hasText: /count is/ })).toBeVisible();

    // Check initial counter value
    await expect(page.locator('button', { hasText: /count is 0/ })).toBeVisible();
  });

  test('should increment counter on button click', async ({ page }) => {
    await page.goto('/');

    const counterButton = page.locator('button', { hasText: /count is/ });

    // Click the button and verify counter increments
    await counterButton.click();
    await expect(page.locator('button', { hasText: /count is 1/ })).toBeVisible();

    await counterButton.click();
    await expect(page.locator('button', { hasText: /count is 2/ })).toBeVisible();

    await counterButton.click();
    await expect(page.locator('button', { hasText: /count is 3/ })).toBeVisible();
  });

  test('should have correct styling and layout', async ({ page }) => {
    await page.goto('/');

    // Check for Tailwind classes - verify responsive layout
    const container = page.locator('div').first();
    await expect(container).toBeVisible();

    // Check for logos
    await expect(page.locator('img[alt="Vite logo"]')).toBeVisible();
    await expect(page.locator('img[alt="React logo"]')).toBeVisible();

    // Check for setup completion message
    await expect(page.locator('text=React + TypeScript + Vite + Tailwind CSS setup complete!')).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    await page.goto('/');

    // Check for button accessibility
    const button = page.locator('button', { hasText: /count is/ });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Check for proper heading structure
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Check for alt text on images
    await expect(page.locator('img[alt="Vite logo"]')).toBeVisible();
    await expect(page.locator('img[alt="React logo"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button', { hasText: /count is/ })).toBeVisible();

    // Test interaction on mobile
    const button = page.locator('button', { hasText: /count is/ });
    await button.click();
    await expect(page.locator('button', { hasText: /count is 1/ })).toBeVisible();
  });

  test('should handle external links correctly', async ({ page }) => {
    await page.goto('/');

    // Check Vite link
    const viteLink = page.locator('a[href="https://vite.dev"]');
    await expect(viteLink).toBeVisible();
    await expect(viteLink).toHaveAttribute('target', '_blank');

    // Check React link
    const reactLink = page.locator('a[href="https://react.dev"]');
    await expect(reactLink).toBeVisible();
    await expect(reactLink).toHaveAttribute('target', '_blank');
  });
});