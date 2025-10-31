# Auth Bypass Fix - Environment Variable Approach

## Problem

Playwright tests were failing because the auth bypass mechanism had a timing issue:
- `window.__VITE_TEST_MODE__` was set by Playwright's `addInitScript()`
- But `isTestMode()` was called during module load (before the script ran)
- Result: app showed blank page, tests couldn't proceed

## Solution

Implemented environment variable-based auth bypass using Vite's `.env.test` file:

### 1. Created `.env.test` File

```
VITE_TEST_MODE=true
```

- Located at: `teacher-assistant/frontend/.env.test`
- Automatically loaded when dev server starts with `--mode test`

### 2. Updated `vite.config.ts`

```typescript
export default defineConfig(({ mode }) => {
  console.log(`🔧 Vite starting in mode: "${mode}"`);

  return {
    // ... existing config
    define: {
      '__VITE_TEST_MODE__': JSON.stringify(mode === 'test'),
      '__VITE_MODE__': JSON.stringify(mode)
    },
  };
});
```

### 3. Updated `test-auth.ts`

```typescript
export function isTestMode(): boolean {
  // Priority 1: Check Vite env (most reliable - from .env.test file)
  if (import.meta.env.VITE_TEST_MODE === 'true') {
    return true;
  }

  // Priority 2: Check window global (runtime - Playwright injection fallback)
  if (typeof window !== 'undefined' && (window as any).__VITE_TEST_MODE__ === true) {
    return true;
  }

  return false;
}
```

### 4. Fixed `auth-context.tsx` - THE CRITICAL FIX

**The key issue**: `db.useAuth()` was being called even in test mode, causing InstantDB errors that crashed the app.

**Solution**: Conditionally call `db.useAuth()` ONLY when NOT in test mode:

```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const useTestAuth = isTestMode();

  // IMPORTANT: Only call db.useAuth() if NOT in test mode (to avoid InstantDB errors)
  const realAuth = useTestAuth ? null : db.useAuth();
  const testAuthState = createTestAuthState();

  // Select auth based on test mode flag
  const { isLoading, user, error } = useTestAuth
    ? testAuthState
    : (realAuth || { isLoading: true, user: null, error: null });

  // ... rest of code
}
```

### 5. TypeScript Declarations

Created `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

// Global constants injected by Vite config
declare const __VITE_TEST_MODE__: boolean;
declare const __VITE_MODE__: string;

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_TEST_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## How It Works

1. **Playwright starts dev server**: `npm run dev -- --mode test`
2. **Vite loads `.env.test`**: Sets `VITE_TEST_MODE=true`
3. **`isTestMode()` checks env var**: Returns `true` immediately (no timing issues)
4. **`AuthProvider` skips real auth**: Doesn't call `db.useAuth()`, uses test auth instead
5. **App loads successfully**: Protected content renders, tests can proceed

## Verification

### Test Mode Active

When server starts in test mode:
```
🔧 Vite starting in mode: "test"
```

Console shows:
```
🚨 TEST MODE ACTIVE 🚨
Authentication is bypassed with test user: s.brill@eduhu.de
```

### Auth State

Protected content loads with:
```
{
  user: TEST_USER,
  isLoading: false,
  error: null
}
```

## Files Modified

1. `.env.test` (created) - Environment variable
2. `vite.config.ts` - Load env vars & inject globals
3. `src/vite-env.d.ts` (created) - TypeScript declarations
4. `src/lib/test-auth.ts` - Check env var first
5. `src/lib/auth-context.tsx` - Conditional `db.useAuth()` call

## Benefits

✅ No timing issues (env var loaded before module execution)
✅ Works in both dev and test modes
✅ No InstantDB errors in test mode
✅ Clean, maintainable solution
✅ TypeScript type safety

## Testing

```bash
# Start dev server in test mode
npm run dev -- --mode test

# Run Playwright tests (auto-starts server in test mode)
npx playwright test

# Verify auth bypass
# Should see: "TEST MODE ACTIVE" in console
# Should see: App loads without login screen
```

## Date

2025-10-22

## Author

BMad Developer Agent
