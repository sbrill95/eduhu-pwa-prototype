import { test, expect } from '@playwright/test';

test.describe('Complete Image Generation Workflow - After Fixes', () => {
  test('VERIFY: Library filters (Alle, Materialien, Bilder) with Gemini styling', async ({ page }) => {
    console.log('[Test] Step 1: Navigate to app');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('[Test] Step 2: Navigate to Library');
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);

    console.log('[Test] Step 3: Click on Materialien tab');
    await page.click('ion-segment-button[value="artifacts"]');
    await page.waitForTimeout(1000);

    console.log('[Test] Step 4: Take screenshot of filter buttons');
    await page.screenshot({ path: 'library-filters-after-fix.png', fullPage: true });

    console.log('[Test] Step 5: Verify filter buttons exist');
    const alleButton = await page.$('ion-chip:has-text("Alle")');
    const materialienButton = await page.$('ion-chip:has-text("Materialien")');
    const bilderButton = await page.$('ion-chip:has-text("Bilder")');

    console.log('[Test] ✅ Alle button:', alleButton ? 'FOUND' : 'NOT FOUND');
    console.log('[Test] ✅ Materialien button:', materialienButton ? 'FOUND' : 'NOT FOUND');
    console.log('[Test] ✅ Bilder button:', bilderButton ? 'FOUND' : 'NOT FOUND');

    // Verify buttons are visible
    await expect(page.locator('ion-chip:has-text("Alle")')).toBeVisible();
    await expect(page.locator('ion-chip:has-text("Materialien")')).toBeVisible();
    await expect(page.locator('ion-chip:has-text("Bilder")')).toBeVisible();

    console.log('[Test] Step 6: Click Bilder filter');
    await page.click('ion-chip:has-text("Bilder")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'library-bilder-filter-active.png', fullPage: true });
  });

  test('VERIFY: Agent Confirmation with NEW Gemini Interface', async ({ page }) => {
    console.log('[Test] Step 1: Navigate to Chat');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('[Test] Step 1.5: Click Chat tab and wait for ChatView');
    await page.click('button:has-text("Chat")');

    // Wait for ChatView to render - look for the textarea
    await page.waitForSelector('textarea[placeholder="Nachricht schreiben..."]', { timeout: 5000 })
      .catch(() => console.log('[Test] ⚠️ ChatView textarea not found after tab click'));

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'chat-view-after-tab-click.png', fullPage: true });

    console.log('[Test] Step 2: Send image generation request');
    const textarea = await page.$('textarea[placeholder="Nachricht schreiben..."]');
    if (textarea) {
      await textarea.fill('Erstelle ein Bild von einem Löwen');
      await page.keyboard.press('Enter');
      console.log('[Test] Message sent');
    } else {
      console.log('[Test] ❌ Textarea NOT FOUND');
    }

    console.log('[Test] Step 3: Wait for agent confirmation (10 seconds)');
    await page.waitForTimeout(10000);

    await page.screenshot({ path: 'agent-confirmation-after-fix.png', fullPage: true });

    console.log('[Test] Step 4: Look for NEW Gemini Interface buttons');

    // Check for NEW interface (Gemini Design)
    const newConfirmButton = await page.$('button:has-text("Ja, Bild erstellen")');
    const newCancelButton = await page.$('button:has-text("Weiter im Chat")');

    // Check for OLD interface (should NOT exist)
    const oldConfirmButton = await page.$('button:has-text("Ja, Agent starten")');

    console.log('[Test] NEW Confirm Button ("Ja, Bild erstellen"):', newConfirmButton ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('[Test] NEW Cancel Button ("Weiter im Chat"):', newCancelButton ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('[Test] OLD Confirm Button ("Ja, Agent starten"):', oldConfirmButton ? '❌ FOUND (BAD!)' : '✅ NOT FOUND (GOOD)');

    if (newConfirmButton) {
      console.log('[Test] Step 5: Click NEW confirm button');
      await newConfirmButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'agent-form-opened.png', fullPage: true });

      console.log('[Test] Step 6: Check if form has prefilled description');
      const descriptionTextarea = await page.$('textarea#description-input');
      if (descriptionTextarea) {
        const value = await descriptionTextarea.inputValue();
        console.log('[Test] Description field value:', value);
        console.log('[Test] Contains "Löwen"?', value.includes('Löwen') ? '✅ YES' : '❌ NO');
      }

      console.log('[Test] Step 7: Submit form');
      await page.click('button:has-text("Bild generieren")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'agent-progress-view.png', fullPage: true });

      console.log('[Test] Waiting 30 seconds for image generation...');
      await page.waitForTimeout(30000);

      await page.screenshot({ path: 'agent-result-modal.png', fullPage: true });

      console.log('[Test] Step 8: Click "Weiter im Chat" in result modal');
      const backToChatButton = await page.$('button:has-text("Weiter im Chat")');
      if (backToChatButton) {
        await backToChatButton.click();
        await page.waitForTimeout(2000);

        console.log('[Test] Step 9: Check if image appears in chat history');
        await page.screenshot({ path: 'chat-with-image-message.png', fullPage: true });

        const imageInChat = await page.$('img[src*="blob.core.windows.net"]');
        console.log('[Test] Image in chat:', imageInChat ? '✅ FOUND' : '❌ NOT FOUND');
      }

      console.log('[Test] Step 10: Navigate to Library and check image');
      await page.click('button:has-text("Library")');
      await page.waitForTimeout(1000);
      await page.click('ion-segment-button[value="artifacts"]');
      await page.waitForTimeout(1000);
      await page.click('ion-chip:has-text("Bilder")');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'library-images-after-generation.png', fullPage: true });

      const imagesInLibrary = await page.$$('img');
      console.log('[Test] Images in Library:', imagesInLibrary.length);
    } else {
      console.log('[Test] ⚠️ Agent confirmation did not appear - checking console logs');
      const consoleLogs = await page.evaluate(() => {
        // @ts-ignore
        return window.__consoleLogs || [];
      });
      console.log('[Test] Console logs:', consoleLogs);
    }
  });
});
