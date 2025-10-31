# Risk Assessment: Error Prevention System Implementation

**Assessment Date**: 2025-10-23
**Reviewer**: Quinn (BMad Test Architect)
**System**: Comprehensive Error Prevention System
**Scope**: Pre-flight checks, backend management, test fixtures, timeout utilities

---

## Executive Summary

**CRITICAL BREAKING CHANGE DETECTED**: Backend build fails due to TypeScript error in health endpoint.

**Overall Risk Level**: 🔴 **HIGH** (1 CRITICAL, 4 HIGH, 6 MEDIUM, 5 LOW risks)

**Recommendation**: **FIX CRITICAL ISSUE BEFORE ROLLOUT** → Then staged rollout with close monitoring.

**Time to Fix Critical Issue**: ~5 minutes (property name typo)

---

## 🔴 CRITICAL RISKS (Immediate Action Required)

### CR-1: Backend Build Failure (TypeScript Error)

**Severity**: CRITICAL
**Probability**: 100% (confirmed)
**Impact**: 9/9 (blocks all development)

**Issue**:
```typescript
// File: teacher-assistant/backend/src/routes/health.ts:44
instantdbStatus = config.INSTANT_APP_ID ? 'connected' : 'not_configured';
                         ^^^^^^^^^^^^^^^^^
// ERROR: Property 'INSTANT_APP_ID' does not exist on type 'EnvironmentVariables'
// Should be: 'INSTANTDB_APP_ID'
```

**Root Cause**: Typo in property name - config uses `INSTANTDB_APP_ID` but health.ts references `INSTANT_APP_ID` (missing "DB").

**Impact**:
- ❌ Backend cannot build
- ❌ Development completely blocked
- ❌ Tests cannot run
- ❌ No code can be deployed
- ❌ Pre-flight checks will fail (backend won't start)

**Evidence**:
```
src/routes/health.ts(44,32): error TS2551: Property 'INSTANT_APP_ID' does not exist on type 'EnvironmentVariables'. Did you mean 'INSTANTDB_APP_ID'?
```

**Mitigation**:
1. **IMMEDIATE FIX** (5 minutes):
   ```typescript
   // Change line 44 in teacher-assistant/backend/src/routes/health.ts
   instantdbStatus = config.INSTANTDB_APP_ID ? 'connected' : 'not_configured';
   //                      ^^^ Add "DB" here
   ```

2. **Verify fix**:
   ```bash
   cd teacher-assistant/backend
   npm run build  # Should succeed with 0 errors
   ```

3. **Test**:
   ```bash
   npm start
   curl http://localhost:3006/api/health  # Should return valid JSON
   ```

**Risk Score**: 9 × 1.0 = **9.0 (CRITICAL)**

---

## 🔴 HIGH RISKS (Address Before Full Rollout)

### HR-1: Windows Script Compatibility Issues

**Severity**: HIGH
**Probability**: 80% (Windows environment confirmed in git status)
**Impact**: 7/9 (blocks Windows developers)

**Issue**: Shell scripts use Unix commands that may not work on Windows:
- `pre-test-checklist.sh`: Uses `bash`, `curl`, `git`, `netstat`, `grep`
- `kill-backend.sh`: Uses `uname`, `pkill`, `lsof`, `taskkill`, `findstr`
- `restart-backend.sh`: Uses `ps`, `curl`

**Windows Environment Evidence**:
```
Platform: win32
OS Version: (Windows)
Git Status: MINGW detected in scripts
```

**Specific Compatibility Issues**:

1. **Bash Requirement**:
   - Scripts require Git Bash, WSL, or Cygwin
   - Native Windows Command Prompt won't work
   - PowerShell won't work without wrapper

2. **Command Availability**:
   - `curl`: Available in Windows 10+, but syntax differs
   - `netstat`: Different flags on Windows (`-ano` vs `-tulpn`)
   - `grep`: Not native to Windows (Git Bash provides it)
   - `lsof`: NOT available on Windows (uses `netstat` fallback)
   - `ps`: PowerShell command, not available in cmd.exe

3. **Path Separators**:
   - Scripts use `/` (Unix) not `\` (Windows)
   - Works in Git Bash but fails in cmd.exe

**Impact**:
- 🔴 Developers without Git Bash cannot use scripts
- 🔴 CI/CD pipelines on Windows agents will fail
- 🔴 Documentation shows Linux commands (confusing for Windows users)

**Mitigation Strategies**:

1. **SHORT-TERM** (immediate):
   - Add prominent note in CLAUDE.md:
     ```markdown
     **WINDOWS USERS**: Run scripts in Git Bash (NOT cmd.exe or PowerShell)
     - Install Git for Windows: https://git-scm.com/download/win
     - Open Git Bash (not Windows Terminal)
     - Run: bash scripts/pre-test-checklist.sh
     ```

2. **MEDIUM-TERM** (1-2 weeks):
   - Create PowerShell equivalents:
     - `scripts/pre-test-checklist.ps1`
     - `scripts/kill-backend.ps1`
     - `scripts/restart-backend.ps1`
   - Update CLAUDE.md with both options

3. **LONG-TERM** (1-2 months):
   - Create Node.js-based scripts (cross-platform):
     - `scripts/pre-test-checklist.js`
     - Uses `child_process` and `axios` (no OS commands)
   - Or use npm scripts with cross-platform tools like `cross-env`, `concurrently`

**Testing**:
- ✅ Test scripts in Git Bash on Windows
- ✅ Test scripts on macOS/Linux
- ✅ Test in CI/CD environment
- ✅ Test without Git Bash (should show clear error)

**Risk Score**: 7 × 0.8 = **5.6 (HIGH)**

---

### HR-2: Pre-Flight Check False Positives

**Severity**: HIGH
**Probability**: 40% (environment-dependent)
**Impact**: 8/9 (blocks valid test runs)

**Issue**: Pre-flight checks may fail even when environment is actually valid.

**Scenarios Where False Positives Occur**:

1. **Version Mismatch False Positive**:
   ```bash
   # Scenario: Developer makes local changes, backend running older code
   BACKEND_COMMIT=$(curl -s http://localhost:3006/api/health | grep -o '"gitCommit":"[^"]*"')
   CURRENT_COMMIT=$(git rev-parse HEAD)

   # ISSUE: If backend has uncommitted changes, commits won't match
   # But backend IS up-to-date with working directory
   ```
   **False Positive**: Backend running latest code but commit hash differs.

2. **InstantDB Connection Check**:
   ```typescript
   // health.ts line 44 (AFTER fix)
   instantdbStatus = config.INSTANTDB_APP_ID ? 'connected' : 'not_configured';

   // ISSUE: This only checks if APP_ID exists, NOT if connection works
   ```
   **False Negative**: May show "connected" even if InstantDB is down.

3. **Port Check Race Condition**:
   ```bash
   # Script checks port 3006 immediately after backend start
   netstat -ano | grep ":3006"

   # ISSUE: Backend process may exist but not be listening yet (binding in progress)
   ```
   **False Positive**: Port check fails even though backend is starting up.

4. **VITE_TEST_MODE Environment Variable**:
   ```bash
   # Only checks if variable is SET, not if it's "true"
   [ -n "$VITE_TEST_MODE" ]

   # ISSUE: VITE_TEST_MODE=false would PASS this check
   ```
   **False Positive**: Variable set to "false" but check passes.

**Impact**:
- 🔴 Developers waste time debugging "failures" that aren't real
- 🔴 Loss of confidence in pre-flight checks → developers skip them
- 🔴 Real issues get ignored ("boy who cried wolf" effect)

**Mitigation**:

1. **Version Check Enhancement**:
   ```bash
   # Allow small time window for local changes
   BACKEND_START_TIME=$(curl -s http://localhost:3006/api/health | grep -o '"startupTimestamp":[0-9]*')
   NOW=$(date +%s)000  # Convert to milliseconds
   TIME_DIFF=$((NOW - BACKEND_START_TIME))

   # If backend started recently (<5 min), skip version check
   if [ $TIME_DIFF -lt 300000 ]; then
     echo "✅ Backend recently restarted, skipping version check"
   else
     # Do version check
   fi
   ```

2. **InstantDB Health Check**:
   ```typescript
   // health.ts - Actually try to query InstantDB
   let instantdbStatus = 'unknown';
   try {
     if (config.INSTANTDB_APP_ID) {
       // Attempt minimal query (doesn't need to succeed, just connect)
       const testConnection = await db.auth.user.get();
       instantdbStatus = 'connected';
     } else {
       instantdbStatus = 'not_configured';
     }
   } catch (error) {
     instantdbStatus = 'error: ' + error.message;
   }
   ```

3. **Port Check Retry Logic**:
   ```bash
   # Retry port check with backoff
   for i in {1..5}; do
     if netstat -ano | grep -q ":3006"; then
       echo "✅ Port 3006 listening"
       break
     fi
     echo "  Attempt $i/5: Port not ready, waiting..."
     sleep 1
   done
   ```

4. **VITE_TEST_MODE Value Check**:
   ```bash
   # Check VALUE not just existence
   if [ "$VITE_TEST_MODE" = "true" ]; then
     echo "✅ PASS"
   else
     echo "⚠️ WARNING: VITE_TEST_MODE=$VITE_TEST_MODE (expected 'true')"
   fi
   ```

**Risk Score**: 8 × 0.4 = **3.2 (HIGH)**

---

### HR-3: Auth Bypass Fixture Breaking Existing Tests

**Severity**: HIGH
**Probability**: 60% (91 existing test files)
**Impact**: 6/9 (test failures, not production issue)

**Issue**: Introducing `fixtures/authBypass.ts` changes test import patterns.

**Current Pattern** (most existing tests):
```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
  });
});
```

**New Pattern** (error prevention system):
```typescript
import { test, expect } from './fixtures/authBypass';
// Auth bypass automatic - no beforeEach needed
```

**Breaking Change Impact**:
- 🔴 91 existing test files found in `e2e-tests/`
- 🔴 Unknown how many use manual auth bypass
- 🔴 Changing imports breaks git history/blame
- 🔴 Mixed patterns → confusion (which pattern to use?)

**Example Conflict** (from `story-3.1.2-image-editing.spec.ts`):
```typescript
// Line 15: Uses NEW pattern
import { test, expect } from './fixtures';

// BUT also has manual setup function (lines 112-123)
async function setupTestEnvironment(page: any) {
  const consoleErrors: string[] = [];
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return { consoleErrors };
}
// NOTE: Auth bypass is now in fixture, but old pattern remains commented out
```

**Risk Scenarios**:

1. **Test Import Confusion**:
   - Developer imports from `@playwright/test` instead of `./fixtures/authBypass`
   - Auth bypass not active → test hits login screen → timeout failure
   - Developer wastes 30-60 minutes debugging

2. **Duplicate Auth Bypass**:
   - Fixture injects `__VITE_TEST_MODE__`
   - Test also has manual `addInitScript()`
   - May inject twice → console log spam → harder to debug real issues

3. **Backward Compatibility**:
   - Old tests with manual auth bypass still work
   - New tests use fixture
   - Team confused about which pattern to use
   - Code reviews become lengthy ("why didn't you use fixture?")

**Mitigation**:

1. **IMMEDIATE** (before rollout):
   - Add clear section to CLAUDE.md:
     ```markdown
     ## Auth Bypass Pattern (UPDATED 2025-10-23)

     **NEW TESTS**: Use shared fixture (automatic auth bypass)
     ```typescript
     import { test, expect } from './fixtures/authBypass';
     // No beforeEach needed - auth bypass automatic
     ```

     **EXISTING TESTS**: Keep current pattern (don't migrate unless fixing)
     - Reason: Avoid breaking git blame, minimize churn
     - Both patterns work - fixture just reduces boilerplate
     ```

2. **GRADUAL MIGRATION** (2-4 weeks):
   - When touching existing test for other reason → migrate to fixture
   - Don't do mass migration (too much churn)
   - Track progress: "37/91 tests migrated to fixture"

3. **DEPRECATION WARNING** (add to old pattern):
   ```typescript
   // ⚠️ DEPRECATED: Use './fixtures/authBypass' instead
   // This pattern still works but new tests should use fixture
   import { test, expect } from '@playwright/test';
   ```

4. **LINTING RULE** (future):
   - Add ESLint rule: "prefer-auth-bypass-fixture"
   - Warns if importing from `@playwright/test` in new e2e-tests

**Testing**:
- ✅ Run EXISTING tests with NO changes (verify still pass)
- ✅ Run NEW tests with fixture (verify auth bypass works)
- ✅ Run tests with BOTH patterns mixed (verify no conflicts)

**Risk Score**: 6 × 0.6 = **3.6 (HIGH)**

---

### HR-4: Test Data Manager Backend Endpoint Missing

**Severity**: HIGH
**Probability**: 90% (endpoint likely doesn't exist yet)
**Impact**: 5/9 (tests fail but workaround exists)

**Issue**: `testData.ts` expects backend endpoints that may not exist:

```typescript
// testData.ts lines 45, 76
POST /api/test-helpers/create-test-image
POST /api/test-helpers/create-test-chat

// testData.ts line 108
GET /api/test-helpers/verify-test-data

// testData.ts line 129
DELETE /api/test-helpers/cleanup/{type}/{id}
```

**Evidence of Missing Endpoints**:
1. No `teacher-assistant/backend/src/routes/testHelpers.ts` in git status (may be untracked)
2. Tests in `story-3.1.2-image-editing.spec.ts` use FALLBACK approach:
   ```typescript
   // Line 252: Tries API, falls back to mock
   const response = await request.post(`${API_BASE_URL}/api/test/create-image`, {
     failOnStatusCode: false, // Don't fail if endpoint doesn't exist yet
   });

   if (response.ok()) {
     // Use real data
   } else {
     // Fallback: Use mock approach
     console.log(`⚠️ Test endpoint not available, using mock fallback`);
     createMockTestImage(prompt);
   }
   ```

**Impact**:
- 🟡 Tests work with mock fallback BUT
- 🔴 Frontend/backend state mismatch (frontend has mock data, backend doesn't)
- 🔴 Tests may pass on frontend but fail on backend (data doesn't exist)
- 🔴 Cleanup doesn't work → test data pollution

**Expected Behavior**:
```typescript
// Backend should have:
router.post('/test-helpers/create-test-image', async (req, res) => {
  const { userId, name } = req.body;

  // Create image in InstantDB
  const image = await db.images.create({
    user_id: userId,
    title: name,
    // ... other fields
  });

  res.json({ success: true, data: image });
});
```

**Mitigation**:

1. **CHECK IF ENDPOINT EXISTS**:
   ```bash
   # Search for test-helpers route
   grep -r "test-helpers" teacher-assistant/backend/src/routes/
   # OR
   grep -r "testHelpers" teacher-assistant/backend/src/routes/
   ```

2. **IF MISSING - CREATE IT** (15-30 minutes):
   ```typescript
   // File: teacher-assistant/backend/src/routes/testHelpers.ts
   import { Router } from 'express';
   import { db } from '../lib/instantdb'; // Adjust import

   const router = Router();

   // Create test image
   router.post('/test-helpers/create-test-image', async (req, res) => {
     // Implementation here
   });

   // Create test chat
   router.post('/test-helpers/create-test-chat', async (req, res) => {
     // Implementation here
   });

   // Verify test data exists
   router.get('/test-helpers/verify-test-data', async (req, res) => {
     // Implementation here
   });

   // Cleanup test data
   router.delete('/test-helpers/cleanup/:type/:id', async (req, res) => {
     // Implementation here
   });

   export default router;
   ```

3. **REGISTER ROUTE**:
   ```typescript
   // File: teacher-assistant/backend/src/routes/index.ts
   import testHelpersRouter from './testHelpers';

   router.use('/test-helpers', testHelpersRouter);
   ```

4. **DOCUMENT IN CLAUDE.MD**:
   ```markdown
   ### Test Helper API (Backend)

   For E2E tests, use backend API to create test data:

   - POST /api/test-helpers/create-test-image
   - POST /api/test-helpers/create-test-chat
   - GET /api/test-helpers/verify-test-data
   - DELETE /api/test-helpers/cleanup/{type}/{id}

   DO NOT use frontend mocks for E2E tests (frontend/backend state mismatch).
   ```

5. **IF ENDPOINT EXISTS BUT UNDOCUMENTED**:
   - Find where it's registered
   - Verify response format matches `testData.ts` expectations
   - Add documentation to CLAUDE.md

**Testing**:
```bash
# Start backend
cd teacher-assistant/backend && npm start

# Test endpoint
curl -X POST http://localhost:3006/api/test-helpers/create-test-image \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-123","name":"Test Image"}'

# Should return 200 with image data
```

**Risk Score**: 5 × 0.9 = **4.5 (HIGH)**

---

## 🟡 MEDIUM RISKS (Monitor During Rollout)

### MR-1: Backend Restart Script Process Detection Issues

**Severity**: MEDIUM
**Probability**: 50%
**Impact**: 5/9

**Issue**: `restart-backend.sh` uses `ps -p $BACKEND_PID` which may fail on Windows.

```bash
# Line 57: restart-backend.sh
if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
  echo "❌ Backend process died"
  exit 1
fi
```

**Problem**: `ps` command:
- ✅ Works in Git Bash (emulated)
- ❌ May fail in some Windows environments
- ❌ Different syntax on macOS (`ps -p`) vs Linux (`ps aux | grep`)

**Impact**:
- Backend starts successfully but script reports "process died"
- Developer wastes time debugging non-existent issue
- Backend may actually be running fine

**Mitigation**:
```bash
# More robust process check (cross-platform)
if command -v ps &> /dev/null; then
  # Unix-like system
  if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "❌ Backend process died"
    exit 1
  fi
else
  # Windows without ps - use tasklist
  if ! tasklist /FI "PID eq $BACKEND_PID" 2>&1 | grep -q "$BACKEND_PID"; then
    echo "❌ Backend process died"
    exit 1
  fi
fi
```

**Risk Score**: 5 × 0.5 = **2.5 (MEDIUM)**

---

### MR-2: Timeout Utility May Break Legitimate Long Operations

**Severity**: MEDIUM
**Probability**: 30%
**Impact**: 6/9

**Issue**: `timeout.ts` wraps operations with hard timeouts that may be too aggressive.

**Default Timeouts**:
```typescript
// timeout.ts
instantDBQueryWithTimeout() → 5 seconds
aiAPICallWithTimeout() → 30 seconds
```

**Scenarios Where This Breaks**:

1. **Large Image Upload** (InstantDB):
   - 5-second timeout may be too short for 10MB image
   - Upload fails even though network is fine, just slow
   - User sees "timeout error" instead of "still uploading..."

2. **Complex AI Requests** (Gemini/OpenAI):
   - Image editing with multiple objects
   - 30 seconds may not be enough
   - Request times out → API charged anyway → wasted money

3. **Slow Network Conditions**:
   - User on 3G/4G connection
   - 5-second timeout too aggressive
   - All operations fail even though they'd eventually succeed

**Impact**:
- 🔴 False timeouts frustrate users
- 🔴 Wasted API costs (request charged even if timed out)
- 🔴 Bad UX (operation fails when it shouldn't)

**Mitigation**:

1. **Make Timeouts Configurable**:
   ```typescript
   // Instead of hardcoded 5000ms
   export async function instantDBQueryWithTimeout<T>(
     queryFn: () => Promise<T>,
     timeoutMs: number = 5000, // Default but overridable
     fallback?: T
   ): Promise<T>
   ```

2. **Adjust Defaults Based on Operation**:
   ```typescript
   // Image upload: 30 seconds
   await instantDBQueryWithTimeout(uploadImage, 30000);

   // Simple query: 5 seconds
   await instantDBQueryWithTimeout(getUser, 5000);
   ```

3. **Add Warning Before Timeout**:
   ```typescript
   // Warn at 80% of timeout
   const warningTime = timeoutMs * 0.8;
   setTimeout(() => {
     console.warn(`⚠️ Operation taking longer than expected (${warningTime}ms)`);
   }, warningTime);
   ```

4. **Exponential Backoff for Retries**:
   ```typescript
   // Current: Fixed 1-second delay
   retryDelayMs = 1000;

   // Better: Exponential backoff
   retryDelayMs = 1000 * Math.pow(2, attempt - 1);
   // Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 4s
   ```

**Testing**:
- Simulate slow network (Chrome DevTools → Network → Slow 3G)
- Upload large image (10MB)
- Make complex AI request
- Verify timeouts are reasonable

**Risk Score**: 6 × 0.3 = **1.8 (MEDIUM)**

---

### MR-3: Kill Script May Terminate Unrelated Node Processes

**Severity**: MEDIUM
**Probability**: 20%
**Impact**: 8/9

**Issue**: `kill-backend.sh` kills ALL node processes, not just backend.

```bash
# Line 18 (Windows): kill-backend.sh
taskkill //F //IM node.exe

# Line 46 (Linux/macOS)
pkill node
```

**Problem**: If developer has OTHER Node.js processes running:
- Frontend dev server (Vite on port 5173)
- Other projects (React app, Express server, etc.)
- VSCode extensions (TypeScript server, ESLint)

**Impact**:
- 🔴 Frontend dev server killed → page stops working
- 🔴 Other projects killed → lost work
- 🔴 VSCode extensions crash → IDE becomes unresponsive
- 🔴 Developer loses trust in script → stops using it

**Mitigation**:

1. **Port-Specific Killing** (safer):
   ```bash
   # Windows
   for /f "tokens=5" %a in ('netstat -aon ^| findstr :3006') do taskkill /F /PID %a

   # Linux/macOS
   lsof -ti:3006 | xargs kill -9
   ```

2. **PID File Approach**:
   ```bash
   # When starting backend
   echo $BACKEND_PID > .backend.pid

   # When killing
   if [ -f .backend.pid ]; then
     kill $(cat .backend.pid)
     rm .backend.pid
   fi
   ```

3. **Interactive Confirmation**:
   ```bash
   # Before killing all node processes
   echo "⚠️ WARNING: This will kill ALL node.js processes"
   echo "Processes that will be killed:"
   ps aux | grep node | grep -v grep
   read -p "Continue? (y/N) " -n 1 -r
   if [[ $REPLY =~ ^[Yy]$ ]]; then
     pkill node
   fi
   ```

4. **Rename Script** (clearer intent):
   ```bash
   # Rename: kill-backend.sh → kill-all-node-processes.sh
   # User knows it's aggressive
   ```

**Testing**:
- Start frontend + backend
- Run kill script
- Verify only backend killed, frontend still running

**Risk Score**: 8 × 0.2 = **1.6 (MEDIUM)**

---

### MR-4: Health Endpoint Git Commit Parsing May Fail

**Severity**: MEDIUM
**Probability**: 40%
**Impact**: 4/9

**Issue**: `health.ts` uses `execSync('git rev-parse HEAD')` which may fail.

```typescript
// health.ts lines 14-17
try {
  GIT_COMMIT_HASH = execSync('git rev-parse HEAD').toString().trim();
} catch {
  GIT_COMMIT_HASH = process.env.GIT_COMMIT_HASH || 'unknown';
}
```

**Scenarios Where This Fails**:

1. **Deployed Environment** (production):
   - No `.git/` folder (only code deployed, not git history)
   - `git` command not installed on server
   - Falls back to `process.env.GIT_COMMIT_HASH`
   - If env var not set → shows "unknown"

2. **Docker Container**:
   - `.git/` excluded from Docker image (best practice)
   - `git` not in container
   - Shows "unknown" unless env var injected

3. **CI/CD Pipeline**:
   - Shallow clone (only latest commit)
   - Detached HEAD state
   - May return wrong commit hash

**Impact**:
- 🟡 Health check shows "unknown" version
- 🟡 Pre-flight check can't verify version match
- 🟡 Hard to debug issues ("which version is running?")

**Mitigation**:

1. **Build-Time Version Injection**:
   ```typescript
   // Add to package.json build script
   "build": "GIT_COMMIT=$(git rev-parse HEAD) tsc"

   // Access in code
   const GIT_COMMIT_HASH = process.env.GIT_COMMIT || 'unknown';
   ```

2. **Version File Approach**:
   ```bash
   # Generate version file during build
   echo "{\"gitCommit\":\"$(git rev-parse HEAD)\"}" > src/version.json

   # Import in code
   import version from './version.json';
   const GIT_COMMIT_HASH = version.gitCommit;
   ```

3. **Docker Build Arg**:
   ```dockerfile
   ARG GIT_COMMIT=unknown
   ENV GIT_COMMIT_HASH=$GIT_COMMIT

   # Build with:
   docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD) .
   ```

4. **Fallback to Package Version**:
   ```typescript
   const version = process.env.npm_package_version || '1.0.0';
   const GIT_COMMIT_HASH = execSync('git rev-parse HEAD').toString().trim()
                            || process.env.GIT_COMMIT_HASH
                            || `v${version}`;
   ```

**Risk Score**: 4 × 0.4 = **1.6 (MEDIUM)**

---

### MR-5: Auth Bypass Fixture May Throw Errors Too Aggressively

**Severity**: MEDIUM
**Probability**: 30%
**Impact**: 5/9

**Issue**: `authBypass.ts` throws errors if auth bypass verification fails.

```typescript
// authBypass.ts lines 36-42, 48-57
if (!testModeActive) {
  throw new Error('❌ Auth bypass FAILED! TEST_MODE flag not active...');
}

if (isLoginPage) {
  throw new Error('❌ Auth bypass FAILED! Test is on login page...');
}
```

**Problem**: These errors abort test BEFORE test code runs.

**Scenarios Where This Causes Issues**:

1. **Slow Page Load**:
   - `await page.goto('/')` completes
   - But React app still mounting
   - `__VITE_TEST_MODE__` not set YET (React hasn't run)
   - Fixture checks too early → throws error → test fails

2. **Different Auth Flow**:
   - App changes auth check location
   - New flow doesn't immediately check `__VITE_TEST_MODE__`
   - Fixture assumes old flow → error

3. **Login Page Visible for Valid Reason**:
   - Test intentionally checks login flow
   - Login page SHOULD be visible
   - Fixture throws error → test can't run

**Impact**:
- 🔴 Test fails before it can even start
- 🔴 Developer can't test login-related features
- 🔴 Fixture too opinionated → limits test flexibility

**Mitigation**:

1. **Make Verification Optional**:
   ```typescript
   // authBypass.ts
   export const test = base.extend({
     page: async ({ page }, use, testInfo) => {
       await page.addInitScript(() => {
         (window as any).__VITE_TEST_MODE__ = true;
       });

       await page.goto('/');

       // VERIFY but don't throw (just warn)
       const testModeActive = await page.evaluate(() =>
         (window as any).__VITE_TEST_MODE__
       );

       if (!testModeActive) {
         console.warn('⚠️ Auth bypass verification failed. Test may hit login screen.');
         // Don't throw - let test decide
       }

       await use(page);
     }
   });
   ```

2. **Skip Verification for Login Tests**:
   ```typescript
   // Test can opt-out of verification
   test('Login flow', async ({ page }) => {
     // This test EXPECTS to be on login page
     test.skip(true, { annotation: { type: 'skip-auth-bypass-check' }});
   });
   ```

3. **Add Delay Before Verification**:
   ```typescript
   // Wait for React to mount before checking
   await page.goto('/');
   await page.waitForLoadState('networkidle');
   await page.waitForTimeout(1000); // Give React time to set flag

   const testModeActive = await page.evaluate(...);
   ```

4. **Make Error Messages More Helpful**:
   ```typescript
   if (!testModeActive) {
     throw new Error(
       `❌ Auth bypass FAILED!\n` +
       `  Current URL: ${await page.url()}\n` +
       `  TEST_MODE flag: ${testModeActive}\n` +
       `  Possible causes:\n` +
       `    1. React app hasn't mounted yet (increase waitForTimeout)\n` +
       `    2. test-auth.ts not checking __VITE_TEST_MODE__\n` +
       `    3. Auth check runs before addInitScript completes`
     );
   }
   ```

**Risk Score**: 5 × 0.3 = **1.5 (MEDIUM)**

---

### MR-6: Pre-Flight Script Exit Code May Be Ignored

**Severity**: MEDIUM
**Probability**: 50%
**Impact**: 3/9

**Issue**: `pre-test-checklist.sh` exits with code 1 on failure, but caller may ignore.

```bash
# pre-test-checklist.sh line 127
exit 1  # Failure

# BUT if called like this:
bash scripts/pre-test-checklist.sh
npx playwright test  # Runs even if pre-flight failed!
```

**Problem**: Developer habits:
- Runs pre-flight check
- Sees red errors
- Ignores them ("I'll fix it later")
- Runs tests anyway
- Tests fail for preventable reasons

**Impact**:
- 🟡 Pre-flight checks become optional (defeats purpose)
- 🟡 Developers waste time on preventable failures
- 🟡 System complexity without benefit

**Mitigation**:

1. **Make Pre-Flight Check Blocking** (npm script):
   ```json
   // package.json
   {
     "scripts": {
       "test:e2e": "bash scripts/pre-test-checklist.sh && npx playwright test",
       // ^^^ Won't run tests if pre-flight fails
     }
   }
   ```

2. **Playwright Global Setup**:
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     globalSetup: './global-setup.ts',
   });

   // global-setup.ts
   import { execSync } from 'child_process';

   export default async function globalSetup() {
     console.log('🚀 Running pre-flight checks...');

     try {
       execSync('bash scripts/pre-test-checklist.sh', { stdio: 'inherit' });
     } catch (error) {
       console.error('❌ Pre-flight checks failed. Fix issues before running tests.');
       process.exit(1); // BLOCK test run
     }
   }
   ```

3. **Interactive Prompt** (if user ignores failure):
   ```bash
   # At end of pre-test-checklist.sh
   if [ $FAILURES -ne 0 ]; then
     echo ""
     echo "⚠️ Pre-flight checks failed. Continue anyway? (y/N)"
     read -n 1 -r
     echo ""
     if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
     fi
   fi
   ```

4. **CI/CD Integration** (enforce in pipeline):
   ```yaml
   # .github/workflows/test.yml
   - name: Pre-flight checks
     run: bash scripts/pre-test-checklist.sh

   - name: Run E2E tests
     run: npx playwright test
     # This step ONLY runs if pre-flight passed
   ```

**Risk Score**: 3 × 0.5 = **1.5 (MEDIUM)**

---

## 🟢 LOW RISKS (Monitor, No Immediate Action)

### LR-1: Pre-Flight Check Verbose Output

**Severity**: LOW
**Probability**: 80%
**Impact**: 2/9

**Issue**: Pre-flight script outputs a lot of text, may hide important messages.

**Mitigation**: Add `--quiet` flag option.

**Risk Score**: 2 × 0.8 = **1.6 (LOW)**

---

### LR-2: Test Data Manager No Automatic Cleanup on Crash

**Severity**: LOW
**Probability**: 30%
**Impact**: 3/9

**Issue**: If test crashes before `afterEach`, test data not cleaned up.

**Mitigation**:
- Add `test.afterAll` with aggressive cleanup
- Or daily cleanup job (delete data older than 24h)

**Risk Score**: 3 × 0.3 = **0.9 (LOW)**

---

### LR-3: Timeout Utility Console Log Spam

**Severity**: LOW
**Probability**: 60%
**Impact**: 2/9

**Issue**: `timeout.ts` logs every retry attempt, may spam console.

**Mitigation**: Add log level configuration (only show errors in production).

**Risk Score**: 2 × 0.6 = **1.2 (LOW)**

---

### LR-4: Health Endpoint Response Size Growth

**Severity**: LOW
**Probability**: 20%
**Impact**: 2/9

**Issue**: Adding fields to health endpoint increases response size.

**Current Size**: ~200 bytes
**Future Risk**: If we add more fields → 1KB+

**Mitigation**: Keep health endpoint minimal, create separate `/api/debug/info` for detailed data.

**Risk Score**: 2 × 0.2 = **0.4 (LOW)**

---

### LR-5: Script Naming Confusion

**Severity**: LOW
**Probability**: 50%
**Impact**: 2/9

**Issue**: `restart-backend.sh` vs `kill-backend.sh` - which one to use?

**Mitigation**: Add comments in scripts and CLAUDE.md with decision tree.

**Risk Score**: 2 × 0.5 = **1.0 (LOW)**

---

## Risk Matrix Summary

| Risk ID | Category | Severity | Probability | Score | Status |
|---------|----------|----------|-------------|-------|--------|
| **CR-1** | Backend Build | CRITICAL | 100% | 9.0 | 🔴 BLOCKER |
| **HR-1** | Windows Compatibility | HIGH | 80% | 5.6 | 🔴 FIX BEFORE ROLLOUT |
| **HR-2** | False Positives | HIGH | 40% | 3.2 | 🔴 FIX BEFORE ROLLOUT |
| **HR-3** | Test Import Breaking | HIGH | 60% | 3.6 | 🔴 FIX BEFORE ROLLOUT |
| **HR-4** | Missing Backend Endpoint | HIGH | 90% | 4.5 | 🔴 FIX BEFORE ROLLOUT |
| MR-1 | Process Detection | MEDIUM | 50% | 2.5 | 🟡 MONITOR |
| MR-2 | Timeout Too Aggressive | MEDIUM | 30% | 1.8 | 🟡 MONITOR |
| MR-3 | Kill Unrelated Processes | MEDIUM | 20% | 1.6 | 🟡 MONITOR |
| MR-4 | Git Commit Parsing | MEDIUM | 40% | 1.6 | 🟡 MONITOR |
| MR-5 | Fixture Too Strict | MEDIUM | 30% | 1.5 | 🟡 MONITOR |
| MR-6 | Exit Code Ignored | MEDIUM | 50% | 1.5 | 🟡 MONITOR |
| LR-1 | Verbose Output | LOW | 80% | 1.6 | 🟢 ACCEPTABLE |
| LR-2 | Cleanup on Crash | LOW | 30% | 0.9 | 🟢 ACCEPTABLE |
| LR-3 | Console Log Spam | LOW | 60% | 1.2 | 🟢 ACCEPTABLE |
| LR-4 | Response Size Growth | LOW | 20% | 0.4 | 🟢 ACCEPTABLE |
| LR-5 | Script Naming | LOW | 50% | 1.0 | 🟢 ACCEPTABLE |

**Total Risks**: 16 (1 Critical, 4 High, 6 Medium, 5 Low)

---

## Rollout Plan

### Phase 0: CRITICAL FIX (IMMEDIATE - 5 minutes)

**BLOCKER**: Fix TypeScript error before ANY rollout.

```bash
# 1. Fix health.ts
cd teacher-assistant/backend/src/routes
# Edit health.ts line 44: INSTANT_APP_ID → INSTANTDB_APP_ID

# 2. Verify fix
cd ../..
npm run build  # Should succeed with 0 errors

# 3. Test health endpoint
npm start
curl http://localhost:3006/api/health
# Should return valid JSON with gitCommit, startupTimestamp, instantdb
```

**CRITERIA**: Backend builds successfully + health endpoint returns valid JSON.

---

### Phase 1: HIGH RISKS MITIGATION (1-2 days)

**Before rolling out to team:**

1. **Windows Compatibility** (HR-1):
   - Add prominent note to CLAUDE.md about Git Bash requirement
   - Test scripts on Windows machine
   - Document PowerShell alternatives

2. **False Positives** (HR-2):
   - Enhance version check with time-based logic
   - Add InstantDB connection test (not just config check)
   - Add port check retry logic
   - Test with different scenarios

3. **Test Import Pattern** (HR-3):
   - Add clear section to CLAUDE.md about NEW vs OLD pattern
   - Document coexistence strategy
   - Add deprecation warning to old pattern

4. **Backend Test Helpers** (HR-4):
   - Verify test-helpers endpoint exists (or create it)
   - Test with curl
   - Update CLAUDE.md with endpoint documentation

**CRITERIA**: All HIGH risks mitigated OR documented workarounds in place.

---

### Phase 2: STAGED ROLLOUT (1 week)

**Day 1**: Self-testing
- Developer who implemented system tests on their machine
- Verify all scripts work
- Run full E2E test suite
- Document any issues

**Day 2-3**: Beta testing (1-2 developers)
- Share with 1-2 team members
- Ask them to run scripts
- Collect feedback on pain points
- Fix any blockers

**Day 4-5**: Team rollout
- Share with full team
- Update CLAUDE.md with final documentation
- Create quick-start guide
- Hold brief demo/Q&A session

**Day 6-7**: Monitor and iterate
- Watch for issues in team channel
- Quick fixes for pain points
- Collect metrics (how many failures prevented?)

**CRITERIA**: >= 80% team adoption, < 5% false positive rate, positive feedback.

---

### Phase 3: MONITORING (Ongoing)

**Metrics to Track**:
- Pre-flight check success rate
- E2E test failure rate (before vs after)
- Time spent debugging process failures (before vs after)
- False positive rate
- Team satisfaction (survey after 2 weeks)

**Success Metrics**:
- 🎯 Process failure rate: < 5% (down from 80%)
- 🎯 Time debugging process issues: < 2 hours/week (down from 38-64 hours)
- 🎯 Pre-flight check adoption: > 90% of test runs
- 🎯 False positive rate: < 10%
- 🎯 Team satisfaction: > 4/5

**Failure Criteria** (rollback triggers):
- False positive rate > 30%
- Team refuses to use system
- More time spent on scripts than saved
- Critical production issue caused by system

---

## Rollback Plan

**IF rollout fails, revert changes:**

### Step 1: Immediate Revert (5 minutes)
```bash
# Keep ONLY the critical fix (CR-1)
git checkout HEAD -- scripts/
git checkout HEAD -- teacher-assistant/frontend/e2e-tests/fixtures/
git checkout HEAD -- teacher-assistant/backend/src/utils/timeout.ts

# Keep health.ts fix, revert everything else
# Revert CLAUDE.md error prevention section
```

### Step 2: Communication (10 minutes)
- Notify team: "Error prevention system rolled back due to [reason]"
- Document lessons learned
- Plan fixes for next attempt

### Step 3: Preserve Learnings
- Keep risk assessment document
- Keep test results
- Use for future iteration

---

## Recommendations

### IMMEDIATE ACTION (Before any rollout):

1. ✅ **FIX CR-1**: TypeScript error in health.ts (5 minutes)
2. ✅ **TEST**: Verify backend builds and starts (2 minutes)
3. ✅ **DOCUMENT**: Add Windows compatibility note to CLAUDE.md (10 minutes)

### BEFORE TEAM ROLLOUT (1-2 days):

4. ✅ **MITIGATE HR-1**: Test scripts on Windows, document requirements
5. ✅ **MITIGATE HR-2**: Improve pre-flight checks (reduce false positives)
6. ✅ **MITIGATE HR-3**: Document test import pattern coexistence
7. ✅ **MITIGATE HR-4**: Verify/create test-helpers backend endpoint

### DURING ROLLOUT (1 week):

8. 🟡 **MONITOR**: Track false positive rate
9. 🟡 **ITERATE**: Quick fixes for pain points
10. 🟡 **SUPPORT**: Help team adopt new patterns

### AFTER ROLLOUT (Ongoing):

11. 🟢 **MEASURE**: Track success metrics
12. 🟢 **IMPROVE**: Address medium/low risks as time permits
13. 🟢 **DOCUMENT**: Update CLAUDE.md with real-world learnings

---

## Specific Action Items (Prioritized)

### Priority 1: CRITICAL BLOCKERS (Do NOW)

| # | Action | Owner | Time | Status |
|---|--------|-------|------|--------|
| 1 | Fix `health.ts` line 44: `INSTANT_APP_ID` → `INSTANTDB_APP_ID` | Dev | 5 min | 🔴 BLOCKING |
| 2 | Run `npm run build` in backend, verify 0 errors | Dev | 2 min | 🔴 BLOCKING |
| 3 | Test health endpoint with curl | Dev | 2 min | 🔴 BLOCKING |

**CANNOT PROCEED UNTIL THESE ARE DONE**

---

### Priority 2: HIGH RISKS (Do Before Team Rollout)

| # | Action | Owner | Time | Status |
|---|--------|-------|------|--------|
| 4 | Add Windows Git Bash requirement to CLAUDE.md | Dev | 10 min | 🔴 URGENT |
| 5 | Test pre-test-checklist.sh on Windows in Git Bash | Dev | 15 min | 🔴 URGENT |
| 6 | Check if test-helpers endpoint exists in backend | Dev | 5 min | 🔴 URGENT |
| 7 | Create test-helpers endpoint if missing | Dev | 30 min | 🔴 URGENT |
| 8 | Test test-helpers endpoint with curl | Dev | 10 min | 🔴 URGENT |
| 9 | Add test import pattern section to CLAUDE.md | Dev | 15 min | 🔴 URGENT |
| 10 | Add time-based logic to version check | Dev | 20 min | 🟡 RECOMMENDED |
| 11 | Add InstantDB connection test to health endpoint | Dev | 15 min | 🟡 RECOMMENDED |
| 12 | Add retry logic to port check in pre-flight | Dev | 10 min | 🟡 RECOMMENDED |

**RECOMMENDED BEFORE SHARING WITH TEAM**

---

### Priority 3: MEDIUM RISKS (Monitor During Rollout)

| # | Action | Owner | Time | Status |
|---|--------|-------|------|--------|
| 13 | Improve process detection in restart script | Dev | 20 min | 🟡 OPTIONAL |
| 14 | Make timeout values configurable | Dev | 15 min | 🟡 OPTIONAL |
| 15 | Add port-specific killing to kill script | Dev | 20 min | 🟡 OPTIONAL |
| 16 | Add build-time version injection | Dev | 30 min | 🟡 OPTIONAL |
| 17 | Make auth bypass verification less strict | Dev | 15 min | 🟡 OPTIONAL |
| 18 | Integrate pre-flight check into npm script | Dev | 5 min | 🟡 OPTIONAL |

**DO IF TIME PERMITS, OR IF ISSUES ARISE**

---

### Priority 4: LOW RISKS (Future Improvements)

| # | Action | Owner | Time | Status |
|---|--------|-------|------|--------|
| 19 | Add `--quiet` flag to pre-flight script | Dev | 10 min | 🟢 NICE TO HAVE |
| 20 | Add daily cleanup job for test data | Dev | 30 min | 🟢 NICE TO HAVE |
| 21 | Add log level configuration to timeout.ts | Dev | 15 min | 🟢 NICE TO HAVE |
| 22 | Create separate /api/debug/info endpoint | Dev | 20 min | 🟢 NICE TO HAVE |
| 23 | Add decision tree to CLAUDE.md for script usage | Dev | 10 min | 🟢 NICE TO HAVE |

**DO WHEN SYSTEM IS STABLE AND TEAM IS COMFORTABLE**

---

## Conclusion

**OVERALL ASSESSMENT**: System has HIGH VALUE but needs CRITICAL FIX + mitigation of HIGH risks before rollout.

**TIME TO SAFE ROLLOUT**:
- **Minimum** (fix blocker only): 10 minutes
- **Recommended** (fix blocker + high risks): 2-4 hours
- **Ideal** (full mitigation): 1-2 days

**RECOMMENDATION**:
1. ✅ Fix CR-1 immediately (5 min)
2. ✅ Mitigate HR-1, HR-3, HR-4 (1-2 hours)
3. ✅ Self-test for 1 day
4. ✅ Beta test with 1-2 developers
5. ✅ Team rollout with monitoring

**CONFIDENCE**: 85% success rate IF critical + high risks are addressed before team rollout.

**ROI**:
- **Investment**: 2-4 hours upfront + 1 week monitoring
- **Return**: 30-60 hours/month saved (based on historical data)
- **Payback period**: < 1 week

**PROCEED**: ✅ YES, but FIX BLOCKER FIRST, then address HIGH risks.

---

**Next Steps**: Share this assessment with team → Fix CR-1 → Prioritize HR-1 through HR-4 → Begin Phase 1 rollout.

---

**Assessment Complete**: 2025-10-23
