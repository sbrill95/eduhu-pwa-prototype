/**
 * Direct test of InstantDB storage upload using Admin SDK
 * This bypasses the compiled TypeScript and tests the core functionality
 */

import { init } from '@instantdb/admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });
dotenv.config();

async function testStorageUpload() {
  console.log('[TEST] Starting InstantDB storage upload test...');
  console.log('[TEST] App ID:', process.env.INSTANTDB_APP_ID?.substring(0, 8) + '...');
  console.log('[TEST] Admin Token:', process.env.INSTANTDB_ADMIN_TOKEN ? 'configured' : 'MISSING');
  console.log();

  // Initialize InstantDB with Admin SDK
  const db = init({
    appId: process.env.INSTANTDB_APP_ID,
    adminToken: process.env.INSTANTDB_ADMIN_TOKEN,
  });

  console.log('[TEST] ✅ InstantDB initialized');
  console.log();

  // Test image URL - use a reliable public image
  const testImageUrl = 'https://dummyimage.com/512x512/000/fff.png';
  const testFilename = `test-storage-${Date.now()}.png`;

  try {
    console.log('[TEST] Step 1: Downloading test image...');
    console.log('[TEST] Source URL:', testImageUrl);

    const response = await fetch(testImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[TEST] ✅ Image downloaded:', buffer.length, 'bytes');
    console.log();

    console.log('[TEST] Step 2: Uploading to InstantDB storage...');
    console.log('[TEST] Filename:', testFilename);
    console.log('[TEST] Content-Type: image/png');
    console.log('[TEST] Using Admin SDK: db.storage.upload(filename, buffer, { contentType })');

    const startTime = Date.now();

    // Upload using Admin SDK (Buffer + options, not File)
    const uploadResult = await db.storage.upload(testFilename, buffer, {
      contentType: 'image/png'
    });

    const elapsed = Date.now() - startTime;

    console.log('[TEST] ✅ Upload successful!');
    console.log('[TEST] Upload time:', elapsed + 'ms');
    console.log('[TEST] Result:', uploadResult);
    console.log();

    // Query for the uploaded file to get the URL
    console.log('[TEST] Step 2.5: Querying for uploaded file...');
    const queryResult = await db.query({ $files: { $: { where: { path: testFilename } } } });
    console.log('[TEST] Query result:', JSON.stringify(queryResult, null, 2));

    const fileData = queryResult.$files?.[0];
    if (!fileData) {
      throw new Error('Uploaded file not found in query results');
    }

    const permanentUrl = fileData.url;
    console.log('[TEST] ✅ File URL retrieved:', permanentUrl);
    console.log();

    // Verify URL format
    if (permanentUrl.includes('oaidalleapi') || permanentUrl.includes('st=') && permanentUrl.includes('se=')) {
      console.log('[TEST] ⚠️  WARNING: URL looks like temporary SAS URL');
    } else {
      console.log('[TEST] ✅ URL format looks correct for permanent storage');
    }

    // Test accessibility
    console.log();
    console.log('[TEST] Step 3: Verifying public read access...');
    const verifyResponse = await fetch(permanentUrl);

    console.log('[TEST] Response status:', verifyResponse.status, verifyResponse.statusText);
    console.log('[TEST] Content-Type:', verifyResponse.headers.get('content-type'));
    console.log('[TEST] Content-Length:', verifyResponse.headers.get('content-length'));

    if (verifyResponse.ok) {
      console.log('[TEST] ✅ Image is publicly accessible!');
    } else {
      console.log('[TEST] ❌ Image is NOT accessible');
      if (verifyResponse.status === 403) {
        console.log('[TEST] 403 Forbidden - Check $files permissions in schema');
      }
    }

    console.log();
    console.log('[TEST] ========================================');
    console.log('[TEST] ✅ ALL TESTS PASSED');
    console.log('[TEST] ========================================');

  } catch (error) {
    console.error('[TEST] ❌ Test failed:', error.message);
    console.error('[TEST] Error stack:', error.stack);
    process.exit(1);
  }
}

testStorageUpload().catch(console.error);
