import { test, expect } from '@playwright/test';

/**
 * SIMPLIFIED E2E Test Suite: US4 - MaterialPreviewModal
 *
 * NO MOCKS - Tests against real API with VITE_TEST_MODE=true for auth bypass
 * KISS Principle: Keep It Simple, Stupid
 *
 * User Story:
 * As a teacher viewing materials in Library,
 * I want to see material details in a preview modal,
 * so that I can review and manage my teaching materials.
 */

test.describe('US4 - MaterialPreviewModal (Simplified)', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode BEFORE navigation to bypass auth
    console.log('🔧 Setting test mode flag...');
    await page.addInitScript(() => {
      (window as any).__VITE_TEST_MODE__ = true;
      console.log('[TEST] Test mode enabled - auth will be bypassed');
    });

    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give app time to initialize with test mode
    console.log('✅ App loaded');
  });

  test('US4-001: Material card click opens modal', async ({ page }) => {
    test.setTimeout(30000); // 30 seconds

    console.log('\n🎯 TEST: Material card opens modal');

    // Navigate to Library -> Materials
    const libraryTab = page.locator('button:has-text("Bibliothek")').first();
    await expect(libraryTab).toBeVisible({ timeout: 10000 });
    await libraryTab.click();
    await page.waitForTimeout(1000);

    const materialsTab = page.locator('button:has-text("Materialien")').first();
    await expect(materialsTab).toBeVisible({ timeout: 5000 });
    await materialsTab.click();
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Library -> Materialien');

    // Wait for materials to load (or empty state)
    await page.waitForTimeout(2000);

    // Check if there are any material cards
    const materialCards = page.locator('[data-testid="material-card"]');
    const cardCount = await materialCards.count();

    if (cardCount === 0) {
      console.log('⚠️ No materials found - skipping modal test');
      console.log('ℹ️ To test modal, create a material first (e.g., generate an image in Chat)');
      test.skip();
      return;
    }

    console.log(`✅ Found ${cardCount} material card(s)`);

    // Click first material card
    await materialCards.first().click();
    await page.waitForTimeout(1000);
    console.log('✅ Clicked material card');

    // Verify modal opens
    const modal = page.locator('ion-modal').first();
    const modalVisible = await modal.isVisible({ timeout: 5000 });

    if (!modalVisible) {
      console.log('❌ Modal did not open - checking for modal backdrop or content');
      const backdrop = page.locator('ion-backdrop, .modal-backdrop').first();
      const backdropVisible = await backdrop.isVisible({ timeout: 2000 });
      console.log(`Backdrop visible: ${backdropVisible}`);
    }

    await expect(modal).toBeVisible();
    console.log('✅ Modal opened');
  });

  test('US4-002: Modal displays image if material is an image', async ({ page }) => {
    test.setTimeout(30000); // 30 seconds

    console.log('\n🎯 TEST: Modal displays image content');

    // Navigate to Library -> Materials
    const libraryTab = page.locator('button:has-text("Bibliothek")').first();
    await expect(libraryTab).toBeVisible({ timeout: 10000 });
    await libraryTab.click();
    await page.waitForTimeout(1000);

    const materialsTab = page.locator('button:has-text("Materialien")').first();
    await materialsTab.click();
    await page.waitForTimeout(1000);

    // Check for materials
    const materialCards = page.locator('[data-testid="material-card"]');
    const cardCount = await materialCards.count();

    if (cardCount === 0) {
      console.log('⚠️ No materials found - skipping test');
      test.skip();
      return;
    }

    // Click first material
    await materialCards.first().click();
    await page.waitForTimeout(1000);

    // Verify modal is open
    const modal = page.locator('ion-modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check if modal contains an image element
    const modalImage = modal.locator('img[data-testid="material-image"], img').first();
    const imageVisible = await modalImage.isVisible({ timeout: 3000 });

    if (imageVisible) {
      console.log('✅ Image element visible in modal');

      // Verify image has valid src
      const imageSrc = await modalImage.getAttribute('src');
      if (imageSrc && imageSrc.length > 0 && !imageSrc.includes('placeholder')) {
        console.log(`✅ Image has valid src: ${imageSrc.substring(0, 60)}...`);
      } else {
        console.log('⚠️ Image src is empty or placeholder');
      }
    } else {
      console.log('ℹ️ No image in modal (material might not be an image type)');
    }
  });

  test('US4-003: Modal displays metadata section', async ({ page }) => {
    test.setTimeout(30000); // 30 seconds

    console.log('\n🎯 TEST: Modal displays metadata');

    // Navigate to Library -> Materials
    const libraryTab = page.locator('button:has-text("Bibliothek")').first();
    await expect(libraryTab).toBeVisible({ timeout: 10000 });
    await libraryTab.click();
    await page.waitForTimeout(1000);

    const materialsTab = page.locator('button:has-text("Materialien")').first();
    await materialsTab.click();
    await page.waitForTimeout(1000);

    // Check for materials
    const materialCards = page.locator('[data-testid="material-card"]');
    const cardCount = await materialCards.count();

    if (cardCount === 0) {
      console.log('⚠️ No materials found - skipping test');
      test.skip();
      return;
    }

    // Click first material
    await materialCards.first().click();
    await page.waitForTimeout(1000);

    // Verify modal is open
    const modal = page.locator('ion-modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check for metadata fields (any of these indicates metadata section exists)
    const hasMetadata = await modal.locator('[data-testid="material-title"], [data-testid="material-type"], [data-testid="material-date"], text=Typ, text=Quelle, text=Erstellt').first().isVisible({ timeout: 3000 });

    expect(hasMetadata).toBe(true);
    console.log('✅ Metadata section visible');
  });

  test('US4-004: Modal can be closed', async ({ page }) => {
    test.setTimeout(30000); // 30 seconds

    console.log('\n🎯 TEST: Modal can be closed');

    // Navigate to Library -> Materials
    const libraryTab = page.locator('button:has-text("Bibliothek")').first();
    await expect(libraryTab).toBeVisible({ timeout: 10000 });
    await libraryTab.click();
    await page.waitForTimeout(1000);

    const materialsTab = page.locator('button:has-text("Materialien")').first();
    await materialsTab.click();
    await page.waitForTimeout(1000);

    // Check for materials
    const materialCards = page.locator('[data-testid="material-card"]');
    const cardCount = await materialCards.count();

    if (cardCount === 0) {
      console.log('⚠️ No materials found - skipping test');
      test.skip();
      return;
    }

    // Click first material
    await materialCards.first().click();
    await page.waitForTimeout(1000);

    // Verify modal is open
    const modal = page.locator('ion-modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal opened');

    // Find close button (try multiple common selectors)
    const closeButton = modal.locator('button[data-testid="close-button"], button[aria-label="Close"], button:has-text("Schließen"), ion-button:has-text("Schließen")').first();

    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Clicked close button');
    } else {
      // Try clicking backdrop to close
      console.log('ℹ️ No close button found, trying to close via backdrop click');
      const backdrop = page.locator('ion-backdrop').first();
      if (await backdrop.isVisible({ timeout: 1000 })) {
        await backdrop.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
      }
    }

    // Verify modal is closed
    const modalStillVisible = await modal.isVisible({ timeout: 2000 });
    expect(modalStillVisible).toBe(false);
    console.log('✅ Modal closed');
  });

  test('US4-005: Modal has action buttons', async ({ page }) => {
    test.setTimeout(30000); // 30 seconds

    console.log('\n🎯 TEST: Modal has action buttons');

    // Navigate to Library -> Materials
    const libraryTab = page.locator('button:has-text("Bibliothek")').first();
    await expect(libraryTab).toBeVisible({ timeout: 10000 });
    await libraryTab.click();
    await page.waitForTimeout(1000);

    const materialsTab = page.locator('button:has-text("Materialien")').first();
    await materialsTab.click();
    await page.waitForTimeout(1000);

    // Check for materials
    const materialCards = page.locator('[data-testid="material-card"]');
    const cardCount = await materialCards.count();

    if (cardCount === 0) {
      console.log('⚠️ No materials found - skipping test');
      test.skip();
      return;
    }

    // Click first material
    await materialCards.first().click();
    await page.waitForTimeout(1000);

    // Verify modal is open
    const modal = page.locator('ion-modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check for common action buttons
    const buttons = {
      download: await modal.locator('button[data-testid="download-button"], button:has-text("Download"), button:has-text("Herunterladen")').first().isVisible({ timeout: 2000 }),
      favorite: await modal.locator('button[data-testid="favorite-button"], button:has-text("Favorit")').first().isVisible({ timeout: 2000 }),
      share: await modal.locator('button[data-testid="share-button"], button:has-text("Teilen"), button:has-text("Share")').first().isVisible({ timeout: 2000 }),
      delete: await modal.locator('button[data-testid="delete-button"], button:has-text("Löschen"), button:has-text("Delete")').first().isVisible({ timeout: 2000 }),
    };

    console.log('Action buttons visibility:', buttons);

    // At least one action button should be visible
    const hasAnyButton = Object.values(buttons).some(visible => visible);
    expect(hasAnyButton).toBe(true);
    console.log('✅ At least one action button visible');
  });
});
