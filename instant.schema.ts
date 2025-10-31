// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/admin";

const _schema = i.schema({
  // We inferred 4 attributes!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      type: i.string().optional(),
    }),
    chat_sessions: i.entity({
      created_at: i.number().optional(),
      is_archived: i.boolean().optional(),
      message_count: i.number().optional(),
      summary: i.string().optional(),
      title: i.string().optional(),
      updated_at: i.number().optional(),
      user_id: i.string().indexed().optional(),
    }),
    chats: i.entity({
      created_at: i.number().optional(),
      title: i.string().optional(),
      updated_at: i.number().optional(),
    }),
    generated_artifacts: i.entity({
      is_favorite: i.boolean().optional(),
      usage_count: i.number().optional(),
    }),
    library_materials: i.entity({
      content: i.string().optional(),
      created_at: i.number().optional(),
      description: i.string().optional(),
      is_favorite: i.boolean().optional(),
      metadata: i.json().optional(), // Added for FR-007: Store originalParams for re-generation
      source_session_id: i.string().optional(),
      tags: i.string().optional(),
      title: i.string().optional(),
      type: i.string().optional(),
      updated_at: i.number().optional(),
      usage_count: i.number().optional(),
      user_id: i.string().indexed().optional(),
    }),
    messages: i.entity({
      author: i.string().optional(),
      chat_id: i.string().optional(),
      content: i.string().optional(),
      content_type: i.string().optional(),
      educational_topics: i.json().optional(),
      is_edited: i.boolean().optional(),
      message_index: i.number().optional(),
      metadata: i.json().optional(), // Changed from i.string() per FR-009: Store as JSON for proper querying
      response_time_ms: i.number().optional(),
      role: i.string().optional(),
      session: i.string().optional(),
      session_id: i.string().indexed().optional(),
      timestamp: i.number().optional(),
      token_count: i.number().optional(),
      user_id: i.string().indexed().optional(),
    }),
    profile_characteristics: i.entity({
      category: i.string().optional(),
      characteristic: i.string().optional(),
      count: i.number().optional(),
      created_at: i.number().optional(),
      first_seen: i.number().optional(),
      last_seen: i.number().optional(),
      manually_added: i.boolean().optional(),
      updated_at: i.number().optional(),
      user_id: i.string().optional(),
    }),
    teacher_profiles: i.entity({
      challenges: i.string().optional(),
      conversation_count: i.number().optional(),
      created_at: i.number().optional(),
      extraction_history: i.string().optional(),
      grades: i.string().optional(),
      last_updated: i.number().optional(),
      school_type: i.string().optional(),
      subjects: i.string().optional(),
      teaching_methods: i.string().optional(),
      topics: i.string().optional(),
      user_id: i.string().unique().indexed().optional(),
    }),
    users: i.entity({
      last_active: i.number().optional(),
      name: i.string().optional(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
  },
  rooms: {},
  permissions: {
    // Storage files - public read, authenticated write
    // This enables permanent storage for generated images that can be viewed by anyone
    $files: {
      allow: {
        view: "true", // Public read access - anyone can view uploaded files
        create: "auth.id != null", // Only authenticated users can upload
        delete: "auth.id != null" // Only authenticated users can delete
      }
    },
    // Library materials - only owner can access (or test user)
    library_materials: {
      allow: {
        view: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        create: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        update: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        delete: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'"
      }
    },
    // Chat sessions - only owner can access (or test user)
    chat_sessions: {
      allow: {
        view: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        create: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        update: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        delete: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'"
      }
    },
    // Messages - only owner can access (or test user)
    messages: {
      allow: {
        view: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        create: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        update: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'",
        delete: "auth.id == data.user_id || auth.id == '38eb3d27-dd97-4ed4-9e80-08fafe18115f'"
      }
    },
    // Teacher profiles - only owner can access
    teacher_profiles: {
      allow: {
        view: "auth.id == data.user_id",
        create: "auth.id == data.user_id",
        update: "auth.id == data.user_id",
        delete: "auth.id == data.user_id"
      }
    },
    // Profile characteristics - only owner can access
    profile_characteristics: {
      allow: {
        view: "auth.id == data.user_id",
        create: "auth.id == data.user_id",
        update: "auth.id == data.user_id",
        delete: "auth.id == data.user_id"
      }
    }
  }
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
