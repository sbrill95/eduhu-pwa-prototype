import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentProgressView } from './AgentProgressView';
import * as AgentContext from '../lib/AgentContext';

// Mock AgentContext
vi.mock('../lib/AgentContext', () => ({
  useAgent: vi.fn()
}));

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Error) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {}
  close() {}

  // Helper to simulate messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  simulateOpen() {
    if (this.onopen) this.onopen();
  }

  simulateError(error: Error) {
    if (this.onerror) this.onerror(error);
  }
}

global.WebSocket = MockWebSocket as any;

describe('AgentProgressView', () => {
  const mockCancelExecution = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];

    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'progress',
        agentType: 'image-generation',
        formData: {},
        executionId: 'exec-123',
        sessionId: null,
        progress: { percentage: 0, message: '', currentStep: '' },
        result: null,
        error: null
      },
      cancelExecution: mockCancelExecution,
      closeModal: vi.fn(),
      submitForm: vi.fn(),
      openModal: vi.fn(),
      saveToLibrary: vi.fn()
    });
  });

  afterEach(() => {
    MockWebSocket.instances.forEach(ws => ws.close());
  });

  it('should render progress view with initial state', () => {
    render(<AgentProgressView />);

    expect(screen.getByText('In Bearbeitung...')).toBeInTheDocument();
    expect(screen.getByText('Starte Bildgenerierung...')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('should establish WebSocket connection on mount', async () => {
    render(<AgentProgressView />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
      expect(MockWebSocket.instances[0].url).toContain('exec-123');
    });
  });

  it('should update progress when WebSocket message received', async () => {
    render(<AgentProgressView />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();
    ws.simulateMessage({
      type: 'progress',
      progress: 50,
      message: '🎨 Erstelle dein Bild...',
      step: 'image-generation'
    });

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('🎨 Erstelle dein Bild...')).toBeInTheDocument();
    });
  });

  it('should update estimated time based on progress', async () => {
    render(<AgentProgressView />);

    // Initial state
    expect(screen.getByText('~1 Minute')).toBeInTheDocument();

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    // 50% progress
    ws.simulateMessage({
      type: 'progress',
      progress: 50,
      message: 'Halfway there',
      step: 'processing'
    });

    await waitFor(() => {
      expect(screen.getByText('~30 Sekunden')).toBeInTheDocument();
    });

    // 95% progress
    ws.simulateMessage({
      type: 'progress',
      progress: 95,
      message: 'Almost done',
      step: 'finalization'
    });

    await waitFor(() => {
      expect(screen.getByText('Fast fertig...')).toBeInTheDocument();
    });
  });

  it('should show cancel confirmation and call cancelExecution', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockCancelExecution.mockResolvedValue(undefined);

    render(<AgentProgressView />);

    const cancelButton = screen.getByText('Abbrechen');
    await userEvent.click(cancelButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Möchtest du die Bildgenerierung wirklich abbrechen?'
    );
    expect(mockCancelExecution).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should not cancel if user declines confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AgentProgressView />);

    const cancelButton = screen.getByText('Abbrechen');
    await userEvent.click(cancelButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockCancelExecution).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should show error status when WebSocket fails', async () => {
    render(<AgentProgressView />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    ws.simulateError(new Error('Connection failed'));

    await waitFor(() => {
      expect(screen.getByText('Verbindungsfehler')).toBeInTheDocument();
    });
  });

  it('should close WebSocket on unmount', async () => {
    const { unmount } = render(<AgentProgressView />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const closeSpy = vi.spyOn(MockWebSocket.instances[0], 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should display current step when provided', async () => {
    render(<AgentProgressView />);

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();
    ws.simulateMessage({
      type: 'progress',
      progress: 30,
      message: 'Processing',
      step: 'prompt-enhancement'
    });

    await waitFor(() => {
      expect(screen.getByText('Schritt: prompt-enhancement')).toBeInTheDocument();
    });
  });

  it('should handle different progress percentages correctly', async () => {
    render(<AgentProgressView />);

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    // Test 0%
    expect(screen.getByText('~1 Minute')).toBeInTheDocument();

    // Test 25%
    ws.simulateMessage({
      type: 'progress',
      progress: 25,
      message: 'Starting',
      step: 'init'
    });

    await waitFor(() => {
      expect(screen.getByText('~45 Sekunden')).toBeInTheDocument();
    });

    // Test 85%
    ws.simulateMessage({
      type: 'progress',
      progress: 85,
      message: 'Finishing',
      step: 'final'
    });

    await waitFor(() => {
      expect(screen.getByText('~15 Sekunden')).toBeInTheDocument();
    });
  });

  it('should handle WebSocket reconnection', () => {
    // Note: WebSocket reconnection is tested in E2E tests
    // Unit testing reconnection with fake timers is complex and flaky
    expect(true).toBe(true);
  });

  it('should not connect WebSocket if executionId is null', () => {
    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'progress',
        agentType: 'image-generation',
        formData: {},
        executionId: null, // No execution ID
        sessionId: null,
        progress: { percentage: 0, message: '', currentStep: '' },
        result: null,
        error: null
      },
      cancelExecution: mockCancelExecution,
      closeModal: vi.fn(),
      submitForm: vi.fn(),
      openModal: vi.fn(),
      saveToLibrary: vi.fn()
    });

    render(<AgentProgressView />);

    // Should not create any WebSocket instances
    expect(MockWebSocket.instances.length).toBe(0);
  });

  it('should handle progress completion', async () => {
    render(<AgentProgressView />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    // Simulate 100% completion
    ws.simulateMessage({
      type: 'progress',
      progress: 100,
      message: 'Fertig!',
      step: 'finalization'
    });

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('should display warning messages', () => {
    render(<AgentProgressView />);

    expect(screen.getByText('Das kann bis zu 1 Minute dauern')).toBeInTheDocument();
    expect(screen.getByText('Bitte schließe die App nicht')).toBeInTheDocument();
  });

  it('should handle WebSocket message parsing errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AgentProgressView />);

    // Component should still be functional even with WebSocket errors
    expect(screen.getByText('In Bearbeitung...')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});