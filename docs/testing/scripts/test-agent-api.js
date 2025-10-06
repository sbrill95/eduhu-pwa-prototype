/**
 * Test Agent API - HTTP Test für DALL-E 3 Image Generation Agent
 * Testet die API-Endpunkte ohne DirectModule imports
 */

const https = require('https');
const http = require('http');

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const module = options.protocol === 'https:' ? https : http;

    const req = module.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAgentAPI() {
  console.log('🚀 Testing Agent API Endpoints...\n');

  const baseURL = 'http://localhost:3006';

  try {
    // 1. Test LangGraph Agents Status
    console.log('1️⃣ Testing LangGraph Agents Status...');
    const statusOptions = {
      hostname: 'localhost',
      port: 3006,
      path: '/api/langgraph-agents/status',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const statusResponse = await makeRequest(statusOptions);
    console.log('Status Code:', statusResponse.statusCode);
    console.log('Available Agents:', statusResponse.data?.data?.agents?.total || 'Unknown');
    console.log('LangGraph Enabled:', statusResponse.data?.data?.system?.langgraph_enabled || false);

    // 2. Test Available Agents
    console.log('\n2️⃣ Testing Available Agents...');
    const agentsOptions = {
      hostname: 'localhost',
      port: 3006,
      path: '/api/langgraph-agents/available',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const agentsResponse = await makeRequest(agentsOptions);
    console.log('Status Code:', agentsResponse.statusCode);
    if (agentsResponse.data?.data?.agents) {
      console.log('Available LangGraph Agents:');
      agentsResponse.data.data.agents.forEach(agent => {
        console.log(`  - ${agent.id}: ${agent.name} (${agent.enabled ? 'Enabled' : 'Disabled'})`);
      });
    }

    // 3. Test Image Generation Preview
    console.log('\n3️⃣ Testing Image Generation Preview...');
    const previewData = {
      prompt: 'Ein bunter Schmetterling auf einer Blume für den Biologieunterricht',
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
      userId: 'test-user-123',
      sessionId: 'test-session-456',
      enhancePrompt: true,
      educationalContext: 'Biologieunterricht Grundschule',
      targetAgeGroup: '6-10 Jahre',
      subject: 'Biologie',
      confirmExecution: false // Preview only
    };

    const previewOptions = {
      hostname: 'localhost',
      port: 3006,
      path: '/api/langgraph-agents/image/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(previewData))
      }
    };

    const previewResponse = await makeRequest(previewOptions, previewData);
    console.log('Status Code:', previewResponse.statusCode);
    if (previewResponse.data?.data?.execution_preview) {
      const preview = previewResponse.data.data.execution_preview;
      console.log('Agent Found:', preview.agent_name);
      console.log('Can Execute:', preview.can_execute);
      console.log('Estimated Cost:', preview.estimated_cost, 'cents');
      console.log('Requires Confirmation:', preview.requires_confirmation);
    }

    // 4. Test Actual Image Generation (if OpenAI key is available)
    console.log('\n4️⃣ Testing Actual Image Generation...');
    const executionData = {
      ...previewData,
      confirmExecution: true // Actual execution
    };

    const executionOptions = {
      hostname: 'localhost',
      port: 3006,
      path: '/api/langgraph-agents/image/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(executionData))
      }
    };

    console.log('⏳ Executing DALL-E 3 image generation...');
    const executionResponse = await makeRequest(executionOptions, executionData);
    console.log('Status Code:', executionResponse.statusCode);

    if (executionResponse.statusCode === 200 && executionResponse.data?.success) {
      console.log('✅ IMAGE GENERATION SUCCESSFUL!');
      console.log('Image URL:', executionResponse.data.data?.image_url);
      console.log('Enhanced Prompt:', executionResponse.data.data?.enhanced_prompt ? 'Yes' : 'No');
      console.log('Cost:', executionResponse.data.data?.cost || 'Unknown', 'cents');
    } else {
      console.log('❌ IMAGE GENERATION FAILED:');
      console.log('Error:', executionResponse.data?.error || 'Unknown error');
      if (executionResponse.data?.details) {
        console.log('Details:', executionResponse.data.details);
      }
    }

  } catch (error) {
    console.error('💥 API Test Failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Backend server is not running. Start with: npm run dev');
    }
  }
}

// Run test
testAgentAPI()
  .then(() => {
    console.log('\n🏁 API Test completed');
  })
  .catch((error) => {
    console.error('💥 API Test execution failed:', error);
  });