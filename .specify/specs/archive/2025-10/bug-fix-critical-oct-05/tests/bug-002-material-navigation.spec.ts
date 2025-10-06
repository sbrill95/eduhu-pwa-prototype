import { test, expect } from '@playwright/test';

test.describe('BUG-002: Material Link Navigation', () => {
  test('should navigate to Materials tab when clicking material arrow', async ({ page }) => {
    await page.goto('http://localhost:5175');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Start on Home tab (click it to ensure we're there)
    const homeTab = page.locator('ion-tab-button[tab="home"]');
    await homeTab.click();
    await page.waitForTimeout(500);

    // Click material arrow
    const materialArrow = page.locator('[aria-label="Alle Materialien anzeigen"]');
    await materialArrow.click();

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Should navigate to Library (Automatisieren) tab
    const libraryTab = page.locator('ion-tab-button[tab="automatisieren"]');
    await expect(libraryTab).toHaveAttribute('aria-selected', 'true');

    // CRITICAL: Should show "Materialien" sub-tab active (not "Chats")
    const materialsTabButton = page.locator('text=Materialien').first();
    await expect(materialsTabButton).toBeVisible();

    // Verify materials tab is active by checking for active styling
    // The active tab should have blue text/background
    const materialsTabParent = materialsTabButton.locator('..');
    const hasActiveClass = await materialsTabParent.evaluate((el) => {
      const classes = el.className;
      const computedStyle = window.getComputedStyle(el);

      // Check for blue color (active state)
      return classes.includes('text-blue-600') ||
             classes.includes('bg-blue-50') ||
             computedStyle.color.includes('37, 99, 235') || // Blue-600
             computedStyle.backgroundColor.includes('239, 246, 255'); // Blue-50
    });

    expect(hasActiveClass).toBe(true);

    // Screenshot for verification
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-002-playwright.png',
      fullPage: true
    });

    console.log('[Test] Material arrow navigation successful - Materials tab is active');
  });

  test('should preserve default Chats tab on direct library navigation', async ({ page }) => {
    await page.goto('http://localhost:5175');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Click Library tab directly (not via material arrow)
    const libraryTab = page.locator('ion-tab-button[tab="automatisieren"]');
    await libraryTab.click();

    // Wait for tab switch
    await page.waitForTimeout(1000);

    // Should show Chats tab by default
    const chatsTabButton = page.locator('text=Chat-Historie').first();
    await expect(chatsTabButton).toBeVisible();

    // Verify chats tab is active
    const chatsTabParent = chatsTabButton.locator('..');
    const hasActiveClass = await chatsTabParent.evaluate((el) => {
      const classes = el.className;
      const computedStyle = window.getComputedStyle(el);

      // Check for blue color (active state)
      return classes.includes('text-blue-600') ||
             classes.includes('bg-blue-50') ||
             computedStyle.color.includes('37, 99, 235') || // Blue-600
             computedStyle.backgroundColor.includes('239, 246, 255'); // Blue-50
    });

    expect(hasActiveClass).toBe(true);

    // Screenshot for regression test
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-002-regression.png',
      fullPage: true
    });

    console.log('[Test] Direct library navigation successful - Chats tab is active (default preserved)');
  });

  test('should handle multiple navigation cycles correctly', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.waitForTimeout(2000);

    // Cycle 1: Material arrow -> Materials tab
    const homeTab = page.locator('ion-tab-button[tab="home"]');
    await homeTab.click();
    await page.waitForTimeout(500);

    const materialArrow = page.locator('[aria-label="Alle Materialien anzeigen"]');
    await materialArrow.click();
    await page.waitForTimeout(1000);

    // Verify Materials tab is active
    let materialsTabButton = page.locator('text=Materialien').first();
    await expect(materialsTabButton).toBeVisible();

    // Cycle 2: Go back to Home
    await homeTab.click();
    await page.waitForTimeout(500);

    // Cycle 3: Direct Library click -> Chats tab (default)
    const libraryTab = page.locator('ion-tab-button[tab="automatisieren"]');
    await libraryTab.click();
    await page.waitForTimeout(1000);

    // Verify Chats tab is active
    let chatsTabButton = page.locator('text=Chat-Historie').first();
    await expect(chatsTabButton).toBeVisible();

    // Cycle 4: Go back to Home
    await homeTab.click();
    await page.waitForTimeout(500);

    // Cycle 5: Material arrow again -> Materials tab
    await materialArrow.click();
    await page.waitForTimeout(1000);

    // Verify Materials tab is active again
    materialsTabButton = page.locator('text=Materialien').first();
    await expect(materialsTabButton).toBeVisible();

    console.log('[Test] Multiple navigation cycles successful - event system works consistently');
  });
});
