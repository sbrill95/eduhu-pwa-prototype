/**
 * Shared API Types - Request/Response Interfaces
 */

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * Chat Message Interface
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: {
    agentSuggestion?: {
      agentType: string;
      reasoning: string;
      prefillData: Record<string, unknown>;
    };
  };
}

/**
 * Chat Response from Backend
 */
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
    agentSuggestion?: {
      agentType: 'image-generation' | 'worksheet' | 'lesson-plan';
      reasoning: string;
      prefillData: Record<string, unknown>;
    };
  };
}
