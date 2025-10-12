# Data Model: Bug Fixes 2025-10-11

## Overview

This document defines the InstantDB schema changes required to resolve 4 active bugs in the Teacher Assistant application. The focus is on fixing field mismatches, adding metadata support, and ensuring proper data persistence for messages and library materials.

## InstantDB Schema Changes

### Messages Table

The messages table stores chat conversation history between users and the AI assistant.

**Current Schema** (from `teacher-assistant/backend/src/schemas/instantdb.ts`):

```typescript
messages: i.entity({
  content: i.string(),              // Message text content
  role: i.string(),                 // 'user', 'assistant', 'system'
  timestamp: i.number(),            // Unix timestamp (milliseconds)
  token_usage: i.number().optional(), // OpenAI token consumption
  model_used: i.string().optional(),  // OpenAI model identifier
  processing_time: i.number().optional(), // Response time (ms)
  is_edited: i.boolean(),           // Edit flag
  edited_at: i.number().optional(), // Edit timestamp
  message_index: i.number(),        // Order within session
  metadata: i.string().optional(),  // JSON string for agent data
})
```

**Required Fields**:
- `content` (string, required): Message text
- `role` (string, required): One of 'user', 'assistant', 'system'
- `timestamp` (number, required): Unix timestamp in milliseconds
- `message_index` (number, required): Sequential order within chat session
- `is_edited` (boolean, required): Defaults to false
- `metadata` (string, optional): JSON string containing agent-specific data

**Field Constraints**:
- `content`: Maximum 50,000 characters (InstantDB limit)
- `role`: Must be one of the three valid values
- `timestamp`: Must be positive integer
- `metadata`: Must be valid JSON string when present, max 10KB

**BUG-025 Fix**: Ensure all message creation calls use correct field names (no `userId` field - use links instead).

### Library_Materials Table

The library_materials table stores user-generated content (images, documents, resources).

**Current Schema** (from `teacher-assistant/backend/src/schemas/instantdb.ts`):

```typescript
library_materials: i.entity({
  user_id: i.string().indexed(),      // User who created material
  title: i.string(),                  // Display title
  type: i.string(),                   // 'image', 'document', 'resource'
  content: i.string(),                // URL or content data
  description: i.string().optional(), // Optional description
  tags: i.string().optional(),        // JSON array of tags
  created_at: i.number(),             // Creation timestamp
  updated_at: i.number(),             // Last update timestamp
  is_favorite: i.boolean(),           // Favorite flag
  usage_count: i.number(),            // Access count
  source_session_id: i.string().optional(), // Origin chat session
})
```

**Required Fields**:
- `user_id` (string, required, indexed): User identifier
- `title` (string, required): Material name/title
- `type` (string, required): One of 'image', 'document', 'resource'
- `content` (string, required): URL for images, content for other types
- `created_at` (number, required): Unix timestamp in milliseconds
- `updated_at` (number, required): Unix timestamp in milliseconds
- `is_favorite` (boolean, required): Defaults to false
- `usage_count` (number, required): Defaults to 0

**BUG-019 Fix**: Add `metadata` field to library_materials schema:

```typescript
library_materials: i.entity({
  // ... existing fields ...
  metadata: i.string().optional(),  // JSON string for originalParams
})
```

**Field Constraints**:
- `title`: Maximum 200 characters
- `type`: Must be 'image', 'document', or 'resource'
- `content`: Maximum 2048 characters (URLs)
- `metadata`: Must be valid JSON string, max 10KB

## Metadata JSON Structures

### Message Metadata Schema

Used for storing agent-specific information in messages (e.g., image generation results).

**Structure**:
```json
{
  "type": "image",
  "image_url": "https://example.com/image.png",
  "title": "Generated Image Title",
  "originalParams": {
    "description": "A red apple on a wooden table",
    "imageStyle": "realistic",
    "learningGroup": "elementary",
    "subject": "biology"
  }
}
```

**Required Fields**:
- `type` (string): Material type ('image', 'document', etc.)
- `image_url` (string): Valid URL when type is 'image'
- `originalParams` (object): Parameters used to generate content

**Validation Rules** (FR-010):
1. All string values must be sanitized (no script injection)
2. Total JSON size must be < 10KB
3. `image_url` must be valid URL format
4. `originalParams` must be present for regeneration feature

### Library Material Metadata Schema

Used for storing generation parameters to enable "Neu generieren" functionality.

**Structure**:
```json
{
  "type": "image",
  "image_url": "https://example.com/generated-image.png",
  "title": "Image Title",
  "originalParams": {
    "description": "User's original description",
    "imageStyle": "realistic | cartoon | abstract",
    "learningGroup": "elementary | middle | high",
    "subject": "Subject area"
  }
}
```

**Required Fields for Regeneration** (BUG-019):
- `originalParams.description` (string): Original image description
- `originalParams.imageStyle` (string): Style selection
- `originalParams.learningGroup` (string, optional): Target audience
- `originalParams.subject` (string, optional): Subject area

**Validation Rules**:
1. `originalParams` must be present for images
2. `description` is required within `originalParams`
3. `imageStyle` must be one of valid options
4. Total metadata size < 10KB

## Migration Strategy

### BUG-025: Message Field Mismatch

**Problem**: Code may be using incorrect field names (e.g., `userId` instead of using InstantDB links).

**Migration Steps**:
1. Audit all message creation code in `teacher-assistant/backend/src/services/chatService.ts`
2. Replace direct `userId` field references with proper link relationships
3. Use `dbHelpers.createMessage()` from schema file for consistency
4. No database migration needed (schema already correct)

### BUG-019: Library Materials Metadata Field

**Problem**: `metadata` field missing from library_materials schema.

**Migration Steps**:
1. Add `metadata: i.string().optional()` to library_materials entity in `instant.schema.ts`
2. Push schema update to InstantDB: `npx instant-cli push-schema`
3. Existing records will have `null` metadata (acceptable - old images won't be regenerable)
4. New image generations must populate metadata field with originalParams

**Schema Update Code**:
```typescript
library_materials: i.entity({
  user_id: i.string().indexed(),
  title: i.string(),
  type: i.string(),
  content: i.string(),
  description: i.string().optional(),
  tags: i.string().optional(),
  created_at: i.number(),
  updated_at: i.number(),
  is_favorite: i.boolean(),
  usage_count: i.number(),
  source_session_id: i.string().optional(),
  metadata: i.string().optional(),  // NEW FIELD
})
```

### BUG-020: Library Query Implementation

**Problem**: Library not querying and displaying materials.

**Migration Steps**:
1. No schema changes required
2. Add InstantDB query in `Library.tsx` to fetch materials
3. Update UI to conditionally show materials vs. placeholder

**Query Pattern**:
```typescript
const { data, isLoading } = useQuery({
  library_materials: {
    $: {
      where: { user_id: auth.user?.id }
    }
  }
})
```

### BUG-030: Navigation Tab State

**Problem**: Tab state not persisting after navigation.

**Migration Steps**:
1. No schema changes required
2. Fix navigation logic in `AgentResultView.tsx`
3. Use Ionic tab system properly

## Data Integrity Considerations

### Size Limits
- Message content: 50KB max
- Metadata JSON: 10KB max
- Library material URLs: 2KB max

### Validation Points
1. **Pre-save validation**: Validate metadata before database write
2. **Schema enforcement**: InstantDB validates field types
3. **Error handling**: Log validation failures, save core content without metadata

### Backward Compatibility
- Existing messages without metadata: No migration needed
- Existing library materials without metadata: "Neu generieren" button disabled
- All new content must include metadata for full functionality

## References

- **InstantDB Schema**: `teacher-assistant/backend/src/schemas/instantdb.ts`
- **Spec Document**: `.specify/specs/bug-fixes-2025-10-11/spec.md`
- **Functional Requirements**: FR-003, FR-004, FR-007, FR-008, FR-010
- **Related Bugs**: BUG-019, BUG-020, BUG-025, BUG-030
