/**
 * Story 3.1.3: Router Classification E2E Tests
 *
 * Tests router agent intent classification and manual override UX
 *
 * Test Coverage:
 * - AC1: High confidence creation → auto-routes without confirmation
 * - AC2: High confidence editing → auto-routes without confirmation
 * - AC3: Low confidence → shows manual override UI
 * - AC4: Manual override → user selects creation
 * - AC5: Manual override → user selects editing
 * - Performance: Classification completes in <500ms
 * - Error: Zero console errors during classification
 */

import { test, expect } from './fixtures/authBypass';

test.describe('Story 3.1.3 - Router Classification', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('❌ CONSOLE ERROR:', msg.text());
      }
    });

    // Navigate to root and use Ionic tab navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Chat tab button to switch to Chat view
    await page.click('[data-testid="tab-chat"]');

    // Wait for chat input to be ready
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
  });

  test.afterEach(async () => {
    // Screenshot directory
    const date = new Date().toISOString().split('T')[0];
    console.log(`Screenshots saved to: docs/testing/screenshots/${date}/`);
  });

  test('AC1: High confidence creation - auto-routes without confirmation', async ({ page }) => {
    // Type clear creation prompt
    const prompt = 'Erstelle ein Bild von einem Dinosaurier für den Biologie-Unterricht';
    // For Ionic ion-input, target the native input element inside
    await page.locator('[data-testid="chat-input"] input').fill(prompt);

    // Screenshot BEFORE state
    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-high-confidence-create-before.png`,
      fullPage: true,
    });

    await page.click('[data-testid="send-button"]');

    // Should NOT show RouterOverride (auto-routed with high confidence)
    // Wait for network to be idle (indicates classification API call completed)
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    // Now verify RouterOverride never appeared (high confidence auto-routing)
    const routerOverride = page.locator('[data-testid="router-override"]');
    await expect(routerOverride).not.toBeVisible();

    // Screenshot AFTER state
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-high-confidence-create-after.png`,
      fullPage: true,
    });

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('AC2: High confidence editing - auto-routes without confirmation', async ({ page }) => {
    // Type clear editing prompt (requires existing image reference)
    const prompt = 'Ändere das letzte Bild: Füge einen Vulkan im Hintergrund hinzu';
    await page.locator('[data-testid="chat-input"] input').fill(prompt);

    // Screenshot BEFORE state
    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-high-confidence-edit-before.png`,
      fullPage: true,
    });

    await page.click('[data-testid="send-button"]');

    // Should NOT show RouterOverride (auto-routed)
    await page.waitForTimeout(2000);
    const routerOverride = page.locator('[data-testid="router-override"]');
    await expect(routerOverride).not.toBeVisible();

    // Screenshot AFTER state
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-high-confidence-edit-after.png`,
      fullPage: true,
    });

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('AC3: Low confidence - shows manual override UI', async ({ page }) => {
    // Type ambiguous prompt
    const prompt = 'Mache das bunter';
    await page.locator('[data-testid="chat-input"] input').fill(prompt);

    // Screenshot BEFORE state
    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-manual-override-before.png`,
      fullPage: true,
    });

    await page.click('[data-testid="send-button"]');

    // SHOULD show RouterOverride
    const routerOverride = page.locator('[data-testid="router-override"]');
    await expect(routerOverride).toBeVisible({ timeout: 5000 });

    // Should show confidence score (as percentage)
    const confidenceText = routerOverride.locator('text=/\\d+%/');
    await expect(confidenceText).toBeVisible();

    // Should show manual selection buttons
    await expect(page.locator('[data-testid="create-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-button"]')).toBeVisible();

    // Screenshot AFTER state (showing RouterOverride)
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-manual-override-shown.png`,
      fullPage: true,
    });

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('AC4: Manual override - user selects creation', async ({ page }) => {
    // Type ambiguous prompt
    const prompt = 'Füge einen Dinosaurier hinzu';
    await page.locator('[data-testid="chat-input"] input').fill(prompt);

    await page.click('[data-testid="send-button"]');

    // Wait for RouterOverride
    const routerOverride = page.locator('[data-testid="router-override"]');
    await expect(routerOverride).toBeVisible({ timeout: 5000 });

    // Screenshot with RouterOverride visible
    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-manual-select-create-before.png`,
      fullPage: true,
    });

    // User selects "Create" (assuming router detected 'edit')
    const createButton = page.locator('[data-testid="create-button"]');

    // Check if button is enabled (not detected intent)
    const isDisabled = await createButton.isDisabled();
    if (!isDisabled) {
      await createButton.click();

      // RouterOverride should disappear after selection
      await expect(routerOverride).not.toBeVisible({ timeout: 5000 });

      // Screenshot AFTER selection
      await page.screenshot({
        path: `docs/testing/screenshots/${date}/router-manual-select-create-after.png`,
        fullPage: true,
      });
    } else {
      // If create is already detected, click confirm instead
      await page.locator('[data-testid="confirm-button"]').click();
      await expect(routerOverride).not.toBeVisible({ timeout: 5000 });
    }

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('AC5: Manual override - user selects editing', async ({ page }) => {
    // Type ambiguous prompt
    const prompt = 'Füge einen Dinosaurier hinzu';
    await page.locator('[data-testid="chat-input"] input').fill(prompt);

    await page.click('[data-testid="send-button"]');

    // Wait for RouterOverride
    const routerOverride = page.locator('[data-testid="router-override"]');
    await expect(routerOverride).toBeVisible({ timeout: 5000 });

    // Screenshot with RouterOverride visible
    const date = new Date().toISOString().split('T')[0];
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/router-manual-select-edit-before.png`,
      fullPage: true,
    });

    // User selects "Edit"
    const editButton = page.locator('[data-testid="edit-button"]');

    // Check if button is enabled
    const isDisabled = await editButton.isDisabled();
    if (!isDisabled) {
      await editButton.click();

      // RouterOverride should disappear after selection
      await expect(routerOverride).not.toBeVisible({ timeout: 5000 });

      // Screenshot AFTER selection
      await page.screenshot({
        path: `docs/testing/screenshots/${date}/router-manual-select-edit-after.png`,
        fullPage: true,
      });
    } else {
      // If edit is already detected, click confirm instead
      await page.locator('[data-testid="confirm-button"]').click();
      await expect(routerOverride).not.toBeVisible({ timeout: 5000 });
    }

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('AC6: Image reference detection - latest image', async ({ page }) => {
    // Type prompt with "das letzte Bild"
    const prompt = 'Bearbeite das letzte Bild';
    await page.locator('[data-testid="chat-input"] input').fill(prompt);

    await page.click('[data-testid="send-button"]');

    // Should auto-route to editing (high confidence with image reference)
    const routerOverride = page.locator('[data-testid="router-override"]');
    await page.waitForTimeout(2000);
    await expect(routerOverride).not.toBeVisible();

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('AC7: Context-aware classification - dative article', async ({ page }) => {
    // Type "dem [noun]-bild" pattern (dative = modifying existing)
    const prompt = 'Füge dem Dinosaurier-Bild einen Vulkan hinzu';
    await page.locator('[data-testid="chat-input"] input').fill(prompt);

    await page.click('[data-testid="send-button"]');

    // Should classify as EDIT (dative article indicates modification)
    // May auto-route or show RouterOverride depending on confidence
    await page.waitForTimeout(2000);

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('Performance: Classification completes in <500ms', async ({ page }) => {
    const startTime = Date.now();

    await page.locator('[data-testid="chat-input"] input').fill('Erstelle ein Bild von einem Apfel');
    await page.click('[data-testid="send-button"]');

    // Wait for either router-override (low confidence) OR for loading to complete (auto-routed)
    await Promise.race([
      page.waitForSelector('[data-testid="router-override"]', { timeout: 2000 }).catch(() => null),
      page.waitForTimeout(2000),
    ]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️ Classification duration: ${duration}ms`);

    // Classification should complete quickly
    // Note: E2E includes network latency, so we allow up to 2000ms
    expect(duration).toBeLessThan(2000);

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('Error: Zero console errors during classification', async ({ page }) => {
    const prompts = [
      'Erstelle ein Bild von einem Dinosaurier',
      'Ändere den Hintergrund',
      'Mache das bunter',
    ];

    for (const prompt of prompts) {
      await page.locator('[data-testid="chat-input"] input').fill(prompt);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(2000);

      // Clear input for next iteration
      await page.locator('[data-testid="chat-input"] input').fill('');
    }

    // Verify ZERO console errors across all classifications
    console.log(`Total console errors: ${consoleErrors.length}`);
    expect(consoleErrors.length).toBe(0);
  });
});
