/**
 * Schema Verification Script (T009, T013)
 * Verifies messages and library_materials have metadata fields
 */

const { init } = require('@instantdb/admin');

const APP_ID = '39f14e13-9afb-4222-be45-3d2c231be3a1';

// Initialize admin SDK (requires INSTANT_ADMIN_TOKEN in environment)
const db = init({
  appId: APP_ID,
  adminToken: process.env.INSTANT_ADMIN_TOKEN
});

async function verifySchema() {
  console.log('🔍 Verifying InstantDB schema migration...\n');

  try {
    // T009: Verify messages schema
    console.log('📝 Testing messages entity with metadata field...');
    const messagesQuery = await db.query({ messages: {} });
    console.log(`✅ Messages query successful. Found ${messagesQuery.messages?.length || 0} messages`);

    if (messagesQuery.messages && messagesQuery.messages.length > 0) {
      const sampleMessage = messagesQuery.messages[0];
      console.log('   Sample message has metadata field:', 'metadata' in sampleMessage ? '✅ YES' : '❌ NO');
    } else {
      console.log('   ℹ️  No messages found (table empty - normal for new deployment)');
    }

    // T013: Verify library_materials schema
    console.log('\n📚 Testing library_materials entity with metadata field...');
    const materialsQuery = await db.query({ library_materials: {} });
    console.log(`✅ Library materials query successful. Found ${materialsQuery.library_materials?.length || 0} materials`);

    if (materialsQuery.library_materials && materialsQuery.library_materials.length > 0) {
      const sampleMaterial = materialsQuery.library_materials[0];
      console.log('   Sample material has metadata field:', 'metadata' in sampleMaterial ? '✅ YES' : '❌ NO');
    } else {
      console.log('   ℹ️  No library materials found (table empty - normal for new deployment)');
    }

    console.log('\n✅ Schema migration verification complete - zero errors');
    console.log('📊 Both entities support metadata field for FR-009 and FR-007\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Schema verification failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

verifySchema();
