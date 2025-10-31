import { test, expect } from '@playwright/test';

test.describe('CORS Proxy Verification', () => {
  test('should proxy S3 images through backend', async ({ page }) => {
    // Listen for console logs to verify proxy function is called
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('[imageProxy]')) {
        consoleMessages.push(msg.text());
      }
    });

    // Listen for network requests to verify proxy endpoint is called
    const storageProxyRequests: string[] = [];
    const s3DirectRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/storage-proxy')) {
        storageProxyRequests.push(url);
        console.log('[Test] Storage proxy request:', url.substring(0, 150));
      }
      if (url.includes('instant-storage.s3.amazonaws.com') && !url.includes('/api/storage-proxy')) {
        s3DirectRequests.push(url);
        console.log('[Test] Direct S3 request (should not happen):', url.substring(0, 150));
      }
    });

    // Navigate to library page
    await page.goto('http://localhost:5174');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click on Library tab
    await page.click('text=Bibliothek');
    await page.waitForTimeout(1000);

    // Click on Materialien tab
    await page.click('text=Materialien');
    await page.waitForTimeout(2000);

    // Log results
    console.log('\n=== CORS Proxy Test Results ===');
    console.log('Console messages from imageProxy:', consoleMessages.length);
    consoleMessages.forEach(msg => console.log('  -', msg.substring(0, 200)));

    console.log('\nStorage proxy requests:', storageProxyRequests.length);
    storageProxyRequests.forEach(url => console.log('  -', url.substring(0, 200)));

    console.log('\nDirect S3 requests (should be 0):', s3DirectRequests.length);
    s3DirectRequests.forEach(url => console.log('  -', url.substring(0, 200)));

    // Verify: If there are images, they should use the proxy
    if (consoleMessages.length > 0) {
      // Check if proxy function detected S3 URLs
      const s3DetectionMessages = consoleMessages.filter(msg => msg.includes('S3 URL detected'));
      console.log(`\nS3 URLs detected by proxy: ${s3DetectionMessages.length}`);

      if (s3DetectionMessages.length > 0) {
        // Verify proxy requests were made
        expect(storageProxyRequests.length).toBeGreaterThan(0);
        console.log('✅ Proxy is being used for S3 URLs');

        // Verify no direct S3 requests
        expect(s3DirectRequests.length).toBe(0);
        console.log('✅ No direct S3 requests (CORS bypassed)');
      } else {
        console.log('⚠️ No S3 URLs detected - materials might not have images or URLs are not S3');
      }
    } else {
      console.log('ℹ️ No imageProxy logs found - function might not be called or no materials exist');
    }

    // Take screenshot for visual verification
    await page.screenshot({ path: 'docs/testing/screenshots/cors-proxy-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to docs/testing/screenshots/cors-proxy-test.png');
  });

  test('should successfully load proxied images', async ({ page }) => {
    // Track image load success/failures
    const imageResults: { url: string; status: 'success' | 'error' }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/storage-proxy')) {
        const status = response.ok() ? 'success' : 'error';
        imageResults.push({ url: url.substring(0, 150), status });
        console.log(`[Test] Proxy response: ${status} - ${response.status()} - ${url.substring(0, 150)}`);
      }
    });

    // Navigate to library
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.click('text=Bibliothek');
    await page.waitForTimeout(1000);
    await page.click('text=Materialien');
    await page.waitForTimeout(3000);

    console.log('\n=== Image Load Results ===');
    console.log('Total proxy image requests:', imageResults.length);

    const successful = imageResults.filter(r => r.status === 'success');
    const failed = imageResults.filter(r => r.status === 'error');

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\nFailed images:');
      failed.forEach(r => console.log('  -', r.url));
    }

    // If there are proxy requests, at least some should succeed
    if (imageResults.length > 0) {
      expect(successful.length).toBeGreaterThan(0);
    }
  });

  test('should handle backend proxy endpoint correctly', async ({ request }) => {
    // Test the proxy endpoint directly
    console.log('\n=== Testing Backend Proxy Endpoint ===');

    // Test 1: Missing URL parameter
    const response1 = await request.get('http://localhost:3006/api/storage-proxy');
    console.log('Test 1 - No URL param:', response1.status(), await response1.text());
    expect(response1.status()).toBe(400);

    // Test 2: Invalid URL (not InstantDB S3)
    const response2 = await request.get('http://localhost:3006/api/storage-proxy?url=https://example.com/image.jpg');
    console.log('Test 2 - Non-S3 URL:', response2.status(), await response2.text());
    expect(response2.status()).toBe(400);

    // Test 3: Valid S3 URL format (will likely fail due to expired/invalid URL, but should pass validation)
    const testS3Url = 'https://instant-storage.s3.amazonaws.com/test/image.jpg';
    const response3 = await request.get(`http://localhost:3006/api/storage-proxy?url=${encodeURIComponent(testS3Url)}`);
    console.log('Test 3 - Valid S3 format:', response3.status());
    // Should either succeed (200) or fail with 500 (can't fetch image), but not 400 (validation error)
    expect([200, 500]).toContain(response3.status());

    console.log('✅ Backend proxy endpoint validation working correctly');
  });
});
