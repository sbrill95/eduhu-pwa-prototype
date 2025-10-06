import { test, expect } from '@playwright/test';

test.describe('Image Generation - Implementation Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('1. Verify Agent Confirmation UI (Gemini Design + Button Order)', async ({ page }) => {
    // Navigate to Chat - using correct button selector from App.tsx
    const chatTab = page.locator('button:has(span:text("Chat"))');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Type image generation request - using IonInput
    const input = page.locator('ion-input input[placeholder="Nachricht schreiben..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('Erstelle ein Bild von einem Löwen für Klasse 7');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for agent confirmation
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/01-agent-confirmation-gemini.png',
      fullPage: true
    });

    // Check for Gemini gradient background
    const gradientDiv = page.locator('.bg-gradient-to-r.from-primary-50');
    const gradientExists = await gradientDiv.count() > 0;
    console.log(`\n✅ Gemini gradient background: ${gradientExists ? 'FOUND' : 'NOT FOUND'}`);

    // Check for white card
    const whiteCard = page.locator('.bg-white.rounded-xl');
    const cardExists = await whiteCard.count() > 0;
    console.log(`✅ White card: ${cardExists ? 'FOUND' : 'NOT FOUND'}`);

    // Check button order
    const buttons = page.locator('button').filter({ hasText: /Bild|Chat/i });
    const buttonCount = await buttons.count();
    console.log(`\n📊 BUTTON ANALYSIS:`);
    console.log(`Buttons found: ${buttonCount}`);

    for (let i = 0; i < Math.min(buttonCount, 2); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const bgColor = await button.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      const box = await button.boundingBox();

      console.log(`\nButton ${i + 1} (${i === 0 ? 'LEFT' : 'RIGHT'}):`);
      console.log(`  Text: "${text?.trim()}"`);
      console.log(`  Color: ${bgColor}`);
      console.log(`  Size: ${box?.width}px × ${box?.height}px`);

      if (box) {
        const meetsStandard = box.width >= 44 && box.height >= 44;
        console.log(`  Touch Standard: ${meetsStandard ? '✅ YES (≥44px)' : '❌ NO (<44px)'}`);
      }
    }

    // Verify LEFT button is PRIMARY (orange)
    const leftButton = buttons.first();
    const leftText = await leftButton.textContent();
    const leftBg = await leftButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    console.log(`\n🎯 VERIFICATION:`);
    const isPrimaryOnLeft = leftText?.includes('Bild') || leftText?.includes('erstellen');
    const isOrangeColor = leftBg.includes('251, 101, 66') || leftBg.includes('rgb(251, 101, 66)');

    console.log(`LEFT button is "Bild-Generierung": ${isPrimaryOnLeft ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log(`LEFT button is orange (#FB6542): ${isOrangeColor ? '✅ CORRECT' : '❌ WRONG (color: ' + leftBg + ')'}`);
  });

  test('2. Verify Library "Bilder" Filter', async ({ page }) => {
    // Navigate to Library - using correct button selector
    const libraryTab = page.locator('button:has(span:text("Library"))');
    await libraryTab.click();
    await page.waitForTimeout(1000);

    // Click on "MATERIALIEN" segment to show filter chips
    const materialsSegment = page.locator('ion-segment-button').filter({ hasText: /MATERIALIEN/i });
    await materialsSegment.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/02-library-filter.png',
      fullPage: true
    });

    // Check for filter chips (should be visible now)
    const allChips = page.locator('ion-chip').filter({ hasText: /Alle|Materialien|Bilder/i });
    const chipCount = await allChips.count();

    console.log(`\n📊 LIBRARY FILTER ANALYSIS:`);
    console.log(`Filter chips found: ${chipCount}`);

    for (let i = 0; i < chipCount; i++) {
      const chip = allChips.nth(i);
      const text = await chip.textContent();
      console.log(`  ${i + 1}. "${text?.trim()}"`);
    }

    // Check specifically for "Bilder"
    const bilderFilter = page.locator('ion-chip, button').filter({ hasText: /Bilder/i });
    const hasBilderFilter = (await bilderFilter.count()) > 0;

    console.log(`\n🎯 VERIFICATION:`);
    console.log(`"Bilder" filter exists: ${hasBilderFilter ? '✅ YES' : '❌ NO'}`);

    if (hasBilderFilter) {
      // Click it
      await bilderFilter.first().click();
      await page.waitForTimeout(1000);

      // Take screenshot of filtered view
      await page.screenshot({
        path: 'test-results/03-library-bilder-active.png',
        fullPage: true
      });

      console.log(`✅ "Bilder" filter clickable and active`);
    }
  });

  test('3. Check for OLD green button (should NOT appear)', async ({ page }) => {
    // Navigate to Chat - using correct button selector
    const chatTab = page.locator('button:has(span:text("Chat"))');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Trigger agent - using IonInput
    const input = page.locator('ion-input input[placeholder="Nachricht schreiben..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('Erstelle ein Bild');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(5000);

    // Check for OLD UI indicators
    const blueBackground = page.locator('[style*="backgroundColor: #E3F2FD"], [style*="background-color: rgb(227, 242, 253)"]');
    const greenButton = page.locator('button[style*="backgroundColor: #4CAF50"], button[style*="background-color: rgb(76, 175, 80)"]');

    const hasOldBg = (await blueBackground.count()) > 0;
    const hasOldButton = (await greenButton.count()) > 0;

    console.log(`\n🔍 OLD UI CHECK:`);
    console.log(`OLD blue background (#E3F2FD): ${hasOldBg ? '❌ FOUND (BAD!)' : '✅ NOT FOUND (GOOD!)'}`);
    console.log(`OLD green button (#4CAF50): ${hasOldButton ? '❌ FOUND (BAD!)' : '✅ NOT FOUND (GOOD!)'}`);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/04-no-old-ui.png',
      fullPage: true
    });

    if (hasOldBg || hasOldButton) {
      console.log(`\n⚠️  WARNING: OLD UI detected! Feature flag may not be working.`);
    } else {
      console.log(`\n✅ SUCCESS: Only NEW Gemini UI appears!`);
    }
  });

  test('4. Annotated Touch Target Measurements', async ({ page }) => {
    // Navigate to Chat - using correct button selector
    const chatTab = page.locator('button:has(span:text("Chat"))');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Trigger agent - using IonInput
    const input = page.locator('ion-input input[placeholder="Nachricht schreiben..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('Bild erstellen');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(5000);

    // Inject visual annotations
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));

      buttons.forEach((button) => {
        const box = button.getBoundingClientRect();
        if (box.width > 100 && box.height > 30) { // Only relevant buttons
          const annotation = document.createElement('div');
          annotation.style.position = 'absolute';
          annotation.style.top = `${box.top - 30}px`;
          annotation.style.left = `${box.left}px`;
          annotation.style.padding = '4px 8px';
          annotation.style.backgroundColor = box.width >= 44 && box.height >= 44 ? '#10B981' : '#EF4444';
          annotation.style.color = 'white';
          annotation.style.fontSize = '12px';
          annotation.style.fontWeight = 'bold';
          annotation.style.borderRadius = '4px';
          annotation.style.zIndex = '99999';
          annotation.style.pointerEvents = 'none';

          const text = button.textContent?.trim().substring(0, 20) || 'Button';
          annotation.textContent = `${text}: ${Math.round(box.width)}×${Math.round(box.height)}px`;

          document.body.appendChild(annotation);
        }
      });
    });

    // Take annotated screenshot
    await page.screenshot({
      path: 'test-results/05-touch-targets-annotated.png',
      fullPage: true
    });

    console.log(`\n✅ Annotated screenshot saved: Green = meets standard (≥44px), Red = too small`);
  });

  test('5. Full Page Screenshots (Current State)', async ({ page }) => {
    // Home
    await page.screenshot({
      path: 'test-results/06-home-current.png',
      fullPage: true
    });

    // Chat - using correct button selector
    const chatTab = page.locator('button:has(span:text("Chat"))');
    await chatTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'test-results/07-chat-current.png',
      fullPage: true
    });

    // Library - using correct button selector
    const libraryTab = page.locator('button:has(span:text("Library"))');
    await libraryTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'test-results/08-library-current.png',
      fullPage: true
    });

    console.log(`\n✅ All current state screenshots saved to test-results/`);
  });
});
