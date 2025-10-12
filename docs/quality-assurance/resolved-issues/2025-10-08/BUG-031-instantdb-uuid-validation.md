# BUG-031: InstantDB Entity ID Validation Error

**Status**: OPEN
**Severity**: CRITICAL
**Priority**: P0
**Discovered**: 2025-10-08
**Component**: Frontend - AgentContext
**Related**: TASK-010 (E2E Testing), BUG-030 (Tab Navigation)

## Problem Statement

Generated images fail to save to the `library_materials` table in InstantDB with a validation error. This prevents images from appearing in:
- Library tab
- Chat history
- Regeneration workflows

### Error Message

```
InstantAPIError: Validation failed for tx-steps: Invalid entity ID 'exec-1759955428508'. Entity IDs must be UUIDs. Use id() or lookup() to generate a valid UUID.
```

## Impact

### User-Facing Impact
- ❌ Generated images don't appear in Library
- ❌ Generated images don't appear in Chat history as thumbnails
- ❌ Users can't regenerate images from Library
- ❌ Users lose all generated images after modal closes

### E2E Test Impact
- Step 6: ❌ No image thumbnail in Chat (Expected: Image visible in chat)
- Step 7: ⏭️ Skipped (No thumbnail to click)
- Step 8: ❌ No "Bilder" filter in Library (No library materials exist)
- Step 9: ⏭️ Skipped (No library materials to click)
- Step 10: ⏭️ Skipped (No regenerate button without library materials)

**Current E2E Pass Rate**: 45.5% (5/11 steps)

## Root Cause

**File**: `teacher-assistant/frontend/src/lib/AgentContext.tsx`

The `saveToLibrary()` function is using a non-UUID string as the entity ID:

```typescript
const artifactId = resultData.executionId ||
                   resultData.id ||
                   `${agentType}-${Date.now()}`;

// This produces: "exec-1759955428508" (NOT a valid UUID)
```

**InstantDB Requirement**: All entity IDs must be valid UUIDs (RFC 4122 format).

### Why It Fails

1. **Backend generates non-UUID executionId**: `exec-1759955428508`
2. **Frontend uses executionId as entity ID**: Passes to InstantDB
3. **InstantDB validates**: Rejects non-UUID format
4. **Transaction fails**: Mutation aborted, no record created

## Evidence

### Console Logs (from E2E test)

```javascript
[AgentContext] Saving to library {artifactId: exec-1759955428508}

❌ Console Error: [AgentContext] Save to library failed
InstantAPIError: Validation failed for tx-steps: Invalid entity ID 'exec-1759955428508'.
Entity IDs must be UUIDs. Use id() or lookup() to generate a valid UUID.
```

### InstantDB Transaction

```typescript
// Current (INCORRECT)
db.transact([
  db.tx.library_materials[artifactId].update({  // ❌ artifactId = "exec-1759955428508"
    title: resultData.title,
    image_url: resultData.image_url,
    // ...
  })
]);

// Required (CORRECT)
const materialId = id();  // ✅ Generate valid UUID
db.transact([
  db.tx.library_materials[materialId].update({
    title: resultData.title,
    image_url: resultData.image_url,
    // ...
  })
]);
```

## Reproduction Steps

1. Open Chat tab
2. Send message: "Erstelle ein Bild vom Satz des Pythagoras"
3. Click "Bild-Generierung starten"
4. Fill form and click "Bild generieren"
5. Wait for image to generate (15-20 seconds)
6. **Check browser console**: See validation error
7. **Check Library tab**: No new images appear
8. Close modal and return to Chat
9. **Check Chat history**: No thumbnail visible

**Expected**: Image saved to library_materials, visible in Library and Chat
**Actual**: Validation error, no record created, image lost

## Technical Details

### InstantDB UUID Requirements

From [InstantDB docs](https://www.instantdb.com/docs/modeling-data):
> All entity IDs must be UUIDs. Use the `id()` helper to generate valid UUIDs:
> ```typescript
> import { id } from '@instantdb/react';
> const newId = id(); // Generates RFC 4122 UUID
> ```

### Current Implementation

**File**: `teacher-assistant/frontend/src/lib/AgentContext.tsx` (Lines ~400-450)

```typescript
const saveToLibrary = async (resultData: AgentResult, agentType: string) => {
  try {
    console.log('[AgentContext] Saving to library', {
      artifactId: resultData.executionId
    });

    const artifactId = resultData.executionId ||
                       resultData.id ||
                       `${agentType}-${Date.now()}`;  // ❌ Not a UUID!

    // Build transaction
    await db.transact([
      db.tx.library_materials[artifactId].update({  // ❌ Invalid entity ID
        title: resultData.title,
        image_url: resultData.image_url,
        // ...
      })
    ]);
  } catch (error) {
    console.error('[AgentContext] Save to library failed', error);
    // Error logged but not propagated to UI
  }
};
```

## Solution Required

### 1. Generate Valid UUID for Entity ID

```typescript
import { id } from '@instantdb/react';

const saveToLibrary = async (resultData: AgentResult, agentType: string) => {
  // ✅ Generate valid UUID
  const materialId = id();

  // Store executionId as a separate field (not as entity ID)
  await db.transact([
    db.tx.library_materials[materialId].update({
      execution_id: resultData.executionId,  // Store as field
      title: resultData.title,
      image_url: resultData.image_url,
      // ...
    })
  ]);
};
```

### 2. Update Schema (if needed)

**File**: `teacher-assistant/backend/src/schemas/instantdb.ts`

Ensure `library_materials` has `execution_id` field:

```typescript
library_materials: entity({
  title: string(),
  image_url: string().optional(),
  execution_id: string().optional(),  // Add if missing
  // ...
})
```

### 3. Query by execution_id (not entity ID)

If code needs to find materials by executionId:

```typescript
// ❌ OLD (query by entity ID)
const material = await db.query({
  library_materials: {
    $: { where: { id: executionId } }
  }
});

// ✅ NEW (query by execution_id field)
const material = await db.query({
  library_materials: {
    $: { where: { execution_id: executionId } }
  }
});
```

## Files to Modify

1. **`teacher-assistant/frontend/src/lib/AgentContext.tsx`**
   - Import `id` from `@instantdb/react`
   - Generate UUID for materialId
   - Use executionId as field, not entity ID

2. **`teacher-assistant/backend/src/schemas/instantdb.ts`**
   - Verify `execution_id` field exists in `library_materials` schema
   - Push schema if modified

3. **`teacher-assistant/shared/types/agents.ts`** (if needed)
   - Update type definitions to reflect execution_id as optional field

## Testing Checklist

### Manual Testing
- [ ] Generate image via Chat
- [ ] Verify no console errors during save
- [ ] Check Library tab - image appears
- [ ] Check Chat history - thumbnail appears
- [ ] Click thumbnail - preview opens
- [ ] Click "Neu generieren" - form prefills

### E2E Testing
- [ ] Step 6: Chat tab navigation + thumbnail visible
- [ ] Step 7: Thumbnail clickable, preview opens
- [ ] Step 8: Library shows image in "Bilder" filter
- [ ] Step 9: Library preview opens
- [ ] Step 10: Regenerate form prefills
- [ ] **Target**: ≥70% pass rate

### InstantDB Verification
- [ ] Query `library_materials` table - new records exist
- [ ] Verify entity IDs are valid UUIDs (not exec-* strings)
- [ ] Verify `execution_id` field contains original executionId

## Definition of Done

- ✅ Build Clean: `npm run build` → 0 TypeScript errors
- ✅ No Console Errors: No validation errors in browser console
- ✅ Manual Test: Image appears in Library and Chat
- ✅ E2E Pass Rate: ≥70% (up from 45.5%)
- ✅ Session Log: Document implementation in `docs/development-logs/sessions/2025-10-08/`

## Related Issues

- **BUG-030**: Page reload on chat navigation - **RESOLVED** (tab navigation now works)
- **BUG-029**: Temporary DALL-E URLs - **RESOLVED** (permanent storage works)
- **BUG-028**: Playwright strict mode violation - **RESOLVED** (selectors fixed)
- **TASK-010**: E2E Testing - **BLOCKED** by this bug (45.5% pass rate)

## References

- InstantDB Modeling Data: https://www.instantdb.com/docs/modeling-data
- InstantDB Transactions: https://www.instantdb.com/docs/transactions
- RFC 4122 UUID Spec: https://www.rfc-editor.org/rfc/rfc4122

---

**Created**: 2025-10-08
**Next Step**: Launch agent to implement UUID fix
**Blocker For**: TASK-010 completion (target: 70% pass rate)
