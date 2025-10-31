import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import db from './instantdb';
import {
  isTestMode,
  createTestAuthState,
  testAuthMethods,
  warnIfTestMode,
  TEST_USER,
} from './test-auth';

// Auth context interface
interface AuthContextType {
  user: any; // User object from InstantDB
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  sendMagicCode: (email: string) => Promise<void>;
  signInWithMagicCode: (params: { email: string; code: string }) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // FIX: Make test mode detection REACTIVE, not static
  // Check flag on every render to ensure Playwright's addInitScript() has run
  const [useTestAuth, setUseTestAuth] = useState(() => isTestMode());

  // Re-check test mode flag reactively (handles late Playwright injection)
  useEffect(() => {
    const checkTestMode = () => {
      const currentTestMode = isTestMode();
      if (currentTestMode !== useTestAuth) {
        console.log(`🔧 [AuthContext] Test mode changed: ${useTestAuth} → ${currentTestMode}`);
        setUseTestAuth(currentTestMode);
      }
    };

    // Check immediately
    checkTestMode();

    // Poll for flag changes (handles race condition where Playwright sets flag after React loads)
    const interval = setInterval(checkTestMode, 100);

    // Stop polling after 2 seconds (by then Playwright will have injected the flag)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.log('🔧 [AuthContext] Test mode polling stopped');
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [useTestAuth]);

  // Warn if test mode is active
  useEffect(() => {
    if (useTestAuth) {
      warnIfTestMode();
    }
  }, [useTestAuth]);

  // Use test auth if in test mode, otherwise use real InstantDB auth
  // IMPORTANT: Only call db.useAuth() if NOT in test mode (to avoid InstantDB errors)
  const realAuth = useTestAuth ? null : db.useAuth();
  const testAuthState = createTestAuthState();

  // Select auth based on test mode flag
  const { isLoading, user, error } = useTestAuth
    ? testAuthState
    : (realAuth || { isLoading: true, user: null, error: null });

  const signOut = async () => {
    // Use test auth methods in test mode
    if (useTestAuth) {
      return testAuthMethods.signOut();
    }

    try {
      await db.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  const sendMagicCode = async (email: string) => {
    // Use test auth methods in test mode
    if (useTestAuth) {
      return testAuthMethods.sendMagicCode(email);
    }

    try {
      console.log('DEBUG: Sending magic code to email:', email);
      const result = await db.auth.sendMagicCode({ email });
      console.log('DEBUG: Magic code sent successfully', result);
    } catch (err) {
      console.error('Error sending magic code:', err);
      throw err;
    }
  };

  const signInWithMagicCode = async (params: { email: string; code: string }) => {
    // Use test auth methods in test mode
    if (useTestAuth) {
      return testAuthMethods.signInWithMagicCode(params);
    }

    try {
      console.log('DEBUG: Attempting to sign in with magic code', params);
      const result = await db.auth.signInWithMagicCode(params);
      console.log('DEBUG: Sign in successful', result);
    } catch (err) {
      console.error('Error signing in with magic code:', err);
      throw err;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    error: error ? (error instanceof Error ? error : new Error(error.message || 'An error occurred')) : null,
    signOut,
    sendMagicCode,
    signInWithMagicCode,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the context for advanced usage
export { AuthContext };