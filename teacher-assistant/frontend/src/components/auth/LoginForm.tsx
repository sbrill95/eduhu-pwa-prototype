import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className = '' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { sendMagicCode, signInWithMagicCode } = useAuth();

  const handleSendMagicCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await sendMagicCode(email);
      setSuccess('Magic code sent! Check your email.');
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter the code from your email');
      return;
    }

    setIsLoading(true);

    try {
      await signInWithMagicCode({ email, code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setCode('');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {step === 'email' ? 'Sign In' : 'Enter Code'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendMagicCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {isLoading ? 'Sending...' : 'Send Magic Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Magic Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter the code from your email"
                required
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600 mt-1">
                Code sent to: <span className="font-medium">{email}</span>
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={isLoading}
                className="w-full bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Use Different Email
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            We'll send you a magic code via email. No passwords required!
          </p>
        </div>
      </div>
    </div>
  );
}