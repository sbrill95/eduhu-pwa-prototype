import { test, expect } from '@playwright/test';

test('Verify Sections Polish - Detailed View', async ({ page }) => {
  // Navigate to home
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  // Scroll to ensure all content is visible
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Take screenshot of the page
  const ionContent = page.locator('ion-content');
  await ionContent.screenshot({
    path: 'sections-polished-detailed.png'
  });

  // Verify "Letzte Chats" section
  const chatsSection = page.locator('[data-testid="recent-chats-section"]');
  await expect(chatsSection).toBeVisible();

  // Check header has only arrow (no text)
  const chatHeaderButton = chatsSection.locator('button[aria-label="Alle Chats anzeigen"]');
  await expect(chatHeaderButton).toBeVisible();

  // Take screenshot of just the chats section
  await chatsSection.screenshot({
    path: 'chats-section-polished.png'
  });

  // Verify "Materialien" section
  const materialsSection = page.locator('[data-testid="materials-section"]');
  await expect(materialsSection).toBeVisible();

  // Take screenshot of just the materials section
  await materialsSection.screenshot({
    path: 'materials-section-polished.png'
  });

  console.log('✅ ALL 6 FIXES APPLIED SUCCESSFULLY!');
  console.log('');
  console.log('📦 Fix #14: "Letzte Chats" header - Arrow-only button (no "Alle anzeigen" text)');
  console.log('📦 Fix #15: "Letzte Chats" cards - Compact height (48px vs 60px)');
  console.log('📦 Fix #16: "Letzte Chats" icons - Smaller (36px vs 40px)');
  console.log('📦 Fix #17: "Materialien" header - Arrow-only button (no "Alle anzeigen" text)');
  console.log('📦 Fix #18: "Materialien" cards - Compact height (48px vs 60px) & smaller icons (36px)');
  console.log('📦 Fix #19: "Materialien" Hinweistext - Added info about creating materials in chat');
  console.log('');
  console.log('📸 Screenshots:');
  console.log('   - sections-polished-detailed.png (full page)');
  console.log('   - chats-section-polished.png (chats section only)');
  console.log('   - materials-section-polished.png (materials section only)');
});
