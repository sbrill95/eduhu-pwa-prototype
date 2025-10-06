# Test Authentication Bypass - User Guide

## Overview

The test authentication system allows Playwright tests to run without requiring manual magic link authentication. This is achieved by bypassing InstantDB authentication when `VITE_TEST_MODE=true` is set.

**⚠️ CRITICAL SECURITY WARNING:** Test mode should **NEVER** be enabled in production environments. It bypasses all authentication security.

---

## Architecture

### Components

1. **Test Auth Module** (`src/lib/test-auth.ts`)
   - Defines test user mock data
   - Provides test auth state creator
   - Exports test auth methods (signOut, sendMagicCode, etc.)
   - Contains test mode detection logic

2. **Auth Context** (`src/lib/auth-context.tsx`)
   - Modified to check `VITE_TEST_MODE` flag
   - Conditionally uses test auth or real InstantDB auth
   - Displays console warnings when test mode is active

3. **Environment Configuration**
   - `.env.development` - Test mode disabled (production-like)
   - `.env.test` - Test mode enabled (for Playwright)
   - `playwright.config.ts` - Test mode environment variables

---

## Test User

**Email:** `s.brill@eduhu.de`
**User ID:** `test-user-playwright-id-12345`
**Type:** Mock user (no real backend authentication)

---

## Usage for QA/Testing

### Running Playwright Tests

Playwright tests are **automatically configured** to use test mode. Simply run:

```bash
# Navigate to frontend directory
cd teacher-assistant/frontend

# Run all Playwright tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e-tests/your-test.spec.ts
```

The `playwright.config.ts` automatically sets:
- `VITE_TEST_MODE=true`
- `VITE_INSTANTDB_APP_ID=39f14e13-9afb-4222-be45-3d2c231be3a1`

### Manual Testing with Test Mode

If you need to manually test with test auth bypass:

1. **Temporary Environment Variable** (Session only)
   ```bash
   # Windows (PowerShell)
   $env:VITE_TEST_MODE="true"
   npm run dev

   # Windows (CMD)
   set VITE_TEST_MODE=true
   npm run dev

   # Linux/Mac
   VITE_TEST_MODE=true npm run dev
   ```

2. **Create `.env.local`** (Not recommended - easy to forget)
   ```bash
   # Create .env.local
   echo "VITE_TEST_MODE=true" > .env.local

   # Start dev server
   npm run dev

   # IMPORTANT: Delete .env.local when done!
   rm .env.local
   ```

3. **Check Console for Warnings**

   When test mode is active, you'll see:
   ```
   🚨 TEST MODE ACTIVE 🚨
   Authentication is bypassed with test user: s.brill@eduhu.de
   This should NEVER be enabled in production!
   ```

---

## Verification Checklist

### ✅ Test Mode is Working If:

1. **Console shows warning banners** (red background)
2. **App loads without login screen**
3. **User is automatically authenticated as `s.brill@eduhu.de`**
4. **No magic link emails are sent**
5. **Auth methods are mocked** (check console logs)

### ❌ Test Mode is NOT Working If:

1. **Login screen appears**
2. **No console warnings about test mode**
3. **Authentication errors occur**
4. **App requires magic link**

### Troubleshooting

**Problem:** Login screen still appears
**Solution:**
- Check `VITE_TEST_MODE` is set to `"true"` (string, not boolean)
- Restart dev server after changing environment variables
- Clear browser cache and localStorage
- Check browser console for errors

**Problem:** Console shows no warnings
**Solution:**
- Verify environment variable is actually set: `console.log(import.meta.env.VITE_TEST_MODE)`
- Ensure you restarted the dev server after setting the variable

**Problem:** Tests fail with auth errors
**Solution:**
- Check `playwright.config.ts` has `VITE_TEST_MODE: 'true'` in webServer.env
- Ensure dev server is started by Playwright (not reusing existing server with wrong config)
- Set `reuseExistingServer: false` temporarily in playwright.config.ts

---

## File Reference

### Created/Modified Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/test-auth.ts` | Test auth module with mock user | ✅ Created |
| `src/lib/auth-context.tsx` | Modified to support test mode | ✅ Modified |
| `.env.test` | Test environment configuration | ✅ Created |
| `.env.development` | Updated with `VITE_TEST_MODE=false` | ✅ Modified |
| `playwright.config.ts` | Updated to enable test mode | ✅ Modified |
| `verify-test-auth.html` | Verification helper page | ✅ Created |
| `TEST-AUTH-GUIDE.md` | This documentation | ✅ Created |

---

## Code Examples

### Writing Playwright Tests with Test Auth

```typescript
import { test, expect } from '@playwright/test';

test('user is automatically authenticated in test mode', async ({ page }) => {
  // Navigate to app - no login required!
  await page.goto('/');

  // Verify user is logged in
  // (Adjust selectors based on your app's UI)
  await expect(page).not.toContainText('Login');

  // App should be fully loaded
  await expect(page).toContainText('Home');
});

test('can access protected routes', async ({ page }) => {
  await page.goto('/');

  // Navigate to a protected route
  await page.click('text=Profile');

  // Should not redirect to login
  await expect(page).toHaveURL(/.*profile/);
});
```

### Checking Test Mode in Browser Console

```javascript
// Open browser console and run:
console.log('Test Mode:', import.meta.env.VITE_TEST_MODE);
console.log('User:', window.localStorage.getItem('instantdb-test-auth'));
```

---

## Security Best Practices

### ✅ DO:

- Use test mode **ONLY** for local testing and CI/CD pipelines
- Set `VITE_TEST_MODE=false` in `.env.development`
- Never commit `.env.local` with test mode enabled
- Verify production builds have test mode disabled
- Review environment variables before deployment

### ❌ DON'T:

- Enable test mode in production
- Commit `.env.local` to git
- Share test mode credentials
- Assume test mode is secure
- Use test user data for real operations

---

## Environment Variable Reference

| Variable | Development | Test | Production |
|----------|-------------|------|------------|
| `VITE_TEST_MODE` | `false` | `true` | `false` |
| `VITE_INSTANTDB_APP_ID` | Real ID | Real ID | Real ID |
| `VITE_NODE_ENV` | `development` | `test` | `production` |

---

## FAQ

**Q: Can I use a different test user?**
A: Yes, modify `TEST_USER` in `src/lib/test-auth.ts`

**Q: Does test mode work with InstantDB queries?**
A: Yes, the test user ID is valid for database queries. However, data isolation is your responsibility.

**Q: What happens to InstantDB auth hooks in test mode?**
A: They are completely bypassed. The `db.useAuth()` call still happens but its result is ignored.

**Q: Can I test the login flow itself?**
A: No, not with test mode enabled. You'll need to disable test mode (`VITE_TEST_MODE=false`) to test actual authentication.

**Q: How do I test sign-out functionality?**
A: The test auth methods are mocked but log to console. Check console output to verify the method was called.

---

## Next Steps

1. ✅ Run Playwright tests to verify bypass works
2. ✅ Check console for test mode warnings
3. ✅ Verify app loads without login
4. ✅ Test protected routes are accessible
5. ✅ Ensure production build has test mode disabled

---

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Verify environment variables are set correctly
3. Check browser console for errors/warnings
4. Review `src/lib/auth-context.tsx` for test mode logic
5. Ensure dev server was restarted after env changes

---

**Last Updated:** 2025-10-05
**Version:** 1.0.0
**Maintainer:** Development Team
