import { init } from '@instantdb/admin';

const APP_ID = '39f14e13-9afb-4222-be45-3d2c231be3a1';
const ADMIN_TOKEN = '578e3067-824b-4c49-8fed-6672e41de88e';

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

console.log('[TEST] Fetching all files and testing each URL...\n');

const result = await db.query({ $files: {} });
const files = result.$files || [];

console.log(`[TEST] Total files: ${files.length}\n`);

for (const file of files) {
  console.log(`Testing: ${file.path}`);
  console.log(`  Size: ${file.size} bytes`);

  try {
    const response = await fetch(file.url, { method: 'HEAD' });
    if (response.ok) {
      console.log(`  ✅ ${response.status} OK - ACCESSIBLE\n`);
    } else {
      console.log(`  ❌ ${response.status} ${response.statusText} - NOT ACCESSIBLE`);
      console.log(`  URL: ${file.url.substring(0, 120)}...\n`);
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
  }
}

console.log('[TEST] Summary:');
const accessibleCount = (await Promise.all(
  files.map(async f => {
    try {
      const r = await fetch(f.url, { method: 'HEAD' });
      return r.ok;
    } catch {
      return false;
    }
  })
)).filter(Boolean).length;

console.log(`  Accessible: ${accessibleCount}/${files.length}`);
console.log(`  Not accessible: ${files.length - accessibleCount}/${files.length}`);

if (accessibleCount === 0) {
  console.log('\n⚠️  ISSUE: ALL URLs return 403');
  console.log('   Possible causes:');
  console.log('   1. Schema permissions not pushed to cloud');
  console.log('   2. App ID mismatch');
  console.log('   3. InstantDB storage permissions not configured correctly');
} else if (accessibleCount < files.length) {
  console.log('\n⚠️  PARTIAL: Some URLs work, some don\'t');
  console.log('   This suggests old URLs have expired (>7 days)');
} else {
  console.log('\n✅ SUCCESS: All URLs are publicly accessible!');
}
