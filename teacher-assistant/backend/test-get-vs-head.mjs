import { init } from '@instantdb/admin';

const db = init({
  appId: '39f14e13-9afb-4222-be45-3d2c231be3a1',
  adminToken: '578e3067-824b-4c49-8fed-6672e41de88e'
});

const result = await db.query({ $files: {} });

console.log('[TEST] Testing GET vs HEAD requests on different files:\n');

// Test last 3 files
const testFiles = result.$files.slice(-3);

for (const file of testFiles) {
  console.log(`File: ${file.path} (${file.size} bytes)`);

  // Test with HEAD
  const headResponse = await fetch(file.url, { method: 'HEAD' });
  console.log(`  HEAD: ${headResponse.status} ${headResponse.statusText}`);

  // Test with GET
  const getResponse = await fetch(file.url);
  console.log(`  GET:  ${getResponse.status} ${getResponse.statusText}`);

  if (headResponse.status !== getResponse.status) {
    console.log(`  ⚠️  DIFFERENCE DETECTED!`);
  }

  console.log();
}

console.log('[TEST] Summary:');
console.log('If GET works but HEAD fails, this is an AWS S3 presigned URL quirk.');
console.log('Solution: Always use GET requests to verify URL accessibility.');
