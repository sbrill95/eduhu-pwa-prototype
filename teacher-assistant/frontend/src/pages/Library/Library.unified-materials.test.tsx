/**
 * Integration Tests for Library - Unified Materials (TASK-004)
 *
 * Tests the integration of useMaterials hook into Library component,
 * verifying that all 3 material sources (manual, uploads, agent-generated)
 * are correctly displayed, filtered, and searched.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IonApp } from '@ionic/react';
import Library from './Library';
import * as useMaterialsHook from '../../hooks/useMaterials';
import * as authContext from '../../lib/auth-context';
import db from '../../lib/instantdb';

// Mock dependencies
vi.mock('../../hooks/useMaterials');
vi.mock('../../lib/auth-context');
vi.mock('../../lib/instantdb');

const mockUseMaterials = vi.mocked(useMaterialsHook.useMaterials);
const mockUseAuth = vi.mocked(authContext.useAuth);
const mockDbUseQuery = vi.fn();

describe('Library - Unified Materials Integration (TASK-004)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'teacher@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    } as any);

    // Mock InstantDB query for chats
    mockDbUseQuery.mockReturnValue({
      data: { chat_sessions: [] },
      error: null,
      isLoading: false,
    });

    (db as any).useQuery = mockDbUseQuery;
  });

  describe('Integration Test 1: All 3 sources displayed', () => {
    it('should display materials from all 3 sources (manual, uploads, agent-generated)', async () => {
      const mockMaterials = [
        {
          id: 'manual-1',
          title: 'Manuelles Arbeitsblatt',
          type: 'worksheet',
          source: 'manual',
          created_at: Date.now() - 86400000,
          updated_at: Date.now() - 86400000,
          metadata: {
            tags: ['Mathe', 'Klasse 5'],
            content: 'Test content',
          },
          is_favorite: false,
        },
        {
          id: 'upload-img-1',
          title: 'Hochgeladenes Bild',
          type: 'upload-image',
          source: 'upload',
          created_at: Date.now() - 172800000,
          updated_at: Date.now() - 172800000,
          metadata: {
            filename: 'image.jpg',
            image_data: 'data:image/jpeg;base64,abc123',
          },
          is_favorite: false,
        },
        {
          id: 'generated-1',
          title: 'KI-generiertes Quiz',
          type: 'quiz',
          source: 'agent-generated',
          created_at: Date.now() - 259200000,
          updated_at: Date.now() - 259200000,
          metadata: {
            agent_name: 'Quiz Generator',
            prompt: 'Create a math quiz',
          },
          is_favorite: false,
        },
      ];

      mockUseMaterials.mockReturnValue({
        materials: mockMaterials as any,
        loading: false,
      });

      const { container } = render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Find and click Materialien segment button
      const materialsSegment = container.querySelector('ion-segment-button[value="artifacts"]');
      expect(materialsSegment).toBeTruthy();
      materialsSegment?.dispatchEvent(new CustomEvent('click', { bubbles: true }));

      // Wait for materials to be displayed
      await waitFor(() => {
        // Check if materials are rendered by looking for data-testid attributes
        const materialCards = container.querySelectorAll('[data-testid^="material-card-"]');
        expect(materialCards.length).toBe(3);
      }, { timeout: 3000 });

      // Verify materials are in the document
      expect(screen.queryByText('Manuelles Arbeitsblatt')).not.toBeNull();
      expect(screen.queryByText('Hochgeladenes Bild')).not.toBeNull();
      expect(screen.queryByText('KI-generiertes Quiz')).not.toBeNull();
    });
  });

  describe('Integration Test 2: Manual artifacts visible', () => {
    it('should display manual artifacts with correct metadata', async () => {
      const mockMaterials = [
        {
          id: 'manual-1',
          title: 'Mathe Arbeitsblatt',
          description: 'Ein Arbeitsblatt über Brüche',
          type: 'worksheet',
          source: 'manual',
          created_at: Date.now() - 86400000,
          updated_at: Date.now() - 86400000,
          metadata: {
            tags: ['Mathe', 'Brüche', 'Klasse 6'],
            content: 'Arbeitsblatt Content',
            subject: 'Mathematik',
            grade: '6',
          },
          is_favorite: true,
          usage_count: 5,
        },
      ];

      mockUseMaterials.mockReturnValue({
        materials: mockMaterials as any,
        loading: false,
      });

      render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Switch to Materialien tab
      await waitFor(() => {
        const materialsTab = screen.getByText('Materialien');
        materialsTab.click();
      });

      // Verify manual artifact is displayed with metadata
      await waitFor(() => {
        expect(screen.getByText('Mathe Arbeitsblatt')).toBeInTheDocument();
        expect(screen.getByText('Ein Arbeitsblatt über Brüche')).toBeInTheDocument();
        expect(screen.getByText('Mathe')).toBeInTheDocument();
        expect(screen.getByText('Brüche')).toBeInTheDocument();
        expect(screen.getByText('Klasse 6')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Test 3: Generated artifacts visible', () => {
    it('should display agent-generated artifacts', async () => {
      const mockMaterials = [
        {
          id: 'generated-1',
          title: 'KI-generiertes Arbeitsblatt',
          description: 'Create a math worksheet for grade 5',
          type: 'worksheet',
          source: 'agent-generated',
          created_at: Date.now() - 259200000,
          updated_at: Date.now() - 259200000,
          metadata: {
            agent_id: 'agent-123',
            agent_name: 'Worksheet Generator',
            prompt: 'Create a math worksheet for grade 5',
            model_used: 'gpt-4',
          },
          is_favorite: false,
        },
      ];

      mockUseMaterials.mockReturnValue({
        materials: mockMaterials as any,
        loading: false,
      });

      render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Switch to Materialien tab
      await waitFor(() => {
        const materialsTab = screen.getByText('Materialien');
        materialsTab.click();
      });

      // Verify generated artifact is displayed
      await waitFor(() => {
        expect(screen.getByText('KI-generiertes Arbeitsblatt')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Test 4: Uploads visible', () => {
    it('should display uploaded images and PDFs', async () => {
      const mockMaterials = [
        {
          id: 'upload-img-1',
          title: 'Bild vom 28.09.2025',
          type: 'upload-image',
          source: 'upload',
          created_at: Date.now() - 172800000,
          updated_at: Date.now() - 172800000,
          metadata: {
            filename: 'image_123.jpg',
            file_type: 'image/jpeg',
            image_data: 'data:image/jpeg;base64,abc123',
          },
          is_favorite: false,
        },
        {
          id: 'upload-file-456',
          title: 'document.pdf',
          type: 'upload-pdf',
          source: 'upload',
          created_at: Date.now() - 259200000,
          updated_at: Date.now() - 259200000,
          metadata: {
            filename: 'document.pdf',
            file_url: 'file-456',
            file_type: 'application/pdf',
          },
          is_favorite: false,
        },
      ];

      mockUseMaterials.mockReturnValue({
        materials: mockMaterials as any,
        loading: false,
      });

      render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Switch to Materialien tab
      await waitFor(() => {
        const materialsTab = screen.getByText('Materialien');
        materialsTab.click();
      });

      // Verify uploads are displayed
      await waitFor(() => {
        expect(screen.getByText('Bild vom 28.09.2025')).toBeInTheDocument();
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Test 5: Filter by source works', () => {
    it('should filter materials by document type (including uploads)', async () => {
      const mockMaterials = [
        {
          id: 'manual-1',
          title: 'Manual Document',
          type: 'document',
          source: 'manual',
          created_at: Date.now(),
          updated_at: Date.now(),
          metadata: {},
          is_favorite: false,
        },
        {
          id: 'upload-pdf-1',
          title: 'Uploaded PDF',
          type: 'upload-pdf',
          source: 'upload',
          created_at: Date.now(),
          updated_at: Date.now(),
          metadata: { filename: 'test.pdf' },
          is_favorite: false,
        },
        {
          id: 'worksheet-1',
          title: 'Worksheet',
          type: 'worksheet',
          source: 'manual',
          created_at: Date.now(),
          updated_at: Date.now(),
          metadata: {},
          is_favorite: false,
        },
      ];

      mockUseMaterials.mockReturnValue({
        materials: mockMaterials as any,
        loading: false,
      });

      render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Switch to Materialien tab
      await waitFor(() => {
        const materialsTab = screen.getByText('Materialien');
        materialsTab.click();
      });

      // Click "Dokumente" filter
      await waitFor(() => {
        const dokumenteFilter = screen.getByText('Dokumente');
        dokumenteFilter.click();
      });

      // Verify document and uploaded PDF are visible, worksheet is hidden
      await waitFor(() => {
        expect(screen.getByText('Manual Document')).toBeInTheDocument();
        expect(screen.getByText('Uploaded PDF')).toBeInTheDocument();
        expect(screen.queryByText('Worksheet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Integration Test 6: Search works across all materials', () => {
    it('should search across all material sources', async () => {
      const mockMaterials = [
        {
          id: 'manual-1',
          title: 'Mathe Arbeitsblatt',
          type: 'worksheet',
          source: 'manual',
          created_at: Date.now(),
          updated_at: Date.now(),
          metadata: {
            tags: ['Mathe', 'Algebra'],
            content: 'Algebra exercises',
          },
          is_favorite: false,
        },
        {
          id: 'upload-1',
          title: 'Physik PDF',
          type: 'upload-pdf',
          source: 'upload',
          created_at: Date.now(),
          updated_at: Date.now(),
          metadata: {
            filename: 'physik.pdf',
          },
          is_favorite: false,
        },
        {
          id: 'generated-1',
          title: 'Mathe Quiz',
          description: 'Ein Quiz über Algebra',
          type: 'quiz',
          source: 'agent-generated',
          created_at: Date.now(),
          updated_at: Date.now(),
          metadata: {},
          is_favorite: false,
        },
      ];

      mockUseMaterials.mockReturnValue({
        materials: mockMaterials as any,
        loading: false,
      });

      render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Switch to Materialien tab
      await waitFor(() => {
        const materialsTab = screen.getByText('Materialien');
        materialsTab.click();
      });

      // Search for "Mathe"
      await waitFor(() => {
        const searchBar = screen.getByPlaceholderText('Materialien durchsuchen...');
        searchBar.dispatchEvent(new CustomEvent('ionInput', {
          detail: { value: 'Mathe' }
        }));
      });

      // Verify only Mathe materials are visible
      await waitFor(() => {
        expect(screen.getByText('Mathe Arbeitsblatt')).toBeInTheDocument();
        expect(screen.getByText('Mathe Quiz')).toBeInTheDocument();
        expect(screen.queryByText('Physik PDF')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loaders while materials are loading', async () => {
      mockUseMaterials.mockReturnValue({
        materials: [],
        loading: true,
      });

      render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Switch to Materialien tab
      await waitFor(() => {
        const materialsTab = screen.getByText('Materialien');
        materialsTab.click();
      });

      // Verify skeleton text is shown
      await waitFor(() => {
        const skeletons = document.querySelectorAll('ion-skeleton-text');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no materials exist', async () => {
      mockUseMaterials.mockReturnValue({
        materials: [],
        loading: false,
      });

      render(
        <IonApp>
          <Library />
        </IonApp>
      );

      // Switch to Materialien tab
      await waitFor(() => {
        const materialsTab = screen.getByText('Materialien');
        materialsTab.click();
      });

      // Verify empty state message
      await waitFor(() => {
        expect(screen.getByText('Keine Materialien gefunden')).toBeInTheDocument();
        expect(screen.getByText('Erstellen Sie Ihr erstes Material über den Button oben.')).toBeInTheDocument();
      });
    });
  });
});