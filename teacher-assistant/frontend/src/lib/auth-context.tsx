import { createContext, useContext, type ReactNode } from 'react';
import db from './instantdb';

// Auth context interface
interface AuthContextType {
  user: any; // User object from InstantDB
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  sendMagicCode: (email: string) => Promise<void>;
  signInWithMagicCode: (email: string, code: string) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Use InstantDB's auth hooks
  const { isLoading, user, error } = db.useAuth();

  const signOut = async () => {
    try {
      await db.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  const sendMagicCode = async (email: string) => {
    try {
      await db.auth.sendMagicCode({ email });
    } catch (err) {
      console.error('Error sending magic code:', err);
      throw err;
    }
  };

  const signInWithMagicCode = async (email: string, code: string) => {
    try {
      await db.auth.signInWithMagicCode({
        email,
        code
      });
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