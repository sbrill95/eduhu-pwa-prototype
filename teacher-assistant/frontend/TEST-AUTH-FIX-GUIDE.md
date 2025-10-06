# Test Authentication Fix Guide
## URGENT: Unblock Bug Verification Testing

---

## Problem Summary

Playwright tests are showing login screen instead of auto-authenticating with test user.

**Root Cause**: `VITE_TEST_MODE` environment variable not being injected into browser context.

---

## Quick Fix (RECOMMENDED)

### Option A: Use Vite Mode Flag

**Step 1**: Update playwright config

```typescript
// playwright.config.ts
webServer: {
  command: 'npm run dev -- --mode test',  // This loads .env.test
  url: 'http://localhost:5174',
  reuseExistingServer: true,
  timeout: 120000,
}
```

**Step 2**: Verify .env.test exists and has correct content

```bash
# .env.test
VITE_TEST_MODE=true
VITE_INSTANTDB_APP_ID="39f14e13-9afb-4222-be45-3d2c231be3a1"
VITE_API_URL=http://localhost:3006
```

**Step 3**: Test it
```bash
cd C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend
npx playwright test e2e-tests/test-auth-verification.spec.ts --headed
```

**Expected**: Login screen should NOT appear, home screen should load automatically.

---

## Alternative: Manual localStorage Injection

### Option B: Browser Script Injection

**Update test file**: `e2e-tests/bug-verification-all-9.spec.ts`

```typescript
test.beforeEach(async ({ page, context }) => {
  // Inject test mode BEFORE navigation
  await context.addInitScript(() => {
    // Override environment check
    window.localStorage.setItem('test-mode-active', 'true');

    // Mock import.meta.env for test mode
    Object.defineProperty(window, '__VITE_TEST_MODE__', {
      value: 'true',
      writable: false
    });
  });

  // Navigate to app
  await page.goto('http://localhost:5174');
  await page.waitForLoadState('networkidle');
});
```

**Also update**: `src/lib/test-auth.ts`

```typescript
export function isTestMode(): boolean {
  // Check multiple sources
  return (
    import.meta.env.VITE_TEST_MODE === 'true' ||
    window.__VITE_TEST_MODE__ === 'true' ||
    localStorage.getItem('test-mode-active') === 'true'
  );
}
```

---

## Verification Steps

### Test 1: Auth Verification
```bash
npx playwright test e2e-tests/test-auth-verification.spec.ts
```

**Expected Output**:
```
✅ 6 passed
- should automatically authenticate user without login screen
- should display test mode console warnings
- should have access to protected routes without authentication
- should verify test user is authenticated
- should check that VITE_TEST_MODE environment variable is set
- should verify test mode is NOT enabled in production builds
```

### Test 2: Simple Screenshot Test
```bash
npx playwright test e2e-tests/simple-screenshot.spec.ts --headed
```

**Expected**: Should see home screen with prompt tiles, NOT login screen

### Test 3: Full Bug Verification
```bash
npx playwright test e2e-tests/bug-verification-all-9.spec.ts --headed
```

**Expected**: All 10 tests should execute and capture screenshots

---

## Troubleshooting

### Issue: Still seeing login screen

**Check 1**: Verify env var is loaded
```bash
# In test, add console log
console.log('VITE_TEST_MODE:', import.meta.env.VITE_TEST_MODE);
```

**Check 2**: Verify .env.test is in correct location
```bash
ls -la C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend\.env.test
```

**Check 3**: Check browser console in Playwright
```typescript
page.on('console', msg => {
  console.log(`[BROWSER] ${msg.text()}`);
});
```

Should see:
```
[BROWSER] 🚨 TEST MODE ACTIVE 🚨
[BROWSER] Authentication is bypassed with test user: s.brill@eduhu.de
```

### Issue: Vite not loading .env.test

**Fix**: Explicitly pass mode flag
```bash
# Instead of
npm run dev

# Use
npm run dev -- --mode test
```

### Issue: Tests timing out

**Cause**: Dev server not starting
**Fix**: Start dev server manually first
```bash
cd C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend
npm run dev -- --mode test
```

Then in another terminal:
```bash
npx playwright test --headed
```

---

## Implementation Checklist

- [ ] Choose fix option (A or B)
- [ ] Implement changes
- [ ] Verify .env.test exists and is correct
- [ ] Run test-auth-verification.spec.ts → Should PASS
- [ ] Check browser console for test mode warnings
- [ ] Take screenshot of home screen (not login screen)
- [ ] Run full bug verification suite
- [ ] Generate updated QA report

---

## Expected Timeline

- **Fix Implementation**: 10 minutes
- **Verification**: 5 minutes
- **Full Test Execution**: 15 minutes
- **Total**: 30 minutes

---

## Success Criteria

✅ Test auth verification tests all pass
✅ Browser console shows "TEST MODE ACTIVE" warnings
✅ Home screen loads without login
✅ All 9 bug tests execute successfully
✅ Screenshots captured for all bugs

---

## Contact

If issues persist, check:
1. Vite documentation on environment modes
2. Playwright documentation on browser context
3. InstantDB authentication hooks

**Next Steps**: Once test auth is working, generate final QA report with complete bug verification results.
