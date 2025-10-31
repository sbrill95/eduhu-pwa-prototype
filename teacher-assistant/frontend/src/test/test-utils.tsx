/**
 * Custom test utilities for testing components with providers
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock AgentProvider with minimal implementation for tests
const MockAgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockState = {
    isOpen: false,
    phase: null,
    agentType: null,
    formData: {},
    executionId: null,
    sessionId: null,
    progress: { percentage: 0, message: '', currentStep: '' },
    result: null,
    error: null
  };

  const mockContextValue = {
    state: mockState,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    submitForm: vi.fn(),
    cancelExecution: vi.fn(),
    saveToLibrary: vi.fn(),
    navigateToTab: vi.fn(),
  };

  // Create a mock context provider
  return (
    <div data-testid="mock-agent-provider">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Clone element and add mock context as prop if needed
          return React.cloneElement(child as any, { agentContext: mockContextValue });
        }
        return child;
      })}
    </div>
  );
};

// Mock auth context provider
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// All the providers that wrap the app
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MockAuthProvider>
      <MockAgentProvider>
        {children}
      </MockAgentProvider>
    </MockAuthProvider>
  );
};

// Custom render function that includes all providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing library
export * from '@testing-library/react';

// Override render with our custom one
export { customRender as render };

// Export mock values for direct use in tests
export const mockAgentContext = {
  state: {
    isOpen: false,
    phase: null as 'form' | 'progress' | 'result' | null,
    agentType: null as 'image-generation' | null,
    formData: {},
    executionId: null as string | null,
    sessionId: null as string | null,
    progress: { percentage: 0, message: '', currentStep: '' },
    result: null as any,
    error: null as string | null
  },
  openModal: vi.fn(),
  closeModal: vi.fn(),
  submitForm: vi.fn(),
  cancelExecution: vi.fn(),
  saveToLibrary: vi.fn(),
  navigateToTab: vi.fn(),
};

// Mock the AgentContext module
vi.mock('../lib/AgentContext', () => ({
  AgentProvider: MockAgentProvider,
  useAgent: () => mockAgentContext
}));