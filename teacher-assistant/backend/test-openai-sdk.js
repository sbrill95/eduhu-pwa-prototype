/**
 * Test script to verify OpenAI SDK access
 * Checks if the API key has access to the Assistants/Agents API
 */

require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAIAccess() {
  console.log('Testing OpenAI SDK access...\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables');
    return false;
  }

  console.log('✅ API Key found:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    // Test 1: Basic Chat Completion (should always work)
    console.log('\n📝 Testing basic chat completion...');
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    console.log('✅ Chat API works:', chatResponse.choices[0].message.content);

    // Test 2: Try to list assistants (requires Assistants API access)
    console.log('\n🤖 Testing Assistants API access...');
    try {
      const assistants = await openai.beta.assistants.list({ limit: 1 });
      console.log('✅ Assistants API access CONFIRMED');
      console.log('   Found', assistants.data.length, 'assistant(s)');
      return true;
    } catch (assistantError) {
      if (assistantError.status === 404 || assistantError.status === 403) {
        console.log('❌ Assistants API NOT available');
        console.log('   This API key does not have access to the Assistants/Agents SDK');
        console.log('   Epic 3.0 CANNOT proceed without this access');
        console.log('\n📌 To enable Assistants API:');
        console.log('   1. Go to https://platform.openai.com/docs/agents');
        console.log('   2. Request access if not already enabled');
        console.log('   3. Use an API key from an account with Assistants API access');
        return false;
      }
      throw assistantError;
    }

  } catch (error) {
    console.error('❌ ERROR testing OpenAI API:', error.message);
    if (error.status === 401) {
      console.log('   Invalid API key');
    } else if (error.status === 429) {
      console.log('   Rate limit exceeded');
    } else {
      console.log('   Status:', error.status);
    }
    return false;
  }
}

// Run the test
testOpenAIAccess().then(hasAccess => {
  console.log('\n' + '='.repeat(50));
  if (hasAccess) {
    console.log('✅ READY FOR EPIC 3.0: OpenAI SDK with Assistants API confirmed');
  } else {
    console.log('❌ NOT READY FOR EPIC 3.0: Missing Assistants API access');
  }
  console.log('='.repeat(50));
  process.exit(hasAccess ? 0 : 1);
});