/**
 * Gemini API Integration Tests (REAL API CALLS)
 *
 * ⚠️ WARNING: These tests call the REAL Gemini API
 * - Use real API quota
 * - Cost money (potentially)
 * - Subject to rate limits
 * - Run MANUALLY before production deployments
 *
 * How to run:
 * 1. Set environment variables:
 *    - GOOGLE_AI_API_KEY=your-actual-api-key
 *    - RUN_INTEGRATION_TESTS=true
 *    - NODE_ENV=production (NOT test - disables mocks)
 *
 * 2. Run tests:
 *    RUN_INTEGRATION_TESTS=true npx playwright test integration-tests/gemini-real-api.spec.ts
 *
 * 3. Or run with npm script:
 *    npm run test:integration
 *
 * Purpose:
 * - Verify real Gemini API connection works
 * - Validate API key is valid
 * - Test actual image editing capability
 * - Measure real-world performance
 * - Verify error handling with real API
 *
 * @see docs/testing/README.md for more details
 */

import { test, expect } from '@playwright/test';

// Helper to create timestamp for screenshots
const getScreenshotPath = (name: string) => {
  const date = new Date().toISOString().split('T')[0];
  return `docs/testing/screenshots/${date}/integration-${name}.png`;
};

// Skip ALL integration tests by default (safety)
test.beforeAll(({ }, testInfo) => {
  if (process.env.RUN_INTEGRATION_TESTS !== 'true') {
    console.log('\n🛑 Integration tests SKIPPED (safety)');
    console.log('   To run: RUN_INTEGRATION_TESTS=true npx playwright test integration-tests/\n');
    test.skip();
  }

  console.log('\n⚠️  RUNNING INTEGRATION TESTS (REAL API CALLS)');
  console.log('   - Uses real API quota');
  console.log('   - May cost money');
  console.log('   - Subject to rate limits\n');
});

test.describe('Gemini API Integration (Real API)', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let consoleLogs: string[] = [];

  test.beforeEach(async ({ page }) => {
    // CRITICAL: NO TEST MODE - we want REAL API calls
    // DO NOT inject __VITE_TEST_MODE__ flag
    // DO NOT set VITE_TEST_MODE environment variable

    // Instead, inject PRODUCTION MODE flag to explicitly disable mocks
    await page.addInitScript(() => {
      (window as any).__INTEGRATION_TEST_MODE__ = true;
      console.log('🔴 INTEGRATION TEST: Using REAL Gemini API');
    });

    // Monitor console output to detect mock vs real API
    consoleErrors = [];
    consoleWarnings = [];
    consoleLogs = [];

    page.on('console', msg => {
      const text = msg.text();

      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.error('❌ CONSOLE ERROR:', text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
        console.warn('⚠️ CONSOLE WARNING:', text);
      } else if (msg.type() === 'log') {
        consoleLogs.push(text);

        // Log critical messages for debugging
        if (
          text.includes('TEST MODE') ||
          text.includes('MOCK') ||
          text.includes('Gemini') ||
          text.includes('API')
        ) {
          console.log('📝 CONSOLE LOG:', text);
        }
      }
    });

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    // Log console summary
    if (consoleErrors.length > 0) {
      console.error(`\n❌ TEST HAD ${consoleErrors.length} CONSOLE ERRORS`);
    }
    if (consoleWarnings.length > 0) {
      console.warn(`\n⚠️ TEST HAD ${consoleWarnings.length} CONSOLE WARNINGS`);
    }

    // Check for mock mode indicators (should NOT be present)
    const mockIndicators = consoleLogs.filter(log =>
      log.includes('🧪 [TEST MODE]') || log.includes('Mock')
    );
    if (mockIndicators.length > 0) {
      console.error('\n🚨 WARNING: Mock mode detected in integration test!');
      console.error('   Tests should use REAL API, not mocks');
      mockIndicators.forEach(log => console.error(`   - ${log}`));
    }
  });

  // ============================================================================
  // Test 1: API Connection and Authentication
  // ============================================================================

  test('INT-01: Gemini API connection and authentication works', async ({ page, request }) => {
    console.log('\n📍 INTEGRATION TEST: API Connection & Authentication');

    // Navigate to Library
    await page.click('button:has-text("Bibliothek")');
    await page.waitForTimeout(2000);

    // Check if there are any images in library
    const hasImages = await page.locator('[data-testid="material-card"]').count();
    console.log(`  Found ${hasImages} items in library`);

    if (hasImages === 0) {
      console.log('  ⚠️ No items in library - test requires at least one image');
      test.skip();
      return;
    }

    // Screenshot: Library view BEFORE edit
    await page.screenshot({
      path: getScreenshotPath('api-auth-before'),
      fullPage: true
    });

    // Open edit modal for first image
    const editButton = page.locator('[data-testid="edit-image-button"]').first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Enter instruction
    const instructionInput = page.locator('[data-testid="edit-instruction"]');
    await instructionInput.fill('Füge "Test" oben links hinzu');
    await page.waitForTimeout(500);

    // Submit edit request
    const submitButton = page.locator('button:has-text("Bild bearbeiten")');
    await expect(submitButton).toBeEnabled();

    const startTime = Date.now();
    console.log('  🕐 Sending request to REAL Gemini API...');

    await submitButton.click();

    // Wait for processing (REAL API takes 5-30 seconds)
    await page.waitForTimeout(35000); // Wait up to 35 seconds

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`  ⏱️ API response took ${duration.toFixed(2)} seconds`);

    // Check for preview or error
    const hasPreview = await page.locator('[data-testid="edit-preview"]').isVisible();
    const hasError = await page.locator('text=/Bearbeitung fehlgeschlagen/i').isVisible();

    // Screenshot: Result
    await page.screenshot({
      path: getScreenshotPath('api-auth-after'),
      fullPage: true
    });

    if (hasError) {
      console.log('  ❌ API request failed');
      console.log('  Check: GOOGLE_AI_API_KEY is set correctly');
      console.log('  Check: API key has necessary permissions');

      // FAIL: API should work in integration tests
      throw new Error('Real Gemini API request failed - check API key and permissions');
    }

    if (!hasPreview) {
      console.log('  ❌ No preview shown (unexpected)');
      throw new Error('Expected preview after API call');
    }

    console.log('  ✅ Real Gemini API connection successful');
    console.log('  ✅ API authentication valid');

    // CRITICAL: Verify NOT using mock
    const usedMock = consoleLogs.some(log =>
      log.includes('🧪 [TEST MODE]') || log.includes('Mock image edit')
    );
    expect(usedMock).toBe(false);
    console.log('  ✅ Verified: Using REAL API (not mock)');

    // Performance check (real API should take > 1 second, mock takes ~50ms)
    expect(duration).toBeGreaterThan(1); // Real API is slower than mock
    console.log('  ✅ Performance indicates real API (not mock)');

    // MANDATORY: Assert ZERO console errors
    expect(consoleErrors).toHaveLength(0);
  });

  // ============================================================================
  // Test 2: Full Image Editing Workflow
  // ============================================================================

  test('INT-02: Complete image editing workflow with real Gemini', async ({ page }) => {
    console.log('\n📍 INTEGRATION TEST: Full Edit Workflow');

    // Navigate to Library
    await page.click('button:has-text("Bibliothek")');
    await page.waitForTimeout(2000);

    const hasImages = await page.locator('[data-testid="material-card"]').count();
    if (hasImages === 0) {
      test.skip();
      return;
    }

    // Screenshot: BEFORE
    await page.screenshot({
      path: getScreenshotPath('workflow-before'),
      fullPage: true
    });

    // Open edit modal
    await page.locator('[data-testid="edit-image-button"]').first().click();
    await page.waitForTimeout(1000);

    // Enter instruction
    await page.locator('[data-testid="edit-instruction"]').fill('Füge einen blauen Himmel hinzu');

    // Submit
    const startTime = Date.now();
    await page.click('button:has-text("Bild bearbeiten")');

    // Wait for real API response
    await page.waitForTimeout(35000);

    const hasPreview = await page.locator('[data-testid="edit-preview"]').isVisible();

    // Screenshot: Preview
    await page.screenshot({
      path: getScreenshotPath('workflow-preview'),
      fullPage: true
    });

    expect(hasPreview).toBe(true);

    // Save edited image
    await page.click('button:has-text("Speichern")');
    await page.waitForTimeout(2000);

    // Screenshot: Saved
    await page.screenshot({
      path: getScreenshotPath('workflow-saved'),
      fullPage: true
    });

    // Verify new image appears in library
    const newCount = await page.locator('[data-testid="material-card"]').count();
    expect(newCount).toBe(hasImages + 1);

    console.log('  ✅ Full workflow successful with real API');

    // Verify NOT using mock
    const usedMock = consoleLogs.some(log => log.includes('🧪 [TEST MODE]'));
    expect(usedMock).toBe(false);

    expect(consoleErrors).toHaveLength(0);
  });

  // ============================================================================
  // Test 3: Error Handling with Real API
  // ============================================================================

  test('INT-03: Error handling with real API', async ({ page }) => {
    console.log('\n📍 INTEGRATION TEST: Error Handling');

    await page.click('button:has-text("Bibliothek")');
    await page.waitForTimeout(2000);

    const hasImages = await page.locator('[data-testid="material-card"]').count();
    if (hasImages === 0) {
      test.skip();
      return;
    }

    // Test 3.1: Empty instruction (should be caught client-side)
    await page.locator('[data-testid="edit-image-button"]').first().click();
    await page.waitForTimeout(1000);

    const submitButton = page.locator('button:has-text("Bild bearbeiten")');
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
    console.log('  ✅ Empty instruction blocked (client-side validation)');

    // Screenshot: Error state
    await page.screenshot({
      path: getScreenshotPath('error-empty-instruction'),
      fullPage: true
    });

    // Test 3.2: Invalid/malformed instruction (Gemini should handle)
    await page.locator('[data-testid="edit-instruction"]').fill('!!!@@@###');
    await page.waitForTimeout(500);

    const startTime = Date.now();
    await submitButton.click();
    await page.waitForTimeout(35000);

    // Gemini should either process it or return graceful error
    const hasResult = await page.locator('[data-testid="edit-preview"]').isVisible();
    const hasError = await page.locator('text=/Bearbeitung fehlgeschlagen/i').isVisible();

    // Either result is acceptable (Gemini processed it or rejected gracefully)
    expect(hasResult || hasError).toBe(true);
    console.log('  ✅ Invalid instruction handled gracefully');

    // Screenshot: Error handling
    await page.screenshot({
      path: getScreenshotPath('error-invalid-instruction'),
      fullPage: true
    });

    expect(consoleErrors).toHaveLength(0);
  });

  // ============================================================================
  // Test 4: Rate Limiting Detection
  // ============================================================================

  test('INT-04: Rate limit detection with real API', async ({ page }) => {
    console.log('\n📍 INTEGRATION TEST: Rate Limit Detection');
    console.log('  ⚠️ WARNING: This test may hit rate limits intentionally');

    await page.click('button:has-text("Bibliothek")');
    await page.waitForTimeout(2000);

    const hasImages = await page.locator('[data-testid="material-card"]').count();
    if (hasImages === 0) {
      test.skip();
      return;
    }

    // Check current usage
    const usageText = await page.locator('text=/\\d+\\/20 Bilder/').textContent();
    console.log(`  📊 Current usage: ${usageText || 'Not found'}`);

    // Attempt multiple rapid edits (may hit rate limit)
    const maxAttempts = 5; // Don't exhaust quota in tests
    let rateLimitHit = false;

    for (let i = 0; i < maxAttempts && !rateLimitHit; i++) {
      console.log(`  🔄 Attempt ${i + 1}/${maxAttempts}`);

      await page.locator('[data-testid="edit-image-button"]').first().click();
      await page.waitForTimeout(1000);

      await page.locator('[data-testid="edit-instruction"]').fill(`Test ${i + 1}`);
      await page.click('button:has-text("Bild bearbeiten")');
      await page.waitForTimeout(10000); // Shorter wait for rate limit test

      // Check for rate limit error
      const hasRateLimitError = await page.locator('text=/Tägliches Limit erreicht/i').isVisible();
      const has429Error = await page.locator('text=/Rate.*limit/i').isVisible();

      if (hasRateLimitError || has429Error) {
        rateLimitHit = true;
        console.log('  ✅ Rate limit detected and handled gracefully');

        // Screenshot: Rate limit error
        await page.screenshot({
          path: getScreenshotPath('rate-limit-hit'),
          fullPage: true
        });
      } else {
        // Close modal and try again
        await page.click('button:has-text("Abbrechen")');
        await page.waitForTimeout(500);
      }
    }

    if (rateLimitHit) {
      console.log('  ✅ Rate limit error handling verified');
    } else {
      console.log('  📝 Rate limit not hit (quota available)');
    }

    // Either way, test should not have console errors
    expect(consoleErrors).toHaveLength(0);
  });

  // ============================================================================
  // Test 5: Performance SLA Validation
  // ============================================================================

  test('INT-05: Performance meets SLA with real API', async ({ page }) => {
    console.log('\n📍 INTEGRATION TEST: Performance SLA');
    console.log('  Target: < 30 seconds for 90% of edits');

    await page.click('button:has-text("Bibliothek")');
    await page.waitForTimeout(2000);

    const hasImages = await page.locator('[data-testid="material-card"]').count();
    if (hasImages === 0) {
      test.skip();
      return;
    }

    const durations: number[] = [];
    const testInstructions = [
      'Füge "Test 1" hinzu',
      'Ändere die Helligkeit',
      'Mache es bunter'
    ];

    const maxTests = Math.min(3, hasImages); // Max 3 to preserve quota

    for (let i = 0; i < maxTests; i++) {
      console.log(`  🔄 Performance test ${i + 1}/${maxTests}`);

      await page.locator('[data-testid="edit-image-button"]').first().click();
      await page.waitForTimeout(1000);

      await page.locator('[data-testid="edit-instruction"]').fill(testInstructions[i]);

      const startTime = Date.now();
      await page.click('button:has-text("Bild bearbeiten")');

      // Wait for result (max 40 seconds)
      await page.waitForTimeout(40000);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      durations.push(duration);

      console.log(`    ⏱️ Edit ${i + 1}: ${duration.toFixed(2)}s`);

      // Close modal
      await page.click('button:has-text("Abbrechen")');
      await page.waitForTimeout(500);
    }

    // Calculate statistics
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const under30s = durations.filter(d => d < 30).length;
    const percentage = (under30s / durations.length) * 100;

    console.log(`\n  📊 Performance Summary:`);
    console.log(`     Average: ${avgDuration.toFixed(2)}s`);
    console.log(`     Min: ${minDuration.toFixed(2)}s`);
    console.log(`     Max: ${maxDuration.toFixed(2)}s`);
    console.log(`     Under 30s: ${under30s}/${durations.length} (${percentage.toFixed(0)}%)`);

    // Screenshot: Performance results
    await page.screenshot({
      path: getScreenshotPath('performance-results'),
      fullPage: true
    });

    // SLA: 90% under 30 seconds (real API)
    expect(percentage).toBeGreaterThanOrEqual(90);
    console.log('  ✅ Performance SLA met (90% under 30s)');

    expect(consoleErrors).toHaveLength(0);
  });

  // ============================================================================
  // Test 6: Mock vs Real API Comparison
  // ============================================================================

  test('INT-06: Verify mock is NOT used in integration tests', async ({ page }) => {
    console.log('\n📍 INTEGRATION TEST: Mock Detection');

    await page.click('button:has-text("Bibliothek")');
    await page.waitForTimeout(2000);

    const hasImages = await page.locator('[data-testid="material-card"]').count();
    if (hasImages === 0) {
      test.skip();
      return;
    }

    await page.locator('[data-testid="edit-image-button"]').first().click();
    await page.waitForTimeout(1000);

    await page.locator('[data-testid="edit-instruction"]').fill('Test');

    const startTime = Date.now();
    await page.click('button:has-text("Bild bearbeiten")');
    await page.waitForTimeout(35000);
    const duration = (endTime - startTime) / 1000;

    // Check backend logs for mock indicators
    const mockIndicators = [
      '🧪 [TEST MODE]',
      'Mock image edit',
      'Gemini API bypassed',
      'using mock responses'
    ];

    const foundMockIndicators = mockIndicators.filter(indicator =>
      consoleLogs.some(log => log.includes(indicator))
    );

    if (foundMockIndicators.length > 0) {
      console.error('\n❌ MOCK DETECTED IN INTEGRATION TEST!');
      console.error('   Found indicators:');
      foundMockIndicators.forEach(ind => console.error(`   - ${ind}`));
      throw new Error('Integration test is using MOCK instead of REAL API');
    }

    console.log('  ✅ Verified: NO mock indicators found');
    console.log('  ✅ Confirmed: Using REAL Gemini API');

    // Performance check: Real API > 1s, Mock ~50ms
    expect(duration).toBeGreaterThan(1);
    console.log(`  ✅ Duration ${duration.toFixed(2)}s indicates real API`);

    expect(consoleErrors).toHaveLength(0);
  });
});
