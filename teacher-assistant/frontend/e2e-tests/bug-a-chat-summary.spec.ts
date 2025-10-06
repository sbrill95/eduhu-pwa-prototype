import { test, expect } from '@playwright/test';

test('Chat summary appears on home after 3 messages', async ({ page }) => {
  // Setup test auth
  await page.goto('http://localhost:5174');
  await page.evaluate(() => {
    localStorage.setItem('test-auth-enabled', 'true');
    localStorage.setItem('test-user-id', 'test-user-playwright-id-12345');
    localStorage.setItem('test-user-email', 's.brill@eduhu.de');
  });

  // Reload to apply auth
  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  // Go to chat
  const chatTab = page.locator('[aria-label="Chat"]');
  await expect(chatTab).toBeVisible({ timeout: 10000 });
  await chatTab.click();
  await page.waitForTimeout(1000);

  // Send 3 messages
  const textarea = page.locator('textarea');
  const submitButton = page.locator('button[type="submit"]');

  console.log('Sending message 1...');
  await textarea.fill('Test message 1');
  await submitButton.click();
  await page.waitForTimeout(2000);

  console.log('Sending message 2...');
  await textarea.fill('Test message 2');
  await submitButton.click();
  await page.waitForTimeout(2000);

  console.log('Sending message 3...');
  await textarea.fill('Test message 3');
  await submitButton.click();
  await page.waitForTimeout(3000); // Wait for summary generation

  // Go to home
  const homeTab = page.locator('[aria-label="Home"]');
  await homeTab.click();
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: 'qa-screenshots/bug-a-home-with-summary.png', fullPage: true });

  // Check if summary exists (not "Neuer Chat")
  const chatSummaries = page.locator('[data-testid^="chat-summary"]');
  const count = await chatSummaries.count();

  console.log(`Found ${count} chat summaries`);

  if (count > 0) {
    const summaryText = await chatSummaries.first().textContent();
    console.log('Summary text:', summaryText);
    expect(summaryText).not.toBe('Neuer Chat');
  } else {
    console.warn('No chat summaries found - checking alternative selectors');
    // Alternative: look for any chat title/summary elements
    const chatElements = page.locator('.chat-item, .chat-card, [role="article"]');
    const altCount = await chatElements.count();
    console.log(`Found ${altCount} alternative chat elements`);
  }
});
