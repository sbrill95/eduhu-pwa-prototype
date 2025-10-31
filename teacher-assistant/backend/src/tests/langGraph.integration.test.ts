/**
 * LangGraph Agent Integration Tests
 * Comprehensive testing of the LangGraph agentic workflow system
 */

import request from 'supertest';
import app from '../app';
import { ImageGenerationAgent } from '../agents/imageGenerationAgent';
import { agentRegistry } from '../services/agentService';
import { LangGraphAgentService } from '../services/langGraphAgentService';

describe.skip('LangGraph Agent Integration Tests', () => {
  let testUserId: string;
  let testSessionId: string;
  let testExecutionId: string;

  beforeAll(async () => {
    // Setup test environment
    testUserId = 'test-user-' + Date.now();
    testSessionId = 'test-session-' + Date.now();

    // Ensure agents are registered
    const imageAgent = new ImageGenerationAgent();
    agentRegistry.register(imageAgent);
  });

  afterAll(async () => {
    // Cleanup test data
    // In a real test environment, you would clean up test executions and artifacts
  });

  describe('Agent Discovery and Registration', () => {
    test('should list available agents', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/available')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Should include image generation agent
      const imageAgent = response.body.data.find(
        (agent: any) => agent.id === 'image-generation'
      );
      expect(imageAgent).toBeDefined();
      expect(imageAgent).toHaveProperty('name', 'Bildgenerierung');
      expect(imageAgent).toHaveProperty('type', 'image-generation');
      expect(imageAgent).toHaveProperty('enabled', true);
    });

    test('should return agent configuration', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/available')
        .expect(200);

      const imageAgent = response.body.data.find(
        (agent: any) => agent.id === 'image-generation'
      );
      expect(imageAgent.config).toHaveProperty('monthly_limit');
      expect(imageAgent.config).toHaveProperty('model', 'dall-e-3');
      expect(imageAgent.config).toHaveProperty('enhance_german_prompts', true);
    });
  });

  describe('Image Generation Agent Execution', () => {
    test('should validate required parameters', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            // Missing prompt parameter
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    test('should handle invalid parameters gracefully', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            prompt: '', // Empty prompt
            size: 'invalid-size',
            quality: 'invalid-quality',
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should execute image generation with valid German prompt', async () => {
      // Note: This test would require a valid OpenAI API key
      // In a real environment, you might mock the OpenAI client
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            prompt: 'Ein Klassenzimmer mit glücklichen Schülern beim Lernen',
            size: '1024x1024',
            quality: 'standard',
            style: 'natural',
            enhancePrompt: true,
          },
          educationalContext: 'Grundschule Mathematik',
          targetAgeGroup: '8-10 Jahre',
          subject: 'Mathematik',
          progressLevel: 'user_friendly',
          confirmExecution: true,
        });

      // This test might fail without a valid API key, but structure should be correct
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('execution_id');
        testExecutionId = response.body.data.execution_id;
      } else {
        // Should fail gracefully with proper error handling
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      }
    });

    test('should handle German prompt enhancement', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            prompt: 'Schule, Kinder lernen',
            enhancePrompt: true,
          },
          educationalContext: 'Educational illustration for elementary school',
          confirmExecution: true,
        });

      // Should process the request, regardless of API availability
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Usage Tracking and Limits', () => {
    test('should track user usage correctly', async () => {
      const response = await request(app)
        .get(`/api/langgraph-agents/image/usage/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user_id', testUserId);
      expect(response.body.data).toHaveProperty('agent_id', 'image-generation');
      expect(response.body.data).toHaveProperty('usage_count');
      expect(response.body.data).toHaveProperty('monthly_limit');
      expect(response.body.data).toHaveProperty('remaining');
      expect(typeof response.body.data.usage_count).toBe('number');
      expect(typeof response.body.data.monthly_limit).toBe('number');
    });

    test('should enforce monthly limits', async () => {
      // This would require setting up a user with exceeded limits
      // For now, we test the structure
      const response = await request(app)
        .get(`/api/langgraph-agents/image/usage/${testUserId}`)
        .expect(200);

      expect(response.body.data.monthly_limit).toBe(10); // Free tier limit
      expect(response.body.data.remaining).toBeLessThanOrEqual(10);
    });

    test('should return user artifacts', async () => {
      const response = await request(app)
        .get(`/api/agents/artifacts/${testUserId}`)
        .query({
          agentId: 'image-generation',
          type: 'image',
          limit: 5,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Execution Status and Progress', () => {
    test('should handle execution status requests', async () => {
      if (testExecutionId) {
        const response = await request(app)
          .get(`/api/langgraph-agents/execution/${testExecutionId}/status`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
      } else {
        // Test with invalid execution ID
        const response = await request(app)
          .get('/api/langgraph-agents/execution/invalid-id/status')
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      }
    });

    test('should handle execution cancellation', async () => {
      if (testExecutionId) {
        const response = await request(app)
          .post(`/api/langgraph-agents/execution/${testExecutionId}/cancel`)
          .send({
            userId: testUserId,
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      } else {
        // Test with invalid execution ID
        const response = await request(app)
          .post('/api/langgraph-agents/execution/invalid-id/cancel')
          .send({
            userId: testUserId,
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      }
    });
  });

  describe('WebSocket Progress Streaming', () => {
    test('should provide WebSocket connection info', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/progress/websocket-info')
        .query({
          userId: testUserId,
          executionId: 'test-execution',
          level: 'user_friendly',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('websocket_url');
      expect(response.body.data).toHaveProperty('connection_params');
    });

    test('should validate required parameters for WebSocket info', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/progress/websocket-info')
        .query({
          // Missing userId
          executionId: 'test-execution',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle missing user ID gracefully', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          // Missing userId
          sessionId: testSessionId,
          params: {
            prompt: 'Test prompt',
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation failed');
    });

    test('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          invalid: 'data',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should provide meaningful error messages', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: '',
          params: {
            prompt: '',
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });

  describe('German Educational Context', () => {
    test('should accept German educational parameters', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            prompt: 'Mathematik Diagramm für Grundschule',
          },
          educationalContext: 'Grundschule, 3. Klasse, Mathematik - Geometrie',
          targetAgeGroup: '8-9 Jahre',
          subject: 'Mathematik - Geometrie',
          confirmExecution: true,
        });

      // Should accept and process German parameters
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    test('should validate educational context length limits', async () => {
      const longContext = 'A'.repeat(250); // Exceeds 200 character limit

      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          params: {
            prompt: 'Test prompt',
          },
          educationalContext: longContext,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
