import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock all the child components
vi.mock('./pages/Home/Home', () => ({
  default: ({ onChatSelect, onTabChange }: any) => (
    <div data-testid="home-page">
      <button onClick={() => onChatSelect('test-session')}>Select Chat</button>
      <button onClick={() => onTabChange('chat')}>Go to Chat</button>
    </div>
  )
}))

vi.mock('./pages/Library/Library', () => ({
  default: ({ onChatSelect, onTabChange }: any) => (
    <div data-testid="library-page">
      <button onClick={() => onChatSelect('lib-session')}>Select Library Chat</button>
      <button onClick={() => onTabChange('home')}>Go to Home</button>
    </div>
  )
}))


// Mock the auth components
vi.mock('./components', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
  ChatView: ({ sessionId, onNewChat, onSessionChange }: any) => (
    <div data-testid="chat-view">
      <div>Session ID: {sessionId || 'new'}</div>
      <button onClick={onNewChat}>New Chat</button>
      <button onClick={() => onSessionChange('updated-session')}>Update Session</button>
    </div>
  ),
  ProfileView: () => (
    <div data-testid="profile-view">
      <h1>Profile View Content</h1>
      <div>User profile information</div>
    </div>
  ),
}))

vi.mock('./lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: vi.fn(() => ({
    user: { id: '123', email: 'test@example.com' },
    isLoading: false,
    error: null,
  }))
}))

// Mock Ionic React components for testing
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react')
  return {
    ...actual,
    IonModal: ({ isOpen, onDidDismiss, children }: any) => (
      isOpen ? (
        <div data-testid="profile-modal" role="dialog">
          <button data-testid="close-modal" onClick={() => onDidDismiss()}>Close</button>
          {children}
        </div>
      ) : null
    ),
    setupIonicReact: vi.fn(),
  }
})

describe('App Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Header and Layout', () => {
    it('renders header with app title and profile icon', () => {
      render(<App />)

      expect(screen.getByText('eduhu.app')).toBeInTheDocument()
      expect(screen.getByAltText('eduhu.app logo')).toBeInTheDocument()
      expect(screen.getByLabelText('Open Profile')).toBeInTheDocument()
    })

    it('has proper layout structure', () => {
      render(<App />)

      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByText('eduhu.app')).toBeInTheDocument()
      expect(screen.getByAltText('eduhu.app logo')).toBeInTheDocument()
    })

    it('renders profile icon with correct styling', () => {
      render(<App />)

      const profileButton = screen.getByLabelText('Open Profile')
      expect(profileButton).toBeInTheDocument()

      const profileIcon = profileButton.querySelector('ion-icon')
      expect(profileIcon).toHaveStyle({ fontSize: '24px', color: '#FB6542' })
    })
  })

  describe('Bottom Tab Navigation', () => {
    it('renders all bottom navigation tabs except profile', () => {
      render(<App />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Library')).toBeInTheDocument()

      // Profile tab should NOT be in bottom navigation
      expect(screen.queryByText('Profil')).not.toBeInTheDocument()
    })

    it('shows home tab as selected by default', () => {
      render(<App />)

      const homeTab = screen.getByText('Home').closest('ion-tab-button')
      expect(homeTab).toHaveAttribute('selected')
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('switches to chat tab when clicked', async () => {
      const user = userEvent.setup()
      render(<App />)

      const chatTab = screen.getByText('Chat').closest('ion-tab-button')!
      await user.click(chatTab)

      expect(chatTab).toHaveAttribute('selected')
      expect(screen.getByTestId('chat-view')).toBeInTheDocument()
      expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    })

    it('switches to library tab when clicked', async () => {
      const user = userEvent.setup()
      render(<App />)

      const libraryTab = screen.getByText('Library').closest('ion-tab-button')!
      await user.click(libraryTab)

      expect(libraryTab).toHaveAttribute('selected')
      expect(screen.getByTestId('library-page')).toBeInTheDocument()
      expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    })

    it('maintains proper tab selection state', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Start with home selected
      const homeTab = screen.getByText('Home').closest('ion-tab-button')
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')
      const libraryTab = screen.getByText('Library').closest('ion-tab-button')

      expect(homeTab).toHaveAttribute('selected')
      expect(chatTab).not.toHaveAttribute('selected')
      expect(libraryTab).not.toHaveAttribute('selected')

      // Switch to chat
      await user.click(chatTab!)

      expect(homeTab).toHaveAttribute('selected', 'false')
      expect(chatTab).toHaveAttribute('selected')
      expect(libraryTab).not.toHaveAttribute('selected')

      // Switch to library
      await user.click(libraryTab!)

      expect(homeTab).toHaveAttribute('selected', 'false')
      expect(chatTab).not.toHaveAttribute('selected')
      expect(libraryTab).toHaveAttribute('selected')
    })
  })

  describe('Profile Modal Functionality', () => {
    it('does not show profile modal by default', () => {
      render(<App />)

      expect(screen.queryByTestId('profile-modal')).not.toBeInTheDocument()
    })

    it('opens profile modal when profile icon is clicked', async () => {
      const user = userEvent.setup()
      render(<App />)

      const profileButton = screen.getByLabelText('Open Profile')
      await user.click(profileButton)

      expect(screen.getByTestId('profile-modal')).toBeInTheDocument()
      expect(screen.getByTestId('profile-view')).toBeInTheDocument()
      expect(screen.getByText('Profile View Content')).toBeInTheDocument()
    })

    it('closes profile modal when dismissed', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Open modal
      const profileButton = screen.getByLabelText('Open Profile')
      await user.click(profileButton)
      expect(screen.getByTestId('profile-modal')).toBeInTheDocument()

      // Close modal
      const closeButton = screen.getByTestId('close-modal')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('profile-modal')).not.toBeInTheDocument()
      })
    })

    it('maintains tab state while profile modal is open', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Switch to chat tab
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')!
      await user.click(chatTab)
      expect(screen.getByTestId('chat-view')).toBeInTheDocument()

      // Open profile modal
      const profileButton = screen.getByLabelText('Open Profile')
      await user.click(profileButton)
      expect(screen.getByTestId('profile-modal')).toBeInTheDocument()

      // Chat view should still be the active content behind modal
      expect(screen.getByTestId('chat-view')).toBeInTheDocument()
      expect(chatTab).toHaveAttribute('selected')

      // Close modal
      const closeButton = screen.getByTestId('close-modal')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('profile-modal')).not.toBeInTheDocument()
        expect(screen.getByTestId('chat-view')).toBeInTheDocument()
        expect(chatTab).toHaveAttribute('selected')
      })
    })
  })

  describe('Chat Session Management', () => {
    it('handles new chat creation', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Switch to chat tab first
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')!
      await user.click(chatTab)

      // Should show new session
      expect(screen.getByText('Session ID: new')).toBeInTheDocument()

      // Click new chat button
      const newChatButton = screen.getByText('New Chat')
      await user.click(newChatButton)

      // Should still be on chat tab with new session
      expect(chatTab).toHaveAttribute('selected')
      expect(screen.getByText('Session ID: new')).toBeInTheDocument()
    })

    it('handles chat selection from home page', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Should start on home page
      expect(screen.getByTestId('home-page')).toBeInTheDocument()

      // Select a chat from home
      const selectChatButton = screen.getByText('Select Chat')
      await user.click(selectChatButton)

      // Should switch to chat tab with selected session
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')
      expect(chatTab).toHaveAttribute('selected')
      expect(screen.getByTestId('chat-view')).toBeInTheDocument()
      expect(screen.getByText('Session ID: test-session')).toBeInTheDocument()
    })

    it('handles chat selection from library', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Go to library first
      const libraryTab = screen.getByText('Library').closest('ion-tab-button')!
      await user.click(libraryTab)
      expect(screen.getByTestId('library-page')).toBeInTheDocument()

      // Select a chat from library
      const selectChatButton = screen.getByText('Select Library Chat')
      await user.click(selectChatButton)

      // Should switch to chat tab with selected session
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')
      expect(chatTab).toHaveAttribute('selected')
      expect(screen.getByTestId('chat-view')).toBeInTheDocument()
      expect(screen.getByText('Session ID: lib-session')).toBeInTheDocument()
    })

    it('handles session updates from chat view', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Go to chat tab
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')!
      await user.click(chatTab)
      expect(screen.getByText('Session ID: new')).toBeInTheDocument()

      // Update session
      const updateButton = screen.getByText('Update Session')
      await user.click(updateButton)

      // Session ID should be updated
      expect(screen.getByText('Session ID: updated-session')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('has proper padding for header and tab bar', () => {
      render(<App />)

      const content = screen.getByText('Teacher Assistant').closest('ion-content')
      expect(content).toHaveStyle({
        paddingTop: '56px',
        paddingBottom: '60px'
      })
    })

    it('uses orange accent color for profile icon', () => {
      render(<App />)

      const profileIcon = screen.getByLabelText('Open Profile').querySelector('ion-icon')
      expect(profileIcon).toHaveStyle({ color: '#FB6542' })
    })
  })

  describe('Accessibility', () => {
    it('has proper aria labels for interactive elements', () => {
      render(<App />)

      expect(screen.getByLabelText('Open Profile')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).not.toBeInTheDocument() // Modal closed by default
    })

    it('profile modal has proper dialog role when open', async () => {
      const user = userEvent.setup()
      render(<App />)

      const profileButton = screen.getByLabelText('Open Profile')
      await user.click(profileButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('maintains tab navigation accessibility', () => {
      render(<App />)

      const homeTab = screen.getByText('Home').closest('ion-tab-button')
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')
      const libraryTab = screen.getByText('Library').closest('ion-tab-button')

      expect(homeTab).toHaveAttribute('role', 'tab')
      expect(chatTab).toHaveAttribute('role', 'tab')
      expect(libraryTab).toHaveAttribute('role', 'tab')
    })
  })

  describe('Error Handling', () => {
    it('handles missing session IDs gracefully', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Switch to chat tab
      const chatTab = screen.getByText('Chat').closest('ion-tab-button')!
      await user.click(chatTab)

      // Should handle undefined session ID
      expect(screen.getByText('Session ID: new')).toBeInTheDocument()
    })

    it('maintains app state when navigation fails', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Even with potential navigation errors, basic structure should remain
      expect(screen.getByText('eduhu.app')).toBeInTheDocument()
      expect(screen.getByAltText('eduhu.app logo')).toBeInTheDocument()
      expect(screen.getByLabelText('Open Profile')).toBeInTheDocument()
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Library')).toBeInTheDocument()
    })
  })
})