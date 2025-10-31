const axios = require('axios');

async function testImageGeneration() {
  console.log('🧪 Testing BUG-029 Fix: library_materials entity');
  console.log('================================================\n');

  try {
    const response = await axios.post('http://localhost:3006/api/langgraph/agents/execute', {
      agentId: 'image-generation',
      input: {
        description: 'Test: Satz des Pythagoras',
        imageStyle: 'realistic',
        learningGroup: 'Gymnasium',
        subject: 'Mathematik'
      },
      sessionId: 'test-session-library-materials-fix',
      userId: 'test-user-library-materials-fix',
      confirmExecution: true
    });

    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));

    if (response.data.result?.libraryMaterialId) {
      console.log('\n✅ SUCCESS: Image saved with libraryMaterialId:', response.data.result.libraryMaterialId);
    } else {
      console.log('\n⚠️  WARNING: No libraryMaterialId in response');
    }

    console.log('\n📋 Next: Check backend logs for "Saved to library_materials"');

  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    process.exit(1);
  }
}

testImageGeneration();
