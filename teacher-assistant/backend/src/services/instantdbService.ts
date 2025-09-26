/**
 * InstantDB Service Layer for Teacher Assistant Backend
 * Phase 3 Preparation - Backend Integration with InstantDB
 */

import { init } from '@instantdb/admin';
import {
  teacherAssistantSchema,
  dbHelpers,
  type User,
  type ChatSession,
  type Message,
  type Artifact
} from '../schemas/instantdb';
import { logError, logInfo } from '../config/logger';
import { config } from '../config';

/**
 * InstantDB Admin Client for server-side operations
 * This will be initialized when InstantDB integration is enabled
 */
let instantDB: any = null;

/**
 * Initialize InstantDB connection
 */
export const initializeInstantDB = () => {
  try {
    if (!config.INSTANTDB_APP_ID || !config.INSTANTDB_ADMIN_TOKEN) {
      logError('InstantDB credentials not configured', new Error('Missing INSTANTDB_APP_ID or INSTANTDB_ADMIN_TOKEN'));
      return false;
    }

    instantDB = init({
      appId: config.INSTANTDB_APP_ID,
      adminToken: config.INSTANTDB_ADMIN_TOKEN,
      schema: teacherAssistantSchema,
    });

    logInfo('InstantDB initialized successfully', {
      appId: config.INSTANTDB_APP_ID.substring(0, 8) + '...',
    });

    return true;
  } catch (error) {
    logError('Failed to initialize InstantDB', error as Error);
    return false;
  }
};

/**
 * Check if InstantDB is available and initialized
 */
export const isInstantDBAvailable = (): boolean => {
  return instantDB !== null;
};

/**
 * Chat Session Management Service
 */
export class ChatSessionService {
  /**
   * Create a new chat session for a user
   */
  static async createSession(userId: string, title?: string, sessionType?: string): Promise<string | null> {
    if (!isInstantDBAvailable()) {
      logError('InstantDB not available for session creation', new Error('InstantDB not initialized'));
      return null;
    }

    try {
      const sessionData = dbHelpers.createChatSession(userId, title, sessionType);
      const result = await instantDB.transact([
        instantDB.tx.chat_sessions[instantDB.id()].update(sessionData)
      ]);

      logInfo('Chat session created successfully', { userId, sessionType });
      return result.txId;
    } catch (error) {
      logError('Failed to create chat session', error as Error, { userId });
      return null;
    }
  }

  /**
   * Get all sessions for a user
   */
  static async getUserSessions(userId: string, includeArchived: boolean = false): Promise<ChatSession[] | null> {
    if (!isInstantDBAvailable()) return null;

    try {
      const query = {
        chat_sessions: {
          $: {
            where: {
              'owner.id': userId,
              is_archived: includeArchived ? undefined : false
            }
          },
          owner: {},
          messages: {
            author: {}
          },
          generated_artifacts: {}
        }
      };

      const result = await instantDB.query(query);
      return result.chat_sessions || [];
    } catch (error) {
      logError('Failed to fetch user sessions', error as Error, { userId });
      return null;
    }
  }

  /**
   * Update session title or metadata
   */
  static async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<boolean> {
    if (!isInstantDBAvailable()) return false;

    try {
      const updateData = {
        ...updates,
        updated_at: Date.now()
      };

      await instantDB.transact([
        instantDB.tx.chat_sessions[sessionId].update(updateData)
      ]);

      return true;
    } catch (error) {
      logError('Failed to update session', error as Error, { sessionId });
      return false;
    }
  }

  /**
   * Archive a chat session
   */
  static async archiveSession(sessionId: string): Promise<boolean> {
    return this.updateSession(sessionId, { is_archived: true });
  }

  /**
   * Delete a chat session and all its messages
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    if (!isInstantDBAvailable()) return false;

    try {
      // Delete all messages in the session first
      await instantDB.transact([
        instantDB.tx.messages[{ 'session.id': sessionId }].delete()
      ]);

      // Then delete the session
      await instantDB.transact([
        instantDB.tx.chat_sessions[sessionId].delete()
      ]);

      return true;
    } catch (error) {
      logError('Failed to delete session', error as Error, { sessionId });
      return false;
    }
  }
}

/**
 * Message Management Service
 */
export class MessageService {
  /**
   * Add a new message to a chat session
   */
  static async createMessage(
    sessionId: string,
    userId: string,
    content: string,
    role: 'user' | 'assistant' = 'user',
    metadata?: {
      token_usage?: number;
      model_used?: string;
      processing_time?: number;
    }
  ): Promise<string | null> {
    if (!isInstantDBAvailable()) return null;

    try {
      // Get current message count for indexing
      const sessionQuery = await instantDB.query({
        chat_sessions: {
          $: { where: { id: sessionId } },
          messages: {}
        }
      });

      const messageIndex = sessionQuery.chat_sessions?.[0]?.messages?.length || 0;

      const messageData = {
        ...dbHelpers.createMessage(sessionId, userId, content, role, messageIndex),
        ...metadata
      };

      const result = await instantDB.transact([
        instantDB.tx.messages[instantDB.id()].update(messageData),
        // Update session timestamp
        instantDB.tx.chat_sessions[sessionId].update(dbHelpers.updateSessionTimestamp(sessionId))
      ]);

      return result.txId;
    } catch (error) {
      logError('Failed to create message', error as Error, { sessionId, userId, role });
      return null;
    }
  }

  /**
   * Get all messages for a session
   */
  static async getSessionMessages(sessionId: string): Promise<Message[] | null> {
    if (!isInstantDBAvailable()) return null;

    try {
      const result = await instantDB.query({
        messages: {
          $: {
            where: { 'session.id': sessionId },
            order: { by: 'message_index', direction: 'asc' }
          },
          author: {},
          session: {},
          feedback_received: {}
        }
      });

      return result.messages || [];
    } catch (error) {
      logError('Failed to fetch session messages', error as Error, { sessionId });
      return null;
    }
  }

  /**
   * Update a message (for editing)
   */
  static async updateMessage(messageId: string, content: string): Promise<boolean> {
    if (!isInstantDBAvailable()) return false;

    try {
      await instantDB.transact([
        instantDB.tx.messages[messageId].update({
          content,
          is_edited: true,
          edited_at: Date.now()
        })
      ]);

      return true;
    } catch (error) {
      logError('Failed to update message', error as Error, { messageId });
      return false;
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<boolean> {
    if (!isInstantDBAvailable()) return false;

    try {
      await instantDB.transact([
        instantDB.tx.messages[messageId].delete()
      ]);

      return true;
    } catch (error) {
      logError('Failed to delete message', error as Error, { messageId });
      return false;
    }
  }
}

/**
 * User Management Service
 */
export class UserService {
  /**
   * Create or update a user profile
   */
  static async upsertUser(userData: Partial<User>): Promise<boolean> {
    if (!isInstantDBAvailable()) return false;

    try {
      const userRecord = {
        ...userData,
        last_active: Date.now(),
        created_at: userData.created_at || Date.now()
      };

      await instantDB.transact([
        instantDB.tx.users[userData.id || instantDB.id()].update(userRecord)
      ]);

      return true;
    } catch (error) {
      logError('Failed to upsert user', error as Error, { userId: userData.id });
      return false;
    }
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<User | null> {
    if (!isInstantDBAvailable()) return null;

    try {
      const result = await instantDB.query({
        users: {
          $: { where: { id: userId } },
          chat_sessions: {
            messages: {}
          },
          created_artifacts: {},
          created_templates: {}
        }
      });

      return result.users?.[0] || null;
    } catch (error) {
      logError('Failed to fetch user', error as Error, { userId });
      return null;
    }
  }

  /**
   * Update user's last active timestamp
   */
  static async updateLastActive(userId: string): Promise<boolean> {
    if (!isInstantDBAvailable()) return false;

    try {
      await instantDB.transact([
        instantDB.tx.users[userId].update({ last_active: Date.now() })
      ]);

      return true;
    } catch (error) {
      logError('Failed to update user last active', error as Error, { userId });
      return false;
    }
  }
}

/**
 * Artifact Management Service
 */
export class ArtifactService {
  /**
   * Create an educational artifact from a chat session
   */
  static async createArtifact(
    sessionId: string,
    userId: string,
    title: string,
    type: string,
    content: string,
    metadata?: {
      grade_level?: string;
      subject?: string;
      tags?: string[];
    }
  ): Promise<string | null> {
    if (!isInstantDBAvailable()) return null;

    try {
      const artifactData = {
        ...dbHelpers.createArtifact(sessionId, userId, title, type, content),
        ...metadata,
        tags: metadata?.tags ? JSON.stringify(metadata.tags) : undefined
      };

      const result = await instantDB.transact([
        instantDB.tx.artifacts[instantDB.id()].update(artifactData)
      ]);

      return result.txId;
    } catch (error) {
      logError('Failed to create artifact', error as Error, { sessionId, userId, type });
      return null;
    }
  }

  /**
   * Get user's artifacts
   */
  static async getUserArtifacts(userId: string, type?: string): Promise<Artifact[] | null> {
    if (!isInstantDBAvailable()) return null;

    try {
      const whereClause: any = { 'creator.id': userId };
      if (type) whereClause.type = type;

      const result = await instantDB.query({
        artifacts: {
          $: {
            where: whereClause,
            order: { by: 'created_at', direction: 'desc' }
          },
          creator: {},
          source_session: {},
          feedback_received: {}
        }
      });

      return result.artifacts || [];
    } catch (error) {
      logError('Failed to fetch user artifacts', error as Error, { userId });
      return null;
    }
  }

  /**
   * Toggle artifact favorite status
   */
  static async toggleFavorite(artifactId: string): Promise<boolean> {
    if (!isInstantDBAvailable()) return false;

    try {
      // First get current status
      const result = await instantDB.query({
        artifacts: {
          $: { where: { id: artifactId } }
        }
      });

      const current = result.artifacts?.[0];
      if (!current) return false;

      await instantDB.transact([
        instantDB.tx.artifacts[artifactId].update({
          is_favorite: !current.is_favorite,
          updated_at: Date.now()
        })
      ]);

      return true;
    } catch (error) {
      logError('Failed to toggle artifact favorite', error as Error, { artifactId });
      return false;
    }
  }
}

/**
 * Analytics and Reporting Service
 */
export class AnalyticsService {
  /**
   * Get user usage statistics
   */
  static async getUserStats(userId: string): Promise<any> {
    if (!isInstantDBAvailable()) return null;

    try {
      const result = await instantDB.query({
        users: {
          $: { where: { id: userId } },
          chat_sessions: {},
          authored_messages: {},
          created_artifacts: {},
          feedback_provided: {}
        }
      });

      const user = result.users?.[0];
      if (!user) return null;

      return {
        total_sessions: user.chat_sessions?.length || 0,
        total_messages: user.authored_messages?.length || 0,
        total_artifacts: user.created_artifacts?.length || 0,
        feedback_count: user.feedback_provided?.length || 0,
        account_age_days: Math.floor((Date.now() - user.created_at) / (1000 * 60 * 60 * 24)),
        last_active_days_ago: Math.floor((Date.now() - user.last_active) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      logError('Failed to fetch user stats', error as Error, { userId });
      return null;
    }
  }
}

/**
 * Export all services and utilities
 */
export const InstantDBService = {
  initialize: initializeInstantDB,
  isAvailable: isInstantDBAvailable,
  ChatSession: ChatSessionService,
  Message: MessageService,
  User: UserService,
  Artifact: ArtifactService,
  Analytics: AnalyticsService,
};