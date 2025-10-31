import {
  Agent,
  setDefaultOpenAITracingExporter,
  setTracingExportApiKey,
  startTraceExportLoop,
} from '@openai/agents';
import { config, isProduction } from './index';
import { logInfo, logError } from './logger';

/**
 * OpenAI Agents SDK Configuration
 *
 * Follows same pattern as openai.ts for consistency.
 * Tracing is DISABLED by default for GDPR compliance (RISK-021).
 *
 * @see {@link https://openai.github.io/openai-agents-js/} Official Documentation
 */

/**
 * SDK Configuration Interface
 */
export interface AgentsSdkConfig {
  apiKey: string;
  tracing: {
    enabled: boolean;
    endpoint: string;
  };
}

/**
 * Get Agents SDK configuration from environment
 */
export const getAgentsSdkConfig = (): AgentsSdkConfig => {
  // Tracing DISABLED by default for GDPR compliance
  // Must explicitly set ENABLE_TRACING=true to enable
  const tracingEnabled = process.env.ENABLE_TRACING === 'true';

  return {
    apiKey: config.OPENAI_API_KEY,
    tracing: {
      enabled: tracingEnabled,
      endpoint: 'https://platform.openai.com/traces',
    },
  };
};

/**
 * Initialize Agents SDK with tracing configuration
 *
 * The OpenAI Agents SDK (v0.1.10) uses environment-based configuration.
 * The OPENAI_API_KEY environment variable is automatically used by the SDK.
 * This function configures optional tracing features.
 *
 * @returns True if initialization successful
 */
export const initializeAgentsSdk = (): boolean => {
  try {
    const sdkConfig = getAgentsSdkConfig();

    // Validate API key exists
    if (!sdkConfig.apiKey) {
      throw new Error('OpenAI API key is required for Agents SDK');
    }

    // Validate API key format
    if (!sdkConfig.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format (must start with "sk-")');
    }

    // Configure tracing if enabled (DISABLED by default for GDPR)
    if (sdkConfig.tracing.enabled) {
      // Warn if tracing enabled in production
      if (isProduction) {
        logError(
          'WARNING: Tracing is enabled in production. This sends data to OpenAI. ' +
            'Ensure proper consent mechanisms are in place for GDPR compliance.',
          new Error('TRACING_ENABLED_IN_PRODUCTION')
        );
      }

      // Set OpenAI API key for trace export
      setTracingExportApiKey(sdkConfig.apiKey);

      // Configure default tracing exporter
      setDefaultOpenAITracingExporter();

      // Start trace export loop (async, fire-and-forget)
      startTraceExportLoop();

      logInfo('OpenAI Agents SDK tracing enabled', {
        endpoint: sdkConfig.tracing.endpoint,
        environment: config.NODE_ENV,
      });
    } else {
      logInfo(
        'OpenAI Agents SDK initialized (tracing disabled for GDPR compliance)',
        {
          environment: config.NODE_ENV,
        }
      );
    }

    return true;
  } catch (error) {
    logError('Failed to initialize Agents SDK', error as Error);
    return false;
  }
};

/**
 * Export Agent class for creating agent instances
 *
 * The OpenAI Agents SDK uses a simple pattern:
 * 1. Create agent: new Agent({ name, instructions })
 * 2. Execute agent: run(agent, userInput)
 *
 * This export provides access to the Agent class.
 */
export const AgentClass = Agent;

/**
 * Check if Agents SDK is properly configured
 */
export const isAgentsSdkConfigured = (): boolean => {
  try {
    const sdkConfig = getAgentsSdkConfig();
    return (
      sdkConfig.apiKey !== undefined &&
      sdkConfig.apiKey.startsWith('sk-') &&
      sdkConfig.apiKey.length > 20
    );
  } catch {
    return false;
  }
};

/**
 * Sanitize trace data to remove PII (RISK-007, RISK-021)
 *
 * This function should be called before sending any data to OpenAI traces.
 */
export interface TraceData {
  userId?: string;
  sessionId?: string;
  prompt?: string;
  [key: string]: unknown;
}

export const sanitizeTraceData = (data: TraceData): TraceData => {
  const sanitized = { ...data };

  // Anonymize user ID (hash to prevent identification)
  if (sanitized.userId) {
    const hash = sanitized.userId.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);
    sanitized.userId = `anon-${Math.abs(hash).toString(16).substring(0, 8)}`;
  }

  // Anonymize session ID
  if (sanitized.sessionId) {
    const hash = sanitized.sessionId.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);
    sanitized.sessionId = `sess-${Math.abs(hash).toString(16).substring(0, 8)}`;
  }

  // Remove PII from prompts using simple regex
  if (sanitized.prompt && typeof sanitized.prompt === 'string') {
    sanitized.prompt = sanitizePII(sanitized.prompt);
  }

  return sanitized;
};

/**
 * Remove PII from text strings
 * Simple implementation - can be enhanced with NLP in future
 */
export const sanitizePII = (text: string): string => {
  let sanitized = text;

  // Common German/English names (simplified - would use NER in production)
  const commonNames = [
    'Anna',
    'Max',
    'Marie',
    'Paul',
    'Sophie',
    'Lukas',
    'Emma',
    'Ben',
    'Mia',
    'Jonas',
    'Laura',
    'Felix',
    'Hannah',
    'Leon',
    'Lena',
    'Tim',
  ];

  // Replace common names with [REDACTED]
  commonNames.forEach((name) => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '[REDACTED]');
  });

  // Remove email addresses
  sanitized = sanitized.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    '[EMAIL]'
  );

  // Remove phone numbers (German format)
  sanitized = sanitized.replace(/\b(\+49|0)[1-9]\d{1,14}\b/g, '[PHONE]');

  return sanitized;
};

// Initialize SDK at module load (singleton pattern)
// This configures tracing if enabled
initializeAgentsSdk();
