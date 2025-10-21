/**
 * Integration Tests for Image Generation API Endpoint
 * Story 3.0.3: POST /api/agents-sdk/image/generate
 *
 * Tests cover:
 * - Request validation
 * - Response format
 * - Error responses (400, 500)
 * - All parameter combinations
 * - Gemini form input support
 * - Test mode support
 */

import request from 'supertest';
import express, { Express } from 'express';
import agentsSdkRouter from '../agentsSdk';
import { imageGenerationAgent } from '../../agents/imageGenerationAgent';

// Mock the agent
jest.mock('../../agents/imageGenerationAgent', () => ({
  imageGenerationAgent: {
    execute: jest.fn(),
    validateParams: jest.fn(),
    canExecute: jest.fn(),
    estimateCost: jest.fn(),
  },
}));

jest.mock('../../config/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe('POST /api/agents-sdk/image/generate', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/agents-sdk', agentsSdkRouter);

    jest.clearAllMocks();

    // Default: successful execution
    (imageGenerationAgent.execute as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        image_url: 'https://example.com/image.png',
        revised_prompt: 'Test revised prompt',
        title: 'Test Title',
        tags: ['tag1', 'tag2'],
        educational_optimized: false,
        originalParams: {
          description: 'Test',
          imageStyle: 'illustrative',
          learningGroup: '',
          subject: '',
        },
      },
      cost: 4,
      metadata: {
        processing_time: 5000,
        model: 'dall-e-3',
        size: '1024x1024',
        quality: 'standard',
      },
      artifacts: [
        {
          id: 'test-artifact-123',
          title: 'Test Title',
          type: 'image',
          content: JSON.stringify({
            image_url: 'https://example.com/image.png',
          }),
          created_at: Date.now(),
          updated_at: Date.now(),
          is_favorite: false,
          usage_count: 0,
          tags: ['tag1', 'tag2'],
          creator: {} as any,
          feedback_received: [] as any[],
        },
      ],
    });
  });

  describe('Successful Requests', () => {
    it('should generate image with minimal parameters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Ein Baum mit grünen Blättern',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.image_url).toBe(
        'https://example.com/image.png'
      );
      expect(response.body.data.title).toBe('Test Title');
      expect(response.body.data.tags).toEqual(['tag1', 'tag2']);
      expect(response.body.cost).toBe(4);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.artifacts).toHaveLength(1);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should accept all size parameters', async () => {
      const sizes = ['1024x1024', '1024x1792', '1792x1024'];

      for (const size of sizes) {
        const response = await request(app)
          .post('/api/agents-sdk/image/generate')
          .send({
            prompt: 'Test',
            size,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
          expect.objectContaining({ size }),
          expect.any(String),
          undefined
        );
      }
    });

    it('should accept all quality parameters', async () => {
      const qualities = ['standard', 'hd'];

      for (const quality of qualities) {
        jest.clearAllMocks();

        const response = await request(app)
          .post('/api/agents-sdk/image/generate')
          .send({
            prompt: 'Test',
            quality,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
          expect.objectContaining({ quality }),
          expect.any(String),
          undefined
        );
      }
    });

    it('should accept all style parameters', async () => {
      const styles = ['vivid', 'natural'];

      for (const style of styles) {
        jest.clearAllMocks();

        const response = await request(app)
          .post('/api/agents-sdk/image/generate')
          .send({
            prompt: 'Test',
            style,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
          expect.objectContaining({ style }),
          expect.any(String),
          undefined
        );
      }
    });

    it('should accept educational context parameters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
          educationalContext: 'Grundschule',
          targetAgeGroup: 'Klasse 3',
          subject: 'Mathematik',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          educationalContext: 'Grundschule',
          targetAgeGroup: 'Klasse 3',
          subject: 'Mathematik',
        }),
        expect.any(String),
        undefined
      );
    });

    it('should accept Gemini form input with description', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          description: 'Ein Diagramm zur Photosynthese',
          imageStyle: 'illustrative',
          learningGroup: 'Klasse 7',
          subject: 'Biologie',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Ein Diagramm zur Photosynthese',
          description: 'Ein Diagramm zur Photosynthese',
          imageStyle: 'illustrative',
          learningGroup: 'Klasse 7',
          subject: 'Biologie',
        }),
        expect.any(String),
        undefined
      );
    });

    it('should accept all imageStyle values', async () => {
      const imageStyles = ['realistic', 'cartoon', 'illustrative', 'abstract'];

      for (const imageStyle of imageStyles) {
        jest.clearAllMocks();

        const response = await request(app)
          .post('/api/agents-sdk/image/generate')
          .send({
            description: 'Test',
            imageStyle,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should handle enhancePrompt flag', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Ein deutscher Prompt',
          enhancePrompt: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          enhancePrompt: true,
        }),
        expect.any(String),
        undefined
      );
    });

    it('should use prompt when both prompt and description provided', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Explicit prompt',
          description: 'Description',
          imageStyle: 'realistic',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Prompt takes priority if provided
      expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Explicit prompt',
          description: 'Description',
        }),
        expect.any(String),
        undefined
      );
    });
  });

  describe('Validation Errors (400)', () => {
    it('should reject request with no prompt and no description', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          size: '1024x1024',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        'prompt oder description ist erforderlich'
      );
    });

    it('should reject prompt shorter than 3 characters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'AB',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject prompt longer than 1000 characters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'A'.repeat(1001),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid size', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
          size: '512x512',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Size');
    });

    it('should reject invalid quality', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
          quality: 'ultra',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Quality');
    });

    it('should reject invalid style', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
          style: 'artistic',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Style');
    });

    it('should reject invalid imageStyle', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          description: 'Test',
          imageStyle: 'invalid-style',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ImageStyle');
    });

    it('should reject non-string prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 123,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should trim whitespace and validate', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: '   ',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Agent Execution Errors (500)', () => {
    it('should return 500 if agent execution fails', async () => {
      (imageGenerationAgent.execute as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Monatliches Limit erreicht',
      });

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Monatliches Limit erreicht');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 500 if agent throws exception', async () => {
      (imageGenerationAgent.execute as jest.Mock).mockRejectedValue(
        new Error('Internal agent error')
      );

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Interner Server-Fehler');
    });

    it('should handle OpenAI rate limit errors', async () => {
      (imageGenerationAgent.execute as jest.Mock).mockResolvedValue({
        success: false,
        error:
          'OpenAI ist momentan überlastet. Bitte versuche es in einigen Minuten erneut.',
      });

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('überlastet');
    });

    it('should handle quota exceeded errors', async () => {
      (imageGenerationAgent.execute as jest.Mock).mockResolvedValue({
        success: false,
        error: 'OpenAI-Kontingent erschöpft. Bitte versuche es später wieder.',
      });

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Kontingent');
    });

    it('should handle content policy violations', async () => {
      (imageGenerationAgent.execute as jest.Mock).mockResolvedValue({
        success: false,
        error:
          'Dein Prompt wurde vom Inhaltsfilter blockiert. Bitte verwende andere Begriffe.',
      });

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Blocked content',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Inhaltsfilter');
    });
  });

  describe('Response Format', () => {
    it('should return complete response structure', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(200);

      // Top-level fields
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('cost');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('artifacts');
      expect(response.body).toHaveProperty('timestamp');

      // Data fields
      expect(response.body.data).toHaveProperty('image_url');
      expect(response.body.data).toHaveProperty('revised_prompt');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('tags');
      expect(response.body.data).toHaveProperty('educational_optimized');
      expect(response.body.data).toHaveProperty('originalParams');

      // Metadata fields
      expect(response.body.metadata).toHaveProperty('processing_time');
      expect(response.body.metadata).toHaveProperty('model');
      expect(response.body.metadata).toHaveProperty('size');
      expect(response.body.metadata).toHaveProperty('quality');

      // Artifacts
      expect(Array.isArray(response.body.artifacts)).toBe(true);
      expect(response.body.artifacts[0]).toHaveProperty('id');
      expect(response.body.artifacts[0]).toHaveProperty('title');
      expect(response.body.artifacts[0]).toHaveProperty('type');
      expect(response.body.artifacts[0]).toHaveProperty('content');
      expect(response.body.artifacts[0]).toHaveProperty('tags');
    });

    it('should include timestamp in all responses', async () => {
      const beforeTimestamp = Date.now();

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(200);

      const afterTimestamp = Date.now();

      expect(response.body.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(response.body.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should include timestamp in error responses', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'AB', // Too short
        })
        .expect(400);

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('number');
    });
  });

  describe('Request Logging', () => {
    it('should log request details', async () => {
      await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test prompt',
        })
        .expect(200);

      expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt',
        }),
        'test-user-id', // Default test user
        undefined
      );
    });

    it('should pass userId from request context if available', async () => {
      // This would be set by auth middleware in production
      await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(200);

      expect(imageGenerationAgent.execute).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        undefined
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional fields', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
          educationalContext: '',
          targetAgeGroup: '',
          subject: '',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle special characters in prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Das "Goldene Zeitalter" & die Renaissance: €100 + 50%',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle German umlauts in prompt', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Übungen für Schüler über Größe und Äpfel',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle very long valid prompts', async () => {
      const longPrompt = 'Ein detailliertes Bild für den Unterricht. '.repeat(
        30
      );

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: longPrompt.substring(0, 1000), // Exactly at limit
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle mixed Gemini and legacy parameters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          description: 'Test description',
          imageStyle: 'realistic',
          size: '1024x1792',
          quality: 'hd',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Test Mode Support', () => {
    it('should work in test mode', async () => {
      process.env.VITE_TEST_MODE = 'true';

      const response = await request(app)
        .post('/api/agents-sdk/image/generate')
        .send({
          prompt: 'Test',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      delete process.env.VITE_TEST_MODE;
    });
  });
});
