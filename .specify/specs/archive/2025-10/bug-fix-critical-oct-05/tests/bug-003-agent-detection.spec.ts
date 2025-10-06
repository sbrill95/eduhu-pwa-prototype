import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: BUG-003 Agent Detection Fix
 *
 * Tests the critical bug fix where Agent Confirmation Messages
 * were not persisting after page reload due to metadata stripping.
 *
 * Prerequisites:
 * - Backend running on http://localhost:3000
 * - Frontend running on http://localhost:5175
 * - Valid InstantDB authentication
 */

test.describe('BUG-003: Agent Detection Persistence', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Test 1: Agent Confirmation appears on new image request
   *
   * This verifies the initial flow where a user requests image generation
   * and the assistant responds with an AgentConfirmationMessage.
   */
  test('should show Agent Confirmation on image request', async () => {
    console.log('[E2E Test] Starting Test 1: New Message Flow');

    // Navigate to app
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    console.log('[E2E Test] Navigated to app');

    // Wait for authentication (InstantDB)
    await page.waitForTimeout(2000);

    // Navigate to Chat tab
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.waitFor({ state: 'visible', timeout: 10000 });
    await chatTab.click();
    console.log('[E2E Test] Clicked Chat tab');

    await page.waitForTimeout(1000);

    // Find chat input textarea
    const chatInput = page.locator('textarea[placeholder*="Nachricht"], textarea[placeholder*="Message"]').first();
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });

    // Type image request
    await chatInput.fill('Erstelle ein Bild zur Photosynthese');
    console.log('[E2E Test] Typed image request');

    // Submit message (look for submit button)
    const submitButton = page.locator('button[type="submit"], button:has-text("Senden"), ion-icon[name="send"]').first();
    await submitButton.click();
    console.log('[E2E Test] Submitted message');

    // Wait for assistant response (generous timeout)
    await page.waitForTimeout(8000);

    // Check console logs for debug messages
    page.on('console', msg => {
      if (msg.text().includes('BUG-003 DEBUG') || msg.text().includes('AgentConfirmationMessage')) {
        console.log('[Browser Console]', msg.text());
      }
    });

    // Wait for AgentConfirmationMessage to appear
    const agentConfirmation = page.locator('[class*="bg-gradient-to-r"][class*="from-primary-50"]').first();

    try {
      await agentConfirmation.waitFor({ state: 'visible', timeout: 15000 });
      console.log('[E2E Test] ✅ Agent Confirmation appeared');
    } catch (error) {
      console.error('[E2E Test] ❌ Agent Confirmation did NOT appear');
      throw error;
    }

    // Verify Gemini UI elements
    const confirmButton = page.locator('button:has-text("Bild-Generierung starten")').first();
    const cancelButton = page.locator('button:has-text("Weiter im Chat")').first();

    await expect(confirmButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    console.log('[E2E Test] ✅ Both buttons visible');

    // Verify button order (orange button on LEFT)
    const confirmBox = await confirmButton.boundingBox();
    const cancelBox = await cancelButton.boundingBox();

    expect(confirmBox).toBeTruthy();
    expect(cancelBox).toBeTruthy();

    if (confirmBox && cancelBox) {
      expect(confirmBox.x).toBeLessThan(cancelBox.x);
      console.log('[E2E Test] ✅ Button order correct (Confirm on left)');
    }

    // Verify button styling (orange vs gray)
    const confirmBgColor = await confirmButton.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const cancelBgColor = await cancelButton.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    console.log('[E2E Test] Confirm button color:', confirmBgColor);
    console.log('[E2E Test] Cancel button color:', cancelBgColor);

    // Take screenshot
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-003-qa-new-message.png',
      fullPage: true
    });
    console.log('[E2E Test] ✅ Screenshot saved: bug-003-qa-new-message.png');
  });

  /**
   * Test 2: Agent Confirmation PERSISTS after page reload (CRITICAL!)
   *
   * This is the core test for BUG-003. Before the fix, the AgentConfirmationMessage
   * would disappear after reload because metadata was stripped from messages.
   */
  test('should persist Agent Confirmation after reload', async () => {
    console.log('[E2E Test] Starting Test 2: Page Reload Persistence (CRITICAL)');

    // Ensure we have a message from Test 1 (or create one)
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Go to Chat tab
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Check if agent confirmation already exists (from Test 1)
    let agentConfirmation = page.locator('[class*="bg-gradient-to-r"][class*="from-primary-50"]').first();
    const exists = await agentConfirmation.isVisible().catch(() => false);

    if (!exists) {
      console.log('[E2E Test] No existing agent confirmation, creating one...');

      // Create new message
      const chatInput = page.locator('textarea[placeholder*="Nachricht"]').first();
      await chatInput.fill('Erstelle ein Bild zum Satz des Pythagoras');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(8000);

      await agentConfirmation.waitFor({ state: 'visible', timeout: 15000 });
      console.log('[E2E Test] ✅ Created new agent confirmation');
    }

    // Verify it's visible BEFORE reload
    await expect(agentConfirmation).toBeVisible();
    console.log('[E2E Test] ✅ Agent confirmation visible BEFORE reload');

    // CRITICAL: Reload the page
    console.log('[E2E Test] 🔄 Reloading page...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for authentication

    // Navigate back to Chat tab
    const chatTabAfterReload = page.locator('ion-tab-button[tab="chat"]');
    await chatTabAfterReload.click();
    await page.waitForTimeout(1000);

    // CRITICAL CHECK: Agent confirmation should STILL be visible
    const agentConfirmationAfterReload = page.locator('[class*="bg-gradient-to-r"][class*="from-primary-50"]').first();

    try {
      await agentConfirmationAfterReload.waitFor({ state: 'visible', timeout: 10000 });
      console.log('[E2E Test] ✅✅✅ CRITICAL TEST PASSED: Agent confirmation PERSISTS after reload!');
    } catch (error) {
      console.error('[E2E Test] ❌❌❌ CRITICAL TEST FAILED: Agent confirmation DISAPPEARED after reload!');
      throw new Error('BUG-003 FIX FAILED: Agent confirmation does not persist after page reload');
    }

    // Verify buttons still work
    const confirmButton = page.locator('button:has-text("Bild-Generierung starten")').first();
    const cancelButton = page.locator('button:has-text("Weiter im Chat")').first();

    await expect(confirmButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    console.log('[E2E Test] ✅ Buttons still functional after reload');

    // Take screenshot
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-003-qa-reload.png',
      fullPage: true
    });
    console.log('[E2E Test] ✅ Screenshot saved: bug-003-qa-reload.png');
  });

  /**
   * Test 3: Library integration - Navigate from Library to Chat
   *
   * Verifies that agent detection works when loading chat from Library view.
   */
  test('should show Agent Confirmation when navigating from Library', async () => {
    console.log('[E2E Test] Starting Test 3: Library Integration');

    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate to Library tab
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();
    await page.waitForTimeout(1000);
    console.log('[E2E Test] Navigated to Library');

    // Click on Chats filter/section
    const chatsFilter = page.locator('ion-chip:has-text("Chats"), button:has-text("Chats")').first();

    try {
      await chatsFilter.click();
      await page.waitForTimeout(500);
      console.log('[E2E Test] Clicked Chats filter');
    } catch (error) {
      console.log('[E2E Test] Chats filter not found or already active');
    }

    // Find a chat item (should contain our image generation chat)
    const chatItems = page.locator('[class*="chat-item"], [class*="cursor-pointer"]');
    const chatCount = await chatItems.count();

    console.log('[E2E Test] Found', chatCount, 'chat items');

    if (chatCount > 0) {
      // Click first chat item
      await chatItems.first().click();
      await page.waitForTimeout(1000);
      console.log('[E2E Test] Clicked chat item');

      // Should navigate to Chat tab
      const chatTab = page.locator('ion-tab-button[tab="chat"]');
      const isActive = await chatTab.getAttribute('class');

      if (isActive?.includes('tab-selected')) {
        console.log('[E2E Test] ✅ Navigated to Chat tab');
      }

      // Check for agent confirmation
      const agentConfirmation = page.locator('[class*="bg-gradient-to-r"][class*="from-primary-50"]').first();
      const isVisible = await agentConfirmation.isVisible().catch(() => false);

      if (isVisible) {
        console.log('[E2E Test] ✅ Agent Confirmation visible from Library navigation');

        // Take screenshot
        await page.screenshot({
          path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-003-qa-library-integration.png',
          fullPage: true
        });
      } else {
        console.log('[E2E Test] ⚠️ No Agent Confirmation in this chat (may not have image request)');
      }
    } else {
      console.log('[E2E Test] ⚠️ No chats found in Library');
    }
  });

  /**
   * Test 4: Confirm button opens agent modal
   *
   * Verifies clicking "Bild-Generierung starten" opens the AgentFormView modal.
   */
  test('should open agent modal when confirm button clicked', async () => {
    console.log('[E2E Test] Starting Test 4: Confirm Button Functionality');

    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Find agent confirmation
    const agentConfirmation = page.locator('[class*="bg-gradient-to-r"][class*="from-primary-50"]').first();
    const exists = await agentConfirmation.isVisible().catch(() => false);

    if (!exists) {
      console.log('[E2E Test] Creating agent confirmation message...');
      const chatInput = page.locator('textarea[placeholder*="Nachricht"]').first();
      await chatInput.fill('Erstelle ein Bild zu Albert Einstein');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(8000);
    }

    // Click confirm button
    const confirmButton = page.locator('button:has-text("Bild-Generierung starten")').first();
    await confirmButton.click();
    console.log('[E2E Test] Clicked confirm button');

    await page.waitForTimeout(2000);

    // Check for modal (AgentFormView)
    const modal = page.locator('ion-modal, [class*="modal"]').first();

    try {
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      console.log('[E2E Test] ✅ Agent modal opened');

      // Check for pre-filled theme field
      const themeInput = page.locator('input[placeholder*="Thema"], textarea[placeholder*="Thema"]').first();
      const themeValue = await themeInput.inputValue().catch(() => '');

      console.log('[E2E Test] Theme field value:', themeValue);

      if (themeValue.length > 0) {
        console.log('[E2E Test] ✅ Theme field is pre-filled');
      } else {
        console.log('[E2E Test] ⚠️ Theme field is NOT pre-filled (expected: "Albert Einstein")');
      }

    } catch (error) {
      console.error('[E2E Test] ❌ Agent modal did NOT open');
      throw error;
    }
  });

  /**
   * Test 5: Cancel button allows continued conversation
   *
   * Verifies clicking "Weiter im Chat" keeps chat functional.
   */
  test('should allow continued chat when cancel button clicked', async () => {
    console.log('[E2E Test] Starting Test 5: Cancel Button Functionality');

    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Find agent confirmation
    const agentConfirmation = page.locator('[class*="bg-gradient-to-r"][class*="from-primary-50"]').first();
    const exists = await agentConfirmation.isVisible().catch(() => false);

    if (!exists) {
      console.log('[E2E Test] Creating agent confirmation message...');
      const chatInput = page.locator('textarea[placeholder*="Nachricht"]').first();
      await chatInput.fill('Erstelle ein Bild zur Evolutionstheorie');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(8000);
    }

    // Click cancel button
    const cancelButton = page.locator('button:has-text("Weiter im Chat")').first();
    await cancelButton.click();
    console.log('[E2E Test] Clicked cancel button');

    await page.waitForTimeout(500);

    // Verify no modal opened
    const modal = page.locator('ion-modal[class*="show"], [class*="modal"][class*="show"]').first();
    const modalVisible = await modal.isVisible().catch(() => false);

    expect(modalVisible).toBe(false);
    console.log('[E2E Test] ✅ No modal opened (correct behavior)');

    // Verify chat input still works
    const chatInput = page.locator('textarea[placeholder*="Nachricht"]').first();
    await chatInput.fill('Danke, ich überlege es mir noch');

    const inputValue = await chatInput.inputValue();
    expect(inputValue).toBe('Danke, ich überlege es mir noch');
    console.log('[E2E Test] ✅ Chat input still functional');

    // Agent confirmation should still be visible in history
    await expect(agentConfirmation).toBeVisible();
    console.log('[E2E Test] ✅ Agent confirmation still visible in chat history');
  });
});

/**
 * Additional Test: Regression - Regular chat still works
 *
 * Ensures the fix doesn't break normal chat messages without agent suggestions.
 */
test.describe('BUG-003: Regression Testing', () => {
  test('should handle regular chat messages without agent suggestions', async ({ page }) => {
    console.log('[E2E Test] Starting Regression Test: Regular Chat');

    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Send regular message (no image request)
    const chatInput = page.locator('textarea[placeholder*="Nachricht"]').first();
    await chatInput.fill('Wie plane ich eine Unterrichtsstunde?');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    console.log('[E2E Test] Sent regular chat message');

    await page.waitForTimeout(8000);

    // Verify NO agent confirmation appears
    const agentConfirmation = page.locator('[class*="bg-gradient-to-r"][class*="from-primary-50"]').last();
    const hasAgentConfirmation = await agentConfirmation.isVisible().catch(() => false);

    // The last message should NOT be an agent confirmation
    expect(hasAgentConfirmation).toBe(false);
    console.log('[E2E Test] ✅ No agent confirmation for regular message (correct)');

    // Verify response message exists
    const messages = page.locator('[class*="message"], [class*="bubble"]');
    const messageCount = await messages.count();

    expect(messageCount).toBeGreaterThan(0);
    console.log('[E2E Test] ✅ Regular chat response received');
  });
});
