import { routerAgent } from './src/agents/routerAgent';

async function testAmbiguousPrompts() {
  console.log('=== Testing Ambiguous Prompts ===\n');

  const ambiguousPrompts = [
    'Mache das bunter',
    'Mache es bunter',
    'Add a volcano',
    'Füge einen Dinosaurier hinzu',
    'Make it more colorful',
    'Ein Dinosaurier',
    'Bunter',
  ];

  for (const prompt of ambiguousPrompts) {
    const result = await routerAgent.execute({ prompt });
    console.log(`Prompt: "${prompt}"`);
    console.log(`  Intent: ${result.data?.intent}`);
    console.log(`  Confidence: ${result.data?.confidence}`);
    console.log(`  Needs Manual Selection: ${result.data?.needsManualSelection}`);
    console.log(`  Expected: confidence < 0.9, needsManualSelection = true`);
    console.log(`  Status: ${result.data?.needsManualSelection ? '✅ PASS' : '❌ FAIL'}\n`);
  }
}

testAmbiguousPrompts().catch(console.error);
