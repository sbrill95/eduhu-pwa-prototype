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
  /** Navigate to a specific tab (SPA navigation, no page reload) */
  navigateToTab: (tab: 'home' | 'chat' | 'library', options?: { sessionId?: string, queryParams?: Record<string, string> }) => void;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

/**
 * Agent Provider Component Props
 */
interface AgentProviderProps {
  children: React.ReactNode;
  /** Optional navigation callback for tab switching (Ionic tab system) */
  onNavigateToTab?: (tab: 'home' | 'chat' | 'library', options?: { sessionId?: string }) => void;
}

/**
 * Agent Provider Component
 * Wraps the application to provide agent execution state management
 */
export const AgentProvider: React.FC<AgentProviderProps> = ({ children, onNavigateToTab }) => {
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
    console.log('[AgentContext] 🚀 submitForm CALLED', {
      timestamp: new Date().toISOString(),
      hasUser: !!user,
      userId: user?.id,
      agentType: state.agentType,
      formData,
      sessionId: state.sessionId
    });

    if (!user) {
      console.error('[AgentContext] ❌ Submit failed: User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      console.log('[AgentContext] ✅ Auth check passed, proceeding with submission', {
        formData,
        agentType: state.agentType
      });

      // Transition to progress phase
      setState(prev => ({ ...prev, phase: 'progress', formData }));

      let response: any;

      // PHASE 3 E2E TESTING: Route image-generation to OpenAI SDK endpoint
      if (state.agentType === 'image-generation') {
        console.log('[AgentContext] 📡 Calling SDK endpoint for image-generation:', {
          url: '/api/agents-sdk/image/generate',
          formData
        });

        // Call new SDK endpoint directly
        response = await apiClient.executeImageGenerationSdk({
          description: formData.description,
          imageStyle: formData.imageStyle,
          learningGroup: formData.learningGroup,
          size: formData.size || '1024x1024',
          quality: formData.quality || 'standard',
          style: formData.style || 'vivid'
        });
      } else {
        // For other agent types, use old LangGraph endpoint
        const agentIdMap: Record<string, string> = {
          'image-generation': 'image-generation'
        };

        const agentId = state.agentType ? agentIdMap[state.agentType] : undefined;

        if (!agentId) {
          throw new Error(`Unknown agent type: ${state.agentType}`);
        }

        const requestPayload = {
          agentId,
          input: formData,
          context: formData,
          sessionId: state.sessionId || undefined,
          userId: user?.id,
          confirmExecution: true
        };

        console.log('[AgentContext] 📡 Making API request to executeAgent (LangGraph):', {
          url: '/api/langgraph/agents/execute',
          payload: requestPayload
        });

        response = await apiClient.executeAgent(requestPayload);
      }

      console.log('[AgentContext] 📨 API response received:', {
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : []
      });

      console.log('[AgentContext] ✅ Agent execution response received', {
        hasImageUrl: !!response.image_url,
        hasRevisedPrompt: !!response.revised_prompt,
        hasTitle: !!response.title,
        responseKeys: Object.keys(response),
        imageUrl: response.image_url ? response.image_url.substring(0, 60) + '...' : 'NO IMAGE URL',
        title: response.title,
        revisedPromptLength: response.revised_prompt?.length || 0
      });

      // Note: ApiClient already unwraps response.data, so response IS the data object
      // Extract executionId - it might be in the response directly or in metadata field
      const executionId = response.executionId || (response as any).metadata?.executionId || null;

      console.log('[AgentContext] Extracted executionId:', executionId);

      // Check if backend returned complete result (synchronous execution)
      // ApiClient returns response.data directly, so check response.image_url
      console.log('[AgentContext] 🔍 Checking if response has image_url...', {
        hasImageUrl: !!response.image_url,
        responseImageUrl: response.image_url
      });

      if (response.image_url) {
        const { image_url, revised_prompt, title, library_id } = response;

        console.log('[AgentContext] 🔍 DEBUG: Full response object:', response);
        console.log('[AgentContext] 🔍 DEBUG: Extracted library_id:', library_id);
        console.log('[AgentContext] 🔍 DEBUG: response.library_id direct access:', response.library_id);

        console.log('[AgentContext] ✅ SYNCHRONOUS EXECUTION COMPLETED - Setting state to RESULT phase', {
          executionId,
          hasImageUrl: !!image_url,
          imageUrlPreview: image_url.substring(0, 60) + '...',
          title,
          revisedPromptLength: revised_prompt?.length || 0,
          libraryId: library_id
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
              title: title,
              library_id: library_id
            },
            metadata: {
              executionId,
              completedAt: new Date().toISOString(),
              library_id: library_id
            }
          }
        };

        console.log('[AgentContext] 🚀 Setting state to result phase NOW...');

        setState(prev => {
          const newState = {
            ...prev,
            phase: 'result' as const,
            executionId: executionId,
            result: {
              artifactId: executionId || crypto.randomUUID(),
              data: {
                imageUrl: image_url,
                revisedPrompt: revised_prompt,
                title: title,
                library_id: library_id
              },
              metadata: {
                executionId,
                completedAt: new Date().toISOString(),
                originalParams: formData, // Include original params for regeneration
                library_id: library_id
              }
            }
          };

          console.log('[AgentContext] ✅ STATE UPDATED TO RESULT PHASE', {
            phase: newState.phase,
            hasResult: !!newState.result,
            resultData: newState.result?.data,
            isOpen: newState.isOpen,
            libraryId: library_id,
            'result.data.library_id': newState.result?.data?.library_id,
            'result.metadata.library_id': newState.result?.metadata?.library_id
          });

          return newState;
        });

        console.log('[AgentContext] 🔍 DEBUG: State after setState should have library_id:', {
          'state.result.data.library_id': state.result?.data?.library_id,
          'state.result.metadata.library_id': state.result?.metadata?.library_id
        });
      } else {
        // Async execution or preview - set executionId and wait for updates
        console.log('[AgentContext] Async execution started', { executionId });

        // Set executionId immediately so cancel works
        setState(prev => ({ ...prev, executionId: executionId }));

        // Note: Progress updates will come via WebSocket or polling (handled in AgentProgressView)
      }

    } catch (error) {
      console.error('[AgentContext] ❌ Submit failed - DETAILED ERROR', {
        timestamp: new Date().toISOString(),
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStatus: (error as any)?.status,
        errorCode: (error as any)?.errorCode,
        agentType: state.agentType,
        hasFormData: !!formData,
        formDataKeys: formData ? Object.keys(formData) : [],
        userId: user?.id,
        sessionId: state.sessionId,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Show error in UI
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Starten des Agents';
      console.error('[AgentContext] 🔴 Displaying error to user:', errorMessage);

      setState(prev => ({
        ...prev,
        error: errorMessage,
        phase: 'form'  // Return to form with error message
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
   * BUG-031 FIX: Backend already saves to library_materials with proper UUID
   * This function is now a NO-OP - just logs for UI feedback
   */
  const saveToLibrary = useCallback(async () => {
    if (!state.result || !user) {
      console.warn('[AgentContext] Save to library skipped: No result or user');
      return;
    }

    try {
      console.log('[AgentContext] ✅ Image already saved to library by backend', {
        artifactId: state.result.artifactId,
        libraryId: state.result.metadata?.library_id,
        userId: user.id
      });

      // BUG-031 FIX: Backend already saved to library_materials with proper UUID
      // No need to save again - just return success for UI feedback
      // Backend saves on line 344 of langGraphAgents.ts with db.id()

      console.log('[AgentContext] ✅ Library save confirmed (backend already completed)');
    } catch (error) {
      console.error('[AgentContext] Save to library check failed', error);
      // Don't throw - this is a non-critical operation
    }
  }, [state.result, user]);

  /**
   * Navigate to a specific tab using the provided callback
   * Falls back to window.location if no callback is provided (for backwards compatibility)
   * @param tab - Target tab to navigate to
   * @param options - Optional configuration including sessionId and queryParams
   *
   * T030: Fixed to pass correct tab identifier to App.tsx's handleTabChange
   * CHAT-MESSAGE-FIX: Now passes sessionId to properly load chat history
   */
  const navigateToTab = useCallback((tab: 'home' | 'chat' | 'library', options?: { sessionId?: string, queryParams?: Record<string, string> }) => {
    console.log('[AgentContext] 🔍 navigateToTab CALLED', {
      tab,
      options,
      hasCallback: !!onNavigateToTab,
      callbackType: typeof onNavigateToTab,
      timestamp: new Date().toISOString()
    });
    console.trace('[AgentContext] navigateToTab call stack');

    if (onNavigateToTab) {
      // T030: Use provided callback for SPA navigation (Ionic tabs)
      // This correctly passes the tab identifier ('chat', 'library', 'home') to App.tsx's handleTabChange
      // CHAT-MESSAGE-FIX: Pass sessionId to ensure Chat loads correct session
      console.log(`[AgentContext] ➡️  Calling onNavigateToTab callback with tab: "${tab}" and sessionId: "${options?.sessionId || 'none'}"`);
      onNavigateToTab(tab, options);
      console.log(`[AgentContext] ✅ onNavigateToTab("${tab}") callback completed`);
    } else {
      // Fallback to URL navigation (backwards compatibility)
      console.warn('[AgentContext] No onNavigateToTab callback provided, falling back to window.location');
      const queryParams = options?.queryParams || {};
      const path = `/${tab}${Object.keys(queryParams).length > 0 ? '?' + new URLSearchParams(queryParams).toString() : ''}`;
      window.location.href = path;
    }
  }, [onNavigateToTab]);

  const value: AgentContextValue = {
    state,
    openModal,
    closeModal,
    submitForm,
    cancelExecution,
    saveToLibrary,
    navigateToTab
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