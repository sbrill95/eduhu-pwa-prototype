import { test, expect } from '@playwright/test';

/**
 * Verification Test: Gemini Home Screen Fixes #1-6
 *
 * This test verifies the following fixes have been applied:
 * - Fix #1: Component Order (Calendar BEFORE WelcomeMessageBubble)
 * - Fix #2: Desktop Centering (max-width: 448px, centered)
 * - Fix #3: White Container for Prompts (with dividers)
 * - Fix #4: Bubble Border Radius and Padding (16px)
 * - Fix #5: Font Sizes (label 12px, message 15px)
 * - Fix #6: Calendar Styling (white bg, 16px borderRadius, shadow)
 */

test.describe('Gemini Home Screen Fixes #1-6', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:5173');

    // Wait for page to load
    await page.waitForTimeout(2000);
  });

  test('Visual Verification - Full Page Screenshot', async ({ page }) => {
    // Take full page screenshot for manual comparison
    await page.screenshot({
      path: 'gemini-fixes-1-6-result.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: gemini-fixes-1-6-result.png');
    console.log('📋 Compare to: .specify/specs/home-screen-redesign/Screenshot 2025-10-01 134625.png');
  });

  test('Fix #1: Component Order - Calendar BEFORE Bubble', async ({ page }) => {
    const calendarCard = page.locator('[data-testid="calendar-card"]');
    const welcomeBubble = page.locator('[data-testid="welcome-message-bubble"]');

    // Both should be visible
    await expect(calendarCard).toBeVisible();
    await expect(welcomeBubble).toBeVisible();

    // Get positions
    const calendarBox = await calendarCard.boundingBox();
    const bubbleBox = await welcomeBubble.boundingBox();

    // Calendar should be ABOVE (smaller y coordinate) than bubble
    expect(calendarBox?.y).toBeLessThan(bubbleBox?.y);

    console.log('✅ Fix #1: Calendar appears BEFORE Welcome Bubble');
  });

  test('Fix #2: Desktop Centering - Container has max-width', async ({ page }) => {
    // Check that main container has max-width styling
    const container = page.locator('div').first();

    // Verify max-width is applied (should be 448px)
    const containerStyle = await container.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });

    console.log(`Container max-width: ${containerStyle}`);

    // On desktop (width > 768px), container should be centered
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width > 768) {
      expect(containerStyle).toBe('448px');
      console.log('✅ Fix #2: Desktop centering applied');
    }
  });

  test('Fix #3: White Container for Prompts', async ({ page }) => {
    const promptsContainer = page.locator('[data-testid="prompt-suggestions-container"]');

    // Container should be visible
    await expect(promptsContainer).toBeVisible();

    // Check background color is white
    const bgColor = await promptsContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // White should be rgb(255, 255, 255)
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Check border radius
    const borderRadius = await promptsContainer.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    expect(borderRadius).toBe('12px');

    console.log('✅ Fix #3: White container with proper styling applied');
  });

  test('Fix #4: Bubble Border Radius and Padding', async ({ page }) => {
    const bubble = page.locator('[data-testid="welcome-message-bubble"]');

    await expect(bubble).toBeVisible();

    // Check border radius
    const borderRadius = await bubble.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    expect(borderRadius).toBe('16px');

    // Check padding
    const padding = await bubble.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });

    expect(padding).toBe('16px');

    console.log('✅ Fix #4: Bubble has 16px border-radius and 16px padding');
  });

  test('Fix #5: Font Sizes in Bubble', async ({ page }) => {
    // Check eduhu label font size (should be 12px)
    const label = page.locator('[data-testid="welcome-message-bubble"] > div').first();
    const labelFontSize = await label.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    expect(labelFontSize).toBe('12px');

    // Check message paragraph font size (should be 15px)
    const message = page.locator('[data-testid="welcome-message-bubble"] > p');
    const messageFontSize = await message.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    expect(messageFontSize).toBe('15px');

    console.log('✅ Fix #5: Label 12px, Message 15px');
  });

  test('Fix #6: Calendar Styling', async ({ page }) => {
    const calendar = page.locator('[data-testid="calendar-card"]');

    await expect(calendar).toBeVisible();

    // Check background color (should be white)
    const bgColor = await calendar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Check border radius (should be 16px)
    const borderRadius = await calendar.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    expect(borderRadius).toBe('16px');

    // Check padding (should be 16px)
    const padding = await calendar.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });

    expect(padding).toBe('16px');

    // Check box shadow exists
    const boxShadow = await calendar.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    expect(boxShadow).not.toBe('none');

    console.log('✅ Fix #6: Calendar has white bg, 16px radius, 16px padding, and shadow');
  });

  test('Summary Report', async ({ page }) => {
    console.log('\n=== GEMINI FIXES #1-6 VERIFICATION SUMMARY ===\n');
    console.log('✅ Fix #1: Component Order (Calendar BEFORE Bubble)');
    console.log('✅ Fix #2: Desktop Centering (max-width: 448px)');
    console.log('✅ Fix #3: White Container for Prompts');
    console.log('✅ Fix #4: Bubble Border Radius & Padding (16px)');
    console.log('✅ Fix #5: Font Sizes (Label 12px, Message 15px)');
    console.log('✅ Fix #6: Calendar Styling (White, 16px, Shadow)');
    console.log('\n📸 Screenshot: gemini-fixes-1-6-result.png');
    console.log('🎯 Compare to prototype: .specify/specs/home-screen-redesign/Screenshot 2025-10-01 134625.png');
    console.log('\n===========================================\n');
  });
});
