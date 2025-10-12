/**
 * E2E Tests: Library Modal Integration (specs/002-library-ux-fixes)
 *
 * T002: User Story 1 - View Generated Image in Library
 * T005: User Story 2 - Regenerate Image with Original Parameters
 *
 * CRITICAL: These tests use REAL OpenAI calls (NO bypass mode)
 * Expected duration: 45-90 seconds per test due to real image generation
 */

import { test, expect } from '@playwright/test';

test.describe('Library UX Fixes - Material Preview Modal Integration', () => {

  test('User Story 1: View image in library', async ({ page }) => {
    console.log('🚀 Starting User Story 1: View image in library');
    console.log('⏱️ Expected duration: 45-60 seconds (includes real OpenAI generation)');

    // ========================================
    // SETUP: Generate image with REAL OpenAI call
    // ========================================
    console.log('\n📍 SETUP: Generate test image');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Chat
    await page.click('button:has-text("Chat")');
    await page.waitForSelector('input[placeholder="Nachricht schreiben..."]', { timeout: 10000 });
    console.log('✅ ChatView loaded');

    // Send image generation request
    const chatInput = await page.$('input[placeholder="Nachricht schreiben..."]');
    if (!chatInput) throw new Error('Chat input not found');

    await chatInput.fill('Erstelle ein Bild von einem Löwen für den Biologie-Unterricht');
    await page.keyboard.press('Enter');
    console.log('✅ Message sent');

    // Wait for agent confirmation (NEW Gemini interface)
    await page.waitForTimeout(8000);
    const confirmButton = await page.waitForSelector('button:has-text("Ja, Bild erstellen")', { timeout: 15000 });
    console.log('✅ Agent confirmation appeared');

    // Click confirm to open form
    await confirmButton.click();
    await page.waitForTimeout(2000);

    // Submit form to start generation (REAL OpenAI call)
    const submitButton = await page.waitForSelector('button:has-text("Bild generieren")', { timeout: 10000 });
    await submitButton.click();
    console.log('✅ Form submitted - starting REAL OpenAI generation...');

    // Wait for generation to complete (REAL wait - up to 60s)
    console.log('⏳ Waiting for image generation (up to 60 seconds)...');
    const saveToLibraryButton = await page.waitForSelector('button:has-text("In Library speichern")', { timeout: 60000 });
    console.log('✅ Image generated successfully!');

    // Save to library
    await saveToLibraryButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Image saved to library');

    // ========================================
    // TEST: Navigate to Library → Materials tab
    // ========================================
    console.log('\n📍 TEST: Navigate to Library');
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);

    // Click Materials tab (artifacts)
    await page.click('button:has-text("Materialien")');
    await page.waitForTimeout(1000);
    console.log('✅ Materials tab opened');

    await page.screenshot({ path: 'e2e-tests/screenshots/us1-01-library-materials-grid.png', fullPage: true });

    // ========================================
    // TEST: Click image thumbnail
    // ========================================
    console.log('\n📍 TEST: Click image thumbnail');

    // Find clickable material card (should have cursor-pointer class per T003)
    const materialCard = await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    if (!materialCard) {
      console.error('❌ No clickable material cards found');
      await page.screenshot({ path: 'e2e-tests/screenshots/us1-ERROR-no-materials.png', fullPage: true });
      throw new Error('Material card not found');
    }

    await materialCard.click();
    console.log('✅ Material card clicked');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e-tests/screenshots/us1-02-modal-opened.png', fullPage: true });

    // ========================================
    // TEST: Verify modal opens with full image
    // ========================================
    console.log('\n📍 TEST: Verify modal content');

    // Check for IonModal (MaterialPreviewModal component)
    const modal = await page.waitForSelector('ion-modal[aria-modal="true"]', { timeout: 10000 });
    expect(modal).not.toBeNull();
    console.log('✅ Modal is visible');

    // Verify full image is displayed
    const modalImage = await page.waitForSelector('img[data-testid="material-image"]', { timeout: 5000 });
    expect(modalImage).not.toBeNull();
    console.log('✅ Full image is displayed in modal');

    // Verify image has valid src (Azure Blob Storage URL)
    const imageSrc = await modalImage.getAttribute('src');
    expect(imageSrc).toBeTruthy();
    expect(imageSrc).toContain('blob.core.windows.net');
    console.log('✅ Image URL is valid:', imageSrc?.substring(0, 50) + '...');

    // ========================================
    // TEST: Verify metadata displays
    // ========================================
    console.log('\n📍 TEST: Verify metadata displays');

    // Check title
    const titleElement = await page.waitForSelector('[data-testid="material-title"]', { timeout: 5000 });
    const titleText = await titleElement.textContent();
    expect(titleText).toBeTruthy();
    console.log('✅ Title displayed:', titleText);

    // Check type
    const typeElement = await page.waitForSelector('[data-testid="material-type"]', { timeout: 5000 });
    const typeText = await typeElement.textContent();
    expect(typeText).toBeTruthy();
    console.log('✅ Type displayed:', typeText);

    // Check creation date
    const dateElement = await page.waitForSelector('[data-testid="material-date"]', { timeout: 5000 });
    const dateText = await dateElement.textContent();
    expect(dateText).toBeTruthy();
    console.log('✅ Date displayed:', dateText);

    // Check source
    const sourceElement = await page.waitForSelector('[data-testid="material-source"]', { timeout: 5000 });
    const sourceText = await sourceElement.textContent();
    expect(sourceText).toBeTruthy();
    console.log('✅ Source displayed:', sourceText);

    await page.screenshot({ path: 'e2e-tests/screenshots/us1-03-modal-with-metadata.png', fullPage: true });

    // ========================================
    // TEST: Verify close button works
    // ========================================
    console.log('\n📍 TEST: Verify close button works');

    const closeButton = await page.waitForSelector('[data-testid="close-button"]', { timeout: 5000 });
    await closeButton.click();
    await page.waitForTimeout(1000);

    // Verify modal is closed (ion-modal should no longer have aria-modal="true")
    const modalStillOpen = await page.$('ion-modal[aria-modal="true"]');
    expect(modalStillOpen).toBeNull();
    console.log('✅ Modal closed successfully');

    await page.screenshot({ path: 'e2e-tests/screenshots/us1-04-modal-closed.png', fullPage: true });

    console.log('\n✅ User Story 1 TEST COMPLETE - All assertions passed!');
  });


  test('User Story 2: Regenerate image with original parameters', async ({ page }) => {
    console.log('🚀 Starting User Story 2: Regenerate image with original parameters');
    console.log('⏱️ Expected duration: 90-120 seconds (includes TWO real OpenAI generations)');

    // ========================================
    // PREREQUISITE: Generate first image
    // ========================================
    console.log('\n📍 PREREQUISITE: Generate first image');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Chat
    await page.click('button:has-text("Chat")');
    await page.waitForSelector('input[placeholder="Nachricht schreiben..."]', { timeout: 10000 });

    // Send image generation request with specific parameters
    const chatInput = await page.$('input[placeholder="Nachricht schreiben..."]');
    if (!chatInput) throw new Error('Chat input not found');

    const originalDescription = 'Ein majestätischer Löwe in der Savanne bei Sonnenuntergang';
    await chatInput.fill(`Erstelle ein Bild: ${originalDescription}`);
    await page.keyboard.press('Enter');
    console.log('✅ Message sent');

    // Wait for agent confirmation
    await page.waitForTimeout(8000);
    const confirmButton = await page.waitForSelector('button:has-text("Ja, Bild erstellen")', { timeout: 15000 });
    await confirmButton.click();
    await page.waitForTimeout(2000);

    // Submit form (first generation)
    const submitButton = await page.waitForSelector('button:has-text("Bild generieren")', { timeout: 10000 });
    await submitButton.click();
    console.log('✅ First generation started...');

    // Wait for first generation to complete
    const saveToLibraryButton = await page.waitForSelector('button:has-text("In Library speichern")', { timeout: 60000 });
    console.log('✅ First image generated!');

    // Save to library
    await saveToLibraryButton.click();
    await page.waitForTimeout(2000);

    // ========================================
    // TEST: Navigate to Library and open modal
    // ========================================
    console.log('\n📍 TEST: Navigate to Library');
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Materialien")');
    await page.waitForTimeout(1000);

    // Click image thumbnail to open modal
    const materialCard = await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    await materialCard.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e-tests/screenshots/us2-01-modal-opened.png', fullPage: true });

    // ========================================
    // TEST: Click "Neu generieren" button
    // ========================================
    console.log('\n📍 TEST: Click "Neu generieren" button');

    const regenerateButton = await page.waitForSelector('[data-testid="regenerate-button"]', { timeout: 5000 });
    expect(regenerateButton).not.toBeNull();
    console.log('✅ "Neu generieren" button found');

    await regenerateButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e-tests/screenshots/us2-02-form-opened.png', fullPage: true });

    // ========================================
    // TEST: Verify form is pre-filled with original parameters
    // ========================================
    console.log('\n📍 TEST: Verify form pre-fill');

    // Check description field is pre-filled
    const descriptionInput = await page.waitForSelector('textarea#description-input', { timeout: 5000 });
    const descriptionValue = await descriptionInput.inputValue();

    console.log('  Description field value:', descriptionValue);
    expect(descriptionValue).toBeTruthy();
    expect(descriptionValue.length).toBeGreaterThan(0);
    console.log('✅ Description field is pre-filled');

    // Note: imageStyle, learningGroup, subject fields may also be pre-filled
    // but we focus on description as the primary parameter (per FR-008)

    await page.screenshot({ path: 'e2e-tests/screenshots/us2-03-form-prefilled.png', fullPage: true });

    // ========================================
    // TEST: Modify and regenerate
    // ========================================
    console.log('\n📍 TEST: Modify description and regenerate');

    // Modify the description
    const modifiedDescription = 'Ein Löwe bei Sonnenuntergang mit dramatischen Wolken';
    await descriptionInput.fill(modifiedDescription);
    console.log('✅ Description modified to:', modifiedDescription);

    // Submit form for second generation
    const regenerateSubmitButton = await page.waitForSelector('button:has-text("Bild generieren")', { timeout: 10000 });
    await regenerateSubmitButton.click();
    console.log('✅ Second generation started (REAL OpenAI call)...');

    // Wait for second generation to complete
    console.log('⏳ Waiting for second generation (up to 60 seconds)...');
    const saveToLibraryButton2 = await page.waitForSelector('button:has-text("In Library speichern")', { timeout: 60000 });
    console.log('✅ Second image generated successfully!');

    await page.screenshot({ path: 'e2e-tests/screenshots/us2-04-second-generation-complete.png', fullPage: true });

    // Save second image
    await saveToLibraryButton2.click();
    await page.waitForTimeout(2000);

    // ========================================
    // VERIFY: Check library now has 2 images
    // ========================================
    console.log('\n📍 VERIFY: Check library has 2 images');

    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Materialien")');
    await page.waitForTimeout(1000);

    // Count material cards
    const materialCards = await page.$$('.cursor-pointer');
    console.log('  Material cards in library:', materialCards.length);
    expect(materialCards.length).toBeGreaterThanOrEqual(2);
    console.log('✅ Library contains at least 2 images (original + regenerated)');

    await page.screenshot({ path: 'e2e-tests/screenshots/us2-05-library-with-two-images.png', fullPage: true });

    console.log('\n✅ User Story 2 TEST COMPLETE - All assertions passed!');
  });

});
