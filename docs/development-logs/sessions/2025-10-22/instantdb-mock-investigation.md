# InstantDB Mock Implementation Investigation
**Date**: 2025-10-22
**Story**: Epic 3.1 Story 2 - Image Editing with Gemini
**Issue**: E2E tests fail because InstantDB mock returns empty data
**Status**: IN PROGRESS - Requires final debugging step

---

## Problem Statement

P0-3 E2E test fails with timeout waiting for `[data-testid="material-card"]` to appear. The test successfully:
- Creates 3 test images via backend API ✅
- Injects images into `window.__TEST_IMAGES__` ✅
- Bypasses authentication ✅
- Navigates to Library → Materialien ✅
- Shows "0 Materialien" instead of the 3 test images ❌

**Root Cause**: InstantDB mock's `useQuery` hook not properly returning test data to React components.

---

## Investigation Timeline

### Issue #1: Auth Bypass (RESOLVED ✅)
**Problem**: Tests were hitting login screens
**Solution**: Already fixed via custom fixtures with `addInitScript()`
**Status**: WORKING - Zero auth-related errors

### Issue #2: Console Error - teacher_profiles (RESOLVED ✅)
**Problem**: `Cannot read properties of undefined (reading 'teacher_profiles')`
**Root Cause**: Mock client missing `tx` namespace for transactions
**Solution**: Added Proxy-based `tx.teacher_profiles` implementation in `src/lib/instantdb.ts`
**Code**:
```typescript
tx: {
  teacher_profiles: new Proxy({}, {
    get: (target, profileId) => {
      return {
        update: (data: any) => {
          console.log(`[TEST MODE] tx.teacher_profiles[${String(profileId)}].update() bypassed`);
          return { profileId: String(profileId), action: 'update', data };
        }
      };
    }
  })
}
```
**Status**: FIXED - No more console errors

### Issue #3: Maximum Update Depth Exceeded (RESOLVED ✅)
**Problem**: Infinite re-render loop causing app crash
**Root Cause**: Initial polling approach with `setInterval` triggered continuous state updates
**Solution**: Switched to query key serialization approach
**Code**:
```typescript
const queryKey = query ? JSON.stringify(query) : 'null';
useEffect(() => {
  // ... compute data ...
}, [queryKey]); // Use stable string instead of object
```
**Status**: FIXED - Zero console errors in latest test runs

### Issue #4: Empty Data Despite Mock (IN PROGRESS ⏳)
**Problem**: Mock returns data structure but UI shows "0 Materialien"
**Root Cause**: Data not being retrieved at the right time OR wrong user_id filtering

**Attempted Solutions**:
1. ❌ Synchronous return (didn't integrate with React lifecycle)
2. ❌ Polling with setInterval (caused infinite loops)
3. ❌ Event-based refresh (events not triggering re-renders)
4. ✅ Proper React hook with useState/useEffect (CURRENT APPROACH)

**Current Implementation**:
```typescript
function useMockQuery(query: any) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const queryKey = query ? JSON.stringify(query) : 'null';

  useEffect(() => {
    const mockDataStore = getMockDataStore();
    // ... filtering logic ...
    setData(filteredData);
    setIsLoading(false);
  }, [queryKey]);

  return { data, isLoading, error };
}
```

---

## Current Status

### What's Working ✅
- Build: `npm run build` → 0 errors ✅
- Auth bypass: Test mode active, no login screens ✅
- Navigation: Can reach Library → Materialien ✅
- Console: ZERO console errors (no infinite loops) ✅
- Test data creation: Backend API successfully creates 3 images ✅
- Data injection: `window.__TEST_IMAGES__` contains 3 image objects ✅

### What's NOT Working ❌
- Material cards don't render (useQuery returns empty data)
- Test fails: `TimeoutError: page.waitForSelector: Timeout 10000ms exceeded`
- Screenshot shows: "0 Materialien" / "Keine Materialien vorhanden"

---

## Next Debugging Steps

### Step 1: Add Detailed Logging
Add console logs to verify data flow:

```typescript
// In src/lib/instantdb.ts - getMockDataStore()
function getMockDataStore() {
  const testImages = getTestImages();
  console.log('[TEST MODE] getMockDataStore() called:', {
    imageCount: testImages.length,
    firstImage: testImages[0] ? {
      id: testImages[0].id,
      title: testImages[0].title,
      user_id: testImages[0].user_id
    } : null
  });
  return {
    library_materials: testImages,
    // ...
  };
}

// In useMockQuery - after filtering
console.log('[TEST MODE] Filtered data:', {
  entity: 'library_materials',
  inputCount: mockDataStore.library_materials?.length || 0,
  outputCount: filteredData.library_materials?.length || 0,
  whereClause: query?.library_materials?.$?.where
});
```

### Step 2: Verify User ID Matching
The WHERE clause filters by `user_id`. Check if test images have correct user_id:

**Test User ID**: `test-user-playwright` (from `src/lib/test-auth.ts`)
**Test Images**: Should have `user_id: 'test-user-playwright'`

Verify in test setup:
```typescript
// In e2e-tests/story-3.1.2-image-editing.spec.ts
testImages.push({
  id: `test-image-${Date.now()}`,
  user_id: TEST_USER_ID, // ← Must match auth user!
  // ...
});
```

### Step 3: Alternative Approach - Direct Backend Integration
Instead of mocking, point InstantDB to real backend:

```typescript
// In src/lib/instantdb.ts
if (isTestMode) {
  // Use real backend instead of mock
  const db = init({
    appId: process.env.VITE_INSTANT_APP_ID,
    apiUrl: 'http://localhost:3006/api/instantdb'
  });
} else {
  // Production mode
}
```

This would require backend to serve InstantDB-compatible responses.

### Step 4: Simplify Test Approach
Create materials directly through InstantDB instead of backend API:

```typescript
// In test setup
await page.evaluate(() => {
  // Directly populate mock store
  (window as any).__INSTANT_MOCK_DATA__ = {
    library_materials: [
      { id: '1', user_id: 'test-user-playwright', title: 'Test 1', type: 'image', /* ... */ },
      { id: '2', user_id: 'test-user-playwright', title: 'Test 2', type: 'image', /* ... */ },
      { id: '3', user_id: 'test-user-playwright', title: 'Test 3', type: 'image', /* ... */ }
    ]
  };
});
```

Then update mock to read from `__INSTANT_MOCK_DATA__` instead of `__TEST_IMAGES__`.

---

## Files Modified

### Core Implementation
- `src/lib/instantdb.ts` - Mock InstantDB client with proper React hooks
- `src/lib/test-auth.ts` - Test user definition (already working)
- `e2e-tests/fixtures.ts` - Auth bypass fixture (already working)
- `e2e-tests/story-3.1.2-image-editing.spec.ts` - Test setup and data injection

### Test Results
- Latest screenshot: Shows "0 Materialien" (empty state)
- Console errors: ZERO (infinite loop fixed)
- Build status: PASSING (0 TypeScript errors)

---

## Recommended Solution Path

**OPTION A (Quick Fix - Recommended)**:
1. Add detailed logging to identify exact point where data is lost
2. Verify user_id matching between test user and test images
3. Fix the filtering logic if user_id mismatch found
4. Re-run test to verify material cards appear

**OPTION B (Robust Fix)**:
1. Simplify by using `__INSTANT_MOCK_DATA__` directly in page context
2. Remove backend API dependency for test setup
3. Have mock read from single source of truth
4. This eliminates the backend → window → mock data flow complexity

**OPTION C (Production-Like)**:
1. Implement real backend InstantDB proxy endpoint
2. Point test mode to use real backend
3. Remove all mocking - use actual InstantDB integration
4. Most realistic but requires backend work

---

## Time Investment

**Total Time**: ~6 hours across multiple attempts
**Progress**: 80% complete
- Auth bypass: ✅ 100%
- Console errors: ✅ 100%
- Mock structure: ✅ 90%
- Data retrieval: ⏳ 60% (debugging needed)

**Estimated Time to Complete**: 1-2 hours for final debugging

---

## Key Learnings

1. **Mock Complexity**: Mocking React hooks is non-trivial - they must integrate with React's lifecycle
2. **Query Object Stability**: Need to serialize query to string to avoid infinite re-renders
3. **React Hook Rules**: Can't call hooks conditionally, must be at component top level
4. **Data Flow Clarity**: Need clear path from test setup → window → mock → component
5. **Logging is Critical**: Without console logs at each step, debugging data flow is impossible

---

## Handoff Notes for Next Developer

**If continuing this approach**:
1. Start with Step 1 (detailed logging) from Next Debugging Steps
2. Run test and check browser console for log output
3. Identify where data count drops to zero
4. Fix the specific filtering or data retrieval issue

**If switching approaches**:
1. Consider OPTION B (simplified `__INSTANT_MOCK_DATA__` approach)
2. Less complexity = fewer failure points
3. Direct window variable = no data flow ambiguity

**When test passes**:
1. Capture screenshot showing 3 material cards rendered
2. Mark task complete in todos
3. Create session log in `docs/development-logs/sessions/2025-10-22/`
4. Update Story 3.1.2 status to READY FOR QA

---

## Contact Information

**Investigation by**: Claude Code (Autonomous Agent)
**Date**: 2025-10-22
**Story**: docs/stories/epic-3.1.story-2-updated.md
