/**
 * Redis Configuration for LangGraph Checkpoint Storage
 * Handles Redis connection, health checks, and configuration for development and production
 */

import Redis from 'ioredis';
import { RedisSaver } from '@langchain/langgraph-checkpoint-redis';
import { createClient } from 'redis';

type RedisClientType = ReturnType<typeof createClient>;
import { logInfo, logError } from './logger';

/**
 * Redis configuration interface
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  tls?: any;
}

/**
 * Check if Redis is configured and available
 */
const isRedisConfigured = (): boolean => {
  return !!(process.env.REDIS_HOST || process.env.UPSTASH_REDIS_REST_URL);
};

/**
 * Redis connection configuration - supports both Upstash and standard Redis
 */
const getRedisConfig = (): RedisConfig | null => {
  // If no Redis configuration is provided, return null to indicate fallback mode
  if (!isRedisConfigured()) {
    logInfo(
      'No Redis configuration found, will use memory fallback for LangGraph'
    );
    return null;
  }

  try {
    const password =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD;
    const hasTls = !!process.env.UPSTASH_REDIS_REST_URL;

    const redisConfig: RedisConfig = {
      host: process.env.UPSTASH_REDIS_REST_URL
        ? new URL(process.env.UPSTASH_REDIS_REST_URL).hostname
        : process.env.REDIS_HOST || 'localhost',
      port: process.env.UPSTASH_REDIS_REST_URL
        ? parseInt(new URL(process.env.UPSTASH_REDIS_REST_URL).port || '443')
        : parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // IPv4
      connectTimeout: 5000,
      commandTimeout: 3000,
    };

    // Add optional fields only if they exist
    if (password) redisConfig.password = password;
    if (hasTls) redisConfig.tls = {};

    return redisConfig;
  } catch (error) {
    logError('Invalid Redis configuration', error as Error);
    return null;
  }
};

/**
 * Redis client instances
 */
let redisClient: Redis | null = null;
let redisSaver: RedisSaver | null = null;

/**
 * Initialize Redis connection with graceful fallback
 */
export async function initializeRedis(): Promise<{
  client: Redis | null;
  saver: RedisSaver | null;
  memoryMode: boolean;
}> {
  try {
    if (redisClient && redisSaver) {
      return { client: redisClient, saver: redisSaver, memoryMode: false };
    }

    const config = getRedisConfig();

    // If no Redis configuration, use memory mode
    if (!config) {
      logInfo('Redis not configured, running in memory mode');
      return { client: null, saver: null, memoryMode: true };
    }

    logInfo('Initializing Redis connection for LangGraph...');

    // Create Redis client
    redisClient = new Redis(config);

    // Set up error handlers
    redisClient.on('error', (error) => {
      logError('Redis connection error (will fallback to memory mode)', error);
      // Don't throw here, let the ping test handle it
    });

    redisClient.on('connect', () => {
      logInfo('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logInfo('Redis is ready for operations');
    });

    redisClient.on('close', () => {
      logInfo('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logInfo('Redis reconnecting...');
    });

    // Test connection with timeout
    try {
      await Promise.race([
        redisClient.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        ),
      ]);
      logInfo('Redis ping successful');
    } catch (pingError) {
      logError(
        'Redis ping failed, falling back to memory mode',
        pingError as Error
      );

      // Clean up failed connection
      if (redisClient) {
        redisClient.disconnect();
        redisClient = null;
      }

      return { client: null, saver: null, memoryMode: true };
    }

    // Initialize RedisSaver for LangGraph checkpoints
    try {
      // Use a wrapper to make ioredis compatible with RedisSaver
      const redisClientAdapter = {
        ...redisClient,
        hSet: redisClient.hset.bind(redisClient),
        hGet: redisClient.hget.bind(redisClient),
        hGetAll: redisClient.hgetall.bind(redisClient),
        hDel: redisClient.hdel.bind(redisClient),
        exists: redisClient.exists.bind(redisClient),
        del: redisClient.del.bind(redisClient),
        scan: redisClient.scan.bind(redisClient),
        hscan: redisClient.hscan.bind(redisClient),
      } as any;

      redisSaver = new RedisSaver(redisClientAdapter);
      logInfo('RedisSaver initialized for LangGraph checkpoints');
    } catch (saverError) {
      logError(
        'Failed to initialize RedisSaver, using memory mode',
        saverError as Error
      );
      redisSaver = null;
    }

    return { client: redisClient, saver: redisSaver, memoryMode: false };
  } catch (error) {
    logError(
      'Redis initialization failed, falling back to memory mode',
      error as Error
    );

    // Clean up any partial connections
    if (redisClient) {
      try {
        redisClient.disconnect();
      } catch (e) {
        // Ignore cleanup errors
      }
      redisClient = null;
    }
    redisSaver = null;

    return { client: null, saver: null, memoryMode: true };
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Get RedisSaver instance for LangGraph
 */
export function getRedisSaver(): RedisSaver | null {
  return redisSaver;
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'memory_mode';
  latency?: number;
  error?: string;
  mode?: 'redis' | 'memory';
}> {
  try {
    if (!redisClient) {
      return {
        status: 'memory_mode',
        mode: 'memory',
        error: 'Running in memory mode (Redis not configured or unavailable)',
      };
    }

    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
      mode: 'redis',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      mode: 'redis',
      error: (error as Error).message,
    };
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      redisSaver = null;
      logInfo('Redis connection closed gracefully');
    }
  } catch (error) {
    logError('Error closing Redis connection', error as Error);
  }
}

/**
 * Redis key utilities for LangGraph
 */
export const RedisKeys = {
  // Checkpoint storage keys
  checkpoint: (threadId: string) => `langgraph:checkpoint:${threadId}`,
  checkpointMetadata: (threadId: string) =>
    `langgraph:checkpoint:meta:${threadId}`,

  // Agent execution tracking
  agentExecution: (executionId: string) => `agent:execution:${executionId}`,
  agentUsage: (userId: string, agentId: string, month: string) =>
    `agent:usage:${userId}:${agentId}:${month}`,

  // Progress streaming
  agentProgress: (executionId: string) => `agent:progress:${executionId}`,

  // Session management
  chatSession: (sessionId: string) => `chat:session:${sessionId}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,

  // Error tracking and recovery
  errorRecovery: (errorId: string) => `error:recovery:${errorId}`,
  retryCount: (operationId: string) => `retry:count:${operationId}`,

  // Rate limiting for agents
  rateLimit: (userId: string, agentId: string) =>
    `rate:limit:${userId}:${agentId}`,

  // Cache for expensive operations
  cache: (key: string) => `cache:${key}`,

  // Health monitoring
  healthCheck: () => 'health:check',
  metrics: (metric: string) => `metrics:${metric}`,
};

/**
 * Redis utilities for common operations
 */
export const RedisUtils = {
  /**
   * Set data with expiration
   */
  async setWithExpiry(
    key: string,
    value: any,
    expirySeconds: number
  ): Promise<void> {
    if (!redisClient) throw new Error('Redis client not initialized');

    const serializedValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setex(key, expirySeconds, serializedValue);
  },

  /**
   * Get and parse JSON data
   */
  async getJSON<T>(key: string): Promise<T | null> {
    if (!redisClient) throw new Error('Redis client not initialized');

    const value = await redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  },

  /**
   * Increment counter with expiry
   */
  async incrementWithExpiry(
    key: string,
    expirySeconds: number
  ): Promise<number> {
    if (!redisClient) throw new Error('Redis client not initialized');

    const multi = redisClient.multi();
    multi.incr(key);
    multi.expire(key, expirySeconds);
    const results = await multi.exec();

    return (results?.[0]?.[1] as number) || 0;
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!redisClient) return false;
    return (await redisClient.exists(key)) === 1;
  },

  /**
   * Delete key
   */
  async delete(key: string): Promise<boolean> {
    if (!redisClient) return false;
    return (await redisClient.del(key)) === 1;
  },

  /**
   * Get TTL of a key
   */
  async getTTL(key: string): Promise<number> {
    if (!redisClient) return -1;
    return await redisClient.ttl(key);
  },
};
