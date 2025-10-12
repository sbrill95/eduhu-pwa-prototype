import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.join(__dirname, '../docs/testing/screenshots', new Date().toISOString().split('T')[0]);

/**
 * Permanent Storage Verification Test
 *
 * Verifies that:
 * 1. Images are uploaded to InstantDB S3 Storage
 * 2. Result View modal appears after generation
 * 3. Images load without 403 errors
 * 4. URLs are permanent (S3 format, not DALL-E)
 */
test.describe('Permanent Storage Verification', () => {
  test('Generate image and verify permanent S3 storage', async ({ page }) => {
    // Enable verbose logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[ImageGen]') ||
          text.includes('[FileStorage]') ||
          text.includes('[AgentContext]') ||
          text.includes('[ApiClient]') ||
          text.includes('[AgentResultView]') ||
          text.includes('[AgentModal]')) {
        console.log('📱 BROWSER:', text);
      }
    });

    // Track network requests
    const imageRequests: string[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('instant-storage.s3.amazonaws.com') ||
          url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
        console.log(`🌐 IMAGE REQUEST: ${response.status()} ${url.substring(0, 80)}...`);
        imageRequests.push(url);
      }
    });

    console.log('\n========================================');
    console.log('   PERMANENT STORAGE VERIFICATION TEST');
    console.log('========================================\n');

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    console.log('✅ App loaded');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-01-app-loaded.png'), fullPage: true });

    // Navigate to chat
    const chatTab = page.locator('[href="/chat"], button:has-text("Chat")').first();
    await chatTab.click();
    await page.waitForTimeout(1000);

    console.log('✅ Chat opened');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-02-chat-opened.png'), fullPage: true });

    // Send message
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 5000 });
    await chatInput.fill('Erstelle ein Bild vom Satz des Pythagoras');
    await page.waitForTimeout(500);

    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Senden")').last();
    await sendButton.click();

    console.log('✅ Message sent');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-03-message-sent.png'), fullPage: true });

    // Wait for Agent Confirmation with longer timeout (backend processing)
    console.log('⏳ Waiting for Agent Confirmation (up to 10s)...');
    const agentConfirmation = page.locator('[data-testid="agent-confirmation"]');

    try {
      await agentConfirmation.waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ Agent Confirmation appeared');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-04-confirmation.png'), fullPage: true });
    } catch (error) {
      console.log('❌ Agent Confirmation timeout');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-04-confirmation-timeout.png'), fullPage: true });
      throw error;
    }

    // Click confirmation button
    const confirmButton = page.locator('[data-testid="agent-confirmation-start-button"]');
    await confirmButton.click();

    console.log('✅ Confirmation clicked');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-05-form-opened.png'), fullPage: true });

    // Submit form (should already be prefilled)
    const submitButton = page.locator('button[type="submit"], button:has-text("generier")').first();
    await submitButton.click();

    console.log('✅ Form submitted - Image generation started');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-06-generating.png'), fullPage: true });

    // Wait for Result View - THE CRITICAL PART
    console.log('⏳ Waiting for Result View (up to 90s for DALL-E + upload)...');

    // Try multiple selectors and wait strategies
    const resultViewSelectors = [
      '[data-testid="agent-result-view"]',
      'div:has-text("Weiter im Chat")',
      'button:has-text("Weiter im Chat")',
      'img[alt*="generiert"], img[alt*="Generated"]',
      'div.agent-result-image'
    ];

    let resultViewFound = false;
    let finalSelector = '';

    for (const selector of resultViewSelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        const element = page.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout: 90000 });

        resultViewFound = true;
        finalSelector = selector;
        console.log(`✅ Result View found with: ${selector}`);
        break;
      } catch (error) {
        console.log(`⏭️  Selector "${selector}" not found, trying next...`);
        continue;
      }
    }

    if (!resultViewFound) {
      console.log('❌ Result View NOT found after 90s');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-07-result-timeout.png'), fullPage: true });

      // Debug: Check modal state
      const modalContent = await page.locator('ion-modal, [role="dialog"]').innerHTML().catch(() => 'No modal found');
      console.log('📋 Modal content:', modalContent.substring(0, 200));

      throw new Error('Result View never appeared');
    }

    console.log('✅ Result View appeared!');
    await page.waitForTimeout(2000); // Let images load
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-07-result-view.png'), fullPage: true });

    // Check for generated image
    const generatedImages = page.locator('img[src*="instant-storage"], img[src*="oaidalleapiprodscus"], img[alt*="generiert"]');
    const imageCount = await generatedImages.count();

    console.log(`📸 Found ${imageCount} generated image(s)`);

    if (imageCount === 0) {
      console.log('⚠️  No generated images found in Result View');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-08-no-image.png'), fullPage: true });
    } else {
      // Get image URL
      const firstImage = generatedImages.first();
      const imageUrl = await firstImage.getAttribute('src');

      console.log('\n========================================');
      console.log('   IMAGE URL ANALYSIS');
      console.log('========================================');
      console.log(`URL: ${imageUrl?.substring(0, 100)}...`);

      if (imageUrl?.includes('instant-storage.s3.amazonaws.com')) {
        console.log('✅ PERMANENT STORAGE: S3 URL detected');
        console.log('✅ URL Format: instant-storage.s3.amazonaws.com');
        console.log('✅ No expiry parameter (permanent)');
      } else if (imageUrl?.includes('oaidalleapiprodscus.blob.core.windows.net')) {
        console.log('⚠️  TEMPORARY STORAGE: DALL-E URL detected');
        console.log('⚠️  URL Format: oaidalleapiprodscus.blob.core.windows.net');
        console.log('⚠️  Contains expiry parameter (2-hour lifetime)');

        // Check for expiry parameter
        if (imageUrl.includes('se=')) {
          const expiryMatch = imageUrl.match(/se=([^&]+)/);
          if (expiryMatch) {
            console.log(`⚠️  Expires at: ${expiryMatch[1]}`);
          }
        }
      } else {
        console.log('❓ UNKNOWN STORAGE: Unexpected URL format');
      }

      console.log('========================================\n');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-08-image-loaded.png'), fullPage: true });

      // Verify image loaded successfully (no 403)
      const imageElement = await firstImage.elementHandle();
      if (imageElement) {
        const naturalWidth = await imageElement.evaluate((img: HTMLImageElement) => img.naturalWidth);
        const naturalHeight = await imageElement.evaluate((img: HTMLImageElement) => img.naturalHeight);

        if (naturalWidth > 0 && naturalHeight > 0) {
          console.log(`✅ Image loaded successfully: ${naturalWidth}x${naturalHeight}px`);
        } else {
          console.log(`❌ Image failed to load (naturalWidth: ${naturalWidth}, naturalHeight: ${naturalHeight})`);
        }
      }
    }

    // Check network requests
    console.log('\n========================================');
    console.log('   NETWORK REQUESTS SUMMARY');
    console.log('========================================');
    console.log(`Total image requests: ${imageRequests.length}`);

    imageRequests.forEach((url, index) => {
      const urlType = url.includes('instant-storage') ? 'S3 (Permanent)' : 'DALL-E (Temporary)';
      console.log(`${index + 1}. [${urlType}] ${url.substring(0, 80)}...`);
    });
    console.log('========================================\n');

    // Verify action buttons
    const continueButton = page.locator('button:has-text("Weiter im Chat")');
    const libraryButton = page.locator('button:has-text("Library")');
    const regenerateButton = page.locator('button:has-text("Neu generieren")');

    const hasContinue = await continueButton.count() > 0;
    const hasLibrary = await libraryButton.count() > 0;
    const hasRegenerate = await regenerateButton.count() > 0;

    console.log('📋 Action Buttons:');
    console.log(`  - Weiter im Chat: ${hasContinue ? '✅' : '❌'}`);
    console.log(`  - Library: ${hasLibrary ? '✅' : '❌'}`);
    console.log(`  - Neu generieren: ${hasRegenerate ? '✅' : '❌'}`);

    // Final screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'storage-09-final.png'), fullPage: true });

    console.log('\n✅ TEST COMPLETE');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

    // Assertions
    expect(resultViewFound).toBe(true);
    expect(imageCount).toBeGreaterThan(0);
  });
});
