/**
 * Shared Database Schemas - Teacher Assistant
 *
 * This file contains TypeScript interfaces for InstantDB entities
 *
 * RULES:
 * 1. Keep in sync with InstantDB schema
 * 2. Frontend AND Backend import these
 * 3. Use for type-safe database queries
 *
 * @see teacher-assistant/frontend/src/lib/instantdb.ts
 * @see teacher-assistant/backend/src/schemas/instantdb.ts
 */

// ============================================================================
// MESSAGES
// ============================================================================

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  user_id: string;
  session_id: string;
  message_index: number;
  timestamp: Date;
  created_at: Date;
  metadata?: Record<string, any>; // JSON object for additional message data (e.g., agent suggestions)
}

// ============================================================================
// CHAT SESSIONS
// ============================================================================

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  message_count: number;
}

// ============================================================================
// USER PROFILES
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TEACHER CHARACTERISTICS
// ============================================================================

export interface TeacherCharacteristic {
  id: string;
  user_id: string;
  category: string;
  value: string;
  confidence: number;
  extracted_at: Date;
  source_session_id?: string;
}

// ============================================================================
// MATERIALS / ARTIFACTS
// ============================================================================

export interface GeneratedArtifact {
  id: string;
  user_id: string;
  artifact_type: 'image' | 'worksheet' | 'presentation' | 'document';
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  tags?: string[];
  created_at: Date;
  session_id?: string;
  generator_agent?: string;
}

// ============================================================================
// CONTEXT ITEMS
// ============================================================================

export interface ContextItem {
  id: string;
  user_id: string;
  name: string;
  type: 'subject' | 'class' | 'topic' | 'custom';
  value: string;
  created_at: Date;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isChatMessage = (data: any): data is ChatMessage => {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.content === 'string' &&
    ['user', 'assistant', 'system'].includes(data.role)
  );
};

export const isGeneratedArtifact = (data: any): data is GeneratedArtifact => {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    ['image', 'worksheet', 'presentation', 'document'].includes(data.artifact_type)
  );
};
