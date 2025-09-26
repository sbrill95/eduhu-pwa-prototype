import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from './auth-context'
import { ReactNode } from 'react'

// Mock InstantDB with factory function to avoid hoisting issues
vi.mock('./instantdb', () => ({
  default: {
    useAuth: vi.fn(),
    auth: {
      signInWithMagicCode: vi.fn(),
      sendMagicCode: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

// Test component to consume auth context
const TestComponent = () => {
  const { user, isLoading, error, sendMagicCode, signInWithMagicCode, signOut } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error ? error.message : 'null'}</div>
      <button onClick={() => sendMagicCode('test@example.com')}>Send Magic Code</button>
      <button onClick={() => signInWithMagicCode({ email: '', code: '123456' })}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

// Get the mocked database
import mockDb from './instantdb'

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    vi.mocked(mockDb.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    })
  })

  it('provides authentication state when user is not logged in', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
  })

  it('provides authentication state when user is logged in', () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    vi.mocked(mockDb.useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
  })

  it('provides loading state during authentication', () => {
    vi.mocked(mockDb.useAuth).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
  })

  it('provides error state when authentication fails', () => {
    const mockError = new Error('Authentication failed')
    vi.mocked(mockDb.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      error: mockError,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed')
  })

  it('calls sendMagicCode with correct parameters', async () => {
    vi.mocked(mockDb.auth).sendMagicCode.mockResolvedValue({ success: true })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Send Magic Code'))

    await waitFor(() => {
      expect(vi.mocked(mockDb.auth).sendMagicCode).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
    })
  })

  it('calls signInWithMagicCode with correct parameters', async () => {
    vi.mocked(mockDb.auth).signInWithMagicCode.mockResolvedValue({ user: { id: '123' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Sign In'))

    await waitFor(() => {
      expect(vi.mocked(mockDb.auth).signInWithMagicCode).toHaveBeenCalledWith({
        email: '',
        code: '123456',
      })
    })
  })

  it('handles sendMagicCode errors gracefully', async () => {
    const mockError = new Error('Failed to send magic code')
    vi.mocked(mockDb.auth).sendMagicCode.mockRejectedValue(mockError)

    // Spy on console.error to verify error handling
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Send Magic Code'))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending magic code:', mockError)
    })

    // Wait a bit more to ensure promise is fully handled
    await new Promise(resolve => setTimeout(resolve, 100))

    consoleErrorSpy.mockRestore()
  })

  it('handles signInWithMagicCode errors gracefully', async () => {
    const mockError = new Error('Invalid magic code')
    vi.mocked(mockDb.auth).signInWithMagicCode.mockRejectedValue(mockError)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Sign In'))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing in with magic code:', mockError)
    })

    // Wait a bit more to ensure promise is fully handled
    await new Promise(resolve => setTimeout(resolve, 100))

    consoleErrorSpy.mockRestore()
  })

  it('calls signOut when sign out is triggered', async () => {
    vi.mocked(mockDb.auth).signOut.mockResolvedValue({ success: true })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Sign Out'))

    await waitFor(() => {
      expect(vi.mocked(mockDb.auth).signOut).toHaveBeenCalled()
    })
  })

  it('handles sign out errors gracefully', async () => {
    const mockError = new Error('Sign out failed')
    vi.mocked(mockDb.auth).signOut.mockRejectedValue(mockError)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Sign Out'))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing out:', mockError)
    })

    // Wait a bit more to ensure promise is fully handled
    await new Promise(resolve => setTimeout(resolve, 100))

    consoleErrorSpy.mockRestore()
  })
})