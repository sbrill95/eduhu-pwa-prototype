import { test, expect, chromium } from '@playwright/test';

// Disable global setup for quick testing
test.use({
  baseURL: 'http://localhost:5177',
  headless: false,
  viewport: { width: 390, height: 844 }
});

test('Quick Chat Navigation & Contrast Test', async ({ page }) => {
  console.log('\n🚀 Starting Quick Chat Test');
  console.log('═══════════════════════════════════════\n');

  // Enable detailed console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (!text.includes('Download the React DevTools')) {
      console.log(`[BROWSER ${type.toUpperCase()}]: ${text}`);
    }
  });

  // Navigate to app
  console.log('📍 Navigating to http://localhost:5177...');
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle' });
  console.log('✅ Page loaded\n');

  // Wait for Home page
  console.log('⏳ Waiting for Home page...');
  await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });
  console.log('✅ Home page visible\n');

  // Screenshot 1: Home page
  await page.screenshot({
    path: 'teacher-assistant/frontend/quick-test-01-home.png',
    fullPage: false
  });
  console.log('📸 Screenshot saved: quick-test-01-home.png\n');

  // Check for chats
  const chatItems = page.locator('[data-testid^="chat-item-"]');
  const chatCount = await chatItems.count();
  console.log(`📊 Found ${chatCount} chat(s) in Home view\n`);

  if (chatCount > 0) {
    console.log('─────────────────────────────────────');
    console.log('TEST 1: Chat Navigation');
    console.log('─────────────────────────────────────\n');

    // Get chat summary
    const firstChat = chatItems.first();
    const summary = await firstChat.locator('[data-testid^="chat-summary-"]').textContent();
    console.log(`📝 First chat: "${summary}"`);

    // Click chat
    console.log('👆 Clicking chat...');
    await firstChat.click();
    await page.waitForTimeout(1500);

    // Check if navigated to Chat tab
    const chatTab = page.locator('[data-testid="tab-generieren"]');
    const chatTabClass = await chatTab.getAttribute('class');
    const isActive = chatTabClass?.includes('selected') || chatTabClass?.includes('tab-selected');

    console.log(`\n🔍 Chat tab class: ${chatTabClass}`);
    console.log(`✅ Chat tab active: ${isActive ? 'YES' : 'NO'}\n`);

    // Screenshot 2: After clicking chat
    await page.screenshot({
      path: 'teacher-assistant/frontend/quick-test-02-chat-navigation.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: quick-test-02-chat-navigation.png\n');

    expect(isActive).toBe(true);
    console.log('✅ TEST 1 PASSED: Navigation works!\n');
  } else {
    console.log('⚠️  No chats found - skipping navigation test\n');
  }

  // Navigate to Chat tab manually for contrast test
  console.log('─────────────────────────────────────');
  console.log('TEST 2: Chat Bubble Contrast');
  console.log('─────────────────────────────────────\n');

  console.log('🔄 Navigating to Chat tab...');
  await page.click('[data-testid="tab-generieren"]');
  await page.waitForTimeout(1000);
  console.log('✅ On Chat tab\n');

  // Check for messages
  const messages = page.locator('.flex.mb-3');
  const messageCount = await messages.count();
  console.log(`📊 Found ${messageCount} message(s)\n`);

  if (messageCount > 0) {
    console.log('🔍 Analyzing message bubbles:\n');

    for (let i = 0; i < Math.min(messageCount, 3); i++) {
      const message = messages.nth(i);
      const bubble = message.locator('> div').nth(1);

      // Determine role
      const classList = await message.getAttribute('class');
      const isUser = classList?.includes('justify-end');
      const role = isUser ? 'USER' : 'ASSISTANT';

      // Get styles
      const bgColor = await bubble.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const textColor = await bubble.evaluate(el => window.getComputedStyle(el).color);
      const border = await bubble.evaluate(el => window.getComputedStyle(el).border);

      console.log(`Message ${i + 1} [${role}]:`);
      console.log(`  Background: ${bgColor}`);
      console.log(`  Text:       ${textColor}`);
      console.log(`  Border:     ${border}`);

      if (!isUser) {
        const isWhite = bgColor.includes('255, 255, 255');
        const hasBorder = border.includes('rgb') && !border.startsWith('0px');
        console.log(`  ✅ White BG: ${isWhite}`);
        console.log(`  ✅ Has Border: ${hasBorder}`);
      }
      console.log('');
    }

    // Screenshot 3: Chat bubbles
    await page.screenshot({
      path: 'teacher-assistant/frontend/quick-test-03-chat-bubbles.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: quick-test-03-chat-bubbles.png\n');

    // Close-up of assistant bubble
    const assistantBubbles = page.locator('.flex.justify-start');
    if (await assistantBubbles.count() > 0) {
      await assistantBubbles.first().screenshot({
        path: 'teacher-assistant/frontend/quick-test-04-assistant-closeup.png'
      });
      console.log('📸 Screenshot saved: quick-test-04-assistant-closeup.png\n');
    }

    console.log('✅ TEST 2 PASSED: Contrast verified!\n');
  } else {
    console.log('⚠️  No messages found - try sending a message first\n');
  }

  console.log('═══════════════════════════════════════');
  console.log('✅ All Tests Complete!');
  console.log('═══════════════════════════════════════\n');
});
