import { type ReactNode } from 'react';
import { useAuth } from '../lib/auth-context';
import { AuthLoading, LoginForm } from './auth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  fallback,
  loadingComponent
}: ProtectedRouteProps) {
  const { user, isLoading, error } = useAuth();

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <>
        {loadingComponent || <AuthLoading message="Checking authentication..." />}
      </>
    );
  }

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'An error occurred during authentication'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the protected content
  if (user) {
    return <>{children}</>;
  }

  // If user is not authenticated, show login form or fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {fallback || <LoginForm />}
    </div>
  );
}