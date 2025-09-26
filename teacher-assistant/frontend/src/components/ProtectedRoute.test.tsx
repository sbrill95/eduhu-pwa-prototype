import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'

// Mock the auth context
const mockUseAuth = vi.fn()

vi.mock('../lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('ProtectedRoute', () => {
  const MockChildComponent = () => <div data-testid="protected-content">Protected Content</div>
  const MockFallback = () => <div data-testid="custom-fallback">Custom Fallback</div>
  const MockLoadingComponent = () => <div data-testid="custom-loading">Custom Loading</div>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('shows custom loading component when provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    })

    render(
      <ProtectedRoute loadingComponent={<MockLoadingComponent />}>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
    expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('shows error state when authentication has error', () => {
    const mockError = { message: 'Authentication failed' }
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: mockError,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Authentication Error')).toBeInTheDocument()
    expect(screen.getByText('Authentication failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('shows error state with generic message when error has no message', () => {
    const mockError = {} // Error without message
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: mockError,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('An error occurred during authentication')).toBeInTheDocument()
  })

  it('allows retry when authentication error occurs', () => {
    const mockError = { message: 'Network error' }
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: mockError,
    })

    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    fireEvent.click(retryButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it('shows protected content when user is authenticated', () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
  })

  it('shows login form when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('shows custom fallback when user is not authenticated and fallback is provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    })

    render(
      <ProtectedRoute fallback={<MockFallback />}>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('has correct styling classes applied to error state', () => {
    const mockError = { message: 'Test error' }
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: mockError,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    const errorContainer = screen.getByText('Authentication Error').closest('div')
    expect(errorContainer).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'p-6', 'text-center')

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    expect(retryButton).toHaveClass(
      'px-4',
      'py-2',
      'bg-blue-500',
      'hover:bg-blue-600',
      'text-white',
      'rounded-md',
      'transition-colors'
    )
  })

  it('has correct styling classes applied to unauthenticated state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    // The outer container of the ProtectedRoute when showing login
    const outerContainer = screen.getByText('Sign In').closest('div')?.parentElement?.parentElement
    expect(outerContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-100')
  })

  it('renders error state with proper accessibility', () => {
    const mockError = { message: 'Authentication failed' }
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: mockError,
    })

    render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    // Check for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Authentication Error')

    // Check for proper button role
    const retryButton = screen.getByRole('button', { name: 'Retry' })
    expect(retryButton).toBeInTheDocument()
  })

  it('handles multiple authentication state changes', () => {
    // Start with loading
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    })

    const { rerender } = render(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument()

    // Change to error
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: { message: 'Failed' },
    })

    rerender(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Authentication Error')).toBeInTheDocument()
    expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument()

    // Change to authenticated
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isLoading: false,
      error: null,
    })

    rerender(
      <ProtectedRoute>
        <MockChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument()
  })
})