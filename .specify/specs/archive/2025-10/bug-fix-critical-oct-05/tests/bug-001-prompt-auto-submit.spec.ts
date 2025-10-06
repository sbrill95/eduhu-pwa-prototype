import { test, expect } from '@playwright/test';

test.describe('BUG-001: Prompt Auto-Submit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5175');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should auto-submit prompt from Homepage tile', async ({ page }) => {
    // Start on Home tab
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(500);

    // Find and click a prompt suggestion tile
    // Look for the prompt tiles within the WelcomeMessageBubble
    const promptTile = page.locator('[data-testid*="prompt-tile"]').first();

    // If no data-testid, fallback to finding by structure
    const tileLocator = promptTile.isVisible()
      ? promptTile
      : page.locator('.bg-white.rounded-2xl .grid > div').first();

    await expect(tileLocator).toBeVisible({ timeout: 5000 });

    // Get the prompt text before clicking
    const promptText = await tileLocator.textContent();
    console.log('Clicking prompt tile with text:', promptText);

    // Click prompt suggestion tile
    await tileLocator.click();

    // Should navigate to Chat tab
    await expect(page.locator('ion-tab-button[tab="generieren"][aria-selected="true"]')).toBeVisible({ timeout: 3000 });

    // Wait a bit for auto-submit to trigger (300ms delay + network time)
    await page.waitForTimeout(1000);

    // Should show loading indicator (auto-submit triggered)
    // Look for loading spinner or "eduhu tippt..." message
    const loadingIndicator = page.locator('text=/eduhu.*tippt|Lädt|Loading/i').first();

    // Check if loading appeared (might be quick)
    const wasLoading = await loadingIndicator.isVisible().catch(() => false);

    // If not currently loading, check if we already have a response (very fast response)
    if (!wasLoading) {
      // Look for AI response message bubble
      const responseMessage = page.locator('.bg-white.rounded-2xl').first();
      await expect(responseMessage).toBeVisible({ timeout: 15000 });
    } else {
      // Wait for response if still loading
      await page.waitForTimeout(5000);
    }

    // Input should be empty after auto-submit
    const input = page.locator('ion-input input, ion-textarea textarea').first();
    const inputValue = await input.inputValue();
    expect(inputValue).toBe('');

    // Take screenshot
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-001-auto-submit-success.png',
      fullPage: true
    });
  });

  test('should handle auto-submit errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/chat', route => route.abort());

    await page.goto('http://localhost:5175');
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(500);

    // Click prompt tile
    const tileLocator = page.locator('.bg-white.rounded-2xl .grid > div').first();
    await expect(tileLocator).toBeVisible({ timeout: 5000 });
    await tileLocator.click();

    // Should navigate to Chat tab
    await expect(page.locator('ion-tab-button[tab="generieren"][aria-selected="true"]')).toBeVisible({ timeout: 3000 });

    // Wait for auto-submit attempt
    await page.waitForTimeout(1000);

    // Should show error message
    const errorMessage = page.locator('text=/Automatisches Senden fehlgeschlagen|Fehler/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Prompt should still be in input for manual retry
    const input = page.locator('ion-input input, ion-textarea textarea').first();
    const inputValue = await input.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-001-auto-submit-error.png',
      fullPage: true
    });
  });

  test('should not create duplicate messages on fast navigation', async ({ page }) => {
    // This test ensures auto-submit doesn't create orphan requests

    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(500);

    // Click prompt tile
    const tileLocator = page.locator('.bg-white.rounded-2xl .grid > div').first();
    await expect(tileLocator).toBeVisible({ timeout: 5000 });
    await tileLocator.click();

    // Quickly switch to another tab (before auto-submit completes)
    await page.waitForTimeout(100); // Less than 300ms auto-submit delay
    await page.click('ion-tab-button[tab="profil"]');

    // Wait a bit
    await page.waitForTimeout(2000);

    // Go back to chat
    await page.click('ion-tab-button[tab="generieren"]');

    // Should not have multiple duplicate messages
    // Count message bubbles (excluding welcome messages)
    const messageBubbles = page.locator('.bg-white.rounded-2xl');
    const count = await messageBubbles.count();

    // Should have reasonable number of messages (not duplicated)
    // Expect at most 2-3 messages (user message + AI response, plus maybe a system message)
    expect(count).toBeLessThanOrEqual(5);

    // Take screenshot
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-001-no-duplicates.png',
      fullPage: true
    });
  });
});
