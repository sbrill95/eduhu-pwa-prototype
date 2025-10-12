# BUG-029: InstantDB Storage Permissions - 403 Forbidden on Image Load

**ID**: BUG-029
**Date Reported**: 2025-10-08
**Date Resolved**: 2025-10-08
**Severity**: P0 - CRITICAL
**Status**: FIXED (Option B - Quick Fix)
**Reporter**: User
**Assignee**: Backend Developer Agent

---

## Summary
Generated images return 403 Forbidden when loading in frontend. Backend successfully uploads images to InstantDB Storage, but the permanent URLs require authentication to view, causing images to fail to load.

---

## Environment
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite
- **Database**: InstantDB (SDK version 0.22.8 root, 0.21.30 backend)
- **Image Generation**: OpenAI DALL-E 3
- **Storage**: InstantDB File Storage

---

## Steps to Reproduce

1. Open chat interface at http://localhost:5173/chat
2. Send message: "Erstelle ein Bild vom Satz des Pythagoras"
3. Click "Bild-Generierung starten" button
4. Submit image generation form
5. Wait for generation to complete
6. Observe Result View with image preview

**Expected Result**: Image loads and displays correctly

**Actual Result**:
- Image shows broken image icon
- Browser console shows: `GET https://storage.instantdb.com/... 403 (Forbidden)`
- Network tab shows failed image request with 403 status

---

## Root Cause Analysis

### Technical Details

**Code Location**: `teacher-assistant/backend/src/routes/imageGeneration.ts` Lines 133-147

**Flow**:
```typescript
// 1. DALL-E generates temporary public URL
const response = await openai.images.generate(...);
const temporaryUrl = response.data[0]?.url;
// temporaryUrl = "https://oaidalleapiprodscus.blob.core.windows.net/..."
// Status: Publicly accessible, no authentication required

// 2. Backend uploads to InstantDB permanent storage
const permanentUrl = await InstantDBService.FileStorage.uploadImageFromUrl(temporaryUrl, filename);
// permanentUrl = "https://storage.instantdb.com/..."
// Status: Upload succeeds (backend has auth token)

// 3. Backend saves permanent URL to database
await db.transact([
  db.tx.library_materials[...].update({
    url: permanentUrl  // THIS URL requires authentication!
  })
]);

// 4. Frontend tries to load image
// <img src="https://storage.instantdb.com/..." />
// Result: 403 Forbidden (frontend has no auth for storage)
```

### Root Cause
**InstantDB Storage files are NOT publicly readable by default**

- Upload succeeds (backend uses admin token)
- URL is saved to database
- Frontend tries to load URL as `<img src>`
- Storage service checks permissions: NO public read access configured
- Result: 403 Forbidden

### Why This Happens
1. InstantDB Storage requires explicit permissions configuration
2. Default behavior: All files private (auth required)
3. Schema does not define storage permissions for `$files` entity
4. Frontend cannot authenticate as storage client (only database queries)
5. Image URLs fail when used in `<img>` tags

---

## Impact Assessment

### Severity: P0 - CRITICAL

**User Impact**:
- 100% of generated images fail to display
- Feature appears broken to end users
- Complete workflow failure despite successful generation
- Poor user experience (broken images everywhere)

**Affected Components**:
- Result View image preview (broken)
- Library image thumbnails (broken)
- Chat message thumbnails (broken)
- MaterialPreviewModal (broken)

**Affected Flows**:
- Image Generation Workflow (Steps 5-11 of TASK-010)
- Library browsing
- Chat history with images
- Re-generation from previews

---

## Solution Implemented

### Option B: Use Temporary DALL-E URLs (Quick Fix)

**Rationale**:
- Immediate fix without schema changes
- No SDK version conflicts
- No permission configuration required
- Works for MVP/testing phase

**Implementation**:
Commented out permanent storage upload in `imageGeneration.ts` Lines 133-150:

```typescript
// BUG-029 FIX: Skip permanent storage upload due to 403 permission issues
// Use temporary DALL-E URL (expires in 2 hours) until storage permissions configured
logInfo('[ImageGen] Using temporary DALL-E URL (valid for 2 hours)');

// DISABLED: Upload to permanent storage (returns 403 on image load)
// try {
//   const { InstantDBService } = await import('../services/instantdbService');
//   const filename = `image-${crypto.randomUUID()}.png`;
//   const permanentUrl = await InstantDBService.FileStorage.uploadImageFromUrl(imageUrl, filename);
//   imageUrl = permanentUrl;
//   ...
// }
```

**Result**:
- Temporary DALL-E URLs saved to database
- URLs publicly accessible (no 403)
- Images load correctly in frontend
- Expiry: 2 hours (acceptable for MVP)

---

## Alternative Solutions Considered

### Option A: Configure InstantDB Storage Permissions (BLOCKED)

**Approach**:
Add storage permissions to `instant.schema.ts`:
```typescript
storage: {
  rules: {
    'image-*.png': {
      read: 'allow',      // Public read
      write: 'auth'       // Auth required for upload
    }
  }
}
```

**Blocker**:
- TypeScript error: `'storage' does not exist in type`
- SDK version mismatch (root: 0.22.8, backend: 0.21.30)
- No documentation for storage permissions in current SDK
- InstantDB CLI requires interactive input (not automatable)

**Status**: DEFERRED to future work

### Option C: Proxy Images Through Backend (NOT IMPLEMENTED)

**Approach**:
```typescript
// Backend route: GET /api/images/:imageId
// Fetches from storage with auth, streams to frontend
router.get('/images/:imageId', async (req, res) => {
  const imageUrl = await getStorageUrl(req.params.imageId);
  const imageStream = await InstantDB.storage.download(imageUrl);
  imageStream.pipe(res);
});
```

**Pros**:
- Works around permission issues
- Permanent storage
- No URL expiry

**Cons**:
- Added backend complexity
- Extra server load (proxy all images)
- Increased latency
- Not implemented in current sprint

---

## Verification Steps

### Manual Test Checklist
- [ ] Generate image: "Erstelle ein Bild vom Satz des Pythagoras"
- [ ] Wait for generation (15-30 seconds)
- [ ] Check Result View: Image displays correctly
- [ ] Check browser console: NO 403 errors
- [ ] Click "Weiter im Chat": Image thumbnail displays
- [ ] Navigate to Library: Image displays in grid
- [ ] Click image in Library: Preview modal shows image
- [ ] Click "Neu generieren": Form opens with prefilled data
- [ ] Submit re-generation: New image generates and displays

### Expected Results
- ✅ All images load without 403 errors
- ✅ Images display in Result View, Chat, and Library
- ✅ Image URLs start with `oaidalleapiprodscus.blob.core.windows.net`
- ✅ No `storage.instantdb.com` URLs (permanent storage disabled)

### Test Status
**Status**: AWAITING USER VERIFICATION

**Backend Ready**: Yes (server running, healthy)
**Frontend Ready**: Yes (needs restart to pick up backend changes)
**Test User**: Please run manual test and report results

---

## Limitations and Trade-offs

### Limitation: 2-Hour URL Expiry
**Issue**: DALL-E temporary URLs expire after 2 hours

**Impact**:
- Images older than 2 hours become unavailable
- Broken images in Library for old generations
- Users must re-generate expired images

**Acceptable For**:
- MVP testing
- Development phase
- Short-term usage

**Not Acceptable For**:
- Production deployment
- Long-term storage
- Content library requiring persistence

### Trade-off Table
| Aspect | Temporary URLs (Current) | Permanent Storage (Future) |
|--------|-------------------------|----------------------------|
| Load Time | Fast (CDN) | Fast (CDN) |
| Reliability | Good (2h) | Excellent (permanent) |
| Setup Complexity | None | Schema config required |
| Authentication | None needed | Permissions needed |
| Cost | Free (OpenAI) | InstantDB storage quota |
| Expiry | 2 hours | Never |

---

## Future Work

### Permanent Storage Solution (P2 Priority)

**Epic**: Implement InstantDB Storage Permissions

**Tasks**:
1. **Research InstantDB SDK Updates** (1-2 hours)
   - Check latest SDK documentation
   - Verify storage permissions API
   - Test in isolated project

2. **Upgrade SDK Versions** (1 hour)
   - Align root and backend SDK versions
   - Test backward compatibility
   - Update package.json dependencies

3. **Configure Storage Permissions** (2 hours)
   - Add `$files` entity permissions to schema
   - Configure public read access for images
   - Test permission rules in InstantDB dashboard

4. **Push Schema Changes** (30 min)
   - Use InstantDB CLI or admin API
   - Verify permissions applied
   - Test image access without auth

5. **Re-enable Permanent Upload** (30 min)
   - Uncomment lines 137-150 in imageGeneration.ts
   - Test end-to-end flow
   - Verify no 403 errors

6. **Implement URL Migration** (4 hours - Optional)
   - Background job to re-upload expired images
   - Update old temporary URLs to permanent URLs
   - Handle URL expiry gracefully

**Total Estimate**: 8-10 hours

**Target Sprint**: After MVP launch

---

## Related Issues
- **BUG-027**: DALL-E Timeout (Resolved - unrelated to storage)
- **TASK-010**: E2E Test + QA (Blocked by BUG-029, now unblocked)

---

## Documentation References
- InstantDB Storage Docs: https://www.instantdb.com/docs/storage
- InstantDB Permissions Docs: https://www.instantdb.com/docs/permissions
- OpenAI DALL-E Docs: https://platform.openai.com/docs/guides/images
- Azure Blob Storage (DALL-E URLs): https://azure.microsoft.com/en-us/services/storage/blobs/

---

## Files Changed

### Modified
- `teacher-assistant/backend/src/routes/imageGeneration.ts` (Lines 133-150)
  - Commented out permanent storage upload
  - Added BUG-029 fix comments
  - Now uses temporary DALL-E URLs

### Documentation
- `docs/development-logs/sessions/2025-10-08/session-01-bug-029-instantdb-storage-permissions-fix.md`
- `docs/quality-assurance/resolved-issues/2025-10-08/BUG-029-instantdb-storage-403-forbidden.md` (this file)

---

## Resolution Summary

**Status**: FIXED (Quick Fix Deployed)
**Solution**: Use temporary DALL-E URLs instead of permanent storage
**Blocker Removed**: YES - Image generation workflow unblocked
**Manual Test Required**: YES - Awaiting user verification
**Production Ready**: NO - 2-hour expiry not suitable for production
**MVP Ready**: YES - Acceptable for testing and development

**Next Action**: User must run manual E2E test and report results

---

**Bug Report Created**: 2025-10-08 17:24 CET
**Resolution Deployed**: 2025-10-08 17:23 CET
**Time to Fix**: ~30 minutes
