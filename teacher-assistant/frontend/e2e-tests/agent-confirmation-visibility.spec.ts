import { test, expect, Page } from '@playwright/test';
import { setupMockServer } from './mocks/setup';

/**
 * E2E Test: User Story 1 - Agent Confirmation Card Visibility
 *
 * Tests from spec.md lines 22-32:
 * 1. Agent confirmation card visible with orange gradient background
 * 2. Card has orange border (border-primary-500)
 * 3. Card has shadow (shadow-lg)
 * 4. Both buttons visible: "Bild-Generierung starten" (orange) and "Weiter im Chat" (gray)
 * 5. Text contrast meets WCAG AA (4.5:1)
 * 6. Mobile responsive: buttons stack vertically
 *
 * Feature: Agent Confirmation UX Fixes
 * User Story: US1 (Priority: P1)
 * Spec: specs/003-agent-confirmation-ux/spec.md
 * Tasks: T006-T011
 */

test.describe('US1: Agent Confirmation Card Visibility', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    console.log('🎭 Setting up mock server...');
    await setupMockServer(page);

    console.log('🌐 Navigating to application...');
    await page.goto('/');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Navigate to Chat tab
    console.log('📍 Navigating to Chat tab...');
    const chatTab = page.locator('button[data-testid="tab-chat"], button:has-text("Chat")').first();
    await chatTab.click();
    await page.waitForTimeout(500);

    // Wait for chat interface
    await page.waitForSelector('ion-input[placeholder*="Nachricht schreiben"]', {
      state: 'visible',
      timeout: 10000
    });

    console.log('✅ Chat interface ready');
  });

  test('TC1: Agent Confirmation Card renders with orange gradient background', async () => {
    console.log('\n🎯 TEST: TC1 - Orange Gradient Background');

    // Send message requesting image generation
    const chatInput = page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.fill('Erstelle ein Bild von einem Löwen für Biologie');

    const sendButton = page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();

    // Wait for agent confirmation card
    console.log('⏳ Waiting for agent confirmation card...');
    const confirmCard = page.locator('[data-testid="agent-confirmation-card"]').first();
    await expect(confirmCard).toBeVisible({ timeout: 10000 });

    // Verify gradient background classes
    const cardClasses = await confirmCard.getAttribute('class');
    expect(cardClasses).toContain('bg-gradient-to-r');
    expect(cardClasses).toContain('from-primary-50');
    expect(cardClasses).toContain('to-primary-100');

    // Verify computed background style (should be a gradient)
    const backgroundStyle = await confirmCard.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(backgroundStyle).toContain('gradient');

    console.log('✅ TC1 PASSED: Card has orange gradient background');
  });

  test('TC2: Agent Confirmation Card has orange border and shadow', async () => {
    console.log('\n🎯 TEST: TC2 - Border and Shadow');

    // Trigger agent suggestion
    const chatInput = page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.fill('Erstelle ein Bild zur Photosynthese');

    const sendButton = page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();

    const confirmCard = page.locator('[data-testid="agent-confirmation-card"]').first();
    await expect(confirmCard).toBeVisible({ timeout: 10000 });

    // Verify border classes
    const cardClasses = await confirmCard.getAttribute('class');
    expect(cardClasses).toContain('border-2');
    expect(cardClasses).toContain('border-primary-500');

    // Verify shadow class
    expect(cardClasses).toContain('shadow-lg');

    // Verify computed border style
    const computedStyles = await confirmCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderWidth: style.borderWidth,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow
      };
    });

    // Border should be 2px (tailwind border-2)
    expect(computedStyles.borderWidth).toBe('2px');

    // Box shadow should exist (shadow-lg creates visible shadow)
    expect(computedStyles.boxShadow).not.toBe('none');
    expect(computedStyles.boxShadow.length).toBeGreaterThan(10); // Shadow has multiple values

    console.log('📊 Computed styles:', computedStyles);
    console.log('✅ TC2 PASSED: Card has border and shadow');
  });

  test('TC3: Both action buttons are visible and correctly styled', async () => {
    console.log('\n🎯 TEST: TC3 - Button Visibility and Styling');

    // Trigger agent suggestion
    const chatInput = page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.fill('Erstelle ein Bild zur Genetik');

    const sendButton = page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Verify confirm button (orange)
    console.log('🔍 Verifying confirm button...');
    const confirmButton = page.locator('[data-testid="agent-confirm-button"]').first();
    await expect(confirmButton).toBeVisible({ timeout: 10000 });

    const confirmButtonText = await confirmButton.textContent();
    expect(confirmButtonText).toContain('Bild-Generierung starten');

    // Verify confirm button styling (orange primary button)
    const confirmButtonClasses = await confirmButton.getAttribute('class');
    expect(confirmButtonClasses).toContain('bg-primary-600');
    expect(confirmButtonClasses).toContain('text-white');
    expect(confirmButtonClasses).toContain('ring-2'); // T008: Ring enhancement
    expect(confirmButtonClasses).toContain('ring-white');

    // Verify skip button (gray)
    console.log('🔍 Verifying skip button...');
    const skipButton = page.locator('[data-testid="agent-skip-button"]').first();
    await expect(skipButton).toBeVisible();

    const skipButtonText = await skipButton.textContent();
    expect(skipButtonText).toContain('Weiter im Chat');

    // Verify skip button styling (gray secondary button)
    const skipButtonClasses = await skipButton.getAttribute('class');
    expect(skipButtonClasses).toContain('bg-gray-100');
    expect(skipButtonClasses).toContain('text-gray-700');

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/us1-tc3-button-visibility.png',
      fullPage: false
    });

    console.log('✅ TC3 PASSED: Both buttons visible with correct styling');
  });

  test('TC4: Text contrast meets WCAG AA standards (4.5:1)', async () => {
    console.log('\n🎯 TEST: TC4 - Text Contrast (WCAG AA)');

    // Trigger agent suggestion
    const chatInput = page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.fill('Erstelle ein Bild zur Chemie');

    const sendButton = page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();

    const confirmCard = page.locator('[data-testid="agent-confirmation-card"]').first();
    await expect(confirmCard).toBeVisible({ timeout: 10000 });

    // Verify reasoning text contrast
    const reasoningText = page.locator('[data-testid="agent-reasoning"]').first();
    await expect(reasoningText).toBeVisible();

    const textContrast = await reasoningText.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;

      // Helper: Convert rgb(r, g, b) to relative luminance
      const getLuminance = (rgbString: string): number => {
        const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return 0;

        const [, r, g, b] = match.map(Number);
        const rsRGB = r / 255;
        const gsRGB = g / 255;
        const bsRGB = b / 255;

        const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
      };

      const textLuminance = getLuminance(color);
      const bgLuminance = getLuminance(bgColor);

      const lighter = Math.max(textLuminance, bgLuminance);
      const darker = Math.min(textLuminance, bgLuminance);

      const contrastRatio = (lighter + 0.05) / (darker + 0.05);

      return {
        textColor: color,
        bgColor: bgColor,
        contrastRatio: contrastRatio.toFixed(2)
      };
    });

    console.log('📊 Contrast analysis:', textContrast);

    // WCAG AA requires 4.5:1 for normal text
    const ratio = parseFloat(textContrast.contrastRatio);
    expect(ratio).toBeGreaterThanOrEqual(4.5);

    console.log(`✅ TC4 PASSED: Text contrast ratio is ${ratio.toFixed(2)}:1 (WCAG AA compliant)`);
  });

  test('TC5: Mobile responsive - buttons stack vertically', async ({ viewport }) => {
    console.log('\n🎯 TEST: TC5 - Mobile Responsiveness');

    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    // Trigger agent suggestion
    const chatInput = page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.fill('Erstelle ein Bild zur Physik');

    const sendButton = page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();

    const confirmCard = page.locator('[data-testid="agent-confirmation-card"]').first();
    await expect(confirmCard).toBeVisible({ timeout: 10000 });

    // Verify button container uses flex-col on mobile
    const confirmButton = page.locator('[data-testid="agent-confirm-button"]').first();
    const skipButton = page.locator('[data-testid="agent-skip-button"]').first();

    await expect(confirmButton).toBeVisible();
    await expect(skipButton).toBeVisible();

    // Get button positions
    const confirmRect = await confirmButton.boundingBox();
    const skipRect = await skipButton.boundingBox();

    if (confirmRect && skipRect) {
      // On mobile, buttons should be stacked (skip button is below confirm button)
      expect(skipRect.y).toBeGreaterThan(confirmRect.y);

      // Buttons should be roughly the same X position (left-aligned in column)
      const xDiff = Math.abs(confirmRect.x - skipRect.x);
      expect(xDiff).toBeLessThan(20); // Allow small margin

      console.log('📊 Button positions (mobile):', {
        confirm: { x: confirmRect.x, y: confirmRect.y, width: confirmRect.width },
        skip: { x: skipRect.x, y: skipRect.y, width: skipRect.width }
      });
    }

    // Verify minimum touch target size (48px height per T009)
    const confirmHeight = await confirmButton.evaluate((el) => {
      return window.getComputedStyle(el).height;
    });

    const heightValue = parseInt(confirmHeight);
    expect(heightValue).toBeGreaterThanOrEqual(48);

    // Take mobile screenshot
    await page.screenshot({
      path: 'test-results/us1-tc5-mobile-layout.png',
      fullPage: false
    });

    console.log('✅ TC5 PASSED: Buttons stack vertically on mobile');
  });

  test('TC6: Reasoning text is visible and readable', async () => {
    console.log('\n🎯 TEST: TC6 - Reasoning Text Visibility');

    // Trigger agent suggestion
    const chatInput = page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.fill('Erstelle ein Bild zur Mathematik');

    const sendButton = page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();

    // Verify reasoning text
    const reasoningText = page.locator('[data-testid="agent-reasoning"]').first();
    await expect(reasoningText).toBeVisible({ timeout: 10000 });

    const reasoningContent = await reasoningText.textContent();
    expect(reasoningContent).toBeTruthy();
    expect(reasoningContent!.length).toBeGreaterThan(10);

    console.log('📝 Reasoning text:', reasoningContent);

    // Verify text is not empty or placeholder
    expect(reasoningContent).not.toBe('...');
    expect(reasoningContent).not.toBe('Loading...');

    console.log('✅ TC6 PASSED: Reasoning text is visible and meaningful');
  });

  test('TC7: Card visually stands out from chat background', async () => {
    console.log('\n🎯 TEST: TC7 - Visual Distinction from Background');

    // Trigger agent suggestion
    const chatInput = page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.fill('Erstelle ein Bild zur Geschichte');

    const sendButton = page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();

    const confirmCard = page.locator('[data-testid="agent-confirmation-card"]').first();
    await expect(confirmCard).toBeVisible({ timeout: 10000 });

    // Verify card has all enhancement features
    const visualFeatures = await confirmCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        hasBorder: style.borderWidth !== '0px',
        borderWidth: style.borderWidth,
        hasBoxShadow: style.boxShadow !== 'none',
        boxShadow: style.boxShadow,
        hasGradient: style.backgroundImage.includes('gradient'),
        borderRadius: style.borderRadius
      };
    });

    console.log('📊 Visual features:', visualFeatures);

    // Verify enhancement requirements (T008: shadow-lg + border-2 + gradient)
    expect(visualFeatures.hasBorder).toBe(true);
    expect(visualFeatures.borderWidth).toBe('2px');
    expect(visualFeatures.hasBoxShadow).toBe(true);
    expect(visualFeatures.hasGradient).toBe(true);
    expect(visualFeatures.borderRadius).not.toBe('0px'); // Rounded corners

    // Take final screenshot for visual verification
    await page.screenshot({
      path: 'test-results/us1-tc7-visual-distinction.png',
      fullPage: true
    });

    console.log('✅ TC7 PASSED: Card has sufficient visual distinction (border + shadow + gradient)');
  });
});

/**
 * Test Summary:
 *
 * TC1: Verifies orange gradient background rendering (from-primary-50 to-primary-100)
 * TC2: Verifies border (border-2 border-primary-500) and shadow (shadow-lg)
 * TC3: Verifies both buttons are visible with correct text and styling
 * TC4: Verifies WCAG AA contrast compliance (4.5:1 minimum)
 * TC5: Verifies mobile responsiveness (buttons stack vertically, touch targets ≥48px)
 * TC6: Verifies reasoning text is visible and meaningful
 * TC7: Verifies overall visual distinction from background
 *
 * Success Criteria:
 * - SC-001: Agent Confirmation Card visible 100% of the time with correct styling
 * - FR-001 to FR-006: All functional requirements verified
 * - All 7 test cases passing = User Story 1 complete
 */
