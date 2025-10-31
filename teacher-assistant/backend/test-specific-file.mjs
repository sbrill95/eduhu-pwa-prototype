import { init } from '@instantdb/admin';

const APP_ID = '39f14e13-9afb-4222-be45-3d2c231be3a1';
const ADMIN_TOKEN = '578e3067-824b-4c49-8fed-6672e41de88e';

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

// Query for the specific file we uploaded earlier
console.log('[TEST] Querying for file: 9fb657ca-869f-4090-bd7c-1399ce5e97c0');

const result = await db.query({
  $files: {
    $: {
      where: { id: '9fb657ca-869f-4090-bd7c-1399ce5e97c0' }
    }
  }
});

if (result.$files && result.$files.length > 0) {
  const file = result.$files[0];
  console.log('\n[TEST] File found:');
  console.log('  Path:', file.path);
  console.log('  Size:', file.size, 'bytes');
  console.log('  URL:', file.url);

  console.log('\n[TEST] Testing URL accessibility...');
  const response = await fetch(file.url, { method: 'HEAD' });
  console.log('[TEST] HTTP Status:', response.status, response.statusText);

  if (response.ok) {
    console.log('[TEST] ✅ URL is accessible!');
  } else {
    console.log('[TEST] ❌ URL returned', response.status);
    console.log('[TEST] This is the FRESH URL from query, should work if permissions correct');
  }
} else {
  console.log('[TEST] ❌ File not found with that ID');

  // Try listing all files to find it
  console.log('\n[TEST] Listing all files to find the right ID...');
  const allFiles = await db.query({ $files: {} });
  console.log('[TEST] Total files:', allFiles.$files?.length || 0);

  const pythagoras = allFiles.$files?.find(f => f.path?.includes('9fb657ca'));
  if (pythagoras) {
    console.log('\n[TEST] Found file by path search:');
    console.log('  ID:', pythagoras.id);
    console.log('  Path:', pythagoras.path);
    console.log('  URL:', pythagoras.url.substring(0, 80) + '...');

    const testResponse = await fetch(pythagoras.url, { method: 'HEAD' });
    console.log('\n[TEST] Testing URL: ', testResponse.status, testResponse.statusText);
  }
}
