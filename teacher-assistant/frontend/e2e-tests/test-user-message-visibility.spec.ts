import { test } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:5177',
  headless: false,
  viewport: { width: 390, height: 844 }
});

test('Test User Message Text Visibility', async ({ page }) => {
  console.log('\n🔍 TESTING USER MESSAGE TEXT VISIBILITY');
  console.log('═══════════════════════════════════════════════\n');

  // Navigate to app
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('✓ Page loaded\n');

  // Click Chat tab
  const chatButton = page.locator('button').filter({ hasText: 'Chat' });
  await chatButton.first().click();
  await page.waitForTimeout(1500);
  console.log('✓ Navigated to Chat tab\n');

  // Take screenshot of empty chat
  await page.screenshot({
    path: 'teacher-assistant/frontend/user-msg-01-empty-chat.png',
    fullPage: true
  });
  console.log('📸 Screenshot 1: user-msg-01-empty-chat.png\n');

  // Find input field
  const inputField = page.locator('textarea[placeholder*="Nachricht"]').or(
    page.locator('input[placeholder*="Nachricht"]')
  );

  console.log('🔍 Looking for input field...');
  const inputCount = await inputField.count();
  console.log(`Found ${inputCount} input field(s)\n`);

  if (inputCount > 0) {
    // Type a test message
    const testMessage = 'Dies ist eine Testnachricht um die Textfarbe zu prüfen';
    console.log(`⌨️  Typing message: "${testMessage}"`);
    await inputField.first().fill(testMessage);
    await page.waitForTimeout(500);
    console.log('✓ Message typed\n');

    // Screenshot input field with message
    await page.screenshot({
      path: 'teacher-assistant/frontend/user-msg-02-typed-message.png',
      fullPage: true
    });
    console.log('📸 Screenshot 2: user-msg-02-typed-message.png\n');

    // Find and click send button
    console.log('🔍 Looking for send button...');
    const sendButton = page.locator('button[type="submit"]').first();

    const isDisabled = await sendButton.isDisabled();
    console.log(`Send button disabled: ${isDisabled}\n`);

    if (!isDisabled) {
      console.log('👆 Clicking send button...');
      await sendButton.click();
      console.log('✓ Clicked send button\n');

      // Wait for message to appear
      console.log('⏳ Waiting for message to appear...');
      await page.waitForTimeout(2000);

      // Find user message bubble (justify-end)
      const userMessages = page.locator('.flex.justify-end.mb-3');
      const userMsgCount = await userMessages.count();
      console.log(`📊 Found ${userMsgCount} user message(s)\n`);

      if (userMsgCount > 0) {
        // Take screenshot of chat with message
        await page.screenshot({
          path: 'teacher-assistant/frontend/user-msg-03-message-sent.png',
          fullPage: true
        });
        console.log('📸 Screenshot 3: user-msg-03-message-sent.png\n');

        console.log('🔍 Analyzing user message styling:\n');

        // Get the actual message bubble div (second child)
        const userBubble = userMessages.first().locator('> div').last();

        // Get computed styles
        const bgColor = await userBubble.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return computed.backgroundColor;
        });

        const textColor = await userBubble.evaluate(el => {
          const computed = window.getComputedStyle(el);
          // Check both the div and any child p/span elements
          const divColor = computed.color;
          const textElements = el.querySelectorAll('p, span, div');
          const colors = Array.from(textElements).map(e => window.getComputedStyle(e).color);
          return {
            divColor,
            childColors: colors
          };
        });

        const borderRadius = await userBubble.evaluate(el => {
          return window.getComputedStyle(el).borderRadius;
        });

        console.log('═══════════════════════════════════════════════');
        console.log('USER MESSAGE BUBBLE ANALYSIS');
        console.log('═══════════════════════════════════════════════');
        console.log(`Background Color: ${bgColor}`);
        console.log(`Text Color (div): ${textColor.divColor}`);
        console.log(`Text Colors (children): ${JSON.stringify(textColor.childColors, null, 2)}`);
        console.log(`Border Radius: ${borderRadius}`);
        console.log('═══════════════════════════════════════════════\n');

        // Take closeup screenshot of the message
        await userMessages.first().screenshot({
          path: 'teacher-assistant/frontend/user-msg-04-message-closeup.png'
        });
        console.log('📸 Screenshot 4: user-msg-04-message-closeup.png (closeup)\n');

        // Check contrast
        const isPrimaryBg = bgColor.includes('251') || bgColor.includes('fb') || bgColor.includes('101');
        const isWhiteText = textColor.divColor.includes('255, 255, 255') ||
                           textColor.divColor.includes('rgb(255, 255, 255)') ||
                           textColor.childColors.some((c: string) => c.includes('255, 255, 255'));

        console.log('═══════════════════════════════════════════════');
        console.log('CONTRAST CHECK');
        console.log('═══════════════════════════════════════════════');
        console.log(`✓ Orange Background (#FB6542): ${isPrimaryBg ? 'YES ✅' : 'NO ❌'}`);
        console.log(`✓ White Text (#FFFFFF): ${isWhiteText ? 'YES ✅' : 'NO ❌'}`);
        console.log(`✓ Good Contrast: ${isPrimaryBg && isWhiteText ? 'YES ✅' : 'NO ❌'}`);
        console.log('═══════════════════════════════════════════════\n');

        // Also check ProgressiveMessage component if present
        const progressiveText = userBubble.locator('p').first();
        if (await progressiveText.count() > 0) {
          const pColor = await progressiveText.evaluate(el => window.getComputedStyle(el).color);
          const pStyle = await progressiveText.evaluate(el => el.getAttribute('style'));

          console.log('ProgressiveMessage <p> element:');
          console.log(`  Computed color: ${pColor}`);
          console.log(`  Inline style: ${pStyle}`);
          console.log('');
        }

      } else {
        console.log('⚠️  No user messages found after sending\n');
      }

    } else {
      console.log('⚠️  Send button is disabled (message might be too short or validation failed)\n');
    }

  } else {
    console.log('⚠️  No input field found\n');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✅ Test Complete');
  console.log('═══════════════════════════════════════════════\n');
});
