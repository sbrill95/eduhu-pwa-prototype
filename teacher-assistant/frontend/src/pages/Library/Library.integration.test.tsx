import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Library from './Library';
import { useAuth } from '../../lib/auth-context';
import { useMaterials, type UnifiedMaterial } from '../../hooks/useMaterials';

// Mock dependencies
vi.mock('../../lib/auth-context');
vi.mock('../../lib/instantdb', () => ({
  default: {
    useQuery: vi.fn(() => ({ data: null, error: null }))
  }
}));
vi.mock('../../hooks/useMaterials');
vi.mock('../../components/MaterialForm', () => ({
  default: () => <div>MaterialForm Mock</div>
}));
vi.mock('../../components/MaterialPreviewModal', () => ({
  MaterialPreviewModal: ({ material, isOpen, onClose, onDelete, onUpdateTitle, onToggleFavorite }: any) => (
    isOpen ? (
      <div data-testid="material-preview-modal">
        <div data-testid="modal-material-title">{material?.title}</div>
        <button data-testid="modal-delete-button" onClick={() => onDelete(material?.id)}>
          Delete
        </button>
        <button data-testid="modal-update-title-button" onClick={() => onUpdateTitle(material?.id, 'New Title')}>
          Update Title
        </button>
        <button data-testid="modal-toggle-favorite-button" onClick={() => onToggleFavorite(material?.id)}>
          Toggle Favorite
        </button>
        <button data-testid="modal-close-button" onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}));

const mockUser = { id: 'user-123', email: 'teacher@example.com' };

const mockMaterials: UnifiedMaterial[] = [
  {
    id: 'mat-1',
    title: 'Test Material 1',
    type: 'document',
    source: 'manual',
    description: 'Description 1',
    created_at: Date.now() - 1000,
    updated_at: Date.now() - 1000,
    is_favorite: false,
    metadata: {
      content: 'Content 1',
      tags: ['tag1', 'tag2']
    }
  },
  {
    id: 'mat-2',
    title: 'Test Material 2',
    type: 'worksheet',
    source: 'manual',
    description: 'Description 2',
    created_at: Date.now() - 2000,
    updated_at: Date.now() - 2000,
    is_favorite: true,
    metadata: {
      content: 'Content 2',
      tags: ['tag3']
    }
  }
];

describe('Library - MaterialPreviewModal Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAuth
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      sendMagicCode: vi.fn(),
      signInWithMagicCode: vi.fn()
    });

    // Mock useMaterials
    vi.mocked(useMaterials).mockReturnValue({
      materials: mockMaterials,
      loading: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TASK-007: Integrate MaterialPreviewModal', () => {
    it('Integration test: Click material opens modal', async () => {
      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Wait for materials to appear
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });

      // Click on material card
      const materialCard = screen.getByTestId('material-card-mat-1');
      fireEvent.click(materialCard);

      // Verify modal opens
      await waitFor(() => {
        const modal = screen.getByTestId('material-preview-modal');
        expect(modal).toBeInTheDocument();
        expect(screen.getByTestId('modal-material-title')).toHaveTextContent('Test Material 1');
      });
    });

    it('Integration test: Delete removes from list', async () => {
      // Mock fetch for delete
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Click on material card to open modal
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });
      const materialCard = screen.getByTestId('material-card-mat-1');
      fireEvent.click(materialCard);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('material-preview-modal')).toBeInTheDocument();
      });

      // Click delete button in modal
      const deleteButton = screen.getByTestId('modal-delete-button');
      fireEvent.click(deleteButton);

      // Verify deleteMaterial was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('mat-1');
      });

      // Verify modal closes after delete
      await waitFor(() => {
        expect(screen.queryByTestId('material-preview-modal')).not.toBeInTheDocument();
      });
    });

    it('Integration test: Title edit updates list', async () => {
      global.fetch.mockResolvedValue(undefined);

      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Click on material card to open modal
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });
      const materialCard = screen.getByTestId('material-card-mat-1');
      fireEvent.click(materialCard);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('material-preview-modal')).toBeInTheDocument();
      });

      // Click update title button in modal
      const updateTitleButton = screen.getByTestId('modal-update-title-button');
      fireEvent.click(updateTitleButton);

      // Verify updateMaterial was called with correct parameters
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('mat-1', { title: 'New Title' });
      });
    });

    it('Integration test: Favorite toggle works from modal', async () => {
      global.fetch.mockResolvedValue(undefined);

      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Click on material card to open modal
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });
      const materialCard = screen.getByTestId('material-card-mat-1');
      fireEvent.click(materialCard);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('material-preview-modal')).toBeInTheDocument();
      });

      // Click toggle favorite button in modal
      const toggleFavoriteButton = screen.getByTestId('modal-toggle-favorite-button');
      fireEvent.click(toggleFavoriteButton);

      // Verify toggleFavorite was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('mat-1');
      });
    });

    it('Integration test: Modal closes when close button clicked', async () => {
      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Click on material card to open modal
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });
      const materialCard = screen.getByTestId('material-card-mat-1');
      fireEvent.click(materialCard);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('material-preview-modal')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByTestId('material-preview-modal')).not.toBeInTheDocument();
      });
    });

    it('Integration test: Clicking favorite button on card does not open modal', async () => {
      global.fetch.mockResolvedValue(undefined);

      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Wait for materials to appear
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });

      // Find and click favorite button (not the card)
      const materialCard = screen.getByTestId('material-card-mat-1');
      const favoriteButtons = materialCard.querySelectorAll('ion-button');

      // Favorite button is the first button (before the ellipsis menu)
      if (favoriteButtons.length > 0) {
        fireEvent.click(favoriteButtons[0]);

        // Verify toggleFavorite was called
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith('mat-1');
        });

        // Verify modal did NOT open
        expect(screen.queryByTestId('material-preview-modal')).not.toBeInTheDocument();
      }
    });

    it('Integration test: Error handling during delete', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Delete failed'));

      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Click on material card to open modal
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });
      const materialCard = screen.getByTestId('material-card-mat-1');
      fireEvent.click(materialCard);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('material-preview-modal')).toBeInTheDocument();
      });

      // Click delete button in modal
      const deleteButton = screen.getByTestId('modal-delete-button');
      fireEvent.click(deleteButton);

      // Verify error was logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Fehler beim Löschen des Materials:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('Integration test: Error handling during title update', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Update failed'));

      render(<Library />);

      // Switch to artifacts tab
      const artifactsTab = screen.getByText('Materialien');
      fireEvent.click(artifactsTab);

      // Click on material card to open modal
      await waitFor(() => {
        expect(screen.getByText('Test Material 1')).toBeInTheDocument();
      });
      const materialCard = screen.getByTestId('material-card-mat-1');
      fireEvent.click(materialCard);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('material-preview-modal')).toBeInTheDocument();
      });

      // Click update title button in modal
      const updateTitleButton = screen.getByTestId('modal-update-title-button');
      fireEvent.click(updateTitleButton);

      // Verify error was logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Fehler beim Aktualisieren des Titels:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});