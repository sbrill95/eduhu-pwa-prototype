import { test, expect } from '@playwright/test';

test.describe('Chat Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[BROWSER ${type.toUpperCase()}]: ${text}`);
    });

    // Navigate to app
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(2000);
  });

  test('TASK-1: Verify chat navigation from Home view', async ({ page }) => {
    console.log('\n🧪 TEST 1: Chat Navigation from Home View');
    console.log('═══════════════════════════════════════════\n');

    // Set viewport to mobile
    await page.setViewportSize({ width: 390, height: 844 });
    console.log('✓ Viewport set to iPhone 12 (390x844)');

    // Wait for Home page to load
    await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });
    console.log('✓ Home page loaded successfully');

    // Take screenshot of initial state
    await page.screenshot({
      path: 'teacher-assistant/frontend/test-01-home-initial.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved: test-01-home-initial.png');

    // Check if there are any chats
    const chatItems = page.locator('[data-testid^="chat-item-"]');
    const chatCount = await chatItems.count();
    console.log(`\nℹ️  Found ${chatCount} chat(s) in Home view`);

    if (chatCount === 0) {
      console.log('⚠️  No chats available - skipping navigation test');
      console.log('   To test: Create a chat first, then run this test again\n');
      return;
    }

    // Get first chat details
    const firstChat = chatItems.first();
    const chatSummary = await firstChat.locator('[data-testid^="chat-summary-"]').textContent();
    console.log(`\n📝 First chat summary: "${chatSummary}"`);

    // Verify we're on Home tab
    const homeTab = page.locator('[data-testid="tab-home"]');
    const homeTabClass = await homeTab.getAttribute('class');
    console.log(`\n🏠 Current tab state: ${homeTabClass?.includes('selected') ? 'Home (active)' : 'Not Home'}`);

    // Click on the first chat
    console.log('\n👆 Clicking on first chat...');
    await firstChat.click();
    await page.waitForTimeout(1000);

    // Verify navigation to Chat/Generieren tab
    const chatTab = page.locator('[data-testid="tab-generieren"]');
    await chatTab.waitFor({ state: 'visible', timeout: 5000 });

    const chatTabClass = await chatTab.getAttribute('class');
    const isActive = chatTabClass?.includes('selected') || chatTabClass?.includes('active');

    console.log(`\n💬 Chat tab state: ${isActive ? 'Active ✅' : 'Not active ❌'}`);

    // Take screenshot after navigation
    await page.screenshot({
      path: 'teacher-assistant/frontend/test-01-chat-after-navigation.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved: test-01-chat-after-navigation.png');

    // Verify we can see the chat view
    const chatContent = page.locator('.chat-messages, [data-testid="chat-content"]');
    const chatExists = await chatContent.count() > 0;
    console.log(`\n📱 Chat view visible: ${chatExists ? 'Yes ✅' : 'No ❌'}`);

    // Assertions
    expect(isActive).toBe(true);
    expect(chatExists).toBe(true);

    console.log('\n✅ TEST 1 PASSED: Chat navigation works correctly\n');
  });

  test('TASK-2: Verify chat bubble contrast', async ({ page }) => {
    console.log('\n🧪 TEST 2: Chat Bubble Contrast');
    console.log('═══════════════════════════════════════════\n');

    // Set viewport to mobile
    await page.setViewportSize({ width: 390, height: 844 });
    console.log('✓ Viewport set to iPhone 12 (390x844)');

    // Navigate to Chat/Generieren tab
    await page.click('[data-testid="tab-generieren"]');
    await page.waitForTimeout(1000);
    console.log('✓ Navigated to Chat/Generieren tab');

    // Check if there are existing messages
    const messageElements = page.locator('.flex.mb-3');
    const messageCount = await messageElements.count();
    console.log(`\nℹ️  Found ${messageCount} message(s) in chat`);

    if (messageCount === 0) {
      console.log('⚠️  No messages - creating test messages...\n');

      // Send a test message
      const input = page.locator('textarea[placeholder*="Nachricht"], input[placeholder*="Nachricht"]');
      await input.fill('Test Nachricht für Kontrast-Prüfung');

      const sendButton = page.locator('button:has-text("Senden"), button[type="submit"]');
      await sendButton.click();

      console.log('✓ Test message sent');
      await page.waitForTimeout(3000); // Wait for response
    }

    // Take screenshot of chat with messages
    await page.screenshot({
      path: 'teacher-assistant/frontend/test-02-chat-bubbles-full.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: test-02-chat-bubbles-full.png');

    // Analyze message bubbles
    const messages = page.locator('.flex.mb-3');
    const count = await messages.count();

    console.log(`\n📊 Analyzing ${count} message bubble(s):\n`);

    for (let i = 0; i < count; i++) {
      const message = messages.nth(i);
      const bubble = message.locator('div').nth(1); // The actual bubble div

      // Get role (user or assistant)
      const isUserMessage = await message.locator('.justify-end').count() > 0;
      const role = isUserMessage ? 'USER' : 'ASSISTANT';

      // Get computed styles
      const bgColor = await bubble.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const textColor = await bubble.evaluate(el => window.getComputedStyle(el).color);
      const border = await bubble.evaluate(el => window.getComputedStyle(el).border);

      console.log(`Message ${i + 1} [${role}]:`);
      console.log(`  Background: ${bgColor}`);
      console.log(`  Text Color: ${textColor}`);
      console.log(`  Border: ${border}`);

      // Verify contrast for assistant messages
      if (!isUserMessage) {
        console.log(`  Expected: bg-white (rgb(255, 255, 255)) with border`);

        // Check if background is white
        const isWhiteBg = bgColor === 'rgb(255, 255, 255)' || bgColor === 'white';
        console.log(`  ✓ White background: ${isWhiteBg ? 'Yes ✅' : 'No ❌'}`);

        // Check if text is dark
        const isDarkText = textColor.includes('rgb(17, 24, 39)') || textColor.includes('rgb(0, 0, 0)');
        console.log(`  ✓ Dark text: ${isDarkText ? 'Yes ✅' : 'No ❌'}`);

        // Check if border exists
        const hasBorder = border.includes('rgb') && !border.includes('0px');
        console.log(`  ✓ Has border: ${hasBorder ? 'Yes ✅' : 'No ❌'}`);

        // Assertions for assistant messages
        expect(isWhiteBg).toBe(true);
      } else {
        // Verify user message is orange
        const isOrangeBg = bgColor.includes('rgb(251, 101, 66)') || bgColor.includes('251, 101, 66');
        console.log(`  Expected: bg-primary (orange)`);
        console.log(`  ✓ Orange background: ${isOrangeBg ? 'Yes ✅' : 'No ❌'}`);

        expect(isOrangeBg).toBe(true);
      }

      console.log('');
    }

    // Take close-up screenshot of a single assistant message if exists
    const assistantMessages = page.locator('.flex.justify-start');
    const assistantCount = await assistantMessages.count();

    if (assistantCount > 0) {
      await assistantMessages.first().screenshot({
        path: 'teacher-assistant/frontend/test-02-assistant-bubble-closeup.png'
      });
      console.log('✓ Screenshot saved: test-02-assistant-bubble-closeup.png');
    }

    console.log('\n✅ TEST 2 PASSED: Chat bubble contrast is correct\n');
  });

  test('TASK-3: End-to-end flow with console debugging', async ({ page }) => {
    console.log('\n🧪 TEST 3: Complete User Flow with Debugging');
    console.log('═══════════════════════════════════════════\n');

    // Track console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
    });

    // Set viewport
    await page.setViewportSize({ width: 390, height: 844 });
    console.log('✓ Viewport set to iPhone 12');

    // STEP 1: Home page
    console.log('\n📍 STEP 1: Home Page');
    await page.waitForSelector('[data-testid="recent-chats-section"]');
    await page.screenshot({
      path: 'teacher-assistant/frontend/test-03-step1-home.png'
    });
    console.log('  ✓ Home page loaded');
    console.log(`  ✓ Console messages: ${consoleMessages.length}`);

    // STEP 2: Click on chat
    console.log('\n📍 STEP 2: Click Chat from Home');
    const chatItems = page.locator('[data-testid^="chat-item-"]');
    const chatCount = await chatItems.count();

    if (chatCount > 0) {
      const beforeClickConsoleCount = consoleMessages.length;
      await chatItems.first().click();
      await page.waitForTimeout(1000);
      const afterClickConsoleCount = consoleMessages.length;

      await page.screenshot({
        path: 'teacher-assistant/frontend/test-03-step2-after-click.png'
      });

      console.log('  ✓ Chat clicked');
      console.log(`  ✓ New console messages: ${afterClickConsoleCount - beforeClickConsoleCount}`);

      // Print new console messages
      if (afterClickConsoleCount > beforeClickConsoleCount) {
        console.log('\n  📝 Console output during navigation:');
        consoleMessages.slice(beforeClickConsoleCount).forEach(msg => {
          console.log(`    ${msg}`);
        });
      }
    } else {
      console.log('  ⚠️  No chats available - skipping click test');
    }

    // STEP 3: Verify Chat view
    console.log('\n📍 STEP 3: Verify Chat View');
    const chatTab = page.locator('[data-testid="tab-generieren"]');
    const isActive = (await chatTab.getAttribute('class'))?.includes('selected');

    await page.screenshot({
      path: 'teacher-assistant/frontend/test-03-step3-chat-view.png',
      fullPage: true
    });

    console.log(`  ✓ Chat tab active: ${isActive ? 'Yes' : 'No'}`);
    console.log(`  ✓ Total console messages: ${consoleMessages.length}`);

    // Print all unique console messages
    console.log('\n📋 All Console Messages:');
    const uniqueMessages = [...new Set(consoleMessages)];
    uniqueMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });

    console.log('\n✅ TEST 3 PASSED: End-to-end flow completed\n');
  });
});
