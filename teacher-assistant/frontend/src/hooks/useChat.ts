import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { id } from '@instantdb/react';
import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';
import { useChat as useApiChat } from './useApi';
import { useTeacherProfile } from './useTeacherProfile';
import { useAgents } from './useAgents';
import type { ChatMessage as ApiChatMessage } from '../lib/api';
import type {
  ChatSession,
  ChatMessage,
  ConversationSummary,
  TeacherProfile,
  AgentConfirmation,
  AgentStatus,
  AgentResult,
  AgentConfirmationMessage,
  AgentProgressMessage,
  AgentResultMessage,
  AgentSuggestion
} from '../lib/types';
import { useStableData } from './useDeepCompareMemo';

/**
 * Build system prompt based on teacher profile
 */
const buildSystemPrompt = (profile: TeacherProfile | null): string => {
  let basePrompt = `Du bist ein KI-Assistent für Lehrkräfte. Du hilfst bei der Unterrichtsplanung, der Erstellung von Lernmaterialien und pädagogischen Fragen.

Antworte immer auf Deutsch und sei praktisch, konstruktiv und lösungsorientiert. Berücksichtige verschiedene Lerntypen und moderne pädagogische Ansätze.

WICHTIGE AGENTEN-FUNKTIONEN:
Du hast Zugang zu einem Bildgenerierungs-Agent, der hochwertige Bilder für den Unterricht erstellen kann.

Wenn ein Benutzer um Bilder, Illustrationen, Grafiken oder visuelle Materialien bittet, schlage proaktiv vor, dass du ein passendes Bild erstellen kannst. Beispielwörter, die eine Bildgenerierung auslösen können:
- "Erstelle ein Bild von..."
- "Zeige mir ein Bild..."
- "Ich brauche eine Illustration..."
- "Kannst du ein Diagramm erstellen..."
- "Zeichne mir..."
- "Visualisiere..."
- "Ich hätte gern ein Poster..."
- "Mach mir ein Arbeitsblatt mit..."

Erkläre dem Benutzer, dass du professionelle Bilder für den Unterricht erstellen kannst, und frage nach spezifischen Details für die Bildgenerierung.`;

  if (profile) {
    basePrompt += `\n\nLehrkraft-Profil:`;

    if (profile.subjects && profile.subjects.length > 0) {
      basePrompt += `\n- Unterrichtsfächer: ${profile.subjects.join(', ')}`;
    }

    if (profile.grades && profile.grades.length > 0) {
      basePrompt += `\n- Klassenstufen: ${profile.grades.join(', ')}`;
    }

    if (profile.school_type) {
      const schoolTypeMap = {
        'elementary': 'Grundschule',
        'secondary': 'Weiterführende Schule',
        'university': 'Universität/Hochschule',
        'vocational': 'Berufsschule'
      };
      basePrompt += `\n- Schultyp: ${schoolTypeMap[profile.school_type] || profile.school_type}`;
    }

    if (profile.teaching_methods && profile.teaching_methods.length > 0) {
      basePrompt += `\n- Bevorzugte Methoden: ${profile.teaching_methods.join(', ')}`;
    }

    if (profile.topics && profile.topics.length > 0) {
      basePrompt += `\n- Häufige Themen: ${profile.topics.slice(0, 8).join(', ')}`;
    }

    if (profile.challenges && profile.challenges.length > 0) {
      basePrompt += `\n- Bekannte Herausforderungen: ${profile.challenges.slice(0, 5).join(', ')}`;
    }

    basePrompt += `\n\nBerücksichtige dieses Profil bei deinen Antworten und schlage passende, personalisierte Lösungen vor.`;
  }

  return basePrompt;
};

/**
 * Custom hook for managing chat sessions with InstantDB persistence
 * Features: Fresh sessions, profile-based prompts, automatic knowledge extraction
 *
 * FIX: Uses useStableData to prevent infinite loops from InstantDB query reference changes
 */
export const useChat = () => {
  const { user } = useAuth();
  const { sendMessage: sendApiMessage, loading: apiLoading, error: apiError, resetState } = useApiChat();
  const {
    profile,
    loading: profileLoading,
    extractFromConversation,
    error: profileError
  } = useTeacherProfile();
  const {
    detectAgentContext,
    createConfirmation,
    executeAgent,
    pollStatus,
    getResult,
    clearExecution,
    currentExecution,
    isAgentAvailable
  } = useAgents();

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    agentSuggestion?: AgentSuggestion; // BUG-011 FIX: Include agentSuggestion for deduplication logic (uses shared type from backend)
  }>>([]);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Agent-related state - NEW CHAT-INTEGRATED APPROACH
  const [pendingAgentConfirmation, setPendingAgentConfirmation] = useState<{
    confirmation: AgentConfirmation;
    userInput: string;
    originalMessages: ApiChatMessage[];
    imageData?: string;
    confirmationMessageId?: string; // Track the confirmation message
  } | null>(null);
  const [agentInProgress, setAgentInProgress] = useState<{
    executionId: string;
    agentId: string;
    userInput: string;
    progressMessageId?: string; // Track the progress message
  } | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);

  // Query current session messages - moved above useEffect to fix hoisting issue
  const sessionQuery = useMemo(() =>
    currentSessionId && user ? {
      messages: {
        $: {
          where: {
            session_id: currentSessionId,
            user_id: user.id
          }
        }
      }
    } : null,
    [currentSessionId, user?.id]
  );

  const { data: sessionData, error: sessionError } = db.useQuery(sessionQuery);

  // DEBUG BUG-003: Log InstantDB query results to verify metadata field
  useEffect(() => {
    console.log('[useChat CHAT-MESSAGE-DEBUG] Query executed:', {
      hasQuery: !!sessionQuery,
      currentSessionId,
      userId: user?.id,
      hasData: !!sessionData,
      hasMessages: !!sessionData?.messages,
      messageCount: sessionData?.messages?.length || 0,
      error: sessionError
    });

    if (sessionData?.messages) {
      console.log('[useChat BUG-003 DEBUG] InstantDB query returned messages:', {
        count: sessionData.messages.length,
        allMessages: sessionData.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content.substring(0, 50),
          session_id: m.session_id,
          timestamp: m.timestamp
        })),
        sampleMessage: sessionData.messages[0] ? {
          id: sessionData.messages[0].id,
          role: sessionData.messages[0].role,
          hasMetadata: 'metadata' in sessionData.messages[0],
          metadataValue: sessionData.messages[0].metadata,
          allKeys: Object.keys(sessionData.messages[0])
        } : 'No messages'
      });
    } else {
      console.log('[useChat CHAT-MESSAGE-DEBUG] NO messages returned from query', {
        sessionData,
        sessionError
      });
    }
  }, [sessionData, currentSessionId, user?.id, sessionError]);

  // FIX: Stabilize sessionData to prevent infinite loops
  // InstantDB returns NEW object references on every render even if data unchanged
  const stableSessionData = useStableData(sessionData);

  // FIX FOR BUG-010: Stabilize the messages array separately
  // Property access (stableSessionData?.messages) returns a NEW array reference each time
  // even though the parent object is stable. We need to stabilize the array itself.
  const stableMessages = useStableData(stableSessionData?.messages);

  // Add a ref to track the last processed session data
  const lastProcessedMessages = useRef<any[]>([]);
  const processedMessagesSyncCount = useRef<number>(0);

  // Use useMemo instead of useEffect for derived state to prevent infinite loops
  // Simplified local messages (just return as-is, filtering happens in messages() function later)

  // Optimized circuit breaker - only triggers for genuine infinite loops (30+ renders in 5 seconds)
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const isCircuitBreakerActive = useRef(false);

  // REMOVED: Circuit breaker logic was causing infinite render loop
  // The useEffect without dependencies triggered on every render, creating the very problem it was meant to detect
  // Proper solution: Fix actual render loop causes (useCallback dependencies, etc.) instead of trying to detect them

  // FIX FOR BUG-010: Stabilize localMessages array to prevent infinite loops
  // localMessages is an array with NEW reference on every state change
  // Must stabilize it for use in useMemo/useCallback dependencies
  const stableLocalMessages = useStableData(localMessages);
  const safeLocalMessages = stableLocalMessages;

  // Get all user sessions for chat history - memoized to prevent unnecessary re-queries
  // FIX: TypeScript - order values must be Direction type ('asc' | 'desc'), not string
  const sessionsQuery = useMemo(() =>
    user ? {
      chat_sessions: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' as const } // Type: Direction = 'asc' | 'desc'
        }
      }
    } : null, [user?.id]
  );

  const { data: sessionsData, error: sessionsError } = db.useQuery(sessionsQuery);

  // Create a new chat session - stable dependencies
  const createSession = useCallback(async (title?: string) => {
    if (!user) {
      throw new Error('User must be authenticated to create a session');
    }

    const sessionId = id();
    const now = Date.now();

    try {
      await db.transact([
        db.tx.chat_sessions[sessionId].update({
          title: title || 'New Chat',
          user_id: user.id,
          created_at: now,
          updated_at: now,
          is_archived: false,
          message_count: 0,
        })
      ]);

      setCurrentSessionId(sessionId);
      setLocalMessages([]);
      return sessionId;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw error;
    }
  }, [user?.id]);

  // Save a message to the current session - stable dependencies
  const saveMessage = useCallback(async (
    content: string,
    role: 'user' | 'assistant',
    messageIndex: number
  ) => {
    if (!user || !currentSessionId) {
      throw new Error('Session must be active to save messages');
    }

    const messageId = id();
    const now = Date.now();

    try {
      await db.transact([
        // Add the message
        db.tx.messages[messageId].update({
          session_id: currentSessionId,
          user_id: user.id,
          content,
          role,
          timestamp: now,
          message_index: messageIndex,
        }),
        // Update session timestamp and message count
        db.tx.chat_sessions[currentSessionId].update({
          updated_at: now,
          message_count: messageIndex + 1,
        })
      ]);

      return messageId;
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }, [user?.id, currentSessionId]);

  // Save a message to a specific session (with session ID parameter) - stable dependencies
  const saveMessageToSession = useCallback(async (
    sessionId: string,
    content: string,
    role: 'user' | 'assistant',
    messageIndex: number,
    metadata?: string // Optional metadata parameter for agentSuggestion, image info, etc.
  ) => {
    if (!user || !sessionId) {
      throw new Error('User and session must be active to save messages');
    }

    const messageId = id();
    const now = Date.now();

    try {
      await db.transact([
        // Add the message
        db.tx.messages[messageId].update({
          session_id: sessionId,
          user_id: user.id,
          content,
          role,
          timestamp: now,
          message_index: messageIndex,
          ...(metadata && { metadata }) // Include metadata if provided (e.g., agentSuggestion, image info)
        }),
        // Update session timestamp and message count
        db.tx.chat_sessions[sessionId].update({
          updated_at: now,
          message_count: messageIndex + 1,
        })
      ]);

      return messageId;
    } catch (error) {
      console.error('Failed to save message to session:', error);
      throw error;
    }
  }, [user?.id]);

  // Helper functions to create agent messages
  const createAgentConfirmationMessage = useCallback((
    agentId: string,
    agentName: string,
    context: string,
    estimatedTime?: string,
    creditsRequired?: number
  ): AgentConfirmationMessage => {
    const timestamp = Date.now();
    return {
      id: `agent-confirmation-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      session_id: currentSessionId || 'temp',
      user_id: user?.id || 'temp',
      content: context,
      role: 'assistant',
      timestamp,
      message_index: 0, // Will be updated when saved
      messageType: 'agent-confirmation',
      agentId,
      agentName,
      agentIcon: '🎨', // Default for image generator
      agentColor: 'var(--ion-color-secondary)',
      estimatedTime,
      creditsRequired,
      context
    };
  }, [currentSessionId, user]);

  const createAgentProgressMessage = useCallback((
    agentId: string,
    agentName: string,
    status: 'starting' | 'in-progress' | 'completed' | 'failed',
    statusText: string,
    progress?: number
  ): AgentProgressMessage => {
    const timestamp = Date.now();
    return {
      id: `agent-progress-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      session_id: currentSessionId || 'temp',
      user_id: user?.id || 'temp',
      content: statusText,
      role: 'assistant',
      timestamp,
      message_index: 0, // Will be updated when saved
      messageType: 'agent-progress',
      agentId,
      agentName,
      status,
      progress,
      statusText
    };
  }, [currentSessionId, user]);

  const createAgentResultMessage = useCallback((
    agentId: string,
    agentName: string,
    resultType: 'image' | 'document' | 'text',
    resultData: {
      imageUrl?: string;
      downloadUrl?: string;
      fileName?: string;
      description?: string;
    }
  ): AgentResultMessage => {
    const timestamp = Date.now();
    return {
      id: `agent-result-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      session_id: currentSessionId || 'temp',
      user_id: user?.id || 'temp',
      content: resultData.description || 'Agent result',
      role: 'assistant',
      timestamp,
      message_index: 0, // Will be updated when saved
      messageType: 'agent-result',
      agentId,
      agentName,
      resultType,
      resultData
    };
  }, [currentSessionId, user]);

  // Agent confirmation handlers - NEW CHAT-INTEGRATED APPROACH
  const confirmAgent = useCallback(async () => {
    if (!pendingAgentConfirmation) return;

    try {
      const { confirmation, userInput } = pendingAgentConfirmation;

      // Create session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createSession();
      }

      // Create and add progress message to chat
      const progressMessage = createAgentProgressMessage(
        confirmation.agentId,
        confirmation.agentName,
        'starting',
        'Agent wird gestartet...'
      );

      // Add progress message to local state
      setLocalMessages(prev => [...prev, {
        id: progressMessage.id,
        role: progressMessage.role,
        content: JSON.stringify({
          messageType: 'agent-progress',
          agentId: progressMessage.agentId,
          agentName: progressMessage.agentName,
          status: progressMessage.status,
          progress: progressMessage.progress,
          statusText: progressMessage.statusText
        }),
        timestamp: new Date(progressMessage.timestamp)
      }]);

      // Save progress message to database
      const messageIndex = (stableMessages || []).length + safeLocalMessages.length;
      await saveMessageToSession(
        sessionId,
        JSON.stringify({
          messageType: 'agent-progress',
          agentId: progressMessage.agentId,
          agentName: progressMessage.agentName,
          status: progressMessage.status,
          progress: progressMessage.progress,
          statusText: progressMessage.statusText
        }),
        'assistant',
        messageIndex
      );

      // Execute the agent
      const response = await executeAgent(
        confirmation.agentId,
        userInput,
        sessionId
      );

      // Set agent in progress state
      setAgentInProgress({
        executionId: response.executionId,
        agentId: confirmation.agentId,
        userInput,
        progressMessageId: progressMessage.id
      });

      // Clear pending confirmation
      setPendingAgentConfirmation(null);

      // Start polling for status updates
      startAgentStatusPolling(response.executionId);

    } catch (error) {
      console.error('Failed to execute agent:', error);

      // Create error progress message
      if (pendingAgentConfirmation) {
        const errorMessage = createAgentProgressMessage(
          pendingAgentConfirmation.confirmation.agentId,
          pendingAgentConfirmation.confirmation.agentName,
          'failed',
          'Fehler beim Starten des Agents. Bitte versuchen Sie es erneut.'
        );

        setLocalMessages(prev => [...prev, {
          id: errorMessage.id,
          role: errorMessage.role,
          content: JSON.stringify({
            messageType: 'agent-progress',
            agentId: errorMessage.agentId,
            agentName: errorMessage.agentName,
            status: errorMessage.status,
            statusText: errorMessage.statusText
          }),
          timestamp: new Date(errorMessage.timestamp)
        }]);
      }

      setPendingAgentConfirmation(null);
      throw error;
    }
  }, [pendingAgentConfirmation, executeAgent, currentSessionId, createAgentProgressMessage, stableMessages, saveMessageToSession]);

  const cancelAgent = useCallback(() => {
    if (pendingAgentConfirmation) {
      // Create cancellation message
      const cancellationMessage = createAgentProgressMessage(
        pendingAgentConfirmation.confirmation.agentId,
        pendingAgentConfirmation.confirmation.agentName,
        'failed',
        'Agent-Ausführung abgebrochen. Konversation wird fortgesetzt...'
      );

      setLocalMessages(prev => [...prev, {
        id: cancellationMessage.id,
        role: cancellationMessage.role,
        content: JSON.stringify({
          messageType: 'agent-progress',
          agentId: cancellationMessage.agentId,
          agentName: cancellationMessage.agentName,
          status: cancellationMessage.status,
          statusText: cancellationMessage.statusText
        }),
        timestamp: new Date(cancellationMessage.timestamp)
      }]);
    }

    setPendingAgentConfirmation(null);
  }, [pendingAgentConfirmation, createAgentProgressMessage]);

  // New function to handle agent confirmation from chat message buttons
  const handleAgentConfirmation = useCallback(async (agentId: string, confirm: boolean) => {
    if (!pendingAgentConfirmation || pendingAgentConfirmation.confirmation.agentId !== agentId) {
      console.warn('No matching pending confirmation found');
      return;
    }

    if (confirm) {
      await confirmAgent();
    } else {
      cancelAgent();
    }
  }, [pendingAgentConfirmation, confirmAgent, cancelAgent]);

  // Agent status polling
  const startAgentStatusPolling = useCallback((executionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await pollStatus();
        if (status) {
          setAgentStatus(status);

          // Stop polling when completed or failed
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);

            // Handle completion
            if (status.status === 'completed') {
              await handleAgentCompletion(executionId);
            } else {
              // Handle failure
              setAgentInProgress(null);
            }
          }
        }
      } catch (error) {
        console.error('Failed to poll agent status:', error);
        clearInterval(pollInterval);
        setAgentInProgress(null);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 5 minutes maximum
    setTimeout(() => {
      clearInterval(pollInterval);
      if (agentInProgress) {
        console.warn('Agent polling timed out');
        setAgentInProgress(null);
      }
    }, 5 * 60 * 1000);
  }, [pollStatus, agentInProgress]);

  // Handle agent completion - integrate result into chat with NEW RESULT MESSAGE
  const handleAgentCompletion = useCallback(async (executionId: string) => {
    try {
      const result = await getResult(executionId);
      if (!result || !agentInProgress) return;

      // Create agent result message
      let resultData: {
        imageUrl?: string;
        downloadUrl?: string;
        fileName?: string;
        description?: string;
      } = {};

      let resultType: 'image' | 'document' | 'text' = 'text';

      if (result.result?.type === 'image') {
        resultType = 'image';
        resultData = {
          imageUrl: result.result.content,
          downloadUrl: result.result.content,
          fileName: `agent-image-${Date.now()}.png`,
          description: `Hier ist das erstellte Bild basierend auf Ihrer Beschreibung: "${agentInProgress.userInput}"`
        };
      } else if (result.result?.type === 'document') {
        resultType = 'document';
        resultData = {
          downloadUrl: result.result.content,
          fileName: result.result.metadata?.filename || `agent-document-${Date.now()}.pdf`,
          description: 'Dokument erfolgreich erstellt'
        };
      } else {
        resultType = 'text';
        resultData = {
          description: result.result?.content || 'Aufgabe erfolgreich abgeschlossen!'
        };
      }

      const resultMessage = createAgentResultMessage(
        result.agentId,
        agentInProgress.userInput.includes('Bild') ? 'Bild-Generator' : 'Agent',
        resultType,
        resultData
      );

      // Add result message to local state
      setLocalMessages(prev => [...prev, {
        id: resultMessage.id,
        role: resultMessage.role,
        content: JSON.stringify({
          messageType: 'agent-result',
          agentId: resultMessage.agentId,
          agentName: resultMessage.agentName,
          resultType: resultMessage.resultType,
          resultData: resultMessage.resultData
        }),
        timestamp: new Date(resultMessage.timestamp)
      }]);

      // Save result message to database
      const messageIndex = (stableMessages || []).length + safeLocalMessages.length;

      // Ensure we have an active session
      if (!currentSessionId) {
        console.warn('No active session for agent result, skipping database save');
        setAgentInProgress(null);
        return;
      }

      await saveMessageToSession(
        currentSessionId,
        JSON.stringify({
          messageType: 'agent-result',
          agentId: resultMessage.agentId,
          agentName: resultMessage.agentName,
          resultType: resultMessage.resultType,
          resultData: resultMessage.resultData
        }),
        'assistant',
        messageIndex
      );

      // Save to library if applicable
      if (result.artifacts && result.artifacts.length > 0) {
        // TODO: Implement library saving for agent artifacts
        console.log('Agent artifacts ready for library:', result.artifacts);
      }

      // Clear agent state
      setAgentInProgress(null);
      setAgentStatus(null);
      clearExecution();

    } catch (error) {
      console.error('Failed to handle agent completion:', error);

      // Create error result message
      if (agentInProgress) {
        const errorMessage = createAgentProgressMessage(
          agentInProgress.agentId,
          'Agent',
          'failed',
          'Fehler beim Verarbeiten des Ergebnisses. Bitte versuchen Sie es erneut.'
        );

        setLocalMessages(prev => [...prev, {
          id: errorMessage.id,
          role: errorMessage.role,
          content: JSON.stringify({
            messageType: 'agent-progress',
            agentId: errorMessage.agentId,
            agentName: errorMessage.agentName,
            status: errorMessage.status,
            statusText: errorMessage.statusText
          }),
          timestamp: new Date(errorMessage.timestamp)
        }]);
      }

      setAgentInProgress(null);
      setAgentStatus(null);
    }
  }, [getResult, agentInProgress, createAgentResultMessage, createAgentProgressMessage, stableMessages, saveMessageToSession, clearExecution, currentSessionId]);

  // Send message with fresh session approach and profile-based prompts
  const sendMessage = useCallback(async (messages: ApiChatMessage[], imageData?: string, skipAgentDetection = false) => {
    if (!user) {
      throw new Error('User must be authenticated to send messages');
    }

    const userMessage = messages[messages.length - 1];

    // FEATURE FLAG: Disable OLD agent detection in favor of backend agentSuggestion
    const useBackendAgentDetection = true; // Set to false to re-enable OLD detection

    // Agent context detection (only for user messages, not file uploads)
    if (!useBackendAgentDetection && !skipAgentDetection && !imageData && userMessage.role === 'user') {
      try {
        const agentContext = detectAgentContext(userMessage.content);

        if (agentContext.detected && agentContext.agentId && isAgentAvailable(agentContext.agentId)) {
          const confirmation = createConfirmation(agentContext.agentId, userMessage.content);

          if (confirmation) {
            console.log('Agent confirmation created successfully:', confirmation);

            // Create session if none exists and ensure it's active
            let sessionId = currentSessionId;
            if (!sessionId) {
              sessionId = await createSession();
              // Wait for session to be fully created before proceeding
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Ensure session is ready before proceeding
            if (!sessionId) {
              throw new Error('Failed to create or get active session');
            }

            // Add user message first
            const messageIndex = (stableMessages || []).length + safeLocalMessages.length;
            const userTimestamp = new Date();
            const tempUserMessage = {
              id: `temp-user-${userTimestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
              role: 'user' as const,
              content: userMessage.content,
              timestamp: userTimestamp,
            };

            setLocalMessages(prev => [...prev, tempUserMessage]);
            await saveMessageToSession(sessionId, userMessage.content, 'user', messageIndex);

            // Create and add agent confirmation message
            const confirmationMessage = createAgentConfirmationMessage(
              confirmation.agentId,
              confirmation.agentName,
              userMessage.content,
              confirmation.estimatedTime,
              confirmation.creditsRequired
            );

            setLocalMessages(prev => [...prev, {
              id: confirmationMessage.id,
              role: confirmationMessage.role,
              content: JSON.stringify({
                messageType: 'agent-confirmation',
                agentId: confirmationMessage.agentId,
                agentName: confirmationMessage.agentName,
                agentIcon: confirmationMessage.agentIcon,
                agentColor: confirmationMessage.agentColor,
                estimatedTime: confirmationMessage.estimatedTime,
                creditsRequired: confirmationMessage.creditsRequired,
                context: confirmationMessage.context
              }),
              timestamp: new Date(confirmationMessage.timestamp)
            }]);

            // Save confirmation message to database (with session validation)
            try {
              await saveMessageToSession(
                sessionId,
                JSON.stringify({
                  messageType: 'agent-confirmation',
                  agentId: confirmationMessage.agentId,
                  agentName: confirmationMessage.agentName,
                  agentIcon: confirmationMessage.agentIcon,
                  agentColor: confirmationMessage.agentColor,
                  estimatedTime: confirmationMessage.estimatedTime,
                  creditsRequired: confirmationMessage.creditsRequired,
                  context: confirmationMessage.context
                }),
                'assistant',
                messageIndex + 1
              );
            } catch (saveError) {
              console.error('Failed to save agent confirmation message:', saveError);
              // Continue with flow even if save fails, but clear the confirmation
              setPendingAgentConfirmation(null);
              throw new Error('Session must be active to save messages');
            }

            // Store pending confirmation
            setPendingAgentConfirmation({
              confirmation,
              userInput: userMessage.content,
              originalMessages: messages,
              imageData,
              confirmationMessageId: confirmationMessage.id
            });

            // Return immediately - agent confirmation is now in chat
            return {
              message: `Agent confirmation message added to chat`,
              agent_confirmation_created: true
            };
          } else {
            console.warn('Failed to create agent confirmation');
          }
        }
      } catch (error) {
        console.error('Error in agent detection:', error);
        // Continue with normal chat flow if agent detection fails
      }
    }

    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createSession();
    }

    // Calculate message index based on existing messages (database + local)
    const currentMessages = stableMessages || [];
    const messageIndex = currentMessages.length + safeLocalMessages.length;

    // Prepare message content for persistence (include image data if present)
    let persistedMessageContent = userMessage.content;
    if (imageData) {
      // For images, save the complete message with image data for history display
      try {
        const existingData = JSON.parse(userMessage.content);
        persistedMessageContent = JSON.stringify({
          ...existingData,
          image_data: imageData
        });
      } catch (e) {
        // Not JSON, create new structure
        persistedMessageContent = JSON.stringify({
          text: userMessage.content,
          image_data: imageData
        });
      }
    }

    // Create user message with unique ID and proper timestamp
    const timestamp = new Date();
    const tempUserMessage = {
      id: `temp-user-${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user' as const,
      content: persistedMessageContent,
      timestamp,
    };

    // Update local messages with user message immediately for UI responsiveness
    setLocalMessages(prev => {
      // Optimized duplicate check - avoid complex timestamp comparisons
      const exists = prev.some(msg =>
        msg.id === tempUserMessage.id ||
        (msg.content === tempUserMessage.content && msg.role === tempUserMessage.role)
      );

      if (exists) {
        console.warn('Prevented duplicate user message');
        return prev;
      }

      console.log('Adding user message to local state');
      return [...prev, tempUserMessage];
    });

    try {
      // Build fresh API request with only system prompt + current conversation
      // Include ALL messages from current session (DB + Local) for proper context
      const systemPrompt = buildSystemPrompt(profile);

      // Get all messages BEFORE the new user message (which is the last one)
      // The `messages` variable combines DB messages + local messages correctly
      const allPreviousMessages = messages.slice(0, -1);

      console.log('[BUG-017 FIX] Context for API:', {
        totalMessages: messages.length,
        previousMessages: allPreviousMessages.length,
        dbMessages: stableMessages?.length || 0,
        localMessages: safeLocalMessages.length
      });

      const freshMessages: ApiChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        // FIX BUG-017: Use ALL messages (DB + Local) for proper context when continuing Library chats
        // Previously only used safeLocalMessages which is empty when loading from Library
        // TASK B.4: Add image awareness - enrich messages with image metadata for AI context
        ...allPreviousMessages.map(msg => {
          let content = msg.content;

          // Check if message has image metadata (from InstantDB)
          if ('metadata' in msg && msg.metadata) {
            try {
              const metadata = typeof msg.metadata === 'string'
                ? JSON.parse(msg.metadata)
                : msg.metadata;

              // If it's an image message, enhance content with image info for AI
              if (metadata.type === 'image' && metadata.image_url) {
                content = `[Generated Image: ${metadata.image_url}]\n${msg.content}`;
                if (metadata.revised_prompt || metadata.description) {
                  content += `\n(Image Description: "${metadata.revised_prompt || metadata.description}")`;
                }
              }
            } catch (e) {
              // Not JSON metadata or parse error - use original content
              console.warn('[useChat] Failed to parse message metadata for image awareness:', e);
            }
          }

          return {
            role: msg.role,
            content,
          };
        }),
        // Add the current user message
        {
          role: 'user',
          content: userMessage.content,
        }
      ];

      // Send to API with fresh session context
      const response = await sendApiMessage({ messages: freshMessages, image_data: imageData });

      if (!response || !response.message) {
        throw new Error('Invalid response from API - no message content');
      }

      // FIX-001: Check if backend returned agentSuggestion (NEW Gemini format)
      if (response.agentSuggestion) {
        console.log('[useChat] Backend returned agentSuggestion', response.agentSuggestion);

        // Create assistant response with unique ID and proper timestamp
        const assistantTimestamp = new Date();
        const assistantMessage = {
          id: `temp-assistant-${assistantTimestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant' as const,
          content: response.message,
          timestamp: assistantTimestamp,
          agentSuggestion: response.agentSuggestion, // Pass through agentSuggestion to message
        };

        // Update local messages with assistant response
        setLocalMessages(prev => {
          const exists = prev.some(msg =>
            msg.id === assistantMessage.id ||
            (msg.content === assistantMessage.content && msg.role === assistantMessage.role)
          );

          if (exists) {
            console.warn('Prevented duplicate assistant message');
            return prev;
          }

          console.log('Adding assistant message with agentSuggestion to local state');
          return [...prev, assistantMessage];
        });

        // Save both messages to database
        try {
          // Save user message first
          await saveMessageToSession(sessionId, persistedMessageContent, 'user', messageIndex);

          // Save assistant message with agentSuggestion as metadata
          const metadataString = JSON.stringify({ agentSuggestion: response.agentSuggestion });
          console.log('[useChat BUG-003 DEBUG] Saving assistant message with metadata:', {
            sessionId,
            messageIndex: messageIndex + 1,
            metadataString,
            metadataParsed: JSON.parse(metadataString)
          });

          await saveMessageToSession(
            sessionId,
            response.message,
            'assistant',
            messageIndex + 1,
            metadataString // Save agentSuggestion in metadata
          );

          console.log('[useChat BUG-003 DEBUG] Messages with agentSuggestion saved to InstantDB');
        } catch (error) {
          console.error('[useChat BUG-003 DEBUG] Failed to save messages with agentSuggestion:', error);
        }

        // SKIP old client-side agent detection - backend already did it
        return {
          message: assistantMessage,
          agent_confirmation_created: true
        };
      }

      // Create assistant response with unique ID and proper timestamp (normal flow without agentSuggestion)
      const assistantTimestamp = new Date();
      const assistantMessage = {
        id: `temp-assistant-${assistantTimestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant' as const,
        content: response.message,
        timestamp: assistantTimestamp,
      };

      // Update local messages with assistant response
      setLocalMessages(prev => {
        // Optimized duplicate check - avoid complex timestamp comparisons
        const exists = prev.some(msg =>
          msg.id === assistantMessage.id ||
          (msg.content === assistantMessage.content && msg.role === assistantMessage.role)
        );

        if (exists) {
          console.warn('Prevented duplicate assistant message');
          return prev;
        }

        console.log('Adding assistant message to local state');
        return [...prev, assistantMessage];
      });

      // Save both messages to database with proper ordering
      try {
        // Save user message first
        await saveMessageToSession(sessionId, persistedMessageContent, 'user', messageIndex);
        // Save assistant message second
        await saveMessageToSession(sessionId, response.message, 'assistant', messageIndex + 1);
      } catch (saveError) {
        console.error('Failed to save messages to database:', saveError);
        // Continue with the flow - messages are still in local state
      }

      // Update session title if this is the first message
      if (messageIndex === 0 && sessionId) {
        const title = userMessage.content.length > 50
          ? userMessage.content.substring(0, 47) + '...'
          : userMessage.content;

        await db.transact([
          db.tx.chat_sessions[sessionId].update({ title })
        ]);
      }

      // Update message count for extraction trigger
      const newMessageCount = messageIndex + 2;
      setSessionMessageCount(newMessageCount);

      // Trigger knowledge extraction after 5+ messages or when conversation seems to end
      if (newMessageCount >= 6 && newMessageCount % 6 === 0) {
        // Extract knowledge in background (don't await to avoid blocking UI)
        setTimeout(async () => {
          try {
            // Convert local messages to full ChatMessage format for extraction
            const fullMessages = [...safeLocalMessages, tempUserMessage, assistantMessage].map((msg, index) => ({
              id: msg.id,
              session_id: sessionId || 'temp',
              user_id: user.id,
              content: msg.content,
              role: msg.role,
              timestamp: msg.timestamp.getTime(),
              message_index: index,
            }));
            await extractFromConversation(fullMessages);
            console.log('Knowledge extraction completed automatically');
          } catch (err) {
            console.error('Background knowledge extraction failed:', err);
          }
        }, 1000);
      }

      return response;
    } catch (error) {
      console.error('Error in sendMessage:', error);

      // Clean up local state on error - remove any temporary messages
      setLocalMessages(prev =>
        prev.filter(msg =>
          msg.id !== tempUserMessage.id &&
          !msg.id.startsWith('temp-assistant-')
        )
      );

      // If the error occurred after API call succeeded but before database save,
      // we still have the response but failed to persist - let user know
      if (error instanceof Error) {
        console.error('Send message failed:', error.message);
      }

      throw error;
    }
  }, [
    user?.id,
    currentSessionId,
    stableMessages,
    createSession,
    saveMessageToSession,
    sendApiMessage,
    profile,
    extractFromConversation,
    detectAgentContext,
    isAgentAvailable,
    createConfirmation
  ]);

  // Load a specific session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoadingSession(true);

      // Clear current state first
      setLocalMessages([]);
      setSessionMessageCount(0);
      resetState();

      // Set new session ID (this will trigger database query)
      setCurrentSessionId(sessionId);

      console.log(`Loaded session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to load session:', error);
      throw error;
    } finally {
      // Allow a brief moment for database query to complete
      setTimeout(() => setIsLoadingSession(false), 500);
    }
  }, [resetState]);

  // Start a new chat (clear current session) and trigger knowledge extraction
  const newChat = useCallback(async () => {
    // If there's a current session with meaningful conversation, extract knowledge
    if (localMessages.length >= 4) {
      try {
        // Convert local messages to full ChatMessage format for extraction
        const fullMessages = localMessages.map((msg, index) => ({
          id: msg.id,
          session_id: currentSessionId || 'temp',
          user_id: user?.id || 'temp',
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp.getTime(),
          message_index: index,
        }));
        await extractFromConversation(fullMessages);
        console.log('Knowledge extracted before starting new chat');
      } catch (err) {
        console.error('Failed to extract knowledge before new chat:', err);
      }
    }

    // Reset to fresh state
    setCurrentSessionId(null);
    setLocalMessages([]);
    setSessionMessageCount(0);
    resetState();
  }, [extractFromConversation, resetState]); // Fixed: Removed localMessages.length, currentSessionId, user?.id - we READ them, not react to them

  // Memoized messages computation to prevent excessive re-renders
  const messages = useMemo(() => {

    // Always prioritize chronological order by timestamp, not messageIndex
    const allMessages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
      source: 'database' | 'local';
      metadata?: string; // BUG-003 FIX: Optional metadata field for agentSuggestion
      agentSuggestion?: any; // BUG-003 FIX: For local messages with direct agentSuggestion property
    }> = [];

    // Add database messages (using stable reference)
    if (stableMessages && stableMessages.length > 0) {
      const dbMessages = stableMessages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        source: 'database' as const,
        // BUG-003 FIX: Include metadata field so AgentConfirmationMessage can detect agentSuggestion
        ...(msg.metadata && { metadata: msg.metadata }),
      }));
      allMessages.push(...dbMessages);
    }

    // BUG-011 FIX: Optimized deduplication that preserves local messages with agentSuggestion
    // Issue: Local messages with agentSuggestion were being filtered out in favor of DB messages
    // with metadata strings, causing AgentConfirmationMessage to not render
    const uniqueLocalMessages = safeLocalMessages.filter(localMsg => {
      const matchingDbIndex = allMessages.findIndex(existingMsg => {
        return existingMsg.content === localMsg.content &&
               existingMsg.role === localMsg.role;
      });

      // If local message has agentSuggestion, keep it even if DB match exists
      // (local message has richer data structure than DB metadata string)
      if (localMsg.agentSuggestion && matchingDbIndex !== -1) {
        // Remove the DB version and keep the local version with agentSuggestion
        allMessages.splice(matchingDbIndex, 1);
        return true; // Keep local message
      }

      // Otherwise, only keep local messages that don't have a DB match
      return matchingDbIndex === -1;
    });

    // Add unique local messages
    uniqueLocalMessages.forEach(msg => {
      allMessages.push({
        ...msg,
        source: 'local' as const,
      });
    });

    // Sort all messages by timestamp to ensure proper chronological order
    return allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [stableMessages, stableLocalMessages]); // FIX BUG-010: Use stable reference

  // Get conversation history
  const conversationHistory: ConversationSummary[] = sessionsData?.chat_sessions
    ? sessionsData.chat_sessions.map((session: any) => ({
        id: session.id,
        title: session.title,
        lastMessage: '', // We'd need to query the last message separately
        lastMessageTime: new Date(session.updated_at),
        messageCount: session.message_count,
        isArchived: session.is_archived,
      }))
    : [];

  return {
    messages,
    conversationHistory,
    currentSessionId,
    profile,
    loading: apiLoading || profileLoading || isLoadingSession,
    error: apiError || sessionError || sessionsError || profileError,
    sendMessage,
    createSession,
    loadSession,
    newChat,
    resetState,
    extractFromConversation, // Expose for manual extraction if needed

    // Agent-related state and functions
    pendingAgentConfirmation,
    agentInProgress,
    agentStatus,
    confirmAgent,
    cancelAgent,
    handleAgentConfirmation, // NEW: Handle agent confirmation from chat buttons
    clearAgentState: useCallback(() => {
      setPendingAgentConfirmation(null);
      setAgentInProgress(null);
      setAgentStatus(null);
      clearExecution();
    }, [clearExecution]),
  };
};

export default useChat;