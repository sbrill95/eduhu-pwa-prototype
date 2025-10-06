/**
 * Shared API Contracts - Teacher Assistant
 *
 * This file contains TypeScript interfaces for ALL API requests/responses
 * between Frontend and Backend.
 *
 * RULES:
 * 1. Backend-Agent defines types HERE first
 * 2. Frontend-Agent IMPORTS these types (never duplicate!)
 * 3. Backend validates requests against these types using Zod
 * 4. Both sides use SAME field names → No mismatches!
 *
 * @see /docs/guides/PERFECT-WORKFLOW.md
 */

// ============================================================================
// IMAGE GENERATION
// ============================================================================

/**
 * Image Generation Request
 * @route POST /api/langgraph/agents/execute
 * @frontend AgentFormView.tsx
 * @backend langGraphAgents.ts
 */
export interface ImageGenerationRequest {
  /** User's description of what the image should show (min 10 chars) */
  description: string;
  /** Visual style for the image */
  imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
}

/**
 * Image Generation Response
 * @route POST /api/langgraph/agents/execute
 */
export interface ImageGenerationResponse {
  success: boolean;
  data: {
    /** URL to the generated image */
    imageUrl: string;
    /** Prompt used for generation */
    prompt: string;
    /** Timestamp of generation */
    generatedAt: string;
    /** Auto-generated title for Library */
    title?: string;
    /** Auto-generated tags for search */
    tags?: string[];
  };
  error?: string;
}

// ============================================================================
// CHAT
// ============================================================================

/**
 * Chat Message Request
 * @route POST /api/chat
 * @frontend ChatView.tsx
 * @backend routes/index.ts
 */
export interface ChatMessageRequest {
  /** Array of messages in the conversation */
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  /** User ID for context */
  userId: string;
  /** Optional session ID for continuation */
  sessionId?: string;
}

/**
 * Chat Message Response
 * @route POST /api/chat
 */
export interface ChatMessageResponse {
  /** AI-generated response text */
  content: string;
  /** Agent suggestion if AI detected intent */
  agentSuggestion?: {
    agentType: 'image-generation' | 'worksheet-generation';
    reasoning: string;
    prefillData: Record<string, any>;
  };
  /** Session ID for tracking */
  sessionId: string;
}

// ============================================================================
// PROFILE
// ============================================================================

/**
 * Profile Extraction Request
 * @route POST /api/profile/extract
 * @frontend ProfileView.tsx
 * @backend routes/profile.ts
 */
export interface ProfileExtractionRequest {
  /** User ID */
  userId: string;
  /** Conversation history for extraction */
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Profile Extraction Response
 * @route POST /api/profile/extract
 */
export interface ProfileExtractionResponse {
  /** Extracted characteristics */
  characteristics: Array<{
    /** Category (e.g., "Lieblingsfach", "Unterrichtsstil") */
    category: string;
    /** Value (e.g., "Mathematik", "Frontalunterricht") */
    value: string;
    /** Confidence score 0-1 */
    confidence: number;
  }>;
}

// ============================================================================
// MATERIALS / LIBRARY
// ============================================================================

/**
 * Material Upload Request
 * @route POST /api/materials/upload
 * @frontend LibraryView.tsx
 * @backend routes/materials.ts
 */
export interface MaterialUploadRequest {
  /** User ID */
  userId: string;
  /** Material title */
  title: string;
  /** Material type */
  type: 'image' | 'worksheet' | 'presentation' | 'document';
  /** File data (base64 or URL) */
  fileData: string;
  /** Optional tags for search */
  tags?: string[];
  /** Optional description */
  description?: string;
}

/**
 * Material Upload Response
 * @route POST /api/materials/upload
 */
export interface MaterialUploadResponse {
  success: boolean;
  data?: {
    /** Material ID in database */
    materialId: string;
    /** URL to access the material */
    url: string;
  };
  error?: string;
}

// ============================================================================
// AGENT EXECUTION
// ============================================================================

/**
 * Agent Execution Request (Generic)
 * @route POST /api/langgraph/agents/execute
 * @frontend AgentContext.tsx
 * @backend routes/langGraphAgents.ts
 */
export interface AgentExecutionRequest {
  /** Agent ID (e.g., "langgraph-image-generation") */
  agentId: string;
  /** Input data (structure depends on agent type) */
  input: string | Record<string, any>;
  /** Optional context data */
  context?: Record<string, any>;
  /** User ID */
  userId?: string;
  /** Session ID */
  sessionId?: string;
}

/**
 * Agent Execution Response (Generic)
 * @route POST /api/langgraph/agents/execute
 */
export interface AgentExecutionResponse {
  success: boolean;
  data?: {
    /** Execution preview (before actual execution) */
    execution_preview?: {
      agent_id: string;
      agent_name: string;
      can_execute: boolean;
      requires_confirmation: boolean;
    };
    /** Actual execution result (after confirmation) */
    result?: Record<string, any>;
  };
  error?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Type Guards for Runtime Validation
 */
export const isImageGenerationRequest = (data: any): data is ImageGenerationRequest => {
  return (
    typeof data === 'object' &&
    typeof data.description === 'string' &&
    data.description.length >= 10 &&
    ['realistic', 'cartoon', 'illustrative', 'abstract'].includes(data.imageStyle)
  );
};

export const isChatMessageRequest = (data: any): data is ChatMessageRequest => {
  return (
    typeof data === 'object' &&
    Array.isArray(data.messages) &&
    typeof data.userId === 'string'
  );
};
