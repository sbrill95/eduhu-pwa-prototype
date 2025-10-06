import React, { useEffect, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonProgressBar,
  IonText,
  IonIcon,
  IonSpinner,
  IonButton,
  IonBadge
} from '@ionic/react';
import {
  sparklesOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  closeCircleOutline,
  refreshOutline,
  brushOutline,
  documentTextOutline,
  bulbOutline,
  timeOutline
} from 'ionicons/icons';
import type { AgentStatus } from '../lib/types';

interface AgentProgressBarProps {
  isVisible: boolean;
  status: AgentStatus | null;
  onCancel?: () => void;
  onRetry?: () => void;
  onClose?: () => void;
}

/**
 * Progress bar component for agent execution tracking
 * Shows real-time progress updates with German UI text
 * Enhanced with beautiful agent-specific styling and better UX
 */
export const AgentProgressBar: React.FC<AgentProgressBarProps> = ({
  isVisible,
  status,
  onCancel,
  onRetry,
  onClose
}) => {
  const [animate, setAnimate] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isVisible && status) {
      setAnimate(true);
    }
  }, [isVisible, status]);

  // Update elapsed time for running tasks
  useEffect(() => {
    if (status?.status === 'running' && status.startedAt) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - status.startedAt!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status?.status, status?.startedAt]);

  if (!isVisible || !status) {
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

  const getStatusColor = (statusString: string, agentId?: string) => {
    switch (statusString) {
      case 'completed':
        return '#10B981'; // Green
      case 'failed':
        return '#EF4444'; // Red
      case 'running':
        return getAgentColor(agentId || 'default');
      case 'queued':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return checkmarkCircleOutline;
      case 'failed':
        return alertCircleOutline;
      case 'running':
        return sparklesOutline;
      case 'queued':
        return sparklesOutline;
      default:
        return sparklesOutline;
    }
  };

  const getStatusText = (status: string, agentId?: string) => {
    const agentName = getAgentDisplayName(agentId || 'default');

    switch (status) {
      case 'queued':
        return `${agentName} wartet in der Warteschlange...`;
      case 'running':
        return `${getAgentEmoji(agentId || 'default')} ${agentName} ist aktiv...`;
      case 'completed':
        return `${getAgentEmoji(agentId || 'default')} ${agentName} erfolgreich abgeschlossen!`;
      case 'failed':
        return `${agentName} ist fehlgeschlagen`;
      default:
        return 'Unbekannter Status';
    }
  };

  const getAgentDisplayName = (agentId: string) => {
    switch (agentId) {
      case 'image-generation':
        return 'Bildgenerierung';
      case 'document-generation':
        return 'Dokumentenerstellung';
      case 'lesson-planner':
        return 'Unterrichtsplanung';
      default:
        return 'Agent';
    }
  };

  const formatProgressMessage = (message: string, stepTitle?: string, agentId?: string) => {
    // Convert technical progress messages to user-friendly German text
    const friendlyMessages: Record<string, string> = {
      'Initializing agent': 'Agent wird vorbereitet...',
      'Processing input': 'Eingabe wird verarbeitet...',
      'Generating image': 'Bild wird erstellt, bitte warten...',
      'Optimizing result': 'Ergebnis wird optimiert...',
      'Finalizing output': 'Ausgabe wird fertiggestellt...',
      'Saving to library': 'Wird in Bibliothek gespeichert...',
      'Analyzing context': 'Kontext wird analysiert...',
      'Creating content': 'Inhalt wird erstellt...',
      'Formatting output': 'Ausgabe wird formatiert...'
    };

    const friendlyMessage = friendlyMessages[message] || message;

    if (stepTitle) {
      return `${stepTitle}: ${friendlyMessage}`;
    }

    return friendlyMessage;
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <IonCard
      className="agent-progress-card"
      style={{
        borderLeft: `4px solid ${getStatusColor(status.status, status.agentId)}`,
        transform: animate ? 'scale(1)' : 'scale(0.95)',
        boxShadow: status.status === 'running' ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <IonCardContent className="agent-progress-content" style={{ padding: '20px' }}>
        {/* Header with Agent Icon and Status */}
        <div className="agent-progress-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div className="agent-progress-icon" style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: status.status === 'running' ? getAgentColor(status.agentId || 'default') : getStatusColor(status.status, status.agentId),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0
          }}>
            {status.status === 'running' ? (
              <>
                <span style={{ fontSize: '20px' }}>{getAgentEmoji(status.agentId || 'default')}</span>
                <IonSpinner
                  name="crescent"
                  style={{
                    position: 'absolute',
                    width: '52px',
                    height: '52px',
                    color: getAgentColor(status.agentId || 'default'),
                    opacity: 0.6
                  }}
                />
              </>
            ) : (
              <IonIcon
                icon={getStatusIcon(status.status)}
                style={{ fontSize: '24px', color: 'white' }}
              />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 className="agent-progress-title" style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                {getStatusText(status.status, status.agentId)}
              </h4>
              {status.status === 'running' && (
                <IonBadge color="light" style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: getAgentColor(status.agentId || 'default')
                }}>
                  {Math.round(status.progress.percentage)}%
                </IonBadge>
              )}
            </div>
            {status.progress.message && (
              <p className="agent-progress-message" style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                {formatProgressMessage(status.progress.message, status.progress.stepTitle, status.agentId)}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="agent-progress-actions" style={{ display: 'flex', gap: '8px' }}>
            {status.status === 'running' && onCancel && (
              <IonButton
                fill="clear"
                size="small"
                color="medium"
                onClick={onCancel}
                title="Abbrechen"
                style={{ minWidth: '44px' }}
              >
                <IonIcon icon={closeCircleOutline} />
              </IonButton>
            )}

            {status.status === 'failed' && onRetry && (
              <IonButton
                fill="clear"
                size="small"
                onClick={onRetry}
                title="Erneut versuchen"
                style={{
                  minWidth: '44px',
                  color: getAgentColor(status.agentId || 'default')
                }}
              >
                <IonIcon icon={refreshOutline} />
              </IonButton>
            )}

            {(status.status === 'completed' || status.status === 'failed') && onClose && (
              <IonButton
                fill="clear"
                size="small"
                color="medium"
                onClick={onClose}
                title="Schließen"
                style={{ minWidth: '44px' }}
              >
                <IonIcon icon={closeCircleOutline} />
              </IonButton>
            )}
          </div>
        </div>

        {/* Progress bar - only show for running status */}
        {status.status === 'running' && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '8px',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${status.progress.percentage}%`,
                backgroundColor: getAgentColor(status.agentId || 'default'),
                borderRadius: '8px',
                transition: 'width 0.3s ease-in-out',
                boxShadow: `0 0 10px ${getAgentColor(status.agentId || 'default')}20`
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <IonText style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                {Math.round(status.progress.percentage)}% abgeschlossen
              </IonText>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IonIcon icon={timeOutline} style={{ fontSize: '14px', color: '#666' }} />
                <IonText className="agent-progress-time" style={{ fontSize: '12px', color: '#666' }}>
                  {formatElapsedTime(elapsedTime)}
                </IonText>
              </div>
            </div>
          </div>
        )}

        {/* Error message for failed status */}
        {status.status === 'failed' && status.error && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <IonIcon icon={alertCircleOutline} style={{ fontSize: '16px', color: '#ef4444' }} />
              <IonText style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                Fehler aufgetreten
              </IonText>
            </div>
            <IonText style={{ fontSize: '14px', color: '#991b1b', lineHeight: '1.4' }}>
              {status.error}
            </IonText>
          </div>
        )}

        {/* Success timing for completed status */}
        {status.status === 'completed' && status.startedAt && status.completedAt && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '16px', color: '#10b981' }} />
            <IonText style={{ fontSize: '14px', color: '#059669', fontWeight: '500' }}>
              Abgeschlossen in {formatElapsedTime(Math.round((status.completedAt - status.startedAt) / 1000))}
            </IonText>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

// Add responsive CSS for the progress bar
const progressStyles = `
  /* Agent Progress Bar responsive styles */
  .agent-progress-card {
    margin: 16px 0;
    border-radius: 16px;
    transition: all 0.3s ease-in-out;
  }

  /* Mobile responsive styles for 375px+ */
  @media (max-width: 768px) {
    .agent-progress-card {
      margin: 12px 0;
      border-radius: 12px;
    }

    .agent-progress-content {
      padding: 16px !important;
    }

    .agent-progress-header {
      gap: 12px !important;
      margin-bottom: 12px !important;
    }

    .agent-progress-icon {
      width: 40px !important;
      height: 40px !important;
    }

    .agent-progress-title {
      font-size: 14px !important;
    }

    .agent-progress-message {
      font-size: 13px !important;
    }

    .agent-progress-actions {
      gap: 6px !important;
    }

    .agent-progress-actions ion-button {
      min-width: 36px !important;
    }
  }

  /* Small mobile devices (375px) */
  @media (max-width: 375px) {
    .agent-progress-card {
      margin: 8px 0;
    }

    .agent-progress-content {
      padding: 12px !important;
    }

    .agent-progress-header {
      gap: 8px !important;
    }

    .agent-progress-icon {
      width: 36px !important;
      height: 36px !important;
    }

    .agent-progress-title {
      font-size: 13px !important;
    }

    .agent-progress-message {
      font-size: 12px !important;
    }

    .agent-progress-time {
      font-size: 11px !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = progressStyles;
  document.head.appendChild(styleElement);
}

export default AgentProgressBar;