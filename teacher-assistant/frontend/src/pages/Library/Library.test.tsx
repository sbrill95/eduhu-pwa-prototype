import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Library from './Library';

// Mock dependencies
vi.mock('../../lib/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../lib/instantdb', () => ({
  default: {
    useQuery: vi.fn(() => ({
      data: { chat_sessions: [] },
      error: null,
      isLoading: false,
    })),
  },
}));

vi.mock('../../hooks/useLibraryMaterials', () => ({
  default: () => ({
    materials: [],
    loading: false,
    error: null,
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
    toggleFavorite: vi.fn(),
  }),
}));

describe('Library Component - Tab Removal Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should only display 2 tabs (Chats and Materialien)', () => {
    render(<Library />);

    // Check that only 2 tabs are visible
    const chatTab = screen.getByText('Chats');
    const materialsTab = screen.getByText('Materialien');

    expect(chatTab).toBeInTheDocument();
    expect(materialsTab).toBeInTheDocument();

    // Check that Uploads tab is NOT present
    const uploadsTab = screen.queryByText('Uploads');
    expect(uploadsTab).not.toBeInTheDocument();
  });

  it('should default to "Chats" tab on initial render', async () => {
    render(<Library />);

    // Wait for component to render
    await waitFor(() => {
      // Check that Chats tab is selected by default
      const chatTab = screen.getByText('Chats');
      const segmentButton = chatTab.closest('ion-segment-button');

      // In Ionic, the selected segment button has specific attributes
      // We check the parent IonSegment value prop matches 'chats'
      expect(segmentButton).toBeInTheDocument();
    });

    // Check that the search bar shows the correct placeholder for Chats
    // Use getAllByPlaceholderText since ion-searchbar creates multiple elements
    const searchBars = screen.getAllByPlaceholderText('Chats durchsuchen...');
    expect(searchBars.length).toBeGreaterThan(0);
    expect(searchBars[0]).toBeInTheDocument();
  });
});