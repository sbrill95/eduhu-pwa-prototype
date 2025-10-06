import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentResultView } from './AgentResultView';
import * as AgentContext from '../lib/AgentContext';

// Mock AgentContext
vi.mock('../lib/AgentContext', () => ({
  useAgent: vi.fn()
}));

// Mock fetch for download
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock navigator.share
const mockShare = vi.fn();
Object.defineProperty(navigator, 'share', {
  writable: true,
  configurable: true,
  value: mockShare
});

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn()
};
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: mockClipboard
});

describe('AgentResultView', () => {
  const mockCloseModal = vi.fn();
  const mockSaveToLibrary = vi.fn();

  const mockResult = {
    artifactId: 'artifact-123',
    data: {
      imageUrl: 'https://example.com/image.png'
    },
    metadata: {
      revisedPrompt: 'A beautiful sunset at the beach'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'result',
        agentType: 'image-generation',
        formData: {},
        executionId: 'exec-123',
        sessionId: null,
        progress: { percentage: 100, message: '', currentStep: '' },
        result: mockResult,
        error: null
      },
      closeModal: mockCloseModal,
      saveToLibrary: mockSaveToLibrary,
      submitForm: vi.fn(),
      openModal: vi.fn(),
      cancelExecution: vi.fn()
    } as any);

    mockSaveToLibrary.mockResolvedValue(undefined);
  });

  it('should render result view with image', () => {
    render(<AgentResultView />);

    const image = screen.getByAltText('AI-generiertes Bild');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.png');
  });

  it('should show success badge after auto-save', async () => {
    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });
  });

  it('should call saveToLibrary on mount', async () => {
    render(<AgentResultView />);

    await waitFor(() => {
      expect(mockSaveToLibrary).toHaveBeenCalled();
    });
  });

  it('should show saving state initially', () => {
    render(<AgentResultView />);

    expect(screen.getByText('Wird gespeichert...')).toBeInTheDocument();
  });

  it('should display revised prompt metadata', async () => {
    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('Verwendeter Prompt:')).toBeInTheDocument();
      expect(screen.getByText('A beautiful sunset at the beach')).toBeInTheDocument();
    });
  });

  it('should call closeModal when close button clicked', async () => {
    render(<AgentResultView />);

    const closeButton = screen.getByLabelText('Schließen');
    await userEvent.click(closeButton);

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should call closeModal when "Weiter im Chat" clicked', async () => {
    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });

    const continueButton = screen.getByText('Weiter im Chat');
    await userEvent.click(continueButton);

    expect(mockCloseModal).toHaveBeenCalled();
  });


  it('should use Web Share API when available', async () => {
    mockShare.mockResolvedValue(undefined);

    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });

    const shareButton = screen.getByText(/^Teilen$/);
    await userEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Generiertes Bild',
        text: 'Bild zum Thema: Unterrichtsmaterial',
        url: 'https://example.com/image.png'
      });
    });
  });

  it('should fallback to clipboard when Web Share not available', async () => {
    // Remove navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: undefined
    });

    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });

    const shareButton = screen.getByText(/^Teilen$/);
    await userEvent.click(shareButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/image.png');
    });

    // Restore navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: mockShare
    });
  });

  it('should show spinner when result is null', () => {
    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'result',
        agentType: 'image-generation',
        formData: {},
        executionId: 'exec-123',
        sessionId: null,
        progress: { percentage: 100, message: '', currentStep: '' },
        result: null,
        error: null
      },
      closeModal: mockCloseModal,
      saveToLibrary: mockSaveToLibrary,
      submitForm: vi.fn(),
      openModal: vi.fn(),
      cancelExecution: vi.fn()
    } as any);

    const { container } = render(<AgentResultView />);

    // Check that spinner is rendered
    const spinner = container.querySelector('ion-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('name', 'crescent');
  });

  it('should handle auto-save failure gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSaveToLibrary.mockRejectedValue(new Error('Save failed'));

    render(<AgentResultView />);

    // Should still show result even if save fails
    await waitFor(() => {
      expect(screen.queryByText('Speichere...')).not.toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });


  it('should handle image load error', () => {
    render(<AgentResultView />);

    const image = screen.getByAltText('AI-generiertes Bild') as HTMLImageElement;

    // Trigger error
    const errorEvent = new Event('error');
    image.dispatchEvent(errorEvent);

    // Image should fallback to empty SVG
    expect(image.src).toContain('data:image/svg+xml');
  });

  it('should not show metadata when revisedPrompt is missing', async () => {
    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'result',
        agentType: 'image-generation',
        formData: {},
        executionId: 'exec-123',
        sessionId: null,
        progress: { percentage: 100, message: '', currentStep: '' },
        result: {
          artifactId: 'artifact-123',
          data: { imageUrl: 'https://example.com/image.png' },
          metadata: {}
        },
        error: null
      },
      closeModal: mockCloseModal,
      saveToLibrary: mockSaveToLibrary,
      submitForm: vi.fn(),
      openModal: vi.fn(),
      cancelExecution: vi.fn()
    } as any);

    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.queryByText('Verwendeter Prompt:')).not.toBeInTheDocument();
    });
  });

  // TASK-008: New Button Tests
  it('should render Teilen and Weiter im Chat buttons', async () => {
    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });

    expect(screen.getByText(/^Teilen$/)).toBeInTheDocument();
    expect(screen.getByText(/Weiter im Chat/)).toBeInTheDocument();
  });

  it('should render success badge in footer', async () => {
    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText(/In Bibliothek gespeichert/)).toBeInTheDocument();
      expect(screen.getByText(/Jederzeit unter "Bibliothek" abrufbar/)).toBeInTheDocument();
    });

    // Badge should be in footer (not overlay on image)
    const badgeContainer = screen.getByText('In Bibliothek gespeichert').parentElement?.parentElement;
    expect(badgeContainer).toHaveClass('bg-green-50');
  });

  it('should disable Teilen button during sharing', async () => {
    const mockShare = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: mockShare
    });

    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });

    const shareButton = screen.getByText(/^Teilen$/);
    await userEvent.click(shareButton);

    // Should show "Teilen..." and be disabled
    await waitFor(() => {
      expect(screen.getByText(/Teilen\.\.\./)).toBeInTheDocument();
    });

    const disabledButton = screen.getByText(/Teilen\.\.\./);
    expect(disabledButton).toBeDisabled();
  });

  it('should handle share cancellation gracefully', async () => {
    const mockShare = vi.fn().mockRejectedValue({ name: 'AbortError' });
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: mockShare
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });

    const shareButton = screen.getByText(/^Teilen$/);
    await userEvent.click(shareButton);

    // Should not throw error and button should be re-enabled
    await waitFor(() => {
      expect(screen.getByText(/^Teilen$/)).not.toBeDisabled();
    });

    // Should not log error for AbortError
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should use theme from metadata in share text', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: mockShare
    });

    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'result',
        agentType: 'image-generation',
        formData: {},
        executionId: 'exec-123',
        sessionId: null,
        progress: { percentage: 100, message: '', currentStep: '' },
        result: {
          artifactId: 'artifact-123',
          data: { imageUrl: 'https://example.com/image.png' },
          metadata: { theme: 'Satz des Pythagoras' }
        },
        error: null
      },
      closeModal: mockCloseModal,
      saveToLibrary: mockSaveToLibrary,
      submitForm: vi.fn(),
      openModal: vi.fn(),
      cancelExecution: vi.fn()
    } as any);

    render(<AgentResultView />);

    await waitFor(() => {
      expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
    });

    const shareButton = screen.getByText(/^Teilen$/);
    await userEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Generiertes Bild',
        text: 'Bild zum Thema: Satz des Pythagoras',
        url: 'https://example.com/image.png'
      });
    });
  });

  it('should show saving state badge', () => {
    mockSaveToLibrary.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AgentResultView />);

    expect(screen.getByText('Wird gespeichert...')).toBeInTheDocument();
    expect(screen.getByText('Einen Moment bitte')).toBeInTheDocument();
  });

  // TASK-011: Animation Tests
  describe('Animation - Bild fliegt zur Library', () => {
    beforeEach(() => {
      vi.clearAllMocks();

      // Mock DOM elements for animation
      const mockImage = document.createElement('img');
      mockImage.className = 'agent-result-image';
      mockImage.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        left: 100,
        width: 200,
        height: 200,
        bottom: 300,
        right: 300,
        x: 100,
        y: 100,
        toJSON: () => ({})
      }));

      const mockTab = document.createElement('ion-tab-button');
      mockTab.setAttribute('tab', 'library');
      mockTab.getBoundingClientRect = vi.fn(() => ({
        top: 500,
        left: 50,
        width: 60,
        height: 60,
        bottom: 560,
        right: 110,
        x: 50,
        y: 500,
        toJSON: () => ({})
      }));

      document.body.appendChild(mockImage);
      document.body.appendChild(mockTab);

      // Mock Element.prototype.animate
      Element.prototype.animate = vi.fn().mockReturnValue({
        onfinish: null,
        finished: Promise.resolve()
      });
    });

    afterEach(() => {
      // Cleanup DOM
      document.querySelectorAll('.agent-result-image, ion-tab-button').forEach(el => el.remove());
      document.querySelectorAll('.flying-image').forEach(el => el.remove());
    });

    it('creates flying image clone when Weiter im Chat clicked', async () => {
      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      // Check if clone was created
      await waitFor(() => {
        const clone = document.querySelector('.flying-image');
        expect(clone).toBeInTheDocument();
      });
    });

    it('triggers animation with correct properties', async () => {
      const animateSpy = vi.spyOn(Element.prototype, 'animate');

      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      await waitFor(() => {
        expect(animateSpy).toHaveBeenCalled();
      });

      // Verify animation config
      const call = animateSpy.mock.calls[0];
      expect(call[1]).toMatchObject({
        duration: 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      });
    });

    it('removes clone after animation finishes', async () => {
      let finishCallback: (() => void) | null = null;

      Element.prototype.animate = vi.fn().mockReturnValue({
        set onfinish(cb: () => void) {
          finishCallback = cb;
        },
        finished: Promise.resolve()
      });

      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      // Wait for clone to be created
      await waitFor(() => {
        const clone = document.querySelector('.flying-image');
        expect(clone).toBeInTheDocument();
      });

      // Trigger animation finish
      if (finishCallback) {
        finishCallback();
      }

      // Clone should be removed
      await waitFor(() => {
        const clone = document.querySelector('.flying-image');
        expect(clone).not.toBeInTheDocument();
      });
    });

    it('closes modal after animation completes', async () => {
      let finishCallback: (() => void) | null = null;

      Element.prototype.animate = vi.fn().mockReturnValue({
        set onfinish(cb: () => void) {
          finishCallback = cb;
        },
        finished: Promise.resolve()
      });

      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      // Trigger animation finish
      if (finishCallback) {
        finishCallback();
      }

      // Modal should close after animation
      await waitFor(() => {
        expect(mockCloseModal).toHaveBeenCalled();
      });
    });

    it('handles missing image element gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      // Remove all .agent-result-image elements (including rendered ones)
      document.querySelectorAll('.agent-result-image').forEach(el => el.remove());

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      // Should close immediately without animation
      expect(mockCloseModal).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Image element not found')
      );

      consoleWarnSpy.mockRestore();
    });

    it('handles missing library tab gracefully', async () => {
      // Remove mock tab
      document.querySelector('ion-tab-button')?.remove();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      // Should close immediately without animation
      expect(mockCloseModal).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Library tab not found')
      );

      consoleWarnSpy.mockRestore();
    });

    it('handles invisible image gracefully', async () => {
      // Make image invisible
      const mockImage = document.querySelector('.agent-result-image') as HTMLElement;
      mockImage.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      }));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      // Should close immediately without animation
      expect(mockCloseModal).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Image not visible')
      );

      consoleWarnSpy.mockRestore();
    });

    it('hides original image during animation', async () => {
      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      await waitFor(() => {
        const originalImage = document.querySelector('.agent-result-image') as HTMLElement;
        expect(originalImage?.style.opacity).toBe('0');
      });
    });

    it('positions clone at correct location', async () => {
      render(<AgentResultView />);

      await waitFor(() => {
        expect(screen.getByText('In Bibliothek gespeichert')).toBeInTheDocument();
      });

      const continueButton = screen.getByText(/Weiter im Chat/);
      await userEvent.click(continueButton);

      await waitFor(() => {
        const clone = document.querySelector('.flying-image') as HTMLElement;
        expect(clone).toBeInTheDocument();
        expect(clone.style.position).toBe('fixed');
        expect(clone.style.top).toBe('100px');
        expect(clone.style.left).toBe('100px');
        expect(clone.style.width).toBe('200px');
        expect(clone.style.height).toBe('200px');
        expect(clone.style.zIndex).toBe('9999');
      });
    });
  });
});