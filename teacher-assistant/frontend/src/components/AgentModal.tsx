import React from 'react';
import { IonModal } from '@ionic/react';
import { useAgent } from '../lib/AgentContext';
import { AgentFormView } from './AgentFormView';
import { AgentProgressView } from './AgentProgressView';
import { AgentResultView } from './AgentResultView';

/**
 * AgentModal - Fullscreen Modal Container
 *
 * Manages the three-phase agent workflow:
 * 1. Form Phase - User inputs and configuration
 * 2. Progress Phase - Real-time execution progress
 * 3. Result Phase - Final output display and actions
 *
 * Features:
 * - Fullscreen Gemini-inspired design
 * - Phase-based component rendering
 * - Controlled modal lifecycle (backdropDismiss=false)
 * - Mobile-first responsive layout
 */
export const AgentModal: React.FC = () => {
  const { state, closeModal } = useAgent();

  // Enhanced debug logging
  React.useEffect(() => {
    console.log('[AgentModal] 🔄 STATE CHANGE DETECTED', {
      timestamp: new Date().toISOString(),
      isOpen: state.isOpen,
      phase: state.phase,
      hasResult: !!state.result,
      resultImageUrl: state.result?.data?.imageUrl ? state.result.data.imageUrl.substring(0, 60) + '...' : 'NO IMAGE',
      agentType: state.agentType,
      executionId: state.executionId
    });
  }, [state.phase, state.isOpen, state.result]);

  console.log('[AgentModal] 🎬 RENDERING', {
    isOpen: state.isOpen,
    phase: state.phase,
    hasResult: !!state.result,
    resultImageUrl: state.result?.data?.imageUrl ? state.result.data.imageUrl.substring(0, 60) + '...' : 'NO IMAGE',
    agentType: state.agentType
  });

  // Debug: Log which view will be rendered
  if (state.phase === 'form') {
    console.log('[AgentModal] 📝 Will render: AgentFormView');
  } else if (state.phase === 'progress') {
    console.log('[AgentModal] ⏳ Will render: AgentProgressView');
  } else if (state.phase === 'result') {
    console.log('[AgentModal] 🎉 Will render: AgentResultView');
  }

  return (
    <IonModal
      isOpen={state.isOpen}
      onDidDismiss={closeModal}
      className="agent-modal-fullscreen"
      backdropDismiss={false}
    >
      <div className="agent-modal-container bg-background-teal min-h-screen">
        {state.phase === 'form' && <AgentFormView />}
        {state.phase === 'progress' && <AgentProgressView />}
        {state.phase === 'result' && <AgentResultView />}
      </div>
    </IonModal>
  );
};