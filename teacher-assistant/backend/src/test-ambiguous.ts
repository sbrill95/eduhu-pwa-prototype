/**
 * Test script to analyze confidence scores for ambiguous prompts
 *
 * Run with: npx ts-node src/test-ambiguous.ts
 */

import { RouterAgent } from './agents/routerAgent';

const ambiguousPrompts = [
  // Ambiguous category from test data
  { id: 104, prompt: 'Mache es bunter', expected: 'edit_image', expectedConfidence: '<0.7' },
  { id: 105, prompt: 'Füge einen Dinosaurier hinzu', expected: 'edit_image', expectedConfidence: '<0.7' },
  { id: 112, prompt: 'Make it more colorful', expected: 'edit_image', expectedConfidence: '<0.7' },
  { id: 113, prompt: 'Add a volcano', expected: 'edit_image', expectedConfidence: '<0.7' },
  { id: 116, prompt: 'Ein Dinosaurier', expected: 'unknown', expectedConfidence: '<0.7' },
  { id: 117, prompt: 'Bunter', expected: 'unknown', expectedConfidence: '<0.7' },

  // Clear prompts (should stay ≥0.9)
  { id: 1, prompt: 'Create an image of a cat sitting on a tree', expected: 'create_image', expectedConfidence: '≥0.9' },
  { id: 2, prompt: 'Erstelle ein Bild von einem Hund im Park', expected: 'create_image', expectedConfidence: '≥0.9' },
  { id: 3, prompt: 'Edit the image to remove the background', expected: 'edit_image', expectedConfidence: '≥0.9' },
  { id: 4, prompt: 'Ändere das Bild und mache den Himmel blauer', expected: 'edit_image', expectedConfidence: '≥0.9' },
];

async function testPrompts() {
  const routerAgent = new RouterAgent();

  console.log('='.repeat(80));
  console.log('AMBIGUOUS PROMPT CONFIDENCE ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  const results = {
    ambiguousCorrect: 0,
    ambiguousWrong: 0,
    clearCorrect: 0,
    clearWrong: 0,
    total: 0
  };

  for (const testCase of ambiguousPrompts) {
    const result = await routerAgent.execute({ prompt: testCase.prompt });

    const isAmbiguous = testCase.expectedConfidence === '<0.7';
    const confidence = result.data?.confidence || 0;
    const intent = result.data?.intent || 'unknown';

    const confidenceOk = isAmbiguous
      ? confidence < 0.7
      : confidence >= 0.9;

    const intentOk = intent === testCase.expected;

    const status = confidenceOk ? '✅ PASS' : '❌ FAIL';

    console.log(`[ID ${testCase.id}] ${status}`);
    console.log(`  Prompt: "${testCase.prompt}"`);
    console.log(`  Expected: ${testCase.expected} with confidence ${testCase.expectedConfidence}`);
    console.log(`  Actual:   ${intent} with confidence ${confidence.toFixed(2)}`);
    console.log(`  Intent: ${intentOk ? '✅' : '❌'} | Confidence: ${confidenceOk ? '✅' : '❌'}`);
    console.log('');

    results.total++;
    if (isAmbiguous) {
      if (confidenceOk) results.ambiguousCorrect++;
      else results.ambiguousWrong++;
    } else {
      if (confidenceOk) results.clearCorrect++;
      else results.clearWrong++;
    }
  }

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Ambiguous prompts: ${results.ambiguousCorrect}/${results.ambiguousCorrect + results.ambiguousWrong} correct (should be <0.7)`);
  console.log(`Clear prompts:     ${results.clearCorrect}/${results.clearCorrect + results.clearWrong} correct (should be ≥0.9)`);
  console.log(`Total:             ${results.ambiguousCorrect + results.clearCorrect}/${results.total} correct`);
  console.log('');

  const ambiguousPassRate = (results.ambiguousCorrect / (results.ambiguousCorrect + results.ambiguousWrong)) * 100;
  const clearPassRate = (results.clearCorrect / (results.clearCorrect + results.clearWrong)) * 100;

  console.log(`Ambiguous Pass Rate: ${ambiguousPassRate.toFixed(1)}%`);
  console.log(`Clear Pass Rate:     ${clearPassRate.toFixed(1)}%`);
  console.log('');

  if (ambiguousPassRate < 100) {
    console.log('⚠️  BUG CONFIRMED: Ambiguous prompts getting too high confidence');
    console.log('    Need to adjust confidence scoring algorithm');
  } else {
    console.log('✅ All prompts classified with correct confidence levels');
  }
}

testPrompts().catch(console.error);
