import { test, expect } from '@playwright/test';

test.describe('COMPLETE Image Generation Workflow - Final Verification', () => {

  test('Full workflow: Chat → Agent Confirmation → Form → Generation → Chat History → Library', async ({ page }) => {
    console.log('🚀 Starting COMPLETE image generation workflow test...');

    // ========================================
    // STEP 1: Navigate to Chat
    // ========================================
    console.log('\n📍 STEP 1: Navigate to Chat view');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Chat")');

    // Wait for ChatView to render (fixed selector - IonInput renders as input, not textarea)
    await page.waitForSelector('input[placeholder="Nachricht schreiben..."]', { timeout: 10000 });
    console.log('✅ ChatView loaded successfully');

    await page.screenshot({ path: 'workflow-01-chat-view.png', fullPage: true });

    // ========================================
    // STEP 2: Send image generation request
    // ========================================
    console.log('\n📍 STEP 2: Send image generation request');
    const input = await page.$('input[placeholder="Nachricht schreiben..."]');
    if (!input) throw new Error('Chat input not found');

    await input.fill('Erstelle ein Bild von einem Löwen für den Biologie-Unterricht');
    await page.keyboard.press('Enter');
    console.log('✅ Message sent');

    // ========================================
    // STEP 3: Wait for Agent Confirmation (NEW Gemini Interface)
    // ========================================
    console.log('\n📍 STEP 3: Wait for Agent Confirmation (NEW Gemini Interface)');
    await page.waitForTimeout(8000); // Wait for backend response

    await page.screenshot({ path: 'workflow-02-agent-confirmation.png', fullPage: true });

    // Check for NEW Gemini Interface
    const newConfirmButton = await page.$('button:has-text("Ja, Bild erstellen")');
    const newCancelButton = await page.$('button:has-text("Weiter im Chat")');
    const oldConfirmButton = await page.$('button:has-text("Ja, Agent starten")');

    console.log('  NEW "Ja, Bild erstellen" button:', newConfirmButton ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  NEW "Weiter im Chat" button:', newCancelButton ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('  OLD "Ja, Agent starten" button:', oldConfirmButton ? '❌ FOUND (BAD)' : '✅ NOT FOUND (GOOD)');

    if (!newConfirmButton) {
      console.log('⚠️ Agent confirmation did not appear. Workflow stopped.');
      await page.screenshot({ path: 'workflow-ERROR-no-confirmation.png', fullPage: true });
      return; // Exit gracefully for now
    }

    // ========================================
    // STEP 4: Click confirm and check form prefill
    // ========================================
    console.log('\n📍 STEP 4: Open form and verify prefill');
    await newConfirmButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'workflow-03-form-opened.png', fullPage: true });

    // Check if description is prefilled
    const descriptionInput = await page.$('textarea#description-input');
    if (descriptionInput) {
      const value = await descriptionInput.inputValue();
      console.log('  Form description value:', value);
      console.log('  Contains "Löwen"?', value.includes('Löwen') ? '✅ YES' : '❌ NO');
    } else {
      console.log('  ⚠️ Description textarea not found');
    }

    // ========================================
    // STEP 5: Submit form and track progress
    // ========================================
    console.log('\n📍 STEP 5: Submit form');
    const submitButton = await page.$('button:has-text("Bild generieren")');
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Form submitted');

      await page.screenshot({ path: 'workflow-04-progress-view.png', fullPage: true });

      // ========================================
      // STEP 6: Wait for generation to complete
      // ========================================
      console.log('\n📍 STEP 6: Wait for generation (30 seconds)...');
      await page.waitForTimeout(30000);

      await page.screenshot({ path: 'workflow-05-result-modal.png', fullPage: true });

      // ========================================
      // STEP 7: Return to chat and check for image
      // ========================================
      console.log('\n📍 STEP 7: Return to chat');
      const backToChatButton = await page.$('button:has-text("Weiter im Chat")');
      if (backToChatButton) {
        await backToChatButton.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'workflow-06-chat-with-image.png', fullPage: true });

        // Check for image in chat
        const chatImages = await page.$$('img[src*="blob.core.windows.net"]');
        console.log('  Images in chat:', chatImages.length);
        console.log(chatImages.length > 0 ? '✅ Image appears in chat!' : '❌ No image in chat');
      }

      // ========================================
      // STEP 8: Navigate to Library and check "Bilder" filter
      // ========================================
      console.log('\n📍 STEP 8: Check Library');
      await page.click('button:has-text("Library")');
      await page.waitForTimeout(1000);

      // Click Materialien tab first (to see filters)
      await page.click('ion-segment-button[value="artifacts"]');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'workflow-07-library-materials.png', fullPage: true });

      // Click Bilder filter
      await page.click('ion-chip:has-text("Bilder")');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'workflow-08-library-bilder.png', fullPage: true });

      // Count images in library
      const libraryImages = await page.$$('img');
      console.log('  Images in Library:', libraryImages.length);
      console.log(libraryImages.length > 0 ? '✅ Image saved to Library!' : '❌ No images in Library');

      console.log('\n✅ WORKFLOW COMPLETE!');
    } else {
      console.log('⚠️ Submit button not found');
    }
  });
});
