# BUG-012: Home Screen API Endpoint Timeout - CRITICAL

**Date**: 2025-10-01
**Priority**: 🔴 P0 CRITICAL - BLOCKS ENTIRE FEATURE
**Status**: 🔴 OPEN - Awaiting Fix
**Reporter**: qa-integration-reviewer
**Feature**: Home Screen Redesign
**Related SpecKit**: `.specify/specs/home-screen-redesign/`

---

## Problem Statement

The `/api/prompts/generate-suggestions` API endpoint hangs indefinitely and never returns a response, making the entire Home Screen Redesign feature completely unusable.

---

## Impact Assessment

**Severity**: APPLICATION BREAKING
- BLOCKS entire Home Screen Redesign feature (100% non-functional)
- Frontend cannot load prompt suggestions
- Home screen shows loading spinner forever
- NO users can use the feature
- Deployment is COMPLETELY BLOCKED

**User Impact**:
- Teachers cannot see personalized prompt suggestions
- Home screen appears broken (infinite loading)
- Poor user experience
- Feature appears non-functional

**Business Impact**:
- Cannot deploy Home Screen Redesign feature
- Delays product release
- Wastes development time (frontend is ready, backend broken)
- Damages product roadmap

---

## Steps to Reproduce

1. Start backend server:
   ```bash
   cd teacher-assistant/backend
   npm run dev
   ```

2. Verify server is running (should see "Server started on port 3006")

3. Send API request:
   ```bash
   curl -X POST http://localhost:3006/api/prompts/generate-suggestions \
     -H "Content-Type: application/json" \
     -d '{"userId":"test-user-123"}'
   ```

4. Observe: Request hangs for 120+ seconds, never returns

**Expected**: Response within 5 seconds with prompt suggestions

**Actual**: Request times out after 120 seconds with no response

---

## Root Cause Analysis

**File**: `teacher-assistant/backend/src/services/promptService.ts`
**Location**: Lines 88-115 (getUserProfile method)

### The Bug

```typescript
private async getUserProfile(userId: string): Promise<any> {
  if (!isInstantDBAvailable()) {
    // This branch works correctly (returns mock profile)
    return {...};
  }

  // BUG IS HERE: This await hangs indefinitely
  const profile = await TeacherProfileService.getTeacherProfile(userId);

  // BUG: Returns null instead of fallback
  if (!profile) {
    return null; // This causes generateSuggestions to throw
  }

  return {...};
}
```

### Why It Happens

1. **InstantDB is available** (backend log: "InstantDB initialized successfully")
2. **Code attempts to fetch user profile** from InstantDB
3. **User doesn't exist in database** ("test-user-123" is not a real user)
4. **InstantDB query hangs** (no timeout mechanism)
5. **Promise never resolves or rejects**
6. **Request times out** after 120 seconds (default HTTP timeout)

### Why It's Critical

- **No timeout protection**: External service calls should ALWAYS have timeouts
- **No fallback strategy**: Code returns `null` instead of mock/fallback data
- **Breaks graceful degradation**: System fails completely instead of degrading
- **Poor error handling**: No try-catch, no logging of the hang

---

## Technical Details

### Call Stack

```
POST /api/prompts/generate-suggestions
  ↓
routes/prompts.ts:82 - await promptService.generateSuggestions(request)
  ↓
services/promptService.ts:32 - await this.getUserProfile(userId)
  ↓
services/promptService.ts:102 - await TeacherProfileService.getTeacherProfile(userId)
  ↓
services/instantdbService.ts:239 - db.useQuery({teacher_profile: {...}})
  ↓
HANGS HERE - InstantDB query never returns
```

### Backend Logs

```
2025-10-01 09:29:56 [info]: Logger initialized
2025-10-01 09:30:05 [info]: InstantDB initialized successfully
2025-10-01 09:30:05 [info]: Teacher Assistant Backend Server started successfully
2025-10-01 09:30:05 [info]: Development mode enabled

... NO FURTHER LOGS AFTER API REQUEST ...
(Request sent but no log about "Generating prompt suggestions")
```

**Key Observation**: The request doesn't even reach the log statement at Line 75 in prompts.ts, meaning it hangs during the service call.

---

## Recommended Fix

### Solution: Add Timeout + Fallback Strategy

**File**: `teacher-assistant/backend/src/services/promptService.ts`
**Lines to Change**: 88-115

```typescript
/**
 * Fetch user profile from InstantDB
 */
private async getUserProfile(userId: string): Promise<any> {
  if (!isInstantDBAvailable()) {
    // Return mock profile for development
    logInfo('InstantDB not available, using mock profile', { userId });
    return {
      subjects: ['Mathematik'],
      grades: ['7'],
      school_type: 'Gymnasium',
      teaching_methods: ['Gruppenarbeit'],
      topics: ['Bruchrechnung'],
      challenges: []
    };
  }

  try {
    // Add 5-second timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('InstantDB query timeout')), 5000);
    });

    const profilePromise = TeacherProfileService.getTeacherProfile(userId);
    const profile = await Promise.race([profilePromise, timeoutPromise]) as any;

    if (!profile) {
      // User not found - return fallback instead of null
      logInfo('User profile not found, using fallback profile', { userId });
      return {
        subjects: ['Mathematik'],
        grades: ['7'],
        school_type: 'Gymnasium',
        teaching_methods: ['Gruppenarbeit'],
        topics: ['Bruchrechnung'],
        challenges: []
      };
    }

    return {
      subjects: profile.subjects,
      grades: profile.grades,
      school_type: profile.school_type,
      teaching_methods: profile.teaching_methods,
      topics: profile.topics,
      challenges: profile.challenges
    };
  } catch (error) {
    // On error, return fallback instead of failing
    logError('Error fetching user profile, using fallback', error as Error, { userId });
    return {
      subjects: ['Mathematik'],
      grades: ['7'],
      school_type: 'Gymnasium',
      teaching_methods: ['Gruppenarbeit'],
      topics: ['Bruchrechnung'],
      challenges: []
    };
  }
}
```

### Changes Made

1. **Wrapped entire block in try-catch** (graceful error handling)
2. **Added 5-second timeout** using Promise.race()
3. **Return fallback profile** instead of `null` when user not found
4. **Return fallback profile** on any error (timeout, network, etc.)
5. **Added logging** for debugging (INFO level for expected cases, ERROR for exceptions)

### Benefits

- **Prevents hanging**: 5-second timeout ensures response within reasonable time
- **Graceful degradation**: System works even if InstantDB is slow/unavailable
- **Better UX**: Users still see prompt suggestions (generic, but functional)
- **Production-ready**: Can deploy even if some users don't have profiles
- **Debuggable**: Logs show when fallback is used

---

## Testing After Fix

### Unit Tests to Add

Add to `teacher-assistant/backend/src/services/promptService.test.ts`:

```typescript
describe('getUserProfile timeout handling', () => {
  it('should return within 5 seconds', async () => {
    const start = Date.now();
    const result = await promptService.getUserProfile('timeout-user');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(6000);
    expect(result).toBeDefined();
  });

  it('should return fallback profile on timeout', async () => {
    // Mock InstantDB to hang
    jest.spyOn(TeacherProfileService, 'getTeacherProfile')
      .mockImplementation(() => new Promise(() => {})); // Never resolves

    const result = await promptService.getUserProfile('test-user');

    expect(result.subjects).toEqual(['Mathematik']);
    expect(result.grades).toEqual(['7']);
  });

  it('should return fallback profile when user not found', async () => {
    jest.spyOn(TeacherProfileService, 'getTeacherProfile')
      .mockResolvedValue(null);

    const result = await promptService.getUserProfile('nonexistent-user');

    expect(result).not.toBeNull();
    expect(result.subjects).toBeDefined();
  });
});
```

### Manual API Testing

```bash
# Test 1: Verify endpoint responds within 5 seconds
time curl -X POST http://localhost:3006/api/prompts/generate-suggestions \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'

# Expected: Response in < 5 seconds with suggestions array
# Expected Status: 200 OK
# Expected Body: {"success": true, "data": {"suggestions": [...], "generatedAt": "...", "seed": "..."}}

# Test 2: Verify fallback profile is used
curl -X POST http://localhost:3006/api/prompts/generate-suggestions \
  -H "Content-Type: application/json" \
  -d '{"userId":"nonexistent-user-999"}' | jq

# Expected: Suggestions with "Mathematik", "7. Klasse" prompts

# Test 3: Verify logs show fallback usage
# Check backend console for:
# [info]: User profile not found, using fallback profile
```

### Integration Testing

```bash
# Start backend
cd teacher-assistant/backend && npm run dev

# In another terminal, start frontend
cd teacher-assistant/frontend && npm run dev

# Open browser to http://localhost:5179
# Navigate to Home tab
# Verify: Prompt tiles appear within 5 seconds
# Verify: No console errors
# Verify: Tiles show German prompts (Mathematik, etc.)
```

---

## Verification Checklist

- [ ] Apply fix to `promptService.ts`
- [ ] Backend compiles without errors (`npm run build`)
- [ ] All existing tests pass (`npm test`)
- [ ] Add new timeout tests (3 tests)
- [ ] Manual API test with curl (< 5s response)
- [ ] Backend logs show fallback profile usage
- [ ] Frontend integration: Home screen loads prompts
- [ ] No console errors in browser
- [ ] Prompt tiles display correctly
- [ ] Click tile → Navigate to Chat works
- [ ] E2E test passes

---

## Related Issues

**Similar Bugs in Codebase**: NONE
**Previous Fixes**: BUG-011 (InstantDB schema error - different root cause)
**Prevention Pattern**: This same timeout pattern should be applied to ALL InstantDB service calls

---

## Lessons Learned

### What Went Wrong

1. **No timeout protection on external service calls**
   - InstantDB queries can hang indefinitely
   - No defensive programming for slow/unavailable services

2. **No fallback strategy**
   - Code returns `null` instead of mock data
   - Breaks graceful degradation principle

3. **No integration testing before QA**
   - Backend implementation never tested end-to-end
   - Unit tests passed but API didn't work

4. **Assumed external services are reliable**
   - InstantDB can be slow, down, or return unexpected results
   - Need defensive programming

### Best Practices to Apply

1. **ALWAYS add timeout wrappers for external service calls**
   ```typescript
   const result = await Promise.race([
     externalServiceCall(),
     timeout(5000)
   ]);
   ```

2. **ALWAYS provide fallback data instead of null/throw**
   - Return mock/default data when service fails
   - Log the fallback usage for monitoring
   - Keep the app functional

3. **ALWAYS test API endpoints manually before QA**
   - Use curl/Postman to verify endpoints work
   - Check response time, status codes, body structure
   - Don't rely solely on unit tests

4. **NEVER assume external services are reliable**
   - Network can be slow
   - Services can be down
   - Queries can hang
   - Always have Plan B

5. **ADD integration tests to CI/CD pipeline**
   - Test full request flow (API → Service → DB → Response)
   - Catch these issues before QA
   - Use timeouts in tests too

---

## Prevention Recommendations

### Code Pattern to Use

Create a `withTimeout` utility in `backend/src/utils/timeout.ts`:

```typescript
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  context?: string
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      const error = new Error(`Operation timeout after ${timeoutMs}ms`);
      if (context) {
        logError(`Timeout in ${context}`, error);
      }
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    logError('Operation failed or timed out, using fallback', error as Error, { context });
    return fallback;
  }
}
```

Usage:

```typescript
const profile = await withTimeout(
  TeacherProfileService.getTeacherProfile(userId),
  5000,
  {
    subjects: ['Mathematik'],
    grades: ['7'],
    // ... fallback data
  },
  'getUserProfile'
);
```

### Apply to All InstantDB Calls

Audit all files using InstantDB and add timeout protection:
- `services/instantdbService.ts` - 20+ methods
- `services/chatService.ts` - Message queries
- `services/teacherProfileService.ts` - Profile operations
- `services/promptService.ts` - This file (BUG-012)

---

## Assignment

**Assigned To**: backend-node-developer agent
**Priority**: P0 - CRITICAL
**Estimated Time**: 30 minutes (apply fix + test)
**Blocking**: Home Screen Redesign feature deployment

**Action Items**:
1. Apply recommended fix to `promptService.ts`
2. Run backend test suite (verify all 14 tests pass)
3. Manual API test with curl (verify < 5s response)
4. Add 3 new unit tests for timeout handling
5. Document fix in session log
6. Mark BUG-012 as RESOLVED
7. Notify qa-integration-reviewer for re-verification

---

## Status Updates

**Created**: 2025-10-01 09:35:00 UTC
**Last Updated**: 2025-10-01 09:35:00 UTC
**Status**: 🔴 OPEN - Awaiting Backend Developer Fix

---

**Reported By**: qa-integration-reviewer (Claude Code)
**Session**: `docs/development-logs/sessions/2025-10-01/session-02-qa-review-home-screen-critical-bugs.md`
