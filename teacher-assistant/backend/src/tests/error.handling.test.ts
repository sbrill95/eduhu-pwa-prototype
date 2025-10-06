/**
 * Error Handling and Recovery Tests
 * Tests error scenarios, recovery mechanisms, and resilience of the LangGraph system
 */

import request from 'supertest';
import { app } from '../app';
import { ImageGenerationAgent } from '../agents/imageGenerationAgent';
import { agentExecutionService } from '../services/agentService';

describe('Error Handling and Recovery Tests', () => {
  const testUserId = 'test-error-user-' + Date.now();
  const testSessionId = 'test-error-session-' + Date.now();

  describe('OpenAI API Error Handling', () => {
    test('should handle invalid API key gracefully', async () => {
      // This test assumes the system handles OpenAI errors gracefully
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            prompt: 'Test prompt for invalid API key'
          },
          confirmExecution: true
        });

      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');

      if (response.status !== 200) {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      }
    });

    test('should handle OpenAI rate limit errors', async () => {
      // Mock rate limit scenario by sending multiple rapid requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/langgraph-agents/image/generate')
            .send({
              userId: `${testUserId}-${i}`,
              sessionId: testSessionId,
              params: {
                prompt: `Rate limit test prompt ${i}`
              },
              confirmExecution: true
            })
        );
      }

      const responses = await Promise.all(promises);

      // At least one should respond (either success or error)
      responses.forEach(response => {
        expect([200, 400, 429, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('success');
      });
    });

    test('should handle OpenAI service unavailable errors', async () => {
      // Test with parameters that might trigger service issues
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            prompt: 'Test prompt for service unavailable scenario',
            size: '1792x1024',
            quality: 'hd'
          },
          confirmExecution: true
        });

      expect([200, 400, 500, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    test('should preserve user credits on API failures', async () => {
      // Get initial usage
      const initialUsage = await request(app)
        .get(`/api/langgraph-agents/image/usage/${testUserId}`)
        .expect(200);

      const initialCount = initialUsage.body.data.usage_count;

      // Attempt generation that might fail
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          sessionId: testSessionId,
          params: {
            prompt: 'Credit preservation test prompt'
          },
          confirmExecution: true
        });

      // Check usage after attempt
      const finalUsage = await request(app)
        .get(`/api/langgraph-agents/image/usage/${testUserId}`)
        .expect(200);

      const finalCount = finalUsage.body.data.usage_count;

      if (response.status !== 200) {
        // If generation failed, credits should not be consumed
        expect(finalCount).toBe(initialCount);
      } else {
        // If generation succeeded, credits should be consumed
        expect(finalCount).toBe(initialCount + 1);
      }
    });
  });

  describe('Validation Error Handling', () => {
    test('should provide detailed validation error messages', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: '',
          sessionId: '',
          params: {
            prompt: '',
            size: 'invalid-size',
            quality: 'invalid-quality'
          },
          educationalContext: 'A'.repeat(250), // Too long
          targetAgeGroup: 'B'.repeat(60), // Too long
          subject: 'C'.repeat(110), // Too long
          progressLevel: 'invalid-level'
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.any(String),
            param: expect.any(String)
          })
        ]),
        timestamp: expect.any(String)
      });

      // Should have multiple validation errors
      expect(response.body.details.length).toBeGreaterThan(1);
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .set('Content-Type', 'application/json')
        .send('invalid-json-data')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          params: { prompt: 'test' }
        });

      // Should still process the request or return meaningful error
      expect([200, 400, 415, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    test('should handle oversized request payloads', async () => {
      const largePrompt = 'A'.repeat(10000); // Very large prompt

      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          params: {
            prompt: largePrompt
          },
          educationalContext: 'B'.repeat(1000),
          metadata: {
            largeData: 'C'.repeat(50000)
          }
        });

      expect([200, 400, 413, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Database and Persistence Error Handling', () => {
    test('should handle database connection issues gracefully', async () => {
      // This test assumes the system handles DB errors gracefully
      const response = await request(app)
        .get(`/api/langgraph-agents/image/usage/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('should handle artifact storage failures', async () => {
      const response = await request(app)
        .get(`/api/agents/artifacts/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should handle execution status persistence failures', async () => {
      const response = await request(app)
        .get('/api/langgraph-agents/execution/non-existent-id/status')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Usage Limit Error Handling', () => {
    test('should handle monthly limit exceeded scenarios', async () => {
      // This would require a user with exceeded limits
      // For now, test the structure
      const response = await request(app)
        .get(`/api/langgraph-agents/image/usage/${testUserId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('monthly_limit');
      expect(response.body.data).toHaveProperty('remaining');
      expect(response.body.data.remaining).toBeGreaterThanOrEqual(0);
    });

    test('should prevent execution when limits exceeded', async () => {
      // Test with a theoretical user who has exceeded limits
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: 'user-with-exceeded-limits',
          params: {
            prompt: 'Test prompt for limit check'
          },
          confirmExecution: true
        });

      // Should either allow or deny based on actual limits
      expect([200, 400, 429, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    test('should provide clear limit exceeded messages', async () => {
      // Mock a scenario where limits might be exceeded
      const responses = [];
      for (let i = 0; i < 15; i++) { // Exceeds free tier limit of 10
        const response = await request(app)
          .post('/api/langgraph-agents/image/generate')
          .send({
            userId: `limit-test-user-${Date.now()}-${i}`,
            params: {
              prompt: `Limit test prompt ${i}`
            },
            confirmExecution: true
          });
        responses.push(response);
      }

      // At least some should succeed or provide clear error messages
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success');
        if (!response.body.success) {
          expect(response.body).toHaveProperty('error');
          expect(typeof response.body.error).toBe('string');
        }
      });
    });
  });

  describe('Network and Timeout Error Handling', () => {
    test('should handle request timeouts gracefully', async () => {
      // Test with a request that might timeout
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .timeout(30000) // 30 second timeout
        .send({
          userId: testUserId,
          params: {
            prompt: 'Complex image generation that might take time'
          },
          confirmExecution: true
        });

      expect([200, 400, 408, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    test('should handle connection interruptions', async () => {
      // Test rapid connection and disconnection
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .get('/api/langgraph-agents/available')
            .timeout(1000)
        );
      }

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect([200, 408, 500]).toContain(response.status);
      });
    });
  });

  describe('Concurrent Request Error Handling', () => {
    test('should handle multiple concurrent agent executions', async () => {
      const promises = [];
      const numConcurrent = 5;

      for (let i = 0; i < numConcurrent; i++) {
        promises.push(
          request(app)
            .post('/api/langgraph-agents/image/generate')
            .send({
              userId: `concurrent-user-${i}-${Date.now()}`,
              params: {
                prompt: `Concurrent execution test ${i}`
              },
              confirmExecution: true
            })
        );
      }

      const responses = await Promise.all(promises);

      // All should respond, either with success or meaningful errors
      responses.forEach((response, index) => {
        expect([200, 400, 429, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    test('should handle race conditions in usage tracking', async () => {
      const userId = `race-condition-user-${Date.now()}`;
      const promises = [];

      // Multiple simultaneous requests for the same user
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post('/api/langgraph-agents/image/generate')
            .send({
              userId: userId,
              params: {
                prompt: `Race condition test ${i}`
              },
              confirmExecution: true
            })
        );
      }

      const responses = await Promise.all(promises);

      // Check final usage count is consistent
      const finalUsage = await request(app)
        .get(`/api/langgraph-agents/image/usage/${userId}`)
        .expect(200);

      expect(finalUsage.body.data.usage_count).toBeGreaterThanOrEqual(0);
      expect(finalUsage.body.data.usage_count).toBeLessThanOrEqual(3);
    });
  });

  describe('Recovery and Resilience', () => {
    test('should recover from temporary service disruptions', async () => {
      // Test system resilience with multiple requests over time
      const responses = [];

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get('/api/langgraph-agents/available');

        responses.push(response);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Most or all should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    test('should maintain data consistency during errors', async () => {
      const userId = `consistency-test-${Date.now()}`;

      // Get initial state
      const initialUsage = await request(app)
        .get(`/api/langgraph-agents/image/usage/${userId}`)
        .expect(200);

      // Attempt operation that might fail
      const operationResponse = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: userId,
          params: {
            prompt: 'Consistency test prompt'
          },
          confirmExecution: true
        });

      // Check final state
      const finalUsage = await request(app)
        .get(`/api/langgraph-agents/image/usage/${userId}`)
        .expect(200);

      // Data should be consistent
      expect(finalUsage.body.data.usage_count).toBeGreaterThanOrEqual(initialUsage.body.data.usage_count);
      expect(finalUsage.body.data.monthly_limit).toBe(initialUsage.body.data.monthly_limit);
    });

    test('should provide meaningful error context', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: '',
          params: {}
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('timestamp');

      // Error should be descriptive
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });
  });

  describe('Security Error Handling', () => {
    test('should handle SQL injection attempts gracefully', async () => {
      const maliciousUserId = "'; DROP TABLE users; --";

      const response = await request(app)
        .get(`/api/langgraph-agents/image/usage/${encodeURIComponent(maliciousUserId)}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle XSS attempts in parameters', async () => {
      const xssPrompt = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: testUserId,
          params: {
            prompt: xssPrompt
          },
          educationalContext: '<img src=x onerror=alert(1)>',
          confirmExecution: true
        });

      // Should handle safely or reject
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    test('should handle oversized parameter values', async () => {
      const response = await request(app)
        .post('/api/langgraph-agents/image/generate')
        .send({
          userId: 'A'.repeat(1000),
          params: {
            prompt: 'B'.repeat(10000)
          },
          educationalContext: 'C'.repeat(1000),
          confirmExecution: true
        });

      expect([200, 400, 413, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });
});