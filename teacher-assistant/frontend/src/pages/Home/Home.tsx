import React from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonChip,
  IonLabel,
  IonButton,
  IonList,
  IonItem,
  IonSkeletonText
} from '@ionic/react';
import {
  chatboxOutline,
  chatbubbleOutline,
  documentOutline,
  addOutline,
  libraryOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { useAuth } from '../../lib/auth-context';
import db from '../../lib/instantdb';
import useLibraryMaterials from '../../hooks/useLibraryMaterials';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';
import { WelcomeMessageBubble } from '../../components/WelcomeMessageBubble';
import { CalendarCard } from '../../components/CalendarCard';
import { getDynamicFontSize } from '../../lib/utils';
import { formatRelativeDate } from '../../lib/formatRelativeDate';

interface HomeProps {
  onChatSelect?: (sessionId: string) => void;
  onTabChange?: (tab: 'home' | 'generieren' | 'automatisieren' | 'profil') => void;
  onNavigateToChat?: (prefilledPrompt?: string) => void;
}

const Home: React.FC<HomeProps> = React.memo(({ onChatSelect, onTabChange, onNavigateToChat }) => {
  const { user } = useAuth();

  // Get recent chat sessions from InstantDB
  const { data: chatData, error: chatError } = db.useQuery(
    user ? {
      chat_sessions: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' },
          limit: 3
        }
      }
    } : null
  );

  // Get recent library materials
  const {
    materials,
    loading: materialsLoading,
    error: materialsError
  } = useLibraryMaterials();

  // Get prompt suggestions for the tiles grid
  const { suggestions, loading: suggestionsLoading, error: suggestionsError, refresh } = usePromptSuggestions();

  const recentChats = chatData?.chat_sessions || [];
  const recentMaterials = materials.slice(0, 3); // Get first 3 materials

  // Handle prompt tile click
  const handlePromptClick = (prompt: string) => {
    if (onNavigateToChat) {
      onNavigateToChat(prompt);
    }
  };

  const handleChatClick = (sessionId: string) => {
    if (onChatSelect) {
      onChatSelect(sessionId);
    }
    // Navigate to Chat/Generieren tab to continue the conversation
    if (onTabChange) {
      onTabChange('automatisieren' as any);
    }
  };

  const handleNewChat = () => {
    // Navigate to chat tab for new chat
    if (onTabChange) {
      onTabChange('automatisieren' as any);
    }
  };

  // Date formatting now uses shared utility (BUG-005 fix)

  // Get user name for greeting
  const userName = user?.name || null;

  return (
    <div style={{
      maxWidth: '448px',
      margin: '0 auto',
      padding: '12px'
    }}>
          {/* Greeting Header - Gemini Style */}
          <div className="mb-3">
            <h1 style={{
              color: '#FB6542',
              fontSize: '36px',
              fontWeight: '700',
              fontFamily: 'Inter, system-ui, sans-serif',
              marginBottom: '6px'
            }}>
              Hallo{userName ? ` ${userName}` : ''}!
            </h1>
            <p style={{
              fontSize: '16px',
              fontWeight: '400',
              color: '#374151',
              marginBottom: '12px'
            }}>
              Dein KI-Assistent ist bereit.
            </p>
          </div>

          {/* Calendar Card - Gemini Style - COMES FIRST! */}
          <div className="mb-3">
            <CalendarCard />
          </div>

          {/* Welcome Message Bubble with Prompt Suggestions - Gemini Style */}
          <div className="mb-3">
            <WelcomeMessageBubble
              suggestions={suggestions}
              onPromptClick={handlePromptClick}
              loading={suggestionsLoading}
            />
          </div>

          {/* Letzte Chats Section - Gemini Design */}
          <div className="bg-white rounded-2xl shadow-sm mb-3" data-testid="recent-chats-section">
            {/* Section Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Letzte Chats
              </h2>
              <button
                onClick={() => onTabChange && onTabChange('automatisieren')}
                aria-label="Alle Chats anzeigen"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <IonIcon
                  icon={arrowForwardOutline}
                  style={{
                    color: '#9CA3AF',
                    fontSize: '20px'
                  }}
                />
              </button>
            </div>

            {/* Section Content */}
            <div className="p-3">
              {chatError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 font-medium">
                    Fehler beim Laden der Chats
                  </p>
                </div>
              ) : recentChats.length > 0 ? (
                <div className="space-y-2">
                  {recentChats.map((chat: any) => (
                    <div
                      key={chat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 200ms',
                        minHeight: '48px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        marginBottom: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                      }}
                      onClick={() => handleChatClick(chat.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatClick(chat.id)}
                      data-testid={`chat-item-${chat.id}`}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(251, 101, 66, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IonIcon
                          icon={chatbubbleOutline}
                          style={{
                            color: '#FB6542',
                            fontSize: '18px'
                          }}
                        />
                      </div>

                      {/* Chat Info - Compact single line with summary */}
                      <div style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {(() => {
                          // Use 'title' field from InstantDB schema (not 'summary')
                          const summary = chat.title || 'Neuer Chat';
                          const fontSizeClass = getDynamicFontSize(summary);
                          const fontSize = fontSizeClass === 'text-sm' ? '14px' : '12px';

                          return (
                            <span
                              style={{
                                fontSize,
                                fontWeight: '600',
                                color: '#374151',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              data-testid={`chat-summary-${chat.id}`}
                            >
                              {summary}
                            </span>
                          );
                        })()}
                        <span style={{
                          fontSize: '14px',
                          color: '#9CA3AF',
                          flexShrink: 0
                        }}>•</span>
                        <span style={{
                          fontSize: '13px',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {formatRelativeDate(chat.updated_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <IonIcon
                      icon={chatbubbleOutline}
                      className="text-primary text-4xl"
                    />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Noch keine Chats
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    Starte deinen ersten Chat mit dem KI-Assistenten.
                  </p>
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-200 font-medium text-sm"
                    onClick={handleNewChat}
                  >
                    <IonIcon icon={addOutline} className="text-lg" />
                    Neuen Chat starten
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Materialien Section - Gemini Design */}
          <div className="bg-white rounded-2xl shadow-sm mb-3" data-testid="materials-section">
            {/* Section Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Materialien
              </h2>
              <button
                onClick={() => {
                  console.log('[Home] Material arrow clicked - navigating to Library Materials');

                  // Dispatch custom event to signal Library tab switch
                  const event = new CustomEvent('navigate-library-tab', {
                    detail: { tab: 'materials' }
                  });
                  window.dispatchEvent(event);

                  // Navigate to Library
                  if (onTabChange) {
                    onTabChange('profil' as any);
                  }
                }}
                aria-label="Alle Materialien anzeigen"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <IonIcon
                  icon={arrowForwardOutline}
                  style={{
                    color: '#9CA3AF',
                    fontSize: '20px'
                  }}
                />
              </button>
            </div>

            {/* Section Content */}
            <div className="p-3">
              {materialsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 font-medium">
                    Fehler beim Laden der Materialien
                  </p>
                </div>
              ) : materialsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/5" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMaterials.length > 0 ? (
                <div className="space-y-2">
                  {recentMaterials.map((material: any) => (
                    <div
                      key={material.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 200ms',
                        minHeight: '48px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        marginBottom: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                      }}
                      role="button"
                      tabIndex={0}
                      data-testid={`material-item-${material.id}`}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 187, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IonIcon
                          icon={documentOutline}
                          style={{
                            color: '#FFBB00',
                            fontSize: '18px'
                          }}
                        />
                      </div>

                      {/* Material Info - Compact single line */}
                      <div style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {material.title}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#9CA3AF',
                          flexShrink: 0
                        }}>•</span>
                        <span style={{
                          fontSize: '14px',
                          color: '#6B7280',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {formatRelativeDate(material.updated_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p style={{
                    fontSize: '13px',
                    color: '#9CA3AF',
                    lineHeight: '1.5',
                    maxWidth: '300px',
                    margin: '0 auto'
                  }}>
                    Noch keine Materialien • Du kannst Materialien im Chat erstellen
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
  );
});

export default Home;