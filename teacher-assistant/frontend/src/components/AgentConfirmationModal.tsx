import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  IonButtons,
  IonItem,
  IonLabel
} from '@ionic/react';
import {
  sparklesOutline,
  timeOutline,
  diamondOutline,
  informationCircleOutline,
  closeOutline,
  brushOutline,
  documentTextOutline,
  bulbOutline
} from 'ionicons/icons';
import type { AgentConfirmation } from '../lib/types';

interface AgentConfirmationModalProps {
  isOpen: boolean;
  confirmation: AgentConfirmation | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal component for agent execution confirmation
 * Shows agent details, estimated time, and credit cost to user
 * Enhanced with beautiful design and agent-specific styling
 */
export const AgentConfirmationModal: React.FC<AgentConfirmationModalProps> = ({
  isOpen,
  confirmation,
  onConfirm,
  onCancel
}) => {

  if (!confirmation) {
    return null;
  }

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'image-generation':
        return brushOutline;
      case 'document-generation':
        return documentTextOutline;
      case 'lesson-planner':
        return bulbOutline;
      default:
        return sparklesOutline;
    }
  };

  const getAgentColor = (agentId: string) => {
    switch (agentId) {
      case 'image-generation':
        return '#3B82F6'; // Blue
      case 'document-generation':
        return '#10B981'; // Green
      case 'lesson-planner':
        return '#F59E0B'; // Orange/Yellow
      default:
        return '#FB6542'; // App accent orange
    }
  };

  const getAgentEmoji = (agentId: string) => {
    switch (agentId) {
      case 'image-generation':
        return '🎨';
      case 'document-generation':
        return '📄';
      case 'lesson-planner':
        return '💡';
      default:
        return '🤖';
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel} className="agent-confirmation-modal">
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Agent bestätigen</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onCancel}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="agent-modal-content" style={{ padding: '20px' }}>
          {/* Agent Header Card */}
          <IonCard style={{
            marginBottom: '20px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <IonCardContent style={{ padding: '24px' }}>
              <div className="agent-modal-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div className="agent-modal-icon" style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: getAgentColor(confirmation.agentId),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  flexShrink: 0
                }}>
                  {getAgentEmoji(confirmation.agentId)}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    margin: '0 0 4px 0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>
                    {confirmation.agentName}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {confirmation.action}
                  </p>
                </div>
              </div>

              {/* Context Display */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <IonText>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057'
                  }}>
                    Kontext:
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#212529',
                    fontStyle: 'italic',
                    lineHeight: '1.4'
                  }}>
                    "{confirmation.context}"
                  </p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Details Card */}
          <IonCard style={{
            marginBottom: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <IonCardContent style={{ padding: '20px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a1a1a'
              }}>
                Details
              </h3>

              {confirmation.estimatedTime && (
                <IonItem lines="none" style={{
                  '--padding-start': '0px',
                  '--inner-padding-end': '0px'
                }}>
                  <IonIcon
                    icon={timeOutline}
                    color="medium"
                    style={{ marginRight: '12px' }}
                  />
                  <IonLabel>
                    <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '500' }}>
                      Geschätzte Zeit
                    </h4>
                    <p style={{ margin: '0', fontSize: '14px', color: getAgentColor(confirmation.agentId) }}>
                      {confirmation.estimatedTime}
                    </p>
                  </IonLabel>
                </IonItem>
              )}

              {confirmation.creditsRequired && (
                <IonItem lines="none" style={{
                  '--padding-start': '0px',
                  '--inner-padding-end': '0px'
                }}>
                  <IonIcon
                    icon={diamondOutline}
                    color="medium"
                    style={{ marginRight: '12px' }}
                  />
                  <IonLabel>
                    <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '500' }}>
                      Credits benötigt
                    </h4>
                    <p style={{ margin: '0', fontSize: '14px', color: getAgentColor(confirmation.agentId) }}>
                      {confirmation.creditsRequired}
                    </p>
                  </IonLabel>
                </IonItem>
              )}
            </IonCardContent>
          </IonCard>

          {/* Action Buttons */}
          <div
            className="agent-modal-buttons"
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '20px',
              padding: '20px 0'
            }}
          >

            <IonButton
              fill="outline"
              expand="block"
              size="large"
              onClick={onCancel}
              style={{
                flex: 1,
                borderRadius: '12px',
                height: '48px',
                fontWeight: '600'
              }}
            >
              Abbrechen
            </IonButton>

            <IonButton
              expand="block"
              size="large"
              onClick={onConfirm}
              style={{
                flex: 2,
                borderRadius: '12px',
                height: '48px',
                fontWeight: '600',
                '--background': getAgentColor(confirmation.agentId),
                '--color': '#ffffff'
              }}
            >
              <IonIcon icon={getAgentIcon(confirmation.agentId)} style={{ marginRight: '8px' }} />
              Ja, starten
            </IonButton>
          </div>

        </div>
      </IonContent>
    </IonModal>
  );
};


export default AgentConfirmationModal;