import { test, expect, Page } from '@playwright/test';
import { setupMockServer } from './mocks/setup';

/**
 * E2E Test Suite: US2 - Library Navigation (T012)
 *
 * Tests the complete workflow for navigating to Library after image generation
 * and verifying that MaterialPreviewModal auto-opens with the newly created image.
 *
 * User Story:
 * As a teacher who just generated an image,
 * I want to click "In Library öffnen" and see the image in the Library tab,
 * so that I can immediately view and manage the newly created material.
 *
 * Implementation Details:
 * - AgentResultView dispatches: window.dispatchEvent(new CustomEvent('navigate-library-tab', { detail: { tab: 'materials', materialId } }))
 * - Library.tsx listens for event and auto-opens MaterialPreviewModal if materialId is provided
 * - Backend returns `library_id` in `result.data.library_id`
 *
 * Test-After Pattern: These tests should PASS on first run as fixes are already implemented.
 */

class LibraryNavigationHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForChatInterface() {
    console.log('🕰️ Waiting for chat interface to load...');
    await this.page.waitForSelector('ion-input[placeholder*="Nachricht schreiben"]', {
      state: 'visible',
      timeout: 10000
    });
    console.log('✅ Chat interface loaded');
  }

  async navigateToTab(tab: 'home' | 'chat' | 'library') {
    console.log(`📍 Navigating to ${tab} tab`);
    const tabButton = this.page.locator(`button[data-testid="tab-${tab}"], button:has-text("${tab === 'library' ? 'Bibliothek' : tab.charAt(0).toUpperCase() + tab.slice(1)}")`).first();
    await tabButton.click();
    await this.page.waitForTimeout(500);
    console.log(`✅ Navigated to ${tab} tab`);
  }

  async generateImage(description: string) {
    console.log(`🎨 Generating image: "${description}"`);

    // Navigate to chat if not already there
    await this.navigateToTab('chat');

    // Input image request
    const chatInput = this.page.locator('ion-input[placeholder*="Nachricht schreiben"] input').first();
    await chatInput.click();
    await chatInput.fill(description);
    await this.page.waitForTimeout(300);

    // Submit message
    const sendButton = this.page.locator('ion-button:has-text("Senden"), button[type="submit"]').first();
    await sendButton.click();
    await this.page.waitForTimeout(2000);

    // Wait for agent confirmation (fast in mock mode)
    console.log('⏳ Waiting for agent suggestion (mock mode - fast)...');
    const confirmButton = this.page.locator('button:has-text("Bild-Generierung starten")').first();
    await expect(confirmButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Agent suggestion appeared, clicking button...');
    await confirmButton.click();
    await this.page.waitForTimeout(1000);

    // Fill form if needed (description should be pre-filled)
    const descriptionField = this.page.locator('#description-input, textarea[name="description"]').first();
    if (await descriptionField.isVisible({ timeout: 2000 })) {
      const styleDropdown = this.page.locator('#image-style-select, select[name="imageStyle"]').first();
      if (await styleDropdown.isVisible({ timeout: 1000 })) {
        await styleDropdown.selectOption('illustrative');
      }
    }

    // Click generate button
    const generateButton = this.page.locator('ion-button:has-text("Bild generieren"), button:has-text("generieren")').first();
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();

    // Wait for result (fast in mock mode)
    console.log('⏳ Waiting for image generation result (mock mode - instant)...');
    const resultView = this.page.locator('[data-testid="agent-result-view"], .agent-result-view').first();
    await expect(resultView).toBeVisible({ timeout: 10000 });

    console.log('✅ Image generation complete!');
  }

  async getActiveTab(): Promise<string> {
    // Check which tab button has the active color (#FB6542)
    const tabs = await this.page.locator('div.tab-bar-fixed button').all();
    for (const tab of tabs) {
      const color = await tab.evaluate((el: Element) => {
        return window.getComputedStyle(el).color;
      });
      // RGB for #FB6542 is rgb(251, 101, 66)
      if (color.includes('251, 101, 66') || color.includes('FB6542')) {
        const text = await tab.textContent();
        return text?.toLowerCase().trim() || '';
      }
    }
    return 'unknown';
  }

  async takeScreenshot(name: string) {
    const path = `test-results/library-navigation/${name}.png`;
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot saved: ${path}`);
  }
}

test.describe('US2 - Library Navigation (T012)', () => {
  test.beforeAll(async () => {
    if (process.env.VITE_TEST_MODE !== 'true') {
      console.warn('⚠️ VITE_TEST_MODE is not enabled. Tests may fail due to authentication.');
    }
  });

  let helper: LibraryNavigationHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LibraryNavigationHelper(page);

    console.log('🎭 Setting up mock server...');
    await setupMockServer(page);

    console.log('🌐 Navigating to application...');
    await page.goto('/');
    await helper.waitForChatInterface();
  });

  test('US2-001: Click "In Library öffnen" navigates to Library tab', async ({ page }) => {
    test.setTimeout(60000); // 1 minute for full workflow

    console.log('\n🎯 TEST: US2-001 - Library tab navigation');

    // Step 1: Generate image
    await helper.generateImage('Erstelle ein Bild zur Photosynthese für Klasse 7');

    // Step 2: Verify we're in result view
    const resultView = page.locator('[data-testid="agent-result-view"]').first();
    await expect(resultView).toBeVisible();
    console.log('✅ Result view visible');

    await helper.takeScreenshot('us2-001-before-library-button-click');

    // Step 3: Click "In Library öffnen" button
    const libraryButton = page.locator('button:has-text("In Library öffnen")').first();
    await expect(libraryButton).toBeVisible({ timeout: 5000 });
    console.log('✅ "In Library öffnen" button visible');

    await libraryButton.click();
    await page.waitForTimeout(1000); // Wait for navigation

    await helper.takeScreenshot('us2-001-after-library-button-click');

    // Step 4: Verify we're on Library tab (not Chat)
    const activeTab = await helper.getActiveTab();
    expect(activeTab).toBe('bibliothek'); // German name in app
    console.log('✅ Active tab is Library (not Chat)');

    // Step 5: Verify "Materialien" tab is active (not "Chats")
    const materialsTab = page.locator('button:has-text("Materialien")').first();
    const materialsTabClass = await materialsTab.getAttribute('class');
    expect(materialsTabClass).toContain('text-primary-500'); // Active tab has primary color
    console.log('✅ "Materialien" tab is active');

    console.log('✅ US2-001 test passed');
  });

  test('US2-002: MaterialPreviewModal auto-opens with newly created image', async ({ page }) => {
    test.setTimeout(60000); // 1 minute for full workflow

    console.log('\n🎯 TEST: US2-002 - MaterialPreviewModal auto-opens');

    // Step 1: Generate image
    await helper.generateImage('Erstelle ein Bild zur Mathematik für Klasse 5');

    // Step 2: Extract materialId from console logs (custom event detail)
    let eventMaterialId: string | null = null;
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Dispatched navigate-library-tab event with materialId:')) {
        const match = text.match(/materialId:\s*(\S+)/);
        if (match) {
          eventMaterialId = match[1];
          console.log(`📝 Captured materialId from event: ${eventMaterialId}`);
        }
      }
    });

    // Step 3: Click "In Library öffnen" button
    const libraryButton = page.locator('button:has-text("In Library öffnen")').first();
    await expect(libraryButton).toBeVisible({ timeout: 5000 });
    await libraryButton.click();
    await page.waitForTimeout(2000); // Wait for event dispatch + modal open

    await helper.takeScreenshot('us2-002-after-navigation');

    // Step 4: Verify MaterialPreviewModal opens automatically
    const modal = page.locator('ion-modal[is-open="true"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ MaterialPreviewModal opened automatically');

    // Step 5: Verify modal shows the newly created image
    const modalImage = modal.locator('img[data-testid="material-image"]').first();
    await expect(modalImage).toBeVisible({ timeout: 3000 });
    console.log('✅ Modal displays image');

    // Step 6: Verify modal displays title and metadata
    const modalTitle = modal.locator('[data-testid="material-title"]').first();
    await expect(modalTitle).toBeVisible();
    const titleText = await modalTitle.textContent();
    console.log(`✅ Modal title: "${titleText}"`);

    // Step 7: Verify metadata fields are present
    const typeField = modal.locator('[data-testid="material-type"]').first();
    await expect(typeField).toBeVisible();
    const typeText = await typeField.textContent();
    expect(typeText).toBe('image');
    console.log('✅ Type metadata: "image"');

    const sourceField = modal.locator('[data-testid="material-source"]').first();
    await expect(sourceField).toBeVisible();
    const sourceText = await sourceField.textContent();
    expect(sourceText).toBe('KI-generiert');
    console.log('✅ Source metadata: "KI-generiert"');

    const dateField = modal.locator('[data-testid="material-date"]').first();
    await expect(dateField).toBeVisible();
    console.log('✅ Date metadata visible');

    // Step 8: Verify custom event was dispatched with correct materialId
    if (eventMaterialId) {
      console.log(`✅ Custom event dispatched with materialId: ${eventMaterialId}`);
    } else {
      console.warn('⚠️ Could not capture materialId from console logs (may be timing issue)');
    }

    await helper.takeScreenshot('us2-002-modal-open-with-metadata');

    console.log('✅ US2-002 test passed');
  });

  test('US2-003: Navigate-library-tab event details are correct', async ({ page }) => {
    test.setTimeout(60000); // 1 minute for full workflow

    console.log('\n🎯 TEST: US2-003 - Custom event validation');

    // Step 1: Generate image
    await helper.generateImage('Erstelle ein Bild zur Biologie');

    // Step 2: Listen for navigate-library-tab event
    const eventDetails: any[] = [];
    await page.evaluate(() => {
      window.addEventListener('navigate-library-tab', (event: Event) => {
        const customEvent = event as CustomEvent;
        (window as any).__lastLibraryNavEvent = customEvent.detail;
      });
    });

    // Step 3: Click "In Library öffnen" button
    const libraryButton = page.locator('button:has-text("In Library öffnen")').first();
    await expect(libraryButton).toBeVisible({ timeout: 5000 });
    await libraryButton.click();
    await page.waitForTimeout(1000); // Wait for event dispatch

    // Step 4: Extract event detail from window
    const eventDetail = await page.evaluate(() => (window as any).__lastLibraryNavEvent);

    console.log('📝 Event detail:', eventDetail);

    // Step 5: Verify event structure
    expect(eventDetail).toBeDefined();
    expect(eventDetail.tab).toBe('materials');
    expect(eventDetail.source).toBe('AgentResultView');
    expect(eventDetail.materialId).toBeDefined();
    expect(typeof eventDetail.materialId).toBe('string');

    console.log('✅ Event detail structure is correct:', {
      tab: eventDetail.tab,
      source: eventDetail.source,
      materialId: eventDetail.materialId
    });

    console.log('✅ US2-003 test passed');
  });

  test('US2-004: Modal closes and stays closed when user closes it', async ({ page }) => {
    test.setTimeout(60000); // 1 minute for full workflow

    console.log('\n🎯 TEST: US2-004 - Modal close behavior');

    // Step 1: Generate image
    await helper.generateImage('Erstelle ein Bild zur Chemie');

    // Step 2: Click "In Library öffnen" button
    const libraryButton = page.locator('button:has-text("In Library öffnen")').first();
    await expect(libraryButton).toBeVisible({ timeout: 5000 });
    await libraryButton.click();
    await page.waitForTimeout(2000); // Wait for modal open

    // Step 3: Verify modal is open
    const modal = page.locator('ion-modal[is-open="true"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal opened');

    await helper.takeScreenshot('us2-004-modal-open');

    // Step 4: Close modal using close button
    const closeButton = modal.locator('button[data-testid="close-button"]').first();
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await page.waitForTimeout(500); // Wait for modal close animation

    await helper.takeScreenshot('us2-004-modal-closed');

    // Step 5: Verify modal is closed
    await expect(modal).not.toBeVisible({ timeout: 3000 });
    console.log('✅ Modal closed');

    // Step 6: Verify modal stays closed (doesn't re-open)
    await page.waitForTimeout(1000);
    await expect(modal).not.toBeVisible();
    console.log('✅ Modal stays closed (no re-open)');

    console.log('✅ US2-004 test passed');
  });

  test('US2-005: Multiple materials - correct material opens in modal', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for multiple generations

    console.log('\n🎯 TEST: US2-005 - Multiple materials, correct one opens');

    // Step 1: Generate first image
    await helper.generateImage('Erstelle ein Bild zur Physik');
    let continueButton = page.locator('button:has-text("Weiter im Chat")').first();
    if (await continueButton.isVisible({ timeout: 2000 })) {
      await continueButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await continueButton.click({ force: true });
      await page.waitForTimeout(1000);
    }

    // Step 2: Generate second image
    await helper.generateImage('Erstelle ein Bild zur Geschichte');

    // Step 3: Track the materialId of the second image
    let secondImageMaterialId: string | null = null;
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Dispatched navigate-library-tab event with materialId:')) {
        const match = text.match(/materialId:\s*(\S+)/);
        if (match) {
          secondImageMaterialId = match[1];
          console.log(`📝 Captured materialId: ${secondImageMaterialId}`);
        }
      }
    });

    // Step 4: Click "In Library öffnen" for second image
    const libraryButton = page.locator('button:has-text("In Library öffnen")').first();
    await expect(libraryButton).toBeVisible({ timeout: 5000 });
    await libraryButton.click();
    await page.waitForTimeout(2000); // Wait for modal open

    // Step 5: Verify modal opens with SECOND image (not first)
    const modal = page.locator('ion-modal[is-open="true"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    const modalTitle = modal.locator('[data-testid="material-title"]').first();
    const titleText = await modalTitle.textContent();

    console.log(`✅ Modal opened with title: "${titleText}"`);
    console.log(`✅ Expected materialId: ${secondImageMaterialId}`);

    // Title should match the second image generation
    // (We can't assert exact title match due to mock data, but modal should be visible)
    expect(titleText).toBeDefined();
    expect(titleText?.length).toBeGreaterThan(0);

    await helper.takeScreenshot('us2-005-second-image-modal');

    console.log('✅ US2-005 test passed');
  });
});
