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

// API Response interfaces
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
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

// OpenAI Chat types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse extends ApiResponse {
  success: true;
  data: {
    message: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    model: string;
    finish_reason: string;
  };
}

export interface ChatErrorResponse extends ErrorResponse {
  error_type?: 'validation' | 'openai_api' | 'rate_limit' | 'server_error';
  error_code?: string;
  user_message?: string; // User-friendly message for frontend display
  suggested_action?: string; // Suggested action for the user
  retry_after?: number; // For rate limiting - seconds to wait
}
