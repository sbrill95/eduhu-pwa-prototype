// Import shared types - Single Source of Truth
import type {
  ApiResponse,
  ChatMessage,
  ChatResponse,
  AgentSuggestion,
  ImageGenerationPrefillData,
  AgentParams,
  AgentResult
} from '../../../shared/types';

// Re-export all shared types
export * from '../../../shared/types';
export type {
  ApiResponse,
  ChatMessage,
  ChatResponse,
  AgentSuggestion,
  ImageGenerationPrefillData,
  AgentParams,
  AgentResult
};

// Environment variables interface
export interface EnvironmentVariables {
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
  FRONTEND_URL: string;
  API_PREFIX: string;
  OPENAI_API_KEY: string;
  // Optional InstantDB configuration (Phase 3)
  INSTANTDB_APP_ID?: string;
  INSTANTDB_ADMIN_TOKEN?: string;
}

// OpenAI Error interface for better type safety
export interface OpenAIErrorDetails {
  message: string;
  type?: string;
  param?: string;
  code?: string;
  status?: number;
  stack?: string;
}

// Model information interface
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  recommended: boolean;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
}

// Request/Response types
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
}

// OpenAI Chat types - Backend specific
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Note: ChatMessage, AgentSuggestion, and ChatResponse are now imported from shared types

export interface ChatErrorResponse extends ErrorResponse {
  error_type?: 'validation' | 'openai_api' | 'rate_limit' | 'server_error';
  error_code?: string;
  user_message?: string; // User-friendly message for frontend display
  suggested_action?: string; // Suggested action for the user
  retry_after?: number; // For rate limiting - seconds to wait
}

// Prompt Service types
export interface GeneratePromptsRequest {
  userId?: string;
  limit?: number;
  excludeIds?: string[];
  seed?: string;
}

export interface PromptSuggestion {
  id: string;
  text: string;
  category: string;
  weight?: number;
}

export interface PromptTemplate {
  id: string;
  text: string;
  category: string;
  requiresContext: string[];
  weight: number;
}
