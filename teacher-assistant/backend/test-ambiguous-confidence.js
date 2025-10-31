/**
 * Test ambiguous prompts that should trigger RouterOverride (confidence < 0.9)
 */

const { RouterAgent } = require('./dist/agents/routerAgent');

async function testAmbiguousPrompts() {
  const agent = new RouterAgent();

  const prompts = [
    'Mache das bunter',                    // AC3: Should show RouterOverride
    'Füge einen Dinosaurier hinzu',        // AC4/AC5: Should show RouterOverride
    'Erstelle ein Bild von einem Dinosaurier',  // Should NOT show (high confidence)
  ];

  console.log('\n=== Testing Ambiguous Prompt Confidence ===\n');

  for (const prompt of prompts) {
    const result = await agent.execute({ prompt });

    if (result.success && result.data) {
      const { intent, confidence, needsManualSelection } = result.data;
      const status = needsManualSelection ? '✅ SHOWS RouterOverride' : '❌ AUTO-ROUTES';

      console.log(`Prompt: "${prompt}"`);
      console.log(`  Intent: ${intent}`);
      console.log(`  Confidence: ${confidence.toFixed(2)}`);
      console.log(`  needsManualSelection: ${needsManualSelection}`);
      console.log(`  Status: ${status}`);
      console.log('');
    } else {
      console.log(`Prompt: "${prompt}"`);
      console.log(`  ERROR: ${result.error}`);
      console.log('');
    }
  }
}

testAmbiguousPrompts().catch(console.error);
