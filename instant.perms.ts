// InstantDB Permissions
// Docs: https://www.instantdb.com/docs/permissions

export default {
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
};
