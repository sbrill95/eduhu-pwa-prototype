import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginForm } from './components/auth/LoginForm'

// Mock the useAuth hook for testing
vi.mock('./lib/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isLoading: false,
    error: null,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('App Authentication Flow', () => {
  it('renders login form when user is not authenticated', () => {
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Magic Code' })).toBeInTheDocument()
  })

  it('displays magic code authentication instructions', () => {
    render(<LoginForm />)
    expect(screen.getByText("We'll send you a magic code via email. No passwords required!")).toBeInTheDocument()
  })

  it('renders email input with proper form attributes', () => {
    render(<LoginForm />)
    const emailInput = screen.getByLabelText('Email Address')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('placeholder', 'Enter your email')
    expect(emailInput).toHaveAttribute('id', 'email')
  })

  it('has proper Tailwind CSS classes for styling', () => {
    render(<LoginForm />)
    const submitButton = screen.getByRole('button', { name: 'Send Magic Code' })
    expect(submitButton).toHaveClass(
      'w-full',
      'bg-blue-500',
      'hover:bg-blue-600',
      'text-white',
      'font-medium',
      'py-2',
      'px-4',
      'rounded-md'
    )
  })

  it('maintains proper form accessibility', () => {
    render(<LoginForm />)
    const emailLabel = screen.getByText('Email Address')
    const emailInput = screen.getByLabelText('Email Address')
    const form = screen.getByRole('button', { name: 'Send Magic Code' }).closest('form')

    expect(emailLabel).toHaveAttribute('for', 'email')
    expect(emailInput).toHaveAttribute('id', 'email')
    expect(form).toBeInTheDocument()
  })

  it('uses responsive design classes', () => {
    render(<LoginForm />)
    const container = screen.getByText('Sign In').closest('div')
    expect(container).toHaveClass('bg-white', 'shadow-lg', 'rounded-lg', 'p-6')
  })
})