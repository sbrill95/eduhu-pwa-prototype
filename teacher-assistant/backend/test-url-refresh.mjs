/**
 * Test to investigate InstantDB storage URL behavior
 * Tests whether querying the same file multiple times generates different URLs
 */

import { init } from '@instantdb/admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });
dotenv.config();

async function testUrlBehavior() {
  console.log('[URL-TEST] Starting InstantDB URL behavior test...');
  console.log('[URL-TEST] App ID:', process.env.INSTANTDB_APP_ID?.substring(0, 8) + '...');
  console.log();

  // Initialize InstantDB with Admin SDK
  const db = init({
    appId: process.env.INSTANTDB_APP_ID,
    adminToken: process.env.INSTANTDB_ADMIN_TOKEN,
  });

  console.log('[URL-TEST] ✅ InstantDB initialized');
  console.log();

  // Use an existing test file
  const existingFilename = 'test-storage-1759948561264.png';

  try {
    console.log('[URL-TEST] Testing URL behavior for existing file:', existingFilename);
    console.log();

    // Query the file 3 times with delays
    for (let i = 1; i <= 3; i++) {
      console.log(`[URL-TEST] Query #${i}:`);

      const queryResult = await db.query({
        $files: {
          $: { where: { path: existingFilename } }
        }
      });

      const fileData = queryResult.$files?.[0];

      if (!fileData) {
        console.log('[URL-TEST] ❌ File not found in database');
        break;
      }

      const url = fileData.url;
      console.log('[URL-TEST] URL:', url.substring(0, 100) + '...');

      // Extract URL parameters
      const urlObj = new URL(url);
      const amzDate = urlObj.searchParams.get('X-Amz-Date');
      const amzExpires = urlObj.searchParams.get('X-Amz-Expires');
      const amzSignature = urlObj.searchParams.get('X-Amz-Signature');

      console.log('[URL-TEST] X-Amz-Date:', amzDate);
      console.log('[URL-TEST] X-Amz-Expires:', amzExpires, 'seconds (', parseInt(amzExpires) / 3600 / 24, 'days)');
      console.log('[URL-TEST] X-Amz-Signature:', amzSignature?.substring(0, 16) + '...');

      // Test URL accessibility
      const verifyResponse = await fetch(url);
      console.log('[URL-TEST] HTTP Status:', verifyResponse.status, verifyResponse.statusText);

      console.log();

      if (i < 3) {
        console.log('[URL-TEST] Waiting 2 seconds before next query...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('[URL-TEST] ========================================');
    console.log('[URL-TEST] Observations:');
    console.log('[URL-TEST] 1. Check if X-Amz-Date changes between queries');
    console.log('[URL-TEST] 2. Check if X-Amz-Signature changes between queries');
    console.log('[URL-TEST] 3. Check if URLs remain accessible');
    console.log('[URL-TEST] 4. Note: X-Amz-Date normalized to midnight (T000000Z)');
    console.log('[URL-TEST] ========================================');

    // Now test if we can get a fresh URL by re-uploading
    console.log();
    console.log('[URL-TEST] Testing re-upload scenario...');

    // Get the last queried file data
    const lastQueryResult = await db.query({
      $files: {
        $: { where: { path: existingFilename } }
      }
    });
    const lastFileData = lastQueryResult.$files?.[0];

    // Download the existing file
    const downloadResponse = await fetch(lastFileData.url);
    if (downloadResponse.ok) {
      const arrayBuffer = await downloadResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log('[URL-TEST] Downloaded existing file:', buffer.length, 'bytes');

      // Upload with a new name
      const newFilename = `test-reupload-${Date.now()}.png`;
      await db.storage.upload(newFilename, buffer, {
        contentType: 'image/png'
      });

      console.log('[URL-TEST] Re-uploaded as:', newFilename);

      // Query the new file
      const newQueryResult = await db.query({
        $files: {
          $: { where: { path: newFilename } }
        }
      });

      const newFileData = newQueryResult.$files?.[0];
      const newUrl = newFileData.url;

      console.log('[URL-TEST] New URL:', newUrl.substring(0, 100) + '...');

      const newUrlObj = new URL(newUrl);
      const newAmzDate = newUrlObj.searchParams.get('X-Amz-Date');
      const newAmzSignature = newUrlObj.searchParams.get('X-Amz-Signature');

      console.log('[URL-TEST] New X-Amz-Date:', newAmzDate);
      console.log('[URL-TEST] New X-Amz-Signature:', newAmzSignature?.substring(0, 16) + '...');

      // Test new URL accessibility
      const newVerifyResponse = await fetch(newUrl);
      console.log('[URL-TEST] New URL HTTP Status:', newVerifyResponse.status, newVerifyResponse.statusText);
    }

    console.log();
    console.log('[URL-TEST] ========================================');
    console.log('[URL-TEST] ✅ TEST COMPLETE');
    console.log('[URL-TEST] ========================================');

  } catch (error) {
    console.error('[URL-TEST] ❌ Test failed:', error.message);
    console.error('[URL-TEST] Error stack:', error.stack);
    process.exit(1);
  }
}

testUrlBehavior().catch(console.error);
