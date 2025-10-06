/**
 * InstantDB Schema Design for Teacher Assistant Chat Application
 * Phase 3 Preparation - Data Models and Relationships
 */

import { i } from '@instantdb/core';

/**
 * Teacher Assistant InstantDB Schema
 *
 * This schema defines the data structure for our teacher assistant application
 * with real-time chat capabilities, user management, and educational content storage.
 */
export const teacherAssistantSchema = i.schema({
  entities: {
    // User entities for teachers and administrators
    users: i.entity({
      email: i.string().unique().indexed(),
      name: i.string(),
      role: i.string(), // 'teacher', 'admin', 'student'
      school: i.string().optional(),
      grade_levels: i.string().optional(), // JSON array of grade levels taught
      subjects: i.string().optional(), // JSON array of subjects taught
      preferences: i.string().optional(), // JSON object for UI preferences
      created_at: i.number(),
      last_active: i.number(),
      is_active: i.boolean(),
    }),

    // Chat sessions - each new chat creates a session
    chat_sessions: i.entity({
      title: i.string(), // Auto-generated title from first message or user-defined
      created_at: i.number(),
      updated_at: i.number(),
      is_archived: i.boolean(),
      session_type: i.string(), // 'general', 'lesson_plan', 'quiz_creation', 'administrative'
      metadata: i.string().optional(), // JSON object for additional session context
      tags: i.string().optional(), // JSON array of chat tags for categorization and search
    }),

    // Individual chat messages within sessions
    messages: i.entity({
      content: i.string(),
      role: i.string(), // 'user', 'assistant', 'system'
      timestamp: i.number(),
      token_usage: i.number().optional(), // For tracking OpenAI token consumption
      model_used: i.string().optional(), // Which OpenAI model was used
      processing_time: i.number().optional(), // Response time in milliseconds
      is_edited: i.boolean(),
      edited_at: i.number().optional(),
      message_index: i.number(), // Order within the session
      metadata: i.string().optional(), // JSON object for agent suggestions
    }),

    // Educational artifacts generated during chats (lesson plans, quizzes, etc.)
    artifacts: i.entity({
      title: i.string(),
      type: i.string(), // 'lesson_plan', 'quiz', 'worksheet', 'template', 'resource', 'image'
      content: i.string(), // Markdown or structured content
      grade_level: i.string().optional(),
      subject: i.string().optional(),
      created_at: i.number(),
      updated_at: i.number(),
      is_favorite: i.boolean(),
      tags: i.string().optional(), // JSON array of tags
      usage_count: i.number(), // How many times accessed/reused
    }),

    // Template library for reusable educational content
    templates: i.entity({
      name: i.string(),
      description: i.string(),
      category: i.string(), // 'lesson_plan', 'quiz', 'email', 'report', etc.
      template_content: i.string(), // Template structure with placeholders
      is_public: i.boolean(), // Whether other teachers can use it
      created_at: i.number(),
      updated_at: i.number(),
      usage_count: i.number(),
    }),

    // User feedback and ratings for continuous improvement
    feedback: i.entity({
      rating: i.number(), // 1-5 star rating
      comment: i.string().optional(),
      feedback_type: i.string(), // 'chat_response', 'artifact', 'general'
      created_at: i.number(),
    }),
  },

  links: {
    // User -> Chat Sessions (one user can have many sessions)
    userSessions: {
      forward: {
        on: 'chat_sessions',
        has: 'one',
        label: 'owner'
      },
      reverse: {
        on: 'users',
        has: 'many',
        label: 'chat_sessions'
      }
    },

    // Session -> Messages (one session contains many messages)
    sessionMessages: {
      forward: {
        on: 'messages',
        has: 'one',
        label: 'session'
      },
      reverse: {
        on: 'chat_sessions',
        has: 'many',
        label: 'messages'
      }
    },

    // User -> Messages (track message authorship for analytics)
    userMessages: {
      forward: {
        on: 'messages',
        has: 'one',
        label: 'author'
      },
      reverse: {
        on: 'users',
        has: 'many',
        label: 'authored_messages'
      }
    },

    // Session -> Artifacts (artifacts generated from specific sessions)
    sessionArtifacts: {
      forward: {
        on: 'artifacts',
        has: 'one',
        label: 'source_session'
      },
      reverse: {
        on: 'chat_sessions',
        has: 'many',
        label: 'generated_artifacts'
      }
    },

    // User -> Artifacts (user ownership of generated content)
    userArtifacts: {
      forward: {
        on: 'artifacts',
        has: 'one',
        label: 'creator'
      },
      reverse: {
        on: 'users',
        has: 'many',
        label: 'created_artifacts'
      }
    },

    // User -> Templates (user-created templates)
    userTemplates: {
      forward: {
        on: 'templates',
        has: 'one',
        label: 'creator'
      },
      reverse: {
        on: 'users',
        has: 'many',
        label: 'created_templates'
      }
    },

    // User -> Feedback (feedback provided by users)
    userFeedback: {
      forward: {
        on: 'feedback',
        has: 'one',
        label: 'user'
      },
      reverse: {
        on: 'users',
        has: 'many',
        label: 'feedback_provided'
      }
    },

    // Message -> Feedback (feedback on specific messages/responses)
    messageFeedback: {
      forward: {
        on: 'feedback',
        has: 'one',
        label: 'message'
      },
      reverse: {
        on: 'messages',
        has: 'many',
        label: 'feedback_received'
      }
    },

    // Artifact -> Feedback (feedback on generated educational content)
    artifactFeedback: {
      forward: {
        on: 'feedback',
        has: 'one',
        label: 'artifact'
      },
      reverse: {
        on: 'artifacts',
        has: 'many',
        label: 'feedback_received'
      }
    },
  }
});

/**
 * Permission Rules for Teacher Assistant Application
 *
 * These rules ensure data security and proper access control:
 * - Teachers can only access their own data
 * - Public templates are readable by all authenticated users
 * - Rate limiting for message creation to prevent abuse
 */
export const teacherAssistantPermissions = {
  users: {
    allow: {
      view: "auth.id == data.id",
      create: "auth.id == data.id",
      update: "auth.id == data.id",
      delete: "auth.id == data.id"
    }
  },
  chat_sessions: {
    allow: {
      view: "auth.id == data.ref('owner.id')",
      create: "auth.id == data.ref('owner.id')",
      update: "auth.id == data.ref('owner.id')",
      delete: "auth.id == data.ref('owner.id')"
    }
  },
  messages: {
    allow: {
      view: "auth.id == data.ref('session.owner.id')",
      create: "auth.id == data.ref('session.owner.id') && size(data.ref('author.authored_messages.id')) <= 10000", // Rate limiting
      update: "auth.id == data.ref('author.id') && data.role == 'user'", // Only users can edit their own messages
      delete: "auth.id == data.ref('author.id')"
    }
  },
  artifacts: {
    allow: {
      view: "auth.id == data.ref('creator.id')",
      create: "auth.id == data.ref('creator.id')",
      update: "auth.id == data.ref('creator.id')",
      delete: "auth.id == data.ref('creator.id')"
    }
  },
  templates: {
    allow: {
      view: "data.is_public == true || auth.id == data.ref('creator.id')",
      create: "auth.id == data.ref('creator.id')",
      update: "auth.id == data.ref('creator.id')",
      delete: "auth.id == data.ref('creator.id')"
    }
  },
  feedback: {
    allow: {
      view: "auth.id == data.ref('user.id')",
      create: "auth.id == data.ref('user.id')",
      update: "auth.id == data.ref('user.id')",
      delete: "auth.id == data.ref('user.id')"
    }
  }
};

/**
 * Type definitions for TypeScript integration
 */
export type TeacherAssistantDB = typeof teacherAssistantSchema;

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'admin' | 'student';
  school?: string;
  grade_levels?: string[]; // Parsed from JSON
  subjects?: string[]; // Parsed from JSON
  preferences?: Record<string, any>; // Parsed from JSON
  created_at: number;
  last_active: number;
  is_active: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  is_archived: boolean;
  session_type: 'general' | 'lesson_plan' | 'quiz_creation' | 'administrative';
  metadata?: Record<string, any>; // Parsed from JSON
  tags?: string[]; // Parsed from JSON - categorization tags for the chat
  owner: User;
  messages: Message[];
  generated_artifacts: Artifact[];
};

export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  token_usage?: number;
  model_used?: string;
  processing_time?: number;
  is_edited: boolean;
  edited_at?: number;
  message_index: number;
  session: ChatSession;
  author: User;
  feedback_received: Feedback[];
};

export type Artifact = {
  id: string;
  title: string;
  type: 'lesson_plan' | 'quiz' | 'worksheet' | 'template' | 'resource' | 'image';
  content: string;
  grade_level?: string;
  subject?: string;
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
  tags?: string[]; // Parsed from JSON
  usage_count: number;
  source_session?: ChatSession;
  creator: User;
  feedback_received: Feedback[];
};

export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  template_content: string;
  is_public: boolean;
  created_at: number;
  updated_at: number;
  usage_count: number;
  creator: User;
};

export type Feedback = {
  id: string;
  rating: number; // 1-5
  comment?: string;
  feedback_type: 'chat_response' | 'artifact' | 'general';
  created_at: number;
  user: User;
  message?: Message;
  artifact?: Artifact;
};

export type ProfileCharacteristic = {
  id: string;
  user_id: string;
  characteristic: string;
  category: string;
  count: number;
  manually_added: boolean;
  first_seen: number;
  last_seen: number;
  created_at: number;
  updated_at: number;
};

/**
 * Helper functions for common InstantDB operations
 */
export const dbHelpers = {
  // Create a new chat session
  createChatSession: (userId: string, title?: string, sessionType: string = 'general') => ({
    title: title || 'New Chat',
    created_at: Date.now(),
    updated_at: Date.now(),
    is_archived: false, // Provide default value here instead of schema
    session_type: sessionType,
    owner: userId,
  }),

  // Create a new message in a session
  createMessage: (sessionId: string, userId: string, content: string, role: 'user' | 'assistant' = 'user', messageIndex: number) => ({
    content,
    role,
    timestamp: Date.now(),
    is_edited: false, // Provide default value here instead of schema
    message_index: messageIndex,
    session: sessionId,
    author: userId,
  }),

  // Create an artifact from a chat session
  createArtifact: (sessionId: string, userId: string, title: string, type: string, content: string) => ({
    title,
    type,
    content,
    created_at: Date.now(),
    updated_at: Date.now(),
    is_favorite: false, // Provide default value here instead of schema
    usage_count: 0, // Provide default value here instead of schema
    source_session: sessionId,
    creator: userId,
  }),

  // Update session timestamp when new message is added
  updateSessionTimestamp: (sessionId: string) => ({
    updated_at: Date.now(),
  }),
};

export default teacherAssistantSchema;