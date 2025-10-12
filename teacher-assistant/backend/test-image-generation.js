/**
 * Manual test script for image generation timeout fix
 * Tests the image generation endpoint with timing
 */

const https = require('http');

const testData = {
  agentType: 'image-generation',
  parameters: {
    theme: 'vom Satz des Pythagoras',
    style: 'realistic',
    educationalLevel: 'Gymnasium'
  },
  sessionId: 'test-session-timeout-fix',
  userId: 'test-user-bug-025-fix'  // BUG-025: Added userId for message author relationship
};

console.log('[TEST] Starting image generation test at', new Date().toISOString());
console.log('[TEST] Sending request to POST http://localhost:3006/api/langgraph/agents/execute');
console.log('[TEST] Request data:', JSON.stringify(testData, null, 2));

const startTime = Date.now();

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3006,
  path: '/api/langgraph/agents/execute',  // BUG-025: Test imageGeneration.ts route (mounted at /langgraph)
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 70000 // 70 seconds timeout
};

const req = https.request(options, (res) => {
  console.log(`[TEST] Response status: ${res.statusCode}`);
  console.log(`[TEST] Response headers:`, res.headers);

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
      } else {
        console.log('\n❌ FAILED: Image generation failed');
        console.log('Error:', response.error);
      }

      if (elapsed > 60000) {
        console.log('\n⚠️  WARNING: Request took longer than 60 seconds');
      } else if (elapsed < 30000) {
        console.log('\n✅ EXCELLENT: Request completed in under 30 seconds!');
      } else {
        console.log('\n✅ GOOD: Request completed in under 60 seconds');
      }
    } catch (error) {
      console.error('[TEST] Failed to parse response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  const elapsed = Date.now() - startTime;
  console.error(`\n❌ ERROR after ${elapsed}ms (${(elapsed / 1000).toFixed(2)}s):`, error.message);
  process.exit(1);
});

req.on('timeout', () => {
  const elapsed = Date.now() - startTime;
  console.error(`\n❌ TIMEOUT after ${elapsed}ms (${(elapsed / 1000).toFixed(2)}s)`);
  req.destroy();
  process.exit(1);
});

req.write(postData);
req.end();

console.log('[TEST] Request sent, waiting for response...');
