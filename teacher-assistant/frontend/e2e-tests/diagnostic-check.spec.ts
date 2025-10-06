import { test } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:5176',
  headless: false,
  viewport: { width: 390, height: 844 }
});

test('DIAGNOSTIC: Check current state', async ({ page }) => {
  console.log('\n🔍 DIAGNOSTIC CHECK - Current State Analysis');
  console.log('═══════════════════════════════════════════════\n');

  // Navigate
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Page loaded\n');

  // Screenshot 1: Home page initial state
  await page.waitForSelector('[data-testid="recent-chats-section"]', { timeout: 10000 });
  await page.screenshot({
    path: 'teacher-assistant/frontend/diagnostic-01-home.png',
    fullPage: true
  });
  console.log('📸 Screenshot 1: diagnostic-01-home.png (Home page)\n');

  // Check for chats and click first one
  const chatItems = page.locator('[data-testid^="chat-item-"]');
  const chatCount = await chatItems.count();
  console.log(`Found ${chatCount} chats\n`);

  if (chatCount > 0) {
    console.log('Clicking first chat...');
    await chatItems.first().click();
    await page.waitForTimeout(2000);

    // Screenshot 2: After clicking chat
    await page.screenshot({
      path: 'teacher-assistant/frontend/diagnostic-02-after-chat-click.png',
      fullPage: true
    });
    console.log('📸 Screenshot 2: diagnostic-02-after-chat-click.png (After clicking chat)\n');

    // Check which tab is active
    const tabs = ['home', 'generieren', 'automatisieren', 'profil'];
    for (const tab of tabs) {
      const tabElement = page.locator(`[data-testid="tab-${tab}"]`);
      if (await tabElement.count() > 0) {
        const classList = await tabElement.getAttribute('class');
        const isActive = classList?.includes('selected') || classList?.includes('tab-selected');
        console.log(`Tab "${tab}": ${isActive ? 'ACTIVE ✅' : 'inactive'}`);
      }
    }
  }

  // Navigate to chat tab manually
  console.log('\n\nNavigating to Chat tab manually...');
  await page.click('[data-testid="tab-generieren"]');
  await page.waitForTimeout(1500);

  // Screenshot 3: Chat view
  await page.screenshot({
    path: 'teacher-assistant/frontend/diagnostic-03-chat-view.png',
    fullPage: true
  });
  console.log('📸 Screenshot 3: diagnostic-03-chat-view.png (Chat view)\n');

  // Check for messages
  const messages = page.locator('.flex.mb-3');
  const messageCount = await messages.count();
  console.log(`Found ${messageCount} messages in chat\n`);

  if (messageCount > 0) {
    console.log('Analyzing first user message bubble:');

    // Find first user message
    const userMessages = page.locator('.flex.mb-3.justify-end');
    if (await userMessages.count() > 0) {
      const firstUserMsg = userMessages.first();
      const bubble = firstUserMsg.locator('> div').nth(1);

      // Get computed styles
      const bgColor = await bubble.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const textElements = await bubble.locator('p').all();

      if (textElements.length > 0) {
        const textColor = await textElements[0].evaluate(el => window.getComputedStyle(el).color);
        const fontSize = await textElements[0].evaluate(el => window.getComputedStyle(el).fontSize);

        console.log(`  Background: ${bgColor}`);
        console.log(`  Text Color: ${textColor}`);
        console.log(`  Font Size: ${fontSize}`);

        // Check if text is white
        const isWhiteText = textColor.includes('255, 255, 255') || textColor.includes('rgb(255, 255, 255)');
        console.log(`  ✓ White text: ${isWhiteText ? 'YES ✅' : 'NO ❌'}\n`);
      }

      // Screenshot 4: Close-up of user message
      await firstUserMsg.screenshot({
        path: 'teacher-assistant/frontend/diagnostic-04-user-message-closeup.png'
      });
      console.log('📸 Screenshot 4: diagnostic-04-user-message-closeup.png (User message close-up)\n');
    }

    // Check assistant message
    console.log('Analyzing first assistant message bubble:');
    const assistantMessages = page.locator('.flex.mb-3.justify-start');
    if (await assistantMessages.count() > 0) {
      const firstAssistantMsg = assistantMessages.first();
      const bubble = firstAssistantMsg.locator('> div').nth(1);

      const bgColor = await bubble.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const textElements = await bubble.locator('p').all();

      if (textElements.length > 0) {
        const textColor = await textElements[0].evaluate(el => window.getComputedStyle(el).color);

        console.log(`  Background: ${bgColor}`);
        console.log(`  Text Color: ${textColor}`);

        const isWhiteBg = bgColor.includes('255, 255, 255');
        console.log(`  ✓ White background: ${isWhiteBg ? 'YES ✅' : 'NO ❌'}\n`);
      }

      await firstAssistantMsg.screenshot({
        path: 'teacher-assistant/frontend/diagnostic-05-assistant-message-closeup.png'
      });
      console.log('📸 Screenshot 5: diagnostic-05-assistant-message-closeup.png (Assistant message)\n');
    }
  }

  // Check send button
  console.log('Analyzing send button:');
  const sendButton = page.locator('button[type="submit"]').first();
  if (await sendButton.count() > 0) {
    const bgColor = await sendButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const isDisabled = await sendButton.isDisabled();

    console.log(`  Disabled: ${isDisabled}`);
    console.log(`  Background: ${bgColor}\n`);

    await sendButton.screenshot({
      path: 'teacher-assistant/frontend/diagnostic-06-send-button.png'
    });
    console.log('📸 Screenshot 6: diagnostic-06-send-button.png (Send button)\n');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✅ Diagnostic screenshots complete');
  console.log('═══════════════════════════════════════════════\n');
});
