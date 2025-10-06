/**
 * Comprehensive Error Handling Service for LangGraph Agents
 * Provides smart retry logic, fallback strategies, credit preservation, and user communication
 */

import { logError, logInfo, logWarn } from '../config/logger';
import { RedisUtils, RedisKeys } from '../config/redis';

/**
 * Error classification types
 */
export enum ErrorType {
  // OpenAI API errors
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_API_KEY = 'invalid_api_key',
  MODEL_UNAVAILABLE = 'model_unavailable',
  CONTENT_FILTER = 'content_filter',

  // Network and service errors
  NETWORK_ERROR = 'network_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  TIMEOUT = 'timeout',

  // User input errors
  INVALID_INPUT = 'invalid_input',
  PROMPT_TOO_LONG = 'prompt_too_long',
  UNSUPPORTED_FORMAT = 'unsupported_format',

  // System errors
  REDIS_ERROR = 'redis_error',
  DATABASE_ERROR = 'database_error',
  INTERNAL_ERROR = 'internal_error',

  // User limit errors
  USER_LIMIT_EXCEEDED = 'user_limit_exceeded',
  MONTHLY_QUOTA_EXCEEDED = 'monthly_quota_exceeded',

  // Unknown errors
  UNKNOWN = 'unknown'
}

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffType: 'exponential' | 'linear' | 'fixed';
  jitter: boolean; // Add randomness to prevent thundering herd
  retryableErrors: ErrorType[];
}

/**
 * Fallback strategy configuration
 */
export interface FallbackStrategy {
  enabled: boolean;
  fallbackMessage: string;
  preserveCredits: boolean;
  notifyUser: boolean;
  escalateAfterAttempts: number;
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  retryStrategy: RetryStrategy;
  fallbackStrategy: FallbackStrategy;
  userNotification: {
    immediate: string;
    retry: string;
    fallback: string;
    escalation: string;
  };
}

/**
 * Default error recovery configurations for different error types
 */
const DEFAULT_RECOVERY_CONFIGS: Partial<Record<ErrorType, ErrorRecoveryConfig>> = {
  [ErrorType.RATE_LIMIT]: {
    retryStrategy: {
      maxRetries: 3,
      baseDelay: 5000, // 5 seconds
      maxDelay: 60000, // 1 minute
      backoffType: 'exponential',
      jitter: true,
      retryableErrors: [ErrorType.RATE_LIMIT]
    },
    fallbackStrategy: {
      enabled: true,
      fallbackMessage: 'OpenAI ist momentan überlastet. Wir versuchen es automatisch erneut.',
      preserveCredits: true,
      notifyUser: true,
      escalateAfterAttempts: 3
    },
    userNotification: {
      immediate: 'Die KI ist momentan stark ausgelastet. Einen Moment bitte...',
      retry: 'Versuche erneut in {delay} Sekunden...',
      fallback: 'OpenAI ist überlastet. Versuche es in 5 Minuten wieder.',
      escalation: 'Anhaltende Probleme mit OpenAI. Bitte kontaktiere den Support.'
    }
  },

  [ErrorType.QUOTA_EXCEEDED]: {
    retryStrategy: {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      backoffType: 'fixed',
      jitter: false,
      retryableErrors: []
    },
    fallbackStrategy: {
      enabled: false,
      fallbackMessage: '',
      preserveCredits: true,
      notifyUser: true,
      escalateAfterAttempts: 1
    },
    userNotification: {
      immediate: 'OpenAI-Kontingent erschöpft. Bitte versuche es später wieder.',
      retry: '',
      fallback: '',
      escalation: 'OpenAI-Kontingent dauerhaft erschöpft. Bitte wende dich an den Administrator.'
    }
  },

  [ErrorType.NETWORK_ERROR]: {
    retryStrategy: {
      maxRetries: 3,
      baseDelay: 2000, // 2 seconds
      maxDelay: 10000, // 10 seconds
      backoffType: 'exponential',
      jitter: true,
      retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT]
    },
    fallbackStrategy: {
      enabled: true,
      fallbackMessage: 'Netzwerkprobleme erkannt. Automatischer Wiederholungsversuch...',
      preserveCredits: true,
      notifyUser: true,
      escalateAfterAttempts: 3
    },
    userNotification: {
      immediate: 'Verbindungsprobleme erkannt. Versuche automatisch erneut...',
      retry: 'Wiederholung in {delay} Sekunden...',
      fallback: 'Anhaltende Verbindungsprobleme. Bitte überprüfe deine Internetverbindung.',
      escalation: 'Schwerwiegende Netzwerkprobleme. Bitte kontaktiere den Support.'
    }
  },

  [ErrorType.INVALID_INPUT]: {
    retryStrategy: {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      backoffType: 'fixed',
      jitter: false,
      retryableErrors: []
    },
    fallbackStrategy: {
      enabled: false,
      fallbackMessage: '',
      preserveCredits: true,
      notifyUser: true,
      escalateAfterAttempts: 1
    },
    userNotification: {
      immediate: 'Ungültige Eingabe erkannt. Bitte überprüfe deine Anfrage.',
      retry: '',
      fallback: '',
      escalation: ''
    }
  },

  [ErrorType.USER_LIMIT_EXCEEDED]: {
    retryStrategy: {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      backoffType: 'fixed',
      jitter: false,
      retryableErrors: []
    },
    fallbackStrategy: {
      enabled: false,
      fallbackMessage: '',
      preserveCredits: true,
      notifyUser: true,
      escalateAfterAttempts: 1
    },
    userNotification: {
      immediate: 'Monatliches Limit erreicht. Du kannst nächsten Monat wieder Bilder generieren.',
      retry: '',
      fallback: '',
      escalation: ''
    }
  },

  // Default for all other error types
  [ErrorType.UNKNOWN]: {
    retryStrategy: {
      maxRetries: 2,
      baseDelay: 3000,
      maxDelay: 15000,
      backoffType: 'exponential',
      jitter: true,
      retryableErrors: [ErrorType.UNKNOWN, ErrorType.INTERNAL_ERROR]
    },
    fallbackStrategy: {
      enabled: true,
      fallbackMessage: 'Ein unerwarteter Fehler ist aufgetreten. Versuche automatisch erneut...',
      preserveCredits: true,
      notifyUser: true,
      escalateAfterAttempts: 2
    },
    userNotification: {
      immediate: 'Ein unerwarteter Fehler ist aufgetreten. Einen Moment bitte...',
      retry: 'Wiederholung in {delay} Sekunden...',
      fallback: 'Anhaltende Probleme. Bitte versuche es in einigen Minuten erneut.',
      escalation: 'Schwerwiegender Systemfehler. Bitte kontaktiere den Support.'
    }
  }
};

// Copy default config for other error types
Object.values(ErrorType).forEach(errorType => {
  if (!DEFAULT_RECOVERY_CONFIGS[errorType]) {
    DEFAULT_RECOVERY_CONFIGS[errorType] = {
      retryStrategy: {
        maxRetries: 1,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffType: 'exponential',
        jitter: false,
        retryableErrors: []
      },
      fallbackStrategy: {
        enabled: false,
        fallbackMessage: 'Operation failed. Using default fallback.',
        preserveCredits: true,
        notifyUser: true,
        escalateAfterAttempts: 1
      },
      userNotification: {
        immediate: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
        retry: 'Versuche es erneut in {delay} Sekunden...',
        fallback: 'Verwende alternative Methode...',
        escalation: 'Operation fehlgeschlagen. Bitte kontaktiere den Support.'
      }
    };
  }
});

/**
 * Error context for tracking and analysis
 */
export interface ErrorContext {
  operationId: string;
  userId: string;
  agentId: string;
  attemptNumber: number;
  timestamp: number;
  errorType: ErrorType;
  originalError: Error;
  retryable: boolean;
  creditsPreserved: boolean;
}

/**
 * Result of error recovery attempt
 */
export interface RecoveryResult {
  success: boolean;
  shouldRetry: boolean;
  shouldFallback: boolean;
  delayMs?: number;
  userMessage: string;
  creditsPreserved: boolean;
  escalate: boolean;
}

/**
 * Main Error Handling Service
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Classify error type from error object
   */
  public classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // OpenAI API errors
    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorType.RATE_LIMIT;
    }
    if (message.includes('quota') || message.includes('insufficient')) {
      return ErrorType.QUOTA_EXCEEDED;
    }
    if (message.includes('api key') || message.includes('401')) {
      return ErrorType.INVALID_API_KEY;
    }
    if (message.includes('model') && message.includes('unavailable')) {
      return ErrorType.MODEL_UNAVAILABLE;
    }
    if (message.includes('content filter') || message.includes('safety')) {
      return ErrorType.CONTENT_FILTER;
    }

    // Network errors
    if (message.includes('network') || message.includes('enotfound') || message.includes('econnrefused')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (message.includes('timeout') || name.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    if (message.includes('service unavailable') || message.includes('503')) {
      return ErrorType.SERVICE_UNAVAILABLE;
    }

    // Input validation errors
    if (message.includes('validation') || message.includes('invalid input')) {
      return ErrorType.INVALID_INPUT;
    }
    if (message.includes('prompt too long') || message.includes('max tokens')) {
      return ErrorType.PROMPT_TOO_LONG;
    }

    // System errors
    if (message.includes('redis')) {
      return ErrorType.REDIS_ERROR;
    }
    if (message.includes('database') || message.includes('instantdb')) {
      return ErrorType.DATABASE_ERROR;
    }

    // User limits
    if (message.includes('user limit') || message.includes('monthly quota')) {
      return ErrorType.USER_LIMIT_EXCEEDED;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Handle error with smart recovery
   */
  public async handleError(
    error: Error,
    operationId: string,
    userId: string,
    agentId: string,
    attemptNumber: number = 1
  ): Promise<RecoveryResult> {
    const errorType = this.classifyError(error);
    const config = DEFAULT_RECOVERY_CONFIGS[errorType];

    // Early return if no config found
    if (!config) {
      return {
        success: false,
        shouldRetry: false,
        shouldFallback: false,
        userMessage: `Unbekannter Fehler: ${error.message}`,
        creditsPreserved: false,
        escalate: true
      };
    }

    logError(`Agent error [${errorType}] on attempt ${attemptNumber}`, error);

    // Create error context
    const context: ErrorContext = {
      operationId,
      userId,
      agentId,
      attemptNumber,
      timestamp: Date.now(),
      errorType,
      originalError: error,
      retryable: config.retryStrategy?.retryableErrors.includes(errorType) || false,
      creditsPreserved: config.fallbackStrategy?.preserveCredits || false
    };

    // Store error context for analysis
    await this.storeErrorContext(context);

    // Check if we should retry
    if (context.retryable && config.retryStrategy && attemptNumber <= config.retryStrategy.maxRetries) {
      const delay = this.calculateRetryDelay(config.retryStrategy, attemptNumber);

      // Track retry attempt
      await this.trackRetryAttempt(operationId, attemptNumber);

      return {
        success: false,
        shouldRetry: true,
        shouldFallback: false,
        delayMs: delay,
        userMessage: config.userNotification?.retry?.replace('{delay}', Math.ceil(delay / 1000).toString()) || 'Retrying operation...',
        creditsPreserved: true,
        escalate: false
      };
    }

    // Check if we should fallback
    if (config.fallbackStrategy?.enabled && config.fallbackStrategy.escalateAfterAttempts && attemptNumber <= config.fallbackStrategy.escalateAfterAttempts) {
      return {
        success: false,
        shouldRetry: false,
        shouldFallback: true,
        userMessage: config.userNotification?.fallback || 'Using fallback strategy...',
        creditsPreserved: config.fallbackStrategy?.preserveCredits || false,
        escalate: false
      };
    }

    // Escalate the error
    logWarn(`Error escalated after ${attemptNumber} attempts: ${errorType}`);

    return {
      success: false,
      shouldRetry: false,
      shouldFallback: false,
      userMessage: config.userNotification?.escalation || config.userNotification?.immediate || 'Operation failed. Please try again later.',
      creditsPreserved: config.fallbackStrategy?.preserveCredits || false,
      escalate: true
    };
  }

  /**
   * Calculate retry delay with backoff and jitter
   */
  private calculateRetryDelay(strategy: RetryStrategy, attemptNumber: number): number {
    let delay: number;

    switch (strategy.backoffType) {
      case 'exponential':
        delay = strategy.baseDelay * Math.pow(2, attemptNumber - 1);
        break;
      case 'linear':
        delay = strategy.baseDelay * attemptNumber;
        break;
      case 'fixed':
      default:
        delay = strategy.baseDelay;
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, strategy.maxDelay);

    // Add jitter to prevent thundering herd
    if (strategy.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    return Math.max(delay, 100); // Minimum 100ms delay
  }

  /**
   * Store error context for analysis and monitoring
   */
  private async storeErrorContext(context: ErrorContext): Promise<void> {
    try {
      const key = RedisKeys.errorRecovery(context.operationId);
      await RedisUtils.setWithExpiry(key, context, 86400); // 24 hours

      // Update error metrics
      const errorMetricKey = RedisKeys.metrics(`error:${context.errorType}:${new Date().toISOString().slice(0, 10)}`);
      await RedisUtils.incrementWithExpiry(errorMetricKey, 86400);

      logInfo(`Stored error context: ${context.operationId} - ${context.errorType}`);
    } catch (error) {
      logError('Failed to store error context', error as Error);
    }
  }

  /**
   * Track retry attempts
   */
  private async trackRetryAttempt(operationId: string, attemptNumber: number): Promise<void> {
    try {
      const key = RedisKeys.retryCount(operationId);
      await RedisUtils.setWithExpiry(key, attemptNumber, 3600); // 1 hour
    } catch (error) {
      logError('Failed to track retry attempt', error as Error);
    }
  }

  /**
   * Get error statistics for monitoring
   */
  public async getErrorStatistics(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<Record<string, number>> {
    try {
      const stats: Record<string, number> = {};
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);

        for (const errorType of Object.values(ErrorType)) {
          const key = RedisKeys.metrics(`error:${errorType}:${dateStr}`);
          const count = await RedisUtils.getJSON<number>(key) || 0;
          stats[errorType] = (stats[errorType] || 0) + count;
        }
      }

      return stats;
    } catch (error) {
      logError('Failed to get error statistics', error as Error);
      return {};
    }
  }

  /**
   * Check if operation should be rate limited due to recent errors
   */
  public async shouldRateLimit(userId: string, agentId: string): Promise<boolean> {
    try {
      const key = RedisKeys.rateLimit(userId, agentId);
      const errorCount = await RedisUtils.getJSON<number>(key) || 0;

      // Rate limit if more than 5 errors in the last 10 minutes
      return errorCount > 5;
    } catch (error) {
      logError('Failed to check rate limit', error as Error);
      return false;
    }
  }

  /**
   * Increment error count for rate limiting
   */
  public async incrementErrorCount(userId: string, agentId: string): Promise<void> {
    try {
      const key = RedisKeys.rateLimit(userId, agentId);
      await RedisUtils.incrementWithExpiry(key, 600); // 10 minutes
    } catch (error) {
      logError('Failed to increment error count', error as Error);
    }
  }
}

/**
 * Export singleton instance
 */
export const errorHandlingService = ErrorHandlingService.getInstance();