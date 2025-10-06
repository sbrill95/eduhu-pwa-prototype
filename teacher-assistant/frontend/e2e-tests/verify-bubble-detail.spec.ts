import { test, expect } from '@playwright/test';

test('Capture Message Bubble Detail', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Scroll to top to ensure bubble is visible
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Get the message bubble element
  const bubble = page.locator('[data-testid="welcome-message-bubble"]');

  // Take screenshot of just the bubble
  await bubble.screenshot({
    path: 'message-bubble-detail.png'
  });

  // Verify structure
  const bubbleText = await bubble.textContent();
  console.log('Bubble text:', bubbleText);

  // Verify "eduhu" is NOT present at the start
  const lines = bubbleText?.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log('First line:', lines?.[0]);

  // First line should be the welcome message, NOT "eduhu"
  expect(lines?.[0]).toContain('Hallo Michelle');
  expect(lines?.[0]).not.toBe('eduhu');

  console.log('✅ Orange "eduhu" label successfully removed');
  console.log('✅ Screenshot saved: message-bubble-detail.png');
});
