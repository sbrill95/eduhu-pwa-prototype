/**
 * Shared Agent Types - Single Source of Truth
 * Used by both Frontend and Backend to prevent field name mismatches
 */

/**
 * Image Generation Agent - Prefill Data
 * Frontend sends this, Backend receives this
 */
export interface ImageGenerationPrefillData {
  description: string;  // Main prompt/description (e.g., "Satz des Pythagoras")
  imageStyle?: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
  learningGroup?: string;  // Optional: e.g., "Klasse 8a"
  subject?: string;  // Optional: e.g., "Mathematik"
}

/**
 * Agent Suggestion from Backend
 * Backend sends this to Frontend when AI detects agent opportunity
 */
export interface AgentSuggestion {
  agentType: 'image-generation' | 'worksheet' | 'lesson-plan';
  reasoning: string;  // Why the AI suggests this agent
  prefillData: ImageGenerationPrefillData | Record<string, unknown>;  // Prefill data for the agent form
}

/**
 * Generic Agent Execution Parameters
 */
export interface AgentParams {
  prompt?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Generic Agent Result
 */
export interface AgentResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  cost?: number;
  metadata?: Record<string, unknown>;
  artifacts?: Array<unknown>;
}
