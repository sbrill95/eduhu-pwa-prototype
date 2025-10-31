import request from 'supertest';
import express, { Express } from 'express';
import agentsSdkRoutes from '../agentsSdk';

/**
 * Router Endpoint Integration Tests
 *
 * Tests POST /api/agents-sdk/router/classify endpoint
 * with validation, error handling, and override functionality.
 */

// Mock the router agent
jest.mock('../../agents/routerAgent', () => ({
  routerAgent: {
    execute: jest.fn().mockImplementation(async (params) => {
      // Mock successful classification
      if (params.prompt && params.prompt.trim().length > 0) {
        const intent =
          params.override ||
          (params.prompt.toLowerCase().includes('edit')
            ? 'edit_image'
            : 'create_image');
        return {
          success: true,
          data: {
            intent: intent,
            confidence: params.override ? 1.0 : 0.95,
            entities: {
              subject: 'test subject',
              gradeLevel: '5. Klasse',
            },
            reasoning: 'Test classification',
            overridden: !!params.override,
          },
        };
      }

      // Mock error for empty prompt
      return {
        success: false,
        error: 'Prompt darf nicht leer sein',
      };
    }),
  },
}));

describe('Router Endpoint Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/agents-sdk', agentsSdkRoutes);
  });

  describe('POST /api/agents-sdk/router/classify', () => {
    test('should classify create_image intent successfully', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image of a cat',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.intent).toBe('create_image');
      expect(response.body.data.confidence).toBeGreaterThan(0);
      expect(response.body.data.entities).toBeDefined();
      expect(response.body.data.overridden).toBe(false);
      expect(response.body.timestamp).toBeDefined();
    });

    test('should classify edit_image intent successfully', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Edit the image to remove background',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.intent).toBe('edit_image');
      expect(response.body.data.confidence).toBeGreaterThan(0);
    });

    test('should handle German prompts', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Erstelle ein Bild von einem Hund',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.intent).toBe('create_image');
    });

    test('should return entities in response', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create a cartoon image for grade 5 science',
        })
        .expect(200);

      expect(response.body.data.entities).toBeDefined();
      expect(typeof response.body.data.entities).toBe('object');
    });

    test('should include reasoning in response', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Generate a picture of a volcano',
        })
        .expect(200);

      expect(response.body.data.reasoning).toBeDefined();
      expect(typeof response.body.data.reasoning).toBe('string');
    });

    test('should provide confidence score', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Draw a diagram of the solar system',
        })
        .expect(200);

      expect(response.body.data.confidence).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.data.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Manual Override Functionality', () => {
    test('should accept manual override to create_image', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Edit the image',
          override: 'create_image',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.intent).toBe('create_image');
      expect(response.body.data.overridden).toBe(true);
      expect(response.body.data.confidence).toBe(1.0);
    });

    test('should accept manual override to edit_image', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image',
          override: 'edit_image',
        })
        .expect(200);

      expect(response.body.data.intent).toBe('edit_image');
      expect(response.body.data.overridden).toBe(true);
    });

    test('should accept manual override to unknown', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image',
          override: 'unknown',
        })
        .expect(200);

      expect(response.body.data.intent).toBe('unknown');
      expect(response.body.data.overridden).toBe(true);
    });

    test('should reject invalid override value', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image',
          override: 'invalid_intent',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    test('should reject missing prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should reject empty prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('leer');
    });

    test('should reject whitespace-only prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: '   ',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject prompt that is too short', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'ab',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/zeichen/i);
    });

    test('should reject prompt that is too long', async () => {
      const longPrompt = 'a'.repeat(2001);
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: longPrompt,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject non-string prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 12345,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid JSON body', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express will handle invalid JSON parsing
    });
  });

  describe('Error Handling', () => {
    test('should return German error messages', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: '',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toMatch(/[äöü]|leer|fehlt/i);
    });

    test('should include timestamp in error response', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: '',
        })
        .expect(400);

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('number');
    });

    test('should handle agent execution failure gracefully', async () => {
      // Mock agent failure
      const { routerAgent } = require('../../agents/routerAgent');
      routerAgent.execute.mockResolvedValueOnce({
        success: false,
        error: 'Test error',
      });

      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Test prompt',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Response Format', () => {
    test('should return standardized success response format', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(true);
    });

    test('should return standardized error response format', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(false);
    });

    test('should have correct content-type header', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image',
        })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance', () => {
    test('should respond within reasonable time', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image of a cat',
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Less than 5 seconds
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post('/api/agents-sdk/router/classify')
            .send({
              prompt: `Create image ${i}`,
            })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle prompt with special characters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image with special chars: @#$%^&*()',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle prompt with unicode characters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Erstelle ein Bild von 🐱 Katze mit Emojis 🎨',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle prompt with line breaks', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'Create an image\nof a cat\nwith multiple lines',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle very short valid prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: 'abc',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle maximum length prompt', async () => {
      // Create exactly 2000 char prompt (max allowed)
      const basePrompt = 'Create an image of ';
      const filler = 'a cat '.repeat(330); // Adjust to reach exactly 2000
      const maxPrompt = (basePrompt + filler).substring(0, 2000);

      const response = await request(app)
        .post('/api/agents-sdk/router/classify')
        .send({
          prompt: maxPrompt,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
