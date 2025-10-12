/**
 * Test script to verify permanent storage upload works
 * This tests the FileStorage.uploadImageFromUrl() method directly
 */

require('dotenv').config({ path: '../../.env' });

async function testPermanentStorage() {
  console.log('[TEST] Starting permanent storage test...');
  console.log('[TEST] INSTANTDB_APP_ID:', process.env.INSTANTDB_APP_ID?.substring(0, 8) + '...');
  console.log('[TEST] INSTANTDB_ADMIN_TOKEN:', process.env.INSTANTDB_ADMIN_TOKEN ? 'configured' : 'MISSING');
  console.log();

  // Import after env is loaded
  const instantdbModule = await import('./dist/services/instantdbService.js');
  const InstantDBService = instantdbModule.InstantDBService;

  // Initialize InstantDB
  console.log('[TEST] Initializing InstantDB...');
  const initialized = InstantDBService.initialize();
  if (!initialized) {
    console.error('[TEST] ❌ Failed to initialize InstantDB');
    process.exit(1);
  }
  console.log('[TEST] ✅ InstantDB initialized');
  console.log();

  // Test with a sample image from placeholder service
  const testImageUrl = 'https://via.placeholder.com/1024x1024.png';
  const testFilename = `test-image-${Date.now()}.png`;

  try {
    console.log('[TEST] Testing upload from URL...');
    console.log('[TEST] Source URL:', testImageUrl);
    console.log('[TEST] Filename:', testFilename);
    console.log();

    const startTime = Date.now();
    const permanentUrl = await InstantDBService.FileStorage.uploadImageFromUrl(testImageUrl, testFilename);
    const elapsed = Date.now() - startTime;

    console.log('[TEST] ✅ Upload successful!');
    console.log('[TEST] Permanent URL:', permanentUrl);
    console.log('[TEST] Upload time:', elapsed + 'ms');
    console.log();

    // Verify the URL format
    if (permanentUrl.includes('oaidalleapi') || permanentUrl.includes('blob.core.windows.net')) {
      console.log('[TEST] ⚠️  WARNING: URL looks like temporary DALL-E URL, not permanent storage!');
      console.log('[TEST] This means the upload failed and fallback was used.');
    } else if (permanentUrl.includes('instantdb') || permanentUrl.includes('storage')) {
      console.log('[TEST] ✅ URL format looks correct for InstantDB storage');
    } else {
      console.log('[TEST] ℹ️  URL format:', permanentUrl.substring(0, 60) + '...');
    }

    // Try to fetch the uploaded image to verify it's accessible
    console.log();
    console.log('[TEST] Verifying uploaded image is accessible...');
    const response = await fetch(permanentUrl);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log('[TEST] ✅ Image is accessible!');
      console.log('[TEST] Content-Type:', contentType);
      console.log('[TEST] Content-Length:', contentLength);
      console.log('[TEST] Status:', response.status);
    } else {
      console.log('[TEST] ❌ Image is NOT accessible');
      console.log('[TEST] Status:', response.status, response.statusText);

      if (response.status === 403) {
        console.log('[TEST] 403 Forbidden - Storage permissions not configured correctly');
      }
    }

  } catch (error) {
    console.error('[TEST] ❌ Upload failed:', error.message);
    console.error('[TEST] Error details:', error);
    process.exit(1);
  }
}

testPermanentStorage().catch(console.error);
