/**
 * AUTOMATED BUG INVESTIGATION - 2025-10-12
 *
 * Bug 1: Agent Confirmation Button Not Visible
 * Bug 2: Library Modal Image Not Showing
 *
 * Mission: Comprehensive DOM inspection, CSS analysis, and screenshot capture
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FRONTEND_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/2025-10-12/investigation';

// Helper function to setup test authentication
async function setupTestAuth(page: Page) {
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
    (window as any).__TEST_USER__ = {
      id: '38eb3d27-dd97-4ed4-9e80-08fafe18115f',
      email: 's.brill@eduhu.de',
    };
  });

  await page.addInitScript(() => {
    const testAuthData = {
      user: {
        id: '38eb3d27-dd97-4ed4-9e80-08fafe18115f',
        email: 's.brill@eduhu.de',
        refresh_token: 'test-refresh-token-playwright',
        created_at: Date.now(),
      },
      token: 'test-token-playwright',
      timestamp: Date.now(),
    };
    localStorage.setItem('instantdb-test-auth', JSON.stringify(testAuthData));
    localStorage.setItem('test-mode-active', 'true');
  });
}

// Helper to wait for auth
async function waitForAuth(page: Page) {
  await page.waitForTimeout(2000);
  const chatTab = await page.locator('[aria-label="Chat"]').or(page.locator('text="Chat"')).count();
  const homeTab = await page.locator('[aria-label="Home"]').or(page.locator('text="Home"')).count();
  const visibleTabs = chatTab + homeTab;

  if (visibleTabs < 1) {
    throw new Error('Test authentication failed - no tabs found');
  }
  console.log('✅ Test auth successful');
}

// Helper to get comprehensive element info
async function getElementInfo(page: Page, selector: string, elementName: string) {
  console.log(`\n🔍 Inspecting: ${elementName} [${selector}]`);

  const element = await page.$(selector);

  if (!element) {
    console.log(`❌ Element NOT FOUND in DOM`);
    return {
      exists: false,
      selector,
      elementName
    };
  }

  console.log(`✅ Element exists in DOM`);

  // Get computed styles
  const styles = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;

    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      position: computed.position,
      zIndex: computed.zIndex,
      width: computed.width,
      height: computed.height,
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      transform: computed.transform,
      overflow: computed.overflow,
      pointerEvents: computed.pointerEvents,
      fontSize: computed.fontSize,
      padding: computed.padding,
      margin: computed.margin,
      border: computed.border,
    };
  }, selector);

  // Get bounding box
  const bbox = await element.boundingBox();

  // Get HTML structure
  const html = await element.evaluate(el => el.outerHTML.substring(0, 500));

  // Get classes
  const classes = await element.evaluate(el => el.className);

  // Get attributes
  const attributes = await element.evaluate(el => {
    const attrs: Record<string, string> = {};
    for (const attr of el.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  });

  // Get parent info
  const parentInfo = await element.evaluate(el => {
    const parent = el.parentElement;
    if (!parent) return null;

    const computed = window.getComputedStyle(parent);
    return {
      tag: parent.tagName,
      classes: parent.className,
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      overflow: computed.overflow,
    };
  });

  console.log('  Computed Styles:', JSON.stringify(styles, null, 2));
  console.log('  Bounding Box:', bbox);
  console.log('  Classes:', classes);
  console.log('  Parent:', JSON.stringify(parentInfo, null, 2));

  return {
    exists: true,
    selector,
    elementName,
    styles,
    boundingBox: bbox,
    html,
    classes,
    attributes,
    parentInfo
  };
}

// Helper to check console errors
function setupConsoleMonitoring(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const logs: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('❌ CONSOLE ERROR:', text);
    } else if (msg.type() === 'warning') {
      warnings.push(text);
      console.log('⚠️ CONSOLE WARNING:', text);
    } else if (text.includes('[AgentContext]') || text.includes('[MaterialPreviewModal]')) {
      logs.push(text);
      console.log('📋 BROWSER LOG:', text);
    }
  });

  return { errors, warnings, logs };
}

test.describe('Bug Investigation: Agent Button & Library Modal', () => {

  test('BUG-001: Agent Confirmation Button Not Visible', async ({ page }) => {
    console.log('\n🐛 INVESTIGATING BUG-001: Agent Confirmation Button Not Visible');
    console.log('User report: "Button exists but is not visible - fundamental design problem"');

    const consoleMonitor = setupConsoleMonitoring(page);

    // Setup
    await setupTestAuth(page);
    await page.goto(FRONTEND_URL);
    await waitForAuth(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Chat
    console.log('\n📍 Step 1: Navigate to Chat');
    await page.click('button:has-text("Chat")');
    await page.waitForSelector('input[placeholder="Nachricht schreiben..."]', { timeout: 10000 });
    console.log('✅ Chat loaded');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-001-01-chat-initial.png`,
      fullPage: true
    });

    // Send message to trigger agent
    console.log('\n📍 Step 2: Send message to trigger agent');
    const chatInput = await page.$('input[placeholder="Nachricht schreiben..."]');
    if (!chatInput) throw new Error('Chat input not found');

    await chatInput.fill('Erstelle ein Bild von einem Elefanten');
    await page.keyboard.press('Enter');
    console.log('✅ Message sent');

    // Wait for agent confirmation to appear
    console.log('\n📍 Step 3: Wait for agent confirmation (up to 15 seconds)');
    await page.waitForTimeout(8000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-001-02-agent-confirmation-appeared.png`,
      fullPage: true
    });

    // INVESTIGATION: Check if button exists
    console.log('\n📍 Step 4: DOM INVESTIGATION - Agent Confirmation Button');

    // Try multiple selectors
    const selectors = [
      '[data-testid="agent-confirmation-start-button"]',
      'button:has-text("Jetzt starten")',
      '.agent-confirmation button',
      '[class*="confirmation"] button',
    ];

    const investigationResults = [];

    for (const selector of selectors) {
      const info = await getElementInfo(page, selector, `Agent Button [${selector}]`);
      investigationResults.push(info);
    }

    // Check for the entire confirmation component
    const confirmationCard = await getElementInfo(
      page,
      '[data-testid="agent-confirmation-card"]',
      'Agent Confirmation Card'
    );
    investigationResults.push(confirmationCard);

    // INVESTIGATION: Screenshot with DevTools overlay
    console.log('\n📍 Step 5: Visual inspection screenshots');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-001-03-dom-investigation.png`,
      fullPage: true
    });

    // INVESTIGATION: Get all buttons in viewport
    console.log('\n📍 Step 6: List all buttons in viewport');
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.textContent?.trim(),
        classes: btn.className,
        visible: btn.offsetParent !== null,
        display: window.getComputedStyle(btn).display,
        visibility: window.getComputedStyle(btn).visibility,
        opacity: window.getComputedStyle(btn).opacity,
        dataTestId: btn.getAttribute('data-testid'),
      }));
    });

    console.log('All buttons:', JSON.stringify(allButtons, null, 2));

    // Save investigation report
    const bug001Report = {
      bugId: 'BUG-001',
      title: 'Agent Confirmation Button Not Visible',
      timestamp: new Date().toISOString(),
      consoleErrors: consoleMonitor.errors,
      consoleWarnings: consoleMonitor.warnings,
      consoleLogs: consoleMonitor.logs,
      investigationResults,
      allButtons,
    };

    console.log('\n📊 BUG-001 Investigation Complete');
    console.log('  Console Errors:', consoleMonitor.errors.length);
    console.log('  Console Warnings:', consoleMonitor.warnings.length);
    console.log('  Button Selectors Tested:', selectors.length);
    console.log('  Total Buttons Found:', allButtons.length);

    return bug001Report;
  });

  test('BUG-002: Library Modal Image Not Showing', async ({ page }) => {
    console.log('\n🐛 INVESTIGATING BUG-002: Library Modal Image Not Showing');
    console.log('User report: "Can\'t open images. Displaced buttons but no image. Nothing works."');

    const consoleMonitor = setupConsoleMonitoring(page);

    // Setup
    await setupTestAuth(page);
    await page.goto(FRONTEND_URL);
    await waitForAuth(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Library
    console.log('\n📍 Step 1: Navigate to Library → Materials');
    await page.click('button:has-text("Bibliothek")');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-002-01-library-initial.png`,
      fullPage: true
    });

    // Click Materials tab
    await page.click('button:has-text("Materialien")');
    await page.waitForTimeout(1000);
    console.log('✅ Materials tab opened');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-002-02-materials-grid.png`,
      fullPage: true
    });

    // INVESTIGATION: Count materials
    console.log('\n📍 Step 2: Inspect material cards');
    const materialCards = await page.$$('.cursor-pointer');
    console.log(`Found ${materialCards.length} material cards`);

    if (materialCards.length === 0) {
      console.log('⚠️ NO MATERIALS FOUND - Skipping modal investigation');
      return {
        bugId: 'BUG-002',
        error: 'No materials in library',
        recommendation: 'Generate test material first'
      };
    }

    // INVESTIGATION: Get material card details
    const cardDetails = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
      return cards.map(card => ({
        html: card.outerHTML.substring(0, 300),
        hasImage: !!card.querySelector('img'),
        imageSrc: card.querySelector('img')?.getAttribute('src'),
        classes: card.className,
      }));
    });

    console.log('Material card details:', JSON.stringify(cardDetails, null, 2));

    // Click first material card
    console.log('\n📍 Step 3: Click first material card');
    await materialCards[0].click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-002-03-modal-opened.png`,
      fullPage: true
    });

    // INVESTIGATION: Modal structure
    console.log('\n📍 Step 4: DOM INVESTIGATION - Modal Structure');

    const modalInvestigation = await page.evaluate(() => {
      const results: any = {
        modals: [],
        images: [],
        buttons: [],
      };

      // Find all modals
      document.querySelectorAll('ion-modal, [role="dialog"]').forEach(modal => {
        const computed = window.getComputedStyle(modal as HTMLElement);
        results.modals.push({
          tag: modal.tagName,
          classes: modal.className,
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          zIndex: computed.zIndex,
          hasBackdrop: !!modal.querySelector('ion-backdrop, .modal-backdrop'),
        });
      });

      // Find all images in modals
      document.querySelectorAll('ion-modal img, [role="dialog"] img').forEach(img => {
        const computed = window.getComputedStyle(img);
        results.images.push({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt'),
          dataTestId: img.getAttribute('data-testid'),
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          width: computed.width,
          height: computed.height,
          objectFit: computed.objectFit,
        });
      });

      // Find all buttons in modal
      document.querySelectorAll('ion-modal button, [role="dialog"] button').forEach(btn => {
        const computed = window.getComputedStyle(btn);
        results.buttons.push({
          text: btn.textContent?.trim(),
          dataTestId: btn.getAttribute('data-testid'),
          display: computed.display,
          visibility: computed.visibility,
          position: computed.position,
          top: computed.top,
          left: computed.left,
          right: computed.right,
          bottom: computed.bottom,
        });
      });

      return results;
    });

    console.log('Modal Investigation:', JSON.stringify(modalInvestigation, null, 2));

    // INVESTIGATION: Check specific selectors
    const modalImage = await getElementInfo(
      page,
      '[data-testid="material-image"]',
      'Modal Image'
    );

    const modalTitle = await getElementInfo(
      page,
      '[data-testid="material-title"]',
      'Modal Title'
    );

    const closeButton = await getElementInfo(
      page,
      '[data-testid="close-button"]',
      'Close Button'
    );

    const regenerateButton = await getElementInfo(
      page,
      '[data-testid="regenerate-button"]',
      'Regenerate Button'
    );

    // INVESTIGATION: Network check (did image load?)
    console.log('\n📍 Step 5: Check network for image load errors');

    const imageLoadErrors = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        loadError: !img.complete || img.naturalWidth === 0,
      }));
    });

    console.log('Image load status:', JSON.stringify(imageLoadErrors, null, 2));

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/bug-002-04-modal-investigation-complete.png`,
      fullPage: true
    });

    // Save investigation report
    const bug002Report = {
      bugId: 'BUG-002',
      title: 'Library Modal Image Not Showing',
      timestamp: new Date().toISOString(),
      consoleErrors: consoleMonitor.errors,
      consoleWarnings: consoleMonitor.warnings,
      consoleLogs: consoleMonitor.logs,
      materialCardsFound: materialCards.length,
      cardDetails,
      modalInvestigation,
      modalImage,
      modalTitle,
      closeButton,
      regenerateButton,
      imageLoadErrors,
    };

    console.log('\n📊 BUG-002 Investigation Complete');
    console.log('  Console Errors:', consoleMonitor.errors.length);
    console.log('  Material Cards:', materialCards.length);
    console.log('  Modals Found:', modalInvestigation.modals.length);
    console.log('  Images in Modal:', modalInvestigation.images.length);
    console.log('  Image Load Errors:', imageLoadErrors.filter((img: any) => img.loadError).length);

    return bug002Report;
  });

});
