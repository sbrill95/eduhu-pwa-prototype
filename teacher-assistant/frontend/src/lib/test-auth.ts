/**
 * Test Authentication Module
 *
 * SECURITY WARNING: This module should ONLY be used in test mode (VITE_TEST_MODE=true)
 * NEVER enable this in production environments
 *
 * Purpose: Enable Playwright tests to run without manual magic link authentication
 * by providing a mock authenticated user state.
 */

/**
 * Test user mock data for Playwright testing
 * Email: s.brill@eduhu.de (test user)
 * IMPORTANT: This ID must match the user ID in E2E tests AND backend test mode
 */
export const TEST_USER = {
  id: '38eb3d27-dd97-4ed4-9e80-08fafe18115f',
  email: 's.brill@eduhu.de',
  refresh_token: 'test-refresh-token-playwright',
  created_at: Date.now(),
  // Add any additional InstantDB user properties here
};

/**
 * Test auth state object that mimics InstantDB's useAuth return value
 */
export interface TestAuthState {
  user: typeof TEST_USER | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Creates a mock auth state for testing
 * This mimics the InstantDB auth hook return value
 */
export function createTestAuthState(): TestAuthState {
  return {
    user: TEST_USER,
    isLoading: false,
    error: null,
  };
}

/**
 * Test auth methods that mimic InstantDB auth API
 */
export const testAuthMethods = {
  signOut: async (): Promise<void> => {
    console.log('[TEST AUTH] Sign out called (mocked)');
    return Promise.resolve();
  },

  sendMagicCode: async (email: string): Promise<void> => {
    console.log(`[TEST AUTH] Send magic code to ${email} (mocked)`);
    return Promise.resolve();
  },

  signInWithMagicCode: async (params: { email: string; code: string }): Promise<void> => {
    console.log(`[TEST AUTH] Sign in with magic code for ${params.email} (mocked)`);
    return Promise.resolve();
  },
};

/**
 * Check if test mode is enabled
 * @returns true if VITE_TEST_MODE environment variable is set to "true" OR window.__VITE_TEST_MODE__ is true
 */
export function isTestMode(): boolean {
  // Check Vite env (build-time)
  if (import.meta.env.VITE_TEST_MODE === 'true') {
    return true;
  }

  // Check window global (runtime - Playwright injection)
  if (typeof window !== 'undefined' && (window as any).__VITE_TEST_MODE__ === true) {
    return true;
  }

  return false;
}

/**
 * Initialize test auth in localStorage (optional - for persistence)
 * This can be used if InstantDB checks localStorage for auth tokens
 */
export function initializeTestAuthStorage(): void {
  if (!isTestMode()) {
    console.warn('[TEST AUTH] Attempted to initialize test auth storage outside of test mode');
    return;
  }

  console.log('[TEST AUTH] Initializing test auth storage');

  // Store test auth data in localStorage
  // This mimics what InstantDB might store
  const testAuthData = {
    user: TEST_USER,
    token: 'test-token-playwright',
    timestamp: Date.now(),
  };

  localStorage.setItem('instantdb-test-auth', JSON.stringify(testAuthData));
}

/**
 * Clear test auth storage
 */
export function clearTestAuthStorage(): void {
  localStorage.removeItem('instantdb-test-auth');
  console.log('[TEST AUTH] Cleared test auth storage');
}

/**
 * Warning banner for test mode
 * Call this on app initialization to warn developers if test mode is active
 */
export function warnIfTestMode(): void {
  if (isTestMode()) {
    console.warn(
      '%c🚨 TEST MODE ACTIVE 🚨',
      'background: #ff0000; color: #ffffff; font-size: 20px; font-weight: bold; padding: 10px;'
    );
    console.warn(
      '%cAuthentication is bypassed with test user: s.brill@eduhu.de',
      'background: #ff9800; color: #000000; font-size: 14px; padding: 5px;'
    );
    console.warn(
      '%cThis should NEVER be enabled in production!',
      'background: #ff0000; color: #ffffff; font-size: 14px; font-weight: bold; padding: 5px;'
    );
  }
}
