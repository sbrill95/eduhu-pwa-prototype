import { init } from '@instantdb/admin';

const db = init({
  appId: '39f14e13-9afb-4222-be45-3d2c231be3a1',
  adminToken: '578e3067-824b-4c49-8fed-6672e41de88e'
});

const result = await db.query({ $files: {} });
const latest = result.$files[result.$files.length - 1];

console.log('[TEST] Latest uploaded file:');
console.log('  Path:', latest.path);
console.log('  Size:', latest.size, 'bytes');
console.log('  URL:', latest.url.substring(0, 100) + '...');

console.log('\n[TEST] Testing URL accessibility...');
const response = await fetch(latest.url, { method: 'HEAD' });
console.log('[TEST] HTTP Status:', response.status, response.statusText);

if (response.ok) {
  console.log('\n✅ SUCCESS: Latest file URL is publicly accessible!');
  console.log('   This confirms InstantDB storage is working correctly.');
} else {
  console.log('\n❌ FAIL: Latest file URL returned', response.status);
  console.log('   Even newly uploaded files are not accessible.');
  console.log('   Schema permissions may not be configured correctly.');
}
