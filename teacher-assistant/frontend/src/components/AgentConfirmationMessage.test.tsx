import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentConfirmationMessage from './AgentConfirmationMessage';
import * as AgentContext from '../lib/AgentContext';

// Mock AgentContext
const mockOpenModal = vi.fn();
vi.mock('../lib/AgentContext', async () => {
  const actual = await vi.importActual('../lib/AgentContext');
  return {
    ...actual,
    useAgent: () => ({
      openModal: mockOpenModal,
      closeModal: vi.fn(),
      submitForm: vi.fn(),
      cancelExecution: vi.fn(),
      saveToLibrary: vi.fn(),
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
  };
});

describe('AgentConfirmationMessage (NEW Interface - TASK-001)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders normal message without agentSuggestion', () => {
    const message = {
      content: 'Dies ist eine normale Nachricht ohne Agent-Vorschlag.'
    };

    render(<AgentConfirmationMessage message={message} />);

    // Should render plain text
    expect(screen.getByText('Dies ist eine normale Nachricht ohne Agent-Vorschlag.')).toBeInTheDocument();

    // Should NOT render confirmation card
    expect(screen.queryByText('Bildgenerierung')).not.toBeInTheDocument();
    expect(screen.queryByText('Bild-Generierung starten ✨')).not.toBeInTheDocument();
  });

  it('renders confirmation card with agentSuggestion', () => {
    const message = {
      content: 'Ich kann ein Bild zum Satz des Pythagoras erstellen.',
      agentSuggestion: {
        agentType: 'image-generation' as const,
        reasoning: 'Ein visuelles Bild hilft beim Verständnis des Satzes.',
        prefillData: {
          theme: 'Satz des Pythagoras',
          learningGroup: 'Klasse 8a'
        }
      }
    };

    render(<AgentConfirmationMessage message={message} />);

    // Should render assistant's message
    expect(
      screen.getByText('Ich kann ein Bild zum Satz des Pythagoras erstellen.')
    ).toBeInTheDocument();

    // Should render confirmation card
    expect(screen.getByText('Bildgenerierung')).toBeInTheDocument();
    expect(screen.getByText('Bild-Generierung starten ✨')).toBeInTheDocument();
  });

  it('displays reasoning text from agentSuggestion', () => {
    const message = {
      content: 'Möchten Sie ein Bild erstellen?',
      agentSuggestion: {
        agentType: 'image-generation' as const,
        reasoning: 'Dies ist ein Test-Reasoning-Text für die Bildgenerierung.',
        prefillData: {
          theme: 'Test-Thema'
        }
      }
    };

    render(<AgentConfirmationMessage message={message} />);

    // Should display reasoning text
    expect(
      screen.getByText('Dies ist ein Test-Reasoning-Text für die Bildgenerierung.')
    ).toBeInTheDocument();
  });

  it('calls openModal with correct parameters when button is clicked', () => {
    const message = {
      content: 'Bild erstellen?',
      agentSuggestion: {
        agentType: 'image-generation' as const,
        reasoning: 'Test reasoning',
        prefillData: {
          theme: 'Satz des Pythagoras',
          learningGroup: 'Klasse 8a'
        }
      }
    };

    render(<AgentConfirmationMessage message={message} />);

    // Click confirmation button
    const confirmButton = screen.getByText('Bild-Generierung starten ✨');
    fireEvent.click(confirmButton);

    // Should call openModal with agentType, prefillData, and sessionId
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledWith('image-generation', {
      theme: 'Satz des Pythagoras',
      learningGroup: 'Klasse 8a'
    }, null); // sessionId is null when not provided
  });

  it('has correct Gemini styling (gradient, colors, rounded corners)', () => {
    const message = {
      content: 'Test',
      agentSuggestion: {
        agentType: 'image-generation' as const,
        reasoning: 'Test',
        prefillData: {
          theme: 'Test'
        }
      }
    };

    const { container } = render(<AgentConfirmationMessage message={message} />);

    // Check for gradient background
    const gradientDiv = container.querySelector('.bg-gradient-to-r');
    expect(gradientDiv).toBeInTheDocument();
    expect(gradientDiv).toHaveClass('from-primary-50', 'to-background-teal/30');

    // Check for rounded corners
    expect(gradientDiv).toHaveClass('rounded-2xl');

    // Check for white card inside
    const whiteCard = container.querySelector('.bg-white');
    expect(whiteCard).toBeInTheDocument();
    expect(whiteCard).toHaveClass('rounded-xl');

    // Check for orange button
    const button = screen.getByText('Bild-Generierung starten ✨');
    expect(button).toHaveClass('bg-primary-500', 'text-white', 'rounded-xl');
  });

  it('renders Sparkles icon in confirmation card', () => {
    const message = {
      content: 'Test',
      agentSuggestion: {
        agentType: 'image-generation' as const,
        reasoning: 'Test',
        prefillData: {
          theme: 'Test'
        }
      }
    };

    const { container } = render(<AgentConfirmationMessage message={message} />);

    // Check for icon container
    const iconContainer = container.querySelector('.bg-primary-100');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('rounded-full', 'w-10', 'h-10');

    // Check for IonIcon (Sparkles)
    const icon = container.querySelector('ion-icon');
    expect(icon).toBeInTheDocument();
  });
});

describe('AgentConfirmationMessage (OLD Interface - Backward Compatibility)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders old interface when onConfirm and onCancel props are provided', () => {
    const message = {
      id: '123',
      session_id: 'session-1',
      user_id: 'user-1',
      content: 'Test content',
      role: 'assistant' as const,
      timestamp: Date.now(),
      message_index: 0,
      messageType: 'agent-confirmation' as const,
      agentId: 'image-gen',
      agentName: 'Bildgenerierung',
      agentIcon: '🎨',
      agentColor: '#FB6542',
      estimatedTime: '2 Minuten',
      creditsRequired: 5,
      context: 'Satz des Pythagoras'
    };

    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <AgentConfirmationMessage
        message={message}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Should render old UI
    expect(screen.getByText('Bildgenerierung')).toBeInTheDocument();
    expect(screen.getByText('"Satz des Pythagoras"')).toBeInTheDocument();
    expect(screen.getByText(/Ja, Agent starten/)).toBeInTheDocument();
    expect(screen.getByText(/Nein, Konversation fortsetzen/)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked in old interface', () => {
    const message = {
      id: '123',
      session_id: 'session-1',
      user_id: 'user-1',
      content: 'Test',
      role: 'assistant' as const,
      timestamp: Date.now(),
      message_index: 0,
      messageType: 'agent-confirmation' as const,
      agentId: 'test-agent',
      agentName: 'Test Agent',
      agentIcon: '🔬',
      agentColor: '#000',
      context: 'Test context'
    };

    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <AgentConfirmationMessage
        message={message}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Click confirm button
    const confirmButton = screen.getByText(/Ja, Agent starten/);
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('test-agent');
  });

  it('calls onCancel when cancel button is clicked in old interface', () => {
    const message = {
      id: '123',
      session_id: 'session-1',
      user_id: 'user-1',
      content: 'Test',
      role: 'assistant' as const,
      timestamp: Date.now(),
      message_index: 0,
      messageType: 'agent-confirmation' as const,
      agentId: 'test-agent',
      agentName: 'Test Agent',
      agentIcon: '🔬',
      agentColor: '#000',
      context: 'Test context'
    };

    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <AgentConfirmationMessage
        message={message}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Click cancel button
    const cancelButton = screen.getByText(/Nein, Konversation fortsetzen/);
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith('test-agent');
  });
});
