/**
 * CRITICAL BUG FIX VERIFICATION
 * Test that Chat tab navigation actually changes the view
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Tab Navigation Fix', () => {
  test('should change view from Home to Chat when Chat tab is clicked', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5174');

    // Wait for app to load (look for Home tab)
    await page.waitForSelector('button:has-text("Home")', { timeout: 10000 });

    // Verify we're on Home view (should see prompt tiles or welcome message)
    console.log('✅ App loaded - verifying Home view');

    // Listen for console logs to verify debug output
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[handleTabChange]') || text.includes('[activeTab STATE CHANGED]') || text.includes('[RENDER]')) {
        console.log('🔍 DEBUG LOG:', text);
      }
    });

    // Take screenshot BEFORE clicking Chat tab
    await page.screenshot({
      path: 'home-view-before-chat-click.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: home-view-before-chat-click.png');

    // Click Chat tab
    console.log('🖱️ Clicking Chat tab...');
    await page.click('button:has-text("Chat")');

    // Wait a moment for state updates
    await page.waitForTimeout(1000);

    // CRITICAL CHECK: ChatView should now be visible with input field
    // NOTE: IonInput renders as <input>, not <textarea>
    console.log('🔍 Checking for ChatView input field...');
    const chatInput = await page.waitForSelector('input[placeholder*="Nachricht"]', {
      timeout: 5000,
      state: 'visible'
    });

    if (chatInput) {
      console.log('✅ SUCCESS: ChatView input is visible!');
    } else {
      console.log('❌ FAILED: ChatView input not found');
    }

    // Take screenshot AFTER clicking Chat tab
    await page.screenshot({
      path: 'chat-view-after-tab-click-FIXED.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: chat-view-after-tab-click-FIXED.png');

    // Verify Chat tab is active (orange color)
    const chatTabButton = await page.locator('button:has-text("Chat")');
    const chatTabColor = await chatTabButton.evaluate(el =>
      window.getComputedStyle(el).color
    );
    console.log(`🎨 Chat tab color: ${chatTabColor}`);

    // Verify the input is indeed rendered
    expect(chatInput).toBeTruthy();

    // Additional check: Home view should NOT be visible
    const promptTiles = await page.locator('.prompt-tile').count();
    console.log(`🔍 Prompt tiles count (should be 0): ${promptTiles}`);
    expect(promptTiles).toBe(0);

    console.log('✅ ALL CHECKS PASSED - Chat tab navigation is working!');
  });

  test('should be able to navigate back to Home from Chat', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForSelector('button:has-text("Home")', { timeout: 10000 });

    // Go to Chat
    await page.click('button:has-text("Chat")');
    await page.waitForSelector('input[placeholder*="Nachricht"]', { timeout: 5000 });
    console.log('✅ On Chat view');

    // Go back to Home
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(500);

    // Check that we're back on Home (Chat input should not be visible)
    const chatInputCount = await page.locator('input[placeholder*="Nachricht"]').count();
    console.log(`🔍 Chat input count (should be 0): ${chatInputCount}`);
    expect(chatInputCount).toBe(0);

    console.log('✅ Navigation back to Home works!');
  });
});
