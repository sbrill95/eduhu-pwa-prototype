// Quick test to verify InstantDB update works
const { init } = require('@instantdb/admin');
require('dotenv').config();

const APP_ID = process.env.INSTANTDB_APP_ID;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN;

console.log('Testing InstantDB update...');
console.log('APP_ID:', APP_ID?.substring(0, 8) + '...');
console.log('ADMIN_TOKEN:', ADMIN_TOKEN ? 'Set' : 'Missing');

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('❌ Missing credentials!');
  process.exit(1);
}

const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});

async function testUpdate() {
  try {
    // First, let's query existing sessions
    console.log('\n📊 Querying existing chat sessions...');
    const sessions = await db.query({ chat_sessions: {} });
    console.log('Found sessions:', sessions.chat_sessions?.length || 0);

    if (sessions.chat_sessions && sessions.chat_sessions.length > 0) {
      const firstSession = sessions.chat_sessions[0];
      console.log('\n🎯 Testing update on session:', firstSession.id);
      console.log('Current summary:', firstSession.summary || 'null');

      // Try to update the summary
      const testSummary = 'Test Summary ' + Date.now();
      console.log('Updating to:', testSummary);

      const result = await db.transact([
        db.tx.chat_sessions[firstSession.id].update({
          summary: testSummary,
          updated_at: Date.now()
        })
      ]);

      console.log('\n✅ Update result:', JSON.stringify(result, null, 2));

      // Query again to verify
      console.log('\n🔍 Verifying update...');
      const updated = await db.query({
        chat_sessions: {
          $: { where: { id: firstSession.id } }
        }
      });

      console.log('Updated summary:', updated.chat_sessions?.[0]?.summary);

      if (updated.chat_sessions?.[0]?.summary === testSummary) {
        console.log('\n✅ SUCCESS: Summary was updated correctly!');
      } else {
        console.log('\n❌ FAILED: Summary was not updated!');
      }
    } else {
      console.log('❌ No sessions found to test with');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testUpdate();
