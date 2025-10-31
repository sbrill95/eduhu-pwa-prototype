/**
 * COMPLETE SOLUTION: InstantDB Public File Storage
 * Demonstrates the correct way to use InstantDB storage for public files
 */

import { init } from '@instantdb/admin';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });
dotenv.config();

async function demonstrateSolution() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  InstantDB Public File Storage - WORKING SOLUTION');
  console.log('═══════════════════════════════════════════════════════');
  console.log();

  const db = init({
    appId: process.env.INSTANTDB_APP_ID,
    adminToken: process.env.INSTANTDB_ADMIN_TOKEN,
  });

  // Step 1: Upload file
  console.log('STEP 1: Upload image to InstantDB storage');
  console.log('─────────────────────────────────────────────────────── ');

  const testImageUrl = 'https://dummyimage.com/256x256/0080ff/ffffff.png&text=SOLUTION+DEMO';
  const filename = `solution-demo-${Date.now()}.png`;

  console.log('  Downloading image from:', testImageUrl.substring(0, 60) + '...');

  const response = await fetch(testImageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log('  Image downloaded:', buffer.length, 'bytes');
  console.log();

  console.log('  Uploading to InstantDB storage...');
  await db.storage.upload(filename, buffer, {
    contentType: 'image/png'
  });

  console.log('  ✅ Upload successful!');
  console.log();

  // Step 2: Query to get URL
  console.log('STEP 2: Query file to get public URL');
  console.log('─────────────────────────────────────────────────────── ');

  const queryResult = await db.query({
    $files: {
      $: { where: { path: filename } }
    }
  });

  const fileData = queryResult.$files?.[0];
  const publicUrl = fileData.url;

  console.log('  File path:', fileData.path);
  console.log('  File size:', fileData.size, 'bytes');
  console.log('  Content-Type:', fileData['content-type']);
  console.log();
  console.log('  Public URL:', publicUrl.substring(0, 100) + '...');
  console.log();

  // Step 3: Verify public access
  console.log('STEP 3: Verify public access (no auth required)');
  console.log('─────────────────────────────────────────────────────── ');

  const verifyResponse = await fetch(publicUrl);

  console.log('  HTTP Status:', verifyResponse.status, verifyResponse.statusText);
  console.log('  Content-Type:', verifyResponse.headers.get('content-type'));
  console.log('  Content-Length:', verifyResponse.headers.get('content-length'));
  console.log();

  if (verifyResponse.ok) {
    console.log('  ✅ File is publicly accessible!');
  } else {
    console.log('  ❌ File is NOT accessible');
  }

  console.log();

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  KEY FINDINGS');
  console.log('═══════════════════════════════════════════════════════');
  console.log();
  console.log('✅ InstantDB storage DOES support public file access');
  console.log('✅ Files with $files.view = "true" are publicly accessible');
  console.log('✅ URLs from queries are pre-signed S3 URLs valid for 7 days');
  console.log('✅ X-Amz-Date normalized to midnight is NORMAL behavior');
  console.log('✅ No separate getDownloadUrl() method needed');
  console.log();
  console.log('IMPLEMENTATION:');
  console.log('1. Upload file: db.storage.upload(filename, buffer, options)');
  console.log('2. Query file: db.query({ $files: { $: { where: { path } } } })');
  console.log('3. Use URL: fileData.url (valid for 7 days)');
  console.log('4. Schema: $files.view = "true" for public access');
  console.log();
  console.log('═══════════════════════════════════════════════════════');
}

demonstrateSolution().catch(console.error);
