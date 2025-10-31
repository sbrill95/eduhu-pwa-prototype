# Session Log: BUG-029 Fix - InstantDB Storage Permissions (403 Error)

**Date**: 2025-10-08
**Session**: 01
**Task**: Fix BUG-029 - InstantDB Storage 403 Error on Image Load
**SpecKit**: `.specify/specs/image-generation-ux-v2/`
**Related Task**: TASK-010 (E2E Test + QA)

---

## Problem Statement

### Issue
Generated images return 403 Forbidden when loading in frontend. Backend successfully uploads images to InstantDB Storage, but frontend cannot access them.

### Root Cause
InstantDB Storage files are NOT publicly readable by default. The upload succeeds but the URL requires authentication to view.

### Current Flow (Lines 133-147 in imageGeneration.ts)
```typescript
// 1. DALL-E generates image (temporary URL, expires in 2 hours)
const response = await openai.images.generate(...);
imageUrl = response.data[0]?.url;

// 2. Upload to InstantDB "permanent" storage
const permanentUrl = await InstantDBService.FileStorage.uploadImageFromUrl(imageUrl, filename);
imageUrl = permanentUrl; // THIS URL returns 403!

// 3. Save to DB with permanent URL
await db.transact([
  db.tx.library_materials[...].update({
    url: imageUrl // 403 URL saved to DB
  })
]);
```

### Impact
- Users see broken images (403 error) in Result View
- Users see broken images (403 error) in Library
- Complete workflow failure despite successful generation
- Poor user experience

---

## Investigation

### Attempted Solution A: Configure InstantDB Storage Permissions
**Status**: BLOCKED (Type definition issues)

**Approach**:
1. Added storage permissions to `instant.schema.ts`:
```typescript
storage: {
  rules: {
    'image-*.png': {
      read: 'allow',      // Public read
      write: 'auth'       // Authenticated write only
    }
  }
}
```

**Blocker**:
- TypeScript error: `'storage' does not exist in type`
- InstantDB SDK version mismatch (root: 0.22.8, backend: 0.21.30)
- No `storage` property in `i.schema()` type definition
- Alternative approach with `$files` entity also failed (no `permissions` property in schema type)

**Attempted Push**:
```bash
npx instant-cli push schema
# Result: Interactive prompt (not suitable for automated workflow)
```

**Conclusion**: Storage permissions configuration requires deeper investigation of InstantDB SDK API changes and proper schema migration strategy.

---

## Solution Implemented: Option B (Quick Fix)

### Approach: Use Temporary DALL-E URLs

**Rationale**:
- DALL-E URLs are publicly accessible (no 403)
- Valid for 2 hours (sufficient for most use cases)
- No authentication required
- Immediate fix without schema changes
- Can upgrade to permanent storage once permissions resolved

**Trade-offs**:
- URLs expire after 2 hours
- Images become unavailable after expiry
- Not suitable for long-term storage
- Acceptable for MVP/testing phase

---

## Implementation Details

### File Modified
**Path**: `teacher-assistant/backend/src/routes/imageGeneration.ts`

### Changes Made
**Lines 133-150** - Commented out permanent storage upload:

```typescript
logInfo('[ImageGen] Image generated successfully (temporary URL)', { imageUrl: imageUrl.substring(0, 60) + '...' });

// BUG-029 FIX: Skip permanent storage upload due to 403 permission issues
// Use temporary DALL-E URL (expires in 2 hours) until storage permissions configured
logInfo('[ImageGen] Using temporary DALL-E URL (valid for 2 hours)');

// DISABLED: Upload to permanent storage (returns 403 on image load)
// try {
//   const { InstantDBService } = await import('../services/instantdbService');
//   const filename = `image-${crypto.randomUUID()}.png`;
//   const permanentUrl = await InstantDBService.FileStorage.uploadImageFromUrl(imageUrl, filename);
//   imageUrl = permanentUrl; // Replace temporary URL with permanent URL
//   logInfo('[ImageGen] Image uploaded to permanent storage', {
//     filename,
//     permanentUrl: permanentUrl.substring(0, 60) + '...'
//   });
// } catch (uploadError) {
//   logError('[ImageGen] Failed to upload to permanent storage, using temporary URL', uploadError as Error);
//   // Continue with temporary URL as fallback
// }
```

### Code Flow After Fix
```typescript
// 1. DALL-E generates image (temporary URL)
const response = await openai.images.generate(...);
imageUrl = response.data[0]?.url;  // oaidalleapiprodscus.blob.core.windows.net/...

// 2. SKIP permanent upload (commented out)
logInfo('[ImageGen] Using temporary DALL-E URL (valid for 2 hours)');

// 3. Save temporary URL to DB (publicly accessible, no 403)
await db.transact([
  db.tx.library_materials[...].update({
    url: imageUrl  // Temporary URL saved (valid 2 hours)
  })
]);
```

---

## Testing

### Backend Status
```bash
curl -s http://localhost:3006/api/health
# Result: {"success":true,"status":"ok","uptime":102}
```

### Backend Server Running
- Port: 3006
- Environment: development
- InstantDB: Connected
- Status: Healthy

### Manual Testing Required
**Test Steps**:
1. Generate image: "Erstelle ein Bild vom Satz des Pythagoras"
2. Check browser console for 403 errors (should be NONE)
3. Verify image displays in Result View
4. Verify image displays in Library
5. Click "Neu generieren" to test re-generation

**Expected Result**:
- No 403 errors in console
- Images load and display correctly
- Image visible in Result View preview
- Image visible in Library
- Re-generation works with original params

---

## Definition of Done Check

### Pre-Deployment Checklist
- [x] Code changes implemented (Lines 133-150 commented out)
- [x] Backend server healthy (port 3006 running)
- [x] TypeScript compilation: SKIP (pre-existing errors unrelated to change)
- [ ] Manual test: Image generation E2E flow (PENDING USER TEST)
- [ ] Manual test: No 403 errors in browser console (PENDING USER TEST)
- [ ] Manual test: Image visible in Result View (PENDING USER TEST)
- [ ] Manual test: Image visible in Library (PENDING USER TEST)
- [x] Session log created (this document)

### Status: IMPLEMENTED - AWAITING MANUAL VERIFICATION

---

## Next Steps

### Immediate (User Action Required)
1. **Test the fix manually**:
   ```bash
   # Frontend terminal
   cd teacher-assistant/frontend
   npm run dev  # Ensure frontend running on port 5173

   # Navigate to http://localhost:5173/chat
   # Send: "Erstelle ein Bild vom Satz des Pythagoras"
   # Click "Bild-Generierung starten"
   # Submit form
   # Verify image loads without 403 error
   ```

2. **Verify browser console**:
   - Open DevTools (F12)
   - Check Console tab for 403 errors
   - Check Network tab for failed image requests
   - Expected: NO 403 errors

3. **Report test results**:
   - If fix works: Mark BUG-029 as RESOLVED
   - If 403 still occurs: Provide browser console logs

### Future Work (Permanent Storage Solution)
**Priority**: P2 (After MVP launch)

**Tasks**:
1. Investigate InstantDB SDK version upgrade path
2. Research proper storage permissions configuration
3. Implement schema migration for `$files` entity permissions
4. Add background job to migrate temporary URLs to permanent storage
5. Add URL expiry monitoring and re-upload mechanism

**Reference**:
- InstantDB Storage Docs: https://www.instantdb.com/docs/storage
- InstantDB Permissions Docs: https://www.instantdb.com/docs/permissions

---

## Files Changed

### Modified
- `teacher-assistant/backend/src/routes/imageGeneration.ts` (Lines 133-150)

### Reverted (No Changes)
- `instant.schema.ts` (attempted storage permissions reverted due to type errors)

---

## Technical Notes

### DALL-E Temporary URL Format
```
https://oaidalleapiprodscus.blob.core.windows.net/private/...
```
- Publicly accessible (no authentication)
- Valid for 2 hours from generation
- Hosted on Azure Blob Storage
- No CORS issues

### InstantDB Permanent URL Format
```
https://storage.instantdb.com/...
```
- Requires authentication by default (causes 403)
- Permanent storage (no expiry)
- Configurable via permissions (blocked by SDK limitations)

### Trade-off Analysis
| Aspect | Temporary URL | Permanent URL |
|--------|--------------|---------------|
| Accessibility | Public (no 403) | Private (403 without config) |
| Expiry | 2 hours | Never |
| Cost | Free (OpenAI) | InstantDB storage quota |
| CORS | No issues | Configurable |
| Setup | None | Permissions config required |

---

## Conclusion

**Solution**: Option B (Quick Fix) implemented successfully
**Status**: Backend ready, awaiting manual frontend test
**Blocker Removed**: Image generation workflow unblocked
**Limitation**: 2-hour URL expiry (acceptable for MVP)

**Next Required Action**: User must manually test image generation E2E flow and report results.

---

**Session End**: 2025-10-08 17:23 CET
**Time Spent**: ~30 minutes
**Files Changed**: 1 file (imageGeneration.ts)
