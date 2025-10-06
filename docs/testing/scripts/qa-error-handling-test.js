/**
 * QA Error Handling and Edge Cases Test Script
 * Testet verschiedene Fehlerzustände und Edge Cases der Agent Integration
 */

const config = {
  backendUrl: 'http://localhost:3006/api'
};

async function testEdgeCases() {
  console.log('🔥 Starting Error Handling and Edge Cases Tests');
  console.log('='.repeat(60));

  const results = {
    tests: [],
    totalTests: 0,
    passedTests: 0
  };

  // Test 1: Invalid Agent ID
  console.log('\n1. Testing Invalid Agent ID...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "Test prompt",
        userId: "test-user",
        agentId: "invalid-agent-id",
        confirmExecution: false
      })
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400 || response.status === 404) {
      console.log('✅ Invalid agent ID properly rejected');
      results.passedTests++;
      results.tests.push({ name: 'Invalid Agent ID', status: 'PASS' });
    } else {
      console.log('❌ Invalid agent ID not properly handled');
      results.tests.push({ name: 'Invalid Agent ID', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Invalid Agent ID', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 2: Missing Required Fields
  console.log('\n2. Testing Missing Required Fields...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing prompt and userId
        confirmExecution: false
      })
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400 && data.error && data.details) {
      console.log('✅ Missing fields validation working');
      console.log(`   📋 Validation errors: ${data.details.length}`);
      results.passedTests++;
      results.tests.push({ name: 'Missing Required Fields', status: 'PASS' });
    } else {
      console.log('❌ Missing fields validation not working');
      results.tests.push({ name: 'Missing Required Fields', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Missing Required Fields', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 3: Invalid Size Parameter
  console.log('\n3. Testing Invalid Size Parameter...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "Test prompt",
        userId: "test-user",
        size: "invalid-size",
        confirmExecution: false
      })
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400) {
      console.log('✅ Invalid size parameter properly validated');
      results.passedTests++;
      results.tests.push({ name: 'Invalid Size Parameter', status: 'PASS' });
    } else {
      console.log('❌ Invalid size parameter not validated');
      results.tests.push({ name: 'Invalid Size Parameter', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Invalid Size Parameter', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 4: Oversized Prompt
  console.log('\n4. Testing Oversized Prompt...');
  try {
    const longPrompt = "a".repeat(2000); // Too long prompt
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: longPrompt,
        userId: "test-user",
        confirmExecution: false
      })
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400) {
      console.log('✅ Oversized prompt properly rejected');
      results.passedTests++;
      results.tests.push({ name: 'Oversized Prompt', status: 'PASS' });
    } else {
      console.log('❌ Oversized prompt not rejected');
      results.tests.push({ name: 'Oversized Prompt', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Oversized Prompt', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 5: Invalid Quality Parameter
  console.log('\n5. Testing Invalid Quality Parameter...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "Test prompt",
        userId: "test-user",
        quality: "ultra-mega-hd",
        confirmExecution: false
      })
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400) {
      console.log('✅ Invalid quality parameter properly validated');
      results.passedTests++;
      results.tests.push({ name: 'Invalid Quality Parameter', status: 'PASS' });
    } else {
      console.log('❌ Invalid quality parameter not validated');
      results.tests.push({ name: 'Invalid Quality Parameter', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Invalid Quality Parameter', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 6: Invalid Content-Type
  console.log('\n6. Testing Invalid Content-Type...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: "Invalid body format"
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400) {
      console.log('✅ Invalid content-type properly handled');
      results.passedTests++;
      results.tests.push({ name: 'Invalid Content-Type', status: 'PASS' });
    } else {
      console.log('❌ Invalid content-type not handled');
      results.tests.push({ name: 'Invalid Content-Type', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Invalid Content-Type', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 7: Non-existent Endpoint
  console.log('\n7. Testing Non-existent Endpoint...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/nonexistent-endpoint`, {
      method: 'GET'
    });

    results.totalTests++;
    if (response.status === 404) {
      console.log('✅ Non-existent endpoint returns 404');
      results.passedTests++;
      results.tests.push({ name: 'Non-existent Endpoint', status: 'PASS' });
    } else {
      console.log('❌ Non-existent endpoint does not return 404');
      results.tests.push({ name: 'Non-existent Endpoint', status: 'FAIL', status_code: response.status });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Non-existent Endpoint', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 8: Empty Prompt
  console.log('\n8. Testing Empty Prompt...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "",
        userId: "test-user",
        confirmExecution: false
      })
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400) {
      console.log('✅ Empty prompt properly rejected');
      results.passedTests++;
      results.tests.push({ name: 'Empty Prompt', status: 'PASS' });
    } else {
      console.log('❌ Empty prompt not rejected');
      results.tests.push({ name: 'Empty Prompt', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Empty Prompt', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 9: Malformed JSON
  console.log('\n9. Testing Malformed JSON...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"prompt": "test", "userId": "test", malformed json'
    });

    results.totalTests++;
    if (response.status === 400) {
      console.log('✅ Malformed JSON properly handled');
      results.passedTests++;
      results.tests.push({ name: 'Malformed JSON', status: 'PASS' });
    } else {
      console.log('❌ Malformed JSON not handled');
      results.tests.push({ name: 'Malformed JSON', status: 'FAIL', status_code: response.status });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Malformed JSON', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Test 10: Invalid Progress Level
  console.log('\n10. Testing Invalid Progress Level...');
  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "Test prompt",
        userId: "test-user",
        progressLevel: "invalid-level",
        confirmExecution: false
      })
    });
    const data = await response.json();

    results.totalTests++;
    if (response.status === 400) {
      console.log('✅ Invalid progress level properly validated');
      results.passedTests++;
      results.tests.push({ name: 'Invalid Progress Level', status: 'PASS' });
    } else {
      console.log('❌ Invalid progress level not validated');
      results.tests.push({ name: 'Invalid Progress Level', status: 'FAIL', response: data });
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    results.tests.push({ name: 'Invalid Progress Level', status: 'ERROR', error: error.message });
    results.totalTests++;
  }

  // Results Summary
  console.log('\n📊 ERROR HANDLING TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`📈 Total Tests: ${results.totalTests}`);
  console.log(`✅ Passed: ${results.passedTests}`);
  console.log(`❌ Failed: ${results.totalTests - results.passedTests}`);
  console.log(`📊 Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);

  console.log('\n📋 DETAILED RESULTS:');
  console.log('-'.repeat(60));
  results.tests.forEach((test, idx) => {
    const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${(idx + 1).toString().padStart(2)}. ${status} ${test.name}`);
    if (test.status === 'FAIL' && test.response) {
      console.log(`     Response: ${JSON.stringify(test.response).substring(0, 100)}...`);
    }
    if (test.status === 'ERROR') {
      console.log(`     Error: ${test.error}`);
    }
  });

  if (results.passedTests === results.totalTests) {
    console.log('\n🎉 ALL ERROR HANDLING TESTS PASSED!');
    console.log('✅ Error handling and validation is working correctly');
  } else {
    console.log('\n⚠️  SOME ERROR HANDLING TESTS FAILED');
    console.log('🔧 Review the failed cases above for improvements');
  }

  return results;
}

// Run tests
if (typeof require !== 'undefined' && require.main === module) {
  testEdgeCases().catch(console.error);
}

module.exports = { testEdgeCases };