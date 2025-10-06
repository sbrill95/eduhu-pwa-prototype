import React, { useState } from 'react';
import { IonButton, IonCard, IonIcon, IonModal } from '@ionic/react';
import { checkmarkCircle, downloadOutline, libraryOutline, closeOutline } from 'ionicons/icons';

interface AgentResultMessageProps {
  message: {
    id: string;
    content: string;
    agentResult?: {
      artifactId: string;
      agentType: 'image-generation';
      data: {
        imageUrl: string;
        title?: string;
      };
      metadata?: {
        revisedPrompt?: string;
        cost?: number;
      };
    };
  };
  onTabChange?: (tab: 'home' | 'generieren' | 'automatisieren' | 'profil') => void;
}

export const AgentResultMessage: React.FC<AgentResultMessageProps> = ({ message, onTabChange }) => {
  const [showFullscreen, setShowFullscreen] = useState(false);

  if (!message.agentResult) {
    // Regular message without agent result
    return (
      <div className="mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      console.log('[AgentResultMessage] Downloading image');

      // FIX: TypeScript - Check agentResult exists before accessing nested properties
      // This prevents "possibly undefined" errors when accessing agentResult.data or agentResult.artifactId
      if (!message.agentResult) {
        console.error('[AgentResultMessage] No agent result available');
        return;
      }

      const response = await fetch(message.agentResult.data.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eduhu-image-${message.agentResult.artifactId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[AgentResultMessage] Download failed', error);
      alert('Download fehlgeschlagen');
    }
  };

  const handleOpenLibrary = () => {
    console.log('[AgentResultMessage] Opening library - now navigating to automatisieren');
    if (onTabChange) {
      // Library is now part of Automatisieren tab
      onTabChange('automatisieren');
    }
  };

  const handleThumbnailClick = () => {
    console.log('[AgentResultMessage] Opening fullscreen view');
    setShowFullscreen(true);
  };

  return (
    <>
      <div className="mb-4 space-y-3">
        {/* Regular message content */}
        {message.content && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Agent result card */}
        <IonCard className="m-0">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
            {/* Success Header */}
            <div className="flex items-center gap-2 mb-3">
              <IonIcon icon={checkmarkCircle} className="text-green-600 text-2xl" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Bild erfolgreich erstellt
                </p>
                <p className="text-xs text-gray-600">
                  Automatisch in deiner Bibliothek gespeichert
                </p>
              </div>
            </div>

            {/* Image Thumbnail */}
            <button
              onClick={handleThumbnailClick}
              className="w-full rounded-xl overflow-hidden mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-transform active:scale-95"
            >
              {/* FIX: TypeScript - Use optional chaining to safely access potentially undefined agentResult */}
              <img
                src={message.agentResult?.data.imageUrl || ''}
                alt={message.agentResult?.data.title || 'Generiertes Bild'}
                className="w-full h-auto max-h-64 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                }}
              />
            </button>

            {/* Metadata */}
            {message.agentResult.metadata?.revisedPrompt && (
              <div className="bg-white/60 rounded-lg p-2 mb-3">
                <p className="text-xs text-gray-600 font-medium mb-1">Prompt:</p>
                <p className="text-xs text-gray-800">
                  {message.agentResult.metadata.revisedPrompt}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <IonButton
                fill="outline"
                size="small"
                onClick={handleOpenLibrary}
                className="flex-1"
              >
                <IonIcon icon={libraryOutline} slot="start" />
                Bibliothek
              </IonButton>
              <IonButton
                fill="outline"
                size="small"
                onClick={handleDownload}
                className="flex-1"
              >
                <IonIcon icon={downloadOutline} slot="start" />
                Download
              </IonButton>
            </div>
          </div>
        </IonCard>
      </div>

      {/* Fullscreen Image Modal */}
      <IonModal
        isOpen={showFullscreen}
        onDidDismiss={() => setShowFullscreen(false)}
        className="fullscreen-image-modal"
      >
        <div className="relative h-full bg-black flex items-center justify-center">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Schließen"
          >
            <IonIcon icon={closeOutline} className="text-white text-2xl" />
          </button>
          <img
            src={message.agentResult.data.imageUrl}
            alt="Vollbild"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </IonModal>
    </>
  );
};