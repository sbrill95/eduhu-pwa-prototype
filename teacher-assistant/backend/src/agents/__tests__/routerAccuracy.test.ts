import { RouterAgent } from '../routerAgent';
import testData from './routerTestData.json';

/**
 * Router Agent Accuracy Testing
 *
 * Tests classification accuracy against 100-sample test dataset.
 * Requirement: ≥95% accuracy (AC2)
 */

describe('Router Agent Accuracy Tests', () => {
  let routerAgent: RouterAgent;

  beforeAll(() => {
    routerAgent = new RouterAgent();
  });

  /**
   * Test accuracy on full 100-sample dataset
   * Target: ≥95% accuracy
   */
  test('should achieve ≥95% accuracy on 100-sample test dataset', async () => {
    const results = {
      total: 0,
      correct: 0,
      incorrect: 0,
      failed: 0,
      byIntent: {
        create_image: { correct: 0, incorrect: 0, total: 0 },
        edit_image: { correct: 0, incorrect: 0, total: 0 },
      },
      failures: [] as Array<{
        id: number;
        prompt: string;
        expected: string;
        actual: string;
        confidence: number;
      }>,
    };

    // Run classification on all samples
    for (const sample of testData.samples) {
      results.total += 1;

      try {
        const result = await routerAgent.execute({
          prompt: sample.prompt,
        });

        if (result.success && result.data) {
          const classified = result.data.intent;
          const expected = sample.expectedIntent;

          // Track by expected intent
          if (expected === 'create_image' || expected === 'edit_image') {
            results.byIntent[expected].total += 1;

            if (classified === expected) {
              results.correct += 1;
              results.byIntent[expected].correct += 1;
            } else {
              results.incorrect += 1;
              results.byIntent[expected].incorrect += 1;
              results.failures.push({
                id: sample.id,
                prompt: sample.prompt,
                expected: expected,
                actual: classified,
                confidence: result.data.confidence,
              });
            }
          }
        } else {
          results.failed += 1;
        }
      } catch (error) {
        results.failed += 1;
        console.error(`Failed to classify sample ${sample.id}:`, error);
      }
    }

    // Calculate accuracy
    const accuracy = (results.correct / results.total) * 100;
    const createAccuracy =
      (results.byIntent.create_image.correct /
        results.byIntent.create_image.total) *
      100;
    const editAccuracy =
      (results.byIntent.edit_image.correct /
        results.byIntent.edit_image.total) *
      100;

    // Generate report
    console.log('\n========== ROUTER AGENT ACCURACY REPORT ==========');
    console.log(`Total Samples: ${results.total}`);
    console.log(`Correct: ${results.correct}`);
    console.log(`Incorrect: ${results.incorrect}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`\nOverall Accuracy: ${accuracy.toFixed(2)}%`);
    console.log(`\nAccuracy by Intent:`);
    console.log(
      `  Create Image: ${createAccuracy.toFixed(2)}% (${results.byIntent.create_image.correct}/${results.byIntent.create_image.total})`
    );
    console.log(
      `  Edit Image: ${editAccuracy.toFixed(2)}% (${results.byIntent.edit_image.correct}/${results.byIntent.edit_image.total})`
    );

    if (results.failures.length > 0) {
      console.log(`\n❌ Misclassifications (${results.failures.length}):`);
      results.failures.slice(0, 10).forEach((failure) => {
        console.log(
          `  #${failure.id}: "${failure.prompt.substring(0, 50)}..."`
        );
        console.log(
          `    Expected: ${failure.expected}, Got: ${failure.actual} (confidence: ${failure.confidence.toFixed(2)})`
        );
      });
      if (results.failures.length > 10) {
        console.log(`  ... and ${results.failures.length - 10} more`);
      }
    }

    console.log('==================================================\n');

    // Assert ≥95% accuracy requirement
    expect(accuracy).toBeGreaterThanOrEqual(95);
  }, 120000); // 2-minute timeout for 100 samples

  /**
   * Test create_image classification accuracy
   * Should correctly identify image creation intents
   */
  test('should correctly classify create_image intents', async () => {
    const createSamples = testData.samples
      .filter((s) => s.expectedIntent === 'create_image')
      .slice(0, 10);

    let correct = 0;
    for (const sample of createSamples) {
      const result = await routerAgent.execute({ prompt: sample.prompt });
      if (result.success && result.data?.intent === 'create_image') {
        correct += 1;
      }
    }

    const accuracy = (correct / createSamples.length) * 100;
    expect(accuracy).toBeGreaterThanOrEqual(90);
  }, 30000);

  /**
   * Test edit_image classification accuracy
   * Should correctly identify image editing intents
   */
  test('should correctly classify edit_image intents', async () => {
    const editSamples = testData.samples
      .filter((s) => s.expectedIntent === 'edit_image')
      .slice(0, 10);

    let correct = 0;
    for (const sample of editSamples) {
      const result = await routerAgent.execute({ prompt: sample.prompt });
      if (result.success && result.data?.intent === 'edit_image') {
        correct += 1;
      }
    }

    const accuracy = (correct / editSamples.length) * 100;
    expect(accuracy).toBeGreaterThanOrEqual(90);
  }, 30000);

  /**
   * Test German language classification
   * Should handle German prompts with high accuracy
   */
  test('should handle German prompts with high accuracy', async () => {
    const germanSamples = testData.samples
      .filter((s) => s.language === 'de')
      .slice(0, 10);

    let correct = 0;
    for (const sample of germanSamples) {
      const result = await routerAgent.execute({ prompt: sample.prompt });
      if (result.success && result.data?.intent === sample.expectedIntent) {
        correct += 1;
      }
    }

    const accuracy = (correct / germanSamples.length) * 100;
    expect(accuracy).toBeGreaterThanOrEqual(90);
  }, 30000);

  /**
   * Test English language classification
   * Should handle English prompts with high accuracy
   */
  test('should handle English prompts with high accuracy', async () => {
    const englishSamples = testData.samples
      .filter((s) => s.language === 'en')
      .slice(0, 10);

    let correct = 0;
    for (const sample of englishSamples) {
      const result = await routerAgent.execute({ prompt: sample.prompt });
      if (result.success && result.data?.intent === sample.expectedIntent) {
        correct += 1;
      }
    }

    const accuracy = (correct / englishSamples.length) * 100;
    expect(accuracy).toBeGreaterThanOrEqual(90);
  }, 30000);

  /**
   * Test confidence scores
   * Should provide meaningful confidence scores
   */
  test('should provide confidence scores ≥0.7 for correct classifications', async () => {
    const samples = testData.samples.slice(0, 20);
    const confidenceScores: number[] = [];

    for (const sample of samples) {
      const result = await routerAgent.execute({ prompt: sample.prompt });
      if (result.success && result.data) {
        if (result.data.intent === sample.expectedIntent) {
          confidenceScores.push(result.data.confidence);
        }
      }
    }

    // At least 80% of correct classifications should have confidence ≥0.7
    const highConfidence = confidenceScores.filter((c) => c >= 0.7).length;
    const highConfidenceRate = (highConfidence / confidenceScores.length) * 100;

    expect(highConfidenceRate).toBeGreaterThanOrEqual(80);
  }, 60000);
});
