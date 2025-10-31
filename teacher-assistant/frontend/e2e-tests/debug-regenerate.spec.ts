/**
 * DEBUG TEST: MaterialPreviewModal Regeneration
 *
 * Tests ONLY the regeneration flow with extensive logging
 */

import { test, expect, Page } from '@playwright/test';

// Helper function to setup test authentication
async function setupTestAuth(page: Page) {
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
    (window as any).__TEST_USER__ = {
      id: '38eb3d27-dd97-4ed4-9e80-08fafe18115f',
      email: 's.brill@eduhu.de',
    };
  });

  await page.addInitScript(() => {
    const testAuthData = {
      user: {
        id: '38eb3d27-dd97-4ed4-9e80-08fafe18115f',
        email: 's.brill@eduhu.de',
        refresh_token: 'test-refresh-token-playwright',
        created_at: Date.now(),
      },
      token: 'test-token-playwright',
      timestamp: Date.now(),
    };
    localStorage.setItem('instantdb-test-auth', JSON.stringify(testAuthData));
    localStorage.setItem('test-mode-active', 'true');
  });
}

test.describe('DEBUG: MaterialPreviewModal Regeneration', () => {
  test('Debug regenerate button click - assumes library has at least 1 image', async ({ page }) => {
    console.log('🐛 DEBUG TEST STARTED - USING EXISTING LIBRARY IMAGE');
    console.log('⚠️  PREREQUISITE: Run a full image generation first to have test data');

    // Capture ALL console logs from the browser
    page.on('console', msg => {
      const text = msg.text();
      console.log(`🌐 BROWSER: ${text}`);
    });

    // Setup auth and navigate
    await setupTestAuth(page);
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(3000);

    // Skip generation - just go to library
    console.log('📍 Navigating to library...');
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Materialien")');
    await page.waitForTimeout(1000);

    // Check if there are any materials
    console.log('📍 Checking for existing materials...');
    const materialCards = await page.$$('.cursor-pointer');
    console.log(`Found ${materialCards.length} material cards`);

    if (materialCards.length === 0) {
      console.log('❌ No materials in library - run a full test first to generate an image');
      throw new Error('No materials found - run full test first');
    }

    // Open modal
    console.log('📍 Opening material modal...');
    const materialCard = materialCards[0];
    await materialCard.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e-tests/screenshots/debug-01-modal-opened.png', fullPage: true });

    // Check if regenerate button exists
    console.log('📍 Looking for regenerate button...');
    const regenerateButton = await page.waitForSelector('[data-testid="regenerate-button"]', { timeout: 5000 });
    expect(regenerateButton).not.toBeNull();
    console.log('✅ Regenerate button found');

    // Click regenerate button
    console.log('📍 Clicking regenerate button...');
    await regenerateButton.click({ force: true });
    console.log('✅ Button clicked - watching for state changes...');

    // Check states at different intervals
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);

      const materialImageVisible = await page.$('[data-testid="material-image"]');
      const agentFormVisible = await page.$('textarea#description-input');

      console.log(`[${i * 500}ms] MaterialPreviewModal: ${materialImageVisible ? 'OPEN' : 'CLOSED'}, AgentFormView: ${agentFormVisible ? 'OPEN' : 'CLOSED'}`);

      if (!materialImageVisible && agentFormVisible) {
        console.log('✅ SUCCESS: MaterialPreviewModal closed AND AgentFormView opened!');
        const value = await agentFormVisible.inputValue();
        console.log('  Description value:', value);
        await page.screenshot({ path: 'e2e-tests/screenshots/debug-02-form-opened.png', fullPage: true });
        break;
      }

      if (i === 9) {
        console.log('❌ FAILED: After 5 seconds, expected state not reached');
        await page.screenshot({ path: 'e2e-tests/screenshots/debug-02-failed.png', fullPage: true });

        // Check what's on screen
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        console.log('📍 Page HTML contains "description-input"?', bodyHTML.includes('description-input'));

        // Check ion-modal states
        const modals = await page.$$('ion-modal');
        console.log('📍 Number of ion-modals on page:', modals.length);

        for (let j = 0; j < modals.length; j++) {
          const modal = modals[j];
          const isVisible = await modal.isVisible();
          const className = await modal.getAttribute('class');
          const isOpen = await modal.evaluate(el => (el as any).isOpen);
          console.log(`  Modal ${j}: visible=${isVisible}, isOpen=${isOpen}, class="${className}"`);
        }
      }
    }

    console.log('🐛 DEBUG TEST COMPLETE');
  });
});
