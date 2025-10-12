// Push InstantDB schema with permissions
const { init } = require('@instantdb/admin');
const schema = require('./instant.schema.ts').default;

const APP_ID = '39f14e13-9afb-4222-be45-3d2c231be3a1';
const ADMIN_TOKEN = '578e3067-824b-4c49-8fed-6672e41de88e';

async function pushSchema() {
  console.log('🔄 Pushing schema to InstantDB...');

  try {
    const db = init({
      appId: APP_ID,
      adminToken: ADMIN_TOKEN
    });

    // Use InstantDB admin API to push schema
    await db.pushSchema(schema);

    console.log('✅ Schema pushed successfully!');
    console.log('   - Added permissions for library_materials');
    console.log('   - Added permissions for chat_sessions');
    console.log('   - Added permissions for messages');
    console.log('   - Added permissions for teacher_profiles');
    console.log('   - Added permissions for profile_characteristics');

  } catch (error) {
    console.error('❌ Error pushing schema:', error.message);
    console.log('\n📝 Manual push required:');
    console.log('   Run: npx instant-cli push schema');
    console.log('   Or visit: https://instantdb.com/dash?s=main&t=home&app=' + APP_ID);
    process.exit(1);
  }
}

pushSchema();
