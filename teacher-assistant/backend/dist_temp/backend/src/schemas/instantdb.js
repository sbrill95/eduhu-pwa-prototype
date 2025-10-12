"use strict";
/**
 * InstantDB Schema Design for Teacher Assistant Chat Application
 * Phase 3 Preparation - Data Models and Relationships
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbHelpers = exports.teacherAssistantPermissions = exports.teacherAssistantSchema = void 0;
var core_1 = require("@instantdb/core");
/**
 * Teacher Assistant InstantDB Schema
 *
 * This schema defines the data structure for our teacher assistant application
 * with real-time chat capabilities, user management, and educational content storage.
 */
exports.teacherAssistantSchema = core_1.i.schema({
    entities: {
        // User entities for teachers and administrators
        users: core_1.i.entity({
            email: core_1.i.string().unique().indexed(),
            name: core_1.i.string(),
            role: core_1.i.string(), // 'teacher', 'admin', 'student'
            school: core_1.i.string().optional(),
            grade_levels: core_1.i.string().optional(), // JSON array of grade levels taught
            subjects: core_1.i.string().optional(), // JSON array of subjects taught
            preferences: core_1.i.string().optional(), // JSON object for UI preferences
            created_at: core_1.i.number(),
            last_active: core_1.i.number(),
            is_active: core_1.i.boolean(),
        }),
        // Chat sessions - each new chat creates a session
        chat_sessions: core_1.i.entity({
            title: core_1.i.string(), // Auto-generated title from first message or user-defined
            created_at: core_1.i.number(),
            updated_at: core_1.i.number(),
            is_archived: core_1.i.boolean(),
            session_type: core_1.i.string(), // 'general', 'lesson_plan', 'quiz_creation', 'administrative'
            metadata: core_1.i.string().optional(), // JSON object for additional session context
            tags: core_1.i.string().optional(), // JSON array of chat tags for categorization and search
        }),
        // Individual chat messages within sessions
        messages: core_1.i.entity({
            content: core_1.i.string(),
            role: core_1.i.string(), // 'user', 'assistant', 'system'
            timestamp: core_1.i.number(),
            token_usage: core_1.i.number().optional(), // For tracking OpenAI token consumption
            model_used: core_1.i.string().optional(), // Which OpenAI model was used
            processing_time: core_1.i.number().optional(), // Response time in milliseconds
            is_edited: core_1.i.boolean(),
            edited_at: core_1.i.number().optional(),
            message_index: core_1.i.number(), // Order within the session
            metadata: core_1.i.string().optional(), // JSON object for agent suggestions
        }),
        // Educational artifacts generated during chats (lesson plans, quizzes, etc.)
        artifacts: core_1.i.entity({
            title: core_1.i.string(),
            type: core_1.i.string(), // 'lesson_plan', 'quiz', 'worksheet', 'template', 'resource', 'image'
            content: core_1.i.string(), // Markdown or structured content
            grade_level: core_1.i.string().optional(),
            subject: core_1.i.string().optional(),
            created_at: core_1.i.number(),
            updated_at: core_1.i.number(),
            is_favorite: core_1.i.boolean(),
            tags: core_1.i.string().optional(), // JSON array of tags
            usage_count: core_1.i.number(), // How many times accessed/reused
        }),
        // Template library for reusable educational content
        templates: core_1.i.entity({
            name: core_1.i.string(),
            description: core_1.i.string(),
            category: core_1.i.string(), // 'lesson_plan', 'quiz', 'email', 'report', etc.
            template_content: core_1.i.string(), // Template structure with placeholders
            is_public: core_1.i.boolean(), // Whether other teachers can use it
            created_at: core_1.i.number(),
            updated_at: core_1.i.number(),
            usage_count: core_1.i.number(),
        }),
        // User feedback and ratings for continuous improvement
        feedback: core_1.i.entity({
            rating: core_1.i.number(), // 1-5 star rating
            comment: core_1.i.string().optional(),
            feedback_type: core_1.i.string(), // 'chat_response', 'artifact', 'general'
            created_at: core_1.i.number(),
        }),
        // BUG-025 FIX: Library materials for storing generated images and resources
        library_materials: core_1.i.entity({
            user_id: core_1.i.string().indexed(),
            title: core_1.i.string(),
            type: core_1.i.string(), // 'image', 'document', 'resource'
            content: core_1.i.string(), // URL or content
            description: core_1.i.string().optional(),
            tags: core_1.i.string().optional(), // JSON array of tags
            created_at: core_1.i.number(),
            updated_at: core_1.i.number(),
            is_favorite: core_1.i.boolean(),
            usage_count: core_1.i.number(),
            source_session_id: core_1.i.string().optional(),
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
exports.teacherAssistantPermissions = {
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
 * Helper functions for common InstantDB operations
 */
exports.dbHelpers = {
    // Create a new chat session
    createChatSession: function (userId, title, sessionType) {
        if (sessionType === void 0) { sessionType = 'general'; }
        return ({
            title: title || 'New Chat',
            created_at: Date.now(),
            updated_at: Date.now(),
            is_archived: false, // Provide default value here instead of schema
            session_type: sessionType,
            owner: userId,
        });
    },
    // Create a new message in a session
    createMessage: function (sessionId, userId, content, role, messageIndex) {
        if (role === void 0) { role = 'user'; }
        return ({
            content: content,
            role: role,
            timestamp: Date.now(),
            is_edited: false, // Provide default value here instead of schema
            message_index: messageIndex,
            session: sessionId,
            author: userId,
        });
    },
    // Create an artifact from a chat session
    createArtifact: function (sessionId, userId, title, type, content) { return ({
        title: title,
        type: type,
        content: content,
        created_at: Date.now(),
        updated_at: Date.now(),
        is_favorite: false, // Provide default value here instead of schema
        usage_count: 0, // Provide default value here instead of schema
        source_session: sessionId,
        creator: userId,
    }); },
    // Update session timestamp when new message is added
    updateSessionTimestamp: function (sessionId) { return ({
        updated_at: Date.now(),
    }); },
};
exports.default = exports.teacherAssistantSchema;
