import { test } from '@playwright/test';

test('Check card visuals with scroll', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Take screenshot of top
  await page.screenshot({
    path: 'teacher-assistant/frontend/e2e-tests/screenshots/home-top.png',
    fullPage: false
  });

  // Scroll to Letzte Chats section
  await page.locator('[data-testid="recent-chats-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: 'teacher-assistant/frontend/e2e-tests/screenshots/home-chats-section.png',
    fullPage: false
  });

  // Check if chat cards exist and measure
  const chatCard = page.locator('[data-testid^="chat-item-"]').first();
  const isVisible = await chatCard.isVisible().catch(() => false);

  if (isVisible) {
    const box = await chatCard.boundingBox();
    console.log(`Chat card height: ${box?.height}px`);

    // Highlight the card
    await chatCard.evaluate(el => {
      (el as HTMLElement).style.outline = '3px solid red';
    });

    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'teacher-assistant/frontend/e2e-tests/screenshots/home-chat-highlighted.png',
      fullPage: false
    });
  } else {
    console.log('No chat cards found');
  }

  // Scroll to Materials section
  await page.locator('[data-testid="materials-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: 'teacher-assistant/frontend/e2e-tests/screenshots/home-materials-section.png',
    fullPage: false
  });

  console.log('Screenshots saved');
});
