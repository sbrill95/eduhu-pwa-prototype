# Dev Handoff: Story 3.1.3 Bug Fixes

**Date**: 2025-10-26
**From**: QA Agent (Quinn)
**To**: Dev Agent
**Story**: epic-3.1.story-3 - Router Logic: Creation vs. Editing Detection
**Status**: CONCERNS ⚠️ (Implementation COMPLETE, bugs need fixing)

---

## Executive Summary

Story 3.1.3 implementation is COMPLETE with excellent code quality. E2E pass rate improved from 44% (2025-10-25) to 55% (2025-10-26), showing progress. However, **3 bugs prevent full E2E validation** and production deployment.

**Your Mission**: Fix bugs sequentially, re-test after each fix, achieve 100% E2E pass rate.

**Estimated Total Time**: 7-9 hours
**Expected Final E2E Pass Rate**: 100% (9/9 passing)

---

## Current Status

### Test Results (2025-10-26)

| Test Suite | Status | Pass Rate |
|------------|--------|-----------|
| Backend Unit Tests | ✅ PASS | 48/48 (100%) |
| Frontend Component Tests | ✅ PASS | 15/15 (100%) |
| E2E Tests | ⚠️ PARTIAL | 5/9 (55%) |
| Build | ✅ PASS | 0 TypeScript errors |

### E2E Test Breakdown

| Test | Status | Blocker |
|------|--------|---------|
| AC1: High confidence creation | ✅ PASS | None |
| AC2: High confidence editing | ✅ PASS | None |
| AC3: Low confidence shows override | ❌ FAIL | BUG-002 |
| AC4: User selects creation | ✅ PASS | None |
| AC5: User selects editing | 🔄 FLAKY | BUG-002 |
| AC6: Image reference (latest) | ✅ PASS | None |
| AC7: Context-aware (dative) | ✅ PASS | None |
| Performance (<500ms) | ❌ FAIL | BUG-003 |
| Zero console errors | ❌ FAIL | BUG-004 |

---

## Bugs to Fix (Prioritized)

### 🔴 BUG-002: Router Confidence Too High (HIGH PRIORITY)

**Status**: STILL BLOCKING
**Priority**: HIGH
**Estimated Effort**: 2-3 hours
**Expected Impact**: E2E pass rate 55% → 77% (7/9)

#### Problem
Ambiguous prompts (e.g., "Mache das bunter") classified with confidence ≥0.9 instead of <0.7, preventing RouterOverride UI from appearing.

#### Location
`teacher-assistant/backend/src/agents/routerAgent.ts` (confidence calculation logic)

#### Expected Behavior
- Ambiguous prompts should return confidence <0.7
- RouterOverride UI should appear for low confidence
- User sees manual selection options

#### Actual Behavior
- Ambiguous prompts get confidence ≥0.9
- Auto-routing without user confirmation
- AC3 test fails, AC5 test flaky

#### Test Evidence
```bash
Test: AC3 - "Mache das bunter" (ambiguous)
Expected: confidence <0.7, RouterOverride visible
Actual: RouterOverride not found, auto-routed
Status: FAILED
```

#### Fix Tasks

1. **Analyze Confidence Calculation**
   ```typescript
   // File: routerAgent.ts
   // Find confidence calculation logic
   // Current logic likely too generous for ambiguous prompts
   ```

2. **Add Ambiguity Detection**
   - Check for vague verbs ("mache", "ändere das")
   - Check for deictic references without context ("das", "es")
   - Check for missing subject/object

3. **Reduce Confidence for Ambiguous Prompts**
   ```typescript
   // Example fix:
   if (isAmbiguous(prompt)) {
     confidence = Math.min(confidence, 0.6); // Cap at 0.6 for ambiguous
   }
   ```

4. **Add Unit Tests**
   ```typescript
   // Add to routerAgent.test.ts
   test('should return low confidence for ambiguous prompts', async () => {
     const result = await router.execute('Mache das bunter');
     expect(result.confidence).toBeLessThan(0.7);
     expect(result.needsManualSelection).toBe(true);
   });
   ```

5. **Re-run Tests**
   ```bash
   # Backend tests
   cd teacher-assistant/backend && npm test -- routerAgent.test.ts

   # E2E tests
   cd teacher-assistant/frontend
   set VITE_TEST_MODE=true
   npx playwright test e2e-tests/router-classification.spec.ts --reporter=list --workers=1
   ```

#### Expected Outcome
- AC3 test passes (low confidence shows RouterOverride)
- AC5 test passes (user can select editing manually)
- E2E pass rate: 7/9 (77%)

---

### 🟡 BUG-003: Performance Below Target (MEDIUM PRIORITY)

**Status**: STILL PRESENT
**Priority**: MEDIUM
**Estimated Effort**: 3-4 hours
**Expected Impact**: E2E pass rate 77% → 88% (8/9)

#### Problem
Classification slower than 500ms target.

#### Location
Classification workflow (router API call + OpenAI integration)

#### Expected Behavior
- Classification completes in <500ms

#### Actual Behavior
- Classification slower than target
- Performance test fails

#### Analysis
- Backend unit tests fast (<100ms) → issue in integration/network layer
- Possible causes:
  - OpenAI API latency
  - Network overhead in E2E tests
  - No caching for repeated prompts
  - Inefficient prompt processing

#### Fix Tasks

1. **Add Response Caching**
   ```typescript
   // File: routerAgent.ts
   // Add simple in-memory cache
   private cache = new Map<string, RouterResponse>();

   async execute(params: RouterAgentParams): Promise<RouterResponse> {
     const cacheKey = params.prompt.toLowerCase().trim();
     if (this.cache.has(cacheKey)) {
       return this.cache.get(cacheKey)!;
     }

     const result = await this.classifyIntent(params);
     this.cache.set(cacheKey, result);
     return result;
   }
   ```

2. **Optimize OpenAI API Calls**
   - Reduce token count in system prompt
   - Use shorter examples
   - Consider using cheaper model for classification

3. **Add Performance Benchmarks**
   ```typescript
   // Add to routerAgent.test.ts
   test('should classify prompts in <500ms', async () => {
     const start = Date.now();
     await router.execute('Erstelle ein Bild');
     const duration = Date.now() - start;
     expect(duration).toBeLessThan(500);
   });
   ```

4. **Re-run Tests**
   ```bash
   # E2E performance test
   npx playwright test e2e-tests/router-classification.spec.ts:264 --reporter=list
   ```

#### Expected Outcome
- Performance test passes (<500ms classification)
- E2E pass rate: 8/9 (88%)

---

### 🟡 BUG-004: Console Errors (MEDIUM PRIORITY)

**Status**: WORSENED (4→5 errors)
**Priority**: MEDIUM
**Estimated Effort**: 2 hours
**Expected Impact**: E2E pass rate 88% → 100% (9/9)

#### Problem
5 console errors detected during E2E test execution (InstantDB-related).

#### Location
- InstantDB queries in frontend
- Likely `useChat.ts`, `ChatView.tsx`, or other InstantDB integrations

#### Expected Behavior
- Zero console errors during execution

#### Actual Behavior
- 5 console errors (increased from 4)
- Error handling not working correctly

#### Error Types (from baseline review)
- InstantDB property access errors
- Undefined object property reads
- Potential race conditions in async queries

#### Fix Tasks

1. **Identify Error Sources**
   ```bash
   # Run E2E tests and capture console errors
   npx playwright test e2e-tests/router-classification.spec.ts:289 --reporter=list
   # Check test output for console error messages
   ```

2. **Add Defensive Programming**
   ```typescript
   // Example fix patterns:

   // BEFORE (risky):
   const messages = data.messages.filter(m => m.userId === user.id);

   // AFTER (defensive):
   const messages = data?.messages?.filter(m => m.userId === user?.id) ?? [];

   // BEFORE (risky):
   const profile = await TeacherProfileService.getTeacherProfile(userId);

   // AFTER (defensive):
   import { withTimeout } from '../utils/timeout';
   const profile = await withTimeout(
     TeacherProfileService.getTeacherProfile(userId),
     5000,
     { subjects: [], grades: [] } // Fallback
   );
   ```

3. **Add Error Boundaries**
   ```typescript
   // Add error boundary component for React
   // Wrap components that query InstantDB
   ```

4. **Add Try-Catch Blocks**
   ```typescript
   // For async operations
   try {
     const result = await db.query({ messages: {} });
     // Handle result
   } catch (error) {
     console.error('Query failed:', error);
     // Graceful fallback
   }
   ```

5. **Re-run Tests**
   ```bash
   npx playwright test e2e-tests/router-classification.spec.ts:289 --reporter=list
   ```

#### Expected Outcome
- Zero console errors test passes
- E2E pass rate: 9/9 (100%)

---

## Progressive Fix Workflow

### Step 1: Fix BUG-002 (2-3 hours)
1. Analyze confidence calculation in `routerAgent.ts`
2. Add ambiguity detection logic
3. Reduce confidence for ambiguous prompts
4. Add unit tests
5. Run backend tests: `npm test -- routerAgent.test.ts`
6. Run E2E tests: `npx playwright test router-classification.spec.ts`
7. **Verify**: E2E pass rate 77% (7/9)

### Step 2: Fix BUG-003 (3-4 hours)
1. Add response caching
2. Optimize OpenAI API calls
3. Add performance benchmarks
4. Run backend tests
5. Run E2E tests
6. **Verify**: E2E pass rate 88% (8/9)

### Step 3: Fix BUG-004 (2 hours)
1. Identify console error sources
2. Add defensive programming (null checks, optional chaining)
3. Add error boundaries
4. Add try-catch blocks
5. Run E2E tests
6. **Verify**: E2E pass rate 100% (9/9)

### Step 4: Final Validation
1. Run all tests:
   ```bash
   # Backend
   cd teacher-assistant/backend && npm test

   # Frontend
   cd teacher-assistant/frontend && npm test -- --run

   # Build
   cd teacher-assistant/backend && npm run build
   cd teacher-assistant/frontend && npm run build

   # E2E
   set VITE_TEST_MODE=true
   npx playwright test e2e-tests/router-classification.spec.ts --reporter=list
   ```

2. Capture screenshots of all passing tests

3. Document fixes in session log

4. **Notify QA for re-review**

---

## Testing Commands

### Backend Tests
```bash
cd teacher-assistant/backend
npm test -- routerAgent.test.ts
# Expected: 48/48 passing (100%)
```

### Frontend Component Tests
```bash
cd teacher-assistant/frontend
npm test RouterOverride.test.tsx -- --run
# Expected: 15/15 passing (100%)
```

### E2E Tests
```bash
cd teacher-assistant/frontend
set VITE_TEST_MODE=true

# Start backend (if not running)
cd teacher-assistant/backend && npm start

# Start frontend dev server (if not running)
cd teacher-assistant/frontend && npm run dev -- --mode test --port 5174

# Run E2E tests
npx playwright test e2e-tests/router-classification.spec.ts --reporter=list --workers=1
# Expected after fixes: 9/9 passing (100%)
```

### Pre-Flight Check
```bash
# ALWAYS run before E2E tests
bash scripts/pre-test-checklist.sh
# Should show: Backend running ✅, VITE_TEST_MODE set ✅, Port 3006 listening ✅
```

---

## Success Criteria

### Definition of Done
- ✅ BUG-002 fixed (router confidence tuned)
- ✅ BUG-003 fixed (performance <500ms)
- ✅ BUG-004 fixed (zero console errors)
- ✅ Backend tests: 48/48 passing (100%)
- ✅ Frontend tests: 15/15 passing (100%)
- ✅ E2E tests: 9/9 passing (100%)
- ✅ Build clean: 0 TypeScript errors
- ✅ Screenshots captured for all tests
- ✅ Session log created documenting fixes
- ✅ Code committed with descriptive message

### Quality Gate Upgrade
Current: **CONCERNS** ⚠️
After fixes: **PASS** ✅

---

## Reference Documents

- **QA Review (Updated)**: `docs/qa/assessments/epic-3.1.story-3-review-20251026.md`
- **Quality Gate (Updated)**: `docs/qa/gates/epic-3.1.story-3-router-logic-20251026.yml`
- **Story**: `docs/stories/epic-3.1.story-3.md`
- **E2E Tests**: `teacher-assistant/frontend/e2e-tests/router-classification.spec.ts`
- **Router Agent**: `teacher-assistant/backend/src/agents/routerAgent.ts`
- **Router Tests**: `teacher-assistant/backend/src/agents/__tests__/routerAgent.test.ts`

---

## Contact

If you encounter blockers or need clarification:
1. Document blocker in session log
2. Tag issue with `[BLOCKED]` prefix
3. Notify QA Agent (Quinn) for guidance

---

**Good luck, Dev! You've got this!** 🚀

**Expected Timeline**:
- Hour 1-3: Fix BUG-002 → E2E 77%
- Hour 4-7: Fix BUG-003 → E2E 88%
- Hour 8-9: Fix BUG-004 → E2E 100%
- Hour 9: Final validation + documentation

**QA is waiting for your re-review request when all tests pass!** ✅
