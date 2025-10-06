/**
 * Test Agent Execution - Direct DALL-E 3 Image Generation Test
 * Tests the Agent Execution with InstantDB bypass mode
 */

const { agentRegistry, agentExecutionService } = require('./teacher-assistant/backend/src/services/agentService');
const { langGraphImageGenerationAgent } = require('./teacher-assistant/backend/src/agents/langGraphImageGenerationAgent');

async function testAgentExecution() {
  console.log('🚀 Starting Agent Execution Test...\n');

  try {
    // Register agent
    agentRegistry.register(langGraphImageGenerationAgent);
    console.log('✅ Agent registered successfully');

    // Test parameters
    const testParams = {
      prompt: 'Ein bunter Schmetterling auf einer Blume für den Biologieunterricht',
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
      enhancePrompt: true,
      educationalContext: 'Biologieunterricht Grundschule',
      targetAgeGroup: '6-10 Jahre',
      subject: 'Biologie'
    };

    const testUserId = 'test-user-123';
    const testSessionId = 'test-session-456';

    console.log('📋 Test Parameters:');
    console.log('  Prompt:', testParams.prompt);
    console.log('  User ID:', testUserId);
    console.log('  Agent ID:', langGraphImageGenerationAgent.id);

    // Execute agent
    console.log('\n🎯 Starting Agent Execution...');
    const result = await agentExecutionService.executeAgent(
      langGraphImageGenerationAgent.id,
      testParams,
      testUserId,
      testSessionId,
      (status, progress) => {
        console.log(`📊 Progress: ${progress}% - ${status}`);
      }
    );

    console.log('\n📄 EXECUTION RESULT:');
    console.log('Success:', result.success);

    if (result.success) {
      console.log('✅ AGENT EXECUTION SUCCESSFUL!');
      console.log('Image URL:', result.data?.image_url);
      console.log('Enhanced Prompt:', result.data?.enhanced_prompt);
      console.log('Cost:', result.cost, 'cents');
      console.log('Artifacts Generated:', result.artifacts?.length || 0);
    } else {
      console.log('❌ AGENT EXECUTION FAILED:');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('💥 Test Failed with Exception:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testAgentExecution()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });