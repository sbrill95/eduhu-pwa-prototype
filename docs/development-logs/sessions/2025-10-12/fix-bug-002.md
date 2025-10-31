# BUG-002 Fix: Library Modal - Image URL Expiration Handling

**Date**: 2025-10-12
**Session**: Phase 2 Automated Bug Fixes
**Status**: ✅ COMPLETED

---

## Bug Summary

**Issue**: InstantDB S3 signed URLs expire after 7 days, causing 96% of library images to fail loading
**Severity**: High - Breaks core feature (Library image preview)
**Component**: `MaterialPreviewModal.tsx`

---

## Root Cause

InstantDB Storage returns signed S3 URLs with 7-day expiration:
- `material.metadata.artifact_data.url` contains temporary signed URL
- After 7 days, URLs return 403 Forbidden errors
- No error handling existed, resulting in broken image displays
- 96% of images in production library have expired URLs (24 out of 25)

---

## Fix Implementation

### File Changed
- `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`

### Change Detail
**Lines 297-314** - Added error handling and user notification

**Before**:
```tsx
{material.type === 'image' && material.metadata.artifact_data?.url && (
  <img
    src={material.metadata.artifact_data.url}
    alt={material.title}
    style={{ width: '100%', borderRadius: '8px' }}
    data-testid="material-image"
  />
)}
```

**After**:
```tsx
{material.type === 'image' && material.metadata.artifact_data?.url && (
  <div>
    <img
      src={material.metadata.artifact_data.url}
      alt={material.title}
      style={{ width: '100%', borderRadius: '8px' }}
      data-testid="material-image"
      onError={(e) => {
        // Replace with placeholder on load failure (expired URL)
        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-family="system-ui" font-size="16">Bild nicht verfügbar</text></svg>';
        (e.target as HTMLImageElement).style.opacity = '0.5';
      }}
    />
    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
      Hinweis: Bilder älter als 7 Tage müssen möglicherweise neu generiert werden.
    </p>
  </div>
)}
```

### Error Handling Strategy

1. **Graceful Degradation**: On image load error (403, timeout, network failure)
   - Replace broken image with inline SVG placeholder
   - Placeholder shows "Bild nicht verfügbar" message
   - Image opacity reduced to 50% to indicate error state

2. **User Communication**:
   - Always display hint text below image
   - Explains 7-day URL expiration policy
   - Guides user to use "Neu generieren" button

3. **Existing Functionality Preserved**:
   - "Neu generieren" button already exists (TASK-010)
   - Users can regenerate expired images on demand
   - No breaking changes to existing workflow

---

## Verification

### Build Verification
```bash
cd teacher-assistant/frontend
npm run build
```

**Result**: ✅ Build successful - 0 TypeScript errors

### Manual Testing Required
- [ ] Load Library with mix of fresh (< 7 days) and expired (> 7 days) images
- [ ] Verify fresh images display normally with hint text
- [ ] Verify expired images show placeholder with hint text
- [ ] Test "Neu generieren" button on expired image
- [ ] Confirm new image is saved with fresh URL
- [ ] Test error handling on network failures

---

## Impact Assessment

**Positive**:
- Users now see clear feedback instead of broken images
- Hint text educates users about URL expiration
- Graceful degradation maintains app usability
- No data loss (images can be regenerated)

**Limitations**:
- Does not prevent URL expiration (InstantDB platform limitation)
- Users must manually regenerate expired images
- No automatic refresh of expired URLs

**Future Improvements** (Out of Scope):
- Backend job to refresh URLs before expiration
- Store images in permanent storage (non-expiring URLs)
- Cache original generation parameters for automatic refresh

---

## Related Files
- Investigation Report: `docs/testing/bug-investigation-report-2025-10-12.md`
- Screenshots: `docs/testing/screenshots/2025-10-12/investigation/`
- Production Data: 24/25 images affected (96% failure rate)

---

## Next Steps
1. Deploy to staging and verify error handling
2. Load test with expired URLs from production
3. Monitor user regeneration patterns
4. Consider long-term solution for URL refresh automation
