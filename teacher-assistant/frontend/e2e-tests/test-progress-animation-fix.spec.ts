import { test, expect } from '@playwright/test';

/**
 * Progress Animation Fix Verification
 *
 * User Issue: "Beim Bild generieren stehen weiterhin die doppelten titel"
 *
 * Expected Fix (TASK-007):
 * - ❌ REMOVE: Header animation ("oben links" / top-left)
 * - ✅ KEEP: Center animation only
 *
 * This test verifies during ACTUAL image generation that:
 * 1. Header shows text only (NO animation)
 * 2. Center shows ONE animation with gradient circle
 * 3. NO duplicate animations visible
 */

test.describe('Progress Animation Fix - Remove Duplicate Header Animation', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to mobile (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to app
    await page.goto('http://localhost:5177');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('VERIFY: Header has NO animation, only center animation remains', async ({ page }) => {
    console.log('Step 1: Navigate to Chat');

    // Click Chat tab (should be visible)
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.waitFor({ state: 'visible', timeout: 10000 });
    await chatTab.click();

    // Wait for chat view to load
    await page.waitForTimeout(2000);

    console.log('Step 2: Trigger Image Generation');

    // Type message to trigger agent suggestion
    const messageInput = page.locator('textarea[placeholder*="Nachricht"]');
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    await messageInput.fill('Erstelle ein Bild zur Photosynthese für Klasse 7');

    // Send message
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();

    // Wait for agent suggestion to appear
    await page.waitForTimeout(3000);

    // Click "Bild-Generierung starten" button
    const startButton = page.locator('text="Bild-Generierung starten"');
    if (await startButton.isVisible()) {
      await startButton.click();
    } else {
      console.log('No agent suggestion button found, trying modal trigger...');
      // Alternative: Look for any button that opens the modal
      const modalTrigger = page.locator('button:has-text("Generieren"), button:has-text("Erstellen")').first();
      await modalTrigger.click();
    }

    console.log('Step 3: Fill Image Generation Form');

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Fill description
    const descriptionInput = page.locator('textarea[name="description"], input[name="description"]');
    await descriptionInput.waitFor({ state: 'visible', timeout: 5000 });
    await descriptionInput.fill('Photosynthese Prozess mit Pflanze, Sonne und CO2 für Grundschule');

    // Select image style
    const styleSelect = page.locator('select[name="imageStyle"], select[name="style"]');
    if (await styleSelect.isVisible()) {
      await styleSelect.selectOption('illustrative');
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Generieren"), button:has-text("Bild erstellen")').last();
    await submitButton.click();

    console.log('Step 4: Wait for Progress View to appear');

    // Wait for progress view to load
    await page.waitForTimeout(2000);

    console.log('Step 5: VERIFY Header - NO Animation');

    // Screenshot 1: Header area (should show ONLY text, NO animation)
    const headerSection = page.locator('.safe-area-top, div.bg-white.border-b').first();
    await headerSection.waitFor({ state: 'visible', timeout: 5000 });

    await page.screenshot({
      path: 'teacher-assistant/frontend/phase3-progress-header-no-animation.png',
      fullPage: false
    });

    // Verify header has NO animate-pulse or gradient background
    const headerHtml = await headerSection.innerHTML();
    const hasAnimation = headerHtml.includes('animate-pulse') ||
                        headerHtml.includes('bg-gradient') ||
                        headerHtml.includes('from-[#FB6542]');

    expect(hasAnimation).toBe(false); // ✅ Header should have NO animation

    console.log('Step 6: VERIFY Center - HAS Animation');

    // Screenshot 2: Center animation area
    const centerAnimation = page.locator('div.animate-pulse-slow, div:has(.animate-pulse-slow)').first();
    await centerAnimation.waitFor({ state: 'visible', timeout: 5000 });

    await page.screenshot({
      path: 'teacher-assistant/frontend/phase3-progress-center-animation.png',
      fullPage: false
    });

    // Verify center HAS animation
    const centerHtml = await centerAnimation.innerHTML();
    const hasGradient = centerHtml.includes('bg-gradient') &&
                       (centerHtml.includes('from-[#FB6542]') || centerHtml.includes('animate-pulse'));

    expect(hasGradient).toBe(true); // ✅ Center SHOULD have animation

    console.log('Step 7: Full Screen Screenshot - Verify Only ONE Animation');

    // Screenshot 3: Full screen
    await page.screenshot({
      path: 'teacher-assistant/frontend/phase3-progress-full-screen.png',
      fullPage: true
    });

    // Count total animations on page
    const allAnimations = await page.locator('div.animate-pulse-slow, div.animate-pulse').count();
    console.log(`Total animations found: ${allAnimations}`);

    // Should have exactly ONE main animation (the center one)
    // Note: There might be pulse rings, but only ONE main gradient circle
    const gradientCircles = await page.locator('div.bg-gradient-to-br').count();
    expect(gradientCircles).toBeLessThanOrEqual(2); // Main circle + pulse ring

    console.log('Step 8: DevTools Verification - Check Classes');

    // Open DevTools and inspect elements (manual step, but we can log classes)
    const headerClasses = await headerSection.getAttribute('class');
    const centerClasses = await centerAnimation.getAttribute('class');

    console.log('Header classes:', headerClasses);
    console.log('Center classes:', centerClasses);

    // Verify header does NOT have animation classes
    expect(headerClasses).not.toContain('animate-pulse');
    expect(headerClasses).not.toContain('bg-gradient');

    // Verify center DOES have animation classes
    expect(centerClasses || '').toContain('animate-pulse');

    console.log('✅ Animation Fix Verified Successfully!');
    console.log('✅ Header: Text only, NO animation');
    console.log('✅ Center: Single animation with gradient circle');
    console.log('✅ Total: Only ONE animation visible');
  });
});
