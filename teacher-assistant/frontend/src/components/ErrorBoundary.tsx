import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IonCard, IonCardContent, IonText, IonButton, IonIcon } from '@ionic/react';
import { refreshOutline, alertCircleOutline } from 'ionicons/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '24px' }}>
          <IonCard color="danger">
            <IonCardContent>
              <div style={{ textAlign: 'center' }}>
                <IonIcon
                  icon={alertCircleOutline}
                  style={{ fontSize: '48px', marginBottom: '16px' }}
                />
                <h2>Etwas ist schiefgelaufen</h2>
                <IonText color="light">
                  <p style={{ marginBottom: '16px' }}>
                    Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie, die Seite neu zu laden.
                  </p>
                  {this.state.error && (
                    <details style={{ marginBottom: '16px', textAlign: 'left' }}>
                      <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                        Technische Details
                      </summary>
                      <pre
                        style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          padding: '12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {this.state.error.message}
                        {this.state.error.stack && `\n\n${this.state.error.stack}`}
                      </pre>
                    </details>
                  )}
                </IonText>
                <IonButton color="light" onClick={this.handleReset}>
                  <IonIcon icon={refreshOutline} slot="start" />
                  Seite neu laden
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;