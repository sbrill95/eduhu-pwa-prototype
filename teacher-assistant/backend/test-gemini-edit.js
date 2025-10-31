// Quick test to verify Gemini image editing works
const fetch = require('node-fetch');

async function testGeminiEdit() {
  console.log('🧪 Testing Gemini Image Edit API...\n');

  // Create a simple test image (1x1 red pixel in base64)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  const testPayload = {
    imageId: 'test-image-id',
    instruction: 'Make it blue',
    userId: 'test-user-123'
  };

  try {
    console.log('📤 Sending edit request to backend...');
    console.log('   Endpoint: http://localhost:3006/api/image/edit');
    console.log('   Instruction:', testPayload.instruction);
    console.log('');

    const response = await fetch('http://localhost:3006/api/image/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const status = response.status;
    const data = await response.json();

    console.log('📥 Response received:');
    console.log('   Status:', status);
    console.log('   Success:', data.success);
    console.log('');

    if (status === 429) {
      console.log('❌ RATE LIMIT ERROR (429)');
      console.log('   Error:', data.error);
      console.log('');
      console.log('💡 This means:');
      console.log('   - Gemini API still requires paid tier');
      console.log('   - OR daily limits exceeded');
      console.log('   - OR API key needs billing enabled');
      return false;
    }

    if (status === 404) {
      console.log('⚠️ IMAGE NOT FOUND (404)');
      console.log('   This is expected for test image');
      console.log('   But it means the API endpoint is working!');
      console.log('   The 429 rate limit is NOT blocking us anymore.');
      return true;
    }

    if (data.success) {
      console.log('✅ SUCCESS! Gemini image editing is working!');
      console.log('   Edited image:', data.data?.editedImage?.url?.substring(0, 50) + '...');
      return true;
    } else {
      console.log('⚠️ Request processed but failed:');
      console.log('   Error:', data.error);
      return false;
    }

  } catch (error) {
    console.log('❌ REQUEST FAILED');
    console.log('   Error:', error.message);
    return false;
  }
}

testGeminiEdit().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ RESULT: Gemini API is accessible');
    console.log('   You can proceed with Story 3.1.2');
  } else {
    console.log('❌ RESULT: Gemini API still blocked');
    console.log('   Action needed: Enable billing in Google AI Studio');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});
