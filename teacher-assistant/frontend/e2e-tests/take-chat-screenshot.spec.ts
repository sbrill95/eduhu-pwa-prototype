import { test, expect } from '@playwright/test';

test('Chat Gemini Styling Screenshot', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');

  // Wait for app to load
  await page.waitForLoadState('networkidle');

  // Navigate to Chat tab (look for "Chat" tab button or icon)
  // Try clicking the tab bar - it might be an icon or text
  const chatTab = page.locator('ion-tab-button[tab="chat"]');
  if (await chatTab.count() > 0) {
    await chatTab.click();
    await page.waitForTimeout(500);
  }

  // Alternative: Try direct navigation to chat route
  await page.goto('http://localhost:5173/chat');
  await page.waitForLoadState('networkidle');

  // Wait a bit for any animations
  await page.waitForTimeout(1000);

  // Take full page screenshot
  await page.screenshot({
    path: 'chat-gemini-full.png',
    fullPage: true
  });

  // Take viewport screenshot
  await page.screenshot({
    path: 'chat-gemini-viewport.png',
    fullPage: false
  });

  console.log('Screenshots saved: chat-gemini-full.png, chat-gemini-viewport.png');
});
