import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'
import { AuthProvider } from '../../lib/auth-context'

// Mock the auth context
const mockUseAuth = vi.fn()
const mockSendMagicCode = vi.fn()
const mockSignInWithMagicCode = vi.fn()

vi.mock('../../lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth(),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendMagicCode.mockClear()
    mockSignInWithMagicCode.mockClear()

    // Default mock implementation
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      sendMagicCode: mockSendMagicCode,
      signInWithMagicCode: mockSignInWithMagicCode,
      signOut: vi.fn(),
    })
  })

  it('renders email input form initially', () => {
    render(<LoginForm />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Magic Code' })).toBeInTheDocument()
    expect(screen.getByText("We'll send you a magic code via email. No passwords required!")).toBeInTheDocument()
  })

  it('validates email input and prevents submission with invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email Address')
    const submitButton = screen.getByRole('button', { name: 'Send Magic Code' })

    // Try to submit with invalid email
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    // Should not call sendMagicCode with invalid email
    expect(mockSendMagicCode).not.toHaveBeenCalled()
  })

  it('sends magic code with valid email', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockResolvedValue({ success: true })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email Address')
    const submitButton = screen.getByRole('button', { name: 'Send Magic Code' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSendMagicCode).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('shows code input step after successfully sending magic code', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockResolvedValue({ success: true })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email Address')
    const submitButton = screen.getByRole('button', { name: 'Send Magic Code' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Enter Code')).toBeInTheDocument()
      expect(screen.getByLabelText('Magic Code')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByText('Use Different Email')).toBeInTheDocument()
    })
  })

  it('allows user to go back to email step', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockResolvedValue({ success: true })

    render(<LoginForm />)

    // Go to code step
    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Magic Code' }))

    await waitFor(() => {
      expect(screen.getByText('Enter Code')).toBeInTheDocument()
    })

    // Go back to email step
    await user.click(screen.getByText('Use Different Email'))

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('signs in with valid magic code', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockResolvedValue({ success: true })
    mockSignInWithMagicCode.mockResolvedValue({ user: { id: '123' } })

    render(<LoginForm />)

    // Go to code step
    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Magic Code' }))

    await waitFor(() => {
      expect(screen.getByText('Enter Code')).toBeInTheDocument()
    })

    // Enter code and sign in
    const codeInput = screen.getByLabelText('Magic Code')
    const signInButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(codeInput, '123456')
    await user.click(signInButton)

    await waitFor(() => {
      expect(mockSignInWithMagicCode).toHaveBeenCalledWith('123456')
    })
  })

  it('displays loading state during magic code sending', async () => {
    const user = userEvent.setup()
    let resolveSendMagicCode: (value: any) => void
    mockSendMagicCode.mockReturnValue(new Promise(resolve => { resolveSendMagicCode = resolve }))

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email Address')
    const submitButton = screen.getByRole('button', { name: 'Send Magic Code' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    // Button should be disabled and show loading state
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveClass('disabled:bg-blue-300')

    // Resolve the promise
    resolveSendMagicCode!({ success: true })

    await waitFor(() => {
      expect(screen.getByText('Enter Code')).toBeInTheDocument()
    })
  })

  it('displays loading state during sign in', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockResolvedValue({ success: true })

    let resolveSignIn: (value: any) => void
    mockSignInWithMagicCode.mockReturnValue(new Promise(resolve => { resolveSignIn = resolve }))

    render(<LoginForm />)

    // Go to code step
    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Magic Code' }))

    await waitFor(() => {
      expect(screen.getByText('Enter Code')).toBeInTheDocument()
    })

    // Enter code and sign in
    const codeInput = screen.getByLabelText('Magic Code')
    const signInButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(codeInput, '123456')
    await user.click(signInButton)

    // Button should be disabled during loading
    expect(signInButton).toBeDisabled()

    // Resolve the sign in
    resolveSignIn!({ user: { id: '123' } })
  })

  it('handles errors when sending magic code fails', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockRejectedValue(new Error('Network error'))

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('Email Address')
    const submitButton = screen.getByRole('button', { name: 'Send Magic Code' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    // Should still be on email step
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('handles errors when sign in fails', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockResolvedValue({ success: true })
    mockSignInWithMagicCode.mockRejectedValue(new Error('Invalid code'))

    render(<LoginForm />)

    // Go to code step
    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Magic Code' }))

    await waitFor(() => {
      expect(screen.getByText('Enter Code')).toBeInTheDocument()
    })

    // Try to sign in with code
    const codeInput = screen.getByLabelText('Magic Code')
    const signInButton = screen.getByRole('button', { name: 'Sign In' })

    await user.type(codeInput, 'invalid')
    await user.click(signInButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid code')).toBeInTheDocument()
    })

    // Should still be on code step
    expect(screen.getByText('Enter Code')).toBeInTheDocument()
  })

  it('shows proper form structure in code step', async () => {
    const user = userEvent.setup()
    mockSendMagicCode.mockResolvedValue({ success: true })

    render(<LoginForm />)

    // Go to code step
    const emailInput = screen.getByLabelText('Email Address')
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Magic Code' }))

    await waitFor(() => {
      expect(screen.getByText('Enter Code')).toBeInTheDocument()
    })

    // Check that all elements are present in code step
    expect(screen.getByLabelText('Magic Code')).toBeInTheDocument()
    expect(screen.getByText('Code sent to:')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use Different Email' })).toBeInTheDocument()
    expect(screen.getByText('Magic code sent! Check your email.')).toBeInTheDocument()
  })
})