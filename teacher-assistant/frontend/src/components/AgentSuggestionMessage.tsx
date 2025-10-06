import React from 'react';
import { IonButton, IonCard, IonIcon } from '@ionic/react';
import { sparkles } from 'ionicons/icons';
import { useAgent } from '../lib/AgentContext';

interface AgentSuggestionMessageProps {
  message: {
    id: string;
    content: string;
    agentSuggestion?: {
      agentType: 'image-generation';
      reasoning: string;
      prefillData: {
        prompt: string;
        style?: string;
        aspectRatio?: string;
        quality?: string;
      };
    };
  };
  sessionId?: string;
}

export const AgentSuggestionMessage: React.FC<AgentSuggestionMessageProps> = ({
  message,
  sessionId
}) => {
  const { openModal } = useAgent();

  const handleAccept = () => {
    if (!message.agentSuggestion) return;

    console.log('[AgentSuggestionMessage] User accepted agent suggestion', {
      agentType: message.agentSuggestion.agentType,
      prompt: message.agentSuggestion.prefillData.prompt
    });

    openModal(
      message.agentSuggestion.agentType,
      message.agentSuggestion.prefillData,
      sessionId
    );
  };

  if (!message.agentSuggestion) {
    // Regular message without agent suggestion
    return (
      <div className="mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Message with agent suggestion
  return (
    <div className="mb-4 space-y-3">
      {/* Regular message content */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* Agent suggestion card */}
      <IonCard className="m-0 overflow-hidden">
        <div className="bg-gradient-to-br from-[#FB6542]/10 to-[#FFBB00]/10 border-2 border-primary/20 rounded-2xl p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FB6542] to-[#FFBB00] flex items-center justify-center">
                <IonIcon icon={sparkles} className="text-white text-xl" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                💡 Bildgenerator vorschlagen
              </p>
              <p className="text-sm text-gray-700">
                {message.agentSuggestion.reasoning}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white/60 rounded-xl p-3 mb-3">
            <p className="text-xs text-gray-600 mb-1 font-medium">Vorschau:</p>
            <p className="text-sm text-gray-800 italic">
              "{message.agentSuggestion.prefillData.prompt}"
            </p>
          </div>

          {/* CTA Button */}
          <IonButton
            expand="block"
            onClick={handleAccept}
            className="h-11 font-medium"
            style={{
              '--background': '#FB6542',
              '--background-hover': '#E85A36',
              '--background-activated': '#D14F2F'
            }}
          >
            <IonIcon icon={sparkles} slot="start" />
            Ja, Bild erstellen
          </IonButton>
        </div>
      </IonCard>
    </div>
  );
};