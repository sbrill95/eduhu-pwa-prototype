import { test, expect } from '@playwright/test';

test.describe('Chat Summaries - Complete E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(2000); // Wait for app to load
  });

  test('should display chat summaries in Home view', async ({ page }) => {
    // Set viewport to mobile (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    // Wait for Home page to load
    await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });

    // Take screenshot of Home view with chat summaries
    await page.screenshot({
      path: 'teacher-assistant/frontend/home-chat-summaries.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: home-chat-summaries.png');

    // Verify chat summary elements exist
    const chatSummaries = page.locator('[data-testid^="chat-summary-"]');
    const count = await chatSummaries.count();

    if (count > 0) {
      console.log(`✅ Found ${count} chat summaries in Home view`);

      // Verify first summary
      const firstSummary = chatSummaries.first();
      const summaryText = await firstSummary.textContent();
      console.log(`   First summary: "${summaryText}"`);

      // Verify text is not empty
      expect(summaryText).toBeTruthy();
      expect(summaryText!.length).toBeGreaterThan(0);
    } else {
      console.log('ℹ️  No chats found (expected for fresh install)');
    }
  });

  test('should display chat summaries in Library view', async ({ page }) => {
    // Set viewport to mobile (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to Library/Automatisieren tab
    await page.click('[data-testid="tab-automatisieren"]');
    await page.waitForTimeout(1000);

    // Take screenshot of Library view with chat summaries
    await page.screenshot({
      path: 'teacher-assistant/frontend/library-chat-summaries.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: library-chat-summaries.png');

    // Verify chat summary elements exist in Library
    const libraryChatSummaries = page.locator('[data-testid^="library-chat-summary-"]');
    const count = await libraryChatSummaries.count();

    if (count > 0) {
      console.log(`✅ Found ${count} chat summaries in Library view`);

      // Verify first summary
      const firstSummary = libraryChatSummaries.first();
      const summaryText = await firstSummary.textContent();
      console.log(`   First summary: "${summaryText}"`);

      // Verify text is not empty
      expect(summaryText).toBeTruthy();
      expect(summaryText!.length).toBeGreaterThan(0);
    } else {
      console.log('ℹ️  No chats found in Library (expected for fresh install)');
    }
  });

  test('should verify responsive font sizing', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iphone-se' },
      { width: 390, height: 844, name: 'iphone-12' },
      { width: 393, height: 851, name: 'pixel-5' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Navigate to Home
      await page.goto('http://localhost:5177');
      await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: `teacher-assistant/frontend/chat-summary-${viewport.name}.png`,
        fullPage: false // Only visible viewport
      });

      console.log(`✅ Screenshot saved: chat-summary-${viewport.name}.png`);

      // Verify text is visible and not cut off
      const chatSummaries = page.locator('[data-testid^="chat-summary-"]');
      const count = await chatSummaries.count();

      if (count > 0) {
        const firstSummary = chatSummaries.first();
        const isVisible = await firstSummary.isVisible();
        expect(isVisible).toBe(true);
        console.log(`   ✅ Chat summary visible on ${viewport.name}`);
      }
    }
  });

  test('should verify dynamic font size logic', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });

    // Get all chat summaries
    const chatSummaries = page.locator('[data-testid^="chat-summary-"]');
    const count = await chatSummaries.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const summary = chatSummaries.nth(i);
        const text = await summary.textContent();
        const fontSize = await summary.evaluate(el => window.getComputedStyle(el).fontSize);

        console.log(`Chat ${i + 1}:`);
        console.log(`   Text: "${text}" (${text?.length} chars)`);
        console.log(`   Font size: ${fontSize}`);

        // Verify dynamic sizing
        if (text && text.length <= 10) {
          expect(fontSize).toBe('14px'); // text-sm
        } else {
          expect(fontSize).toBe('12px'); // text-xs
        }
      }
    } else {
      console.log('ℹ️  No chats to test font sizing (skip test)');
    }
  });

  test('should verify text truncation with ellipsis', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });

    // Get all chat summaries
    const chatSummaries = page.locator('[data-testid^="chat-summary-"]');
    const count = await chatSummaries.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const summary = chatSummaries.nth(i);

        // Check CSS properties for truncation
        const textOverflow = await summary.evaluate(el => window.getComputedStyle(el).textOverflow);
        const whiteSpace = await summary.evaluate(el => window.getComputedStyle(el).whiteSpace);
        const overflow = await summary.evaluate(el => window.getComputedStyle(el).overflow);

        console.log(`Chat ${i + 1} truncation CSS:`);
        console.log(`   text-overflow: ${textOverflow}`);
        console.log(`   white-space: ${whiteSpace}`);
        console.log(`   overflow: ${overflow}`);

        // Verify truncation is properly configured
        expect(textOverflow).toBe('ellipsis');
        expect(whiteSpace).toBe('nowrap');
        expect(overflow).toBe('hidden');
      }

      // Take screenshot showing truncation
      await page.screenshot({
        path: 'teacher-assistant/frontend/chat-summary-truncated.png',
        fullPage: false
      });

      console.log('✅ Screenshot saved: chat-summary-truncated.png');
    } else {
      console.log('ℹ️  No chats to test truncation (skip test)');
    }
  });
});
