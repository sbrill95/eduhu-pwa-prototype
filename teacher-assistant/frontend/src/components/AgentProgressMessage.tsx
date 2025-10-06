import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonProgressBar,
  IonIcon,
  IonText,
  IonSpinner,
  IonBadge
} from '@ionic/react';
import {
  sparklesOutline,
  cogOutline,
  checkmarkCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import type { AgentProgressMessage as AgentProgressMessageType } from '../lib/types';

interface AgentProgressMessageProps {
  message: AgentProgressMessageType;
}

const AgentProgressMessage: React.FC<AgentProgressMessageProps> = React.memo(({
  message
}) => {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'starting':
        return <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />;
      case 'in-progress':
        return <IonIcon icon={cogOutline} className="ion-spin" style={{ fontSize: '16px' }} />;
      case 'completed':
        return <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '16px', color: 'var(--ion-color-success)' }} />;
      case 'failed':
        return <IonIcon icon={alertCircleOutline} style={{ fontSize: '16px', color: 'var(--ion-color-danger)' }} />;
      default:
        return <IonIcon icon={sparklesOutline} style={{ fontSize: '16px' }} />;
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'starting':
        return '#FFF3E0'; // Light orange as specified
      case 'in-progress':
        return '#FFF3E0'; // Light orange as specified
      case 'completed':
        return '#E8F5E8'; // Light green
      case 'failed':
        return '#FFEBEE'; // Light red
      default:
        return '#FFF3E0'; // Light orange as default
    }
  };

  const getBorderColor = () => {
    switch (message.status) {
      case 'starting':
        return '#FF9800'; // Orange
      case 'in-progress':
        return '#FF9800'; // Orange
      case 'completed':
        return '#4CAF50'; // Success green
      case 'failed':
        return '#F44336'; // Danger red
      default:
        return '#FF9800'; // Orange
    }
  };

  const getStatusText = () => {
    switch (message.status) {
      case 'starting':
        return 'Agent wird gestartet...';
      case 'in-progress':
        return message.statusText || 'Der Agent arbeitet und erstellt dir ein Bild...';
      case 'completed':
        return 'Agent-Aufgabe erfolgreich abgeschlossen!';
      case 'failed':
        return 'Agent-Aufgabe fehlgeschlagen. Bitte versuche es erneut.';
      default:
        return message.statusText || 'Agent-Status unbekannt';
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '12px'
    }}>
      <IonCard style={{
        width: '100%',
        margin: 0,
        backgroundColor: getStatusColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(255, 152, 0, 0.1)'
      }}>
        <IonCardContent style={{ padding: '16px' }}>
          {/* Agent Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {getStatusIcon()}
            <IonText style={{
              fontSize: '14px',
              fontWeight: '600',
              color: getBorderColor()
            }}>
              🎨 {message.agentName}
            </IonText>
            {message.status !== 'completed' && message.status !== 'failed' && (
              <IonBadge
                color={message.status === 'starting' ? 'warning' : 'secondary'}
                style={{ fontSize: '10px', marginLeft: 'auto' }}
              >
                {message.status === 'starting' ? 'STARTET' : 'AKTIV'}
              </IonBadge>
            )}
          </div>

          {/* Status Message */}
          <IonText style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            lineHeight: '1.4',
            color: 'var(--ion-color-dark)'
          }}>
            {getStatusText()}
          </IonText>

          {/* Progress Bar (only for in-progress) */}
          {message.status === 'in-progress' && (
            <div style={{ marginBottom: '12px' }}>
              <IonProgressBar
                value={message.progress ? message.progress / 100 : undefined}
                color="secondary"
                style={{ height: '6px', borderRadius: '3px' }}
              />
              {message.progress && (
                <IonText style={{
                  fontSize: '12px',
                  color: 'var(--ion-color-medium)',
                  marginTop: '4px',
                  display: 'block',
                  textAlign: 'center'
                }}>
                  {message.progress}% abgeschlossen
                </IonText>
              )}
            </div>
          )}

          {/* Detailed Status (if available) */}
          {message.statusText && message.status === 'in-progress' && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <IonText style={{
                fontSize: '12px',
                color: 'var(--ion-color-medium)',
                fontStyle: 'italic'
              }}>
                {message.statusText}
              </IonText>
            </div>
          )}

          {/* Timestamp */}
          <IonText
            color="medium"
            style={{
              display: 'block',
              marginTop: '8px',
              fontSize: '12px',
              textAlign: 'center'
            }}
          >
            {(() => {
              const now = new Date();
              const messageDate = new Date(message.timestamp);
              const diffInMs = now.getTime() - messageDate.getTime();
              const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

              if (diffInMinutes < 1) {
                return 'gerade eben';
              } else if (diffInMinutes < 60) {
                return `vor ${diffInMinutes} Min.`;
              } else {
                const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                return `vor ${diffInHours} Stunde${diffInHours > 1 ? 'n' : ''}`;
              }
            })()}
          </IonText>
        </IonCardContent>
      </IonCard>
    </div>
  );
});

export default AgentProgressMessage;