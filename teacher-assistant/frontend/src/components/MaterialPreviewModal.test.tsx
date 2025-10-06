import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MaterialPreviewModal, UnifiedMaterial } from './MaterialPreviewModal';

// Mock Ionic components
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');
  return {
    ...actual,
    IonModal: ({ children, isOpen, onDidDismiss }: any) =>
      isOpen ? <div data-testid="ion-modal" onClick={onDidDismiss}>{children}</div> : null,
    IonHeader: ({ children }: any) => <div data-testid="ion-header">{children}</div>,
    IonToolbar: ({ children }: any) => <div data-testid="ion-toolbar">{children}</div>,
    IonTitle: ({ children }: any) => <div data-testid="ion-title">{children}</div>,
    IonButtons: ({ children }: any) => <div data-testid="ion-buttons">{children}</div>,
    IonButton: ({ children, onClick, 'data-testid': testId }: any) =>
      <button onClick={onClick} data-testid={testId}>{children}</button>,
    IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{icon}</span>,
    IonContent: ({ children }: any) => <div data-testid="ion-content">{children}</div>,
    IonItem: ({ children }: any) => <div data-testid="ion-item">{children}</div>,
    IonLabel: ({ children }: any) => <div data-testid="ion-label">{children}</div>,
    IonInput: ({ value, onIonInput, placeholder, 'data-testid': testId }: any) =>
      <input
        type="text"
        value={value}
        onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
        placeholder={placeholder}
        data-testid={testId}
      />,
    IonAlert: ({ isOpen, header, message, buttons, onDidDismiss, 'data-testid': testId }: any) =>
      isOpen ? (
        <div data-testid={testId}>
          <h2>{header}</h2>
          <p>{message}</p>
          {buttons?.map((btn: any, idx: number) => (
            <button
              key={idx}
              onClick={() => {
                btn.handler?.();
                onDidDismiss?.();
              }}
              data-testid={`alert-button-${btn.text.toLowerCase()}`}
            >
              {btn.text}
            </button>
          ))}
        </div>
      ) : null,
  };
});

// Mock ionicons
vi.mock('ionicons/icons', () => ({
  closeOutline: 'close-outline',
  downloadOutline: 'download-outline',
  heartOutline: 'heart-outline',
  heart: 'heart',
  trashOutline: 'trash-outline',
  shareOutline: 'share-outline',
  createOutline: 'create-outline',
  refreshOutline: 'refresh-outline',
}));

// Mock AgentContext
const mockOpenModal = vi.fn();
vi.mock('../lib/AgentContext', () => ({
  useAgent: () => ({
    openModal: mockOpenModal,
    closeModal: vi.fn(),
    state: {
      isOpen: false,
      phase: null,
      agentType: null,
      formData: {},
      executionId: null,
      sessionId: null,
      progress: { percentage: 0, message: '', currentStep: '' },
      result: null,
      error: null
    }
  })
}));

describe('MaterialPreviewModal', () => {
  const mockMaterial: UnifiedMaterial = {
    id: 'test-material-1',
    title: 'Test Arbeitsblatt',
    description: 'Ein Test-Arbeitsblatt für die Prüfung',
    type: 'worksheet',
    source: 'manual',
    created_at: Date.now(),
    updated_at: Date.now(),
    metadata: {
      content: 'Dies ist der Inhalt des Arbeitsblatts',
      tags: ['Mathematik', 'Klasse 5'],
      subject: 'Mathematik',
      grade: '5',
    },
    is_favorite: false,
    usage_count: 0,
  };

  const mockHandlers = {
    onClose: vi.fn(),
    onDelete: vi.fn(),
    onUpdateTitle: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * TEST 1: Renders material data correctly
   */
  it('should render material data correctly', () => {
    render(
      <MaterialPreviewModal
        material={mockMaterial}
        isOpen={true}
        onClose={mockHandlers.onClose}
        onDelete={mockHandlers.onDelete}
        onUpdateTitle={mockHandlers.onUpdateTitle}
        onToggleFavorite={mockHandlers.onToggleFavorite}
      />
    );

    // Verify title is displayed
    expect(screen.getByTestId('material-title')).toHaveTextContent('Test Arbeitsblatt');

    // Verify type is displayed
    expect(screen.getByTestId('material-type')).toHaveTextContent('worksheet');

    // Verify source is displayed with German label
    expect(screen.getByTestId('material-source')).toHaveTextContent('Manuell erstellt');

    // Verify date is displayed
    const dateElement = screen.getByTestId('material-date');
    expect(dateElement).toBeInTheDocument();

    // Verify content is displayed
    expect(screen.getByTestId('material-content')).toHaveTextContent('Dies ist der Inhalt des Arbeitsblatts');
  });

  /**
   * TEST 2: Edit title works
   */
  it('should allow editing the title', async () => {
    render(
      <MaterialPreviewModal
        material={mockMaterial}
        isOpen={true}
        onClose={mockHandlers.onClose}
        onDelete={mockHandlers.onDelete}
        onUpdateTitle={mockHandlers.onUpdateTitle}
        onToggleFavorite={mockHandlers.onToggleFavorite}
      />
    );

    // Click edit button
    const editButton = screen.getByTestId('edit-title-button');
    fireEvent.click(editButton);

    // Verify input field appears
    const titleInput = screen.getByTestId('title-input');
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveValue('Test Arbeitsblatt');

    // Change the title
    fireEvent.change(titleInput, { target: { value: 'Neuer Titel' } });
    expect(titleInput).toHaveValue('Neuer Titel');

    // Click save button
    const saveButton = screen.getByTestId('save-title-button');
    fireEvent.click(saveButton);

    // Verify onUpdateTitle was called with correct parameters
    await waitFor(() => {
      expect(mockHandlers.onUpdateTitle).toHaveBeenCalledWith('test-material-1', 'Neuer Titel');
    });
  });

  /**
   * TEST 3: Delete confirmation shows
   */
  it('should show delete confirmation alert when delete button is clicked', async () => {
    render(
      <MaterialPreviewModal
        material={mockMaterial}
        isOpen={true}
        onClose={mockHandlers.onClose}
        onDelete={mockHandlers.onDelete}
        onUpdateTitle={mockHandlers.onUpdateTitle}
        onToggleFavorite={mockHandlers.onToggleFavorite}
      />
    );

    // Click delete button
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);

    // Verify alert is shown
    const deleteAlert = screen.getByTestId('delete-alert');
    expect(deleteAlert).toBeInTheDocument();
    expect(deleteAlert).toHaveTextContent('Material löschen');
    expect(deleteAlert).toHaveTextContent('Möchten Sie "Test Arbeitsblatt" wirklich löschen?');

    // Verify alert has cancel and delete buttons
    expect(screen.getByTestId('alert-button-abbrechen')).toBeInTheDocument();
    expect(screen.getByTestId('alert-button-löschen')).toBeInTheDocument();

    // Click delete confirmation
    const confirmButton = screen.getByTestId('alert-button-löschen');
    fireEvent.click(confirmButton);

    // Verify onDelete was called and modal was closed
    await waitFor(() => {
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('test-material-1');
      expect(mockHandlers.onClose).toHaveBeenCalled();
    });
  });

  /**
   * TEST 4: Download button works
   */
  it('should render download button and be clickable', () => {
    render(
      <MaterialPreviewModal
        material={mockMaterial}
        isOpen={true}
        onClose={mockHandlers.onClose}
        onDelete={mockHandlers.onDelete}
        onUpdateTitle={mockHandlers.onUpdateTitle}
        onToggleFavorite={mockHandlers.onToggleFavorite}
      />
    );

    // Verify download button is rendered
    const downloadButton = screen.getByTestId('download-button');
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toHaveTextContent('Download');

    // Verify button is clickable (doesn't throw error)
    fireEvent.click(downloadButton);
  });

  /**
   * TASK-010: Test "Neu generieren" button for generated images
   */
  describe('TASK-010: Regenerate Button', () => {
    const mockGeneratedImageMaterial: UnifiedMaterial = {
      id: 'test-image-1',
      title: 'Generated Classroom Image',
      description: 'A colorful classroom scene',
      type: 'image',
      source: 'agent-generated',
      created_at: Date.now(),
      updated_at: Date.now(),
      metadata: {
        agent_id: 'langgraph-image-generation',
        agent_name: 'Image Generator',
        prompt: 'A colorful classroom with students',
        image_style: 'realistic',
        artifact_data: {
          url: 'https://example.com/generated-image.png'
        }
      },
      is_favorite: false,
      usage_count: 0
    };

    beforeEach(() => {
      mockOpenModal.mockClear();
    });

    it('should show regenerate button for agent-generated images', () => {
      render(
        <MaterialPreviewModal
          material={mockGeneratedImageMaterial}
          isOpen={true}
          onClose={mockHandlers.onClose}
        />
      );

      const regenerateButton = screen.getByTestId('regenerate-button');
      expect(regenerateButton).toBeInTheDocument();
      expect(regenerateButton).toHaveTextContent('Neu generieren');
    });

    it('should NOT show regenerate button for uploaded images', () => {
      const uploadedImage: UnifiedMaterial = {
        ...mockGeneratedImageMaterial,
        type: 'upload-image',
        source: 'upload',
        metadata: {
          filename: 'test.jpg',
          image_data: 'data:image/jpeg;base64,..=='
        }
      };

      render(
        <MaterialPreviewModal
          material={uploadedImage}
          isOpen={true}
          onClose={mockHandlers.onClose}
        />
      );

      const regenerateButton = screen.queryByTestId('regenerate-button');
      expect(regenerateButton).not.toBeInTheDocument();
    });

    it('should NOT show regenerate button for manual materials', () => {
      const manualImage: UnifiedMaterial = {
        ...mockGeneratedImageMaterial,
        source: 'manual'
      };

      render(
        <MaterialPreviewModal
          material={manualImage}
          isOpen={true}
          onClose={mockHandlers.onClose}
        />
      );

      const regenerateButton = screen.queryByTestId('regenerate-button');
      expect(regenerateButton).not.toBeInTheDocument();
    });

    it('should call openModal with correct prefill data when regenerate is clicked', async () => {
      const mockOnClose = vi.fn();

      render(
        <MaterialPreviewModal
          material={mockGeneratedImageMaterial}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const regenerateButton = screen.getByTestId('regenerate-button');
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        // Should close the preview modal
        expect(mockOnClose).toHaveBeenCalled();

        // Should open agent modal with prefilled data
        expect(mockOpenModal).toHaveBeenCalledWith(
          'image-generation',
          {
            description: 'A colorful classroom with students',
            imageStyle: 'realistic'
          },
          undefined
        );
      });
    });

    it('should handle missing image_style gracefully', async () => {
      const materialWithoutStyle: UnifiedMaterial = {
        ...mockGeneratedImageMaterial,
        metadata: {
          agent_id: 'langgraph-image-generation',
          prompt: 'Test prompt without style',
          artifact_data: { url: 'https://example.com/image.png' }
          // image_style is missing
        }
      };

      const mockOnClose = vi.fn();

      render(
        <MaterialPreviewModal
          material={materialWithoutStyle}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const regenerateButton = screen.getByTestId('regenerate-button');
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockOpenModal).toHaveBeenCalledWith(
          'image-generation',
          {
            description: 'Test prompt without style',
            imageStyle: 'realistic'  // Should default to 'realistic'
          },
          undefined
        );
      });
    });

    it('should use fallback values when prompt is missing', async () => {
      const materialWithoutPrompt: UnifiedMaterial = {
        ...mockGeneratedImageMaterial,
        description: 'Fallback description',
        metadata: {
          agent_id: 'langgraph-image-generation',
          image_style: 'cartoon',
          artifact_data: { url: 'https://example.com/image.png' }
          // prompt is missing, should use description or title
        }
      };

      const mockOnClose = vi.fn();

      render(
        <MaterialPreviewModal
          material={materialWithoutPrompt}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const regenerateButton = screen.getByTestId('regenerate-button');
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockOpenModal).toHaveBeenCalledWith(
          'image-generation',
          {
            description: 'Fallback description',  // Falls back to material.description
            imageStyle: 'cartoon'
          },
          undefined
        );
      });
    });

    it('should fallback to title when both prompt and description are missing', async () => {
      const materialMinimal: UnifiedMaterial = {
        ...mockGeneratedImageMaterial,
        description: undefined,
        title: 'Image Title Only',
        metadata: {
          agent_id: 'langgraph-image-generation',
          image_style: 'realistic',
          artifact_data: { url: 'https://example.com/image.png' }
        }
      };

      const mockOnClose = vi.fn();

      render(
        <MaterialPreviewModal
          material={materialMinimal}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const regenerateButton = screen.getByTestId('regenerate-button');
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockOpenModal).toHaveBeenCalledWith(
          'image-generation',
          {
            description: 'Image Title Only',  // Falls back to material.title
            imageStyle: 'realistic'
          },
          undefined
        );
      });
    });
  });
});