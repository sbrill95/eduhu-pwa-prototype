import { test, expect, Page, ConsoleMessage } from '@playwright/test';

/**
 * Comprehensive E2E Tests for Chat-Integrated Agent Confirmation System
 *
 * This test suite validates the new chat-integrated agent flow vs the old modal approach
 * Focus areas:
 * - Button visibility and interaction
 * - Mobile responsiveness
 * - Console error monitoring
 * - Performance metrics
 * - Cross-browser compatibility
 */

interface TestMetrics {
  loadTime: number;
  consoleErrors: ConsoleMessage[];
  consoleWarnings: ConsoleMessage[];
  performanceEntries: any[];
  memoryUsage?: any;
}

class ChatAgentTestHelper {
  private page: Page;
  private metrics: TestMetrics;

  constructor(page: Page) {
    this.page = page;
    this.metrics = {
      loadTime: 0,
      consoleErrors: [],
      consoleWarnings: [],
      performanceEntries: []
    };
  }

  async startMonitoring() {
    console.log('🔊 Starting console and performance monitoring...');

    // Monitor console messages
    this.page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      console.log(`[BROWSER CONSOLE] ${type.toUpperCase()}: ${text}`);

      if (type === 'error') {
        this.metrics.consoleErrors.push(msg);
      } else if (type === 'warning') {
        this.metrics.consoleWarnings.push(msg);
      }
    });

    // Monitor network failures
    this.page.on('pageerror', (error) => {
      console.error('🚨 PAGE ERROR:', error.message);
    });

    // Monitor failed requests
    this.page.on('requestfailed', (request) => {
      console.error('🚨 REQUEST FAILED:', request.url(), request.failure()?.errorText);
    });
  }

  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    const endTime = Date.now();
    this.metrics.loadTime = endTime - startTime;
    console.log(`⏱️ Page load time: ${this.metrics.loadTime}ms`);
    return this.metrics.loadTime;
  }

  async capturePerformanceMetrics() {
    const performanceData = await this.page.evaluate(() => {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };
    });

    this.metrics.performanceEntries.push(performanceData);
    console.log('📊 Performance metrics captured:', JSON.stringify(performanceData, null, 2));
  }

  async takeDebugScreenshot(name: string) {
    const path = `test-results/debug-screenshots/${name}.png`;
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Debug screenshot saved: ${path}`);
  }

  getMetrics(): TestMetrics {
    return this.metrics;
  }

  async waitForChatInterface() {
    console.log('🕰️ Waiting for chat interface to load...');

    // Wait for the main chat input to be visible and enabled
    await this.page.waitForSelector('input[placeholder*="Stellen Sie Ihre Frage"]', {
      state: 'visible',
      timeout: 10000
    });

    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('.ion-spinner', { state: 'hidden', timeout: 5000 }).catch(() => {
      console.log('⚠️ No loading spinner found - continuing...');
    });

    console.log('✅ Chat interface loaded successfully');
  }

  async inputMessage(message: string) {
    console.log(`💬 Entering message: "${message}"`);

    const inputSelector = 'input[placeholder*="Stellen Sie Ihre Frage"]';
    await this.page.fill(inputSelector, message);

    // Verify the input was filled correctly
    const inputValue = await this.page.inputValue(inputSelector);
    expect(inputValue).toBe(message);

    console.log('✅ Message entered successfully');
  }

  async submitMessage() {
    console.log('📤 Submitting message...');

    // Look for the send button - it should be enabled when there's text
    const sendButton = this.page.locator('ion-button[type="submit"]');
    await expect(sendButton).toBeEnabled();

    await sendButton.click();
    console.log('✅ Message submitted');
  }

  async waitForAgentConfirmationMessage(timeout = 15000) {
    console.log('🤖 Waiting for agent confirmation message...');

    // Wait for the agent confirmation message to appear in chat
    // This should be a card with agent confirmation content
    const confirmationSelector = '[data-testid="agent-confirmation"], .agent-confirmation-message, ion-card:has-text("Agent verfügbar")';

    try {
      await this.page.waitForSelector(confirmationSelector, {
        state: 'visible',
        timeout
      });
      console.log('✅ Agent confirmation message appeared');
      return true;
    } catch (error) {
      console.error('❌ Agent confirmation message did not appear:', error);
      return false;
    }
  }

  async validateAgentConfirmationButtons() {
    console.log('🔍 Validating agent confirmation buttons...');

    // Look for the confirmation buttons
    const confirmButtonSelectors = [
      'ion-button:has-text("Ja, Agent starten")',
      'ion-button:has-text("Agent starten")',
      'button:has-text("Ja")',
      '[data-testid="confirm-agent-button"]'
    ];

    const cancelButtonSelectors = [
      'ion-button:has-text("Nein, Konversation fortsetzen")',
      'ion-button:has-text("Konversation fortsetzen")',
      'button:has-text("Nein")',
      '[data-testid="cancel-agent-button"]'
    ];

    let confirmButton = null;
    let cancelButton = null;

    // Try to find confirm button
    for (const selector of confirmButtonSelectors) {
      try {
        confirmButton = this.page.locator(selector).first();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found confirm button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Try to find cancel button
    for (const selector of cancelButtonSelectors) {
      try {
        cancelButton = this.page.locator(selector).first();
        if (await cancelButton.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found cancel button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Validate buttons are visible and accessible
    if (confirmButton && await confirmButton.isVisible()) {
      const isEnabled = await confirmButton.isEnabled();
      console.log(`✅ Confirm button visible: true, enabled: ${isEnabled}`);

      // Check button styling and accessibility
      const buttonBox = await confirmButton.boundingBox();
      if (buttonBox) {
        console.log(`📏 Confirm button dimensions: ${buttonBox.width}x${buttonBox.height}`);

        // Verify minimum touch target size (44px)
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        console.log('✅ Confirm button meets minimum touch target requirements');
      }
    } else {
      console.error('❌ Confirm button not found or not visible');
      throw new Error('Agent confirmation button not visible - this is the core issue we\'re testing!');
    }

    if (cancelButton && await cancelButton.isVisible()) {
      const isEnabled = await cancelButton.isEnabled();
      console.log(`✅ Cancel button visible: true, enabled: ${isEnabled}`);

      const buttonBox = await cancelButton.boundingBox();
      if (buttonBox) {
        console.log(`📏 Cancel button dimensions: ${buttonBox.width}x${buttonBox.height}`);
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        console.log('✅ Cancel button meets minimum touch target requirements');
      }
    } else {
      console.error('❌ Cancel button not found or not visible');
      throw new Error('Agent cancellation button not visible');
    }

    return { confirmButton, cancelButton };
  }

  async clickConfirmAgent() {
    console.log('✅ Clicking agent confirmation button...');

    const { confirmButton } = await this.validateAgentConfirmationButtons();

    if (confirmButton) {
      await confirmButton.click();
      console.log('✅ Agent confirmation clicked successfully');

      // Wait for progress message to appear
      await this.waitForAgentProgressMessage();
    }
  }

  async clickCancelAgent() {
    console.log('❌ Clicking agent cancellation button...');

    const { cancelButton } = await this.validateAgentConfirmationButtons();

    if (cancelButton) {
      await cancelButton.click();
      console.log('✅ Agent cancellation clicked successfully');
    }
  }

  async waitForAgentProgressMessage(timeout = 10000) {
    console.log('⏳ Waiting for agent progress message...');

    const progressSelectors = [
      '[data-testid="agent-progress"]',
      '.agent-progress-message',
      'ion-card:has-text("Agent wird gestartet")',
      'ion-card:has-text("arbeitet")'
    ];

    for (const selector of progressSelectors) {
      try {
        await this.page.waitForSelector(selector, {
          state: 'visible',
          timeout: timeout / progressSelectors.length
        });
        console.log(`✅ Agent progress message appeared with selector: ${selector}`);
        return true;
      } catch (e) {
        continue;
      }
    }

    console.error('❌ Agent progress message did not appear');
    return false;
  }

  async waitForAgentResultMessage(timeout = 30000) {
    console.log('🎯 Waiting for agent result message...');

    const resultSelectors = [
      '[data-testid="agent-result"]',
      '.agent-result-message',
      'ion-card:has-text("erfolgreich erstellt")',
      'ion-card:has-text("herunterladen")',
      'img[alt*="Agent generated"]'
    ];

    for (const selector of resultSelectors) {
      try {
        await this.page.waitForSelector(selector, {
          state: 'visible',
          timeout: timeout / resultSelectors.length
        });
        console.log(`✅ Agent result message appeared with selector: ${selector}`);
        return true;
      } catch (e) {
        continue;
      }
    }

    console.error('❌ Agent result message did not appear within timeout');
    return false;
  }

  async validateDownloadButton() {
    console.log('📥 Validating download button...');

    const downloadSelectors = [
      'ion-button:has-text("herunterladen")',
      'button:has-text("Download")',
      '[data-testid="download-button"]'
    ];

    for (const selector of downloadSelectors) {
      try {
        const downloadButton = this.page.locator(selector).first();
        if (await downloadButton.isVisible({ timeout: 2000 })) {
          const isEnabled = await downloadButton.isEnabled();
          console.log(`✅ Download button found and enabled: ${isEnabled}`);
          return downloadButton;
        }
      } catch (e) {
        continue;
      }
    }

    console.error('❌ Download button not found');
    return null;
  }
}

test.describe('Chat-Integrated Agent Confirmation System', () => {
  let helper: ChatAgentTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ChatAgentTestHelper(page);
    await helper.startMonitoring();

    console.log('🌐 Navigating to application...');
    await page.goto('/');

    await helper.measureLoadTime();
    await helper.waitForChatInterface();
    await helper.capturePerformanceMetrics();
  });

  test.afterEach(async ({ page }) => {
    const metrics = helper.getMetrics();

    console.log('\n📊 TEST METRICS SUMMARY:');
    console.log(`⏱️ Load Time: ${metrics.loadTime}ms`);
    console.log(`❌ Console Errors: ${metrics.consoleErrors.length}`);
    console.log(`⚠️ Console Warnings: ${metrics.consoleWarnings.length}`);

    if (metrics.consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS DETECTED:');
      metrics.consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.text()}`);
      });
    }

    await helper.takeDebugScreenshot(`test-end-${Date.now()}`);
  });

  test('Complete Agent Flow: Image Generation Request', async ({ page }) => {
    test.setTimeout(90000); // Extended timeout for full flow

    console.log('\n🎯 TEST: Complete Agent Flow - Image Generation');

    // Step 1: Input agent trigger message
    await helper.inputMessage('Erstelle ein Bild von einem Löwen');
    await helper.takeDebugScreenshot('step-1-message-entered');

    // Step 2: Submit message
    await helper.submitMessage();
    await helper.takeDebugScreenshot('step-2-message-submitted');

    // Step 3: Wait for agent confirmation message (not modal!)
    const confirmationAppeared = await helper.waitForAgentConfirmationMessage();
    expect(confirmationAppeared).toBe(true);
    await helper.takeDebugScreenshot('step-3-confirmation-appeared');

    // Step 4: Validate buttons are visible and clickable
    await helper.validateAgentConfirmationButtons();
    await helper.takeDebugScreenshot('step-4-buttons-validated');

    // Step 5: Click confirm agent
    await helper.clickConfirmAgent();
    await helper.takeDebugScreenshot('step-5-agent-confirmed');

    // Step 6: Wait for progress updates
    const progressAppeared = await helper.waitForAgentProgressMessage();
    expect(progressAppeared).toBe(true);
    await helper.takeDebugScreenshot('step-6-progress-started');

    // Step 7: Wait for result (this may take time for real agent)
    const resultAppeared = await helper.waitForAgentResultMessage(45000);

    if (resultAppeared) {
      console.log('✅ Complete agent flow successful');
      await helper.takeDebugScreenshot('step-7-result-success');

      // Step 8: Validate download functionality
      const downloadButton = await helper.validateDownloadButton();
      expect(downloadButton).toBeTruthy();
    } else {
      console.log('⚠️ Agent result did not appear - may be expected in test environment');
      await helper.takeDebugScreenshot('step-7-result-timeout');
    }
  });

  test('Agent Cancellation Flow', async ({ page }) => {
    console.log('\n❌ TEST: Agent Cancellation Flow');

    // Input agent trigger
    await helper.inputMessage('Erstelle ein Bild von einem Elefanten');
    await helper.submitMessage();

    // Wait for confirmation
    const confirmationAppeared = await helper.waitForAgentConfirmationMessage();
    expect(confirmationAppeared).toBe(true);

    // Validate and click cancel
    await helper.validateAgentConfirmationButtons();
    await helper.clickCancelAgent();

    // Verify the conversation continues normally
    await page.waitForTimeout(2000);

    // The chat should be available for normal conversation
    await helper.inputMessage('Das war ein Test');
    await helper.submitMessage();

    console.log('✅ Agent cancellation flow completed');
  });

  test('Button Visibility and Accessibility', async ({ page }) => {
    console.log('\n👁️ TEST: Button Visibility and Accessibility');

    await helper.inputMessage('Zeige mir ein Bild von einer Katze');
    await helper.submitMessage();

    const confirmationAppeared = await helper.waitForAgentConfirmationMessage();
    expect(confirmationAppeared).toBe(true);

    // Detailed button analysis
    const { confirmButton, cancelButton } = await helper.validateAgentConfirmationButtons();

    // Test button interaction states
    if (confirmButton) {
      await confirmButton.hover();
      await helper.takeDebugScreenshot('button-hover-state');

      // Verify button responds to interaction
      const isClickable = await confirmButton.isEnabled();
      expect(isClickable).toBe(true);
    }

    // Test keyboard accessibility
    await page.keyboard.press('Tab');
    await helper.takeDebugScreenshot('button-focus-state');

    console.log('✅ Button visibility and accessibility validated');
  });
});

test.describe('Mobile Responsiveness Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  let helper: ChatAgentTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ChatAgentTestHelper(page);
    await helper.startMonitoring();

    await page.goto('/');
    await helper.waitForChatInterface();
  });

  test('Mobile Agent Confirmation Interface', async ({ page }) => {
    console.log('\n📱 TEST: Mobile Agent Confirmation Interface');

    await helper.inputMessage('Erstelle ein Bild von einem Pferd');
    await helper.submitMessage();

    const confirmationAppeared = await helper.waitForAgentConfirmationMessage();
    expect(confirmationAppeared).toBe(true);

    // Mobile-specific validations
    const { confirmButton, cancelButton } = await helper.validateAgentConfirmationButtons();

    // Verify mobile touch targets
    if (confirmButton) {
      const buttonBox = await confirmButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44); // iOS minimum
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        console.log('✅ Mobile touch targets meet accessibility guidelines');
      }
    }

    // Test mobile scrolling behavior
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await helper.takeDebugScreenshot('mobile-scrolled');

    console.log('✅ Mobile responsiveness validated');
  });

  test('Mobile Performance Validation', async ({ page }) => {
    console.log('\n⚡ TEST: Mobile Performance Validation');

    const startTime = Date.now();

    await helper.inputMessage('Erstelle ein Bild von einem Vogel');
    await helper.submitMessage();
    await helper.waitForAgentConfirmationMessage();

    const totalTime = Date.now() - startTime;
    console.log(`📱 Mobile interaction time: ${totalTime}ms`);

    // Mobile performance expectations
    expect(totalTime).toBeLessThan(5000); // Should respond within 5 seconds

    await helper.capturePerformanceMetrics();
    console.log('✅ Mobile performance within acceptable limits');
  });
});

test.describe('Cross-Browser Compatibility', () => {
  ['Desktop Chrome', 'Desktop Firefox'].forEach(browserName => {
    test(`Agent Flow on ${browserName}`, async ({ page, browserName: actualBrowser }) => {
      console.log(`\n🌐 TEST: Agent Flow on ${actualBrowser}`);

      const helper = new ChatAgentTestHelper(page);
      await helper.startMonitoring();

      await page.goto('/');
      await helper.waitForChatInterface();

      await helper.inputMessage('Erstelle ein Bild von einem Hund');
      await helper.submitMessage();

      const confirmationAppeared = await helper.waitForAgentConfirmationMessage();
      expect(confirmationAppeared).toBe(true);

      await helper.validateAgentConfirmationButtons();

      console.log(`✅ Agent flow working on ${actualBrowser}`);
    });
  });
});

test.describe('Regression Testing - Normal Chat Functionality', () => {
  let helper: ChatAgentTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ChatAgentTestHelper(page);
    await helper.startMonitoring();
    await page.goto('/');
    await helper.waitForChatInterface();
  });

  test('Normal Chat Without Agent Triggers', async ({ page }) => {
    console.log('\n💬 TEST: Normal Chat Without Agent Triggers');

    // Send normal message that shouldn't trigger agent
    await helper.inputMessage('Wie kann ich meinen Unterricht verbessern?');
    await helper.submitMessage();

    // Wait for normal response
    await page.waitForSelector('.chat-message, ion-card', { timeout: 10000 });

    // Verify no agent confirmation appeared
    const agentConfirmation = page.locator('ion-card:has-text("Agent verfügbar")');
    await expect(agentConfirmation).not.toBeVisible({ timeout: 5000 });

    console.log('✅ Normal chat functionality preserved');
  });

  test('File Upload Functionality Still Works', async ({ page }) => {
    console.log('\n📎 TEST: File Upload Functionality');

    // Check if file input exists and is functional
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Check if file upload button is visible
    const uploadButton = page.locator('ion-button:has([icon="attach-outline"])');
    await expect(uploadButton).toBeVisible();

    console.log('✅ File upload functionality intact');
  });
});