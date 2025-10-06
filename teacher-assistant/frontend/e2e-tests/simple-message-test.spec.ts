import { test } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:5177',
  viewport: { width: 390, height: 844 }
});

test('Simple User Message Visibility Test', async ({ page }) => {
  console.log('\n🔍 SIMPLE USER MESSAGE VISIBILITY TEST');
  console.log('═══════════════════════════════════════════════\n');

  // Navigate to app
  await page.goto('http://localhost:5177');
  await page.waitForLoadState('networkidle');
  console.log('✓ Page loaded\n');

  // Wait for app to be ready
  await page.waitForTimeout(3000);

  // Screenshot home
  await page.screenshot({
    path: 'user-msg-01-home.png',
    fullPage: true
  });
  console.log('📸 Screenshot 1: user-msg-01-home.png\n');

  // Click Chat tab
  console.log('👆 Clicking Chat tab...');
  const chatButton = page.locator('button').filter({ hasText: 'Chat' });
  await chatButton.first().click();
  await page.waitForTimeout(2000);
  console.log('✓ Chat tab opened\n');

  // Screenshot chat view
  await page.screenshot({
    path: 'user-msg-02-chat-view.png',
    fullPage: true
  });
  console.log('📸 Screenshot 2: user-msg-02-chat-view.png\n');

  // Type message
  console.log('⌨️  Typing test message...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('Test: Ist dieser Text gut lesbar?');
  await page.waitForTimeout(500);
  console.log('✓ Message typed\n');

  // Screenshot with typed message
  await page.screenshot({
    path: 'user-msg-03-typed.png',
    fullPage: true
  });
  console.log('📸 Screenshot 3: user-msg-03-typed.png\n');

  // Click send
  console.log('👆 Clicking send...');
  const sendButton = page.locator('button[type="submit"]').first();
  await sendButton.click();
  console.log('✓ Send clicked\n');

  // Wait just a bit for message to appear (don't wait for response)
  await page.waitForTimeout(1000);

  // Screenshot after send
  await page.screenshot({
    path: 'user-msg-04-after-send.png',
    fullPage: true
  });
  console.log('📸 Screenshot 4: user-msg-04-after-send.png\n');

  // Check for user message
  const userMessages = page.locator('.flex.justify-end.mb-3');
  const msgCount = await userMessages.count();
  console.log(`📊 Found ${msgCount} user message(s)\n`);

  if (msgCount > 0) {
    // Get the message bubble
    const bubble = userMessages.first().locator('> div').last();

    // Analyze colors
    const colors = await bubble.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        bg: style.backgroundColor,
        color: style.color,
        text: el.textContent
      };
    });

    console.log('═══════════════════════════════════════════════');
    console.log('MESSAGE BUBBLE COLORS:');
    console.log(`  Background: ${colors.bg}`);
    console.log(`  Text Color: ${colors.color}`);
    console.log(`  Text Content: "${colors.text}"`);
    console.log('═══════════════════════════════════════════════\n');

    // Closeup screenshot
    await userMessages.first().screenshot({
      path: 'user-msg-05-bubble-closeup.png'
    });
    console.log('📸 Screenshot 5: user-msg-05-bubble-closeup.png\n');

    // Check if it's orange bg and white text
    const isOrange = colors.bg.includes('251') || colors.bg.includes('101') || colors.bg.includes('66');
    const isWhite = colors.color.includes('255, 255, 255');

    console.log('VISIBILITY CHECK:');
    console.log(`  Orange BG: ${isOrange ? '✅ YES' : '❌ NO'}`);
    console.log(`  White Text: ${isWhite ? '✅ YES' : '❌ NO'}`);
    console.log(`  Good Contrast: ${isOrange && isWhite ? '✅ YES' : '❌ NO'}\n`);
  }

  console.log('✅ Test Complete\n');
});
