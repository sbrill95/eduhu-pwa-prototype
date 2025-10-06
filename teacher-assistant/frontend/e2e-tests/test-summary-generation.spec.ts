import { test, expect } from '@playwright/test';

test.describe('Summary Generation Test', () => {
  test('open chat and verify summary generation', async ({ page }) => {
    // Listen to console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('Browser console:', text);
    });

    // Navigate to the app
    await page.goto('http://localhost:5176');
    console.log('Navigated to app');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Click on Chat tab
    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await chatTab.click();
    console.log('Clicked Chat tab');

    // Wait for chat to load
    await page.waitForTimeout(2000);

    // Type a message
    const input = page.locator('textarea[placeholder*="Nachricht"]');
    await input.fill('Hallo, das ist ein Test');
    console.log('Typed test message');

    // Click send button
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    console.log('Clicked send button');

    // Wait for response
    await page.waitForTimeout(5000);

    // Send another message to trigger summary (need 3+ messages)
    await input.fill('Zweite Nachricht');
    await sendButton.click();
    console.log('Sent second message');

    // Wait for summary generation
    await page.waitForTimeout(5000);

    // Check console logs for summary generation
    const summaryLogs = consoleLogs.filter(log => log.includes('[useChatSummary]'));
    console.log('Summary-related logs:', summaryLogs);

    // Take screenshot
    await page.screenshot({ path: 'summary-test-chat.png', fullPage: true });
    console.log('Screenshot saved');

    // Go to Library to check if summary appears
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();
    console.log('Clicked Library tab');

    await page.waitForTimeout(2000);

    // Take screenshot of library
    await page.screenshot({ path: 'summary-test-library.png', fullPage: true });
    console.log('Library screenshot saved');

    // Print all summary logs
    console.log('\n=== ALL SUMMARY LOGS ===');
    summaryLogs.forEach(log => console.log(log));
  });
});
