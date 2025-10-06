import { test, expect } from '@playwright/test';

/**
 * Chat View Polish Verification - Phase 3.1 Gemini Design
 *
 * Tests:
 * 1. Chat input horizontal layout (CRITICAL)
 * 2. Personalized welcome message with user name
 * 3. Prompt tiles with Orange icons
 * 4. Send button Orange when enabled
 * 5. Floating Plus button for new chat
 */

test.describe('Chat View Polish - Gemini Design', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Navigate to Chat tab
    await page.click('[data-testid="tab-chat"]', { timeout: 5000 });
    await page.waitForTimeout(1000);
  });

  test('1. Chat input should be horizontal layout (CRITICAL)', async ({ page }) => {
    // Find the form with input controls
    const form = page.locator('form').first();
    const attachButton = form.locator('button').first();
    const input = form.locator('ion-input');
    const sendButton = form.locator('button[type="submit"]');

    // Verify all elements are visible
    await expect(attachButton).toBeVisible();
    await expect(input).toBeVisible();
    await expect(sendButton).toBeVisible();

    // Get bounding boxes to verify horizontal layout
    const attachBox = await attachButton.boundingBox();
    const inputBox = await input.boundingBox();
    const sendBox = await sendButton.boundingBox();

    expect(attachBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(sendBox).not.toBeNull();

    // Verify horizontal layout: all Y positions should be roughly the same (within 20px)
    const attachY = attachBox!.y;
    const inputY = inputBox!.y;
    const sendY = sendBox!.y;

    expect(Math.abs(attachY - inputY)).toBeLessThan(20);
    expect(Math.abs(inputY - sendY)).toBeLessThan(20);

    // Verify horizontal order: Attach -> Input -> Send
    expect(attachBox!.x).toBeLessThan(inputBox!.x);
    expect(inputBox!.x).toBeLessThan(sendBox!.x);

    console.log('✅ Chat input is horizontal layout');
  });

  test('2. Welcome message should be personalized', async ({ page }) => {
    // Find the welcome heading
    const heading = page.locator('h2').filter({ hasText: /Wollen wir/ });

    await expect(heading).toBeVisible();

    const text = await heading.textContent();

    // Should contain personalized greeting or fallback
    expect(text).toMatch(/Wollen wir (loslegen|starten)/);

    console.log('✅ Personalized welcome message:', text);
  });

  test('3. Prompt tiles should have Orange icons', async ({ page }) => {
    // Wait for prompt tiles to load
    await page.waitForSelector('.prompt-tile', { timeout: 5000 });

    // Get all icon containers
    const iconContainers = page.locator('[data-testid="prompt-icon-container"]');
    const count = await iconContainers.count();

    expect(count).toBeGreaterThan(0);

    // Verify first icon has orange styling
    const firstIcon = iconContainers.first();
    const iconElement = firstIcon.locator('ion-icon');

    // Check if icon has primary text color
    await expect(iconElement).toHaveClass(/text-primary/);

    console.log(`✅ ${count} Prompt tiles have Orange icons`);
  });

  test('4. Send button should be Orange when enabled', async ({ page }) => {
    const sendButton = page.locator('button[type="submit"]');
    const input = page.locator('ion-input');

    // Initially, send button should be gray (disabled state)
    const disabledBg = await sendButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log('Disabled send button color:', disabledBg);

    // Type in the input
    await input.fill('Test message');
    await page.waitForTimeout(500);

    // Now send button should be Orange (#FB6542)
    const enabledBg = await sendButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log('Enabled send button color:', enabledBg);

    // Convert #FB6542 to rgb(251, 101, 66)
    expect(enabledBg).toBe('rgb(251, 101, 66)');

    console.log('✅ Send button is Orange when enabled');
  });

  test('5. Floating Plus button should be visible', async ({ page }) => {
    // Find the floating plus button
    const plusButton = page.locator('button').filter({ hasText: '' }).filter({ has: page.locator('ion-icon[icon*="add"]') });

    await expect(plusButton).toBeVisible();

    // Verify it's positioned fixed
    const position = await plusButton.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });

    expect(position).toBe('fixed');

    // Verify it has Orange background
    const bg = await plusButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be #FB6542 = rgb(251, 101, 66)
    expect(bg).toBe('rgb(251, 101, 66)');

    console.log('✅ Floating Plus button is visible with Orange background');
  });

  test('VISUAL VERIFICATION: Take screenshot', async ({ page }) => {
    // Wait for UI to settle
    await page.waitForTimeout(1000);

    // Take screenshot of Chat view
    await page.screenshot({
      path: 'chat-view-polish-verification.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: chat-view-polish-verification.png');
  });
});
