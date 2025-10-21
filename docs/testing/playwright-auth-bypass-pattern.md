# Playwright Auth Bypass Pattern - Analysis & Fix Guide

**Created**: 2025-10-21
**Updated**: 2025-10-21
**Status**: ✅ **IMPLEMENTED - Option 2 (Global Setup)**
**Issue**: Tests fail because they don't use the proper auth bypass pattern
**Impact**: Tests hit authentication screens instead of testing actual features
**Solution**: Custom fixtures automatically inject auth bypass for ALL tests

---

## 🔍 Root Cause Analysis

### The Problem

Many Playwright tests fail because they **don't inject the test mode flag** that bypasses InstantDB authentication. Without this flag:

1. ❌ Tests land on login/onboarding screens
2. ❌ Tests can't reach the actual features being tested
3. ❌ Tests timeout waiting for elements that never appear
4. ❌ False test failures occur

### How Auth Bypass Works

The application checks for test mode in two ways (see `teacher-assistant/frontend/src/lib/test-auth.ts:71-76`):

```typescript
function isTestMode(): boolean {
  // Method 1: Environment variable (build time)
  if (import.meta.env.VITE_TEST_MODE === 'true') {
    return true;
  }

  // Method 2: Runtime injection (Playwright)
  if (typeof window !== 'undefined' && (window as any).__VITE_TEST_MODE__ === true) {
    return true;
  }

  return false;
}
```

**Method 1** (Environment variable): Set during build via `playwright.config.ts`
**Method 2** (Runtime injection): Set per-test via `page.addInitScript()`

---

## ✅ The Correct Pattern (MANDATORY for All Tests)

### Pattern: Inject `__VITE_TEST_MODE__` in beforeEach

```typescript
test.beforeEach(async ({ page }) => {
  // CRITICAL: Inject TEST_MODE flag for auth bypass (runtime injection)
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
    console.log('🔧 TEST_MODE injected via Playwright addInitScript');
  });

  // Optional: Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ CONSOLE ERROR:', msg.text());
    }
  });
});
```

**Why `addInitScript`?**
- Runs BEFORE page loads
- Ensures `window.__VITE_TEST_MODE__` is set when auth logic checks it
- Works even if env variable isn't set

---

## 📋 Audit Results: Which Tests Are Missing Bypass?

### ✅ Tests WITH Proper Bypass (Working)

1. ✅ `router-agent-comprehensive.spec.ts` (line 62-66)
2. ✅ `image-generation-complete-workflow.spec.ts`
3. ✅ `bug-verification-2025-10-06.spec.ts`
4. ✅ `test-auth-verification.spec.ts`

**Total**: ~22 files have bypass configured

### ❌ Tests WITHOUT Bypass (Failing)

**High Priority** (Critical tests that should work):

1. ❌ `chat-agent-integration.spec.ts` - NO bypass
2. ❌ `home-prompt-tiles.spec.ts` - NO bypass, only checks for auth (lines 31-37)
3. ❌ `library-unification.spec.ts` - NO bypass
4. ❌ `auth-and-chat-flow.spec.ts` - NO bypass (ironically, auth test!)
5. ❌ `debug-home.spec.ts` - NO bypass

**Medium Priority** (Debug/analysis tests):
6. ❌ `gemini-design-verification.spec.ts`
7. ❌ `simple-connection-test.spec.ts`
8. ❌ `quick-gemini-check.spec.ts`
9. ❌ `console-errors-only.spec.ts`
10. ❌ `gemini-design-comparison.spec.ts`

... and ~60 more test files (total ~100+ tests, ~78 missing bypass)

**Severity**: HIGH - ~78% of tests lack proper auth bypass

---

## 🔧 How to Fix

### Quick Fix for Individual Tests

Add this to `test.beforeEach`:

```typescript
test.beforeEach(async ({ page }) => {
  // CRITICAL: Auth bypass for tests
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
  });
});
```

### Systematic Fix: Create Global Setup

**Option A**: Update `playwright.config.ts` to inject globally

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173',

    // Add global test mode injection
    async beforeEach({ page }) {
      await page.addInitScript(() => {
        (window as any).__VITE_TEST_MODE__ = true;
      });
    },
  },
});
```

**Option B**: Create a test helper utility

```typescript
// e2e-tests/test-helpers.ts
export async function setupTestMode(page: any) {
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
    console.log('🔧 TEST_MODE injected');
  });
}

// Usage in tests:
import { setupTestMode } from './test-helpers';

test.beforeEach(async ({ page }) => {
  await setupTestMode(page);
});
```

**Option C**: Create a custom test fixture

```typescript
// e2e-tests/fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Inject test mode before every test
    await page.addInitScript(() => {
      (window as any).__VITE_TEST_MODE__ = true;
    });
    await use(page);
  },
});

// Usage:
import { test } from './fixtures';
// test.beforeEach automatically has bypass
```

**Recommended**: Option C (custom fixture) - Most robust, DRY, least chance of forgetting

---

## ✅ **IMPLEMENTATION STATUS: COMPLETE**

**Option 2 (Global Setup with Custom Fixtures) has been implemented!**

### What Was Implemented:

1. ✅ **Custom Fixture**: `e2e-tests/fixtures.ts`
   - Automatically injects auth bypass for all tests
   - Includes global console error tracking
   - Easy to extend

2. ✅ **Global Setup**: `e2e-tests/global-setup.ts`
   - Initializes test environment
   - Logs setup information

3. ✅ **Updated Config**: `playwright.config.ts`
   - Enabled global setup
   - Added documentation

4. ✅ **Example Test**: `e2e-tests/example-with-global-bypass.spec.ts`
   - Demonstrates new pattern
   - Includes verification tests

### How to Use:

```typescript
// NEW PATTERN - Just change your import!
import { test, expect } from './fixtures'; // ✅ That's it!

test('my test', async ({ page }) => {
  // Auth bypass is automatic now!
  await page.goto('/');
  // Test continues...
});
```

**See**: `docs/testing/playwright-global-bypass-implementation.md` for full implementation details and migration guide.

---

## 📝 Update CLAUDE.md Documentation

### Add to "🎯 Playwright E2E Testing Requirements" Section

Add this subsection:

````markdown
### 🔑 CRITICAL: Auth Bypass for Tests (MANDATORY)

**ALL Playwright tests MUST inject the test mode flag to bypass authentication.**

#### Why This is Required

- InstantDB requires authentication by default
- Tests need to bypass auth to test features, not authentication itself
- Without bypass, tests land on login screens and fail

#### How to Implement (MANDATORY Pattern)

```typescript
test.beforeEach(async ({ page }) => {
  // CRITICAL: Inject TEST_MODE flag for auth bypass (runtime injection)
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
    console.log('🔧 TEST_MODE injected via Playwright addInitScript');
  });
});
```

#### Verification Checklist

- [ ] Every test file has `page.addInitScript` in `beforeEach`
- [ ] Test logs show "🔧 TEST_MODE injected" message
- [ ] Tests land on expected pages, not login screens
- [ ] Console shows "Authentication is bypassed with test user" message

#### ❌ Common Mistakes

**WRONG** - Checking for auth instead of bypassing:
```typescript
test.beforeEach(async ({ page }) => {
  const isAuthRequired = await page.locator('text=Anmelden').isVisible();
  if (isAuthRequired) {
    console.log('Authentication may be required'); // ❌ This doesn't fix it!
  }
});
```

**RIGHT** - Injecting bypass flag:
```typescript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true; // ✅ This fixes it!
  });
});
```
````

---

## 🚨 Agent Instructions: When Writing Tests

### For bmad-dev Agent

When creating new Playwright E2E tests, **ALWAYS** include this pattern:

```typescript
test.beforeEach(async ({ page }) => {
  // CRITICAL: Auth bypass - DO NOT SKIP THIS
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
  });

  // Optional but recommended: Console error tracking
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ CONSOLE ERROR:', msg.text());
    }
  });
});
```

**Never skip this step!** Without it, tests will fail unpredictably.

---

## 🎯 Action Plan: Fix All Tests

### Phase 1: Fix Critical Tests (Priority 1)

1. [ ] `chat-agent-integration.spec.ts`
2. [ ] `home-prompt-tiles.spec.ts`
3. [ ] `library-unification.spec.ts`
4. [ ] `auth-and-chat-flow.spec.ts`
5. [ ] `debug-home.spec.ts`

**Time estimate**: 15-20 minutes (bulk find/replace)

### Phase 2: Create Global Test Helper (Best Practice)

1. [ ] Create `e2e-tests/fixtures.ts` with custom test fixture
2. [ ] Update all tests to use custom fixture
3. [ ] Update CLAUDE.md with new pattern

**Time estimate**: 30 minutes

### Phase 3: Update Remaining Tests

1. [ ] Run bulk search/replace to add bypass to all remaining tests
2. [ ] Verify all tests pass with bypass
3. [ ] Document pattern in test template

**Time estimate**: 20 minutes

**Total effort**: ~70 minutes to fix all tests permanently

---

## 📊 Impact Analysis

### Before Fix
- ❌ ~78 tests failing due to missing auth bypass
- ❌ Tests timeout waiting for elements
- ❌ False negatives in CI/CD
- ❌ Developers waste time debugging "broken" tests

### After Fix
- ✅ All tests can reach actual features
- ✅ Tests complete successfully
- ✅ CI/CD reliability improves
- ✅ True test failures are caught (not auth issues)

---

## 🔗 Related Files

### Key Files to Review

1. **Auth Bypass Logic**: `teacher-assistant/frontend/src/lib/test-auth.ts`
2. **Auth Context**: `teacher-assistant/frontend/src/lib/auth-context.tsx:35`
3. **Playwright Config**: `teacher-assistant/frontend/playwright.config.ts:38-40`
4. **Working Example**: `e2e-tests/router-agent-comprehensive.spec.ts:62-66`

### Documentation to Update

1. `CLAUDE.md` - Add auth bypass requirement to Playwright section
2. Test template (if exists) - Include bypass pattern
3. BMad dev agent instructions - Add to test writing workflow

---

## ✅ Quick Verification Script

Run this to check if a test has proper bypass:

```bash
# Check if test has auth bypass
grep -n "addInitScript" teacher-assistant/frontend/e2e-tests/YOUR_TEST.spec.ts

# Expected output:
# 25:  await page.addInitScript(() => {

# If no output, bypass is MISSING!
```

---

## 📌 Summary

**Problem**: 78% of tests missing auth bypass pattern
**Solution**: Add `page.addInitScript` with `__VITE_TEST_MODE__ = true` to all tests
**Best Practice**: Create custom test fixture to enforce this automatically
**Documentation**: Update CLAUDE.md to make this mandatory for all future tests

**Next Step**: Choose a fix strategy (Option A/B/C above) and implement systematically.

---

**Created by**: Analysis of test failures and auth bypass mechanism
**Reviewed by**: [Pending]
**Status**: Ready for implementation
