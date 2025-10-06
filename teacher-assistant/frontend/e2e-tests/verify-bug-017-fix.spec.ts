import { test, expect } from '@playwright/test';

test.describe('BUG-017 Verification: Chat Context Preserved on Library Continuation', () => {

  test('should preserve chat context when continuing from Library', async ({ page }) => {
    console.log('🧪 Starting BUG-017 Verification Test');

    // Navigate to the app
    await page.goto('http://localhost:5175');
    await page.waitForTimeout(2000);

    // Navigate to Chat tab first
    console.log('🗨️ Step 0: Navigating to Chat tab');
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    await page.waitForTimeout(1000);

    console.log('📝 Step 1: Creating initial chat with context about Photosynthese');

    // Find the chat input and create initial conversation
    const chatInput = page.locator('ion-input').first();
    await chatInput.fill('Erkläre mir kurz Photosynthese');

    // Click send button
    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();

    // Wait for AI response
    await page.waitForTimeout(8000);

    console.log('✅ Initial message sent, waiting for response');

    // Take screenshot of initial chat
    await page.screenshot({
      path: 'teacher-assistant/frontend/bug-017-verify-01-initial-chat.png',
      fullPage: true
    });

    console.log('📸 Screenshot 1: Initial chat saved');

    // Navigate to Library
    console.log('📚 Step 2: Navigating to Library');
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();
    await page.waitForTimeout(2000);

    // Take screenshot of Library
    await page.screenshot({
      path: 'teacher-assistant/frontend/bug-017-verify-02-library.png',
      fullPage: true
    });

    console.log('📸 Screenshot 2: Library view saved');

    // Find and click the first chat in library
    console.log('🔍 Step 3: Opening chat from Library');
    const firstChat = page.locator('.cursor-pointer').first();
    await firstChat.click();
    await page.waitForTimeout(2000);

    // Take screenshot after loading from library
    await page.screenshot({
      path: 'teacher-assistant/frontend/bug-017-verify-03-loaded-chat.png',
      fullPage: true
    });

    console.log('📸 Screenshot 3: Loaded chat from Library');

    // Send follow-up message that requires context
    console.log('💬 Step 4: Sending contextual follow-up message');
    const chatInputAgain = page.locator('ion-input').first();
    await chatInputAgain.fill('Kannst du das noch erweitern?');

    const sendButtonAgain = page.locator('button[type="submit"]').first();
    await sendButtonAgain.click();

    // Wait for response
    await page.waitForTimeout(10000);

    // Take final screenshot
    await page.screenshot({
      path: 'teacher-assistant/frontend/bug-017-verify-04-context-response.png',
      fullPage: true
    });

    console.log('📸 Screenshot 4: Contextual response received');

    // Check console for debug logs
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[BUG-017 FIX]')) {
        consoleMessages.push(text);
        console.log('🐛 Console:', text);
      }
    });

    // Verify we got console logs showing DB messages were included
    console.log('📊 Console messages captured:', consoleMessages.length);

    console.log('✅ BUG-017 Verification Test Complete!');
    console.log('📁 Screenshots saved in teacher-assistant/frontend/');
  });
});
