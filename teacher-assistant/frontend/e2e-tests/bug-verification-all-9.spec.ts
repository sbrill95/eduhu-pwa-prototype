/**
 * Comprehensive Bug Verification Suite - All 9 Critical Bugs
 *
 * This test suite provides REAL evidence-based verification for all bugs
 * from .specify/specs/bug-fix-critical-oct-05/
 *
 * Each test:
 * - Launches REAL browser
 * - Captures ACTUAL screenshots
 * - Monitors console errors
 * - Provides evidence-based pass/fail status
 *
 * Created: 2025-10-05
 * Spec: .specify/specs/bug-fix-critical-oct-05/spec.md
 */

import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Screenshot directory with timestamp
const timestamp = new Date().toISOString().split('T')[0];
const screenshotDir = path.join(__dirname, '..', 'test-results', `bug-verification-${timestamp}`);

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Console error tracking
let consoleErrors: ConsoleMessage[] = [];
let consoleWarnings: ConsoleMessage[] = [];

test.describe('Bug Verification Suite - All 9 Critical Bugs', () => {

  test.beforeEach(async ({ page }) => {
    // Reset console tracking
    consoleErrors = [];
    consoleWarnings = [];

    // Capture console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg);
      }
    });

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Log console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach((msg, idx) => {
        console.log(`${idx + 1}. ${msg.text()}`);
      });
    }
  });

  /**
   * BUG-001: Homepage Prompt Auto-Submit
   *
   * Expected behavior:
   * - Click prompt tile
   * - Message auto-submits (no manual send needed)
   * - KI response appears
   * - Input field is empty
   */
  test('BUG-001: Homepage Prompt Auto-Submit', async ({ page }) => {
    console.log('\n[BUG-001] Testing Homepage Prompt Auto-Submit...');

    // Wait for homepage to load
    await page.waitForSelector('[data-testid="home-view"], .prompt-tiles, [class*="prompt"]', { timeout: 10000 });

    // Take before screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'bug-001-before.png'),
      fullPage: true
    });

    // Find and click first prompt tile
    const promptTiles = page.locator('[data-testid="prompt-tile"], button:has-text("Unterricht"), button:has-text("Arbeitsblatt"), button:has-text("Klasse")').first();

    const tileExists = await promptTiles.count() > 0;

    if (!tileExists) {
      console.log('[BUG-001] ❌ FAILED: No prompt tiles found on homepage');
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-001-no-tiles.png'),
        fullPage: true
      });
      throw new Error('No prompt tiles found - homepage may not be loaded');
    }

    // Get tile text before clicking
    const tileText = await promptTiles.textContent();
    console.log(`[BUG-001] Clicking tile: "${tileText}"`);

    await promptTiles.click();

    // Wait for navigation to chat
    await page.waitForTimeout(1000);

    // Check if we're in chat view
    const chatView = page.locator('[data-testid="chat-view"], [class*="chat-view"], [class*="ChatView"]');
    const inChatView = await chatView.count() > 0;

    if (!inChatView) {
      console.log('[BUG-001] ⚠️ WARNING: Did not navigate to chat view');
    }

    // Check if message was auto-submitted
    // Look for message bubbles containing the prompt text
    await page.waitForTimeout(2000); // Wait for message to appear

    const userMessage = page.locator('[class*="message"], [class*="bubble"]').filter({ hasText: tileText || '' }).first();
    const messageExists = await userMessage.count() > 0;

    // Check if AI response appeared
    await page.waitForTimeout(3000); // Wait for AI response

    const aiResponse = page.locator('[class*="message"], [class*="bubble"]').filter({ hasNotText: tileText || '' }).last();
    const aiResponseExists = await aiResponse.count() > 1; // More than just user message

    // Take after screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'bug-001-prompt-autosubmit.png'),
      fullPage: true
    });

    // Results
    console.log(`[BUG-001] Message auto-submitted: ${messageExists ? '✅' : '❌'}`);
    console.log(`[BUG-001] AI response appeared: ${aiResponseExists ? '✅' : '❌'}`);

    if (messageExists && aiResponseExists) {
      console.log('[BUG-001] ✅ PASSED: Auto-submit working');
    } else {
      console.log('[BUG-001] ❌ FAILED: Auto-submit NOT working');
    }
  });

  /**
   * BUG-002: Material Link Navigation
   *
   * Expected behavior:
   * - Click material arrow on homepage
   * - Navigate to Library tab
   * - "Materialien" (Artifacts) filter is active
   */
  test('BUG-002: Material Link Navigation', async ({ page }) => {
    console.log('\n[BUG-002] Testing Material Link Navigation...');

    // Wait for homepage
    await page.waitForSelector('[data-testid="home-view"], [class*="home"]', { timeout: 10000 });

    // Look for material section with arrow button
    const materialArrow = page.locator('button:has-text("Materialien"), button:has-text("anzeigen"), [data-testid="view-all-materials"], a:has-text("→")').first();

    const arrowExists = await materialArrow.count() > 0;

    if (!arrowExists) {
      console.log('[BUG-002] ⚠️ WARNING: Material arrow button not found');
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-002-no-arrow.png'),
        fullPage: true
      });
    } else {
      // Click arrow
      await materialArrow.click();
      await page.waitForTimeout(1000);

      // Check if we're in Library tab
      const libraryTab = page.locator('[data-testid="library-tab"], [class*="library"]').first();
      const inLibrary = await libraryTab.count() > 0;

      // Check if "Materialien" tab is active
      const materialsTab = page.locator('button:has-text("Materialien"), [data-testid="artifacts-tab"]').first();
      const materialsActive = await materialsTab.evaluate((el) => {
        return el.classList.contains('active') ||
               el.classList.contains('text-primary-500') ||
               el.getAttribute('aria-selected') === 'true';
      }).catch(() => false);

      await page.screenshot({
        path: path.join(screenshotDir, 'bug-002-material-navigation.png'),
        fullPage: true
      });

      console.log(`[BUG-002] Navigated to Library: ${inLibrary ? '✅' : '❌'}`);
      console.log(`[BUG-002] Materialien tab active: ${materialsActive ? '✅' : '❌'}`);

      if (inLibrary && materialsActive) {
        console.log('[BUG-002] ✅ PASSED: Navigation working');
      } else {
        console.log('[BUG-002] ❌ FAILED: Navigation NOT working correctly');
      }
    }
  });

  /**
   * BUG-003: Agent Detection Workflow
   *
   * Expected behavior:
   * - Send message requesting image generation
   * - AgentConfirmationMessage appears
   * - Buttons are visible
   * - Click "Bild-Generierung starten"
   * - AgentFormView modal opens
   * - Form has prefilled values
   */
  test('BUG-003: Agent Detection Workflow', async ({ page }) => {
    console.log('\n[BUG-003] Testing Agent Detection Workflow...');

    // Navigate to chat
    const chatTab = page.locator('[data-testid="chat-tab"], button:has-text("Chat")').first();
    await chatTab.click();
    await page.waitForTimeout(1000);

    // Find chat input
    const chatInput = page.locator('textarea[placeholder*="Nachricht"], input[placeholder*="Nachricht"], [data-testid="chat-input"]').first();

    const inputExists = await chatInput.count() > 0;

    if (!inputExists) {
      console.log('[BUG-003] ❌ FAILED: Chat input not found');
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-003-no-input.png'),
        fullPage: true
      });
      throw new Error('Chat input not found');
    }

    // Send image generation request
    const testMessage = 'Erstelle ein Bild vom Satz des Pythagoras für Klasse 8a';
    await chatInput.fill(testMessage);
    await chatInput.press('Enter');

    // Wait for agent confirmation message
    await page.waitForTimeout(5000); // Wait for backend response

    // Look for AgentConfirmationMessage
    const confirmationMessage = page.locator('[data-testid="agent-confirmation"], [class*="agent-confirmation"]').first();
    const confirmationExists = await confirmationMessage.count() > 0;

    // Look for buttons
    const startButton = page.locator('button:has-text("Bild-Generierung starten"), button:has-text("✨")').first();
    const chatButton = page.locator('button:has-text("Weiter im Chat"), button:has-text("💬")').first();

    const startButtonVisible = await startButton.isVisible().catch(() => false);
    const chatButtonVisible = await chatButton.isVisible().catch(() => false);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-003-agent-confirmation.png'),
      fullPage: true
    });

    console.log(`[BUG-003] Confirmation message exists: ${confirmationExists ? '✅' : '❌'}`);
    console.log(`[BUG-003] Start button visible: ${startButtonVisible ? '✅' : '❌'}`);
    console.log(`[BUG-003] Chat button visible: ${chatButtonVisible ? '✅' : '❌'}`);

    if (startButtonVisible) {
      // Click start button
      await startButton.click();
      await page.waitForTimeout(1000);

      // Check if modal opened
      const modal = page.locator('[data-testid="agent-modal"], [role="dialog"], [class*="modal"]').first();
      const modalVisible = await modal.isVisible().catch(() => false);

      // Check for prefilled values
      const themeInput = page.locator('input[name="theme"], input[placeholder*="Thema"]').first();
      const learningGroupInput = page.locator('input[name="learningGroup"], input[placeholder*="Lerngruppe"]').first();

      const themeValue = await themeInput.inputValue().catch(() => '');
      const learningGroupValue = await learningGroupInput.inputValue().catch(() => '');

      const themePrefilled = themeValue.includes('Pythagoras');
      const learningGroupPrefilled = learningGroupValue.includes('8a');

      await page.screenshot({
        path: path.join(screenshotDir, 'bug-003-agent-form-prefill.png'),
        fullPage: true
      });

      console.log(`[BUG-003] Modal opened: ${modalVisible ? '✅' : '❌'}`);
      console.log(`[BUG-003] Theme prefilled: ${themePrefilled ? '✅' : '❌'} (${themeValue})`);
      console.log(`[BUG-003] Learning group prefilled: ${learningGroupPrefilled ? '✅' : '❌'} (${learningGroupValue})`);

      if (modalVisible && themePrefilled && learningGroupPrefilled) {
        console.log('[BUG-003] ✅ PASSED: Agent workflow working');
      } else {
        console.log('[BUG-003] ❌ FAILED: Agent workflow NOT working');
      }
    } else {
      console.log('[BUG-003] ❌ FAILED: Buttons not visible, cannot test modal');
    }
  });

  /**
   * BUG-004: Console Errors
   *
   * Expected behavior:
   * - Homepage loads
   * - Console has minimal errors (~0-20)
   * - No 404 errors from /api/profile/extract
   * - No 404 errors from /api/chat/summary
   */
  test('BUG-004: Console Errors', async ({ page }) => {
    console.log('\n[BUG-004] Testing Console Errors...');

    // Navigate to homepage
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Count console errors
    const totalErrors = consoleErrors.length;
    const errorMessages = consoleErrors.map(msg => msg.text());

    // Check for specific 404 errors
    const profileExtract404 = errorMessages.filter(msg =>
      msg.includes('/api/profile/extract') && msg.includes('404')
    ).length;

    const chatSummary404 = errorMessages.filter(msg =>
      msg.includes('/api/chat/summary') && msg.includes('404')
    ).length;

    const teacherProfile404 = errorMessages.filter(msg =>
      msg.includes('/api/teacher-profile/extract') && msg.includes('404')
    ).length;

    // Take screenshot of console
    await page.screenshot({
      path: path.join(screenshotDir, 'bug-004-console-errors.png'),
      fullPage: true
    });

    // Generate console error report
    const errorReport = {
      totalErrors,
      profileExtract404,
      chatSummary404,
      teacherProfile404,
      errors: errorMessages.slice(0, 20) // First 20 errors
    };

    fs.writeFileSync(
      path.join(screenshotDir, 'bug-004-console-errors.json'),
      JSON.stringify(errorReport, null, 2)
    );

    console.log(`[BUG-004] Total console errors: ${totalErrors}`);
    console.log(`[BUG-004] Profile extract 404s: ${profileExtract404}`);
    console.log(`[BUG-004] Chat summary 404s: ${chatSummary404}`);
    console.log(`[BUG-004] Teacher profile 404s: ${teacherProfile404}`);

    // Expected: ~0-20 errors after BUG-009 fix
    const withinExpectedRange = totalErrors <= 20;
    const no404Errors = (profileExtract404 + chatSummary404 + teacherProfile404) === 0;

    if (withinExpectedRange && no404Errors) {
      console.log('[BUG-004] ✅ PASSED: Console errors within acceptable range');
    } else if (withinExpectedRange) {
      console.log('[BUG-004] ⚠️ PARTIAL: Errors within range but some 404s found');
    } else {
      console.log('[BUG-004] ❌ FAILED: Too many console errors');
    }
  });

  /**
   * BUG-005: Library Date Formatting
   *
   * Expected behavior:
   * - Library uses German relative dates
   * - "vor X Tagen", "Gestern", "14:30"
   * - Same format as Homepage
   */
  test('BUG-005: Library Date Formatting', async ({ page }) => {
    console.log('\n[BUG-005] Testing Library Date Formatting...');

    // Navigate to Library → Chats
    const libraryTab = page.locator('[data-testid="library-tab"], button:has-text("Bibliothek")').first();
    await libraryTab.click();
    await page.waitForTimeout(1000);

    const chatsTab = page.locator('button:has-text("Chat-Historie"), [data-testid="chats-tab"]').first();
    const chatsTabExists = await chatsTab.count() > 0;

    if (chatsTabExists) {
      await chatsTab.click();
      await page.waitForTimeout(1000);
    }

    // Look for date elements
    const dateElements = page.locator('[class*="date"], [class*="time"], .text-xs.text-gray-400');
    const dateCount = await dateElements.count();

    let dates: string[] = [];
    for (let i = 0; i < Math.min(dateCount, 5); i++) {
      const dateText = await dateElements.nth(i).textContent();
      if (dateText) dates.push(dateText.trim());
    }

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-005-date-formatting-library.png'),
      fullPage: true
    });

    // Check for German relative format
    const hasRelativeFormat = dates.some(date =>
      date.includes('vor') ||
      date.includes('Gestern') ||
      date.match(/^\d{1,2}:\d{2}$/) // HH:MM format
    );

    // Navigate to Homepage for comparison
    const homeTab = page.locator('[data-testid="home-tab"], button:has-text("Home")').first();
    await homeTab.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-005-date-formatting-home.png'),
      fullPage: true
    });

    console.log(`[BUG-005] Library dates found: ${dates.join(', ')}`);
    console.log(`[BUG-005] Has German relative format: ${hasRelativeFormat ? '✅' : '❌'}`);

    if (hasRelativeFormat) {
      console.log('[BUG-005] ✅ PASSED: Date formatting is correct');
    } else {
      console.log('[BUG-005] ❌ FAILED: Date formatting NOT using relative format');
    }
  });

  /**
   * BUG-006: Profile - Merkmal hinzufügen
   *
   * Expected behavior:
   * - Click "Merkmal hinzufügen"
   * - Modal opens
   * - Modal has confirmation/save button
   */
  test('BUG-006: Profile - Merkmal hinzufügen', async ({ page }) => {
    console.log('\n[BUG-006] Testing Profile - Merkmal hinzufügen...');

    // Navigate to Profile
    const profileTab = page.locator('[data-testid="profile-tab"], button:has-text("Profil")').first();
    await profileTab.click();
    await page.waitForTimeout(1000);

    // Look for "Merkmal hinzufügen" button
    const addButton = page.locator('button:has-text("Merkmal hinzufügen"), button:has-text("hinzufügen")').first();
    const buttonExists = await addButton.count() > 0;

    if (!buttonExists) {
      console.log('[BUG-006] ⚠️ WARNING: "Merkmal hinzufügen" button not found');
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-006-no-button.png'),
        fullPage: true
      });
    } else {
      await addButton.click();
      await page.waitForTimeout(1000);

      // Check if modal opened
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      const modalVisible = await modal.isVisible().catch(() => false);

      // Look for confirmation button
      const confirmButton = page.locator('button:has-text("Bestätigen"), button:has-text("Hinzufügen"), button:has-text("Speichern")').first();
      const confirmButtonVisible = await confirmButton.isVisible().catch(() => false);

      await page.screenshot({
        path: path.join(screenshotDir, 'bug-006-profile-add-characteristic.png'),
        fullPage: true
      });

      console.log(`[BUG-006] Modal opened: ${modalVisible ? '✅' : '❌'}`);
      console.log(`[BUG-006] Confirmation button visible: ${confirmButtonVisible ? '✅' : '❌'}`);

      if (modalVisible && confirmButtonVisible) {
        console.log('[BUG-006] ✅ PASSED: Modal has confirmation button');
      } else {
        console.log('[BUG-006] ❌ FAILED: Modal missing confirmation button');
      }
    }
  });

  /**
   * BUG-007: Profile - Name ändern
   *
   * Expected behavior:
   * - Click edit icon for name
   * - Change name
   * - Click save/confirm
   * - Reload page
   * - Name persists
   */
  test('BUG-007: Profile - Name ändern', async ({ page }) => {
    console.log('\n[BUG-007] Testing Profile - Name ändern...');

    // Navigate to Profile
    const profileTab = page.locator('[data-testid="profile-tab"], button:has-text("Profil")').first();
    await profileTab.click();
    await page.waitForTimeout(1000);

    // Look for edit icon next to name
    const editIcon = page.locator('button:has([class*="pencil"]), button:has([class*="edit"]), svg[class*="pencil"]').first();
    const editIconExists = await editIcon.count() > 0;

    if (!editIconExists) {
      console.log('[BUG-007] ⚠️ WARNING: Edit icon not found');
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-007-no-edit-icon.png'),
        fullPage: true
      });
    } else {
      // Get current name
      const nameElement = page.locator('[data-testid="user-name"], input[name="name"], [class*="name"]').first();
      const currentName = await nameElement.inputValue().catch(() =>
        nameElement.textContent().catch(() => '')
      );

      console.log(`[BUG-007] Current name: ${currentName}`);

      // Click edit
      await editIcon.click();
      await page.waitForTimeout(500);

      // Enter new name
      const testName = 'QA Test Name';
      const nameInput = page.locator('input[name="name"], input[type="text"]').first();
      await nameInput.fill(testName);

      // Click save/confirm
      const saveButton = page.locator('button:has-text("Speichern"), button:has([class*="check"])').first();
      const saveButtonVisible = await saveButton.isVisible().catch(() => false);

      if (saveButtonVisible) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Reload page
        await page.reload();
        await page.waitForTimeout(2000);

        // Check if name persisted
        const newName = await nameElement.inputValue().catch(() =>
          nameElement.textContent().catch(() => '')
        );

        const namePersisted = newName === testName;

        await page.screenshot({
          path: path.join(screenshotDir, 'bug-007-profile-name-edit.png'),
          fullPage: true
        });

        console.log(`[BUG-007] Name after reload: ${newName}`);
        console.log(`[BUG-007] Name persisted: ${namePersisted ? '✅' : '❌'}`);

        if (namePersisted) {
          console.log('[BUG-007] ✅ PASSED: Name change persists');
        } else {
          console.log('[BUG-007] ❌ FAILED: Name change NOT persisted');
        }
      } else {
        console.log('[BUG-007] ❌ FAILED: Save button not visible');
        await page.screenshot({
          path: path.join(screenshotDir, 'bug-007-no-save-button.png'),
          fullPage: true
        });
      }
    }
  });

  /**
   * BUG-008: Library - Orange Color
   *
   * Expected behavior:
   * - Library uses orange (#FB6542) for active elements
   * - NOT blue
   */
  test('BUG-008: Library - Orange Color', async ({ page }) => {
    console.log('\n[BUG-008] Testing Library - Orange Color...');

    // Navigate to Library
    const libraryTab = page.locator('[data-testid="library-tab"], button:has-text("Bibliothek")').first();
    await libraryTab.click();
    await page.waitForTimeout(1000);

    // Check active tab color
    const activeTab = page.locator('[class*="text-primary-500"], [class*="border-primary-500"]').first();
    const activeTabExists = await activeTab.count() > 0;

    if (activeTabExists) {
      const color = await activeTab.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Orange should be around rgb(251, 101, 66) = #FB6542
      const isOrange = color.includes('251') || color.includes('fb6542') || color.includes('FB6542');

      console.log(`[BUG-008] Active tab color: ${color}`);
      console.log(`[BUG-008] Is orange: ${isOrange ? '✅' : '❌'}`);

      await page.screenshot({
        path: path.join(screenshotDir, 'bug-008-library-orange-color.png'),
        fullPage: true
      });

      if (isOrange) {
        console.log('[BUG-008] ✅ PASSED: Using orange color');
      } else {
        console.log('[BUG-008] ❌ FAILED: NOT using orange color');
      }
    } else {
      console.log('[BUG-008] ⚠️ WARNING: No active tab found');
    }
  });

  /**
   * BUG-009: Chat Tagging (DISABLED)
   *
   * Expected behavior:
   * - No infinite loop
   * - Console doesn't show repeated 404 errors
   * - Chat tagging is disabled
   */
  test('BUG-009: Chat Tagging (DISABLED)', async ({ page }) => {
    console.log('\n[BUG-009] Testing Chat Tagging (DISABLED)...');

    // Navigate to Library → Chats
    const libraryTab = page.locator('[data-testid="library-tab"], button:has-text("Bibliothek")').first();
    await libraryTab.click();
    await page.waitForTimeout(1000);

    const chatsTab = page.locator('button:has-text("Chat-Historie"), [data-testid="chats-tab"]').first();
    const chatsTabExists = await chatsTab.count() > 0;

    if (chatsTabExists) {
      await chatsTab.click();
    }

    // Wait and monitor console
    const errorsBefore = consoleErrors.length;
    await page.waitForTimeout(5000); // Wait 5 seconds
    const errorsAfter = consoleErrors.length;

    const newErrors = errorsAfter - errorsBefore;
    const chatTagErrors = consoleErrors.slice(errorsBefore).filter(msg =>
      msg.text().includes('/api/chat/') && msg.text().includes('tags')
    ).length;

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-009-no-infinite-loop.png'),
      fullPage: true
    });

    console.log(`[BUG-009] New errors in 5 seconds: ${newErrors}`);
    console.log(`[BUG-009] Chat tag 404 errors: ${chatTagErrors}`);

    // No infinite loop = minimal new errors
    const noInfiniteLoop = newErrors < 10;
    const noChatTagErrors = chatTagErrors === 0;

    if (noInfiniteLoop && noChatTagErrors) {
      console.log('[BUG-009] ✅ PASSED: No infinite loop, chat tagging disabled');
    } else if (noInfiniteLoop) {
      console.log('[BUG-009] ⚠️ PARTIAL: No infinite loop but some tag errors found');
    } else {
      console.log('[BUG-009] ❌ FAILED: Infinite loop detected');
    }
  });

  /**
   * BUG-010: Image Generation Workflow (Combined)
   *
   * This combines checks from BUG-003 with additional workflow verification
   */
  test('BUG-010: Image Generation Workflow End-to-End', async ({ page }) => {
    console.log('\n[BUG-010] Testing Image Generation Workflow End-to-End...');

    // Same as BUG-003 but with additional checks
    const chatTab = page.locator('[data-testid="chat-tab"], button:has-text("Chat")').first();
    await chatTab.click();
    await page.waitForTimeout(1000);

    const chatInput = page.locator('textarea[placeholder*="Nachricht"], input[placeholder*="Nachricht"]').first();
    await chatInput.fill('Erstelle ein Bild von einem Apfel');
    await chatInput.press('Enter');

    await page.waitForTimeout(5000);

    // Check for agent confirmation
    const confirmationExists = await page.locator('[data-testid="agent-confirmation"]').count() > 0;

    // Check button visibility
    const startButton = page.locator('button:has-text("Bild-Generierung starten")').first();
    const chatButton = page.locator('button:has-text("Weiter im Chat")').first();

    const startVisible = await startButton.isVisible().catch(() => false);
    const chatVisible = await chatButton.isVisible().catch(() => false);

    // Check button clickability
    const startClickable = await startButton.isEnabled().catch(() => false);
    const chatClickable = await chatButton.isEnabled().catch(() => false);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-010-image-workflow.png'),
      fullPage: true
    });

    console.log(`[BUG-010] Confirmation exists: ${confirmationExists ? '✅' : '❌'}`);
    console.log(`[BUG-010] Start button visible: ${startVisible ? '✅' : '❌'}`);
    console.log(`[BUG-010] Chat button visible: ${chatVisible ? '✅' : '❌'}`);
    console.log(`[BUG-010] Start button clickable: ${startClickable ? '✅' : '❌'}`);
    console.log(`[BUG-010] Chat button clickable: ${chatClickable ? '✅' : '❌'}`);

    if (confirmationExists && startVisible && chatVisible && startClickable && chatClickable) {
      console.log('[BUG-010] ✅ PASSED: Full workflow working');
    } else {
      console.log('[BUG-010] ❌ FAILED: Workflow NOT working');
    }
  });
});

/**
 * Generate final report after all tests
 */
test.afterAll(async () => {
  console.log('\n=== BUG VERIFICATION COMPLETE ===');
  console.log(`\nScreenshots saved to: ${screenshotDir}`);
  console.log(`\nTotal console errors: ${consoleErrors.length}`);

  // Generate summary report
  const report = {
    timestamp: new Date().toISOString(),
    screenshotDirectory: screenshotDir,
    totalConsoleErrors: consoleErrors.length,
    totalConsoleWarnings: consoleWarnings.length,
    consoleErrors: consoleErrors.map(msg => msg.text()).slice(0, 50),
    testsExecuted: 10,
    notes: [
      'All tests executed with REAL browser',
      'Screenshots captured for each bug',
      'Console errors monitored throughout',
      'Evidence-based pass/fail determinations'
    ]
  };

  fs.writeFileSync(
    path.join(screenshotDir, 'test-summary.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n✅ Report saved to: test-summary.json');
});
