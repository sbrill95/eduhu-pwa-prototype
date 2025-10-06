import { test } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:5177',
  headless: false,
  viewport: { width: 390, height: 844 }
});

test('Manual Diagnostic - Navigate and Screenshot', async ({ page }) => {
  console.log('\n🔍 MANUAL DIAGNOSTIC - Analyzing Current State');
  console.log('═══════════════════════════════════════════════\n');

  // Navigate to app
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('✓ Page loaded\n');

  // Screenshot 1: Home page
  await page.screenshot({
    path: 'teacher-assistant/frontend/manual-01-home.png',
    fullPage: true
  });
  console.log('📸 Screenshot 1: manual-01-home.png (Home page)\n');

  // Find and click the Chat tab button (second button in tab bar)
  console.log('🔍 Looking for Chat tab button...');

  // The tab buttons are plain button elements at the bottom
  const tabButtons = page.locator('button').filter({ hasText: 'Chat' });
  const buttonCount = await tabButtons.count();
  console.log(`Found ${buttonCount} button(s) with "Chat" text\n`);

  if (buttonCount > 0) {
    console.log('👆 Clicking Chat tab...');
    await tabButtons.first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked Chat tab\n');

    // Screenshot 2: After clicking Chat tab
    await page.screenshot({
      path: 'teacher-assistant/frontend/manual-02-chat-tab.png',
      fullPage: true
    });
    console.log('📸 Screenshot 2: manual-02-chat-tab.png (Chat tab view)\n');

    // Check for messages in chat
    const messageContainers = page.locator('.flex.mb-3');
    const messageCount = await messageContainers.count();
    console.log(`📊 Found ${messageCount} message(s) in chat\n`);

    if (messageCount > 0) {
      console.log('🔍 Analyzing message styling:\n');

      // Find user message (justify-end)
      const userMessages = page.locator('.flex.justify-end.mb-3');
      if (await userMessages.count() > 0) {
        console.log('Found user message...');
        const userBubble = userMessages.first().locator('> div').nth(1);

        const bgColor = await userBubble.evaluate(el => window.getComputedStyle(el).backgroundColor);
        const textColor = await userBubble.evaluate(el => window.getComputedStyle(el).color);

        console.log(`  User Message:  `);
        console.log(`    BG: ${bgColor}`);
        console.log(`    Text: ${textColor}`);

        // Screenshot user message closeup
        await userMessages.first().screenshot({
          path: 'teacher-assistant/frontend/manual-03-user-message.png'
        });
        console.log('📸 Screenshot 3: manual-03-user-message.png\n');
      }

      // Find assistant message (justify-start)
      const assistantMessages = page.locator('.flex.justify-start.mb-3');
      if (await assistantMessages.count() > 0) {
        console.log('Found assistant message...');
        const assistantBubble = assistantMessages.first().locator('> div').nth(1);

        const bgColor = await assistantBubble.evaluate(el => window.getComputedStyle(el).backgroundColor);
        const textColor = await assistantBubble.evaluate(el => window.getComputedStyle(el).color);
        const border = await assistantBubble.evaluate(el => window.getComputedStyle(el).border);

        console.log(`  Assistant Message:`);
        console.log(`    BG: ${bgColor}`);
        console.log(`    Text: ${textColor}`);
        console.log(`    Border: ${border}`);

        // Screenshot assistant message closeup
        await assistantMessages.first().screenshot({
          path: 'teacher-assistant/frontend/manual-04-assistant-message.png'
        });
        console.log('📸 Screenshot 4: manual-04-assistant-message.png\n');
      }
    }

    // Check send button
    const sendButton = page.locator('button[type="submit"]').first();
    if (await sendButton.count() > 0) {
      const bgColor = await sendButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const isDisabled = await sendButton.isDisabled();

      console.log(`Send Button:`);
      console.log(`  Disabled: ${isDisabled}`);
      console.log(`  BG: ${bgColor}`);

      await sendButton.screenshot({
        path: 'teacher-assistant/frontend/manual-05-send-button.png'
      });
      console.log('📸 Screenshot 5: manual-05-send-button.png\n');
    }
  }

  // Now test navigation from Home
  console.log('═══════════════════════════════════════════════');
  console.log('Testing Chat Item Click Navigation');
  console.log('═══════════════════════════════════════════════\n');

  // Go back to Home
  const homeButton = page.locator('button').filter({ hasText: 'Home' });
  await homeButton.first().click();
  await page.waitForTimeout(1500);
  console.log('✓ Back on Home tab\n');

  // Find chat items
  const chatItems = page.locator('[data-testid^="chat-item-"]');
  const chatCount = await chatItems.count();
  console.log(`Found ${chatCount} chat item(s)\n`);

  if (chatCount > 0) {
    console.log('👆 Clicking first chat item...');
    await chatItems.first().click();
    await page.waitForTimeout(2000);

    // Screenshot after clicking chat
    await page.screenshot({
      path: 'teacher-assistant/frontend/manual-06-after-chat-click.png',
      fullPage: true
    });
    console.log('📸 Screenshot 6: manual-06-after-chat-click.png\n');

    // Check which tab is active now
    const homeBtn = page.locator('button').filter({ hasText: 'Home' });
    const chatBtn = page.locator('button').filter({ hasText: 'Chat' });
    const libraryBtn = page.locator('button').filter({ hasText: 'Library' });

    const homeColor = await homeBtn.first().evaluate(el => window.getComputedStyle(el).color);
    const chatColor = await chatBtn.first().evaluate(el => window.getComputedStyle(el).color);
    const libraryColor = await libraryBtn.first().evaluate(el => window.getComputedStyle(el).color);

    console.log('Tab Colors (active should be orange rgb(251, 101, 66)):');
    console.log(`  Home: ${homeColor}`);
    console.log(`  Chat: ${chatColor}`);
    console.log(`  Library: ${libraryColor}`);

    const isHomeActive = homeColor.includes('251') || homeColor.includes('fb');
    const isChatActive = chatColor.includes('251') || chatColor.includes('fb');

    console.log(`\n✅ Chat navigation worked: ${isChatActive ? 'YES' : 'NO'}\n`);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✅ Diagnostic Complete');
  console.log('═══════════════════════════════════════════════\n');
});
