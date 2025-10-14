import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonModal,
  IonSpinner,
  IonText,
  setupIonicReact
} from '@ionic/react';
import './App.css';
import {
  homeOutline,
  chatbubbleOutline,
  folderOutline,
  personOutline
} from 'ionicons/icons';

import { AuthProvider, useAuth } from './lib/auth-context';
import { AgentProvider } from './lib/AgentContext';
import { ProtectedRoute } from './components';
import { ChatView, ProfileView, OnboardingWizard, LoadingSpinner } from './components';
import { AgentModal } from './components/AgentModal';
import ErrorBoundary from './components/ErrorBoundary';
import { useTeacherProfile } from './hooks/useTeacherProfile';
import { useOnboarding } from './hooks/useOnboarding';
import Home from './pages/Home/Home';
import Library from './pages/Library/Library';
import db from './lib/instantdb';
import { isFeatureEnabled, featureFlags } from './lib/featureFlags';
import { useStableData } from './hooks/useDeepCompareMemo';

setupIonicReact();

type ActiveTab = 'home' | 'chat' | 'library';

interface OnboardingState {
  isChecking: boolean;
  showOnboarding: boolean;
  hasChecked: boolean;
  error: string | null;
}

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useTeacherProfile();

  // Conditional onboarding hook usage based on feature flag
  const onboardingHook = isFeatureEnabled('ENABLE_ONBOARDING')
    ? useOnboarding()
    : {
        onboardingStatus: null,
        checkOnboardingStatus: async () => null,
        isOnboardingComplete: true,
        loading: false
      };
  const { onboardingStatus, checkOnboardingStatus, isOnboardingComplete, loading: onboardingLoading } = onboardingHook;

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(null);
  const [autoLoadChecked, setAutoLoadChecked] = useState(false);
  const [prefilledChatPrompt, setPrefilledChatPrompt] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isChecking: false,
    showOnboarding: false,
    hasChecked: false,
    error: null
  });

  // Ref to prevent onboarding check from running multiple times
  const onboardingCheckedRef = useRef(false);

  // Query for most recent chat session (for auto-loading)
  // FIX: TypeScript - order values must be Direction type ('asc' | 'desc'), not string
  // The as const assertion ensures TypeScript recognizes 'desc' as the literal type Direction
  const recentSessionQuery = useMemo(() =>
    user ? {
      chat_sessions: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' as const }, // Type: Direction = 'asc' | 'desc'
          limit: 1
        }
      }
    } : null,
    [user?.id]
  );

  const { data: recentSessionData } = db.useQuery(recentSessionQuery);

  // FIX: Stabilize recentSessionData to prevent infinite loops
  const stableRecentSessionData = useStableData(recentSessionData);


  const handleNewChat = useCallback(() => {
    // Clear current session to start fresh - no longer used with new navigation
    setCurrentChatSessionId(null);
    setAutoLoadChecked(true);
  }, []);

  const handleChatSelect = useCallback((sessionId: string) => {
    // Store session ID - no longer auto-switches to chat tab
    setCurrentChatSessionId(sessionId);
    setAutoLoadChecked(true);
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab, options?: { sessionId?: string }) => {
    console.log(`🔄 [App.handleTabChange] Setting activeTab to: "${tab}"`, {
      timestamp: new Date().toISOString(),
      newTab: tab,
      sessionId: options?.sessionId
    });
    console.trace('[App.handleTabChange] Call stack');

    // CHAT-MESSAGE-FIX: If navigating to chat with a sessionId, set it
    if (tab === 'chat' && options?.sessionId) {
      console.log(`📌 [App.handleTabChange] Setting currentChatSessionId to: "${options.sessionId}"`);
      setCurrentChatSessionId(options.sessionId);
      setAutoLoadChecked(true); // Prevent auto-load from overriding
    }

    setActiveTab(tab);
    console.log(`✅ [App.handleTabChange] setActiveTab("${tab}") called`);
  }, []); // No dependencies - setActiveTab/setCurrentChatSessionId are stable

  const handleNavigateToChat = useCallback((prompt?: string) => {
    // Navigate to chat tab with pre-filled prompt
    if (prompt) {
      setPrefilledChatPrompt(prompt);
      // TASK B.2: Clear current session to force NEW chat creation
      // This ensures prompt tiles create a NEW chat instead of appending to existing chat
      setCurrentChatSessionId(null);
    }
    setActiveTab('chat');
  }, []);

  // Debug effect to track activeTab state changes
  useEffect(() => {
    console.log(`📊 [activeTab STATE CHANGED] New value: ${activeTab}`);
  }, [activeTab]);

  // RE-ENABLED: Auto-load feature with proper render-loop protection
  // Fixed: Uses stableRecentSessionData to prevent infinite loops
  const shouldAutoLoad = useMemo(() => {
    return activeTab === 'chat' &&
           !currentChatSessionId &&
           !autoLoadChecked &&
           stableRecentSessionData?.chat_sessions &&
           stableRecentSessionData.chat_sessions.length > 0;
  }, [activeTab, currentChatSessionId, autoLoadChecked, stableRecentSessionData?.chat_sessions]);

  useEffect(() => {
    if (shouldAutoLoad && stableRecentSessionData?.chat_sessions) {
      const mostRecentSession = stableRecentSessionData.chat_sessions[0];
      console.log('[App] Auto-loading most recent session:', mostRecentSession.id);
      setCurrentChatSessionId(mostRecentSession.id);
      setAutoLoadChecked(true);
    }
  }, [shouldAutoLoad, stableRecentSessionData?.chat_sessions]);

  // Enhanced onboarding status check with session and persistence management
  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip onboarding check if feature is disabled
      if (!isFeatureEnabled('ENABLE_ONBOARDING')) {
        setOnboardingState({
          isChecking: false,
          showOnboarding: false,
          hasChecked: true,
          error: null
        });
        return;
      }

      // Only check if user is authenticated and we haven't checked yet
      // Use ref to prevent re-running without triggering re-render
      if (!user?.id || authLoading || onboardingCheckedRef.current) {
        return;
      }

      // Mark as checked to prevent re-running
      onboardingCheckedRef.current = true;
      setOnboardingState(prev => ({ ...prev, isChecking: true, error: null }));

      try {
        // Priority 1: Check sessionStorage first (single session completion)
        const sessionKey = `onboarding_completed_${user.id}`;
        const sessionCompleted = sessionStorage.getItem(sessionKey);

        if (sessionCompleted === 'true') {
          setOnboardingState({
            isChecking: false,
            showOnboarding: false,
            hasChecked: true,
            error: null
          });
          return;
        }

        // Priority 2: Check localStorage (persistent completion)
        const cacheKey = `onboarding_status_${user.id}`;
        const cachedStatus = localStorage.getItem(cacheKey);

        if (cachedStatus) {
          try {
            const parsed = JSON.parse(cachedStatus);
            const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000; // 24 hours

            if (isRecent && parsed.userId === user.id && parsed.completed) {
              // Mark as completed in session too
              sessionStorage.setItem(sessionKey, 'true');
              setOnboardingState({
                isChecking: false,
                showOnboarding: false,
                hasChecked: true,
                error: null
              });
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse cached onboarding status');
          }
        }

        // Priority 3: Check backend (with retry logic)
        let status = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !status) {
          try {
            status = await checkOnboardingStatus();
            break;
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            } else {
              throw error;
            }
          }
        }

        // Determine if onboarding is needed
        const needsOnboarding = !status?.onboardingCompleted;

        setOnboardingState({
          isChecking: false,
          showOnboarding: needsOnboarding,
          hasChecked: true,
          error: null
        });

        // Store result in localStorage for persistence
        localStorage.setItem(cacheKey, JSON.stringify({
          completed: status?.onboardingCompleted || false,
          timestamp: Date.now(),
          userId: user.id
        }));

        // If already completed, mark session as completed too
        if (status?.onboardingCompleted) {
          sessionStorage.setItem(sessionKey, 'true');
        }

      } catch (error) {
        console.error('Error checking onboarding status:', error);

        // Check localStorage for cached status
        const cachedStatus = localStorage.getItem(`onboarding_status_${user.id}`);

        if (cachedStatus) {
          try {
            const parsed = JSON.parse(cachedStatus);
            const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000; // 24 hours

            if (isRecent && parsed.userId === user.id) {
              setOnboardingState({
                isChecking: false,
                showOnboarding: !parsed.completed,
                hasChecked: true,
                error: null
              });
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse cached onboarding status');
          }
        }

        // Fallback: assume they need onboarding for better UX
        setOnboardingState({
          isChecking: false,
          showOnboarding: true,
          hasChecked: true,
          error: error instanceof Error ? error.message : 'Failed to check onboarding status'
        });
      }
    };

    checkOnboarding();
  }, [user?.id, authLoading]); // FIX BUG-010: Removed checkOnboardingStatus - not used inside, causes infinite loop

  // Handle onboarding completion with status update
  const handleOnboardingComplete = useCallback(() => {
    // Update local state
    setOnboardingState(prev => ({ ...prev, showOnboarding: false }));

    if (user?.id) {
      // Update both localStorage (persistent) and sessionStorage (session-only)
      const statusData = {
        completed: true,
        timestamp: Date.now(),
        userId: user.id
      };

      localStorage.setItem(`onboarding_status_${user.id}`, JSON.stringify(statusData));
      sessionStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }

    // Navigate to home with welcome message
    setActiveTab('home');
  }, [user?.id]);

  // Handle onboarding skip with optional completion
  const handleOnboardingSkip = useCallback(() => {
    // For skip, we still mark as completed but with different flag
    setOnboardingState(prev => ({ ...prev, showOnboarding: false }));

    if (user?.id) {
      // Update both localStorage (persistent) and sessionStorage (session-only)
      const statusData = {
        completed: true,
        skipped: true,
        timestamp: Date.now(),
        userId: user.id
      };

      localStorage.setItem(`onboarding_status_${user.id}`, JSON.stringify(statusData));
      sessionStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }

    setActiveTab('home');
  }, [user?.id]);

  // Memoized session change handler to prevent re-renders
  const handleSessionChange = useCallback((sessionId: string | null) => {
    setCurrentChatSessionId(sessionId);
  }, []);

  // Memoized tab click handlers to prevent re-renders
  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTabChange('home');
  }, [handleTabChange]);

  const handleChatClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTabChange('chat');
  }, [handleTabChange]);

  const handleLibraryClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTabChange('library');
  }, [handleTabChange]);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfile(prev => !prev);
  }, []);

  // Memoized content rendering - only re-renders when dependencies change
  const renderActiveContent = useMemo(() => {
    console.log(`🖼️ [RENDER] activeTab = ${activeTab} - Rendering new content NOW`);
    console.trace('Render stack trace'); // Show where this is called from
    switch (activeTab) {
      case 'home':
        return (
          <Home
            onChatSelect={handleChatSelect}
            onTabChange={handleTabChange as (tab: 'home' | 'generieren' | 'automatisieren' | 'profil') => void}
            onNavigateToChat={handleNavigateToChat}
          />
        );
      case 'chat':
        // Original ChatView with WhatsApp-style bubbles and prompt tiles
        return (
          <div className="chat-view-wrapper" data-testid="chat-view">
            <ChatView
              sessionId={currentChatSessionId ?? undefined}
              onSessionChange={handleSessionChange}
              onNewChat={handleNewChat}
              prefilledPrompt={prefilledChatPrompt}
              onClearPrefill={() => setPrefilledChatPrompt(null)}
            />
          </div>
        );
      case 'library':
        // Library page
        return (
          <Library
            onChatSelect={handleChatSelect}
            onTabChange={handleTabChange}
          />
        );
      default:
        return (
          <Home
            onChatSelect={handleChatSelect}
            onTabChange={handleTabChange as (tab: 'home' | 'generieren' | 'automatisieren' | 'profil') => void}
            onNavigateToChat={handleNavigateToChat}
          />
        );
    }
  }, [activeTab, currentChatSessionId, handleChatSelect, handleTabChange, handleNavigateToChat, handleNewChat, handleSessionChange, prefilledChatPrompt]);

  // Show loading state while checking onboarding
  if (authLoading || onboardingState.isChecking) {
    return (
      <IonApp>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <LoadingSpinner
            message={authLoading ? 'Anmeldung wird überprüft...' : 'App wird geladen...'}
            size="medium"
            showLogo={true}
            className="text-center"
          />
        </div>
      </IonApp>
    );
  }

  // Show onboarding if needed
  if (onboardingState.showOnboarding) {
    return (
      <IonApp>
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </IonApp>
    );
  }

  return (
    <AgentProvider onNavigateToTab={handleTabChange}>
      <IonApp>
        {/* Render AgentModal globally (only if feature is enabled) */}
        {featureFlags.ENABLE_AGENT_UI && <AgentModal />}

        {/* Main Content */}
        <IonContent key={activeTab} className="content-with-tabs" data-testid={`tab-content-${activeTab}`}>
          {renderActiveContent}
        </IonContent>

        {/* Floating Profile Button - Top Right */}
        <button
          onClick={handleProfileClick}
          className="floating-profile-button"
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FB6542',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          <IonIcon icon={personOutline} style={{ fontSize: '24px', color: 'white' }} />
        </button>

        {/* Profile Modal/View */}
        {showProfile && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: 'white', overflow: 'auto' }}>
            <button
              onClick={() => setShowProfile(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001
              }}
            >
              <IonIcon icon={personOutline} style={{ fontSize: '20px' }} />
            </button>
            <ProfileView />
          </div>
        )}

        {/* Fixed Tab Bar - Gemini Design with 3 Tabs and Orange Active State */}
        <div className="tab-bar-fixed" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'white',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 1000,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* Tab 1: Home */}
          <button
            onClick={handleHomeClick}
            className="transition-colors duration-200"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              color: activeTab === 'home' ? '#FB6542' : '#9ca3af',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <IonIcon
              icon={homeOutline}
              style={{ fontSize: '20px', marginBottom: '2px' }}
            />
            <span style={{ fontSize: '12px' }}>Home</span>
          </button>

          {/* Tab 2: Chat */}
          <button
            data-testid="tab-chat"
            onClick={handleChatClick}
            className="transition-colors duration-200"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              color: activeTab === 'chat' ? '#FB6542' : '#9ca3af',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <IonIcon
              icon={chatbubbleOutline}
              style={{ fontSize: '20px', marginBottom: '2px' }}
            />
            <span style={{ fontSize: '12px' }}>Chat</span>
          </button>

          {/* Tab 3: Bibliothek */}
          <button
            onClick={handleLibraryClick}
            className="transition-colors duration-200"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              color: activeTab === 'library' ? '#FB6542' : '#9ca3af',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <IonIcon
              icon={folderOutline}
              style={{ fontSize: '20px', marginBottom: '2px' }}
            />
            <span style={{ fontSize: '12px' }}>Bibliothek</span>
          </button>
        </div>
      </IonApp>
    </AgentProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
