import React from 'react';
import { IonIcon } from '@ionic/react';
import { sparklesOutline } from 'ionicons/icons';
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
          style={{
            width: '100%',
            margin: 0,
            backgroundColor: '#E3F2FD',
            border: '1px solid #BBDEFB',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(33, 150, 243, 0.1)',
            padding: '16px'
          }}
        >
          {/* OLD UI - Keep existing implementation for backward compatibility */}
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
                backgroundColor: message.agentColor || '#2196F3',
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
                  color: '#1565C0'
                }}
              >
                {message.agentName}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#1976D2'
                }}
              >
                KI-Agent verfügbar
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}
          >
            <p style={{ fontSize: '14px', color: '#0D47A1', fontStyle: 'italic', margin: 0 }}>
              "{message.context}"
            </p>
          </div>

          <p
            style={{
              display: 'block',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#1565C0',
              lineHeight: '1.4'
            }}
          >
            Ich kann dir dabei helfen! Möchtest du den {message.agentName} starten?
          </p>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => onConfirm(message.agentId)}
              style={{
                flex: '1',
                minWidth: '140px',
                height: '44px',
                borderRadius: '8px',
                padding: '0 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              aria-label={`${message.agentName} Agent starten`}
            >
              {message.agentIcon} Ja, Agent starten
            </button>

            <button
              onClick={() => onCancel(message.agentId)}
              style={{
                flex: '1',
                minWidth: '140px',
                height: '44px',
                borderRadius: '8px',
                padding: '0 16px',
                backgroundColor: 'transparent',
                color: '#757575',
                border: '1px solid #BDBDBD',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
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

  return (
    <div className="bg-gradient-to-r from-primary-50 to-background-teal/30 rounded-2xl p-4 border border-primary-100">
      {/* Assistant's message text */}
      <p className="text-sm leading-relaxed text-gray-800 mb-3">
        {message.content}
      </p>

      {/* Confirmation Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        {/* Agent Info Section */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <IonIcon icon={sparklesOutline} className="text-primary-500 text-xl" />
          </div>

          {/* Text Content */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1 text-sm">Bildgenerierung</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {message.agentSuggestion.reasoning}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Confirm Button - Start Agent (PRIMARY - LEFT) */}
          <button
            onClick={handleConfirm}
            className="flex-1 min-h-[48px] font-bold py-3 px-4 rounded-xl hover:opacity-90 active:opacity-80 transition-opacity duration-200 text-base shadow-md"
            style={{ fontSize: '16px', fontWeight: '700', backgroundColor: '#FB6542', color: '#FFFFFF' }}
            aria-label="Bild-Generierung starten"
          >
            Bild-Generierung starten ✨
          </button>

          {/* Cancel Button - Continue Chat (SECONDARY - RIGHT) */}
          <button
            onClick={() => {
              console.log('[AgentConfirmationMessage] User cancelled agent, continuing chat');
              // No action needed - user can just continue typing in chat
            }}
            className="flex-1 min-h-[48px] bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 text-base"
            style={{ fontSize: '16px', fontWeight: '600' }}
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