/**
 * QA Agent Detection Test Script
 * Testet die Agent-Erkennung-Algorithmen direkt
 */

// Simuliere die detectAgentContext Funktion aus useAgents.ts
function detectAgentContext(input, agents = [{ id: 'image-generation', isAvailable: true }]) {
  const normalizedInput = input.toLowerCase().trim();

  // Image generation keywords (aus useAgents.ts kopiert)
  const imageKeywords = [
    // Direkte Befehle
    'bild', 'bilder', 'erstellen', 'generieren', 'zeichnung', 'zeichnen',
    'grafik', 'illustration', 'visual', 'visuell', 'erstelle',
    'generiere', 'zeichne', 'male', 'skizze', 'diagram', 'diagramm',

    // Unterrichts-spezifische Begriffe
    'arbeitsblatt', 'poster', 'plakat', 'wandbild', 'visualisierung',
    'lernposter', 'anschauungsmatererial', 'schaubild', 'flowchart',
    'mindmap', 'concept map', 'timeline', 'zeitstrahl',

    // Weitere Varianten
    'zeige mir', 'zeig mir', 'ich brauche ein', 'ich hätte gern',
    'kannst du ein', 'mach mir ein', 'erstell mir', 'design',
    'illustriere', 'visualisiere', 'darstellen', 'abbildung',

    // Spezifische Objekte
    'löwe', 'tier', 'tiere', 'landschaft', 'gebäude', 'person',
    'comic', 'cartoon', 'symbol', 'icon', 'logo', 'fahne',
    'karte', 'weltkarte', 'stadtplan', 'geometrie', 'form', 'formen'
  ];

  // Check for image generation intent
  const imageMatches = imageKeywords.filter(keyword =>
    normalizedInput.includes(keyword)
  );

  // Calculate confidence
  let imageConfidence = 0;
  if (imageMatches.length > 0) {
    // Base confidence from keyword matches
    imageConfidence = Math.min(imageMatches.length * 0.25 + 0.3, 0.9);

    // Boost confidence for strong indicators
    const strongIndicators = ['erstelle ein bild', 'generiere', 'zeichne', 'mach mir ein', 'ich brauche ein bild'];
    const hasStrongIndicator = strongIndicators.some(indicator =>
      normalizedInput.includes(indicator)
    );

    if (hasStrongIndicator) {
      imageConfidence = Math.min(imageConfidence + 0.3, 1.0);
    }

    // Check for image agent availability
    const imageAgent = agents.find(agent => agent.id === 'image-generation');
    if (imageAgent && imageAgent.isAvailable && imageConfidence >= 0.4) {
      return {
        detected: true,
        confidence: imageConfidence,
        agentId: imageAgent.id,
        keywords: imageMatches,
        suggestedAction: `Möchten Sie ein Bild erstellen mit: "${input}"?`
      };
    }
  }

  return {
    detected: false,
    confidence: 0,
    keywords: [],
  };
}

// Test-Daten
const testCases = {
  positive: [
    { input: "Erstelle ein Bild von einem Löwen", expectedDetection: true, expectedConfidence: "> 0.6" },
    { input: "Ich brauche eine Illustration für den Unterricht", expectedDetection: true, expectedConfidence: "> 0.5" },
    { input: "Kannst du mir ein Arbeitsblatt mit einem Diagramm machen", expectedDetection: true, expectedConfidence: "> 0.6" },
    { input: "Zeige mir eine Visualisierung", expectedDetection: true, expectedConfidence: "> 0.4" },
    { input: "erstelle ein bild", expectedDetection: true, expectedConfidence: "> 0.7" },
    { input: "generiere ein foto", expectedDetection: true, expectedConfidence: "> 0.5" },
    { input: "zeichne einen baum", expectedDetection: true, expectedConfidence: "> 0.6" },
    { input: "male ein haus", expectedDetection: true, expectedConfidence: "> 0.5" },
    { input: "ich brauche ein bild von einem auto", expectedDetection: true, expectedConfidence: "> 0.7" },
    { input: "kannst du ein poster erstellen", expectedDetection: true, expectedConfidence: "> 0.6" },
    { input: "visualisierung für mathematik", expectedDetection: true, expectedConfidence: "> 0.4" },
    { input: "schaubild für physik", expectedDetection: true, expectedConfidence: "> 0.4" }
  ],

  negative: [
    { input: "Wie ist das Wetter heute?", expectedDetection: false, expectedConfidence: "0" },
    { input: "Was ist 2 + 2?", expectedDetection: false, expectedConfidence: "0" },
    { input: "Erzähle mir einen Witz", expectedDetection: false, expectedConfidence: "0" },
    { input: "Wann ist Weihnachten?", expectedDetection: false, expectedConfidence: "0" },
    { input: "Hilfe bei Hausaufgaben", expectedDetection: false, expectedConfidence: "0" },
    { input: "Erkläre mir Photosynthese", expectedDetection: false, expectedConfidence: "0" },
    { input: "Was ist die Hauptstadt von Deutschland?", expectedDetection: false, expectedConfidence: "0" }
  ]
};

function runAgentDetectionTests() {
  console.log('🎯 Starting Agent Detection Logic Tests');
  console.log('='.repeat(60));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  // Test positive cases
  console.log('\n✅ POSITIVE CASES (should trigger agent detection):');
  console.log('-'.repeat(60));

  testCases.positive.forEach((testCase, idx) => {
    totalTests++;
    const result = detectAgentContext(testCase.input);

    const passed = result.detected === testCase.expectedDetection;
    const confidenceCheck = testCase.expectedConfidence.startsWith('>')
      ? result.confidence > parseFloat(testCase.expectedConfidence.substring(1))
      : result.confidence === parseFloat(testCase.expectedConfidence);

    const testPassed = passed && (testCase.expectedDetection ? confidenceCheck : true);

    if (testPassed) {
      passedTests++;
      console.log(`${(idx + 1).toString().padStart(2)}. ✅ "${testCase.input}"`);
      console.log(`      🎯 Detected: ${result.detected}, Confidence: ${result.confidence.toFixed(2)}`);
      if (result.keywords.length > 0) {
        console.log(`      🔍 Keywords: ${result.keywords.slice(0, 3).join(', ')}${result.keywords.length > 3 ? '...' : ''}`);
      }
    } else {
      failedTests.push({
        input: testCase.input,
        expected: testCase.expectedDetection,
        actual: result.detected,
        expectedConfidence: testCase.expectedConfidence,
        actualConfidence: result.confidence.toFixed(2)
      });
      console.log(`${(idx + 1).toString().padStart(2)}. ❌ "${testCase.input}"`);
      console.log(`      🎯 Detected: ${result.detected} (expected: ${testCase.expectedDetection})`);
      console.log(`      📊 Confidence: ${result.confidence.toFixed(2)} (expected: ${testCase.expectedConfidence})`);
    }
  });

  // Test negative cases
  console.log('\n❌ NEGATIVE CASES (should NOT trigger agent detection):');
  console.log('-'.repeat(60));

  testCases.negative.forEach((testCase, idx) => {
    totalTests++;
    const result = detectAgentContext(testCase.input);

    const testPassed = result.detected === testCase.expectedDetection;

    if (testPassed) {
      passedTests++;
      console.log(`${(idx + 1).toString().padStart(2)}. ✅ "${testCase.input}"`);
      console.log(`      🎯 Correctly ignored (confidence: ${result.confidence.toFixed(2)})`);
    } else {
      failedTests.push({
        input: testCase.input,
        expected: testCase.expectedDetection,
        actual: result.detected,
        confidence: result.confidence.toFixed(2)
      });
      console.log(`${(idx + 1).toString().padStart(2)}. ❌ "${testCase.input}"`);
      console.log(`      🎯 Unexpected detection! Confidence: ${result.confidence.toFixed(2)}`);
      if (result.keywords.length > 0) {
        console.log(`      🔍 Keywords: ${result.keywords.join(', ')}`);
      }
    }
  });

  // Summary
  console.log('\n📊 AGENT DETECTION TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`📈 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests.length}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS DETAILS:');
    console.log('-'.repeat(60));
    failedTests.forEach((test, idx) => {
      console.log(`${idx + 1}. "${test.input}"`);
      console.log(`   Expected: ${test.expected}, Got: ${test.actual}`);
      if (test.expectedConfidence) {
        console.log(`   Expected Confidence: ${test.expectedConfidence}, Got: ${test.actualConfidence}`);
      }
    });
  }

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL AGENT DETECTION TESTS PASSED!');
    console.log('✅ Agent detection logic is working correctly');
  } else {
    console.log('\n⚠️  SOME AGENT DETECTION TESTS FAILED');
    console.log('🔧 Review the failed cases above for improvements');
  }

  return {
    totalTests,
    passedTests,
    failedTests: failedTests.length,
    successRate: (passedTests / totalTests) * 100
  };
}

// Run tests
if (typeof require !== 'undefined' && require.main === module) {
  runAgentDetectionTests();
}

module.exports = { runAgentDetectionTests, detectAgentContext };