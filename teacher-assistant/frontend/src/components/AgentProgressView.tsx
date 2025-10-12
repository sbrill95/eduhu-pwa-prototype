import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { sparkles, closeOutline } from 'ionicons/icons';
import { useAgent } from '../lib/AgentContext';

// Custom hook for WebSocket progress updates
const useAgentProgress = (executionId: string | null) => {
  const [progress, setProgress] = useState({ percentage: 0, message: '', currentStep: '' });
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    if (!executionId) return;

    console.log('[useAgentProgress] Connecting to WebSocket', { executionId });

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        // Get WebSocket URL from backend
        const wsUrl = `ws://localhost:3004?userId=current-user&executionId=${executionId}&level=user_friendly`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[useAgentProgress] WebSocket connected');
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[useAgentProgress] WebSocket message', data);

            if (data.type === 'progress') {
              setProgress({
                percentage: data.progress || 0,
                message: data.message || '',
                currentStep: data.step || ''
              });
            }

            // Check if completed
            if (data.progress === 100 || data.step === 'finalization') {
              console.log('[useAgentProgress] Execution completed');
            }
          } catch (error) {
            console.error('[useAgentProgress] Failed to parse message', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[useAgentProgress] WebSocket error', error);
          setWsStatus('error');
        };

        ws.onclose = () => {
          console.log('[useAgentProgress] WebSocket closed, reconnecting...');
          setWsStatus('connecting');
          reconnectTimeout = setTimeout(connect, 2000);
        };
      } catch (error) {
        console.error('[useAgentProgress] Failed to connect', error);
        setWsStatus('error');
      }
    };

    connect();

    return () => {
      console.log('[useAgentProgress] Cleaning up WebSocket');
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [executionId]);

  return { progress, wsStatus };
};

export const AgentProgressView: React.FC = () => {
  const { state, cancelExecution } = useAgent();
  const { progress, wsStatus } = useAgentProgress(state.executionId);
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  // Update estimated time based on progress
  useEffect(() => {
    const percentage = progress.percentage || 0;
    if (percentage === 0) {
      setEstimatedTime('~1 Minute');
    } else if (percentage < 30) {
      setEstimatedTime('~45 Sekunden');
    } else if (percentage < 60) {
      setEstimatedTime('~30 Sekunden');
    } else if (percentage < 90) {
      setEstimatedTime('~15 Sekunden');
    } else {
      setEstimatedTime('Fast fertig...');
    }
  }, [progress.percentage]);

  const handleCancel = async () => {
    if (window.confirm('Möchtest du die Bildgenerierung wirklich abbrechen?')) {
      console.log('[AgentProgressView] User cancelled execution');
      await cancelExecution();
    }
  };

  return (
    <div className="min-h-screen bg-background-teal flex flex-col">
      {/* Header - Simplified: Single status message */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Bildgenerierung</p>
          </div>
        </div>
        {wsStatus === 'error' && (
          <div className="text-xs text-red-500">
            Verbindungsfehler
          </div>
        )}
      </div>

      {/* Progress Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Animated Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FB6542] to-[#FFBB00] flex items-center justify-center animate-pulse-slow">
                <IonIcon icon={sparkles} className="w-12 h-12 text-white animate-spin-slow" />
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            </div>
          </div>

          {/* Conditional Rendering: Show Progress Bar ONLY if WebSocket is connected */}
          {wsStatus === 'connected' && progress.percentage > 0 ? (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {progress.percentage}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {estimatedTime}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FB6542] to-[#FFBB00] transition-all duration-500 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>

              {/* Progress Message */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <p className="text-center text-gray-700 font-medium">
                  {progress.message || 'Starte Bildgenerierung...'}
                </p>
                {progress.currentStep && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Schritt: {progress.currentStep}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Fallback: Simple Loading Message (No WebSocket or No Progress Yet) */
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">
                Dein Bild wird erstellt...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Das kann bis zu 1 Minute dauern
              </p>
            </div>
          )}

          {/* Cancel Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <IonIcon icon={closeOutline} className="w-5 h-5" />
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};