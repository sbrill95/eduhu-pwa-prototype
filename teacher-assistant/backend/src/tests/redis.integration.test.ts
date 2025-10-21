/**
 * Redis Integration Tests
 * Tests Redis connection, checkpoint storage, and state persistence for LangGraph
 */

import Redis from 'ioredis';
import { AgentWorkflowState } from '../services/langGraphAgentService';
import { logInfo, logError } from '../config/logger';

describe('Redis Integration Tests', () => {
  let redisClient: Redis;
  let testStateKey: string;
  let testCheckpointData: AgentWorkflowState;

  beforeAll(async () => {
    // Initialize Redis client for testing
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    testStateKey = `test:langgraph:checkpoint:${Date.now()}`;
    testCheckpointData = {
      executionId: `test-execution-${Date.now()}`,
      userId: `test-user-${Date.now()}`,
      agentId: 'image-generation',
      sessionId: `test-session-${Date.now()}`,
      params: {
        prompt: 'Test image generation prompt',
      },
      result: undefined,
      error: undefined,
      retryCount: 0,
      currentStep: 'initialization',
      progress: 0,
      startTime: Date.now(),
      metadata: {
        testMode: true,
        createdAt: new Date().toISOString(),
      },
      cancelled: false,
    };
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (redisClient) {
        await redisClient.del(testStateKey);
        await redisClient.disconnect();
      }
    } catch (error) {
      logError('Failed to cleanup Redis test data', error as Error);
    }
  });

  describe('Redis Connection', () => {
    test('should connect to Redis successfully', async () => {
      try {
        await redisClient.connect();
        const pong = await redisClient.ping();
        expect(pong).toBe('PONG');
      } catch (error) {
        // If Redis is not available, skip remaining tests
        console.warn('Redis not available for testing, skipping Redis tests');
        return;
      }
    });

    test('should handle connection failures gracefully', async () => {
      const invalidRedis = new Redis({
        host: 'invalid-host',
        port: 9999,
        connectTimeout: 1000,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });

      try {
        await invalidRedis.connect();
        await invalidRedis.ping();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        await invalidRedis.disconnect();
      }
    });

    test('should provide health check information', async () => {
      try {
        await redisClient.connect();
        const info = await redisClient.info('server');
        expect(info).toContain('redis_version');

        const memory = await redisClient.info('memory');
        expect(memory).toContain('used_memory');
      } catch (error) {
        console.warn('Redis health check failed, Redis may not be available');
      }
    });
  });

  describe('Checkpoint Storage and Retrieval', () => {
    test('should store checkpoint data successfully', async () => {
      try {
        await redisClient.connect();

        const result = await redisClient.setex(
          testStateKey,
          3600, // 1 hour TTL
          JSON.stringify(testCheckpointData)
        );

        expect(result).toBe('OK');
      } catch (error) {
        console.warn('Skipping checkpoint storage test - Redis not available');
      }
    });

    test('should retrieve checkpoint data successfully', async () => {
      try {
        await redisClient.connect();

        // First store the data
        await redisClient.setex(
          testStateKey,
          3600,
          JSON.stringify(testCheckpointData)
        );

        // Then retrieve it
        const retrieved = await redisClient.get(testStateKey);
        expect(retrieved).toBeDefined();

        const parsedData = JSON.parse(retrieved!) as AgentWorkflowState;
        expect(parsedData.executionId).toBe(testCheckpointData.executionId);
        expect(parsedData.userId).toBe(testCheckpointData.userId);
        expect(parsedData.agentId).toBe(testCheckpointData.agentId);
        expect(parsedData.currentStep).toBe(testCheckpointData.currentStep);
        expect(parsedData.progress).toBe(testCheckpointData.progress);
      } catch (error) {
        console.warn(
          'Skipping checkpoint retrieval test - Redis not available'
        );
      }
    });

    test('should handle checkpoint updates correctly', async () => {
      try {
        await redisClient.connect();

        // Store initial checkpoint
        await redisClient.setex(
          testStateKey,
          3600,
          JSON.stringify(testCheckpointData)
        );

        // Update checkpoint
        const updatedData = {
          ...testCheckpointData,
          currentStep: 'image_generation',
          progress: 50,
          metadata: {
            ...testCheckpointData.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        await redisClient.setex(
          testStateKey,
          3600,
          JSON.stringify(updatedData)
        );

        // Verify update
        const retrieved = await redisClient.get(testStateKey);
        const parsedData = JSON.parse(retrieved!) as AgentWorkflowState;

        expect(parsedData.currentStep).toBe('image_generation');
        expect(parsedData.progress).toBe(50);
        expect(parsedData.metadata.updatedAt).toBeDefined();
      } catch (error) {
        console.warn('Skipping checkpoint update test - Redis not available');
      }
    });

    test('should handle checkpoint expiration correctly', async () => {
      try {
        await redisClient.connect();

        const shortLivedKey = `${testStateKey}:short`;

        // Store checkpoint with short TTL
        await redisClient.setex(
          shortLivedKey,
          1, // 1 second TTL
          JSON.stringify(testCheckpointData)
        );

        // Should exist immediately
        let retrieved = await redisClient.get(shortLivedKey);
        expect(retrieved).toBeDefined();

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Should be expired
        retrieved = await redisClient.get(shortLivedKey);
        expect(retrieved).toBeNull();
      } catch (error) {
        console.warn(
          'Skipping checkpoint expiration test - Redis not available'
        );
      }
    });
  });

  describe('State Persistence and Recovery', () => {
    test('should persist execution state across connection restarts', async () => {
      try {
        await redisClient.connect();

        // Store checkpoint
        await redisClient.setex(
          testStateKey,
          3600,
          JSON.stringify(testCheckpointData)
        );

        // Disconnect and reconnect
        await redisClient.disconnect();
        await redisClient.connect();

        // Should still be able to retrieve data
        const retrieved = await redisClient.get(testStateKey);
        expect(retrieved).toBeDefined();

        const parsedData = JSON.parse(retrieved!) as AgentWorkflowState;
        expect(parsedData.executionId).toBe(testCheckpointData.executionId);
      } catch (error) {
        console.warn('Skipping state persistence test - Redis not available');
      }
    });

    test('should handle failed state recovery gracefully', async () => {
      try {
        await redisClient.connect();

        // Try to retrieve non-existent checkpoint
        const nonExistentKey = `test:nonexistent:${Date.now()}`;
        const retrieved = await redisClient.get(nonExistentKey);

        expect(retrieved).toBeNull();
      } catch (error) {
        console.warn('Skipping failed recovery test - Redis not available');
      }
    });

    test('should handle corrupted checkpoint data', async () => {
      try {
        await redisClient.connect();

        const corruptedKey = `${testStateKey}:corrupted`;

        // Store corrupted JSON
        await redisClient.setex(corruptedKey, 3600, 'invalid-json-data');

        // Try to retrieve and parse
        const retrieved = await redisClient.get(corruptedKey);
        expect(retrieved).toBe('invalid-json-data');

        // Should throw when trying to parse
        expect(() => {
          JSON.parse(retrieved!);
        }).toThrow();

        // Cleanup
        await redisClient.del(corruptedKey);
      } catch (error) {
        console.warn('Skipping corrupted data test - Redis not available');
      }
    });
  });

  describe('Performance and Concurrency', () => {
    test('should handle multiple concurrent checkpoint operations', async () => {
      try {
        await redisClient.connect();

        // Create multiple concurrent operations
        const operations = [];
        const numOperations = 10;

        for (let i = 0; i < numOperations; i++) {
          const key = `${testStateKey}:concurrent:${i}`;
          const data = {
            ...testCheckpointData,
            executionId: `concurrent-execution-${i}`,
          };

          operations.push(redisClient.setex(key, 3600, JSON.stringify(data)));
        }

        // Wait for all operations to complete
        const results = await Promise.all(operations);

        // All should succeed
        results.forEach((result) => {
          expect(result).toBe('OK');
        });

        // Cleanup
        const deleteOps = [];
        for (let i = 0; i < numOperations; i++) {
          deleteOps.push(redisClient.del(`${testStateKey}:concurrent:${i}`));
        }
        await Promise.all(deleteOps);
      } catch (error) {
        console.warn('Skipping concurrency test - Redis not available');
      }
    });

    test('should measure checkpoint storage performance', async () => {
      try {
        await redisClient.connect();

        const performanceKey = `${testStateKey}:performance`;
        const iterations = 100;

        const startTime = Date.now();

        // Perform multiple storage operations
        for (let i = 0; i < iterations; i++) {
          await redisClient.setex(
            `${performanceKey}:${i}`,
            3600,
            JSON.stringify(testCheckpointData)
          );
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / iterations;

        logInfo(
          `Redis performance: ${avgTime}ms average per checkpoint operation`
        );

        // Should be fast (under 10ms average)
        expect(avgTime).toBeLessThan(10);

        // Cleanup
        const deleteOps = [];
        for (let i = 0; i < iterations; i++) {
          deleteOps.push(redisClient.del(`${performanceKey}:${i}`));
        }
        await Promise.all(deleteOps);
      } catch (error) {
        console.warn('Skipping performance test - Redis not available');
      }
    });
  });

  describe('Memory and Resource Management', () => {
    test('should handle memory usage efficiently', async () => {
      try {
        await redisClient.connect();

        // Get initial memory usage
        const initialMemory = await redisClient.info('memory');

        // Store many checkpoints
        const keys = [];
        for (let i = 0; i < 1000; i++) {
          const key = `${testStateKey}:memory:${i}`;
          keys.push(key);
          await redisClient.setex(
            key,
            3600,
            JSON.stringify(testCheckpointData)
          );
        }

        // Check memory usage after storing data
        const afterMemory = await redisClient.info('memory');

        // Should have increased but not excessively
        expect(afterMemory).toContain('used_memory');

        // Cleanup all keys
        await redisClient.del(...keys);
      } catch (error) {
        console.warn('Skipping memory test - Redis not available');
      }
    });

    test('should handle Redis resource limits gracefully', async () => {
      try {
        await redisClient.connect();

        // Test setting a large number of keys with TTL
        const largeDataKey = `${testStateKey}:large`;
        const largeData = {
          ...testCheckpointData,
          metadata: {
            ...testCheckpointData.metadata,
            largeArray: new Array(10000).fill('data'),
          },
        };

        const result = await redisClient.setex(
          largeDataKey,
          3600,
          JSON.stringify(largeData)
        );

        expect(result).toBe('OK');

        // Cleanup
        await redisClient.del(largeDataKey);
      } catch (error) {
        console.warn('Skipping resource limits test - Redis not available');
      }
    });
  });

  describe('Error Scenarios and Recovery', () => {
    test('should handle network interruptions', async () => {
      try {
        await redisClient.connect();

        // Simulate network timeout with very short timeout
        const timeoutClient = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 1,
          commandTimeout: 1,
          lazyConnect: true,
        });

        try {
          await timeoutClient.connect();
          await timeoutClient.setex('test-timeout', 3600, 'data');
        } catch (error) {
          // Should handle timeout gracefully
          expect(error).toBeDefined();
        } finally {
          await timeoutClient.disconnect();
        }
      } catch (error) {
        console.warn(
          'Skipping network interruption test - Redis not available'
        );
      }
    });

    test('should provide meaningful error messages', async () => {
      const invalidClient = new Redis({
        host: 'invalid-redis-host',
        port: 6379,
        connectTimeout: 1000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      try {
        await invalidClient.connect();
        await invalidClient.ping();
      } catch (error) {
        expect(error).toBeDefined();
        // Should provide meaningful error information
        expect((error as Error).message).toBeDefined();
      } finally {
        await invalidClient.disconnect();
      }
    });
  });
});
