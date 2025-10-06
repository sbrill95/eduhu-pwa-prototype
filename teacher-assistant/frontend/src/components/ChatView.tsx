import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonCard,
  IonCardContent,
  IonAlert,
  IonSpinner,
  IonButtons
} from '@ionic/react';
import {
  sendOutline,
  addOutline,
  chatbubbleOutline,
  bookOutline,
  createOutline,
  bulbOutline,
  attachOutline,
  closeCircleOutline,
  sparklesOutline,
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../lib/auth-context';
import { useChatSummary } from '../hooks/useChatSummary';
import { useAgent } from '../lib/AgentContext';
import {
  ProgressiveMessage,
  AgentConfirmationMessage,
  AgentProgressMessage,
  AgentResultMessage,
  MaterialPreviewModal
} from './index';
// Legacy modal components - no longer used in chat-integrated flow
// import AgentConfirmationModal from './AgentConfirmationModal';
// import AgentProgressBar from './AgentProgressBar';
import type { ChatMessage as ApiChatMessage } from '../lib/api';
import { apiClient } from '../lib/api';
import { featureFlags } from '../lib/featureFlags';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ChatErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <IonCard style={{
            margin: '16px 0',
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444'
          }}>
            <IonCardContent style={{ padding: '24px' }}>
              <IonIcon
                icon={alertCircleOutline}
                style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}
              />
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#dc2626' }}>
                Chat-Fehler
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#991b1b', lineHeight: '1.4' }}>
                Ein unerwarteter Fehler ist aufgetreten. Dies könnte durch eine Endlosschleife verursacht worden sein.
              </p>
              {this.state.error && (
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#991b1b', fontFamily: 'monospace' }}>
                  Fehlerdetails: {this.state.error.message}
                </p>
              )}
              <IonButton
                color="danger"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
              >
                <IonIcon icon={refreshOutline} slot="start" />
                Seite neu laden
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ChatViewProps {
  sessionId?: string; // Optional: load specific session
  onNewChat?: () => void;
  onSessionChange?: (sessionId: string | null) => void;
  onTabChange?: (tab: 'home' | 'generieren' | 'automatisieren' | 'profil') => void;
  prefilledPrompt?: string | null; // Prefilled prompt from Home screen
  onClearPrefill?: () => void; // Callback to clear prefilled prompt
}

const ChatView: React.FC<ChatViewProps> = React.memo(({
  sessionId,
  onNewChat,
  onSessionChange,
  onTabChange,
  prefilledPrompt,
  onClearPrefill
}) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string, filename: string, size: number, type: string, url?: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // BUG-001 FIX: Track processed prefilled prompts to prevent infinite loop
  const processedPromptRef = useRef<string | null>(null);

  // TASK-009: State for image preview modal
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [selectedImageMaterial, setSelectedImageMaterial] = useState<any>(null);

  // Auth context
  const { user } = useAuth();

  // Agent context for modal-based workflow
  const { openModal } = useAgent();

  // Character limit for messages
  const MAX_CHAR_LIMIT = 400;

  const {
    messages,
    currentSessionId,
    loading,
    error,
    sendMessage,
    newChat,
    loadSession,

    // Agent-related state and functions
    pendingAgentConfirmation,
    agentInProgress,
    agentStatus,
    confirmAgent,
    cancelAgent,
    handleAgentConfirmation,
    clearAgentState,
  } = useChat();

  // FEATURE FLAG: Enable chat summary (backend route now active)
  const ENABLE_CHAT_SUMMARY = true;

  // Auto-generate chat summary (DISABLED due to missing backend route)
  useChatSummary({
    chatId: currentSessionId || '',
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    enabled: ENABLE_CHAT_SUMMARY && !!currentSessionId && !!user
  });

  const validateFile = (file: File): string | null => {
    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Dateityp nicht unterstützt. Erlaubt: JPG, PNG, GIF, PDF, DOCX, DOC, TXT';
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'Datei ist zu groß. Maximum: 10MB';
    }

    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    const files = Array.from(e.target.files);

    try {
      for (const file of files) {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          setUploadError(validationError);
          continue;
        }

        if (file.type.startsWith('image/')) {
          // Handle images for vision API
          const reader = new FileReader();
          reader.onloadend = () => {
            const fileData = {
              id: `file-${Date.now()}-${Math.random()}`,
              filename: file.name,
              size: file.size,
              type: file.type,
              url: reader.result as string
            };
            setUploadedFiles(prev => [...prev, fileData]);
          };
          reader.readAsDataURL(file);
        } else {
          // Handle documents for file upload API
          const result = await apiClient.uploadFile(file);
          const fileData = {
            id: result.id || `file-${Date.now()}`,
            filename: result.filename || file.name,
            size: file.size,
            type: file.type,
            url: result.url
          };
          setUploadedFiles(prev => [...prev, fileData]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Fehler beim Hochladen der Datei. Bitte versuchen Sie es erneut.');
    } finally {
      setIsUploading(false);
      // Reset the input value to allow re-uploading the same file
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug uploadedFiles state changes
  useEffect(() => {
    console.log('uploadedFiles state changed:', uploadedFiles.length, uploadedFiles);
  }, [uploadedFiles]);

  // Load specific session if provided
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      loadSession(sessionId);
      // Clear upload state when switching sessions
      setUploadedFiles([]);
      setUploadError(null);
      setIsUploading(false);
    }
  }, [sessionId, currentSessionId]); // loadSession is stable (only depends on resetState), safe to omit

  // Ensure clean state on component mount
  useEffect(() => {
    console.log('ChatView mounted - clearing upload state');
    setUploadedFiles([]);
    setUploadError(null);
    setIsUploading(false);
  }, []);

  // Notify parent of session changes
  useEffect(() => {
    if (onSessionChange) {
      onSessionChange(currentSessionId);
    }
  }, [currentSessionId]); // onSessionChange is stable useCallback in App.tsx, safe to omit

  // Handle prefilled prompt from Home screen with auto-submit
  // BUG-001 FIX: Use ref to track processed prompts and prevent infinite loop
  useEffect(() => {
    // Only process if we have a new prefilled prompt that hasn't been processed yet
    if (prefilledPrompt && prefilledPrompt !== processedPromptRef.current) {
      console.log('[ChatView] Setting prefilled prompt:', prefilledPrompt);

      // Mark as processed IMMEDIATELY to prevent re-triggers
      processedPromptRef.current = prefilledPrompt;

      setInputValue(prefilledPrompt);

      // AUTO-SUBMIT after brief delay (allow input to render)
      setTimeout(async () => {
        console.log('[ChatView] Auto-submitting prefilled prompt');

        // Validate prompt
        const trimmedPrompt = prefilledPrompt.trim();
        if (!trimmedPrompt) {
          console.warn('[ChatView] Auto-submit skipped: empty prompt');
          processedPromptRef.current = null; // Reset on validation failure
          return;
        }

        if (trimmedPrompt.length > MAX_CHAR_LIMIT) {
          setInputError(`Nachricht ist zu lang (${trimmedPrompt.length}/${MAX_CHAR_LIMIT} Zeichen)`);
          console.warn('[ChatView] Auto-submit skipped: prompt too long');
          processedPromptRef.current = null; // Reset on validation failure
          return;
        }

        // Create message request
        const apiMessages: ApiChatMessage[] = [
          {
            role: 'user' as const,
            content: trimmedPrompt,
          },
        ];

        try {
          await sendMessage(apiMessages);

          // Clear prefilled prompt after successful send
          if (onClearPrefill) {
            onClearPrefill();
          }

          // Clear input (sendMessage already does this in handleSubmit, but be explicit)
          setInputValue('');

          console.log('[ChatView] Auto-submit successful');
        } catch (error) {
          console.error('[ChatView] Auto-submit failed:', error);
          // Reset ref on error to allow retry
          processedPromptRef.current = null;
          // Keep prompt in input on error for manual retry
          setInputError('Automatisches Senden fehlgeschlagen. Bitte erneut versuchen.');
        }
      }, 300); // 300ms delay for smooth UX (not too fast, not too slow)
    } else if (!prefilledPrompt && processedPromptRef.current) {
      // Reset tracking when prefill is cleared from parent
      console.log('[ChatView] Prefill cleared, resetting processed ref');
      processedPromptRef.current = null;
    }
  }, [prefilledPrompt, sendMessage, onClearPrefill]);

  // FEATURE FLAG: Disable profile extraction to prevent 404 errors (BUG-004)
  const ENABLE_PROFILE_EXTRACTION = false;

  // Profile extraction on chat unmount (TASK-016: Profile Redesign Auto-Extraction)
  // Triggers when user leaves chat view with meaningful conversation
  // DISABLED due to missing backend route
  const hasExtractedRef = useRef(false);

  useEffect(() => {
    // Skip if feature disabled
    if (!ENABLE_PROFILE_EXTRACTION) {
      return;
    }

    // Reset extraction flag when session changes
    hasExtractedRef.current = false;

    // Cleanup: Trigger extraction when component unmounts
    return () => {
      // Only extract if:
      // 1. Not already extracted in this session
      // 2. User is authenticated
      // 3. Has active session
      // 4. Has at least 2 messages (meaningful conversation)
      if (
        !hasExtractedRef.current &&
        user?.id &&
        currentSessionId &&
        messages.length >= 2
      ) {
        hasExtractedRef.current = true;

        // Extract profile characteristics in background
        const extractProfile = async () => {
          try {
            console.log('[Profile Extraction] Triggering extraction on unmount', {
              userId: user.id,
              sessionId: currentSessionId,
              messageCount: messages.length
            });

            // Convert messages to API format (first 10 for context)
            const apiMessages = messages.slice(0, 10).map(m => ({
              role: m.role,
              content: m.content
            }));

            await apiClient.post('/profile/extract', {
              userId: user.id,
              messages: apiMessages
            });

            console.log('[Profile Extraction] Extraction successful');
          } catch (error) {
            // Log error but don't block UI or show error to user
            console.error('[Profile Extraction] Failed:', error);
          }
        };

        // Execute in background (non-blocking)
        extractProfile();
      }
    };
  }, [currentSessionId, user?.id, messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setInputError(null);

    console.log('Submit - Current uploadedFiles:', uploadedFiles.length);

    // Validate input
    const trimmedInput = inputValue.trim();

    if (!trimmedInput) {
      setInputError('Nachricht kann nicht leer sein');
      return;
    }

    if (trimmedInput.length > MAX_CHAR_LIMIT) {
      setInputError(`Nachricht ist zu lang (${trimmedInput.length}/${MAX_CHAR_LIMIT} Zeichen)`);
      return;
    }

    if (loading) return;

    const currentMessage = trimmedInput;
    setInputValue('');

    try {
      let messageContent = currentMessage;
      let imageData: string | undefined;

      // Handle files and images
      if (uploadedFiles.length > 0) {
        const imageFiles = uploadedFiles.filter(f => f.type.startsWith('image/'));
        const documentFiles = uploadedFiles.filter(f => !f.type.startsWith('image/'));

        if (imageFiles.length > 0) {
          // For images, keep text separate and pass image data separately
          imageData = imageFiles[0].url; // Use first image for now
          messageContent = currentMessage; // Keep original text, don't stringify with image data
        } else if (documentFiles.length > 0) {
          // For documents, use file IDs (these are small strings, safe for JSON)
          const fileIds = documentFiles.map(f => f.id);
          messageContent = JSON.stringify({
            text: currentMessage,
            fileIds: fileIds,
            filenames: documentFiles.map(f => f.filename)
          });
        }
      }

      // Fresh session approach: Only send the new user message
      // The useChat hook will build the fresh API request with system prompt + current session only
      const apiMessages: ApiChatMessage[] = [
        {
          role: 'user' as const,
          content: messageContent,
        },
      ];

      // Send message (useChat will handle fresh session logic and persistence automatically)
      await sendMessage(apiMessages, imageData);

      // Reset upload state completely - IMMEDIATELY after successful send
      console.log('Clearing uploadedFiles after successful send');
      setUploadedFiles([]);
      setUploadError(null);
      setIsUploading(false);

      // Reset file input to allow re-uploading same files
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear prefilled prompt after successful send
      if (onClearPrefill) {
        onClearPrefill();
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Provide more specific error messages in German
      let errorMessage = 'Nachricht konnte nicht gesendet werden.';
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Zeitüberschreitung. Der Server antwortet nicht. Bitte versuche es erneut.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.';
        } else {
          errorMessage = `Fehler: ${error.message}`;
        }
      }

      setInputError(errorMessage);

      // On error, keep files in upload state so user can retry
      // Do NOT clear uploadedFiles on error
    }
  };

  const handleNewChat = async () => {
    try {
      await newChat();
      setInputValue('');

      // Clear all upload state when starting new chat
      setUploadedFiles([]);
      setUploadError(null);
      setIsUploading(false);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onNewChat) {
        onNewChat();
      }
    } catch (error) {
      console.error('Failed to start new chat:', error);
      // Show user-friendly error for new chat failure
      setInputError('Fehler beim Starten eines neuen Chats. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <div style={{ padding: '16px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Error Display */}
        {error && (
          <IonCard style={{
            margin: '16px 0',
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444'
          }}>
            <IonCardContent style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IonIcon
                  icon={alertCircleOutline}
                  style={{ fontSize: '24px', color: '#ef4444' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                    Fehler beim Senden
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#991b1b', lineHeight: '1.4' }}>
                    {typeof error === 'string' ? error : 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'}
                  </p>
                </div>
                <IonButton
                  fill="clear"
                  size="small"
                  color="medium"
                  onClick={() => window.location.reload()}
                  title="Neu laden"
                >
                  <IonIcon icon={refreshOutline} />
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Legacy modal components removed - now using chat-integrated agent messages */}

        {messages.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', flex: 1 }}>
            <IonIcon
              icon={chatbubbleOutline}
              style={{
                fontSize: '64px',
                color: 'var(--ion-color-primary)',
                marginBottom: '16px',
                opacity: 0.7
              }}
            />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              {user?.email ? `Wollen wir loslegen, ${user.email.split('@')[0]}?` : 'Wollen wir starten?'}
            </h2>
            <IonText color="medium">
              <p>Fragen Sie mich alles über Unterrichtsmaterialien, Stundenplanungen oder pädagogische Ansätze.</p>
            </IonText>

            {/* Suggested prompts - Gemini Orange Icons */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setInputValue('Erstelle mir einen Stundenplan für Mathematik Klasse 7')}
                className="w-full text-left p-4 bg-white border-l-4 border-primary rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IonIcon icon={bookOutline} className="text-xl text-primary" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    Erstelle mir einen Stundenplan für Mathematik Klasse 7
                  </span>
                </div>
              </button>

              <button
                onClick={() => setInputValue('Schlage mir Aktivitäten für den Deutschunterricht vor')}
                className="w-full text-left p-4 bg-white border-l-4 border-primary rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IonIcon icon={createOutline} className="text-xl text-primary" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    Schlage mir Aktivitäten für den Deutschunterricht vor
                  </span>
                </div>
              </button>

              <button
                onClick={() => setInputValue('Wie kann ich schwierige Schüler motivieren?')}
                className="w-full text-left p-4 bg-white border-l-4 border-primary rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IonIcon icon={bulbOutline} className="text-xl text-primary" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    Wie kann ich schwierige Schüler motivieren?
                  </span>
                </div>
              </button>

              <button
                onClick={() => setInputValue('Erstelle ein Bild von einem Löwen für den Biologie-Unterricht')}
                className="w-full text-left p-4 bg-white border-l-4 border-primary rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <IonIcon icon={sparklesOutline} className="text-xl text-primary" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    Erstelle ein Bild von einem Löwen für den Biologie-Unterricht
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, marginBottom: '16px', paddingTop: '80px', paddingBottom: '140px' }}>
            {messages.map((message) => {
              // FIX-002: Check metadata FIRST for agentSuggestion (from InstantDB)
              // DEBUG BUG-003: Enhanced logging to debug agent detection
              console.log('[ChatView BUG-003 DEBUG] Message:', {
                id: message.id,
                role: message.role,
                hasMetadata: !!message.metadata,
                metadataType: typeof message.metadata,
                metadataValue: message.metadata,
                content: message.content?.substring(0, 50) + '...'
              });

              if (message.metadata) {
                try {
                  const metadata = typeof message.metadata === 'string'
                    ? JSON.parse(message.metadata)
                    : message.metadata;

                  console.log('[ChatView BUG-003 DEBUG] Parsed metadata:', metadata);

                  if (metadata.agentSuggestion) {
                    console.log('[ChatView] Found agentSuggestion in metadata:', metadata.agentSuggestion);
                    return (
                      <div key={message.id} className="flex justify-start mb-3">
                        <div className="max-w-[85%]">
                          <AgentConfirmationMessage
                            message={{
                              content: message.content,
                              agentSuggestion: metadata.agentSuggestion
                            }}
                            sessionId={currentSessionId}
                          />
                        </div>
                      </div>
                    );
                  } else {
                    console.log('[ChatView BUG-003 DEBUG] No agentSuggestion in metadata');
                  }
                } catch (e) {
                  console.error('[ChatView] Failed to parse metadata:', e);
                  // Not JSON metadata, continue with regular rendering
                }
              } else {
                console.log('[ChatView BUG-003 DEBUG] No metadata field on message');
              }

              // TASK-003: NEW Interface - Check for agentSuggestion property (direct property from local messages)
              // This supports the simplified Gemini workflow where ChatGPT returns messages with agentSuggestion
              if ('agentSuggestion' in message && (message as any).agentSuggestion) {
                console.log('[ChatView] Found agentSuggestion in message property:', (message as any).agentSuggestion);
                return (
                  <div key={message.id} className="flex justify-start mb-3">
                    <div className="max-w-[85%]">
                      <AgentConfirmationMessage
                        message={{
                          content: message.content,
                          agentSuggestion: (message as any).agentSuggestion
                        }}
                        sessionId={currentSessionId}
                      />
                    </div>
                  </div>
                );
              }

              // Parse message content to check for agent message types first (OLD Interface - JSON)
              let parsedContent: any = null;
              let isAgentMessage = false;
              let agentMessageType: string | null = null;

              try {
                parsedContent = JSON.parse(message.content);
                if (parsedContent.messageType) {
                  isAgentMessage = true;
                  agentMessageType = parsedContent.messageType;
                }
              } catch (e) {
                // Not JSON, use regular message rendering
              }

              // Render agent message components directly (they have their own card styling)
              if (isAgentMessage && parsedContent) {
                switch (agentMessageType) {
                  case 'agent-confirmation':
                    return (
                      <AgentConfirmationMessage
                        key={message.id}
                        message={{
                          ...message,
                          session_id: currentSessionId || '',
                          user_id: user?.id || '',
                          message_index: 0,
                          timestamp: typeof message.timestamp === 'number' ? message.timestamp : message.timestamp.getTime(),
                          messageType: 'agent-confirmation',
                          agentId: parsedContent.agentId,
                          agentName: parsedContent.agentName,
                          agentIcon: parsedContent.agentIcon,
                          agentColor: parsedContent.agentColor,
                          estimatedTime: parsedContent.estimatedTime,
                          creditsRequired: parsedContent.creditsRequired,
                          context: parsedContent.context
                        }}
                        onConfirm={() => {
                          // BUG-001 FIX: Use openModal instead of executeAgent directly
                          console.log('[ChatView] Agent confirmed, opening modal', {
                            agentId: parsedContent.agentId,
                            context: parsedContent.context
                          });

                          // Map agentId to agentType
                          const agentTypeMap: Record<string, string> = {
                            'image-generation': 'image-generation',
                            'langgraph-image-generation': 'image-generation'
                          };

                          const agentType = agentTypeMap[parsedContent.agentId] || 'image-generation';

                          // Open modal with prefill data from context
                          openModal(agentType, {
                            imageContent: parsedContent.context || '',
                            imageStyle: 'realistic'
                          }, currentSessionId || undefined);
                        }}
                        onCancel={() => handleAgentConfirmation(parsedContent.agentId, false)}
                      />
                    );
                  case 'agent-progress':
                    return (
                      <AgentProgressMessage
                        key={message.id}
                        message={{
                          ...message,
                          session_id: currentSessionId || '',
                          user_id: user?.id || '',
                          message_index: 0,
                          timestamp: typeof message.timestamp === 'number' ? message.timestamp : message.timestamp.getTime(),
                          messageType: 'agent-progress',
                          agentId: parsedContent.agentId,
                          agentName: parsedContent.agentName,
                          status: parsedContent.status,
                          progress: parsedContent.progress,
                          statusText: parsedContent.statusText
                        }}
                      />
                    );
                  case 'agent-result':
                    return (
                      <AgentResultMessage
                        key={message.id}
                        message={{
                          id: message.id,
                          content: message.content,
                          agentResult: parsedContent.resultData
                        }}
                        onTabChange={onTabChange}
                      />
                    );
                  default:
                    // Fall through to regular message rendering
                    break;
                }
              }

              // Regular message rendering for non-agent messages
              return (
                <div
                  key={message.id}
                  className={`flex mb-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] px-4 py-3 rounded-2xl shadow-sm
                      ${message.role === 'user'
                        ? 'text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'}
                    `}
                    style={message.role === 'user' ? { backgroundColor: '#FB6542' } : undefined}
                  >
                    <div>
                      {(() => {
                        // Parse message content for files, images, agent results, and text
                        let parsedContent: any = null;
                        let hasImage = false;
                        let hasFiles = false;
                        let hasAgentResult = false;
                        let imageData: string | undefined;
                        let textContent = message.content;
                        let fileAttachments: Array<{id: string, filename: string}> = [];
                        let agentResult: any = null;
                        let agentInfo: any = null;

                        // TASK-009: Check for metadata-based images (new format from backend) with click handler
                        if ('metadata' in message && message.metadata) {
                          console.log('[ChatView] Processing message with metadata:', {
                            messageId: message.id,
                            hasMetadata: true,
                            metadataType: typeof message.metadata,
                            rawMetadata: message.metadata
                          });

                          try {
                            const metadata = typeof message.metadata === 'string'
                              ? JSON.parse(message.metadata)
                              : message.metadata;

                            console.log('[ChatView] Parsed metadata:', metadata);

                            if (metadata.type === 'image' && metadata.image_url) {
                              console.log('[ChatView] ✅ IMAGE DETECTED:', {
                                imageUrl: metadata.image_url,
                                messageContent: message.content,
                                libraryId: metadata.library_id
                              });
                              hasImage = true;
                              imageData = metadata.image_url;
                              // Use message.content as text (e.g., "Ich habe ein Bild für dich erstellt.")
                              textContent = message.content;

                              // TASK-009: Store library_id and metadata for click handler
                              agentResult = {
                                type: 'image',
                                libraryId: metadata.library_id,
                                imageUrl: metadata.image_url,
                                description: metadata.description,
                                imageStyle: metadata.image_style,
                                title: metadata.title
                              };
                            } else {
                              console.log('[ChatView] Metadata does NOT contain image:', {
                                hasType: !!metadata.type,
                                type: metadata.type,
                                hasImageUrl: !!metadata.image_url
                              });
                            }
                          } catch (e) {
                            console.error('[ChatView] Failed to parse message metadata:', e);
                          }
                        } else {
                          // Debug: Log messages WITHOUT metadata
                          if (message.role === 'assistant') {
                            console.log('[ChatView] Assistant message WITHOUT metadata:', {
                              messageId: message.id,
                              content: message.content?.substring(0, 50) + '...'
                            });
                          }
                        }

                        // Fallback: Try parsing content as JSON for legacy format
                        if (!hasImage && !hasFiles && !hasAgentResult) {
                          try {
                            parsedContent = JSON.parse(message.content);
                            if (parsedContent.text) {
                              textContent = parsedContent.text;
                            }
                            // Handle image data (current format)
                            if (parsedContent.image_data) {
                              hasImage = true;
                              imageData = parsedContent.image_data;
                            }
                            // Handle file attachments (document uploads)
                            if (parsedContent.fileIds && parsedContent.filenames) {
                              hasFiles = true;
                              fileAttachments = parsedContent.fileIds.map((id: string, index: number) => ({
                                id,
                                filename: parsedContent.filenames[index] || `File ${index + 1}`
                              }));
                            }
                            // Handle agent results
                            if (parsedContent.agent_result) {
                              hasAgentResult = true;
                              agentResult = parsedContent.agent_result;
                              agentInfo = parsedContent.agent_info;
                            }
                          } catch (e) {
                            // Not JSON, use original content
                          }
                        }

                      return (
                        <>
                          {hasImage && imageData && (
                            <div
                              style={{
                                marginBottom: '8px',
                                cursor: agentResult?.libraryId ? 'pointer' : 'default',
                                maxWidth: '300px'
                              }}
                              onClick={() => {
                                // TASK-009: Open preview modal on click if library_id exists
                                if (agentResult?.libraryId) {
                                  console.log('[ChatView] Image clicked, opening preview modal', {
                                    libraryId: agentResult.libraryId,
                                    imageUrl: agentResult.imageUrl
                                  });

                                  // Create material object for MaterialPreviewModal
                                  const material = {
                                    id: agentResult.libraryId,
                                    title: agentResult.title || 'Generiertes Bild',
                                    description: agentResult.description || '',
                                    type: 'image' as const,
                                    source: 'agent-generated' as const,
                                    created_at: Date.now(),
                                    updated_at: Date.now(),
                                    metadata: {
                                      artifact_data: {
                                        url: agentResult.imageUrl
                                      },
                                      prompt: agentResult.description,
                                      image_style: agentResult.imageStyle
                                    },
                                    is_favorite: false
                                  };

                                  setSelectedImageMaterial(material);
                                  setShowImagePreviewModal(true);
                                }
                              }}
                            >
                              <img
                                src={imageData}
                                alt="Generated image"
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  borderRadius: '8px',
                                  border: '1px solid var(--ion-color-light-shade)',
                                  transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (agentResult?.libraryId) {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                                loading="lazy"
                              />
                              {agentResult?.libraryId && (
                                <div style={{
                                  marginTop: '4px',
                                  fontSize: '12px',
                                  color: 'var(--ion-color-medium)',
                                  textAlign: 'center'
                                }}>
                                  Klicken zum Vergrößern
                                </div>
                              )}
                            </div>
                          )}
                          {hasFiles && fileAttachments.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              {fileAttachments.map((file, index) => (
                                <div key={file.id || index} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 8px',
                                  backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--ion-color-light)',
                                  borderRadius: '6px',
                                  marginBottom: index < fileAttachments.length - 1 ? '4px' : '0'
                                }}>
                                  <IonIcon
                                    icon={attachOutline}
                                    style={{ fontSize: '16px', color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--ion-color-primary)' }}
                                  />
                                  <IonText
                                    color={message.role === 'user' ? 'light' : 'dark'}
                                    style={{ fontSize: '12px', fontWeight: '500' }}
                                  >
                                    {file.filename}
                                  </IonText>
                                </div>
                              ))}
                            </div>
                          )}
                          {hasAgentResult && agentResult && (
                            <div style={{ marginBottom: '8px' }}>
                              {agentResult.type === 'image' && agentResult.content && (
                                <div style={{
                                  border: '2px solid var(--ion-color-secondary)',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{
                                    backgroundColor: 'var(--ion-color-secondary)',
                                    color: 'white',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <IonIcon icon={sparklesOutline} style={{ fontSize: '16px' }} />
                                    KI-generiertes Bild
                                    {agentInfo?.credits_used && (
                                      <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.9 }}>
                                        {agentInfo.credits_used} Credit{agentInfo.credits_used !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <img
                                    src={agentResult.content}
                                    alt="Agent generated image"
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      display: 'block',
                                      maxHeight: '300px',
                                      objectFit: 'contain'
                                    }}
                                  />
                                  {agentResult.metadata && agentResult.metadata.prompt && (
                                    <div style={{
                                      padding: '8px 12px',
                                      backgroundColor: 'var(--ion-color-light)',
                                      fontSize: '12px',
                                      color: 'var(--ion-color-medium)',
                                      borderTop: '1px solid var(--ion-color-light-shade)'
                                    }}>
                                      <strong>Prompt:</strong> {agentResult.metadata.prompt}
                                    </div>
                                  )}
                                </div>
                              )}
                              {agentResult.type === 'text' && (
                                <div style={{
                                  border: '1px solid var(--ion-color-primary)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  backgroundColor: 'var(--ion-color-primary-tint)',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{
                                    fontSize: '12px',
                                    color: 'var(--ion-color-primary)',
                                    fontWeight: '600',
                                    marginBottom: '4px'
                                  }}>
                                    Agent-Ergebnis:
                                  </div>
                                  <div style={{ fontSize: '14px', color: 'var(--ion-color-dark)' }}>
                                    {agentResult.content}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <ProgressiveMessage
                            content={textContent}
                            isComplete={
                              // User messages: always instant
                              message.role === 'user' ||
                              // Messages from database (existing): always instant
                              !message.id.startsWith('temp-') ||
                              // Already animated messages: instant
                              lastMessageId === message.id ||
                              // Not the latest message: instant
                              message.id !== messages[messages.length - 1]?.id
                            }
                            role={message.role}
                            onComplete={() => {
                              if (message.role === 'assistant' && lastMessageId !== message.id) {
                                setLastMessageId(message.id);
                              }
                            }}
                          />
                          <span
                            className={`
                              block mt-1 text-xs
                              ${message.role === 'user' ? 'text-white opacity-80' : 'text-gray-600'}
                            `}
                          >
                            {(() => {
                              const now = new Date();
                              const messageDate = new Date(message.timestamp);
                              const diffInMs = now.getTime() - messageDate.getTime();
                              const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                              const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                              const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

                              if (diffInMinutes < 1) {
                                return 'gerade eben';
                              } else if (diffInMinutes < 60) {
                                return `vor ${diffInMinutes} Min${diffInMinutes > 1 ? '.' : '.'}`;
                              } else if (diffInHours < 24) {
                                if (diffInHours === 1) {
                                  return 'vor 1 Stunde';
                                } else {
                                  return `vor ${diffInHours} Stunden`;
                                }
                              } else if (diffInDays === 1) {
                                return 'gestern';
                              } else if (diffInDays < 7) {
                                return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
                              } else {
                                // Older than a week - show date
                                return messageDate.toLocaleDateString('de-DE', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: diffInDays > 365 ? 'numeric' : undefined
                                });
                              }
                            })()}
                          </span>
                        </>
                      );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start mb-3">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md shadow-sm bg-white border border-gray-200 text-center">
                  <IonSpinner name="dots" color="medium" />
                  <p className="mt-2 text-xs text-gray-600">
                    eduhu tippt...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Area - Fixed at bottom above tab bar */}
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          padding: '16px',
          borderTop: '1px solid var(--ion-color-light-shade)',
          zIndex: 100
        }}>
          {/* Uploaded files preview - only show when files are uploaded and not yet sent */}
          {uploadedFiles.length > 0 && !loading && (
            <div style={{
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid var(--ion-color-light-shade)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginBottom: '8px', fontWeight: '500' }}>
                📎 Angehängte Dateien (werden mit der nächsten Nachricht gesendet):
              </div>
              {uploadedFiles.map((file, index) => (
                <div key={file.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  border: '1px solid var(--ion-color-light-shade)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <IonIcon
                      icon={attachOutline}
                      style={{ fontSize: '24px', color: 'var(--ion-color-primary)' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <IonText style={{ fontSize: '14px', fontWeight: '500' }}>
                      {file.filename}
                    </IonText>
                    <IonText color="medium" style={{ display: 'block', fontSize: '12px' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </IonText>
                  </div>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                  >
                    <IonIcon icon={closeCircleOutline} color="danger" />
                  </IonButton>
                </div>
              ))}
            </div>
          )}

          {/* Upload error display */}
          {uploadError && (
            <div style={{ marginBottom: '8px' }}>
              <IonText color="danger" style={{ fontSize: '12px' }}>
                {uploadError}
              </IonText>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '12px',
              width: '100%'
            }}>
              {/* Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || isUploading}
                title="Datei anhängen"
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: loading || isUploading ? 'not-allowed' : 'pointer',
                  opacity: loading || isUploading ? 0.5 : 1,
                  transition: 'all 200ms',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => !loading && !isUploading && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              >
                {isUploading ? (
                  <IonSpinner name="crescent" style={{ width: '20px', height: '20px' }} />
                ) : (
                  <IonIcon icon={attachOutline} style={{ fontSize: '20px', color: '#374151' }} />
                )}
              </button>

              {/* Input Field */}
              <div style={{
                flex: 1,
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                overflow: 'hidden',
                minWidth: 0
              }}>
                <IonInput
                  value={inputValue}
                  onIonInput={(e) => {
                    const newValue = e.detail.value!;
                    setInputValue(newValue);
                    // Clear error when user starts typing
                    if (inputError) {
                      setInputError(null);
                    }
                  }}
                  placeholder="Nachricht schreiben..."
                  disabled={loading}
                  style={{
                    '--padding-start': '16px',
                    '--padding-end': '16px',
                    '--padding-top': '12px',
                    '--padding-bottom': '12px'
                  }}
                  maxlength={MAX_CHAR_LIMIT}
                />
              </div>

              {/* Send Button - Gemini Style Orange */}
              <button
                type="submit"
                disabled={!inputValue.trim() || loading || inputValue.trim().length > MAX_CHAR_LIMIT}
                className="min-w-[44px] min-h-[44px] w-14 h-12 flex items-center justify-center rounded-xl border-none shadow-sm transition-all flex-shrink-0"
                style={{
                  backgroundColor: inputValue.trim() && !loading && inputValue.trim().length <= MAX_CHAR_LIMIT
                    ? '#FB6542'
                    : '#f3f4f6',
                  cursor: inputValue.trim() && !loading && inputValue.trim().length <= MAX_CHAR_LIMIT
                    ? 'pointer'
                    : 'not-allowed'
                }}
              >
                <IonIcon
                  icon={sendOutline}
                  style={{
                    fontSize: '20px',
                    color: inputValue.trim() && !loading && inputValue.trim().length <= MAX_CHAR_LIMIT ? '#ffffff' : '#9ca3af'
                  }}
                />
              </button>
            </div>
          </form>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            id="file-input"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Character Counter and Error Messages */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: '12px'
          }}>
            <div>
              {inputError && (
                <IonText color="danger">
                  <p style={{ margin: 0 }}>{inputError}</p>
                </IonText>
              )}
            </div>
            <IonText color={inputValue.length > MAX_CHAR_LIMIT ? 'danger' : 'medium'}>
              <p style={{ margin: 0 }}>
                {inputValue.length}/{MAX_CHAR_LIMIT}
              </p>
            </IonText>
          </div>
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />

        {/* Floating Plus Button for New Chat */}
        <button
          onClick={handleNewChat}
          className="fixed z-50 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            backgroundColor: '#FB6542',
            bottom: 'calc(160px + 1rem)',
            right: '1rem'
          }}
          title="Neuer Chat"
        >
          <IonIcon icon={addOutline} className="text-2xl text-white" />
        </button>

        {/* TASK-009: Image Preview Modal */}
        {showImagePreviewModal && selectedImageMaterial && (
          <MaterialPreviewModal
            material={selectedImageMaterial}
            isOpen={showImagePreviewModal}
            onClose={() => {
              setShowImagePreviewModal(false);
              setSelectedImageMaterial(null);
            }}
          />
        )}
      </div>
  );
});

export default ChatView;