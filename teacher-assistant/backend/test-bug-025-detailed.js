/**
 * BUG-025 Detailed Test - Test library_materials and messages creation separately
 */

const { init } = require('@instantdb/admin');

const db = init({
  appId: '39f14e13-9afb-4222-be45-3d2c231be3a1',
  adminToken: '578e3067-824b-4c49-8fed-6672e41de88e'
});

async function testLibraryMaterialsOnly() {
  console.log('\n===== TEST 1: Save to library_materials =====');
  const libraryId = crypto.randomUUID();
  const now = Date.now();

  try {
    await db.transact([
      db.tx.library_materials[libraryId].update({
        user_id: 'test-user',
        title: 'Test Image',
        type: 'image',
        content: 'https://example.com/test.png',
        description: 'Test description',
        tags: JSON.stringify([]),
        created_at: now,
        updated_at: now,
        is_favorite: false,
        usage_count: 0,
        source_session_id: 'test-session'
      })
    ]);
    console.log('✅ library_materials save SUCCESS');
    return true;
  } catch (error) {
    console.log('❌ library_materials save FAILED:', error.message);
    return false;
  }
}

async function testMessagesOnly() {
  console.log('\n===== TEST 2: Save to messages =====');
  const messageId = crypto.randomUUID();
  const now = Date.now();

  try {
    await db.transact([
      db.tx.messages[messageId].update({
        content: 'Test message',
        role: 'assistant',
        timestamp: now,
        message_index: 0,
        is_edited: false,
        metadata: JSON.stringify({ test: true }),
        session: 'test-session',
        author: 'test-user'
      })
    ]);
    console.log('✅ messages save SUCCESS');
    return true;
  } catch (error) {
    console.log('❌ messages save FAILED:', error.message);
    console.log('Error details:', error);
    return false;
  }
}

async function testMessagesWithLinks() {
  console.log('\n===== TEST 3: Save to messages with explicit link syntax =====');
  const messageId = crypto.randomUUID();
  const now = Date.now();

  try {
    await db.transact([
      db.tx.messages[messageId].update({
        content: 'Test message 2',
        role: 'assistant',
        timestamp: now,
        message_index: 0,
        is_edited: false,
        metadata: JSON.stringify({ test: true })
      }).link({ session: 'test-session' }).link({ author: 'test-user' })
    ]);
    console.log('✅ messages with .link() SUCCESS');
    return true;
  } catch (error) {
    console.log('❌ messages with .link() FAILED:', error.message);
    return false;
  }
}

async function run() {
  const test1 = await testLibraryMaterialsOnly();
  const test2 = await testMessagesOnly();
  const test3 = await testMessagesWithLinks();

  console.log('\n===== SUMMARY =====');
  console.log('library_materials:', test1 ? '✅ PASS' : '❌ FAIL');
  console.log('messages (inline):', test2 ? '✅ PASS' : '❌ FAIL');
  console.log('messages (.link()):', test3 ? '✅ PASS' : '❌ FAIL');
}

run().catch(console.error);
