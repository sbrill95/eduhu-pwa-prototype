import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { apiClient } from './api';
import db from './instantdb';
import type { ImageGenerationPrefillData } from './types';

/**
 * Agent Execution State Interface
 * Tracks the complete lifecycle of an agent execution
 */
interface AgentExecutionState {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Current phase of the agent workflow */
  phase: 'form' | 'progress' | 'result' | null;
  /** Type of agent being executed */
  agentType: 'image-generation' | null;
  /** Form data collected from user */
  formData: Record<string, any>;
  /** Execution ID from backend */
  executionId: string | null;
  /** Associated chat session ID */
  sessionId: string | null;
  /** Progress information during execution */
  progress: {
    percentage: number;
    message: string;
    currentStep: string;
  };
  /** Final result from agent execution */
  result: {
    artifactId: string;
    data: any;
    metadata: any;
  } | null;
  /** Error message if execution failed */
  error: string | null;
}

/**
 * Agent Context Value Interface
 * API provided to components using the AgentContext
 */
interface AgentContextValue {
  /** Current agent execution state */
  state: AgentExecutionState;
  /** Open the agent modal with optional prefilled data */
  openModal: (
    agentType: 'image-generation' | 'worksheet' | 'lesson-plan',
    prefillData?: ImageGenerationPrefillData | Record<string, unknown>,
    sessionId?: string
  ) => void;
  /** Close the agent modal and reset state */
  closeModal: () => void;
  /** Submit the form and start agent execution */
  submitForm: (formData: any) => Promise<void>;
  /** Cancel an ongoing agent execution */
  cancelExecution: () => Promise<void>;
  /** Save the result to the user's library */
  saveToLibrary: () => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

/**
 * Agent Provider Component
 * Wraps the application to provide agent execution state management
 */
export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AgentExecutionState>({
    isOpen: false,
    phase: null,
    agentType: null,
    formData: {},
    executionId: null,
    sessionId: null,
    progress: { percentage: 0, message: '', currentStep: '' },
    result: null,
    error: null
  });

  /**
   * Open the agent modal
   * @param agentType - Type of agent to execute (e.g., 'image-generation')
   * @param prefillData - Optional data to prefill the form
   * @param sessionId - Optional session ID to associate with this execution
   */
  const openModal = useCallback((agentType: string, prefillData = {}, sessionId: string | null = null) => {
    console.log('[AgentContext] Opening modal', { agentType, prefillData, sessionId });
    setState({
      isOpen: true,
      phase: 'form',
      agentType: agentType as any,
      formData: prefillData,
      executionId: null,
      sessionId,
      progress: { percentage: 0, message: '', currentStep: '' },
      result: null,
      error: null
    });
  }, []);

  /**
   * Close the agent modal and reset all state
   */
  const closeModal = useCallback(() => {
    console.log('[AgentContext] Closing modal');
    setState({
      isOpen: false,
      phase: null,
      agentType: null,
      formData: {},
      executionId: null,
      sessionId: null,
      progress: { percentage: 0, message: '', currentStep: '' },
      result: null,
      error: null
    });
  }, []);

  /**
   * Submit the form and start agent execution
   * @param formData - Data collected from the form
   * @throws Error if user is not authenticated
   */
  const submitForm = useCallback(async (formData: any) => {
    if (!user) {
      console.error('[AgentContext] Submit failed: User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      console.log('[AgentContext] Submitting form', { formData, agentType: state.agentType });

      // Transition to progress phase
      setState(prev => ({ ...prev, phase: 'progress', formData }));

      // Map frontend agent type to backend agent ID
      const agentIdMap: Record<string, string> = {
        'image-generation': 'langgraph-image-generation'
      };

      const agentId = state.agentType ? agentIdMap[state.agentType] : undefined;

      if (!agentId) {
        throw new Error(`Unknown agent type: ${state.agentType}`);
      }

      // Execute agent via backend API
      const response = await apiClient.executeAgent({
        agentId,
        input: JSON.stringify(formData), // Backend expects input as string
        context: formData,
        sessionId: state.sessionId || undefined,
        confirmExecution: true  // ✅ FIX: Tell backend to actually execute (not just preview)
      });

      console.log('[AgentContext] Agent execution response', {
        response,
        hasImageUrl: !!response.image_url,
        responseKeys: Object.keys(response),
        imageUrl: response.image_url?.substring(0, 50) + '...'
      });

      // Note: ApiClient already unwraps response.data, so response IS the data object
      // Extract executionId - it might be in the response directly or in metadata field
      const executionId = response.executionId || (response as any).metadata?.executionId || null;

      console.log('[AgentContext] Extracted executionId:', executionId);

      // Check if backend returned complete result (synchronous execution)
      // ApiClient returns response.data directly, so check response.image_url
      if (response.image_url) {
        const { image_url, revised_prompt, title } = response;

        console.log('[AgentContext] Synchronous execution completed', {
          executionId,
          hasImageUrl: !!image_url
        });

        // Backend completed synchronously - go directly to result phase
        const newState = {
          ...state,
          phase: 'result' as const,
          executionId: executionId,
          result: {
            artifactId: executionId || crypto.randomUUID(),
            data: {
              imageUrl: image_url,
              revisedPrompt: revised_prompt,
              title: title
            },
            metadata: {
              executionId,
              completedAt: new Date().toISOString()
            }
          }
        };

        console.log('[AgentContext] Setting state to result phase:', newState);

        setState(prev => ({
          ...prev,
          phase: 'result',
          executionId: executionId,
          result: {
            artifactId: executionId || crypto.randomUUID(),
            data: {
              imageUrl: image_url,
              revisedPrompt: revised_prompt,
              title: title
            },
            metadata: {
              executionId,
              completedAt: new Date().toISOString()
            }
          }
        }));
      } else {
        // Async execution or preview - set executionId and wait for updates
        console.log('[AgentContext] Async execution started', { executionId });

        // Set executionId immediately so cancel works
        setState(prev => ({ ...prev, executionId: executionId }));

        // Note: Progress updates will come via WebSocket or polling (handled in AgentProgressView)
      }

    } catch (error) {
      console.error('[AgentContext] Submit failed', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Fehler beim Starten des Agents',
        phase: 'form'
      }));
    }
  }, [user, state.agentType, state.sessionId]);

  /**
   * Cancel an ongoing agent execution
   * Sends a cancellation request to the backend
   */
  const cancelExecution = useCallback(async () => {
    if (!state.executionId || !user) {
      console.warn('[AgentContext] Cancel skipped: No execution ID or user');
      return;
    }

    try {
      console.log('[AgentContext] Cancelling execution', { executionId: state.executionId });

      // Note: Backend doesn't have a cancel endpoint yet, but we'll close the modal anyway
      // TODO: Implement backend cancel endpoint
      // await apiClient.cancelAgentExecution(state.executionId);

      closeModal();
    } catch (error) {
      console.error('[AgentContext] Cancel failed', error);
      // Close modal anyway
      closeModal();
    }
  }, [state.executionId, user, closeModal]);

  /**
   * Save the agent result to the user's library
   * Updates InstantDB to mark the artifact as saved
   */
  const saveToLibrary = useCallback(async () => {
    if (!state.result || !user) {
      console.warn('[AgentContext] Save to library skipped: No result or user');
      return;
    }

    try {
      console.log('[AgentContext] Saving to library', { artifactId: state.result.artifactId });

      // Save to InstantDB generated_artifacts
      // Note: Backend already creates the artifact, we just mark it as saved
      await db.transact(
        db.tx['generated_artifacts'][state.result.artifactId].update({
          is_favorite: false,
          usage_count: 0
        })
      );

      console.log('[AgentContext] Saved to library successfully');
    } catch (error) {
      console.error('[AgentContext] Save to library failed', error);
      // Don't throw - this is a non-critical operation
    }
  }, [state.result, user]);

  const value: AgentContextValue = {
    state,
    openModal,
    closeModal,
    submitForm,
    cancelExecution,
    saveToLibrary
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

/**
 * Custom hook to access Agent Context
 * @throws Error if used outside of AgentProvider
 * @returns AgentContextValue with state and control functions
 */
export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
};