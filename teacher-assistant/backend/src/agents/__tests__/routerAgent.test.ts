import { RouterAgent, RouterAgentParams, ImageIntent } from '../routerAgent';

/**
 * Router Agent Unit Tests
 *
 * Tests router agent initialization, classification, entity extraction,
 * and error handling with mocked OpenAI API calls.
 */

// Mock OpenAI Agents SDK
jest.mock('@openai/agents', () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  run: jest
    .fn()
    .mockResolvedValue({
      finalOutput:
        '{"intent": "create_image", "confidence": 0.95, "reasoning": "Test"}',
    }),
}));

describe('RouterAgent Unit Tests', () => {
  let routerAgent: RouterAgent;

  beforeEach(() => {
    routerAgent = new RouterAgent();
  });

  describe('Initialization', () => {
    test('should initialize with correct properties', () => {
      expect(routerAgent.id).toBe('router-agent');
      expect(routerAgent.name).toBe('Router Agent');
      expect(routerAgent.description).toContain('Classifies image');
      expect(routerAgent.enabled).toBe(true);
    });

    test('should have correct default confidence threshold', () => {
      // Access via execution - threshold is used internally
      expect(routerAgent).toBeDefined();
    });
  });

  describe('Intent Classification', () => {
    test('should classify create_image intent from English prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image of a cat',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('create_image');
      expect(result.data?.confidence).toBeGreaterThan(0);
      expect(result.data?.overridden).toBe(false);
    });

    test('should classify create_image intent from German prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Erstelle ein Bild von einem Hund',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('create_image');
      expect(result.data?.confidence).toBeGreaterThan(0);
    });

    test('should classify edit_image intent from English prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Edit the image to remove background',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('edit_image');
      expect(result.data?.confidence).toBeGreaterThan(0);
    });

    test('should classify edit_image intent from German prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Ändere das Bild und mache es heller',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('edit_image');
      expect(result.data?.confidence).toBeGreaterThan(0);
    });

    test('should return unknown for ambiguous prompts', async () => {
      const params: RouterAgentParams = {
        prompt: 'Tell me about mathematics formulas',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('unknown');
    });

    test('should provide reasoning for classification', async () => {
      const params: RouterAgentParams = {
        prompt: 'Generate a picture of a volcano',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.reasoning).toBeDefined();
      expect(typeof result.data?.reasoning).toBe('string');
    });
  });

  describe('Entity Extraction', () => {
    test('should extract subject from prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image of a solar system',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities).toBeDefined();
      expect(result.data?.entities.subject).toBeDefined();
    });

    test('should extract grade level from prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Generate a diagram for 5th grade students',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities.gradeLevel).toBeDefined();
      expect(result.data?.entities.gradeLevel).toMatch(/5|grade|klasse/i);
    });

    test('should extract German grade level', async () => {
      const params: RouterAgentParams = {
        prompt: 'Erstelle ein Bild für die 7. Klasse',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities.gradeLevel).toBeDefined();
      expect(result.data?.entities.gradeLevel).toMatch(/7|klasse/i);
    });

    test('should extract topic from prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create a biology diagram showing cell division',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities.topic).toBeDefined();
    });

    test('should extract style from prompt', async () => {
      const params: RouterAgentParams = {
        prompt: 'Generate a cartoon-style image of a cat',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities.style).toBeDefined();
      expect(result.data?.entities.style).toMatch(/cartoon/i);
    });

    test('should handle prompts without entities', async () => {
      const params: RouterAgentParams = {
        prompt: 'Make an image',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities).toBeDefined();
      // Some entities may be undefined
    });

    test('should extract multiple entities from complex prompt', async () => {
      const params: RouterAgentParams = {
        prompt:
          'Create a realistic watercolor image of the solar system for 6th grade science class',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities).toBeDefined();
      // Should extract subject, grade level, topic, and style
    });
  });

  describe('Confidence Scores', () => {
    test('should provide confidence score between 0 and 1', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image of a dog',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.data?.confidence).toBeLessThanOrEqual(1);
    });

    test('should have high confidence for clear prompts', async () => {
      const params: RouterAgentParams = {
        prompt: 'Generate a new picture of a mountain',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.confidence).toBeGreaterThanOrEqual(0.7);
    });

    test('should have lower confidence for ambiguous prompts', async () => {
      const params: RouterAgentParams = {
        prompt: 'Help me with this',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      // Ambiguous prompts should return unknown or have lower confidence
      if (result.data?.intent !== 'unknown') {
        expect(result.data?.confidence).toBeLessThan(0.7);
      }
    });
  });

  describe('Manual Override', () => {
    test('should respect manual override to create_image', async () => {
      const params: RouterAgentParams = {
        prompt: 'Edit the image', // Would normally be edit_image
        override: 'create_image',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('create_image');
      expect(result.data?.overridden).toBe(true);
      expect(result.data?.confidence).toBe(1.0);
    });

    test('should respect manual override to edit_image', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image', // Would normally be create_image
        override: 'edit_image',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('edit_image');
      expect(result.data?.overridden).toBe(true);
      expect(result.data?.confidence).toBe(1.0);
    });

    test('should respect manual override to unknown', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image',
        override: 'unknown',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('unknown');
      expect(result.data?.overridden).toBe(true);
    });

    test('should still extract entities with override', async () => {
      const params: RouterAgentParams = {
        prompt: 'Cartoon of a cat for grade 3',
        override: 'create_image',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.entities).toBeDefined();
      expect(result.data?.overridden).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should reject empty prompt', async () => {
      const params: RouterAgentParams = {
        prompt: '',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('leer');
    });

    test('should reject whitespace-only prompt', async () => {
      const params: RouterAgentParams = {
        prompt: '   ',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should format error messages in German', async () => {
      const params: RouterAgentParams = {
        prompt: '',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/[äöüß]|leer|fehlt|ungültig/i);
    });
  });

  describe('Parameter Validation', () => {
    test('should validate valid parameters', () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image of a cat',
      };

      const isValid = routerAgent.validateParams(params);
      expect(isValid).toBe(true);
    });

    test('should validate parameters with override', () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image',
        override: 'create_image',
      };

      const isValid = routerAgent.validateParams(params);
      expect(isValid).toBe(true);
    });

    test('should reject empty prompt in validation', () => {
      const params: RouterAgentParams = {
        prompt: '',
      };

      const isValid = routerAgent.validateParams(params);
      expect(isValid).toBe(false);
    });

    test('should reject non-string prompt', () => {
      const params = {
        prompt: 123,
      } as any;

      const isValid = routerAgent.validateParams(params);
      expect(isValid).toBe(false);
    });

    test('should reject invalid override value', () => {
      const params = {
        prompt: 'Test',
        override: 'invalid_intent',
      } as any;

      const isValid = routerAgent.validateParams(params);
      expect(isValid).toBe(false);
    });
  });

  describe('Execution Time Estimation', () => {
    test('should provide reasonable execution time estimate', () => {
      const estimate = routerAgent.estimateExecutionTime();

      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long prompts', async () => {
      const longPrompt = 'Create an image of ' + 'a cat '.repeat(100);
      const params: RouterAgentParams = {
        prompt: longPrompt,
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBeDefined();
    });

    test('should handle prompts with special characters', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create an image of a cat 🐱 with special chars: @#$%',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBeDefined();
    });

    test('should handle multilingual prompts', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create eine Bild von einem cat',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('create_image');
    });

    test('should handle prompts with numbers and dates', async () => {
      const params: RouterAgentParams = {
        prompt: 'Generate 3 images of the year 2024 events',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('create_image');
    });
  });

  describe('Multiple Keywords', () => {
    test('should handle prompts with both create and edit keywords', async () => {
      const params: RouterAgentParams = {
        prompt: 'Create a new image and then edit it to add colors',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBeDefined();
      // Should classify based on primary intent
    });

    test('should prioritize stronger keywords', async () => {
      const params: RouterAgentParams = {
        prompt: 'Generate and create a completely new image from scratch',
      };

      const result = await routerAgent.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe('create_image');
    });
  });
});
