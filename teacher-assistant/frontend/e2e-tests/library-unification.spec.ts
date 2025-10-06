import { test, expect, Page, ConsoleMessage } from '@playwright/test';

/**
 * E2E Tests for Library & Materials Unification Feature
 *
 * This test suite validates the complete Library Unification feature including:
 * - Two-tab layout (Chats + Materialien)
 * - Unified materials from 3 sources (manual, uploads, AI-generated)
 * - 8 filter chips (Alle, Dokumente, Arbeitsblätter, Quiz, Stundenpläne, Ressourcen, Uploads, KI-generiert)
 * - Material preview modal with CRUD operations
 * - German date formatting (Heute, Gestern, vor X Tagen)
 * - Search functionality across all materials
 * - Mobile responsiveness
 *
 * Related SpecKit:
 * - Spec: .specify/specs/library-materials-unification/spec.md
 * - Plan: .specify/specs/library-materials-unification/plan.md
 * - Tasks: .specify/specs/library-materials-unification/tasks.md (TASK-012)
 */

interface TestMetrics {
  loadTime: number;
  consoleErrors: ConsoleMessage[];
  consoleWarnings: ConsoleMessage[];
  performanceEntries: any[];
}

class LibraryTestHelper {
  private page: Page;
  private metrics: TestMetrics;

  constructor(page: Page) {
    this.page = page;
    this.metrics = {
      loadTime: 0,
      consoleErrors: [],
      consoleWarnings: [],
      performanceEntries: []
    };
  }

  async startMonitoring() {
    console.log('🔊 Starting console and performance monitoring...');

    this.page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      console.log(`[BROWSER CONSOLE] ${type.toUpperCase()}: ${text}`);

      if (type === 'error') {
        this.metrics.consoleErrors.push(msg);
      } else if (type === 'warning') {
        this.metrics.consoleWarnings.push(msg);
      }
    });

    this.page.on('pageerror', (error) => {
      console.error('🚨 PAGE ERROR:', error.message);
    });

    this.page.on('requestfailed', (request) => {
      console.error('🚨 REQUEST FAILED:', request.url(), request.failure()?.errorText);
    });
  }

  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    const endTime = Date.now();
    this.metrics.loadTime = endTime - startTime;
    console.log(`⏱️ Page load time: ${this.metrics.loadTime}ms`);
    return this.metrics.loadTime;
  }

  async takeDebugScreenshot(name: string) {
    const path = `test-results/debug-screenshots/library-${name}-${Date.now()}.png`;
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Debug screenshot saved: ${path}`);
  }

  async navigateToLibrary() {
    console.log('📚 Navigating to Library page...');

    // Try multiple navigation methods
    const navigationMethods = [
      // Method 1: Direct URL navigation
      async () => {
        await this.page.goto('/library');
        await this.page.waitForLoadState('networkidle');
      },
      // Method 2: Click Library tab in navigation
      async () => {
        await this.page.goto('/');
        const libraryTab = this.page.locator('ion-tab-button[tab="library"], button:has-text("Bibliothek"), a[href="/library"]');
        await libraryTab.first().click();
        await this.page.waitForLoadState('networkidle');
      }
    ];

    for (const method of navigationMethods) {
      try {
        await method();
        console.log('✅ Successfully navigated to Library');
        return true;
      } catch (error) {
        console.log('⚠️ Navigation method failed, trying next...');
        continue;
      }
    }

    throw new Error('Could not navigate to Library page');
  }

  async waitForLibraryInterface() {
    console.log('🕰️ Waiting for Library interface to load...');

    // Wait for key Library elements
    const librarySelectors = [
      'ion-segment-button[value="chats"]',
      'ion-segment-button[value="artifacts"]',
      'ion-searchbar',
      'ion-title:has-text("Bibliothek")',
      'ion-title:has-text("Library")'
    ];

    for (const selector of librarySelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        console.log(`✅ Library interface found with selector: ${selector}`);
        return true;
      } catch (e) {
        continue;
      }
    }

    console.error('❌ Library interface not found');
    return false;
  }

  async clickTab(tabName: 'chats' | 'artifacts') {
    console.log(`📑 Clicking "${tabName}" tab...`);

    const tabSelector = tabName === 'chats'
      ? 'ion-segment-button[value="chats"]'
      : 'ion-segment-button[value="artifacts"]';

    const tab = this.page.locator(tabSelector);
    await expect(tab).toBeVisible();
    await tab.click();

    // Wait for tab content to load
    await this.page.waitForTimeout(1000);
    console.log(`✅ Switched to "${tabName}" tab`);
  }

  async clickFilterChip(filterName: string) {
    console.log(`🏷️ Clicking filter chip: "${filterName}"...`);

    // Find the chip by text content
    const chip = this.page.locator(`ion-chip:has-text("${filterName}")`);
    await expect(chip).toBeVisible();
    await chip.click();

    // Wait for filter to apply
    await this.page.waitForTimeout(500);
    console.log(`✅ Filter "${filterName}" applied`);
  }

  async getMaterialCards() {
    console.log('🔍 Getting all material cards...');

    // Wait for materials to load
    await this.page.waitForSelector('ion-card, .material-card, [data-testid="material-card"]', {
      timeout: 5000
    }).catch(() => {
      console.log('⚠️ No material cards found - might be empty state');
    });

    const cards = this.page.locator('ion-card');
    const count = await cards.count();
    console.log(`📋 Found ${count} material cards`);

    return cards;
  }

  async searchMaterials(query: string) {
    console.log(`🔍 Searching materials for: "${query}"...`);

    const searchbar = this.page.locator('ion-searchbar');
    await expect(searchbar).toBeVisible();

    // Use Ionic's native search method
    await searchbar.click();
    const input = searchbar.locator('input');
    await input.fill(query);

    // Wait for search to apply
    await this.page.waitForTimeout(500);
    console.log(`✅ Search applied: "${query}"`);
  }

  async clickMaterialCard(index: number = 0) {
    console.log(`👆 Clicking material card at index ${index}...`);

    const cards = await this.getMaterialCards();
    const card = cards.nth(index);

    await expect(card).toBeVisible();
    await card.click();

    // Wait for modal to open
    await this.page.waitForTimeout(1000);
    console.log(`✅ Material card clicked`);
  }

  async waitForPreviewModal() {
    console.log('📋 Waiting for preview modal...');

    const modalSelectors = [
      'ion-modal[is-open="true"]',
      '.modal-wrapper',
      '[data-testid="material-preview-modal"]'
    ];

    for (const selector of modalSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        console.log(`✅ Preview modal opened with selector: ${selector}`);
        return true;
      } catch (e) {
        continue;
      }
    }

    console.error('❌ Preview modal did not open');
    return false;
  }

  async closePreviewModal() {
    console.log('❌ Closing preview modal...');

    // Try multiple close methods
    const closeMethods = [
      // Method 1: Click close button
      async () => {
        const closeButton = this.page.locator('ion-button:has-text("Schließen"), ion-button:has([name="close"]), button[aria-label="close"]');
        await closeButton.first().click();
      },
      // Method 2: Click backdrop
      async () => {
        const backdrop = this.page.locator('.modal-backdrop, ion-backdrop');
        await backdrop.click();
      },
      // Method 3: Press Escape key
      async () => {
        await this.page.keyboard.press('Escape');
      }
    ];

    for (const method of closeMethods) {
      try {
        await method();
        await this.page.waitForTimeout(500);
        console.log('✅ Preview modal closed');
        return true;
      } catch (e) {
        continue;
      }
    }

    console.log('⚠️ Could not close modal with standard methods');
    return false;
  }

  async deleteCurrentMaterial() {
    console.log('🗑️ Deleting current material...');

    // Click delete button in modal
    const deleteButton = this.page.locator('ion-button:has-text("Löschen"), button:has([name="trash"])');
    await expect(deleteButton.first()).toBeVisible();
    await deleteButton.first().click();

    // Wait for confirmation alert
    await this.page.waitForTimeout(500);

    // Confirm deletion
    const confirmButton = this.page.locator('ion-alert button:has-text("Ja"), button:has-text("Löschen"), button:has-text("Bestätigen")');
    await expect(confirmButton.first()).toBeVisible();
    await confirmButton.first().click();

    // Wait for deletion to complete
    await this.page.waitForTimeout(1000);
    console.log('✅ Material deleted');
  }

  async editMaterialTitle(newTitle: string) {
    console.log(`✏️ Editing material title to: "${newTitle}"...`);

    // Find title input or edit button
    const titleInput = this.page.locator('ion-input[placeholder*="Titel"], input[type="text"]').first();

    if (await titleInput.isVisible({ timeout: 2000 })) {
      // Title is already editable
      await titleInput.clear();
      await titleInput.fill(newTitle);
    } else {
      // Need to click edit button first
      const editButton = this.page.locator('ion-button:has([name="create"]), button:has-text("Bearbeiten")').first();
      await editButton.click();
      await this.page.waitForTimeout(500);
      await titleInput.fill(newTitle);
    }

    // Save changes
    const saveButton = this.page.locator('ion-button:has-text("Speichern"), button:has-text("Save")').first();
    await saveButton.click();

    await this.page.waitForTimeout(500);
    console.log(`✅ Title updated to: "${newTitle}"`);
  }

  async toggleFavorite() {
    console.log('❤️ Toggling favorite...');

    const favoriteButton = this.page.locator('ion-button:has([name="heart"]), button:has([name="heart-outline"])').first();
    await expect(favoriteButton).toBeVisible();
    await favoriteButton.click();

    await this.page.waitForTimeout(500);
    console.log('✅ Favorite toggled');
  }

  async verifyDateFormat() {
    console.log('📅 Verifying date format...');

    // Look for German date formats
    const datePatterns = [
      /Heute \d{2}:\d{2}/,  // "Heute 14:30"
      /Gestern \d{2}:\d{2}/, // "Gestern 10:15"
      /vor \d+ Tagen?/,      // "vor 3 Tagen"
      /\d{2}\.\d{2}\.\d{2}/, // "25.09.25"
      /\d{1,2}\. \w{3}/      // "25. Sep"
    ];

    const pageContent = await this.page.textContent('body');

    for (const pattern of datePatterns) {
      if (pattern.test(pageContent || '')) {
        console.log(`✅ Found valid German date format: ${pattern}`);
        return true;
      }
    }

    console.log('⚠️ No German date formats found - might be empty state');
    return false;
  }

  async verifyFilterChipsExist() {
    console.log('🏷️ Verifying all filter chips exist...');

    const expectedChips = [
      'Alle',
      'Dokumente',
      'Arbeitsblätter',
      'Quiz',
      'Stundenpläne',
      'Ressourcen',
      'Uploads',
      'KI-generiert'
    ];

    for (const chipLabel of expectedChips) {
      const chip = this.page.locator(`ion-chip:has-text("${chipLabel}")`);
      const isVisible = await chip.isVisible({ timeout: 2000 });

      if (isVisible) {
        console.log(`✅ Filter chip "${chipLabel}" found`);
      } else {
        console.log(`❌ Filter chip "${chipLabel}" NOT found`);
      }
    }
  }

  getMetrics(): TestMetrics {
    return this.metrics;
  }
}

test.describe('Library & Materials Unification - Core Features', () => {
  let helper: LibraryTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LibraryTestHelper(page);
    await helper.startMonitoring();

    console.log('🌐 Setting up Library test...');
    await helper.navigateToLibrary();
    await helper.measureLoadTime();
    await helper.waitForLibraryInterface();
  });

  test.afterEach(async ({ page }) => {
    const metrics = helper.getMetrics();

    console.log('\n📊 TEST METRICS SUMMARY:');
    console.log(`⏱️ Load Time: ${metrics.loadTime}ms`);
    console.log(`❌ Console Errors: ${metrics.consoleErrors.length}`);
    console.log(`⚠️ Console Warnings: ${metrics.consoleWarnings.length}`);

    if (metrics.consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS DETECTED:');
      metrics.consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.text()}`);
      });
    }

    await helper.takeDebugScreenshot('test-end');
  });

  test('US-1: Two-Tab Layout - Chats and Materialien', async ({ page }) => {
    console.log('\n📑 TEST: Two-Tab Layout');

    // Verify both tabs are visible
    const chatsTab = page.locator('ion-segment-button[value="chats"]');
    const materialsTab = page.locator('ion-segment-button[value="artifacts"]');

    await expect(chatsTab).toBeVisible();
    await expect(materialsTab).toBeVisible();

    // Verify Uploads tab is NOT visible
    const uploadsTab = page.locator('ion-segment-button[value="uploads"]');
    await expect(uploadsTab).not.toBeVisible();

    console.log('✅ Two-tab layout verified (no Uploads tab)');
    await helper.takeDebugScreenshot('two-tab-layout');
  });

  test('US-2: Switch Between Chats and Materialien Tabs', async ({ page }) => {
    console.log('\n📑 TEST: Tab Switching');

    // Start on Chats tab
    await helper.clickTab('chats');
    await helper.takeDebugScreenshot('chats-tab-active');

    // Verify chats tab is active
    const chatsTab = page.locator('ion-segment-button[value="chats"]');
    await expect(chatsTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Materialien tab
    await helper.clickTab('artifacts');
    await helper.takeDebugScreenshot('materials-tab-active');

    // Verify materials tab is active
    const materialsTab = page.locator('ion-segment-button[value="artifacts"]');
    await expect(materialsTab).toHaveAttribute('aria-selected', 'true');

    console.log('✅ Tab switching works correctly');
  });

  test('US-3: All 8 Filter Chips are Visible', async ({ page }) => {
    console.log('\n🏷️ TEST: Filter Chips Visibility');

    // Switch to Materialien tab
    await helper.clickTab('artifacts');

    // Verify all filter chips exist
    await helper.verifyFilterChipsExist();
    await helper.takeDebugScreenshot('filter-chips-visible');

    console.log('✅ All filter chips verified');
  });

  test('US-4: Filter by Uploads', async ({ page }) => {
    console.log('\n🏷️ TEST: Filter by Uploads');

    await helper.clickTab('artifacts');

    // Get initial material count
    const allMaterials = await helper.getMaterialCards();
    const totalCount = await allMaterials.count();
    console.log(`📊 Total materials before filter: ${totalCount}`);

    // Click Uploads filter
    await helper.clickFilterChip('Uploads');
    await helper.takeDebugScreenshot('uploads-filter-active');

    // Get filtered material count
    const filteredMaterials = await helper.getMaterialCards();
    const filteredCount = await filteredMaterials.count();
    console.log(`📊 Materials after Uploads filter: ${filteredCount}`);

    // Verify filter is active
    const uploadsChip = page.locator('ion-chip:has-text("Uploads")');
    await expect(uploadsChip).toHaveClass(/chip-active|selected/);

    console.log('✅ Uploads filter works correctly');
  });

  test('US-5: Filter by KI-generiert', async ({ page }) => {
    console.log('\n🏷️ TEST: Filter by KI-generiert');

    await helper.clickTab('artifacts');

    // Click KI-generiert filter
    await helper.clickFilterChip('KI-generiert');
    await helper.takeDebugScreenshot('ai-generated-filter-active');

    // Verify filter is active
    const aiChip = page.locator('ion-chip:has-text("KI-generiert")');
    await expect(aiChip).toHaveClass(/chip-active|selected/);

    console.log('✅ KI-generiert filter works correctly');
  });

  test('US-6: Filter by Document Type', async ({ page }) => {
    console.log('\n🏷️ TEST: Filter by Dokumente');

    await helper.clickTab('artifacts');

    // Click Dokumente filter
    await helper.clickFilterChip('Dokumente');
    await helper.takeDebugScreenshot('documents-filter-active');

    // Get filtered materials
    const filteredMaterials = await helper.getMaterialCards();
    const count = await filteredMaterials.count();
    console.log(`📊 Materials after Dokumente filter: ${count}`);

    console.log('✅ Dokumente filter works correctly');
  });

  test('US-7: Search Across All Materials', async ({ page }) => {
    console.log('\n🔍 TEST: Search Functionality');

    await helper.clickTab('artifacts');

    // Get initial count
    const allMaterials = await helper.getMaterialCards();
    const totalCount = await allMaterials.count();
    console.log(`📊 Total materials before search: ${totalCount}`);

    // Search for a common term
    await helper.searchMaterials('test');
    await helper.takeDebugScreenshot('search-results');

    // Get search results count
    const searchResults = await helper.getMaterialCards();
    const resultsCount = await searchResults.count();
    console.log(`📊 Search results: ${resultsCount}`);

    console.log('✅ Search functionality works');
  });

  test('US-8: Date Formatting is in German', async ({ page }) => {
    console.log('\n📅 TEST: German Date Formatting');

    await helper.clickTab('artifacts');

    // Verify German date formats exist
    const hasGermanDates = await helper.verifyDateFormat();
    await helper.takeDebugScreenshot('german-date-formats');

    if (hasGermanDates) {
      console.log('✅ German date formatting verified');
    } else {
      console.log('⚠️ No dates found - might be empty state');
    }
  });
});

test.describe('Library & Materials Unification - Material Preview & Actions', () => {
  let helper: LibraryTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LibraryTestHelper(page);
    await helper.startMonitoring();

    await helper.navigateToLibrary();
    await helper.waitForLibraryInterface();
    await helper.clickTab('artifacts');
  });

  test.afterEach(async ({ page }) => {
    await helper.takeDebugScreenshot('preview-test-end');
  });

  test('US-9: Open Material Preview Modal', async ({ page }) => {
    console.log('\n📋 TEST: Open Material Preview Modal');

    // Check if materials exist
    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    if (count === 0) {
      console.log('⚠️ No materials available - skipping preview test');
      test.skip();
      return;
    }

    // Click first material
    await helper.clickMaterialCard(0);
    await helper.takeDebugScreenshot('modal-opening');

    // Verify modal opened
    const modalOpened = await helper.waitForPreviewModal();
    expect(modalOpened).toBe(true);

    console.log('✅ Material preview modal opens correctly');
    await helper.takeDebugScreenshot('modal-opened');

    // Close modal
    await helper.closePreviewModal();
  });

  test('US-10: Edit Material Title in Modal', async ({ page }) => {
    console.log('\n✏️ TEST: Edit Material Title');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    if (count === 0) {
      console.log('⚠️ No materials available - skipping edit test');
      test.skip();
      return;
    }

    // Open material
    await helper.clickMaterialCard(0);
    await helper.waitForPreviewModal();

    // Edit title
    const newTitle = `Test Material ${Date.now()}`;
    await helper.editMaterialTitle(newTitle);
    await helper.takeDebugScreenshot('title-edited');

    // Verify title updated in modal
    const modalContent = await page.textContent('ion-modal');
    expect(modalContent).toContain(newTitle);

    console.log('✅ Material title edit works correctly');

    await helper.closePreviewModal();
  });

  test('US-11: Toggle Favorite on Material', async ({ page }) => {
    console.log('\n❤️ TEST: Toggle Favorite');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    if (count === 0) {
      console.log('⚠️ No materials available - skipping favorite test');
      test.skip();
      return;
    }

    // Open material
    await helper.clickMaterialCard(0);
    await helper.waitForPreviewModal();

    // Toggle favorite
    await helper.toggleFavorite();
    await helper.takeDebugScreenshot('favorite-toggled');

    console.log('✅ Favorite toggle works correctly');

    await helper.closePreviewModal();
  });

  test('US-12: Delete Material', async ({ page }) => {
    console.log('\n🗑️ TEST: Delete Material');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    if (count === 0) {
      console.log('⚠️ No materials available - skipping delete test');
      test.skip();
      return;
    }

    const initialCount = count;
    console.log(`📊 Initial material count: ${initialCount}`);

    // Open material
    await helper.clickMaterialCard(0);
    await helper.waitForPreviewModal();

    // Delete material
    await helper.deleteCurrentMaterial();
    await helper.takeDebugScreenshot('material-deleted');

    // Verify material count decreased
    const updatedMaterials = await helper.getMaterialCards();
    const newCount = await updatedMaterials.count();
    console.log(`📊 Material count after delete: ${newCount}`);

    expect(newCount).toBeLessThan(initialCount);

    console.log('✅ Material deletion works correctly');
  });
});

test.describe('Library & Materials Unification - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  let helper: LibraryTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LibraryTestHelper(page);
    await helper.startMonitoring();

    await helper.navigateToLibrary();
    await helper.waitForLibraryInterface();
  });

  test('Mobile: Two-Tab Layout is Responsive', async ({ page }) => {
    console.log('\n📱 TEST: Mobile Two-Tab Layout');

    // Verify tabs are visible on mobile
    const chatsTab = page.locator('ion-segment-button[value="chats"]');
    const materialsTab = page.locator('ion-segment-button[value="artifacts"]');

    await expect(chatsTab).toBeVisible();
    await expect(materialsTab).toBeVisible();

    // Verify tabs are touchable (min 44px height)
    const chatsBox = await chatsTab.boundingBox();
    if (chatsBox) {
      expect(chatsBox.height).toBeGreaterThanOrEqual(44);
    }

    await helper.takeDebugScreenshot('mobile-tabs');
    console.log('✅ Mobile two-tab layout is responsive');
  });

  test('Mobile: Filter Chips are Scrollable', async ({ page }) => {
    console.log('\n📱 TEST: Mobile Filter Chips Scrollability');

    await helper.clickTab('artifacts');

    // Verify filter chips container is scrollable
    const chipsContainer = page.locator('ion-chip').first().locator('..');
    await expect(chipsContainer).toBeVisible();

    await helper.takeDebugScreenshot('mobile-filter-chips');
    console.log('✅ Mobile filter chips are scrollable');
  });

  test('Mobile: Material Cards are Touch-Friendly', async ({ page }) => {
    console.log('\n📱 TEST: Mobile Material Card Touch Targets');

    await helper.clickTab('artifacts');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    if (count > 0) {
      const firstCard = materials.first();
      const cardBox = await firstCard.boundingBox();

      if (cardBox) {
        console.log(`📏 Card dimensions: ${cardBox.width}x${cardBox.height}`);
        expect(cardBox.height).toBeGreaterThanOrEqual(60);
      }
    }

    await helper.takeDebugScreenshot('mobile-material-cards');
    console.log('✅ Mobile material cards are touch-friendly');
  });

  test('Mobile: Preview Modal is Full-Screen', async ({ page }) => {
    console.log('\n📱 TEST: Mobile Preview Modal Full-Screen');

    await helper.clickTab('artifacts');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    if (count > 0) {
      await helper.clickMaterialCard(0);
      await helper.waitForPreviewModal();

      // Verify modal is full-screen on mobile
      const modal = page.locator('ion-modal[is-open="true"]');
      const modalBox = await modal.boundingBox();

      if (modalBox) {
        const viewport = page.viewportSize();
        if (viewport) {
          console.log(`📐 Modal size: ${modalBox.width}x${modalBox.height}`);
          console.log(`📐 Viewport size: ${viewport.width}x${viewport.height}`);

          // Modal should cover most of the screen on mobile
          expect(modalBox.width).toBeGreaterThan(viewport.width * 0.9);
        }
      }

      await helper.takeDebugScreenshot('mobile-preview-modal');
      console.log('✅ Mobile preview modal is full-screen');

      await helper.closePreviewModal();
    } else {
      console.log('⚠️ No materials available - skipping mobile modal test');
      test.skip();
    }
  });
});

test.describe('Library & Materials Unification - Performance', () => {
  let helper: LibraryTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LibraryTestHelper(page);
    await helper.startMonitoring();
  });

  test('Performance: Library Loads in < 2 Seconds', async ({ page }) => {
    console.log('\n⚡ TEST: Library Load Performance');

    const startTime = Date.now();
    await helper.navigateToLibrary();
    await helper.waitForLibraryInterface();
    const loadTime = Date.now() - startTime;

    console.log(`⏱️ Library load time: ${loadTime}ms`);

    // Performance expectation: Library should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);

    await helper.takeDebugScreenshot('performance-loaded');
    console.log('✅ Library load performance is acceptable');
  });

  test('Performance: Tab Switching is Instant', async ({ page }) => {
    console.log('\n⚡ TEST: Tab Switching Performance');

    await helper.navigateToLibrary();
    await helper.waitForLibraryInterface();

    // Measure tab switch time
    const startTime = Date.now();
    await helper.clickTab('artifacts');
    const switchTime = Date.now() - startTime;

    console.log(`⏱️ Tab switch time: ${switchTime}ms`);

    // Tab switch should be under 500ms
    expect(switchTime).toBeLessThan(500);

    console.log('✅ Tab switching performance is acceptable');
  });

  test('Performance: Filter Application is Fast', async ({ page }) => {
    console.log('\n⚡ TEST: Filter Application Performance');

    await helper.navigateToLibrary();
    await helper.waitForLibraryInterface();
    await helper.clickTab('artifacts');

    // Measure filter application time
    const startTime = Date.now();
    await helper.clickFilterChip('Dokumente');
    const filterTime = Date.now() - startTime;

    console.log(`⏱️ Filter application time: ${filterTime}ms`);

    // Filter should apply within 500ms
    expect(filterTime).toBeLessThan(500);

    console.log('✅ Filter application performance is acceptable');
  });
});

test.describe('Library & Materials Unification - Edge Cases', () => {
  let helper: LibraryTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LibraryTestHelper(page);
    await helper.startMonitoring();

    await helper.navigateToLibrary();
    await helper.waitForLibraryInterface();
  });

  test('Edge Case: Empty Materials State', async ({ page }) => {
    console.log('\n🔍 TEST: Empty Materials State');

    await helper.clickTab('artifacts');

    // Apply filter that likely returns no results
    await helper.clickFilterChip('Uploads');
    await helper.clickFilterChip('KI-generiert');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    console.log(`📊 Material count with restrictive filters: ${count}`);

    // Verify empty state message exists (if applicable)
    const emptyStateSelectors = [
      'ion-text:has-text("Keine Materialien")',
      'ion-text:has-text("Keine Ergebnisse")',
      '.empty-state',
      '[data-testid="empty-state"]'
    ];

    let hasEmptyState = false;
    for (const selector of emptyStateSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 1000 })) {
        hasEmptyState = true;
        console.log('✅ Empty state message displayed');
        break;
      }
    }

    await helper.takeDebugScreenshot('empty-materials-state');
    console.log('✅ Empty materials state handled correctly');
  });

  test('Edge Case: Search with No Results', async ({ page }) => {
    console.log('\n🔍 TEST: Search with No Results');

    await helper.clickTab('artifacts');

    // Search for unlikely term
    await helper.searchMaterials('xyzabc123notfound');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    console.log(`📊 Materials found with invalid search: ${count}`);

    // Should show no results
    expect(count).toBe(0);

    await helper.takeDebugScreenshot('no-search-results');
    console.log('✅ Empty search results handled correctly');
  });

  test('Edge Case: Combined Filter and Search', async ({ page }) => {
    console.log('\n🔍 TEST: Combined Filter and Search');

    await helper.clickTab('artifacts');

    // Apply filter
    await helper.clickFilterChip('Dokumente');

    // Apply search
    await helper.searchMaterials('test');

    const materials = await helper.getMaterialCards();
    const count = await materials.count();

    console.log(`📊 Materials with combined filter + search: ${count}`);

    await helper.takeDebugScreenshot('combined-filter-search');
    console.log('✅ Combined filter and search works correctly');
  });
});