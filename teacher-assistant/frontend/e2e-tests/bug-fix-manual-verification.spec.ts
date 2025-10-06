import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * MANUAL BUG FIX VERIFICATION - Simplified E2E Test Suite
 *
 * This test suite requires MANUAL authentication first.
 *
 * SETUP:
 * 1. Open http://localhost:5174 in browser
 * 2. Login with your credentials
 * 3. Keep browser open
 * 4. Run tests with --headed to use existing session
 *
 * Usage:
 * npm run test:e2e -- bug-fix-manual-verification.spec.ts --headed --project="Desktop Chrome - Chat Agent Testing"
 */

test.describe('Bug Fix Verification - Manual Auth', () => {

  const screenshotDir = path.join(process.cwd(), 'qa-screenshots');

  // Increase timeout for manual testing
  test.setTimeout(60000);

  test('Setup: Verify app is accessible', async ({ page }) => {
    console.log('\n=== Setup: App Accessibility Check ===');

    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, '00-setup-app-loaded.png'),
      fullPage: true
    });

    // Check if login is required
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Anmelden"), input[type="email"]');
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      console.log('⚠️  LOGIN REQUIRED - Please authenticate manually');
      console.log('    1. Complete authentication in the browser');
      console.log('    2. Re-run this test');

      await page.screenshot({
        path: path.join(screenshotDir, '00-setup-login-required.png'),
        fullPage: true
      });
    } else {
      console.log('✅ App is accessible (no login required or already authenticated)');
    }
  });

  test('BUG-001: Prompt Auto-Submit', async ({ page }) => {
    console.log('\n=== BUG-001: Prompt Auto-Submit ===');

    await page.goto('http://localhost:5174/#/');
    await page.waitForTimeout(1000);

    // Capture initial state
    await page.screenshot({
      path: path.join(screenshotDir, 'bug-001-01-home-initial.png'),
      fullPage: true
    });

    // Look for prompt tiles
    const promptTile = page.locator('.prompt-tile, [data-testid="prompt-tile"], button.rounded-xl:has-text("Wie")').first();

    const tileExists = await promptTile.isVisible({ timeout: 5000 }).catch(() => false);

    if (!tileExists) {
      console.log('⚠️  No prompt tiles found - may require authentication');
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-001-02-no-tiles.png'),
        fullPage: true
      });
      test.skip();
      return;
    }

    const promptText = await promptTile.textContent();
    console.log(`Prompt tile found: "${promptText?.substring(0, 50)}..."`);

    await promptTile.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-001-03-after-click.png'),
      fullPage: true
    });

    // Check if navigated to chat
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    const isOnChat = currentUrl.includes('chat');
    console.log(`On chat page: ${isOnChat}`);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-001-04-final-state.png'),
      fullPage: true
    });

    console.log('✅ BUG-001 test completed - review screenshots');
  });

  test('BUG-002: Material Navigation', async ({ page }) => {
    console.log('\n=== BUG-002: Material Navigation ===');

    await page.goto('http://localhost:5174/#/');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-002-01-home.png'),
      fullPage: true
    });

    // Look for material arrow/link
    const materialLink = page.locator('text="Alle Materialien", a:has-text("Material"), svg.arrow').first();

    const linkExists = await materialLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!linkExists) {
      console.log('⚠️  Material link not found');
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-002-02-no-link.png'),
        fullPage: true
      });
      test.skip();
      return;
    }

    console.log('Material link found, clicking...');
    await materialLink.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-002-03-after-click.png'),
      fullPage: true
    });

    // Check URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check active tab
    const materialsTab = page.locator('button:has-text("Materialien")');
    const isTabActive = await materialsTab.evaluate(el =>
      el.classList.contains('active') || el.getAttribute('aria-selected') === 'true'
    ).catch(() => false);

    console.log(`Materials tab active: ${isTabActive}`);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-002-04-final-state.png'),
      fullPage: true
    });

    console.log('✅ BUG-002 test completed - review screenshots');
  });

  test('BUG-003: Agent Detection', async ({ page }) => {
    console.log('\n=== BUG-003: Agent Detection ===');

    await page.goto('http://localhost:5174/#/chat');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-003-01-chat-initial.png'),
      fullPage: true
    });

    // Find input field
    const input = page.locator('textarea, input[type="text"]').last();
    const inputExists = await input.isVisible({ timeout: 5000 }).catch(() => false);

    if (!inputExists) {
      console.log('⚠️  Chat input not found - authentication required?');
      test.skip();
      return;
    }

    // Type message
    await input.fill('Erstelle ein Bild zur Photosynthese');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-003-02-message-typed.png')
    });

    // Send message
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000); // Wait for response

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-003-03-after-send.png'),
      fullPage: true
    });

    // Look for confirmation UI
    const confirmationUI = page.locator('text="Bild-Generierung", text="Ja, Bild erstellen", button:has-text("Bild")');
    const hasConfirmation = await confirmationUI.isVisible({ timeout: 10000 }).catch(() => false);

    console.log(`Agent confirmation visible: ${hasConfirmation}`);

    if (hasConfirmation) {
      await page.screenshot({
        path: path.join(screenshotDir, 'bug-003-04-confirmation-found.png'),
        fullPage: true
      });
    }

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-003-05-final-state.png'),
      fullPage: true
    });

    console.log('✅ BUG-003 test completed - review screenshots');
  });

  test('BUG-004: Console Errors', async ({ page }) => {
    console.log('\n=== BUG-004: Console Errors ===');

    const errors: string[] = [];
    const network404s: { url: string; status: number }[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() === 404) {
        network404s.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Navigate through all pages
    await page.goto('http://localhost:5174/#/');
    await page.waitForTimeout(1000);

    await page.goto('http://localhost:5174/#/chat');
    await page.waitForTimeout(1000);

    await page.goto('http://localhost:5174/#/library');
    await page.waitForTimeout(1000);

    await page.goto('http://localhost:5174/#/profile');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-004-01-navigation-complete.png'),
      fullPage: true
    });

    // Filter for specific 404s
    const profile404s = network404s.filter(e =>
      e.url.includes('/api/profile') && e.status === 404
    );

    const chatSummary404s = network404s.filter(e =>
      e.url.includes('/api/chat/summary') && e.status === 404
    );

    console.log(`\nConsole errors: ${errors.length}`);
    console.log(`Profile API 404s: ${profile404s.length}`);
    console.log(`Chat summary 404s: ${chatSummary404s.length}`);
    console.log(`Total 404s: ${network404s.length}`);

    if (profile404s.length > 0) {
      console.log('Profile 404s:', profile404s);
    }

    if (chatSummary404s.length > 0) {
      console.log('Chat summary 404s:', chatSummary404s);
    }

    // Write error report
    const errorReport = {
      consoleErrors: errors,
      profile404s,
      chatSummary404s,
      all404s: network404s
    };

    console.log('\nError Report:', JSON.stringify(errorReport, null, 2));

    console.log('✅ BUG-004 test completed - review console output');
  });

  test('BUG-005: Date Formatting', async ({ page }) => {
    console.log('\n=== BUG-005: Date Formatting ===');

    // Home page
    await page.goto('http://localhost:5174/#/');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-005-01-home-dates.png'),
      fullPage: true
    });

    const homeDates = await page.locator('time, [data-testid="date"], .date').allTextContents();
    console.log('Home page dates:', homeDates);

    // Library page
    await page.goto('http://localhost:5174/#/library');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-005-02-library-dates.png'),
      fullPage: true
    });

    const libraryDates = await page.locator('time, [data-testid="date"], .date').allTextContents();
    console.log('Library page dates:', libraryDates);

    console.log('✅ BUG-005 test completed - compare date formats manually');
  });

  test('BUG-006: Profile Merkmal Modal', async ({ page }) => {
    console.log('\n=== BUG-006: Profile Merkmal Modal ===');

    await page.goto('http://localhost:5174/#/profile');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-006-01-profile.png'),
      fullPage: true
    });

    const addButton = page.locator('button:has-text("Merkmal hinzufügen"), button:has-text("hinzufügen")').first();
    const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!buttonExists) {
      console.log('⚠️  Add button not found');
      test.skip();
      return;
    }

    await addButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-006-02-modal-open.png'),
      fullPage: true
    });

    const confirmButton = page.locator('button:has-text("Hinzufügen"), button:has-text("Bestätigen")');
    const hasConfirm = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);

    console.log(`Confirmation button visible: ${hasConfirm}`);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-006-03-buttons.png')
    });

    console.log('✅ BUG-006 test completed - review screenshots');
  });

  test('BUG-007: Profile Name Edit', async ({ page }) => {
    console.log('\n=== BUG-007: Profile Name Edit ===');

    await page.goto('http://localhost:5174/#/profile');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-007-01-profile.png'),
      fullPage: true
    });

    const pencilIcon = page.locator('button[aria-label*="edit"], button[aria-label*="Name"], svg.pencil').first();
    const iconExists = await pencilIcon.isVisible({ timeout: 5000 }).catch(() => false);

    if (!iconExists) {
      console.log('⚠️  Pencil icon not found');
      test.skip();
      return;
    }

    await pencilIcon.click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-007-02-edit-mode.png'),
      fullPage: true
    });

    const checkmark = page.locator('button:has-text("✓"), button[aria-label*="Save"]');
    const hasCheckmark = await checkmark.isVisible({ timeout: 2000 }).catch(() => false);

    console.log(`Checkmark button visible: ${hasCheckmark}`);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-007-03-inline-buttons.png')
    });

    console.log('✅ BUG-007 test completed - review screenshots');
  });

  test('BUG-008: Library Orange Accent', async ({ page }) => {
    console.log('\n=== BUG-008: Library Orange Accent ===');

    await page.goto('http://localhost:5174/#/library');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-008-01-library.png'),
      fullPage: true
    });

    const materialsTab = page.locator('button:has-text("Materialien")');
    const tabExists = await materialsTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (tabExists) {
      await materialsTab.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(screenshotDir, 'bug-008-02-materials-tab.png')
      });

      const tabColor = await materialsTab.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          bg: styles.backgroundColor,
          border: styles.borderColor,
          color: styles.color
        };
      });

      console.log('Tab colors:', tabColor);
    }

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-008-03-final.png'),
      fullPage: true
    });

    console.log('✅ BUG-008 test completed - verify orange color in screenshots');
  });

  test('BUG-009: Library Chat Tagging', async ({ page }) => {
    console.log('\n=== BUG-009: Library Chat Tagging ===');

    await page.goto('http://localhost:5174/#/library');
    await page.waitForTimeout(1000);

    const chatTab = page.locator('button:has-text("Chat-Historie")');
    const tabExists = await chatTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (tabExists) {
      await chatTab.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-009-01-chat-history.png'),
      fullPage: true
    });

    const tags = await page.locator('.tag, .pill, [data-testid="tag"]').allTextContents();
    console.log(`Found ${tags.length} tags:`, tags);

    await page.screenshot({
      path: path.join(screenshotDir, 'bug-009-02-tags.png'),
      fullPage: true
    });

    console.log('✅ BUG-009 test completed - review screenshots for tags');
  });
});
