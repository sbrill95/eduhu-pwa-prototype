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

  console.log('[AgentModal] Rendering with phase:', state.phase, {
    isOpen: state.isOpen,
    hasResult: !!state.result,
    resultData: state.result?.data
  });

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