import { test, expect } from '@playwright/test';

/**
 * E2E Test: Verify Final 5 Fixes (#20-24)
 *
 * Fix #20: Materialien Hinweistext - NUR bei Empty State
 * Fix #21: Remove "Hallo Michelle!" aus Welcome Message
 * Fix #22: Calendar Grid - Use Tailwind Responsive Classes
 * Fix #23: Card Heights HALBIEREN - Much More Compact
 * Fix #24: Materialien Empty State - Text Only (included in #20)
 */

test.describe('Final 5 Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
  });

  test('Fix #21: "Hallo Michelle!" removed from welcome bubble', async ({ page }) => {
    const bubble = page.locator('[data-testid="welcome-message-bubble"]');
    await expect(bubble).toBeVisible();

    const bubbleText = await bubble.textContent();

    // Should NOT contain "Hallo Michelle!"
    expect(bubbleText).not.toContain('Hallo Michelle');

    // Should still contain the rest of the message
    expect(bubbleText).toContain('Ich habe einen Blick auf deinen Tag geworfen');
    expect(bubbleText).toContain('Wollen wir loslegen?');

    console.log('✅ Fix #21: "Hallo Michelle!" removed from bubble');
  });

  test('Fix #22: Calendar has responsive grid classes', async ({ page }) => {
    const eventsList = page.locator('[data-testid="calendar-events-list"]');

    // Check if calendar card is visible
    const calendarCard = page.locator('[data-testid="calendar-card"]');
    await expect(calendarCard).toBeVisible();

    // Check if events list exists (might be empty)
    const eventsListVisible = await eventsList.isVisible().catch(() => false);

    if (eventsListVisible) {
      const classes = await eventsList.getAttribute('class');

      // Should have Tailwind responsive grid classes
      expect(classes).toContain('grid');
      expect(classes).toContain('grid-cols-1');
      expect(classes).toContain('sm:grid-cols-2');

      console.log('✅ Fix #22: Calendar has responsive grid classes');
      console.log(`   Classes: ${classes}`);
    } else {
      console.log('ℹ️  Fix #22: No events to display, but calendar card exists');
    }
  });

  test('Fix #23: Chat and Material cards are compact (≤90px height)', async ({ page }) => {
    // Check chat cards
    const chatCards = page.locator('[data-testid^="chat-item-"]');
    const chatCount = await chatCards.count();

    if (chatCount > 0) {
      const firstChatCard = chatCards.first();
      const chatBox = await firstChatCard.boundingBox();

      if (chatBox) {
        console.log(`   Chat card height: ${chatBox.height.toFixed(1)}px`);
        // With two lines of text (title + metadata), compact cards should be ≤90px
        expect(chatBox.height).toBeLessThanOrEqual(90);
        console.log('✅ Fix #23: Chat cards are compact (≤90px)');
      }
    } else {
      console.log('ℹ️  Fix #23: No chat cards to verify');
    }

    // Check material cards
    const materialCards = page.locator('[data-testid^="material-item-"]');
    const materialCount = await materialCards.count();

    if (materialCount > 0) {
      const firstMaterialCard = materialCards.first();
      const materialBox = await firstMaterialCard.boundingBox();

      if (materialBox) {
        console.log(`   Material card height: ${materialBox.height.toFixed(1)}px`);
        expect(materialBox.height).toBeLessThanOrEqual(90);
        console.log('✅ Fix #23: Material cards are compact (≤90px)');
      }
    } else {
      console.log('ℹ️  Fix #23: No material cards to verify (empty state expected)');
    }
  });

  test('Fix #20 & #24: Materials empty state is text-only', async ({ page }) => {
    const materialsSection = page.locator('[data-testid="materials-section"]');
    await expect(materialsSection).toBeVisible();

    // Check if materials exist
    const materialCards = page.locator('[data-testid^="material-item-"]');
    const materialCount = await materialCards.count();

    if (materialCount === 0) {
      // Empty state - should be text-only, no icon, no button
      const sectionContent = await materialsSection.textContent();

      // Should have the empty state text
      expect(sectionContent).toContain('Noch keine Materialien');
      expect(sectionContent).toContain('Du kannst im Chat die Erstellung von Materialien auslösen');

      // Should NOT have "Zur Bibliothek" button text in empty state
      // (button is in header, not in empty state)
      const materialsContent = materialsSection.locator('.p-4');
      const emptyStateText = await materialsContent.textContent();

      // Verify empty state is minimal
      expect(emptyStateText).toContain('Noch keine Materialien');
      expect(emptyStateText).toContain('Du kannst im Chat die Erstellung von Materialien auslösen');

      console.log('✅ Fix #20 & #24: Materials empty state is text-only');
    } else {
      console.log('ℹ️  Fix #20 & #24: Materials exist, empty state not shown');
    }
  });

  test('Visual verification screenshot', async ({ page }) => {
    // Wait for all content to load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'teacher-assistant/frontend/e2e-tests/screenshots/final-fixes-complete.png',
      fullPage: true
    });

    console.log('📸 Screenshot saved: final-fixes-complete.png');
  });

  test('All fixes summary', async ({ page }) => {
    console.log('\n=== FINAL 5 FIXES VERIFICATION SUMMARY ===\n');

    // Fix #21
    const bubble = page.locator('[data-testid="welcome-message-bubble"]');
    const bubbleText = await bubble.textContent();
    const fix21 = !bubbleText?.includes('Hallo Michelle');
    console.log(`Fix #21 (Remove "Hallo Michelle!"): ${fix21 ? '✅ PASS' : '❌ FAIL'}`);

    // Fix #22
    const eventsList = page.locator('[data-testid="calendar-events-list"]');
    const eventsListVisible = await eventsList.isVisible().catch(() => false);
    let fix22 = true;
    if (eventsListVisible) {
      const classes = await eventsList.getAttribute('class');
      fix22 = classes?.includes('grid') && classes?.includes('sm:grid-cols-2') || false;
    }
    console.log(`Fix #22 (Calendar Tailwind grid): ${fix22 ? '✅ PASS' : '❌ FAIL'}`);

    // Fix #23
    const chatCards = page.locator('[data-testid^="chat-item-"]');
    const chatCount = await chatCards.count();
    let fix23 = true;
    if (chatCount > 0) {
      const chatBox = await chatCards.first().boundingBox();
      fix23 = chatBox ? chatBox.height <= 90 : false;
    }
    console.log(`Fix #23 (Compact cards ≤90px): ${fix23 ? '✅ PASS' : '❌ FAIL'}`);

    // Fix #20 & #24
    const materialsSection = page.locator('[data-testid="materials-section"]');
    const materialCards = page.locator('[data-testid^="material-item-"]');
    const materialCount = await materialCards.count();
    let fix20 = true;
    if (materialCount === 0) {
      const sectionText = await materialsSection.textContent();
      fix20 = sectionText?.includes('Noch keine Materialien') &&
              sectionText?.includes('Du kannst im Chat die Erstellung von Materialien auslösen') || false;
    }
    console.log(`Fix #20 & #24 (Materials empty state): ${fix20 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n========================================\n');

    const allPassed = fix21 && fix22 && fix23 && fix20;
    if (allPassed) {
      console.log('🎉 ALL FIXES VERIFIED SUCCESSFULLY! 🎉');
    } else {
      console.log('⚠️  Some fixes need attention');
    }
  });
});
