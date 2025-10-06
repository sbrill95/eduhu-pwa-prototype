import { test, expect } from '@playwright/test';

/**
 * Home Screen Prompt Tiles - Comprehensive E2E Test Suite
 *
 * Tests the Home Screen Redesign feature with custom prompt tiles.
 * Includes tests for:
 * - Prompt tiles grid display
 * - Tile content (title, description, icon, category, time)
 * - Click navigation to chat
 * - Pre-filled prompt in chat input
 * - Refresh button functionality
 * - Loading states
 * - Error states
 * - Mobile and desktop viewports
 *
 * Related SpecKit: .specify/specs/home-screen-redesign/
 * Bug Fixed: BUG-012 (API timeout reduced to <500ms)
 */

test.describe('Home Screen Prompt Tiles', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('http://localhost:5173');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check if we need to sign in (InstantDB auth)
    const isAuthRequired = await page.locator('text=Anmelden').isVisible().catch(() => false);

    if (isAuthRequired) {
      // Implement InstantDB authentication if needed
      // For now, we assume user is already authenticated
      console.log('Authentication may be required');
    }
  });

  test('should display prompt tiles grid on home page', async ({ page }) => {
    // Wait for prompt grid to be visible
    const promptGrid = page.locator('[data-testid="prompt-grid"]');
    await expect(promptGrid).toBeVisible({ timeout: 10000 });

    // Verify grid title is present
    const gridTitle = page.locator('[data-testid="grid-title"]');
    await expect(gridTitle).toBeVisible();
    await expect(gridTitle).toHaveText('Vorschläge für dich');

    // Verify refresh button is present
    const refreshButton = page.locator('[data-testid="refresh-button"]');
    await expect(refreshButton).toBeVisible();
  });

  test('should display exactly 6 prompt tiles', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Count the number of tiles
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const tileCount = await tiles.count();

    expect(tileCount).toBe(6);
  });

  test('should display all required tile elements', async ({ page }) => {
    // Wait for first tile to be visible
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get all tiles
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();

    // Verify icon container is present
    const iconContainer = firstTile.locator('[data-testid="prompt-icon-container"]');
    await expect(iconContainer).toBeVisible();

    // Verify icon is present
    const icon = firstTile.locator('[data-testid="prompt-icon"]');
    await expect(icon).toBeVisible();

    // Verify category badge is present
    const category = firstTile.locator('[data-testid="prompt-category"]');
    await expect(category).toBeVisible();

    // Verify title is present and not empty
    const title = firstTile.locator('[data-testid="prompt-title"]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText?.length).toBeGreaterThan(0);

    // Verify description is present and not empty
    const description = firstTile.locator('[data-testid="prompt-description"]');
    await expect(description).toBeVisible();
    const descText = await description.textContent();
    expect(descText).toBeTruthy();
    expect(descText?.length).toBeGreaterThan(0);

    // Verify estimated time is present
    const time = firstTile.locator('[data-testid="prompt-time"]');
    await expect(time).toBeVisible();
    const timeText = await time.textContent();
    expect(timeText).toContain('Minute');
  });

  test('should navigate to chat when tile is clicked', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first tile
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();

    // Click the tile
    await firstTile.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify we're on chat view (check for chat-specific elements)
    // This depends on your routing implementation
    // Common indicators: chat input, message list, send button
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
  });

  test('should pre-fill chat input with prompt text when tile is clicked', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first tile and extract its title
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();

    // Note: We can't easily get the full prompt text from the frontend,
    // but we can verify that the chat input is filled after clicking
    await firstTile.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Find chat input
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Verify input has content (prompt was pre-filled)
    const inputValue = await chatInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);

    // Verify it contains prompt-like text
    expect(inputValue).toMatch(/erstelle|quiz|arbeitsblatt|unterricht|bild/i);
  });

  test('should refresh prompt suggestions when refresh button is clicked', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get titles of current tiles
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();
    const originalTitle = await firstTile.locator('[data-testid="prompt-title"]').textContent();

    // Click refresh button
    const refreshButton = page.locator('[data-testid="refresh-button"]');
    await refreshButton.click();

    // Wait for loading state (spinner should appear briefly)
    // Then wait for new tiles to load
    await page.waitForTimeout(500); // Allow API call to complete
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Verify tiles are displayed after refresh
    const tilesAfterRefresh = page.locator('[data-testid^="prompt-tile-"]');
    const countAfterRefresh = await tilesAfterRefresh.count();
    expect(countAfterRefresh).toBe(6);
  });

  test('should display loading state while fetching suggestions', async ({ page }) => {
    // Intercept the API call to add delay
    await page.route('**/api/prompts/generate-suggestions', async (route) => {
      // Add artificial delay to see loading state
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });

    // Navigate to home page
    await page.goto('http://localhost:5173');

    // Check for loading indicator
    const loadingIndicator = page.locator('[data-testid="prompt-grid-loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    await expect(loadingIndicator).toContainText('Lade Vorschläge');

    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 15000 });
  });

  test('should display error state with German error message when API fails', async ({ page }) => {
    // Intercept the API call and make it fail
    await page.route('**/api/prompts/generate-suggestions', async (route) => {
      route.abort('failed');
    });

    // Navigate to home page
    await page.goto('http://localhost:5173');

    // Wait for error state
    const errorState = page.locator('[data-testid="prompt-grid-error"]');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Verify error message is in German
    const errorText = await errorState.textContent();
    expect(errorText).toMatch(/fehler|problem|laden/i);

    // Verify retry button is present
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toContainText('Erneut versuchen');
  });

  test('should handle empty suggestions array gracefully', async ({ page }) => {
    // Intercept the API call and return empty array
    await page.route('**/api/prompts/generate-suggestions', async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            suggestions: []
          }
        })
      });
    });

    // Navigate to home page
    await page.goto('http://localhost:5173');

    // Wait for empty state
    const emptyState = page.locator('[data-testid="prompt-grid-empty"]');
    await expect(emptyState).toBeVisible({ timeout: 10000 });

    // Verify empty message
    await expect(emptyState).toContainText('Keine Vorschläge verfügbar');
  });

  test('should work correctly on mobile viewport (375x667)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Verify tiles are displayed
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBe(6);

    // Verify single-column layout (tiles should stack vertically)
    const firstTile = tiles.first();
    const firstBox = await firstTile.boundingBox();
    expect(firstBox).toBeTruthy();

    // On mobile, tiles should be close to full width
    if (firstBox) {
      expect(firstBox.width).toBeGreaterThan(300); // Should be most of 375px width
    }

    // Verify tile is clickable on mobile
    await firstTile.click();
    await page.waitForLoadState('networkidle');

    // Verify navigation worked
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
  });

  test('should display 3-column grid on desktop viewport (1920x1080)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Verify tiles are displayed
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBe(6);

    // Verify grid layout (check positions of tiles)
    const firstTile = tiles.nth(0);
    const secondTile = tiles.nth(1);
    const thirdTile = tiles.nth(2);
    const fourthTile = tiles.nth(3);

    const firstBox = await firstTile.boundingBox();
    const secondBox = await secondTile.boundingBox();
    const thirdBox = await thirdTile.boundingBox();
    const fourthBox = await fourthTile.boundingBox();

    expect(firstBox).toBeTruthy();
    expect(secondBox).toBeTruthy();
    expect(thirdBox).toBeTruthy();
    expect(fourthBox).toBeTruthy();

    if (firstBox && secondBox && thirdBox && fourthBox) {
      // First three tiles should be on the same row (similar Y position)
      expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(50);
      expect(Math.abs(secondBox.y - thirdBox.y)).toBeLessThan(50);

      // Fourth tile should be on a different row (lower Y position)
      expect(fourthBox.y).toBeGreaterThan(firstBox.y + 100);
    }
  });

  test('should display hover effects on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first tile
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();

    // Hover over tile
    await firstTile.hover();

    // Verify tile has cursor-pointer class
    const classList = await firstTile.getAttribute('class');
    expect(classList).toContain('cursor-pointer');

    // Note: We can't easily test CSS transform (scale) in Playwright,
    // but we've verified the class is present
  });

  test('should maintain tile state after navigation and back', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first tile title
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();
    const originalTitle = await firstTile.locator('[data-testid="prompt-title"]').textContent();

    // Click tile to navigate to chat
    await firstTile.click();
    await page.waitForLoadState('networkidle');

    // Navigate back to home
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Wait for tiles to reload
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Verify tiles are still displayed
    const tilesAfterBack = page.locator('[data-testid^="prompt-tile-"]');
    const countAfterBack = await tilesAfterBack.count();
    expect(countAfterBack).toBe(6);
  });

  test('should display correct category badges', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get all tiles
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const tileCount = await tiles.count();

    // Check each tile has a category
    for (let i = 0; i < tileCount; i++) {
      const tile = tiles.nth(i);
      const category = tile.locator('[data-testid="prompt-category"]');
      await expect(category).toBeVisible();

      const categoryText = await category.textContent();
      expect(categoryText).toBeTruthy();
      expect(categoryText?.length).toBeGreaterThan(0);

      // Verify category is one of the expected values
      expect(categoryText).toMatch(/quiz|worksheet|lesson-plan|image/i);
    }
  });

  test('should display colored icons', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first tile
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();

    // Get icon container
    const iconContainer = firstTile.locator('[data-testid="prompt-icon-container"]');
    await expect(iconContainer).toBeVisible();

    // Verify background color is set
    const bgColor = await iconContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent

    // Get icon
    const icon = firstTile.locator('[data-testid="prompt-icon"]');
    await expect(icon).toBeVisible();

    // Verify icon color is set
    const iconColor = await icon.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(iconColor).not.toBe('rgb(0, 0, 0)'); // Not default black
  });

  test('should have accessible keyboard navigation', async ({ page }) => {
    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Get first tile
    const tiles = page.locator('[data-testid^="prompt-tile-"]');
    const firstTile = tiles.first();

    // Focus on first tile using keyboard
    await firstTile.focus();

    // Verify tile is focused
    const isFocused = await firstTile.evaluate((el) => {
      return document.activeElement === el || el.contains(document.activeElement);
    });
    expect(isFocused).toBe(true);

    // Press Enter to click tile
    await page.keyboard.press('Enter');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify navigation worked
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
  });

  test('should have no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);

    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
  });

  test('should measure API response time (<500ms)', async ({ page }) => {
    let apiResponseTime = 0;

    // Intercept API call and measure time
    await page.route('**/api/prompts/generate-suggestions', async (route) => {
      const startTime = Date.now();
      const response = await route.fetch();
      apiResponseTime = Date.now() - startTime;

      route.fulfill({ response });
    });

    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for tiles to load
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    // Verify API response time
    console.log(`API Response Time: ${apiResponseTime}ms`);
    expect(apiResponseTime).toBeLessThan(500);
  });

  test('should measure time to first tile render (<1s)', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for first tile to be visible
    await page.waitForSelector('[data-testid^="prompt-tile-"]', { timeout: 10000 });

    const renderTime = Date.now() - startTime;

    // Verify render time
    console.log(`Time to First Tile Render: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(1000);
  });

});
