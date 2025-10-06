/**
 * Global teardown for E2E tests
 * Cleanup and final reporting
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  console.log('📊 Test suite completed');
  console.log('📝 Check playwright-report/index.html for detailed results');
  console.log('🎬 Video recordings available in test-results/videos/');
  console.log('📸 Screenshots available in test-results/');
}

export default globalTeardown;