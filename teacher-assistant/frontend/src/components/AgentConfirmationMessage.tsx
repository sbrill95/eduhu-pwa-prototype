import React from 'react';
import { useAgent } from '../lib/AgentContext';

/**
 * AgentConfirmationMessage Component (NEW - Gemini Design)
 *
 * Displays a confirmation prompt in the chat when the AI suggests using an agent.
 * Shows a gradient card with agent details and a confirmation button.
 *
 * This is the NEW simplified interface for TASK-001 (Image Generation Modal - Gemini).
 * The OLD interface (onConfirm/onCancel props) is still supported for backward compatibility.
 *
 * @example NEW Interface (TASK-001):
 * <AgentConfirmationMessage
 *   message={{
 *     content: "Ich kann ein Bild zum Satz des Pythagoras erstellen.",
 *     agentSuggestion: {
 *       agentType: 'image-generation',
 *       reasoning: 'Ein visuelles Bild hilft beim Verständnis des Satzes.',
 *       prefillData: { theme: 'Satz des Pythagoras', learningGroup: 'Klasse 8a' }
 *     }
 *   }}
 * />
 *
 * @example OLD Interface (backward compatibility):
 * <AgentConfirmationMessage
 *   message={{
 *     id: '123',
 *     content: 'Möchten Sie den Bildgenerierungs-Agent starten?',
 *     agentId: 'image-gen',
 *     agentName: 'Bildgenerierung',
 *     agentIcon: '🎨',
 *     agentColor: '#FB6542',
 *     context: 'Satz des Pythagoras',
 *     ...
 *   }}
 *   onConfirm={(agentId) => console.log('Confirmed:', agentId)}
 *   onCancel={(agentId) => console.log('Cancelled:', agentId)}
 * />
 */

// Import shared types
import type { AgentSuggestion } from '../lib/types';

// NEW Interface (TASK-001 - Simplified)
interface NewAgentConfirmationMessageProps {
  message: {
    content: string;
    agentSuggestion?: AgentSuggestion;
  };
  sessionId?: string | null; // Add sessionId support
}

// OLD Interface (backward compatibility)
import type { AgentConfirmationMessage as AgentConfirmationMessageType } from '../lib/types';
interface OldAgentConfirmationMessageProps {
  message: AgentConfirmationMessageType;
  onConfirm: (agentId: string) => void;
  onCancel: (agentId: string) => void;
}

type AgentConfirmationMessageProps =
  | NewAgentConfirmationMessageProps
  | OldAgentConfirmationMessageProps;

// Type guard
function isOldInterface(
  props: AgentConfirmationMessageProps
): props is OldAgentConfirmationMessageProps {
  return 'onConfirm' in props && 'onCancel' in props;
}

const AgentConfirmationMessage: React.FC<AgentConfirmationMessageProps> = (props) => {
  const { openModal } = useAgent();

  // OLD Interface Rendering (backward compatibility)
  if (isOldInterface(props)) {
    const { message, onConfirm, onCancel } = props;
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '12px'
        }}
      >
        <div
          data-testid="agent-confirmation-card"
          className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-500 rounded-2xl p-4 shadow-lg"
          style={{
            width: '100%',
            margin: 0
          }}
        >
          {/* OLD UI - Updated with orange gradient styling for better contrast */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FB6542',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              {message.agentIcon}
            </div>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}
              >
                {message.agentName}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6b7280'
                }}
              >
                KI-Agent verfügbar
              </p>
            </div>
          </div>

          <div
            data-testid="agent-reasoning"
            style={{
              backgroundColor: 'rgba(251, 101, 66, 0.08)',
              border: '1px solid rgba(251, 101, 66, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}
          >
            <p style={{ fontSize: '14px', color: '#374151', fontStyle: 'italic', margin: 0 }}>
              "{message.context}"
            </p>
          </div>

          <p
            style={{
              display: 'block',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.4'
            }}
          >
            Ich kann dir dabei helfen! Möchtest du den {message.agentName} starten?
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              data-testid="agent-confirm-button"
              onClick={() => onConfirm(message.agentId)}
              className="flex-1 h-14 bg-primary-600 ring-2 ring-white ring-offset-2 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200"
              aria-label={`${message.agentName} Agent starten`}
            >
              {message.agentIcon} Ja, Agent starten
            </button>

            <button
              data-testid="agent-skip-button"
              onClick={() => onCancel(message.agentId)}
              className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 text-sm sm:text-base"
              aria-label="Agent-Bestätigung ablehnen und Konversation fortsetzen"
            >
              ❌ Nein, Konversation fortsetzen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NEW Interface Rendering (TASK-001 - Gemini Design)
  const { message, sessionId } = props;

  // If no agent suggestion, render as normal text message
  if (!message.agentSuggestion) {
    return (
      <div className="text-sm leading-relaxed text-gray-800">
        {message.content}
      </div>
    );
  }

  const handleConfirm = () => {
    console.log('[AgentConfirmationMessage] User confirmed agent:', {
      agentType: message.agentSuggestion!.agentType,
      prefillData: message.agentSuggestion!.prefillData,
      sessionId
    });

    openModal(
      message.agentSuggestion!.agentType,
      message.agentSuggestion!.prefillData,
      sessionId || undefined
    );
  };

  const handleCancel = () => {
    console.log('[AgentConfirmationMessage] User cancelled agent suggestion, continuing chat');
    // No action needed - user continues chatting normally
  };

  return (
    <div className="mb-4">
      {/* Assistant's message text (if exists) */}
      {message.content && (
        <p className="text-sm leading-relaxed text-gray-800 mb-3">
          {message.content}
        </p>
      )}

      {/* Orange Gradient Card with Agent Confirmation */}
      <div
        data-testid="agent-confirmation-card"
        className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-500 rounded-2xl p-4 shadow-lg"
      >
        {/* Reasoning Text */}
        <p data-testid="agent-reasoning" className="text-sm text-gray-700 mb-3">
          {message.agentSuggestion.reasoning}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Confirm Button - Start Agent (PRIMARY - TOP/LEFT) */}
          <button
            data-testid="agent-confirm-button"
            onClick={handleConfirm}
            className="flex-1 h-14 bg-primary-600 ring-2 ring-white ring-offset-2 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200"
            aria-label="Bild-Generierung starten"
          >
            Bild-Generierung starten
          </button>

          {/* Cancel Button - Continue Chat (SECONDARY - BOTTOM/RIGHT) */}
          <button
            data-testid="agent-skip-button"
            onClick={handleCancel}
            className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 text-sm sm:text-base"
            aria-label="Weiter im Chat"
          >
            Weiter im Chat 💬
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfirmationMessage;