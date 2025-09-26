
interface AuthLoadingProps {
  className?: string;
  message?: string;
}

export function AuthLoading({
  className = '',
  message = 'Loading...'
}: AuthLoadingProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-100 ${className}`}>
      <div className="text-center">
        {/* Loading spinner */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {message}
        </h2>

        <p className="text-gray-600">
          Please wait while we authenticate you...
        </p>
      </div>
    </div>
  );
}