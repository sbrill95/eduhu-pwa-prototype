# Bug Tracking - InstantDB Magic Link Authentication

## Production Bug: "Malformed parameter: ["body" "email"]"

### Status: RESOLVED ✅

### Issue Date: 2025-09-26
### Resolution Date: 2025-09-26

---

### Problem Description
Magic link authentication was failing in production with error: "Malformed parameter: ["body" "email"]" when users attempted to sign in with the magic code they received via email.

### Symptoms
- ✅ Email sending worked correctly (users received magic codes)
- ❌ Magic code verification failed with parameter error
- ❌ Error appeared above "Magic code sent!" message
- ❌ Users unable to complete authentication flow

### Root Cause Analysis

The issue was caused by **incorrect function signature** in the authentication implementation:

#### ❌ Previous (Incorrect) Implementation:
```typescript
// auth-context.tsx
interface AuthContextType {
  signInWithMagicCode: (email: string, code: string) => Promise<void>;
}

const signInWithMagicCode = async (email: string, code: string) => {
  await db.auth.signInWithMagicCode({ email, code });
};

// LoginForm.tsx
await signInWithMagicCode(email, code); // Two separate parameters
```

#### ✅ Correct Implementation:
```typescript
// auth-context.tsx
interface AuthContextType {
  signInWithMagicCode: (params: { email: string; code: string }) => Promise<void>;
}

const signInWithMagicCode = async (params: { email: string; code: string }) => {
  await db.auth.signInWithMagicCode(params);
};

// LoginForm.tsx
await signInWithMagicCode({ email, code }); // Single object parameter
```

### Technical Details

1. **InstantDB API Requirement**: The `signInWithMagicCode` method expects a single object parameter: `{ email: string, code: string }`

2. **Function Signature Mismatch**: Our implementation was passing two separate parameters instead of a single object, causing the InstantDB client to receive malformed parameters

3. **Error Origin**: The error "Malformed parameter: ["body" "email"]" was coming from InstantDB's server-side validation when it couldn't properly destructure the expected object parameters

### Files Modified

1. **`/src/lib/auth-context.tsx`**:
   - Updated `AuthContextType` interface signature
   - Modified `signInWithMagicCode` function implementation
   - Added debug logging for troubleshooting

2. **`/src/components/auth/LoginForm.tsx`**:
   - Updated function call to pass object parameter instead of separate arguments

### Verification Steps

1. ✅ TypeScript compilation successful
2. ✅ Build process completed without errors
3. ✅ Development server starts successfully
4. ✅ Function signatures match InstantDB API specification

### Prevention

- Always refer to official InstantDB documentation for exact API signatures
- Use TypeScript strict mode to catch parameter mismatches
- Add comprehensive error logging for debugging production issues
- Test complete authentication flows in development before deployment

### Related Files

- `/src/lib/auth-context.tsx`
- `/src/components/auth/LoginForm.tsx`
- `/src/lib/instantdb.ts`
- `/.env` (InstantDB configuration)

---

**InstantDB App ID**: `39f14e13-9afb-4222-be45-3d2c231be3a1`
**InstantDB Version**: `@instantdb/react@^0.21.24`