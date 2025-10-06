import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonText
} from '@ionic/react';
import { AgentConfirmationModal } from './AgentConfirmationModal';
import type { AgentConfirmation } from '../lib/types';

/**
 * Test component to debug AgentConfirmationModal
 * This component can be used to manually test the modal functionality
 */
export const TestAgentModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const mockConfirmation: AgentConfirmation = {
    agentId: 'image-generation',
    agentName: 'Bild-Generator',
    action: 'Ein Bild basierend auf Ihrer Beschreibung erstellen',
    context: 'erstelle ein bild von einem löwen',
    estimatedTime: '30-60 Sekunden',
    creditsRequired: 1
  };

  const handleConfirm = () => {
    console.log('✅ TEST: Confirm button clicked');
    alert('Confirm button works!');
    setShowModal(false);
  };

  const handleCancel = () => {
    console.log('❌ TEST: Cancel button clicked');
    alert('Cancel button works!');
    setShowModal(false);
  };

  return (
    <IonCard style={{ margin: '16px' }}>
      <IonCardContent>
        <h2>🔍 Agent Modal Test</h2>
        <IonText>
          <p>This is a test component to debug the AgentConfirmationModal buttons issue.</p>
          <p><strong>Issue:</strong> Modal shows but buttons are not visible/clickable</p>
        </IonText>

        <IonButton
          expand="block"
          onClick={() => {
            console.log('🚀 Opening test modal...');
            setShowModal(true);
          }}
          style={{ marginTop: '16px' }}
        >
          🧪 Open Test Modal
        </IonButton>

        <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          <p><strong>Expected behavior:</strong></p>
          <ul>
            <li>Modal opens with agent details</li>
            <li>Two buttons are visible: "Abbrechen" and "Ja, starten"</li>
            <li>Clicking buttons shows alert and closes modal</li>
          </ul>

          <p><strong>Debug steps:</strong></p>
          <ol>
            <li>Open browser dev tools (F12)</li>
            <li>Click "Open Test Modal" button above</li>
            <li>Inspect the modal element in DOM</li>
            <li>Look for button elements in ".agent-modal-buttons"</li>
            <li>Check CSS display, visibility, z-index</li>
            <li>Try clicking buttons if visible</li>
          </ol>
        </div>

        {/* Test Modal */}
        <AgentConfirmationModal
          isOpen={showModal}
          confirmation={mockConfirmation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default TestAgentModal;