import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentFormView } from './AgentFormView';
import * as AgentContext from '../lib/AgentContext';

// Mock AgentContext
vi.mock('../lib/AgentContext', () => ({
  useAgent: vi.fn()
}));

// Mock Ionic components
vi.mock('@ionic/react', () => ({
  IonButton: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{icon}</span>,
  IonToggle: ({ checked, onIonChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onIonChange?.({ detail: { checked: e.target.checked } })}
      {...props}
    />
  ),
  IonSpinner: () => <span data-testid="spinner">Loading...</span>
}));

// Mock ionicons
vi.mock('ionicons/icons', () => ({
  arrowBackOutline: 'arrow-back',
  sparkles: 'sparkles'
}));

describe('AgentFormView - Gemini Design', () => {
  const mockCloseModal = vi.fn();
  const mockSubmitForm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'form',
        agentType: 'image-generation',
        formData: {},
        executionId: null,
        sessionId: null,
        progress: { percentage: 0, message: '', currentStep: '' },
        result: null,
        error: null
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm,
      openModal: vi.fn(),
      cancelExecution: vi.fn(),
      saveToLibrary: vi.fn()
    });
  });

  it('renders all Gemini form fields', () => {
    render(<AgentFormView />);

    // Header
    expect(screen.getByText('Generieren')).toBeInTheDocument();

    // Title
    expect(screen.getByText(/Maßgeschneidertes Arbeitsmaterial/)).toBeInTheDocument();

    // Fields
    expect(screen.getByLabelText(/Thema/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lerngruppe/i)).toBeInTheDocument();
    expect(screen.getByText(/DaZ-Unterstützung/)).toBeInTheDocument();
    expect(screen.getByText(/Lernschwierigkeiten/)).toBeInTheDocument();

    // CTA Button
    expect(screen.getByText(/Idee entfalten/)).toBeInTheDocument();
  });

  it('pre-fills theme from prefillData', () => {
    vi.mocked(AgentContext.useAgent).mockReturnValue({
      state: {
        isOpen: true,
        phase: 'form',
        agentType: 'image-generation',
        formData: { theme: 'Satz des Pythagoras' },
        executionId: null,
        sessionId: null,
        progress: { percentage: 0, message: '', currentStep: '' },
        result: null,
        error: null
      },
      closeModal: mockCloseModal,
      submitForm: mockSubmitForm,
      openModal: vi.fn(),
      cancelExecution: vi.fn(),
      saveToLibrary: vi.fn()
    });

    render(<AgentFormView />);

    const themeInput = screen.getByLabelText(/Thema/i) as HTMLTextAreaElement;
    expect(themeInput.value).toBe('Satz des Pythagoras');
  });

  it('has default lerngruppe "Klasse 8a"', () => {
    render(<AgentFormView />);

    const dropdown = screen.getByLabelText(/Lerngruppe/i) as HTMLSelectElement;
    expect(dropdown.value).toBe('Klasse 8a');
  });

  it('toggles DaZ and Lernschwierigkeiten', async () => {
    const user = userEvent.setup();
    render(<AgentFormView />);

    const toggles = screen.getAllByRole('checkbox');

    // Initially false
    expect(toggles[0]).not.toBeChecked(); // DaZ
    expect(toggles[1]).not.toBeChecked(); // Lernschwierigkeiten

    // Toggle DaZ
    await user.click(toggles[0]);
    expect(toggles[0]).toBeChecked();

    // Toggle Lernschwierigkeiten
    await user.click(toggles[1]);
    expect(toggles[1]).toBeChecked();
  });

  it('disables submit button when theme is empty', () => {
    render(<AgentFormView />);

    const submitButton = screen.getByText(/Idee entfalten/);
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when theme has less than 5 chars', async () => {
    const user = userEvent.setup();
    render(<AgentFormView />);

    const themeInput = screen.getByLabelText(/Thema/i);
    await user.type(themeInput, 'Test'); // Only 4 chars

    const submitButton = screen.getByText(/Idee entfalten/);
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when theme has min 5 chars', async () => {
    const user = userEvent.setup();
    render(<AgentFormView />);

    const themeInput = screen.getByLabelText(/Thema/i);
    await user.type(themeInput, 'Tests'); // 5 chars

    const submitButton = screen.getByText(/Idee entfalten/);
    expect(submitButton).not.toBeDisabled();
  });

  it('calls submitForm with correct Gemini data', async () => {
    const user = userEvent.setup();
    mockSubmitForm.mockResolvedValue(undefined);
    render(<AgentFormView />);

    // Fill form
    const themeInput = screen.getByLabelText(/Thema/i);
    await user.type(themeInput, 'Wasserkreislauf');

    // Change lerngruppe
    const dropdown = screen.getByLabelText(/Lerngruppe/i);
    await user.selectOptions(dropdown, 'Klasse 5a');

    // Toggle DaZ
    const toggles = screen.getAllByRole('checkbox');
    await user.click(toggles[0]);

    // Submit
    const submitButton = screen.getByText(/Idee entfalten/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitForm).toHaveBeenCalledWith({
        theme: 'Wasserkreislauf',
        learningGroup: 'Klasse 5a',
        dazSupport: true,
        learningDifficulties: false
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockSubmitForm.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<AgentFormView />);

    // Fill theme with minimum 5 chars
    const themeInput = screen.getByLabelText(/Thema/i);
    await user.type(themeInput, 'Test Theme');

    const submitButton = screen.getByText(/Idee entfalten/);
    await user.click(submitButton);

    // Should show loading - use exact match for button text
    await waitFor(() => {
      expect(screen.getByText('Generiere...')).toBeInTheDocument();
    });

    // Button should be disabled during submission
    const loadingButton = screen.getByText('Generiere...').closest('button');
    expect(loadingButton).toBeDisabled();
  });

  it('handles back button click', async () => {
    const user = userEvent.setup();
    render(<AgentFormView />);

    // Find back button by icon
    const backButton = screen.getAllByRole('button')[0]; // First button is back
    await user.click(backButton);

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('does not call submitForm when theme is too short', async () => {
    const user = userEvent.setup();
    render(<AgentFormView />);

    // Type only 3 chars
    const themeInput = screen.getByLabelText(/Thema/i);
    await user.type(themeInput, 'abc');

    // Button should be disabled
    const submitButton = screen.getByText(/Idee entfalten/);
    expect(submitButton).toBeDisabled();

    // Try to click (won't work because disabled)
    await user.click(submitButton);
    expect(mockSubmitForm).not.toHaveBeenCalled();
  });

  it('updates form data when typing in textarea', async () => {
    const user = userEvent.setup();
    render(<AgentFormView />);

    const themeInput = screen.getByLabelText(/Thema/i) as HTMLTextAreaElement;
    await user.type(themeInput, 'Photosynthese');

    expect(themeInput.value).toBe('Photosynthese');
  });

  it('changes lerngruppe when selecting different option', async () => {
    const user = userEvent.setup();
    render(<AgentFormView />);

    const dropdown = screen.getByLabelText(/Lerngruppe/i) as HTMLSelectElement;

    // Initially Klasse 8a
    expect(dropdown.value).toBe('Klasse 8a');

    // Change to Klasse 10a
    await user.selectOptions(dropdown, 'Klasse 10a');
    expect(dropdown.value).toBe('Klasse 10a');
  });

  it('shows all lerngruppe options', () => {
    render(<AgentFormView />);

    const dropdown = screen.getByLabelText(/Lerngruppe/i);
    const options = dropdown.querySelectorAll('option');

    expect(options.length).toBeGreaterThan(5);
    expect(screen.getByRole('option', { name: 'Klasse 5a' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Klasse 8a' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Klasse 10a' })).toBeInTheDocument();
  });

  it('submits with all default values when only theme is filled', async () => {
    const user = userEvent.setup();
    mockSubmitForm.mockResolvedValue(undefined);
    render(<AgentFormView />);

    const themeInput = screen.getByLabelText(/Thema/i);
    await user.type(themeInput, 'Test Theme');

    const submitButton = screen.getByText(/Idee entfalten/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitForm).toHaveBeenCalledWith({
        theme: 'Test Theme',
        learningGroup: 'Klasse 8a', // default
        dazSupport: false, // default
        learningDifficulties: false // default
      });
    });
  });
});
