import { test, expect } from '@playwright/test';

/**
 * E2E Test: NEW Gemini Agent Confirmation Interface
 *
 * Tests that the NEW Gemini-style agent confirmation appears when user requests
 * an image, NOT the OLD green-button interface.
 *
 * Expected Behavior:
 * 1. User types "Erstelle ein Bild von einem Löwen"
 * 2. Backend returns agentSuggestion (image-generation)
 * 3. Frontend displays NEW Gemini interface:
 *    - Gradient background (orange to teal)
 *    - White card with sparkles icon
 *    - Orange "Ja, Bild erstellen ✨" button
 *    - Gray "Weiter im Chat 💬" button
 *
 * Should NOT show:
 * - Blue background (#E3F2FD)
 * - Green "Ja, Agent starten" button
 */

test.describe('NEW Gemini Agent Confirmation Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for app to be ready (check for tab bar)
    await page.waitForSelector('ion-tab-button', { timeout: 10000 });
  });

  test('should show NEW Gemini interface for image request', async ({ page }) => {
    // 1. Click Chat tab
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    // 2. Type image request
    const textarea = page.locator('textarea[placeholder*="Nachricht"]');
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('Erstelle ein Bild von einem Löwen');

    // 3. Click Send button
    const sendButton = page.locator('button:has(ion-icon[icon="send"])');
    await sendButton.click();

    // 4. Wait for assistant response with agentSuggestion
    await page.waitForTimeout(3000); // Wait for backend response

    // 5. Take screenshot BEFORE verification
    await page.screenshot({
      path: 'teacher-assistant/frontend/test-gemini-agent-NEW-interface.png',
      fullPage: false,
    });

    // 6. Verify NEW Gemini interface appears
    // Check for gradient background (has bg-gradient-to-r class)
    const gradientCard = page.locator('.bg-gradient-to-r.from-primary-50');
    await expect(gradientCard).toBeVisible({ timeout: 5000 });

    // 7. Verify white confirmation card
    const whiteCard = page.locator('.bg-white.rounded-xl.p-4.shadow-sm');
    await expect(whiteCard).toBeVisible();

    // 8. Verify sparkles icon exists
    const sparklesIcon = page.locator('ion-icon[icon="sparkles-outline"]');
    await expect(sparklesIcon).toBeVisible();

    // 9. Verify NEW button text (should contain "Bild erstellen")
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await expect(confirmButton).toBeVisible();

    // 10. Verify button has orange background (bg-primary)
    const orangeButton = page.locator('button.bg-primary:has-text("Bild erstellen")');
    await expect(orangeButton).toBeVisible();

    // 11. CRITICAL: Verify OLD interface does NOT appear
    // OLD interface has GREEN button with text "Ja, Agent starten"
    const oldGreenButton = page.locator('button:has-text("Ja, Agent starten")');
    await expect(oldGreenButton).not.toBeVisible();

    // 12. Verify OLD blue background does NOT appear
    const oldBlueBackground = page.locator('[style*="backgroundColor: #E3F2FD"]');
    await expect(oldBlueBackground).not.toBeVisible();

    console.log('✅ NEW Gemini interface verified successfully');
  });

  test('should open AgentModal when "Ja, Bild erstellen" clicked', async ({ page }) => {
    // 1. Navigate to chat
    await page.click('ion-tab-button[tab="chat"]');
    await page.waitForTimeout(1000);

    // 2. Send image request
    const textarea = page.locator('textarea[placeholder*="Nachricht"]');
    await textarea.fill('Erstelle ein Bild von einem Baum');
    const sendButton = page.locator('button:has(ion-icon[icon="send"])');
    await sendButton.click();

    // 3. Wait for NEW Gemini confirmation
    await page.waitForTimeout(3000);

    // 4. Click "Ja, Bild erstellen" button
    const confirmButton = page.locator('button:has-text("Ja, Bild erstellen")');
    await confirmButton.click();

    // 5. Wait for AgentModal to open
    await page.waitForTimeout(1000);

    // 6. Verify AgentModal is visible
    const modal = page.locator('ion-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 7. Verify modal title contains "Bildgenerierung"
    const modalTitle = page.locator('h2:has-text("Bildgenerierung")');
    await expect(modalTitle).toBeVisible();

    // 8. Take screenshot
    await page.screenshot({
      path: 'teacher-assistant/frontend/test-gemini-modal-opened.png',
      fullPage: false,
    });

    console.log('✅ AgentModal opened successfully from NEW Gemini interface');
  });
});
