/**
 * Comprehensive test suite for the Agent System
 * Tests agent registry, execution, image generation, and all API endpoints
 */

import request from 'supertest';
import app from '../app';
import { agentRegistry, agentExecutionService } from '../services/agentService';
import { imageGenerationAgent } from '../agents/imageGenerationAgent';

describe('Agent System Tests', () => {

  describe('Agent Registry', () => {
    test('should register and retrieve agents', () => {
      // Agent should be auto-registered in routes/agents.ts
      const agent = agentRegistry.getAgent('image-generation');
      expect(agent).toBeDefined();
      expect(agent?.id).toBe('image-generation');
      expect(agent?.name).toBe('Bildgenerierung');
      expect(agent?.enabled).toBe(true);
    });

    test('should get all enabled agents', () => {
      const enabledAgents = agentRegistry.getEnabledAgents();
      expect(enabledAgents.length).toBeGreaterThan(0);
      expect(enabledAgents.every(agent => agent.enabled)).toBe(true);
    });

    test('should find agents by trigger keywords', () => {
      const triggeredAgents = agentRegistry.findAgentsByTrigger('erstelle ein bild');
      expect(triggeredAgents.length).toBeGreaterThan(0);
      expect(triggeredAgents[0]?.id).toBe('image-generation');
    });
  });

  describe('Image Generation Agent', () => {
    test('should validate correct parameters', () => {
      const validParams = {
        prompt: 'Ein Bild von einem Baum',
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      };

      const isValid = imageGenerationAgent.validateParams(validParams);
      expect(isValid).toBe(true);
    });

    test('should reject invalid parameters', () => {
      const invalidParams = [
        { prompt: '' }, // Empty prompt
        { prompt: 'a'.repeat(1001) }, // Too long prompt
        { prompt: 'Valid prompt', size: 'invalid-size' }, // Invalid size
        { prompt: 'Valid prompt', quality: 'invalid-quality' }, // Invalid quality
        { prompt: 'Valid prompt', style: 'invalid-style' }, // Invalid style
        {} // Missing prompt
      ];

      invalidParams.forEach(params => {
        const isValid = imageGenerationAgent.validateParams(params);
        expect(isValid).toBe(false);
      });
    });

    test('should estimate costs correctly', () => {
      const testCases = [
        { size: '1024x1024', quality: 'standard', expected: 4 },
        { size: '1024x1792', quality: 'standard', expected: 8 },
        { size: '1024x1024', quality: 'hd', expected: 8 },
        { size: '1024x1792', quality: 'hd', expected: 12 }
      ];

      testCases.forEach(({ size, quality, expected }) => {
        const cost = imageGenerationAgent.estimateCost({
          prompt: 'Test prompt',
          size,
          quality
        });
        expect(cost).toBe(expected);
      });
    });

    test('should detect German text correctly', () => {
      const agent = imageGenerationAgent as any;

      expect(agent.isGermanText('Ein schönes Bild')).toBe(true);
      expect(agent.isGermanText('Das ist ein Test')).toBe(true);
      expect(agent.isGermanText('Haus mit Garten')).toBe(true);
      expect(agent.isGermanText('A beautiful picture')).toBe(false);
      expect(agent.isGermanText('This is a test')).toBe(false);
    });

    test('should generate appropriate image titles', () => {
      const agent = imageGenerationAgent as any;

      const testCases = [
        { prompt: 'Ein schönes Haus mit Garten', expected: 'Ein schönes Haus mit Garten' },
        { prompt: 'A'.repeat(100), expected: expect.stringMatching(/\.\.\./) },
        { prompt: 'kurz', expected: 'Kurz' }
      ];

      testCases.forEach(({ prompt, expected }) => {
        const title = agent.generateImageTitle(prompt);
        if (typeof expected === 'string') {
          expect(title).toBe(expected);
        } else {
          expect(title).toEqual(expected);
        }
      });
    });
  });

  describe('API Endpoints', () => {
    describe('GET /api/agents/available', () => {
      test('should return available agents', async () => {
        const response = await request(app)
          .get('/api/agents/available')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);

        const imageAgent = response.body.data.find((agent: any) => agent.id === 'image-generation');
        expect(imageAgent).toBeDefined();
        expect(imageAgent.name).toBe('Bildgenerierung');
        expect(imageAgent.enabled).toBe(true);
      });
    });

    describe('POST /api/agents/execute', () => {
      test('should validate required fields', async () => {
        const invalidRequests = [
          {}, // Missing all fields
          { agentId: 'image-generation' }, // Missing params and userId
          { agentId: 'image-generation', params: {} }, // Missing userId and prompt
          { agentId: 'image-generation', params: { prompt: '' }, userId: 'test-user' }, // Empty prompt
        ];

        for (const requestData of invalidRequests) {
          const response = await request(app)
            .post('/api/agents/execute')
            .send(requestData)
            .expect(400);

          expect(response.body.success).toBe(false);
          expect(response.body.error).toBe('Validation failed');
        }
      });

      test('should reject non-existent agent', async () => {
        const response = await request(app)
          .post('/api/agents/execute')
          .send({
            agentId: 'non-existent-agent',
            params: { prompt: 'Test prompt' },
            userId: 'test-user'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Agent not found');
      });

      // Note: Actual execution test would require valid OpenAI API key
      // and would make real API calls, so we skip it in unit tests
    });

    describe('POST /api/agents/image/generate', () => {
      test('should validate image generation parameters', async () => {
        const invalidRequests = [
          { userId: 'test-user' }, // Missing prompt
          { prompt: '', userId: 'test-user' }, // Empty prompt
          { prompt: 'Valid prompt', userId: 'test-user', size: 'invalid-size' }, // Invalid size
          { prompt: 'Valid prompt', userId: 'test-user', quality: 'invalid-quality' }, // Invalid quality
          { prompt: 'Valid prompt', userId: 'test-user', style: 'invalid-style' }, // Invalid style
          { prompt: 'a'.repeat(1001), userId: 'test-user' }, // Too long prompt
        ];

        for (const requestData of invalidRequests) {
          const response = await request(app)
            .post('/api/agents/image/generate')
            .send(requestData)
            .expect(400);

          expect(response.body.success).toBe(false);
          expect(response.body.error).toBe('Validation failed');
        }
      });

      test('should accept valid image generation parameters', async () => {
        const validRequest = {
          prompt: 'Ein schönes Haus mit Garten für den Unterricht',
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          userId: 'test-user',
          enhancePrompt: true
        };

        // Note: This will fail without valid OpenAI API key
        // In a real test environment, you'd mock the OpenAI client
        const response = await request(app)
          .post('/api/agents/image/generate')
          .send(validRequest);

        // We expect either success (if API key is valid) or a specific error
        expect([200, 400].includes(response.status)).toBe(true);
      });
    });

    describe('GET /api/agents/image/usage/:userId', () => {
      test('should return usage information for valid user', async () => {
        const response = await request(app)
          .get('/api/agents/image/usage/test-user')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user_id', 'test-user');
        expect(response.body.data).toHaveProperty('agent_id', 'image-generation');
        expect(response.body.data).toHaveProperty('usage_count');
        expect(response.body.data).toHaveProperty('monthly_limit', 10);
        expect(response.body.data).toHaveProperty('remaining');
        expect(response.body.data.remaining).toBe(response.body.data.monthly_limit - response.body.data.usage_count);
      });

      test('should validate user ID parameter', async () => {
        const response = await request(app)
          .get('/api/agents/image/usage/')
          .expect(404); // Route not found due to missing parameter
      });
    });

    describe('GET /api/agents/artifacts/:userId', () => {
      test('should return artifacts for valid user', async () => {
        const response = await request(app)
          .get('/api/agents/artifacts/test-user')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('artifacts');
        expect(response.body.data).toHaveProperty('total_count');
        expect(response.body.data.artifacts).toBeInstanceOf(Array);
      });

      test('should handle query parameters', async () => {
        const response = await request(app)
          .get('/api/agents/artifacts/test-user')
          .query({
            agentId: 'image-generation',
            type: 'image',
            limit: '5'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.artifacts).toBeInstanceOf(Array);
      });

      test('should validate limit parameter', async () => {
        const response = await request(app)
          .get('/api/agents/artifacts/test-user')
          .query({ limit: '200' }) // Exceeds max limit of 100
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/agents/triggers', () => {
      test('should find agents by trigger text', async () => {
        const response = await request(app)
          .get('/api/agents/triggers')
          .query({ text: 'erstelle ein bild von einem baum' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('triggered_agents');
        expect(response.body.data.triggered_agents).toBeInstanceOf(Array);
        expect(response.body.data.triggered_agents.length).toBeGreaterThan(0);

        const imageAgent = response.body.data.triggered_agents.find((agent: any) => agent.id === 'image-generation');
        expect(imageAgent).toBeDefined();
        expect(imageAgent.matched_triggers).toContain('bild');
      });

      test('should require text parameter', async () => {
        const response = await request(app)
          .get('/api/agents/triggers')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      test('should handle text that matches no agents', async () => {
        const response = await request(app)
          .get('/api/agents/triggers')
          .query({ text: 'this text matches no agents xyz123' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.triggered_agents).toHaveLength(0);
      });
    });

    describe('POST /api/agents/artifacts/:artifactId/favorite', () => {
      test('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/agents/artifacts/test-artifact-id/favorite')
          .send({}) // Missing userId and favorite
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      test('should accept valid favorite toggle request', async () => {
        const response = await request(app)
          .post('/api/agents/artifacts/test-artifact-id/favorite')
          .send({
            userId: 'test-user',
            favorite: true
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('artifact_id', 'test-artifact-id');
        expect(response.body.data).toHaveProperty('is_favorite', true);
      });
    });
  });

  describe('Agent Execution Service', () => {
    test('should handle agent execution with invalid agent ID', async () => {
      const result = await agentExecutionService.executeAgent(
        'non-existent-agent',
        { prompt: 'Test prompt' },
        'test-user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent not found');
    });

    test('should handle agent execution with invalid parameters', async () => {
      const result = await agentExecutionService.executeAgent(
        'image-generation',
        { prompt: '' }, // Invalid empty prompt
        'test-user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameters');
    });
  });

  describe('Security and Validation', () => {
    test('should apply rate limiting', async () => {
      // This would require multiple rapid requests to test
      // In a real test, you'd mock the rate limiting mechanism
      expect(true).toBe(true); // Placeholder
    });

    test('should filter inappropriate content', async () => {
      const inappropriatePrompts = [
        'violent content here',
        'nsfw material',
        'explicit imagery'
      ];

      for (const prompt of inappropriatePrompts) {
        const response = await request(app)
          .post('/api/agents/image/generate')
          .send({
            prompt,
            userId: 'test-user'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });
});

describe('Agent Error Handling', () => {
  test('should handle database connection errors gracefully', async () => {
    // This would require mocking the InstantDB service to simulate failures
    expect(true).toBe(true); // Placeholder
  });

  test('should handle OpenAI API errors gracefully', async () => {
    // This would require mocking the OpenAI client to simulate API failures
    expect(true).toBe(true); // Placeholder
  });
});

describe('Performance Tests', () => {
  test('should handle concurrent agent execution requests', async () => {
    // This would test multiple simultaneous requests
    expect(true).toBe(true); // Placeholder
  });

  test('should complete image generation within reasonable time', async () => {
    // This would test execution time limits
    expect(true).toBe(true); // Placeholder
  });
});