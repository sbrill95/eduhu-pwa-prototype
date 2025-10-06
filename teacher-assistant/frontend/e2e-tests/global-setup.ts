import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Prepares the testing environment and performs initial system checks
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Teacher Assistant E2E Test Suite');
  console.log('📋 Test Configuration:');
  console.log(`   - Base URL: ${config.projects[0].use.baseURL}`);
  console.log(`   - Workers: ${config.workers}`);
  console.log(`   - Retries: ${config.retries}`);
  console.log(`   - Timeout: ${config.timeout}ms`);

  // Optional: Pre-test system validation
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Verify the application is accessible
    console.log('🔍 Verifying application accessibility...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5173');
    await page.waitForTimeout(2000);

    console.log('✅ Application is accessible');
    console.log('🧪 Test environment ready');
  } catch (error) {
    console.error('❌ Application accessibility check failed:', error);
    throw new Error(`Pre-test validation failed: ${error}`);
  } finally {
    await browser.close();
  }

  // Log performance baseline
  console.log('📊 Performance monitoring enabled');
  console.log('📹 Video recording configured for failures');
  console.log('📸 Screenshot capture enabled');
  console.log('🔊 Console debugging active');
}

export default globalSetup;