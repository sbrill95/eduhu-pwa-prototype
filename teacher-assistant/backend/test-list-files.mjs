/**
 * List all files in InstantDB storage
 */

import { init } from '@instantdb/admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });
dotenv.config();

async function listFiles() {
  console.log('[LIST-FILES] Listing all files in InstantDB storage...');
  console.log();

  // Initialize InstantDB with Admin SDK
  const db = init({
    appId: process.env.INSTANTDB_APP_ID,
    adminToken: process.env.INSTANTDB_ADMIN_TOKEN,
  });

  try {
    // Query all files
    const queryResult = await db.query({
      $files: {}
    });

    const files = queryResult.$files || [];

    console.log('[LIST-FILES] Total files found:', files.length);
    console.log();

    files.forEach((file, index) => {
      console.log(`[LIST-FILES] File #${index + 1}:`);
      console.log('  Path:', file.path);
      console.log('  Size:', file.size, 'bytes');
      console.log('  Content-Type:', file['content-type']);
      console.log('  URL:', file.url.substring(0, 100) + '...');
      console.log();
    });

  } catch (error) {
    console.error('[LIST-FILES] ❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

listFiles().catch(console.error);
