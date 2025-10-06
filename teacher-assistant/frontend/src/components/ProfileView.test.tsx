import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import ProfileView from './ProfileView'

// Mock the hooks
const mockUseAuth = vi.fn()
const mockUseTeacherProfile = vi.fn()
const mockRefreshProfile = vi.fn()

vi.mock('../lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../hooks/useTeacherProfile', () => ({
  useTeacherProfile: () => mockUseTeacherProfile(),
}))

// Mock Ionic React components for testing
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react')
  return {
    ...actual,
    IonRefresher: ({ children, onIonRefresh }: any) => (
      <div data-testid="refresher" onClick={() => onIonRefresh({ detail: { complete: vi.fn() } })}>
        {children}
      </div>
    ),
    IonRefresherContent: () => <div data-testid="refresher-content" />,
  }
})

describe('ProfileView', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test Teacher'
  }

  const mockProfile = {
    id: '123',
    user_id: '123',
    subjects: ['Mathematik', 'Physik'],
    grades: ['5. Klasse', '6. Klasse', '7. Klasse'],
    teaching_methods: ['Frontalunterricht', 'Gruppenarbeit', 'Projektarbeit'],
    topics: ['Algebra', 'Geometrie', 'Mechanik'],
    challenges: ['Digitalisierung', 'Heterogene Klassen'],
    school_type: 'secondary',
    conversation_count: 15,
    created_at: 1640995200000, // 2022-01-01
    last_updated: 1672531200000, // 2023-01-01
    extraction_history: [
      {
        id: '1',
        timestamp: 1672531200000,
        conversation_length: 8,
        confidence_score: 0.85
      },
      {
        id: '2',
        timestamp: 1672617600000,
        conversation_length: 12,
        confidence_score: 0.92
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRefreshProfile.mockClear()

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    })

    mockUseTeacherProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      refreshProfile: mockRefreshProfile,
    })
  })

  describe('Loading States', () => {
    it('renders loading skeleton when profile is loading', () => {
      mockUseTeacherProfile.mockReturnValue({
        profile: null,
        loading: true,
        error: null,
        refreshProfile: mockRefreshProfile,
      })

      render(<ProfileView />)

      expect(screen.getByTestId('refresher')).toBeInTheDocument()
      // Check for skeleton elements by looking for ion-skeleton-text components
      const skeletons = document.querySelectorAll('ion-skeleton-text')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('shows profile title when loading', () => {
      mockUseTeacherProfile.mockReturnValue({
        profile: null,
        loading: true,
        error: null,
        refreshProfile: mockRefreshProfile,
      })

      render(<ProfileView />)

      expect(screen.getByText('Mein Profil')).toBeInTheDocument()
      // During loading, the actual content is replaced with skeletons
      expect(screen.queryByText('Benutzerinformationen')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when profile loading fails', () => {
      const errorMessage = 'Failed to load profile'
      mockUseTeacherProfile.mockReturnValue({
        profile: null,
        loading: false,
        error: errorMessage,
        refreshProfile: mockRefreshProfile,
      })

      render(<ProfileView />)

      expect(screen.getByText('Fehler beim Laden des Profils')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('shows user information when profile has error but user exists', () => {
      mockUseTeacherProfile.mockReturnValue({
        profile: null,
        loading: false,
        error: 'Some error',
        refreshProfile: mockRefreshProfile,
      })

      render(<ProfileView />)

      expect(screen.getByText('Benutzerinformationen')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test Teacher')).toBeInTheDocument()
    })
  })

  describe('User Information Display', () => {
    it('renders user information correctly', () => {
      render(<ProfileView />)

      expect(screen.getByText('Benutzerinformationen')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test Teacher')).toBeInTheDocument()
      expect(screen.getByText('Weiterführende Schule')).toBeInTheDocument()
    })

    it('handles missing user name gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: undefined },
        isLoading: false,
        error: null,
      })

      render(<ProfileView />)

      expect(screen.getByText('Nicht angegeben')).toBeInTheDocument()
    })

    it('handles missing user email gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, email: undefined },
        isLoading: false,
        error: null,
      })

      render(<ProfileView />)

      expect(screen.getByText('Nicht verfügbar')).toBeInTheDocument()
    })

    it('formats dates correctly', () => {
      render(<ProfileView />)

      expect(screen.getByText('1. Januar 2022')).toBeInTheDocument() // created_at

      // Use getAllByText since there might be multiple instances of this date
      const lastUpdatedDates = screen.getAllByText('1. Jan. 2023, 01:00')
      expect(lastUpdatedDates.length).toBeGreaterThan(0) // last_updated appears in profile and extraction history
    })
  })

  describe('School Type Labels', () => {
    it('displays correct school type labels', () => {
      render(<ProfileView />)
      expect(screen.getByText('Weiterführende Schule')).toBeInTheDocument()
    })

    it('handles elementary school type', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, school_type: 'elementary' }
      })

      render(<ProfileView />)
      expect(screen.getByText('Grundschule')).toBeInTheDocument()
    })

    it('handles university school type', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, school_type: 'university' }
      })

      render(<ProfileView />)
      expect(screen.getByText('Universität')).toBeInTheDocument()
    })

    it('handles vocational school type', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, school_type: 'vocational' }
      })

      render(<ProfileView />)
      expect(screen.getByText('Berufsschule')).toBeInTheDocument()
    })

    it('handles unknown school type', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, school_type: 'unknown' }
      })

      render(<ProfileView />)
      expect(screen.getByText('Nicht angegeben')).toBeInTheDocument()
    })
  })

  describe('Profile Statistics', () => {
    it('displays conversation count correctly', () => {
      render(<ProfileView />)

      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('Gespräche analysiert')).toBeInTheDocument()
    })

    it('displays extraction history count correctly', () => {
      render(<ProfileView />)

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Wissens-Updates')).toBeInTheDocument()
    })

    it('handles zero extraction history', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, extraction_history: [] }
      })

      render(<ProfileView />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Profile Sections', () => {
    it('renders subjects section with chips', () => {
      render(<ProfileView />)

      expect(screen.getByText('Unterrichtsfächer')).toBeInTheDocument()
      expect(screen.getByText('Mathematik')).toBeInTheDocument()
      expect(screen.getByText('Physik')).toBeInTheDocument()
    })

    it('renders grades section with chips', () => {
      render(<ProfileView />)

      expect(screen.getByText('Klassenstufen')).toBeInTheDocument()
      expect(screen.getByText('5. Klasse')).toBeInTheDocument()
      expect(screen.getByText('6. Klasse')).toBeInTheDocument()
      expect(screen.getByText('7. Klasse')).toBeInTheDocument()
    })

    it('renders teaching methods section with chips', () => {
      render(<ProfileView />)

      expect(screen.getByText('Lehrmethoden')).toBeInTheDocument()
      expect(screen.getByText('Frontalunterricht')).toBeInTheDocument()
      expect(screen.getByText('Gruppenarbeit')).toBeInTheDocument()
      expect(screen.getByText('Projektarbeit')).toBeInTheDocument()
    })

    it('renders topics section with chips', () => {
      render(<ProfileView />)

      expect(screen.getByText('Häufige Themen')).toBeInTheDocument()
      expect(screen.getByText('Algebra')).toBeInTheDocument()
      expect(screen.getByText('Geometrie')).toBeInTheDocument()
      expect(screen.getByText('Mechanik')).toBeInTheDocument()
    })

    it('renders challenges section with chips', () => {
      render(<ProfileView />)

      expect(screen.getByText('Herausforderungen')).toBeInTheDocument()
      expect(screen.getByText('Digitalisierung')).toBeInTheDocument()
      expect(screen.getByText('Heterogene Klassen')).toBeInTheDocument()
    })
  })

  describe('Empty Profile Sections', () => {
    it('shows empty state for subjects when none exist', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, subjects: [] }
      })

      render(<ProfileView />)

      expect(screen.getByText('Noch keine Unterrichtsfächer identifiziert. Sprechen Sie über Ihre Fächer im Chat.')).toBeInTheDocument()
    })

    it('shows empty state for grades when none exist', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, grades: [] }
      })

      render(<ProfileView />)

      expect(screen.getByText('Noch keine Klassenstufen identifiziert. Erwähnen Sie Ihre Zielgruppe im Chat.')).toBeInTheDocument()
    })

    it('shows empty state for teaching methods when none exist', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, teaching_methods: [] }
      })

      render(<ProfileView />)

      expect(screen.getByText('Noch keine bevorzugten Lehrmethoden identifiziert. Diskutieren Sie Ihre Ansätze im Chat.')).toBeInTheDocument()
    })

    it('shows empty state for topics when none exist', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, topics: [] }
      })

      render(<ProfileView />)

      expect(screen.getByText('Noch keine häufigen Themen identifiziert. Führen Sie Gespräche über Unterrichtsinhalte.')).toBeInTheDocument()
    })

    it('shows empty state for challenges when none exist', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, challenges: [] }
      })

      render(<ProfileView />)

      expect(screen.getByText('Noch keine Herausforderungen identifiziert. Sprechen Sie über Schwierigkeiten im Unterricht.')).toBeInTheDocument()
    })
  })

  describe('Extraction History', () => {
    it('renders extraction history correctly', () => {
      render(<ProfileView />)

      expect(screen.getByText('Letzte Profil-Updates')).toBeInTheDocument()
      expect(screen.getByText('Gespräch mit 8 Nachrichten analysiert')).toBeInTheDocument()
      expect(screen.getByText('Gespräch mit 12 Nachrichten analysiert')).toBeInTheDocument()
      expect(screen.getByText('85% Konfidenz')).toBeInTheDocument()
      expect(screen.getByText('92% Konfidenz')).toBeInTheDocument()
    })

    it('limits extraction history to 5 items', () => {
      const manyExtractions = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        timestamp: 1672531200000 + (i * 86400000), // Each day apart
        conversation_length: 5 + i,
        confidence_score: 0.8 + (i * 0.01)
      }))

      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, extraction_history: manyExtractions }
      })

      render(<ProfileView />)

      // Should only show the last 5 (most recent)
      const extractionItems = screen.getAllByText(/Gespräch mit \d+ Nachrichten analysiert/)
      expect(extractionItems).toHaveLength(5)
    })

    it('does not render extraction history section when empty', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: { ...mockProfile, extraction_history: [] }
      })

      render(<ProfileView />)

      expect(screen.queryByText('Letzte Profil-Updates')).not.toBeInTheDocument()
    })

    it('handles extraction history without confidence scores', () => {
      mockUseTeacherProfile.mockReturnValue({
        ...mockUseTeacherProfile(),
        profile: {
          ...mockProfile,
          extraction_history: [{
            id: '1',
            timestamp: 1672531200000,
            conversation_length: 5,
            // No confidence_score
          }]
        }
      })

      render(<ProfileView />)

      expect(screen.getByText('Gespräch mit 5 Nachrichten analysiert')).toBeInTheDocument()
      expect(screen.queryByText(/% Konfidenz/)).not.toBeInTheDocument()
    })
  })

  describe('No Profile State', () => {
    it('shows getting started message when no profile exists', () => {
      mockUseTeacherProfile.mockReturnValue({
        profile: null,
        loading: false,
        error: null,
        refreshProfile: mockRefreshProfile,
      })

      render(<ProfileView />)

      expect(screen.getByText('Ihr Profil wird erstellt')).toBeInTheDocument()
      expect(screen.getByText(/Führen Sie Gespräche mit dem AI-Assistenten/)).toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    it('calls refresh profile when refresher is triggered', async () => {
      const user = userEvent.setup()
      render(<ProfileView />)

      const refresher = screen.getByTestId('refresher')
      await user.click(refresher)

      expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
    })

    it('handles refresh errors gracefully', async () => {
      const user = userEvent.setup()
      mockRefreshProfile.mockRejectedValue(new Error('Refresh failed'))

      render(<ProfileView />)

      const refresher = screen.getByTestId('refresher')
      await user.click(refresher)

      // Should still call refresh even if it fails
      expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ProfileView />)

      expect(screen.getByRole('heading', { name: 'Mein Profil' })).toBeInTheDocument()
      expect(screen.getByText('Benutzerinformationen')).toBeInTheDocument()
      expect(screen.getByText('Lernfortschritt')).toBeInTheDocument()
    })

    it('has proper contrast and styling for badges', () => {
      render(<ProfileView />)

      const confidenceBadges = screen.getAllByText(/% Konfidenz/)
      confidenceBadges.forEach(badge => {
        expect(badge.closest('[color="success"], [color="warning"]')).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('uses proper grid layout for statistics', () => {
      render(<ProfileView />)

      const statisticsSection = screen.getByText('15').closest('div')
      expect(statisticsSection?.parentElement).toHaveStyle({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'
      })
    })

    it('has proper spacing and padding for mobile', () => {
      render(<ProfileView />)

      const mainContainer = screen.getByText('Benutzerinformationen').closest('[style*="padding"]')
      expect(mainContainer).toHaveStyle({ padding: '16px' })
    })
  })
})