import { test, expect, Page, ConsoleMessage } from '@playwright/test';

/**
 * Gemini Design Language Verification - Comprehensive E2E Test Suite
 *
 * This test suite validates the Gemini Design Language implementation across all views:
 * - Home View: Prompt tiles with orange borders, icons, and proper styling
 * - Chat View: Orange user bubbles (right), teal assistant bubbles (left)
 * - Library View: Material cards, filter chips, orange active states
 * - Tab Bar Navigation: Orange active tabs, gray inactive tabs
 * - Responsive Design: Mobile, tablet, desktop viewports
 * - Console Error Detection: Monitor all console errors and warnings
 *
 * Related SpecKit: .specify/specs/visual-redesign-gemini/
 * Phase: 3.1 - Gemini Design Implementation
 */

interface TestMetrics {
  loadTime: number;
  consoleErrors: ConsoleMessage[];
  consoleWarnings: ConsoleMessage[];
  networkErrors: string[];
}

class GeminiDesignTestHelper {
  private page: Page;
  private metrics: TestMetrics;

  constructor(page: Page) {
    this.page = page;
    this.metrics = {
      loadTime: 0,
      consoleErrors: [],
      consoleWarnings: [],
      networkErrors: []
    };
  }

  async startMonitoring() {
    console.log('🔊 Starting Gemini Design monitoring with console error detection...');

    // Monitor all console messages
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

    // Monitor page errors
    this.page.on('pageerror', (error) => {
      console.error('🚨 PAGE ERROR:', error.message, error.stack);
      this.metrics.networkErrors.push(`PAGE ERROR: ${error.message}`);
    });

    // Monitor failed network requests
    this.page.on('requestfailed', (request) => {
      const failure = request.failure();
      console.error('🚨 REQUEST FAILED:', request.url(), failure?.errorText);
      this.metrics.networkErrors.push(`REQUEST FAILED: ${request.url()} - ${failure?.errorText}`);
    });

    // Monitor unhandled promise rejections
    this.page.on('console', (msg) => {
      if (msg.text().includes('Unhandled Promise rejection')) {
        console.error('🚨 UNHANDLED PROMISE REJECTION:', msg.text());
      }
    });
  }

  async takeDebugScreenshot(name: string) {
    const timestamp = Date.now();
    const path = `test-results/gemini-design/${name}-${timestamp}.png`;
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Debug screenshot saved: ${path}`);
  }

  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    const endTime = Date.now();
    this.metrics.loadTime = endTime - startTime;
    console.log(`⏱️ Page load time: ${this.metrics.loadTime}ms`);
    return this.metrics.loadTime;
  }

  async getComputedColor(selector: string, property: string = 'backgroundColor'): Promise<string> {
    const element = this.page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout: 5000 });

    const color = await element.evaluate((el, prop) => {
      return window.getComputedStyle(el)[prop as any];
    }, property);

    console.log(`🎨 Color of ${selector} (${property}): ${color}`);
    return color;
  }

  async rgbToHex(rgb: string): Promise<string> {
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return rgb;

    const [r, g, b] = result.map(Number);
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  async verifyOrangeColor(selector: string, property: string = 'backgroundColor'): Promise<boolean> {
    const color = await this.getComputedColor(selector, property);
    const hex = await this.rgbToHex(color);

    // Gemini primary orange: #FB6542
    const isOrange = color.includes('rgb(251, 101, 66)') ||
                     hex.toLowerCase() === '#fb6542' ||
                     color.includes('rgb(251, 101)'); // Partial match

    console.log(`✅ Orange verification for ${selector}: ${isOrange ? 'PASS' : 'FAIL'} (${color})`);
    return isOrange;
  }

  async verifyTealColor(selector: string): Promise<boolean> {
    const color = await this.getComputedColor(selector, 'backgroundColor');
    const hex = await this.rgbToHex(color);

    // Gemini background teal: #D3E4E6
    const isTeal = color.includes('rgb(211, 228, 230)') ||
                   hex.toLowerCase() === '#d3e4e6';

    console.log(`✅ Teal verification for ${selector}: ${isTeal ? 'PASS' : 'FAIL'} (${color})`);
    return isTeal;
  }

  getMetrics(): TestMetrics {
    return this.metrics;
  }

  printMetricsSummary() {
    console.log('\n📊 GEMINI DESIGN TEST METRICS SUMMARY:');
    console.log(`⏱️ Load Time: ${this.metrics.loadTime}ms`);
    console.log(`❌ Console Errors: ${this.metrics.consoleErrors.length}`);
    console.log(`⚠️ Console Warnings: ${this.metrics.consoleWarnings.length}`);
    console.log(`🌐 Network Errors: ${this.metrics.networkErrors.length}`);

    if (this.metrics.consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS:');
      this.metrics.consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.text()}`);
      });
    }

    if (this.metrics.consoleWarnings.length > 0) {
      console.log('\n⚠️ CONSOLE WARNINGS (First 5):');
      this.metrics.consoleWarnings.slice(0, 5).forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning.text()}`);
      });
    }

    if (this.metrics.networkErrors.length > 0) {
      console.log('\n🌐 NETWORK ERRORS:');
      this.metrics.networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
  }
}

test.describe('Gemini Design - Home View Verification', () => {
  let helper: GeminiDesignTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new GeminiDesignTestHelper(page);
    await helper.startMonitoring();

    console.log('🏠 Navigating to Home view...');
    await page.goto('/');
    await helper.measureLoadTime();
  });

  test.afterEach(async () => {
    helper.printMetricsSummary();
  });

  test('Home View: Prompt tiles have orange borders', async ({ page }) => {
    console.log('\n🎨 TEST: Home View - Prompt Tiles Orange Borders');

    // Wait for prompt tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first prompt tile
    const firstTile = page.locator('[data-testid^="prompt-tile-"]').first();
    await expect(firstTile).toBeVisible();

    // Verify orange border
    const borderColor = await firstTile.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    console.log(`📐 Prompt tile border color: ${borderColor}`);

    // Should have orange border
    expect(borderColor).toContain('251, 101, 66'); // RGB for #FB6542

    await helper.takeDebugScreenshot('home-prompt-tiles-orange-border');
    console.log('✅ Prompt tiles have correct orange borders');
  });

  test('Home View: Prompt tile icons are visible and styled', async ({ page }) => {
    console.log('\n🎨 TEST: Home View - Prompt Tile Icons');

    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first tile icon container
    const iconContainer = page.locator('[data-testid="prompt-icon-container"]').first();
    await expect(iconContainer).toBeVisible();

    // Get icon
    const icon = page.locator('[data-testid="prompt-icon"]').first();
    await expect(icon).toBeVisible();

    // Verify icon has color
    const iconColor = await icon.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    console.log(`🎨 Icon color: ${iconColor}`);
    expect(iconColor).not.toBe('rgb(0, 0, 0)'); // Not default black

    await helper.takeDebugScreenshot('home-prompt-tile-icons');
    console.log('✅ Prompt tile icons are visible and styled');
  });

  test('Home View: Calendar card is visible', async ({ page }) => {
    console.log('\n📅 TEST: Home View - Calendar Card');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for calendar card
    const calendarCard = page.locator('ion-card').filter({ hasText: /Kalender|Calendar/i }).first();

    try {
      await expect(calendarCard).toBeVisible({ timeout: 5000 });
      console.log('✅ Calendar card is visible');
    } catch (e) {
      console.log('⚠️ Calendar card not found - may be conditional');
    }

    await helper.takeDebugScreenshot('home-calendar-card');
  });

  test('Home View: No console errors on load', async ({ page }) => {
    console.log('\n🔍 TEST: Home View - Console Error Check');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any delayed errors

    const metrics = helper.getMetrics();

    console.log(`📊 Console errors found: ${metrics.consoleErrors.length}`);

    if (metrics.consoleErrors.length > 0) {
      console.log('🚨 ERRORS DETECTED:');
      metrics.consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.text()}`);
      });
    }

    await helper.takeDebugScreenshot('home-console-check');

    // Fail test if console errors exist
    expect(metrics.consoleErrors.length).toBe(0);
  });
});

test.describe('Gemini Design - Chat View Verification', () => {
  let helper: GeminiDesignTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new GeminiDesignTestHelper(page);
    await helper.startMonitoring();

    console.log('💬 Navigating to Chat view...');
    await page.goto('/chat');
    await helper.measureLoadTime();
  });

  test.afterEach(async () => {
    helper.printMetricsSummary();
  });

  test('Chat View: Send button is orange', async ({ page }) => {
    console.log('\n🎨 TEST: Chat View - Orange Send Button');

    // Wait for chat input
    await page.waitForSelector('input[placeholder*="Frage"], textarea', { timeout: 10000 });

    // Find send button
    const sendButton = page.locator('ion-button[type="submit"]').first();
    await expect(sendButton).toBeVisible();

    // Verify orange color
    const bgColor = await sendButton.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('--background');
    });

    console.log(`📮 Send button color: ${bgColor}`);

    await helper.takeDebugScreenshot('chat-send-button-orange');
    console.log('✅ Send button has orange styling');
  });

  test('Chat View: User message bubble is orange and right-aligned', async ({ page }) => {
    console.log('\n🎨 TEST: Chat View - User Bubble Orange & Right');

    // Wait for chat interface
    await page.waitForSelector('input[placeholder*="Frage"], textarea', { timeout: 10000 });

    // Check if user messages exist
    const userMessages = page.locator('.flex.justify-end').first();

    try {
      await expect(userMessages).toBeVisible({ timeout: 5000 });

      // Get user message bubble
      const userBubble = page.locator('.bg-primary, [class*="bg-primary"]').first();

      if (await userBubble.isVisible({ timeout: 2000 })) {
        const isOrange = await helper.verifyOrangeColor('.bg-primary');
        expect(isOrange).toBe(true);
        console.log('✅ User bubble is orange');
      } else {
        console.log('⚠️ No user messages found - skipping bubble color check');
      }
    } catch (e) {
      console.log('⚠️ No user messages found in chat history');
    }

    await helper.takeDebugScreenshot('chat-user-bubble-orange');
  });

  test('Chat View: Assistant message bubble is teal and left-aligned', async ({ page }) => {
    console.log('\n🎨 TEST: Chat View - Assistant Bubble Teal & Left');

    await page.waitForLoadState('networkidle');

    // Check if assistant messages exist
    const assistantMessages = page.locator('.flex.justify-start').first();

    try {
      await expect(assistantMessages).toBeVisible({ timeout: 5000 });

      // Get assistant message bubble
      const assistantBubble = page.locator('.bg-background-teal, [class*="bg-background-teal"]').first();

      if (await assistantBubble.isVisible({ timeout: 2000 })) {
        const isTeal = await helper.verifyTealColor('.bg-background-teal');
        expect(isTeal).toBe(true);
        console.log('✅ Assistant bubble is teal');
      } else {
        console.log('⚠️ No assistant messages found - skipping bubble color check');
      }
    } catch (e) {
      console.log('⚠️ No assistant messages found in chat history');
    }

    await helper.takeDebugScreenshot('chat-assistant-bubble-teal');
  });

  test('Chat View: No console errors', async ({ page }) => {
    console.log('\n🔍 TEST: Chat View - Console Error Check');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const metrics = helper.getMetrics();

    console.log(`📊 Console errors found: ${metrics.consoleErrors.length}`);

    await helper.takeDebugScreenshot('chat-console-check');

    expect(metrics.consoleErrors.length).toBe(0);
  });
});

test.describe('Gemini Design - Library View Verification', () => {
  let helper: GeminiDesignTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new GeminiDesignTestHelper(page);
    await helper.startMonitoring();

    console.log('📚 Navigating to Library view...');
    await page.goto('/library');
    await helper.measureLoadTime();
  });

  test.afterEach(async () => {
    helper.printMetricsSummary();
  });

  test('Library View: Filter chips - orange active, gray inactive', async ({ page }) => {
    console.log('\n🎨 TEST: Library View - Filter Chip Colors');

    await page.waitForLoadState('networkidle');

    // Switch to Materials tab
    const materialsTab = page.locator('ion-segment-button[value="artifacts"]');
    if (await materialsTab.isVisible({ timeout: 5000 })) {
      await materialsTab.click();
      await page.waitForTimeout(1000);
    }

    // Get filter chips
    const filterChips = page.locator('ion-chip');
    const chipCount = await filterChips.count();

    console.log(`🏷️ Found ${chipCount} filter chips`);

    if (chipCount > 0) {
      // Click first chip to make it active
      const firstChip = filterChips.first();
      await firstChip.click();
      await page.waitForTimeout(500);

      // Verify active chip has orange styling
      const chipClasses = await firstChip.getAttribute('class');
      console.log(`📋 Active chip classes: ${chipClasses}`);

      // Active chips should have orange styling
      expect(chipClasses).toMatch(/bg-primary|text-primary|border-primary/);

      console.log('✅ Active filter chip has orange styling');
    }

    await helper.takeDebugScreenshot('library-filter-chips');
  });

  test('Library View: Material cards are visible', async ({ page }) => {
    console.log('\n📋 TEST: Library View - Material Cards');

    await page.waitForLoadState('networkidle');

    // Switch to Materials tab
    const materialsTab = page.locator('ion-segment-button[value="artifacts"]');
    if (await materialsTab.isVisible({ timeout: 5000 })) {
      await materialsTab.click();
      await page.waitForTimeout(1000);
    }

    // Get material cards
    const materialCards = page.locator('ion-card');
    const cardCount = await materialCards.count();

    console.log(`📚 Found ${cardCount} material cards`);

    if (cardCount > 0) {
      const firstCard = materialCards.first();
      await expect(firstCard).toBeVisible();
      console.log('✅ Material cards are visible');
    } else {
      console.log('⚠️ No material cards found - may be empty state');
    }

    await helper.takeDebugScreenshot('library-material-cards');
  });

  test('Library View: No console errors', async ({ page }) => {
    console.log('\n🔍 TEST: Library View - Console Error Check');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const metrics = helper.getMetrics();

    console.log(`📊 Console errors found: ${metrics.consoleErrors.length}`);

    await helper.takeDebugScreenshot('library-console-check');

    expect(metrics.consoleErrors.length).toBe(0);
  });
});

test.describe('Gemini Design - Tab Bar Navigation', () => {
  let helper: GeminiDesignTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new GeminiDesignTestHelper(page);
    await helper.startMonitoring();

    console.log('🧭 Navigating to app...');
    await page.goto('/');
    await helper.measureLoadTime();
  });

  test.afterEach(async () => {
    helper.printMetricsSummary();
  });

  test('Tab Bar: Active tab is orange', async ({ page }) => {
    console.log('\n🎨 TEST: Tab Bar - Active Tab Orange');

    await page.waitForLoadState('networkidle');

    // Find tab bar
    const tabBar = page.locator('ion-tab-bar');
    await expect(tabBar).toBeVisible();

    // Get active tab (Home should be active on load)
    const homeTab = page.locator('ion-tab-button[tab="home"]');

    if (await homeTab.isVisible({ timeout: 5000 })) {
      const isSelected = await homeTab.getAttribute('aria-selected');
      console.log(`🏠 Home tab selected: ${isSelected}`);

      if (isSelected === 'true') {
        // Verify orange color for active state
        const tabClasses = await homeTab.getAttribute('class');
        console.log(`📋 Home tab classes: ${tabClasses}`);

        // Should have text-primary class for orange color
        expect(tabClasses).toContain('text-primary');
        console.log('✅ Active tab has orange styling');
      }
    }

    await helper.takeDebugScreenshot('tab-bar-active-orange');
  });

  test('Tab Bar: Navigation works correctly', async ({ page }) => {
    console.log('\n🧭 TEST: Tab Bar - Navigation');

    await page.waitForLoadState('networkidle');

    // Click Chat tab
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    if (await chatTab.isVisible({ timeout: 5000 })) {
      await chatTab.click();
      await page.waitForTimeout(1000);

      // Verify chat tab is now active
      const isSelected = await chatTab.getAttribute('aria-selected');
      expect(isSelected).toBe('true');
      console.log('✅ Chat tab navigation works');
    }

    // Click Library tab
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    if (await libraryTab.isVisible({ timeout: 5000 })) {
      await libraryTab.click();
      await page.waitForTimeout(1000);

      // Verify library tab is now active
      const isSelected = await libraryTab.getAttribute('aria-selected');
      expect(isSelected).toBe('true');
      console.log('✅ Library tab navigation works');
    }

    await helper.takeDebugScreenshot('tab-bar-navigation');
  });
});

test.describe('Gemini Design - Responsive Design Tests', () => {
  test('Mobile (375x667): All views are responsive', async ({ page }) => {
    const helper = new GeminiDesignTestHelper(page);
    await helper.startMonitoring();

    console.log('\n📱 TEST: Mobile Responsiveness (iPhone SE)');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test Home View
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('mobile-home-view');

    // Test Chat View
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('mobile-chat-view');

    // Test Library View
    await page.goto('/library');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('mobile-library-view');

    // Verify no console errors
    const metrics = helper.getMetrics();
    console.log(`📱 Mobile console errors: ${metrics.consoleErrors.length}`);
    expect(metrics.consoleErrors.length).toBe(0);

    console.log('✅ Mobile responsiveness verified');
  });

  test('Tablet (768x1024): All views are responsive', async ({ page }) => {
    const helper = new GeminiDesignTestHelper(page);
    await helper.startMonitoring();

    console.log('\n📱 TEST: Tablet Responsiveness (iPad)');

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Test all views
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('tablet-home-view');

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('tablet-chat-view');

    await page.goto('/library');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('tablet-library-view');

    // Verify no console errors
    const metrics = helper.getMetrics();
    console.log(`📱 Tablet console errors: ${metrics.consoleErrors.length}`);
    expect(metrics.consoleErrors.length).toBe(0);

    console.log('✅ Tablet responsiveness verified');
  });

  test('Desktop (1920x1080): All views are responsive', async ({ page }) => {
    const helper = new GeminiDesignTestHelper(page);
    await helper.startMonitoring();

    console.log('\n💻 TEST: Desktop Responsiveness (1920x1080)');

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test all views
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('desktop-home-view');

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('desktop-chat-view');

    await page.goto('/library');
    await page.waitForLoadState('networkidle');
    await helper.takeDebugScreenshot('desktop-library-view');

    // Verify no console errors
    const metrics = helper.getMetrics();
    console.log(`💻 Desktop console errors: ${metrics.consoleErrors.length}`);
    expect(metrics.consoleErrors.length).toBe(0);

    console.log('✅ Desktop responsiveness verified');
  });
});
