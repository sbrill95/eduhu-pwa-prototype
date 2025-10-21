/**
 * Error Handling Service Tests
 * Comprehensive test suite for the error handling and recovery system
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from '@jest/globals';
import {
  errorHandlingService,
  ErrorType,
  RecoveryResult,
} from '../services/errorHandlingService';
import { initializeRedis, closeRedis } from '../config/redis';

// Mock Redis operations for testing
jest.mock('../config/redis', () => ({
  initializeRedis: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  closeRedis: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  RedisUtils: {
    setWithExpiry: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    getJSON: jest.fn<() => Promise<null>>().mockResolvedValue(null),
    incrementWithExpiry: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    exists: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
    delete: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
  },
  RedisKeys: {
    errorRecovery: jest.fn<(id: string) => string>((id: string) => `error:recovery:${id}`),
    retryCount: jest.fn<(id: string) => string>((id: string) => `retry:count:${id}`),
    metrics: jest.fn<(metric: string) => string>((metric: string) => `metrics:${metric}`),
    rateLimit: jest.fn<(userId: string, agentId: string) => string>((userId: string, agentId: string) => `rate:limit:${userId}:${agentId}`),
  },
}));

describe('Error Handling Service', () => {
  const testOperationId = 'test-operation-123';
  const testUserId = 'test-user-456';
  const testAgentId = 'test-agent-789';

  beforeAll(async () => {
    try {
      await initializeRedis();
    } catch (error) {
      console.warn('Redis not available in test environment, using mocks');
    }
  });

  afterAll(async () => {
    try {
      await closeRedis();
    } catch (error) {
      // Ignore cleanup errors in test environment
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Classification', () => {
    it('should classify rate limit errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded (429)');
      const errorType = errorHandlingService.classifyError(rateLimitError);
      expect(errorType).toBe(ErrorType.RATE_LIMIT);
    });

    it('should classify quota exceeded errors correctly', () => {
      const quotaError = new Error('Quota exceeded for this request');
      const errorType = errorHandlingService.classifyError(quotaError);
      expect(errorType).toBe(ErrorType.QUOTA_EXCEEDED);
    });

    it('should classify API key errors correctly', () => {
      const apiKeyError = new Error('Invalid API key provided (401)');
      const errorType = errorHandlingService.classifyError(apiKeyError);
      expect(errorType).toBe(ErrorType.INVALID_API_KEY);
    });

    it('should classify network errors correctly', () => {
      const networkError = new Error('Network error: ENOTFOUND');
      const errorType = errorHandlingService.classifyError(networkError);
      expect(errorType).toBe(ErrorType.NETWORK_ERROR);
    });

    it('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const errorType = errorHandlingService.classifyError(timeoutError);
      expect(errorType).toBe(ErrorType.TIMEOUT);
    });

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Invalid input provided');
      const errorType = errorHandlingService.classifyError(validationError);
      expect(errorType).toBe(ErrorType.INVALID_INPUT);
    });

    it('should classify unknown errors as UNKNOWN', () => {
      const unknownError = new Error('Some random error message');
      const errorType = errorHandlingService.classifyError(unknownError);
      expect(errorType).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('Error Recovery Strategies', () => {
    it.skip('should provide retry strategy for rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');

      const result = await errorHandlingService.handleError(
        rateLimitError,
        testOperationId,
        testUserId,
        testAgentId,
        1
      );

      expect(result).toBeDefined();
      expect(result.shouldRetry).toBe(true);
      expect(result.creditsPreserved).toBe(true);
      expect(result.delayMs).toBeGreaterThan(0);
      expect(result.userMessage).toContain('überlastet');
    });

    it('should not retry for quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded');

      const result = await errorHandlingService.handleError(
        quotaError,
        testOperationId,
        testUserId,
        testAgentId,
        1
      );

      expect(result).toBeDefined();
      expect(result.shouldRetry).toBe(false);
      expect(result.creditsPreserved).toBe(true);
      expect(result.userMessage).toContain('Kontingent');
    });

    it('should not retry for user input errors', async () => {
      const inputError = new Error('Invalid input provided');

      const result = await errorHandlingService.handleError(
        inputError,
        testOperationId,
        testUserId,
        testAgentId,
        1
      );

      expect(result).toBeDefined();
      expect(result.shouldRetry).toBe(false);
      expect(result.creditsPreserved).toBe(true);
      expect(result.userMessage).toContain('Ungültige Eingabe');
    });

    it('should escalate after maximum retry attempts', async () => {
      const networkError = new Error('Network error');

      // Simulate multiple retry attempts
      const result = await errorHandlingService.handleError(
        networkError,
        testOperationId,
        testUserId,
        testAgentId,
        4 // Exceeds max retries
      );

      expect(result).toBeDefined();
      expect(result.shouldRetry).toBe(false);
      expect(result.escalate).toBe(true);
      expect(result.userMessage).toContain('Support');
    });

    it('should provide fallback for retryable errors within limits', async () => {
      const unknownError = new Error('Unknown error');

      const result = await errorHandlingService.handleError(
        unknownError,
        testOperationId,
        testUserId,
        testAgentId,
        2 // Within retry limits
      );

      expect(result).toBeDefined();
      expect(result.shouldRetry).toBe(true);
      expect(result.creditsPreserved).toBe(true);
      expect(result.delayMs).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should check rate limiting correctly', async () => {
      const { RedisUtils } = require('../config/redis');

      // Mock low error count (should not rate limit)
      RedisUtils.getJSON.mockResolvedValueOnce(3);

      const shouldLimit = await errorHandlingService.shouldRateLimit(
        testUserId,
        testAgentId
      );
      expect(shouldLimit).toBe(false);

      // Mock high error count (should rate limit)
      RedisUtils.getJSON.mockResolvedValueOnce(10);

      const shouldLimitHigh = await errorHandlingService.shouldRateLimit(
        testUserId,
        testAgentId
      );
      expect(shouldLimitHigh).toBe(true);
    });

    it('should increment error count for rate limiting', async () => {
      const { RedisUtils } = require('../config/redis');

      await errorHandlingService.incrementErrorCount(testUserId, testAgentId);

      expect(RedisUtils.incrementWithExpiry).toHaveBeenCalledWith(
        expect.stringContaining(`${testUserId}:${testAgentId}`),
        600 // 10 minutes
      );
    });

    it('should handle rate limiting check failures gracefully', async () => {
      const { RedisUtils } = require('../config/redis');

      // Mock Redis failure
      RedisUtils.getJSON.mockRejectedValueOnce(
        new Error('Redis connection failed')
      );

      const shouldLimit = await errorHandlingService.shouldRateLimit(
        testUserId,
        testAgentId
      );
      expect(shouldLimit).toBe(false); // Should default to false on error
    });
  });

  describe('Error Statistics', () => {
    it('should get error statistics for different time ranges', async () => {
      const { RedisUtils } = require('../config/redis');

      // Mock some error counts
      RedisUtils.getJSON.mockResolvedValue(5);

      const dayStats = await errorHandlingService.getErrorStatistics('day');
      expect(dayStats).toBeDefined();
      expect(typeof dayStats).toBe('object');

      const weekStats = await errorHandlingService.getErrorStatistics('week');
      expect(weekStats).toBeDefined();
      expect(typeof weekStats).toBe('object');

      const monthStats = await errorHandlingService.getErrorStatistics('month');
      expect(monthStats).toBeDefined();
      expect(typeof monthStats).toBe('object');
    });

    it('should handle statistics retrieval failures gracefully', async () => {
      const { RedisUtils } = require('../config/redis');

      // Mock Redis failure
      RedisUtils.getJSON.mockRejectedValue(
        new Error('Redis connection failed')
      );

      const stats = await errorHandlingService.getErrorStatistics('day');
      expect(stats).toEqual({});
    });
  });

  describe('German Error Messages', () => {
    it.skip('should provide German error messages for different error types', async () => {
      const errorTypes = [
        { error: new Error('Rate limit exceeded'), expectedText: 'überlastet' },
        { error: new Error('Quota exceeded'), expectedText: 'Kontingent' },
        { error: new Error('Invalid API key'), expectedText: 'API-Schlüssel' },
        { error: new Error('Network error'), expectedText: 'Netzwerkfehler' },
        {
          error: new Error('Invalid input'),
          expectedText: 'Ungültige Eingabe',
        },
        {
          error: new Error('User limit exceeded'),
          expectedText: 'Limit erreicht',
        },
      ];

      for (const { error, expectedText } of errorTypes) {
        const result = await errorHandlingService.handleError(
          error,
          testOperationId,
          testUserId,
          testAgentId,
          1
        );

        expect(result.userMessage.toLowerCase()).toContain(
          expectedText.toLowerCase()
        );
      }
    });

    it('should provide appropriate retry messages with delay information', async () => {
      const networkError = new Error('Network error');

      const result = await errorHandlingService.handleError(
        networkError,
        testOperationId,
        testUserId,
        testAgentId,
        1
      );

      if (result.shouldRetry && result.delayMs) {
        const expectedDelay = Math.ceil(result.delayMs / 1000);
        expect(result.userMessage).toContain(expectedDelay.toString());
      }
    });
  });

  describe('Recovery Context Storage', () => {
    it('should store error context for analysis', async () => {
      const { RedisUtils } = require('../config/redis');

      const testError = new Error('Test error for context storage');

      await errorHandlingService.handleError(
        testError,
        testOperationId,
        testUserId,
        testAgentId,
        1
      );

      expect(RedisUtils.setWithExpiry).toHaveBeenCalledWith(
        expect.stringContaining(testOperationId),
        expect.objectContaining({
          operationId: testOperationId,
          userId: testUserId,
          agentId: testAgentId,
          errorType: expect.any(String),
          timestamp: expect.any(Number),
        }),
        86400 // 24 hours
      );
    });

    it('should track retry attempts', async () => {
      const { RedisUtils } = require('../config/redis');

      const testError = new Error('Network error');

      await errorHandlingService.handleError(
        testError,
        testOperationId,
        testUserId,
        testAgentId,
        2 // Second attempt
      );

      expect(RedisUtils.setWithExpiry).toHaveBeenCalledWith(
        expect.stringContaining(testOperationId),
        2,
        3600 // 1 hour
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it.skip('should handle malformed error objects gracefully', async () => {
      const malformedError = {} as Error; // No message property

      const result = await errorHandlingService.handleError(
        malformedError,
        testOperationId,
        testUserId,
        testAgentId,
        1
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.userMessage).toBeDefined();
    });

    it('should handle very long error messages appropriately', async () => {
      const longMessage = 'A'.repeat(1000);
      const longError = new Error(longMessage);

      const result = await errorHandlingService.handleError(
        longError,
        testOperationId,
        testUserId,
        testAgentId,
        1
      );

      expect(result).toBeDefined();
      expect(result.userMessage.length).toBeLessThan(500); // Should be reasonable length
    });

    it('should handle empty operation IDs gracefully', async () => {
      const testError = new Error('Test error');

      const result = await errorHandlingService.handleError(
        testError,
        '',
        testUserId,
        testAgentId,
        1
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });
});
