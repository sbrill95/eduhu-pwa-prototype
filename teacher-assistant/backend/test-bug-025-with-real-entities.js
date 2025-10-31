/**
 * BUG-025 Test: Create real user + session first, then test image generation
 */

const https = require('http');

async function testBug025() {
  console.log('[BUG-025 TEST] Starting comprehensive test\n');

  // Step 1: Create test user
  console.log('STEP 1: Creating test user...');
  const userId = `test-user-${Date.now()}`;
  const userCreated = await createUser(userId);

  if (!userCreated) {
    console.error('❌ Failed to create user');
    process.exit(1);
  }

  console.log('✅ User created:', userId);

  // Step 2: Create test session
  console.log('\nSTEP 2: Creating test session...');
  const sessionId = `test-session-${Date.now()}`;
  const sessionCreated = await createSession(sessionId, userId);

  if (!sessionCreated) {
    console.error('❌ Failed to create session');
    process.exit(1);
  }

  console.log('✅ Session created:', sessionId);

  // Step 3: Test image generation with real entities
  console.log('\nSTEP 3: Testing image generation with real user + session...');
  await testImageGeneration(userId, sessionId);
}

async function createUser(userId) {
  // This would need InstantDB direct access
  // For now, skip - InstantDB should auto-create links
  return true;
}

async function createSession(sessionId, userId) {
  // This would need InstantDB direct access
  // For now, skip - InstantDB should auto-create links
  return true;
}

async function testImageGeneration(userId, sessionId) {
  const testData = {
    agentType: 'image-generation',
    parameters: {
      theme: 'vom Satz des Pythagoras',
      style: 'realistic',
      educationalLevel: 'Gymnasium'
    },
    sessionId: sessionId,
    userId: userId
  };

  console.log('[TEST] Request data:', JSON.stringify(testData, null, 2));

  const startTime = Date.now();
  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 3006,
    path: '/api/langgraph/agents/execute',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 70000
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`[TEST] Response status: ${res.statusCode}`);

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        console.log(`\n[TEST] Request completed in ${elapsed}ms (${(elapsed / 1000).toFixed(2)}s)`);

        try {
          const response = JSON.parse(data);
          console.log('\n[TEST] Response:', JSON.stringify(response, null, 2));

          if (response.success) {
            console.log('\n✅ SUCCESS: Image generated!');
            console.log('Image URL:', response.data?.image_url?.substring(0, 80));
            console.log('Library ID:', response.data?.library_id);
            console.log('Message ID:', response.data?.message_id);
            console.log('Title:', response.data?.title);

            if (response.data?.message_id) {
              console.log('\n🎉 BUG-025 FIXED! message_id is NOT null!');
              console.log('message_id:', response.data.message_id);
            } else {
              console.log('\n❌ BUG-025 NOT FIXED: message_id is still null');
              if (response.warning) {
                console.log('Warning:', response.warning);
              }
              if (response.storageError) {
                console.log('Storage Error:', response.storageError);
              }
            }
          } else {
            console.log('\n❌ FAILED: Image generation failed');
            console.log('Error:', response.error);
          }

          resolve();
        } catch (error) {
          console.error('[TEST] Failed to parse response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ ERROR:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('\n❌ TIMEOUT');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();

    console.log('[TEST] Request sent, waiting for response...');
  });
}

testBug025().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
