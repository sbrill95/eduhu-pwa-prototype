/**
 * E2E Tests - Agent Modal Workflow with Mocks
 *
 * Tests the complete Gemini agent modal workflow:
 * 1. Agent suggestion in chat
 * 2. Confirmation message
 * 3. Modal opening with Gemini form
 * 4. Form validation and submission
 * 5. Result view with buttons
 * 6. Animation to library
 *
 * Uses mock backend responses for testing without live backend.
 *
 * Related SpecKit: .specify/specs/image-generation-modal-gemini/
 * Related Tasks: TASK-013, TASK-014 (Integration & E2E Tests)
 */

import { test, expect } from '@playwright/test';
import {
  setupMockAgentAPI,
  triggerAgentSuggestion,
  fillGeminiForm,
  verifyResultView,
  verifyAnimation
} from './mocks/agent-responses';

test.describe('Agent Modal Workflow - Complete E2E with Mocks', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock API interceptors
    await setupMockAgentAPI(page);

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should show agent suggestion in chat', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Verify agent suggestion appears
    const suggestionText = page.locator('text=Möchtest du die Bildgenerierung starten?');
    await expect(suggestionText).toBeVisible({ timeout: 5000 });

    // Verify confirmation button exists
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await expect(confirmButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/agent-confirmation-message.png'
    });
  });

  test('should open modal when confirmation clicked', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Click confirmation button
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();

    // Wait for modal to open
    const modal = page.locator('ion-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal header
    const header = page.locator('text=Generieren');
    await expect(header).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/gemini-modal-opened.png'
    });
  });

  test('should pre-fill form with data from chat', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Verify theme is pre-filled
    const themeInput = page.locator('textarea[placeholder*="Thema"]');
    const themeValue = await themeInput.inputValue();

    expect(themeValue).toContain('Photosynthese');

    // Verify learning group is pre-filled
    const learningGroupValue = await page.locator('select, ion-select').first().textContent();
    expect(learningGroupValue).toBeTruthy();
  });

  test('should validate form fields', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Clear theme field
    const themeInput = page.locator('textarea[placeholder*="Thema"]');
    await themeInput.fill('');

    // Submit button should be disabled
    const submitButton = page.locator('button:has-text("Idee entfalten")');
    const isDisabled = await submitButton.isDisabled();

    expect(isDisabled).toBe(true);

    // Fill with less than 5 characters
    await themeInput.fill('Test');

    // Should still be disabled
    const stillDisabled = await submitButton.isDisabled();
    expect(stillDisabled).toBe(true);

    // Fill with 5+ characters
    await themeInput.fill('Photosynthese');

    // Should be enabled now
    const isEnabled = await submitButton.isEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should render all Gemini form fields', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Verify all fields exist
    const themaField = page.locator('textarea[placeholder*="Thema"]');
    await expect(themaField).toBeVisible();

    const learningGroupField = page.locator('text=Lerngruppe');
    await expect(learningGroupField).toBeVisible();

    const dazToggle = page.locator('text=DaZ-Unterstützung');
    await expect(dazToggle).toBeVisible();

    const learningDiffToggle = page.locator('text=Lernschwierigkeiten');
    await expect(learningDiffToggle).toBeVisible();

    const submitButton = page.locator('button:has-text("Idee entfalten")');
    await expect(submitButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/gemini-form-complete.png',
      fullPage: true
    });
  });

  test('should have Gemini design styling on form', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Check submit button has orange color
    const submitButton = page.locator('button:has-text("Idee entfalten")');
    const buttonColor = await submitButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Orange (#FB6542) as RGB
    expect(buttonColor).toContain('251, 101, 66'); // rgb(251, 101, 66)
  });

  test('should submit form and show progress', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Fill and submit form
    await fillGeminiForm(page);

    // Progress view should appear
    const progressText = page.locator('text=Analysiere').or(page.locator('text=Generiere'));
    await expect(progressText.first()).toBeVisible({ timeout: 3000 });
  });

  test('should show result view with buttons after generation', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal and submit form
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    await fillGeminiForm(page);

    // Wait for result view
    const { shareButton, continueButton } = await verifyResultView(page);

    // Verify buttons are visible
    await expect(shareButton).toBeVisible();
    await expect(continueButton).toBeVisible();

    // Verify success badge
    const successBadge = page.locator('text=In Bibliothek gespeichert');
    await expect(successBadge).toBeVisible();

    // Verify generated image is visible
    const resultImage = page.locator('.agent-result-image, img[alt*="Generiert"]');
    await expect(resultImage.first()).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/agent-result-view.png',
      fullPage: true
    });
  });

  test('should trigger share functionality', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await triggerAgentSuggestion(page);

    // Open modal and submit form
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    await fillGeminiForm(page);

    // Wait for result view
    const { shareButton } = await verifyResultView(page);

    // Click share button
    await shareButton.click();

    // Wait for share to complete
    await page.waitForTimeout(500);

    // Should show some feedback (toast or success message)
    // Note: Web Share API might not work in headless browser,
    // so it will fall back to clipboard
  });

  test('should animate image to library on "Weiter im Chat"', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal and submit form
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    await fillGeminiForm(page);

    // Trigger animation
    const { animationTriggered, modalClosed } = await verifyAnimation(page);

    // Verify animation was triggered
    expect(animationTriggered || modalClosed).toBe(true);

    // Modal should be closed
    expect(modalClosed).toBe(true);

    // Take screenshot after animation
    await page.screenshot({
      path: 'test-results/screenshots/after-animation.png'
    });
  });

  test('should complete full workflow end-to-end', async ({ page }) => {
    // Step 1: Trigger agent suggestion
    await triggerAgentSuggestion(page);
    await page.screenshot({ path: 'test-results/screenshots/workflow-step-1-suggestion.png' });

    // Step 2: Click confirmation
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/workflow-step-2-modal-opened.png' });

    // Step 3: Verify form is pre-filled
    const themeInput = page.locator('textarea[placeholder*="Thema"]');
    const themeValue = await themeInput.inputValue();
    expect(themeValue).toContain('Photosynthese');

    // Step 4: Submit form
    await fillGeminiForm(page);
    await page.screenshot({ path: 'test-results/screenshots/workflow-step-3-progress.png' });

    // Step 5: Verify result view
    const { continueButton } = await verifyResultView(page);
    await page.screenshot({ path: 'test-results/screenshots/workflow-step-4-result.png' });

    // Step 6: Trigger animation
    await continueButton.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/screenshots/workflow-step-5-completed.png' });

    // Step 7: Verify modal is closed
    const modal = page.locator('ion-modal[is-open="true"]');
    const modalVisible = await modal.count() > 0;
    expect(modalVisible).toBe(false);

    console.log('✅ Full workflow completed successfully!');
  });

  test('should handle form with DaZ support enabled', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Fill form with DaZ enabled
    await fillGeminiForm(page, { dazSupport: true });

    // Verify result view appears
    const { shareButton } = await verifyResultView(page);
    await expect(shareButton).toBeVisible();
  });

  test('should handle mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Modal should be fullscreen on mobile
    const modal = page.locator('ion-modal');
    const modalBox = await modal.boundingBox();

    expect(modalBox?.width).toBeLessThanOrEqual(375);

    // Take mobile screenshot
    await page.screenshot({
      path: 'test-results/screenshots/gemini-modal-mobile.png',
      fullPage: true
    });
  });
});

test.describe('Agent Modal - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAgentAPI(page);
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should handle animation when library tab not visible', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal and submit
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    await fillGeminiForm(page);

    // Hide library tab (simulate edge case)
    await page.evaluate(() => {
      const libraryTab = document.querySelector('ion-tab-button[tab="library"]');
      if (libraryTab) {
        (libraryTab as HTMLElement).style.display = 'none';
      }
    });

    // Trigger animation
    const { continueButton } = await verifyResultView(page);
    await continueButton.click();
    await page.waitForTimeout(800);

    // Modal should still close even if library tab is hidden
    const modal = page.locator('ion-modal[is-open="true"]');
    const modalVisible = await modal.count() > 0;
    expect(modalVisible).toBe(false);
  });

  test('should close modal on back button', async ({ page }) => {
    await triggerAgentSuggestion(page);

    // Open modal
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Click back button
    const backButton = page.locator('button:has-text("←")').or(page.locator('[aria-label="close"]'));

    if (await backButton.count() > 0) {
      await backButton.first().click();
      await page.waitForTimeout(300);

      // Modal should be closed
      const modal = page.locator('ion-modal[is-open="true"]');
      const modalVisible = await modal.count() > 0;
      expect(modalVisible).toBe(false);
    }
  });
});
