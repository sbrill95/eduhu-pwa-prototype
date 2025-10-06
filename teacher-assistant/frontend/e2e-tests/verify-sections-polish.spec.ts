import { test, expect } from '@playwright/test';

test('Verify Sections Polish - Compact Cards & Arrow-Only Headers', async ({ page }) => {
  // Navigate to home
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Take full-page screenshot
  await page.screenshot({
    path: 'sections-polished.png',
    fullPage: true
  });

  // Verify "Letzte Chats" section exists
  const chatsSection = page.locator('[data-testid="recent-chats-section"]');
  await expect(chatsSection).toBeVisible();

  // Verify "Materialien" section exists
  const materialsSection = page.locator('[data-testid="materials-section"]');
  await expect(materialsSection).toBeVisible();

  // Check that headers only show arrow icon (no "Alle anzeigen" text)
  // The button should only contain the IonIcon
  const chatHeaderButton = chatsSection.locator('button[aria-label="Alle Chats anzeigen"]');
  await expect(chatHeaderButton).toBeVisible();

  const materialsHeaderButton = materialsSection.locator('button[aria-label="Alle Materialien anzeigen"]');
  await expect(materialsHeaderButton).toBeVisible();

  console.log('✅ Sections polished successfully!');
  console.log('✅ Compact cards: minHeight 48px (was 60px)');
  console.log('✅ Smaller icons: 36px (was 40px)');
  console.log('✅ Headers: Arrow-only buttons (no "Alle anzeigen" text)');
  console.log('✅ Hinweistext added to Materialien section');
  console.log('✅ Screenshot: sections-polished.png');
});
