/**
 * TASK-008: Unit tests for TASK-006 (Form Prefill)
 *
 * Verifies that AgentFormView correctly extracts and displays
 * prefillData from agentSuggestion (description + imageStyle).
 */

import { render, screen, waitFor } from '@testing-library/react';
import { AgentFormView } from './AgentFormView';
import { AgentProvider } from '../lib/AgentContext';
import React from 'react';
import { vi } from 'vitest';

// Mock useAgent hook
const mockUseAgent = vi.fn();
vi.mock('../lib/AgentContext', async () => {
  const actual = await vi.importActual<typeof import('../lib/AgentContext')>('../lib/AgentContext');
  return {
    ...actual,
    useAgent: () => mockUseAgent(),
    AgentProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  };
});

describe('AgentFormView - Prefill (TASK-006)', () => {
  const mockCloseModal = vi.fn();
  const mockSubmitForm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('TASK-006: Should prefill description from agentSuggestion', async () => {
    // Mock state with prefillData
    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: {
          description: 'Ein Bild von einem Löwen für Klasse 7', // ✅ Prefilled
          imageStyle: 'realistic'
        }
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    render(<AgentFormView />);

    // VERIFY: Description textarea should be prefilled
    const descriptionTextarea = screen.getByLabelText('Was soll das Bild zeigen?') as HTMLTextAreaElement;

    await waitFor(() => {
      expect(descriptionTextarea.value).toBe('Ein Bild von einem Löwen für Klasse 7'); // ✅ Prefilled!
    });
  });

  test('TASK-006: Should prefill imageStyle from agentSuggestion', async () => {
    // Mock state with prefillData
    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: {
          description: 'Test description',
          imageStyle: 'cartoon' // ✅ Prefilled with cartoon style
        }
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    render(<AgentFormView />);

    // VERIFY: Image style select should be prefilled
    const styleSelect = screen.getByLabelText('Bildstil') as HTMLSelectElement;

    await waitFor(() => {
      expect(styleSelect.value).toBe('cartoon'); // ✅ Prefilled!
    });
  });

  test('TASK-006: Should handle empty prefillData gracefully', () => {
    // Mock state WITHOUT prefillData
    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: {} // ❌ No prefillData
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    render(<AgentFormView />);

    // VERIFY: Fields should use defaults
    const descriptionTextarea = screen.getByLabelText('Was soll das Bild zeigen?') as HTMLTextAreaElement;
    const styleSelect = screen.getByLabelText('Bildstil') as HTMLSelectElement;

    expect(descriptionTextarea.value).toBe(''); // ✅ Empty by default
    expect(styleSelect.value).toBe('realistic'); // ✅ Default style
  });

  test('TASK-006: Should update form when state.formData changes', async () => {
    // Initial state: empty
    const { rerender } = render(<AgentFormView />);

    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: {
          description: '',
          imageStyle: 'realistic'
        }
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    // Rerender with updated state (simulating agentSuggestion update)
    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: {
          description: 'Updated description from agent', // ✅ NEW prefill
          imageStyle: 'illustrative' // ✅ NEW style
        }
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    rerender(<AgentFormView />);

    // VERIFY: Form should update with new prefill data
    await waitFor(() => {
      const descriptionTextarea = screen.getByLabelText('Was soll das Bild zeigen?') as HTMLTextAreaElement;
      const styleSelect = screen.getByLabelText('Bildstil') as HTMLSelectElement;

      expect(descriptionTextarea.value).toBe('Updated description from agent'); // ✅ Updated!
      expect(styleSelect.value).toBe('illustrative'); // ✅ Updated!
    });
  });

  test('TASK-006: Should NOT overwrite user input with prefill', async () => {
    // User has already typed something
    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: {
          description: 'User manually typed this',
          imageStyle: 'realistic'
        }
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    const { rerender } = render(<AgentFormView />);

    // Agent tries to update prefill (should NOT override user input)
    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: {
          description: '', // ❌ Empty prefill (should not clear user input)
          imageStyle: 'realistic'
        }
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    rerender(<AgentFormView />);

    // VERIFY: User input should be preserved
    const descriptionTextarea = screen.getByLabelText('Was soll das Bild zeigen?') as HTMLTextAreaElement;

    await waitFor(() => {
      // Should keep user's input, not reset to empty
      expect(descriptionTextarea.value).toBe('User manually typed this'); // ✅ Preserved!
    });
  });

  test('TASK-006: Integration - Full prefill flow from agentSuggestion', async () => {
    // Simulate complete agentSuggestion prefill data
    const agentSuggestionPrefill = {
      description: 'Ein Diagramm zur Photosynthese mit beschrifteten Chloroplasten',
      imageStyle: 'illustrative' as const
    };

    mockUseAgent.mockReturnValue({
      state: {
        isModalOpen: true,
        currentView: 'form',
        agentType: 'image-generation',
        formData: agentSuggestionPrefill // ✅ From backend agentSuggestion.prefillData
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm
    });

    render(<AgentFormView />);

    // VERIFY: Both fields prefilled correctly
    const descriptionTextarea = screen.getByLabelText('Was soll das Bild zeigen?') as HTMLTextAreaElement;
    const styleSelect = screen.getByLabelText('Bildstil') as HTMLSelectElement;

    await waitFor(() => {
      expect(descriptionTextarea.value).toBe('Ein Diagramm zur Photosynthese mit beschrifteten Chloroplasten');
      expect(styleSelect.value).toBe('illustrative');
    });
  });
});
