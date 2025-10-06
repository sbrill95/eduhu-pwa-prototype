# Session 03: Infinite Render Loop Investigation (BUG-010)

**Datum**: 2025-09-30
**Agent**: General Purpose (Claude)
**Dauer**: ~3 Stunden
**Status**: 🟡 Partially Resolved - App Functional, Console Errors Persist
**Related Bug**: BUG-010 in bug-tracking.md

---

## 🎯 Session Ziele

1. Fix infinite render loop causing 200+ console errors
2. Identify root cause of "Maximum update depth exceeded"
3. Restore stable Chat interface functionality
4. Document all findings for future investigation

---

## 🔍 Problem Analysis

### Initial State
- User reported: "Ich kriege hier sofort einen Fehler" beim Chat-Tab öffnen
- Console zeigt 80-200+ "Maximum update depth exceeded" Fehler
- App erscheint funktional trotz Fehler
- ChatView mounted mehrfach (2-3x Logs)

### Key Observations
1. **Errors occur BEFORE component logs**
   - 70+ errors BEFORE "🔄 Tab change requested"
   - Indicates loop in React render cycle or InstantDB queries
   - NOT in component useEffects

2. **ChatView remounts repeatedly**
   - "ChatView mounted" appears 2-3 times
   - React.memo NOT preventing re-renders

3. **App remains functional**
   - Chat interface renders correctly
   - User interactions work normally
   - No browser crashes

---

## 🔧 Attempted Fixes (Chronological)

### Fix #1: Circuit Breaker Removal
**File**: `teacher-assistant/frontend/src/hooks/useChat.ts` (Line 161-186)
**Problem Found**: useEffect WITHOUT dependency array
```typescript
// REMOVED:
useEffect(() => {
  renderCount.current++;
  // ... circuit breaker logic
}); // ← NO DEPENDENCIES - runs on EVERY render!
```
**Result**: ❌ Errors persist

### Fix #2: handleTabChange Stabilization
**File**: `teacher-assistant/frontend/src/App.tsx` (Line 106-109)
```typescript
// BEFORE:
}, [activeTab]); // ← callback recreated on every tab change

// AFTER:
}, []); // Empty dependencies - setActiveTab is stable
```
**Result**: ❌ Errors persist

### Fix #3: Onboarding Ref Pattern
**File**: `teacher-assistant/frontend/src/App.tsx` (Line 77, 145-151, 271)
```typescript
// Added:
const onboardingCheckedRef = useRef(false);

// Changed:
if (!user?.id || authLoading || onboardingCheckedRef.current) return;
onboardingCheckedRef.current = true; // Track without re-render

// Dependencies:
}, [user?.id, checkOnboardingStatus, authLoading]); // Removed onboardingState.hasChecked
```
**Result**: ❌ Errors persist

### Fix #4: newChat useCallback Dependencies
**File**: `teacher-assistant/frontend/src/hooks/useChat.ts` (Line 1038)
```typescript
// REMOVED from dependencies:
// - localMessages.length
// - currentSessionId
// - user?.id

// KEPT only stable functions:
}, [extractFromConversation, resetState]);
```
**Reasoning**: We READ these values, don't react to them
**Result**: ❌ Errors persist

### Fix #5: ChatView useEffect Dependencies
**File**: `teacher-assistant/frontend/src/components/ChatView.tsx`
```typescript
// Line 253 - Load session effect:
// REMOVED: loadSession (stable function)
}, [sessionId, currentSessionId]);

// Line 268 - Notify parent effect:
// REMOVED: onSessionChange (stable useCallback in App.tsx)
}, [currentSessionId]);
```
**Result**: ❌ Errors persist

### Fix #6: Auto-Load Feature Disabled
**File**: `teacher-assistant/frontend/src/App.tsx` (Line 111-130)
```typescript
// TEMPORARILY DISABLED:
/*
const shouldAutoLoad = useMemo(() => { ... });
useEffect(() => { ... }, [shouldAutoLoad]);
*/
```
**Reasoning**: Test if auto-load logic is causing the loop
**Result**: ❌ Errors STILL persist even without auto-load!

### Fix #7: React Router v6 Migration
**File**: `teacher-assistant/frontend/src/components/AgentResultMessage.tsx`
```typescript
// REMOVED:
import { useHistory } from 'react-router-dom';
const history = useHistory();
history.push('/library');

// REPLACED WITH:
onTabChange?: (tab: 'home' | 'chat' | 'library') => void;
onTabChange('library');
```
**Result**: ✅ Fixed BUG-009 (blank screen), but BUG-010 persists

---

## 📊 Files Modified

### 1. App.tsx
- **Line 77**: Added `onboardingCheckedRef = useRef(false)`
- **Line 109**: Fixed handleTabChange - empty dependencies
- **Line 111-130**: Disabled auto-load feature (commented out)
- **Line 145-151**: Use ref instead of state in onboarding check
- **Line 271**: Removed onboardingState.hasChecked from dependencies
- **Line 374**: Pass onTabChange to ChatView

### 2. useChat.ts
- **Line 161-186**: REMOVED circuit breaker useEffect
- **Line 1038**: Fixed newChat dependencies

### 3. ChatView.tsx
- **Line 253**: Removed loadSession from dependencies
- **Line 268**: Removed onSessionChange from dependencies

### 4. AgentResultMessage.tsx
- Removed useHistory import
- Added onTabChange prop
- Fixed library navigation

---

## 🎯 Root Cause Analysis

### Suspected Causes (Requires Deep Investigation)

#### 1. InstantDB Query Re-runs (Priority: HIGH)
```typescript
// App.tsx Line 80-90
const { data: recentSessionData } = db.useQuery(
  user ? {
    chat_sessions: {
      $: {
        where: { user_id: user.id },
        order: { serverCreatedAt: 'desc' },
        limit: 1
      }
    }
  } : null
);
```
**Theory**:
- InstantDB may return NEW array references on every query
- Even if data is unchanged, new reference triggers re-renders
- Need to investigate InstantDB caching/memoization

**Evidence**:
- `recentSessionData?.chat_sessions` used in useMemo dependencies
- Every query = new array reference = useMemo recalculates
- Cascade effect through component tree

#### 2. messages Array Instability (Priority: HIGH)
```typescript
// useChat.ts Line 1041-1077
const messages = useMemo(() => {
  const allMessages: Array<...> = [];
  // ... add database messages
  // ... add local messages
  return allMessages.sort(...); // NEW array every time
}, [sessionData?.messages, safeLocalMessages]);
```
**Theory**:
- Dependencies are ARRAYS (new references on every InstantDB query)
- useMemo recalculates → returns NEW messages array
- ChatView receives new messages → re-renders
- ChatView has `messages` in useEffect (Line 237) → effect runs
- Potential cascade loop

**Evidence**:
- ChatView mounts 2-3 times
- Errors occur before any component logs
- React.memo not preventing re-renders

#### 3. Multiple Hook Cascade (Priority: MEDIUM)
```typescript
// useChat.ts Top-level
const { user } = useAuth();
const { sendMessage, loading, error, resetState } = useApiChat();
const { profile, loading: profileLoading, ... } = useTeacherProfile();
const { detectAgentContext, ... } = useAgents();
```
**Theory**:
- Each hook may trigger its own re-renders
- Cascade effect: one hook update → triggers another → loop
- Need profiling to identify which hook causes loop

---

## 🧪 Verification Results

### ✅ What Works:
- App loads and renders correctly
- Chat interface is functional
- User can interact normally
- No browser crashes or freezes
- BUG-009 (React Router) fixed

### ❌ What Doesn't Work:
- Console: 200+ "Maximum update depth exceeded" errors when opening Chat tab
- ChatView mounts 2-3 times instead of once
- Auto-load feature disabled (temporary workaround)

### ⚠️ Current Status:
- **App is FUNCTIONAL** but NOT production-ready
- Console spam makes debugging difficult
- Performance impact unclear (appears normal)
- UX impact from disabled auto-load

---

## 📋 Next Steps (Required for Production)

### 1. InstantDB Query Investigation (Priority: HIGH)
**Tasks**:
- Profile InstantDB queries to measure re-run frequency
- Check if `db.useQuery` returns new object references
- Investigate InstantDB caching/memoization options
- Consider wrapping query results in useMemo with deep comparison

**Tools**:
- React DevTools Profiler
- Console logging in db.useQuery wrapper
- InstantDB documentation review

### 2. useChat Hook Profiling (Priority: HIGH)
**Tasks**:
- Add React DevTools Profiler to identify render causes
- Log every state change in useChat hook
- Identify which hook (useAuth, useApiChat, useTeacherProfile, useAgents) triggers loop
- Consider splitting useChat into smaller, more stable hooks

**Approach**:
- Add console.log to every useState setter
- Track render count per hook
- Use React DevTools Timeline view

### 3. messages Array Stability (Priority: MEDIUM)
**Tasks**:
- Investigate if sessionData?.messages changes reference on every render
- Consider using useDeepCompareMemo for messages array
- Profile safeLocalMessages changes
- Test with frozen objects to prevent mutations

### 4. React.memo Effectiveness (Priority: MEDIUM)
**Tasks**:
- Check why React.memo on ChatView isn't preventing re-renders
- Consider using custom comparison function
- Profile ChatView props changes
- Test with React.memo(ChatView, (prev, next) => ...)

### 5. Alternative Architecture (Priority: LOW, if above fails)
**Considerations**:
- Move InstantDB queries outside components (Context Provider)
- Implement centralized state management (Zustand/Redux)
- Reduce number of hooks in useChat
- Consider React Query for data fetching

---

## 💡 Lessons Learned

### 1. False "Fixed" Reports
**Problem**: Earlier session reported BUG-010 as "RESOLVED" but errors persisted
**Lesson**: ALWAYS verify with fresh browser test BEFORE marking as fixed
**Prevention**: Add "Verification" step to bug tracking workflow

### 2. useEffect Without Dependencies
**Problem**: Circuit breaker useEffect was itself causing the infinite loop
**Lesson**: useEffect without dependencies runs on EVERY render
**Prevention**: ESLint rule `exhaustive-deps` should be enforced

### 3. InstantDB Query Patterns
**Discovery**: InstantDB queries may not be memoized by default
**Lesson**: Need to wrap query results in useMemo with stable dependencies
**Action**: Document InstantDB best practices

### 4. Complex Hook Interactions
**Discovery**: useChat combines 5+ hooks, making debugging difficult
**Lesson**: Consider splitting complex hooks for better testability
**Action**: Refactor useChat in future sprint

---

## 🤝 Recommended Next Agent

**Agent**: react-frontend-developer
**Reason**: Specialized in React profiling and InstantDB optimization
**Task**: Deep investigation of useChat hook and InstantDB query patterns

**Handoff Notes**:
- All findings documented in `docs/quality-assurance/bug-tracking.md` (BUG-010)
- App is functional, focus on eliminating console errors
- Auto-load feature disabled at App.tsx Line 111-130 (needs re-enabling after fix)
- Test environment: http://localhost:5177 with Playwright browser

---

## 📚 References

- Bug Tracking: `docs/quality-assurance/bug-tracking.md` (BUG-010)
- Modified Files: See "Files Modified" section above
- React DevTools: https://react.dev/learn/react-developer-tools
- InstantDB Docs: https://www.instantdb.com/docs

---

## ⏱️ Time Breakdown

- Initial investigation: 30 minutes
- Fix attempts (6 iterations): 90 minutes
- Testing and verification: 45 minutes
- Documentation: 45 minutes
- **Total**: ~3 hours

---

**Status Summary**: App is FUNCTIONAL but requires deep investigation of InstantDB query patterns and useChat hook architecture before production deployment. All findings fully documented for handoff to react-frontend-developer agent. 🎯