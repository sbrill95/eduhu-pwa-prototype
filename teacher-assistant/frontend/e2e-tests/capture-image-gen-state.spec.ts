import { test, expect } from '@playwright/test';

test.describe('Image Generation - Current State Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for app to fully load
  });

  test('1. Navigate to Chat and capture initial state', async ({ page }) => {
    // Click Chat tab
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Capture Chat view
    await page.screenshot({
      path: '.specify/specs/image-generation-ux-v2/screenshots/01-chat-initial.png',
      fullPage: true
    });

    console.log('✅ Chat initial state captured');
  });

  test('2. Trigger agent and capture confirmation modal', async ({ page }) => {
    // Go to Chat
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Find textarea
    const textarea = page.locator('textarea, ion-textarea textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('Erstelle ein Bild von einem Löwen für Klasse 7');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Capture confirmation modal
    await page.screenshot({
      path: '.specify/specs/image-generation-ux-v2/screenshots/02-agent-confirmation.png',
      fullPage: true
    });

    console.log('✅ Agent confirmation captured');
  });

  test('3. Measure button touch targets', async ({ page }) => {
    // Go to Chat
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Trigger agent
    const textarea = page.locator('textarea, ion-textarea textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('Erstelle ein Bild');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(3000);

    // Find all buttons in confirmation
    const buttons = page.locator('button').filter({ hasText: /Ja|Nein|Chat|starten|Bild/i });
    const count = await buttons.count();

    console.log(`\n📏 TOUCH TARGET MEASUREMENTS:\n`);

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        const text = (await button.textContent())?.trim() || 'Unknown';

        if (box) {
          const width = Math.round(box.width);
          const height = Math.round(box.height);
          const meetsStandard = width >= 44 && height >= 44;

          console.log(`Button: "${text}"`);
          console.log(`  Size: ${width}px × ${height}px`);
          console.log(`  Meets iOS Standard (44x44): ${meetsStandard ? '✅ YES' : '❌ NO'}`);

          if (!meetsStandard) {
            console.log(`  ⚠️  TOO SMALL for touch! Increase to min 44x44px`);
          }
          console.log('');
        }
      }
    }
  });

  test('4. Open agent form and capture', async ({ page }) => {
    // Go to Chat
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Trigger agent
    const textarea = page.locator('textarea, ion-textarea textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('Erstelle ein Bild zur Photosynthese');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(3000);

    // Click "Ja" button (find first visible confirmation button)
    const yesButton = page.locator('button').filter({ hasText: /Ja|starten|erstellen/i }).first();

    if (await yesButton.isVisible()) {
      await yesButton.click();
      await page.waitForTimeout(2000);

      // Capture agent form
      await page.screenshot({
        path: '.specify/specs/image-generation-ux-v2/screenshots/03-agent-form.png',
        fullPage: true
      });

      // Check if description is prefilled
      const descriptionField = page.locator('textarea[placeholder*="Beschreibung"], textarea[placeholder*="Was soll"]').first();
      if (await descriptionField.isVisible()) {
        const value = await descriptionField.inputValue();
        console.log(`\n📝 PREFILL CHECK:`);
        console.log(`Description field value: "${value}"`);
        console.log(`Expected: "Photosynthese" or similar`);
        console.log(`Is prefilled: ${value.length > 0 ? '✅ YES' : '❌ NO'}`);
      }

      console.log('✅ Agent form captured');
    }
  });

  test('5. Check Library for Bilder filter', async ({ page }) => {
    // Go to Library
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();
    await page.waitForTimeout(1000);

    // Capture Library
    await page.screenshot({
      path: '.specify/specs/image-generation-ux-v2/screenshots/04-library-current.png',
      fullPage: true
    });

    // Check for filter chips
    const filterChips = page.locator('ion-chip, button').filter({ hasText: /Alle|Materialien|Bilder/i });
    const chipCount = await filterChips.count();

    console.log(`\n🔍 LIBRARY FILTER CHECK:`);
    console.log(`Filter chips found: ${chipCount}`);

    for (let i = 0; i < chipCount; i++) {
      const chip = filterChips.nth(i);
      const text = await chip.textContent();
      console.log(`  - ${text}`);
    }

    const bilderFilter = page.locator('ion-chip, button').filter({ hasText: /Bilder/i });
    const hasBilderFilter = (await bilderFilter.count()) > 0;

    console.log(`\n"Bilder" filter exists: ${hasBilderFilter ? '✅ YES' : '❌ NO'}`);

    console.log('✅ Library captured');
  });

  test('6. Annotated screenshot with problems', async ({ page }) => {
    // Go to Chat
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Trigger agent
    const textarea = page.locator('textarea, ion-textarea textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('Erstelle ein Bild');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(3000);

    // Inject annotations via JavaScript
    await page.evaluate(() => {
      // Find all buttons
      const buttons = Array.from(document.querySelectorAll('button'));

      buttons.forEach((button, index) => {
        const box = button.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
          // Create annotation
          const annotation = document.createElement('div');
          annotation.style.position = 'absolute';
          annotation.style.top = `${box.top - 25}px`;
          annotation.style.left = `${box.left}px`;
          annotation.style.padding = '2px 6px';
          annotation.style.backgroundColor = box.width >= 44 && box.height >= 44 ? '#10B981' : '#EF4444';
          annotation.style.color = 'white';
          annotation.style.fontSize = '12px';
          annotation.style.fontWeight = 'bold';
          annotation.style.borderRadius = '4px';
          annotation.style.zIndex = '9999';
          annotation.textContent = `${Math.round(box.width)}×${Math.round(box.height)}px`;

          document.body.appendChild(annotation);
        }
      });
    });

    // Capture annotated screenshot
    await page.screenshot({
      path: '.specify/specs/image-generation-ux-v2/screenshots/05-annotated-touch-targets.png',
      fullPage: true
    });

    console.log('✅ Annotated screenshot with touch target sizes captured');
  });
});
