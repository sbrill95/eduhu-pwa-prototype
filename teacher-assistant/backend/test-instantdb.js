// Test InstantDB Initialization
require('dotenv').config();
const { init } = require('@instantdb/admin');

console.log('[Test] Starting InstantDB initialization test...');
console.log('[Test] APP_ID:', process.env.INSTANTDB_APP_ID?.substring(0, 10) + '...');
console.log('[Test] TOKEN exists:', !!process.env.INSTANTDB_ADMIN_TOKEN);

try {
  console.log('[Test] Calling init()...');
  const db = init({
    appId: process.env.INSTANTDB_APP_ID,
    adminToken: process.env.INSTANTDB_ADMIN_TOKEN,
  });

  console.log('[Test] Init completed');
  console.log('[Test] DB object type:', typeof db);
  console.log('[Test] DB.query exists:', typeof db?.query);
  console.log('[Test] DB.transact exists:', typeof db?.transact);

  if (db && typeof db.query === 'function') {
    console.log('[Test] ✅ SUCCESS - InstantDB initialized correctly');
    console.log('[Test] Testing a simple query...');

    db.query({ users: {} })
      .then(result => {
        console.log('[Test] ✅ Query successful, users count:', result?.users?.length || 0);
        process.exit(0);
      })
      .catch(err => {
        console.error('[Test] ❌ Query failed:', err.message);
        process.exit(1);
      });
  } else {
    console.error('[Test] ❌ FAIL - Invalid DB object');
    process.exit(1);
  }
} catch (error) {
  console.error('[Test] ❌ Exception:', error.message);
  console.error('[Test] Stack:', error.stack);
  process.exit(1);
}
