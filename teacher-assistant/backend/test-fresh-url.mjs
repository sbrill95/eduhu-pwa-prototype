import { init } from '@instantdb/admin';

const APP_ID = '39f14e13-9afb-4222-be45-3d2c231be3a1';
const ADMIN_TOKEN = '578e3067-824b-4c49-8fed-6672e41de88e';

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

// Query for the file we just uploaded
const filename = 'image-9fb657ca-869f-4090-bd7c-1399ce5e97c0.png';

console.log('[TEST] Querying for file:', filename);

const result = await db.query({
  $files: {
    $: {
      where: { path: filename }
    }
  }
});

console.log('[TEST] Query result:', JSON.stringify(result, null, 2));

const file = result.$files?.[0];
if (file) {
  console.log('\n[TEST] File URL:', file.url);
  console.log('[TEST] Checking if URL is accessible...');

  const response = await fetch(file.url, { method: 'HEAD' });
  console.log('[TEST] Response status:', response.status, response.statusText);

  if (response.ok) {
    console.log('[TEST] ✅ URL is accessible!');
  } else {
    console.log('[TEST] ❌ URL returned', response.status);
  }
} else {
  console.log('[TEST] ❌ File not found');
}
