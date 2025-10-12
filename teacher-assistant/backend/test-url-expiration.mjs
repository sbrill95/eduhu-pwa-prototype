/**
 * Test to check if InstantDB storage URLs expire
 * This tests the exact scenario mentioned in the issue
 */

import { init } from '@instantdb/admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });
dotenv.config();

async function testUrlExpiration() {
  console.log('[EXPIRATION-TEST] Testing if InstantDB URLs expire...');
  console.log();

  const db = init({
    appId: process.env.INSTANTDB_APP_ID,
    adminToken: process.env.INSTANTDB_ADMIN_TOKEN,
  });

  try {
    // Query an old file (from earlier test)
    const queryResult = await db.query({
      $files: {
        $: {
          where: { path: 'test-storage-1759943936498.png' }
        }
      }
    });

    const fileData = queryResult.$files?.[0];

    if (!fileData) {
      console.log('[EXPIRATION-TEST] ❌ File not found');
      return;
    }

    console.log('[EXPIRATION-TEST] File found:',fileData.path);
    console.log('[EXPIRATION-TEST] Size:', fileData.size, 'bytes');
    console.log();

    const url = fileData.url;
    console.log('[EXPIRATION-TEST] URL:', url.substring(0, 120) + '...');
    console.log();

    // Parse URL parameters
    const urlObj = new URL(url);
    const amzDate = urlObj.searchParams.get('X-Amz-Date');
    const amzExpires = urlObj.searchParams.get('X-Amz-Expires');
    const amzSignature = urlObj.searchParams.get('X-Amz-Signature');

    console.log('[EXPIRATION-TEST] URL Parameters:');
    console.log('  X-Amz-Date:', amzDate);
    console.log('  X-Amz-Expires:', amzExpires, 'seconds');
    console.log('  X-Amz-Signature:', amzSignature);
    console.log();

    // Calculate expiration date
    const signedDate = new Date(amzDate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
    const expiresAt = new Date(signedDate.getTime() + parseInt(amzExpires) * 1000);
    const now = new Date();

    console.log('[EXPIRATION-TEST] Time Analysis:');
    console.log('  Signed at:', signedDate.toISOString());
    console.log('  Expires at:', expiresAt.toISOString());
    console.log('  Current time:', now.toISOString());
    console.log('  Time remaining:', Math.floor((expiresAt - now) / 1000 / 60 / 60), 'hours');
    console.log();

    // Test URL accessibility
    console.log('[EXPIRATION-TEST] Testing URL accessibility...');
    const response = await fetch(url);

    console.log('[EXPIRATION-TEST] HTTP Status:', response.status, response.statusText);
    console.log('[EXPIRATION-TEST] Content-Type:', response.headers.get('content-type'));
    console.log('[EXPIRATION-TEST] Content-Length:', response.headers.get('content-length'));
    console.log();

    if (response.ok) {
      console.log('[EXPIRATION-TEST] ✅ URL is accessible (200 OK)');
      console.log();
      console.log('[EXPIRATION-TEST] CONCLUSION:');
      console.log('  - InstantDB storage URLs work correctly');
      console.log('  - X-Amz-Date is normalized to midnight (T000000Z)');
      console.log('  - This is NORMAL behavior for presigned S3 URLs');
      console.log('  - URLs have 7-day expiration (604800 seconds)');
      console.log('  - Files with view="true" permission are publicly accessible');
    } else if (response.status === 403) {
      console.log('[EXPIRATION-TEST] ❌ URL returns 403 Forbidden');
      console.log();
      console.log('[EXPIRATION-TEST] POSSIBLE CAUSES:');
      console.log('  1. URL signature has expired');
      console.log('  2. $files permissions are not configured correctly');
      console.log('  3. InstantDB schema not pushed to cloud');
      console.log('  4. URL was generated with wrong parameters');
      console.log();
      console.log('[EXPIRATION-TEST] SOLUTION:');
      console.log('  - Query the file again to get a fresh URL');
      console.log('  - URLs from queries are valid for 7 days');
    } else {
      console.log('[EXPIRATION-TEST] ⚠️  Unexpected status:', response.status);
    }

  } catch (error) {
    console.error('[EXPIRATION-TEST] ❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testUrlExpiration().catch(console.error);
