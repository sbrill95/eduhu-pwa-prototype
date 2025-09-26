import { useAuth } from '../../lib/auth-context';

interface UserProfileProps {
  className?: string;
  showSignOut?: boolean;
}

export function UserProfile({ className = '', showSignOut = true }: UserProfileProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.email || 'Unknown User'}
            </p>
            <p className="text-sm text-gray-500">
              {user.id ? `ID: ${user.id.slice(0, 8)}...` : 'Authenticated'}
            </p>
          </div>
        </div>

        {showSignOut && (
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
          >
            Sign Out
          </button>
        )}
      </div>

      {user.createdAt && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Member since: {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}