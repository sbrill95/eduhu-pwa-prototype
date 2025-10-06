import { test, expect } from '@playwright/test';

/**
 * Debug Test for Image Generation
 *
 * This test will capture ALL console logs to help debug the image generation issue.
 */
test('Debug Image Generation with Full Logging', async ({ page }) => {
  // Capture ALL console messages
  const consoleLogs: string[] = [];

  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleLogs.push(text);
    console.log(text);
  });

  // Capture network requests
  page.on('response', async response => {
    if (response.url().includes('/api/langgraph/agents/execute')) {
      console.log('\n=== API RESPONSE ===');
      console.log('Status:', response.status());
      try {
        const body = await response.json();
        console.log('Response Body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('Could not parse response body');
      }
      console.log('===================\n');
    }
  });

  console.log('\n🚀 Starting test...\n');

  // Navigate to app
  await page.goto('http://localhost:5178');
  await page.waitForTimeout(2000);

  console.log('\n📱 Navigating to Chat tab...\n');

  // Go to Chat tab
  await page.click('ion-tab-button[tab="chat"]');
  await page.waitForTimeout(1000);

  console.log('\n✍️ Typing message...\n');

  // Type message
  const input = page.locator('textarea, input[type="text"]').last();
  await input.fill('Erstelle ein Bild von einem Baum');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  console.log('\n✅ Confirming agent...\n');

  // Confirm agent
  const confirmButton = page.locator('button:has-text("Ja")').first();
  await confirmButton.click();
  await page.waitForTimeout(2000);

  console.log('\n📝 Filling form...\n');

  // Fill form
  const descriptionInput = page.locator('textarea[placeholder*="Beschreibe"]').first();
  await descriptionInput.fill('Ein schöner großer Baum mit grünen Blättern');
  await page.waitForTimeout(1000);

  console.log('\n🎨 Submitting for generation...\n');

  // Submit
  const generateButton = page.locator('button:has-text("Bild generieren")').first();
  await generateButton.click();

  console.log('\n⏳ Waiting for result (60 seconds max)...\n');

  // Wait up to 60 seconds and log what's happening every 5 seconds
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(5000);

    // Check current modal state
    const modalVisible = await page.locator('.agent-modal-container').isVisible();
    const formVisible = await page.locator('textarea[placeholder*="Beschreibe"]').isVisible();
    const progressVisible = await page.locator('text=Dein Bild wird erstellt').isVisible();
    const resultVisible = await page.locator('img[src*="blob.core.windows.net"]').isVisible();

    console.log(`\n[${i * 5}s] Modal State Check:`);
    console.log(`  Modal Visible: ${modalVisible}`);
    console.log(`  Form Visible: ${formVisible}`);
    console.log(`  Progress Visible: ${progressVisible}`);
    console.log(`  Result Visible: ${resultVisible}`);

    if (resultVisible) {
      console.log('\n✅ IMAGE APPEARED!\n');
      break;
    }
  }

  // Take final screenshot
  await page.screenshot({ path: 'debug-image-generation-final.png', fullPage: true });

  console.log('\n📊 Test completed. Check console logs above.\n');
  console.log('\n=== ALL CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));
  console.log('========================\n');

  // The test will pass regardless - we just want to see the logs
});
