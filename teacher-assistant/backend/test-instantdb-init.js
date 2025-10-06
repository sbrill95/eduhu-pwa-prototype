/**
 * Test script to verify InstantDB initialization
 * Run with: node test-instantdb-init.js
 */

require('dotenv').config();
const { init } = require('@instantdb/admin');

console.log('=== InstantDB Initialization Test ===\n');

console.log('Environment Variables:');
console.log('INSTANTDB_APP_ID:', process.env.INSTANTDB_APP_ID);
console.log('INSTANTDB_ADMIN_TOKEN:', process.env.INSTANTDB_ADMIN_TOKEN ? `present (${process.env.INSTANTDB_ADMIN_TOKEN.length} chars)` : 'MISSING');
console.log('');

try {
  if (!process.env.INSTANTDB_APP_ID || !process.env.INSTANTDB_ADMIN_TOKEN) {
    throw new Error('Missing INSTANTDB_APP_ID or INSTANTDB_ADMIN_TOKEN in .env file');
  }

  console.log('Initializing InstantDB...');
  const db = init({
    appId: process.env.INSTANTDB_APP_ID,
    adminToken: process.env.INSTANTDB_ADMIN_TOKEN,
  });

  console.log('✅ InstantDB initialized successfully!');
  console.log('DB object:', db ? 'present' : 'missing');
  console.log('');

  // Test a simple query
  console.log('Testing query...');
  db.query({ users: {} })
    .then(result => {
      console.log('✅ Query successful!');
      console.log('User count:', result.users?.length || 0);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Query failed:', error.message);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ InstantDB initialization failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
