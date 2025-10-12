/**
 * Shared API Types - Request/Response Interfaces
 */

import { ImageGenerationPrefillData } from './agents';

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
      prefillData: ImageGenerationPrefillData | Record<string, unknown>;
    };
  };
}

/**
 * InstantDB Message Entity (T014: FR-004)
 * Metadata stored as JSON string, not object
 */
export interface Message {
  id: string;
  author?: string;
  chat_id?: string;
  content?: string;
  content_type?: string;
  educational_topics?: unknown; // JSON type
  is_edited?: boolean;
  message_index?: number;
  metadata?: string | null; // FR-004: JSON string, not object
  response_time_ms?: number;
  role?: string;
  session?: string;
  session_id?: string;
  timestamp?: number;
  token_count?: number;
  user_id?: string;
}

/**
 * InstantDB LibraryMaterial Entity (T022: FR-004)
 * Metadata stored as JSON string, not object
 */
export interface LibraryMaterial {
  id: string;
  content?: string;
  created_at?: number;
  description?: string;
  is_favorite?: boolean;
  metadata?: string | null; // FR-004: JSON string, not object
  source_session_id?: string;
  tags?: string;
  title?: string;
  type?: string;
  updated_at?: number;
  usage_count?: number;
  user_id?: string;
}
