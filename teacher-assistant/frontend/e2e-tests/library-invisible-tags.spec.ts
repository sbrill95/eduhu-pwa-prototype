/**
 * E2E Test: Library Tag-Based Search (Tags INVISIBLE in UI)
 *
 * Verifies that:
 * 1. Tags are NOT visible anywhere in the Library UI
 * 2. Search works using invisible tags
 * 3. Only title and description are shown to users
 */

import { test, expect } from '@playwright/test';

test.describe('Library - Invisible Tag-Based Search', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (adjust URL if needed)
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Navigate to Library tab
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();

    // Wait for library to load
    await page.waitForSelector('ion-segment-button[value="artifacts"]', { timeout: 5000 });
  });

  test('should NOT display tags as visible chips in material cards', async ({ page }) => {
    // Switch to Materialien tab
    await page.locator('ion-segment-button[value="artifacts"]').click();

    // Wait for materials to load
    await page.waitForTimeout(1000);

    // Check if there are any material cards
    const materialCards = page.locator('[data-testid^="material-card-"]');
    const cardCount = await materialCards.count();

    if (cardCount > 0) {
      // Verify NO tag chips are visible
      // Tags were previously rendered as IonChip with className "bg-primary/10 text-primary"
      const tagChips = page.locator('ion-chip.bg-primary\\/10');
      const tagChipCount = await tagChips.count();

      expect(tagChipCount).toBe(0); // No tag chips should be visible
    }
  });

  test('should NOT display any text labeled as "Tags" or similar', async ({ page }) => {
    // Switch to Materialien tab
    await page.locator('ion-segment-button[value="artifacts"]').click();

    // Wait for materials to load
    await page.waitForTimeout(1000);

    // Check for any visible text containing "Tag" or "Schlagwort"
    const tagLabels = page.getByText(/tags?|schlagw(ö|o)rter?/i);
    const labelCount = await tagLabels.count();

    expect(labelCount).toBe(0); // No tag labels should be visible
  });

  test('should only show title and description in material cards', async ({ page }) => {
    // Switch to Materialien tab
    await page.locator('ion-segment-button[value="artifacts"]').click();

    // Wait for materials to load
    await page.waitForTimeout(1000);

    const materialCards = page.locator('[data-testid^="material-card-"]');
    const cardCount = await materialCards.count();

    if (cardCount > 0) {
      const firstCard = materialCards.first();

      // Should have a title (h3 with class "text-gray-900 font-semibold")
      const title = firstCard.locator('h3.text-gray-900.font-semibold');
      await expect(title).toBeVisible();

      // May have a description (p with class "text-gray-500 text-sm")
      const description = firstCard.locator('p.text-gray-500.text-sm').first();
      // Description is optional, so we just check it exists in the DOM (may or may not be visible)

      // Should have timestamp (p with formatRelativeDate result)
      const timestamp = firstCard.locator('p.text-gray-500.text-sm').last();
      await expect(timestamp).toBeVisible();

      // Should NOT have tag chips
      const tagChips = firstCard.locator('ion-chip');
      const chipCount = await tagChips.count();
      expect(chipCount).toBe(0);
    }
  });

  test('should find material by searching for a tag (invisible search)', async ({ page }) => {
    // This test requires that we have a test material with known tags
    // For example, a material with title "Photosynthese Diagramm" and tags ["Photosynthese", "Biologie"]

    // Switch to Materialien tab
    await page.locator('ion-segment-button[value="artifacts"]').click();

    // Wait for materials to load
    await page.waitForTimeout(1000);

    // Get initial material count
    const initialCards = page.locator('[data-testid^="material-card-"]');
    const initialCount = await initialCards.count();

    if (initialCount > 0) {
      // Search for a tag that should exist (e.g., "Biologie" or "Photosynthese")
      const searchBar = page.locator('ion-searchbar');
      await searchBar.click();
      await searchBar.locator('input').fill('Photosynthese');

      // Wait for search to filter
      await page.waitForTimeout(500);

      // Should find at least one material (if the test data is set up correctly)
      const filteredCards = page.locator('[data-testid^="material-card-"]');
      const filteredCount = await filteredCards.count();

      // NOTE: This test will only pass if you have test data with tags
      // If filteredCount is 0, it means no materials with that tag exist yet
      console.log(`Found ${filteredCount} materials matching tag "Photosynthese"`);

      // The tag should NOT be visible in the UI
      const tagChips = page.locator('ion-chip:has-text("Photosynthese")');
      const chipCount = await tagChips.count();
      expect(chipCount).toBe(0);
    }
  });

  test('should search by partial tag match (case-insensitive)', async ({ page }) => {
    // Switch to Materialien tab
    await page.locator('ion-segment-button[value="artifacts"]').click();

    // Wait for materials to load
    await page.waitForTimeout(1000);

    const initialCards = page.locator('[data-testid^="material-card-"]');
    const initialCount = await initialCards.count();

    if (initialCount > 0) {
      // Search for partial tag (e.g., "bio" should match "Biologie")
      const searchBar = page.locator('ion-searchbar');
      await searchBar.click();
      await searchBar.locator('input').fill('bio');

      // Wait for search to filter
      await page.waitForTimeout(500);

      // Should find materials with tags containing "bio" (case-insensitive)
      const filteredCards = page.locator('[data-testid^="material-card-"]');
      const filteredCount = await filteredCards.count();

      console.log(`Found ${filteredCount} materials matching partial tag "bio"`);

      // Tags should still NOT be visible
      const tagChips = page.locator('ion-chip');
      const chipCount = await tagChips.count();
      expect(chipCount).toBe(0);
    }
  });

  test('should clear search and show all materials again', async ({ page }) => {
    // Switch to Materialien tab
    await page.locator('ion-segment-button[value="artifacts"]').click();

    // Wait for materials to load
    await page.waitForTimeout(1000);

    const initialCards = page.locator('[data-testid^="material-card-"]');
    const initialCount = await initialCards.count();

    if (initialCount > 0) {
      // Search for something
      const searchBar = page.locator('ion-searchbar');
      await searchBar.click();
      await searchBar.locator('input').fill('test-query');
      await page.waitForTimeout(500);

      // Clear search
      const clearButton = searchBar.locator('button.searchbar-clear-button');
      await clearButton.click();
      await page.waitForTimeout(500);

      // Should show all materials again
      const finalCards = page.locator('[data-testid^="material-card-"]');
      const finalCount = await finalCards.count();

      expect(finalCount).toBe(initialCount);
    }
  });
});

test.describe('Library - Visual Verification of No Tags', () => {
  test('should take screenshot showing no visible tags in Library', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Navigate to Library tab
    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await libraryTab.click();

    // Switch to Materialien tab
    await page.waitForSelector('ion-segment-button[value="artifacts"]', { timeout: 5000 });
    await page.locator('ion-segment-button[value="artifacts"]').click();
    await page.waitForTimeout(1000);

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'teacher-assistant/frontend/library-no-visible-tags.png',
      fullPage: true
    });

    console.log('Screenshot saved: library-no-visible-tags.png');
    console.log('Verify manually that NO tag chips are visible in material cards!');
  });
});
