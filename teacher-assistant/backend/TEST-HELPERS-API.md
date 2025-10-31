# Test Helper Endpoints - API Documentation

**Base URL**: `http://localhost:3006/api/test`
**Environment**: Development/Test ONLY
**Security**: Endpoints disabled in production

---

## Endpoints

### 1. Create Test Image

**POST** `/api/test/create-image`

Creates a test image in InstantDB for E2E testing.

#### Request Body
```json
{
  "user_id": "string (required)",
  "title": "string (required)",
  "type": "string (required, typically 'image')",
  "content": "string (required, image URL)",
  "description": "string (optional)",
  "tags": "string (optional, JSON array as string, e.g., '[]')",
  "metadata": "string (optional, JSON object as string, e.g., '{\"test\":true}')",
  "created_at": "number (optional, timestamp in ms)",
  "updated_at": "number (optional, timestamp in ms)",
  "is_favorite": "boolean (optional, default: false)",
  "source_session_id": "string (optional)"
}
```

**Note**: The `id` field is **NOT** accepted in the request. The server generates a UUID automatically.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid-generated-server-side",
    "message": "Test image created successfully"
  }
}
```

#### Example
```bash
curl -X POST http://localhost:3006/api/test/create-image \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "title": "My Test Image",
    "type": "image",
    "content": "https://example.com/image.jpg",
    "description": "Test image for E2E",
    "tags": "[\"test\", \"e2e\"]",
    "metadata": "{\"test\":true,\"source\":\"e2e\"}"
  }'
```

---

### 2. Delete Test Image

**DELETE** `/api/test/delete-image/:imageId`

Deletes a test image from InstantDB.

#### Path Parameters
- `imageId`: UUID of the image to delete

#### Security
- Only images with `metadata.test = true` can be deleted
- Returns 403 if trying to delete non-test images

#### Response
```json
{
  "success": true,
  "data": {
    "imageId": "uuid-of-deleted-image",
    "message": "Test image deleted successfully"
  }
}
```

#### Example
```bash
curl -X DELETE http://localhost:3006/api/test/delete-image/be4c9f3c-7d3a-4a00-89a0-4ee5a1af9681
```

---

### 3. Cleanup All Test Images

**POST** `/api/test/cleanup-all`

Deletes ALL test images (where `metadata.test = true`) from InstantDB.

**Warning**: This deletes EVERY image marked as test data. Use with caution!

#### Request Body
None required.

#### Response
```json
{
  "success": true,
  "data": {
    "deletedCount": 5,
    "message": "Cleaned up 5 test images"
  }
}
```

#### Example
```bash
curl -X POST http://localhost:3006/api/test/cleanup-all
```

---

## Usage in Playwright E2E Tests

### Setup: Create Test Image Before Test
```typescript
test.beforeEach(async ({ page }) => {
  // Create test image via API
  const response = await fetch('http://localhost:3006/api/test/create-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'test-user-e2e',
      title: 'E2E Test Image',
      type: 'image',
      content: 'https://example.com/test.jpg',
      metadata: JSON.stringify({ test: true })
    })
  });

  const data = await response.json();
  testImageId = data.data.id; // Save for cleanup
});
```

### Teardown: Cleanup After Test
```typescript
test.afterEach(async () => {
  // Delete specific test image
  await fetch(`http://localhost:3006/api/test/delete-image/${testImageId}`, {
    method: 'DELETE'
  });
});

// OR: Cleanup all test images after entire suite
test.afterAll(async () => {
  await fetch('http://localhost:3006/api/test/cleanup-all', {
    method: 'POST'
  });
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: user_id, title, type, content"
}
```

### 403 Forbidden (Production)
```json
{
  "success": false,
  "error": "Test endpoints only available in test/development mode"
}
```

### 403 Forbidden (Non-Test Image)
```json
{
  "success": false,
  "error": "Can only delete test images (metadata.test must be true)"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Image not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create test image"
}
```

---

## Important Notes

### Metadata Format
- **MUST** be a JSON string, not an object
- Example: `"{\"test\":true}"` ✅
- NOT: `{"test":true}` ❌

### Tags Format
- **MUST** be a JSON array as string
- Example: `"[\"tag1\",\"tag2\"]"` ✅
- NOT: `["tag1","tag2"]` ❌

### Security
- Endpoints only work in `NODE_ENV=development` or `NODE_ENV=test`
- Production deployments return 403 Forbidden
- Delete operations verify `metadata.test = true` flag

### ID Generation
- **Server generates UUIDs** automatically
- Clients **DO NOT** provide IDs in request
- IDs are returned in response
- This ensures InstantDB validation passes

---

## Technical Details

### InstantDB Transaction Format
Internally, the endpoint uses:
```typescript
import { id as generateId } from '@instantdb/admin';

const imageId = generateId(); // Generate UUID
await db.transact([
  db.tx.library_materials[imageId].update({ ... })
]);
```

### Why Server-Side ID Generation?
1. **InstantDB Validation**: Requires UUID objects, not strings
2. **Security**: Prevents client-controlled IDs
3. **Consistency**: Matches pattern used throughout codebase
4. **Type Safety**: TypeScript ensures correct UUID format

---

## Changelog

### 2025-10-22 - Initial Release
- Fixed InstantDB validation errors
- Implemented server-side UUID generation
- Added comprehensive error handling
- Documented API for E2E test integration

---

## Support

For issues or questions, see:
- `docs/development-logs/sessions/2025-10-22/testhelpers-instantdb-fix.md`
- `teacher-assistant/backend/src/routes/testHelpers.ts` (source code)
