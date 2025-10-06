import React, { useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useAgent } from '../../lib/AgentContext';

/**
 * Generieren Page - Opens Gemini Agent Modal on mount
 *
 * This page is essentially a modal trigger that opens the AgentModal
 * with the "form" mode to allow users to generate materials.
 *
 * Navigation flow:
 * 1. User clicks "Generieren" tab
 * 2. This component mounts
 * 3. useEffect triggers modal opening
 * 4. Modal shows Gemini form
 * 5. When modal closes, tab remains on "Generieren"
 */
const Generieren: React.FC = () => {
  const { openModal, state } = useAgent();

  useEffect(() => {
    console.log('[Generieren] Component mounted, isModalOpen:', state.isOpen);

    // Open modal on mount if not already open
    if (!state.isOpen) {
      console.log('[Generieren] Opening Agent Modal');

      openModal(
        'image-generation',
        {}, // Empty prefill - user will fill form manually
        undefined // No session ID
      );
    }
  }, [state.isOpen, openModal]);

  // This page doesn't render any visible content
  // The AgentModal is rendered globally by AgentContext
  return (
    <IonPage>
      <IonContent className="bg-gray-50">
        {/* Empty - Modal is rendered globally */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Generieren;
