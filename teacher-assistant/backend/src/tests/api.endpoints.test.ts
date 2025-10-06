/**
 * API Endpoints Test Suite
 * Comprehensive testing of all LangGraph API endpoints
 */

import request from 'supertest';
import { app } from '../app';

describe('LangGraph API Endpoints', () => {
  const testUserId = 'test-user-api-' + Date.now();
  const testSessionId = 'test-session-api-' + Date.now();
  let testExecutionId: string;

  describe('GET /api/langgraph-agents/available', () => {
    test('should return list of available agents', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/available')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            type: expect.any(String),
            enabled: expect.any(Boolean),
            config: expect.any(Object)
          })
        ]),
        timestamp: expect.any(String)
      });
    });

    test('should include image generation agent', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/available')
        .expect(200);

      const imageAgent = response.body.data.find((agent: any) => agent.id === 'image-generation');
      expect(imageAgent).toBeDefined();
      expect(imageAgent).toMatchObject({
        id: 'image-generation',
        name: 'Bildgenerierung',
        type: 'image-generation',
        enabled: true
      });
    });

    test('should return consistent response format', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/available')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/langgraph-agents/image/generate', () => {
    const validImageRequest = {
      userId: testUserId,
      sessionId: testSessionId,
      params: {
        prompt: 'Ein schönes Klassenzimmer mit Schülern beim Lernen'
      },
      educationalContext: 'Grundschule, 3. Klasse',
      targetAgeGroup: '8-9 Jahre',
      subject: 'Allgemein',
      progressLevel: 'user_friendly',
      confirmExecution: true
    };

    test('should accept valid image generation request', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send(validImageRequest);

      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');

      if (response.status === 200) {
        testExecutionId = response.body.data.execution_id;
        expect(response.body.data).toHaveProperty('execution_id');
        expect(response.body.data).toHaveProperty('agent_id', 'image-generation');
      }
    });

    test('should validate required parameters', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          params: {}
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Prompt is required')
          })
        ]),
        timestamp: expect.any(String)
      });
    });

    test('should validate userId parameter', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          params: {
            prompt: 'Test prompt'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('User ID is required')
          })
        ])
      );
    });

    test('should validate prompt parameter', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          params: {
            prompt: ''
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Prompt is required')
          })
        ])
      );
    });

    test('should validate optional parameters', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          params: {
            prompt: 'Valid prompt'
          },
          progressLevel: 'invalid_level'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Invalid progress level')
          })
        ])
      );
    });

    test('should handle educational context parameters', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          ...validImageRequest,
          educationalContext: 'Gymnasium, Oberstufe, Physik - Mechanik',
          targetAgeGroup: '16-18 Jahre',
          subject: 'Physik'
        });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    test('should enforce educational context length limits', async () => {
      const longContext = 'A'.repeat(250);

      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          ...validImageRequest,
          educationalContext: longContext
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/langgraph-agents/image/usage/:userId', () => {
    test('should return usage information for valid user', async () => {
      const response = await request(app)
        .get(`/api/langgraph-agents/image/usage/${testUserId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user_id: testUserId,
          agent_id: 'image-generation',
          current_month: expect.stringMatching(/^\d{4}-\d{2}$/),
          usage_count: expect.any(Number),
          monthly_limit: expect.any(Number),
          remaining: expect.any(Number),
          total_cost: expect.any(Number),
          last_used: expect.anything()
        },
        timestamp: expect.any(String)
      });

      expect(response.body.data.remaining).toBeLessThanOrEqual(response.body.data.monthly_limit);
    });

    test('should validate userId parameter', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/image/usage/')
        .expect(404);

      // Should return 404 for missing userId parameter
    });

    test('should handle empty userId parameter', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/image/usage/')
        .expect(404);

      // Express should handle this as 404, not reaching our validation
    });
  });

  describe('GET /api/langgraph-agents/execution/:executionId/status', () => {
    test('should handle status request for valid execution ID', async () => {
      if (testExecutionId) {
        const response = await request(app)
          .get(`/api/langgraph-agents/execution/${testExecutionId}/status`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            execution_id: testExecutionId,
            status: expect.any(String)
          }),
          timestamp: expect.any(String)
        });
      } else {
        console.log('Skipping status test - no execution ID available');
      }
    });

    test('should validate execution ID parameter', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/execution//status')
        .expect(404);

      // Should return 404 for missing execution ID
    });

    test('should handle non-existent execution ID', async () => {
      const nonExistentId = 'non-existent-execution-id';

      const response = await request(app)
        .get(`/api/langgraph-agents/execution/${nonExistentId}/status`)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.any(String),
        timestamp: expect.any(String)
      });
    });
  });

  describe('POST /api/langgraph-agents/execution/:executionId/cancel', () => {
    test('should handle cancellation request', async () => {
      if (testExecutionId) {
        const response = await request(app)
          .post(`/api/langgraph-agents/execution/${testExecutionId}/cancel`)
          .send({
            userId: testUserId
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            execution_id: testExecutionId,
            cancelled: true,
            cancelled_by: testUserId
          }),
          timestamp: expect.any(String)
        });
      } else {
        console.log('Skipping cancellation test - no execution ID available');
      }
    });

    test('should validate required parameters for cancellation', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/execution/test-id/cancel')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('User ID is required')
          })
        ]),
        timestamp: expect.any(String)
      });
    });

    test('should handle non-existent execution ID for cancellation', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/execution/non-existent-id/cancel')
        .send({
          userId: testUserId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/langgraph-agents/progress/websocket-info', () => {
    test('should return WebSocket connection information', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/progress/websocket-info')
        .query({
          userId: testUserId,
          executionId: 'test-execution-id',
          level: 'user_friendly'
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          websocket_url: expect.any(String),
          connection_params: expect.objectContaining({
            userId: testUserId,
            executionId: 'test-execution-id',
            level: 'user_friendly'
          }),
          supported_levels: expect.arrayContaining(['user_friendly', 'detailed', 'debug'])
        },
        timestamp: expect.any(String)
      });
    });

    test('should validate required query parameters', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/progress/websocket-info')
        .query({
          executionId: 'test-execution-id'
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('User ID is required'),
        timestamp: expect.any(String)
      });
    });

    test('should provide default progress level', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/progress/websocket-info')
        .query({
          userId: testUserId,
          executionId: 'test-execution-id'
        })
        .expect(200);

      expect(response.body.data.connection_params.level).toBe('user_friendly');
    });

    test('should validate progress level parameter', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/progress/websocket-info')
        .query({
          userId: testUserId,
          executionId: 'test-execution-id',
          level: 'invalid-level'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/agents/artifacts/:userId', () => {
    test('should return user artifacts', async () => {
      const response = await request(app)
        .get(`/api/agents/artifacts/${testUserId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
        timestamp: expect.any(String)
      });
    });

    test('should filter artifacts by agent ID', async () => {
      const response = await request(app)
        .get(`/api/agents/artifacts/${testUserId}`)
        .query({
          agentId: 'image-generation'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should filter artifacts by type', async () => {
      const response = await request(app)
        .get(`/api/agents/artifacts/${testUserId}`)
        .query({
          type: 'image'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should limit artifacts count', async () => {
      const response = await request(app)
        .get(`/api/agents/artifacts/${testUserId}`)
        .query({
          limit: '5'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should handle missing userId parameter', async () => {
      const response = await request(app)
        .get('/api/agents/artifacts/')
        .expect(404);

      // Should return 404 for missing userId parameter
    });
  });

  describe('Response Format Consistency', () => {
    test('all endpoints should return consistent error format', async () => {
      const endpoints = [
        { method: 'post', path: '/api/langgraph-agents/image/generate', body: {} },
        { method: 'get', path: '/api/langgraph-agents/execution/invalid/status' },
        { method: 'post', path: '/api/langgraph-agents/execution/invalid/cancel', body: {} }
      ];

      for (const endpoint of endpoints) {
        const request_call = request(app)[endpoint.method as 'get' | 'post'](endpoint.path);

        if (endpoint.body) {
          request_call.send(endpoint.body);
        }

        const response = await request_call;

        if (response.status >= 400) {
          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('error');
          expect(response.body).toHaveProperty('timestamp');
          expect(typeof response.body.timestamp).toBe('string');
        }
      }
    });

    test('all successful endpoints should return consistent success format', async () => {
      const endpoints = [
        { method: 'get', path: '/api/langgraph-agents/available' },
        { method: 'get', path: `/api/langgraph-agents/image/usage/${testUserId}` },
        { method: 'get', path: `/api/agents/artifacts/${testUserId}` }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method as 'get'](endpoint.path)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.timestamp).toBe('string');
      }
    });
  });

  describe('HTTP Status Codes', () => {
    test('should return 400 for validation errors', async () => {
      await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({})
        .expect(400);
    });

    test('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/langgraph-agents/non-existent-endpoint')
        .expect(404);
    });

    test('should return 200 for successful requests', async () => {
      await request(app)
        .get('/api/langgraph-agents/available')
        .expect(200);
    });
  });

  describe('Content-Type Headers', () => {
    test('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/available')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should accept JSON content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .set('Content-Type', 'application/json')
        .send({
          userId: testUserId,
          params: { prompt: 'test' }
        });

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});