/**
 * QA Frontend Test Script - Agent Integration Tests
 * Tests das Frontend Agent Loading und die Agent-Erkennung
 */

// Test-Konfiguration
const config = {
  frontendUrl: 'http://localhost:5190',
  backendUrl: 'http://localhost:3006/api',
  timeout: 30000
};

// Test-Phrasen für Agent-Erkennung
const testPhrases = {
  // Positive Cases - sollten Agent auslösen
  positive: [
    "Erstelle ein Bild von einem Löwen",
    "Ich brauche eine Illustration für den Unterricht",
    "Kannst du mir ein Arbeitsblatt mit einem Diagramm machen",
    "Zeige mir eine Visualisierung",
    "erstelle ein bild",
    "generiere ein foto",
    "zeichne einen baum",
    "male ein haus",
    "ich brauche ein bild von einem auto",
    "kannst du ein poster erstellen",
    "visualisierung für mathematik",
    "schaubild für physik"
  ],

  // Negative Cases - sollten KEINEN Agent auslösen
  negative: [
    "Wie ist das Wetter heute?",
    "Was ist 2 + 2?",
    "Erzähle mir einen Witz",
    "Wann ist Weihnachten?",
    "Hilfe bei Hausaufgaben",
    "Erkläre mir Photosynthese",
    "Was ist die Hauptstadt von Deutschland?"
  ]
};

// Test-Funktionen
async function testBackendConnectivity() {
  console.log('\n🔧 Testing Backend Connectivity...');

  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/status`);
    const data = await response.json();

    if (data.success && data.data.agents.total >= 1) {
      console.log('✅ Backend connectivity: SUCCESS');
      console.log(`   📊 Agents available: ${data.data.agents.total}`);
      console.log(`   🎯 LangGraph compatible: ${data.data.agents.langgraph_compatible}`);
      return true;
    } else {
      console.log('❌ Backend connectivity: FAILED - No agents available');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connectivity: FAILED', error.message);
    return false;
  }
}

async function testAgentsList() {
  console.log('\n📋 Testing Agent List API...');

  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/available`);
    const data = await response.json();

    if (data.success && data.data.agents.length >= 1) {
      console.log('✅ Agent list API: SUCCESS');
      data.data.agents.forEach((agent, idx) => {
        console.log(`   ${idx + 1}. ${agent.name} (${agent.id})`);
        console.log(`      📝 Description: ${agent.description}`);
        console.log(`      🎮 Triggers: ${agent.triggers.slice(0, 3).join(', ')}...`);
        console.log(`      ✅ Available: ${agent.isAvailable}`);
      });
      return true;
    } else {
      console.log('❌ Agent list API: FAILED - No agents returned');
      return false;
    }
  } catch (error) {
    console.log('❌ Agent list API: FAILED', error.message);
    return false;
  }
}

async function testImageGenerationPreview() {
  console.log('\n🖼️  Testing Image Generation Preview...');

  const testPayload = {
    prompt: "Erstelle ein Bild von einem Löwen für den Biologieunterricht",
    userId: "qa-test-user-" + Date.now(),
    confirmExecution: false,
    educationalContext: "Biologieunterricht - Säugetiere",
    targetAgeGroup: "12-14 Jahre",
    subject: "Biologie"
  };

  try {
    const response = await fetch(`${config.backendUrl}/langgraph-agents/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    if (data.success && data.data.execution_preview) {
      console.log('✅ Image generation preview: SUCCESS');
      const preview = data.data.execution_preview;
      console.log(`   🎯 Agent: ${preview.agent_name}`);
      console.log(`   💰 Cost: ${preview.estimated_cost} credits`);
      console.log(`   ⚡ Can execute: ${preview.can_execute}`);
      console.log(`   🔄 Workflow enabled: ${preview.enhanced_features.workflow_management}`);
      console.log(`   📊 Progress streaming: ${preview.enhanced_features.progress_streaming}`);
      return true;
    } else {
      console.log('❌ Image generation preview: FAILED');
      console.log('   Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Image generation preview: FAILED', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting QA Frontend Agent Integration Tests');
  console.log('='.repeat(60));
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`Backend URL: ${config.backendUrl}`);
  console.log('='.repeat(60));

  const results = {
    backendConnectivity: false,
    agentsList: false,
    imageGenerationPreview: false,
    totalTests: 3,
    passedTests: 0
  };

  // Test Backend Connectivity
  results.backendConnectivity = await testBackendConnectivity();
  if (results.backendConnectivity) results.passedTests++;

  // Test Agents List
  results.agentsList = await testAgentsList();
  if (results.agentsList) results.passedTests++;

  // Test Image Generation Preview
  results.imageGenerationPreview = await testImageGenerationPreview();
  if (results.imageGenerationPreview) results.passedTests++;

  // Results Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Backend Connectivity: ${results.backendConnectivity ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Agents List API: ${results.agentsList ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Image Generation Preview: ${results.imageGenerationPreview ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(60));
  console.log(`📈 Overall: ${results.passedTests}/${results.totalTests} tests passed`);

  if (results.passedTests === results.totalTests) {
    console.log('🎉 ALL TESTS PASSED - Backend integration is working correctly!');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Check the issues above');
  }

  console.log('\n📝 Agent Detection Test Phrases:');
  console.log('\n✅ POSITIVE (should trigger agent):');
  testPhrases.positive.forEach((phrase, idx) => {
    console.log(`   ${idx + 1}. "${phrase}"`);
  });

  console.log('\n❌ NEGATIVE (should NOT trigger agent):');
  testPhrases.negative.forEach((phrase, idx) => {
    console.log(`   ${idx + 1}. "${phrase}"`);
  });

  console.log('\n🔗 Frontend Test URL: ' + config.frontendUrl);
  console.log('📱 Open the URL above and test the phrases manually in the chat interface');

  return results;
}

// Run tests if script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { runTests, testPhrases, config };
}