import React, { useEffect, useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { IonSpinner } from '@ionic/react';
import debounce from 'lodash.debounce';
import { useAgent } from '../lib/AgentContext';
import { logger } from '../lib/logger';
import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';
import { id } from '@instantdb/react';
import { getProxiedImageUrl } from '../lib/imageProxy';

/**
 * AgentResultView - Result Display and Actions
 *
 * Preview Modal that opens automatically after successful image generation.
 *
 * Features:
 * - Fullscreen image display
 * - Auto-save to library on mount
 * - Share functionality (Web Share API + clipboard fallback)
 * - Success badge
 * - Metadata display (revised prompt)
 * - Mobile-optimized layout with safe areas
 * - Fly-to-library animation on "Weiter im Chat"
 * - Error handling for image loading and actions
 *
 * Layout per Gemini Design:
 * - Centered image (large, fullscreen)
 * - Success badge: "✅ In Library gespeichert"
 * - Two buttons: "Teilen 🔗" | "Weiter im Chat 💬"
 * - NO close button (only closable via buttons)
 *
 * TASK-017: Preview-Modal Implementation
 */
export const AgentResultView: React.FC = () => {
  const { state, closeModal, saveToLibrary, openModal, navigateToTab } = useAgent();
  const { user } = useAuth();

  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  console.log('[AgentResultView] 🎉 COMPONENT MOUNTED/RENDERED', {
    hasResult: !!state.result,
    hasImageUrl: !!state.result?.data?.imageUrl,
    imageUrl: state.result?.data?.imageUrl ? state.result.data.imageUrl.substring(0, 60) + '...' : 'NO IMAGE URL',
    phase: state.phase,
    isOpen: state.isOpen
  });

  // Auto-save on mount
  useEffect(() => {
    const autoSave = async () => {
      try {
        console.log('[AgentResultView] Auto-saving to library');
        await saveToLibrary();
        setSaved(true);
      } catch (error) {
        console.error('[AgentResultView] Auto-save failed', error);
        // Non-critical - continue showing result
      } finally {
        setSaving(false);
      }
    };

    autoSave();
  }, [saveToLibrary]);

  const handleShare = async () => {
    if (!state.result?.data?.imageUrl) return;

    setIsSharing(true);

    try {
      // Check if Web Share API is available
      if (navigator.share) {
        console.log('[AgentResultView] Using Web Share API');
        await navigator.share({
          title: 'Generiertes Bild',
          text: `Bild zum Thema: ${state.result.metadata?.theme || 'Unterrichtsmaterial'}`,
          url: state.result.data.imageUrl
        });
        console.log('[AgentResultView] Share successful');
      } else {
        // Fallback: Copy link to clipboard
        console.log('[AgentResultView] Fallback: Copy to clipboard');
        await navigator.clipboard.writeText(state.result.data.imageUrl);
        console.log('Link kopiert!');
        // TODO: Add toast notification library later
        // toast.success('Link in Zwischenablage kopiert!');
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        console.error('[AgentResultView] Share failed', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Animation: Bild fliegt zur Library
   *
   * Animates the result image flying to the Library tab icon
   * using Web Animations API for optimal performance.
   *
   * Edge cases handled:
   * - Missing image element (fallback to instant close)
   * - Missing library tab (fallback to instant close)
   * - Invisible elements (fallback to instant close)
   */
  const animateToLibrary = () => {
    const imageElement = document.querySelector('.agent-result-image') as HTMLElement;
    const libraryTab = document.querySelector('ion-tab-button[tab="library"]') as HTMLElement;

    // Edge case 1: Image element not found
    if (!imageElement) {
      console.warn('[Animation] Image element not found, closing modal without animation');
      closeModal();
      return;
    }

    // Edge case 2: Library tab not found
    if (!libraryTab) {
      console.warn('[Animation] Library tab not found (maybe hidden?), closing modal without animation');
      closeModal();
      return;
    }

    // Edge case 3: Image not visible
    const imageRect = imageElement.getBoundingClientRect();
    if (imageRect.width === 0 || imageRect.height === 0) {
      console.warn('[Animation] Image not visible, skipping animation');
      closeModal();
      return;
    }

    // Edge case 4: Library tab not visible
    const libraryRect = libraryTab.getBoundingClientRect();
    if (libraryRect.width === 0) {
      console.warn('[Animation] Library tab not visible, skipping animation');
      closeModal();
      return;
    }

    console.log('[Animation] Starting fly-to-library animation');

    // Calculate delta (center to center)
    const deltaX = libraryRect.left + libraryRect.width / 2 - (imageRect.left + imageRect.width / 2);
    const deltaY = libraryRect.top + libraryRect.height / 2 - (imageRect.top + imageRect.height / 2);

    // Clone image for animation
    const clone = imageElement.cloneNode(true) as HTMLElement;
    clone.classList.add('flying-image');

    // Position clone at original image location
    clone.style.position = 'fixed';
    clone.style.top = `${imageRect.top}px`;
    clone.style.left = `${imageRect.left}px`;
    clone.style.width = `${imageRect.width}px`;
    clone.style.height = `${imageRect.height}px`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.borderRadius = '1rem';
    clone.style.margin = '0';

    document.body.appendChild(clone);

    // Hide original image
    imageElement.style.opacity = '0';

    // Animate using Web Animations API
    const animation = clone.animate([
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1,
        borderRadius: '1rem'
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`,
        opacity: 0,
        borderRadius: '50%'
      }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    });

    // Cleanup and close modal after animation
    animation.onfinish = () => {
      console.log('[Animation] Animation complete, cleaning up');
      clone.remove();
      closeModal();

      // Optional: Show toast notification
      // toast.success('Bild in Bibliothek gespeichert ✓');
    };
  };

  // T031: Create debounced navigation handler with 300ms cooldown
  // T032: useMemo ensures debounced function is only created once and cleanup works properly
  // FIX BUG-030: Remove handleContinueChat dependency to prevent recreation on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandleContinueChat = useMemo(
    () => debounce(async () => {
      const callId = crypto.randomUUID();
      console.log(`[AgentResultView] 💬 handleContinueChat CALLED [ID:${callId}] - Button: "Weiter im Chat"`);
      console.trace('[AgentResultView] handleContinueChat call stack');

      // DEBUG: Log condition values
      console.log(`[AgentResultView] DEBUG Condition check [ID:${callId}]`, {
        hasResult: !!state.result,
        hasUser: !!user,
        userId: user?.id,
        hasSessionId: !!state.sessionId,
        sessionId: state.sessionId,
        willCreateMessage: !!(state.result && user && state.sessionId)
      });

      // TASK-006: Create chat message with image metadata
      // Only create message if backend didn't already create one (US2 BUG-025 fix)
      if (state.result && user && state.sessionId && !state.result.data?.message_id) {
        try {
          const imageUrl = state.result.data?.imageUrl;
          const title = state.result.data?.title || 'AI-generiertes Bild';
          const libraryId = state.result.data?.library_id || state.result.metadata?.library_id;
          const revisedPrompt = state.result.data?.revisedPrompt;
          const originalParams = state.result.metadata?.originalParams;

          console.log(`[AgentResultView] Creating chat message with image metadata [ID:${callId}]`, {
            imageUrl: imageUrl?.substring(0, 60),
            title,
            libraryId,
            sessionId: state.sessionId
          });

          if (imageUrl && libraryId) {
            const messageId = id();
            const now = Date.now();

            // Get current message count in session
            const { data: sessionData } = await db.queryOnce({
              chat_sessions: {
                $: {
                  where: { id: state.sessionId }
                }
              }
            });

            const messageIndex = sessionData?.chat_sessions?.[0]?.message_count || 0;

            // Create chat message with image metadata
            const metadata = {
              type: 'image',
              image_url: imageUrl,
              library_id: libraryId,
              title: title,
              description: revisedPrompt,
              originalParams: originalParams
            };

            console.log(`[AgentResultView] Saving message to InstantDB [ID:${callId}]`, {
              messageId,
              sessionId: state.sessionId,
              messageIndex,
              metadata
            });

            const transactResult = await db.transact([
              db.tx.messages[messageId].update({
                content: 'Ich habe ein Bild für dich erstellt.',
                role: 'assistant',
                timestamp: now,
                message_index: messageIndex,
                is_edited: false,
                metadata: JSON.stringify(metadata),
                session_id: state.sessionId,
                user_id: user.id
              }),
              // Update session message count
              db.tx.chat_sessions[state.sessionId].update({
                updated_at: now,
                message_count: messageIndex + 1
              })
            ]);

            console.log(`[AgentResultView] ✅ Chat message created successfully [ID:${callId}]`, {
              messageId,
              transactResult,
              messageData: {
                content: 'Ich habe ein Bild für dich erstellt.',
                role: 'assistant',
                session_id: state.sessionId,
                user_id: user.id,
                message_index: messageIndex,
                metadata: JSON.stringify(metadata)
              }
            });

            // CHAT-MESSAGE-FIX: Wait for InstantDB to sync the message (200ms buffer)
            // This ensures ChatView query will find the message when we navigate
            console.log(`[AgentResultView] ⏳ Waiting for InstantDB sync [ID:${callId}]`);
            await new Promise(resolve => setTimeout(resolve, 200));
            console.log(`[AgentResultView] ✅ InstantDB sync complete [ID:${callId}]`);
          } else {
            console.warn(`[AgentResultView] Cannot create chat message - missing data [ID:${callId}]`, {
              hasImageUrl: !!imageUrl,
              hasLibraryId: !!libraryId
            });
          }
        } catch (error) {
          console.error(`[AgentResultView] Failed to create chat message [ID:${callId}]`, error);
          // Continue with navigation even if message creation fails
        }
      }

      // T034: Log navigation event before navigating
      logger.navigation('TabChange', {
        source: 'agent-result',
        destination: 'chat',
        trigger: 'user-click'
      });

      // BUG-030 FIX: Close modal FIRST, then navigate
      // This ensures modal animations don't interfere with tab state
      console.log(`[AgentResultView] 🚪 Closing modal FIRST [ID:${callId}]`);
      closeModal();
      console.log(`[AgentResultView] ✅ closeModal() completed [ID:${callId}]`);

      // Small delay to let modal close completely
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now navigate with flushSync to force immediate state update
      // CHAT-MESSAGE-FIX: Pass sessionId to ensure Chat loads correct session
      console.log(`[AgentResultView] 📍 Calling navigateToTab("chat") with sessionId: ${state.sessionId} [ID:${callId}]`);
      flushSync(() => {
        navigateToTab('chat', { sessionId: state.sessionId || undefined });
      });
      console.log(`[AgentResultView] ✅ navigateToTab("chat") flushed synchronously [ID:${callId}]`);
    }, 300, {
      leading: true,  // Execute immediately on first click
      trailing: false  // Ignore subsequent clicks within cooldown
    }),
    [] // Empty deps - capture state/user/navigateToTab from closure
  );

  // T032: Cleanup debounced function to prevent memory leaks
  useEffect(() => {
    return () => {
      debouncedHandleContinueChat.cancel();
    };
  }, [debouncedHandleContinueChat]);

  const handleOpenInLibrary = () => {
    const callId = crypto.randomUUID();
    console.log(`[AgentResultView] 📚 handleOpenInLibrary CALLED [ID:${callId}] - Button: "In Library öffnen"`);
    console.trace('[AgentResultView] handleOpenInLibrary call stack');

    // T014: Extract materialId from agent result
    const materialId = state.result?.data?.library_id || state.result?.metadata?.library_id;
    console.log(`[AgentResultView] materialId extracted: ${materialId} [ID:${callId}]`);

    // T014: Dispatch custom event with materialId to auto-open modal (US2)
    if (materialId) {
      window.dispatchEvent(new CustomEvent('navigate-library-tab', {
        detail: {
          tab: 'materials',
          materialId: materialId,
          source: 'AgentResultView'
        }
      }));
      console.log(`[AgentResultView] ✅ Dispatched navigate-library-tab event with materialId: ${materialId} [ID:${callId}]`);
    } else {
      console.warn(`[AgentResultView] ⚠️ No materialId found, event dispatched without materialId [ID:${callId}]`);
      window.dispatchEvent(new CustomEvent('navigate-library-tab', {
        detail: {
          tab: 'materials',
          source: 'AgentResultView'
        }
      }));
    }

    // BUG-030 FIX: Use flushSync to force navigation
    console.log(`[AgentResultView] 📍 Calling navigateToTab("library") with flushSync [ID:${callId}]`);
    flushSync(() => {
      navigateToTab('library');
    });
    console.log(`[AgentResultView] ✅ navigateToTab("library") flushed synchronously [ID:${callId}]`);

    // Now close modal
    console.log(`[AgentResultView] 🚪 Closing modal NOW [ID:${callId}]`);
    closeModal();
    console.log(`[AgentResultView] ✅ closeModal() completed [ID:${callId}]`);
  };

  const handleRegenerate = () => {
    console.log('[AgentResultView] Regenerating image with original params');

    // Get original params from result metadata
    const originalParams = state.result?.metadata?.originalParams || state.formData;

    // Re-open form with same params
    openModal('image-generation', originalParams);
  };


  if (!state.result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  const imageUrl = state.result.data?.imageUrl;
  const proxiedImageUrl = getProxiedImageUrl(imageUrl);

  return (
    <div className="relative min-h-screen bg-background-teal flex flex-col" data-testid="agent-result-view">
      {/* Main Content - Fullscreen Image */}
      <div className="flex-1 flex items-center justify-center p-4 pt-6">
        <div className="max-w-2xl w-full">
          {/* Image Display */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
            {imageUrl ? (
              <img
                src={proxiedImageUrl}
                alt="AI-generiertes Bild"
                className="agent-result-image w-full h-auto max-h-[70vh] object-contain"
                onError={(e) => {
                  console.error('[AgentResultView] Image load error');
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                }}
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Bild konnte nicht geladen werden</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          {state.result.metadata?.revisedPrompt && (
            <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-1">Verwendeter Prompt:</p>
              <p className="text-sm text-gray-800">{state.result.metadata.revisedPrompt}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Success Badge + Buttons */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 space-y-3 flex-shrink-0">
        {/* Success Badge - Simplified per TASK-017 */}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              In Library gespeichert
            </span>
          </div>
        )}

        {/* Loading State Badge */}
        {saving && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-center">
            <IonSpinner name="crescent" className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium text-gray-900">
              Wird gespeichert...
            </span>
          </div>
        )}

        {/* 3-Button Layout - T013: User Story 5 - Result View Design System Consistency */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Button 1: Weiter im Chat (PRIMARY) - T013: Updated styles */}
          <button
            data-testid="continue-in-chat-button"
            onClick={() => {
              console.log('🔴🔴🔴 BUTTON CLICKED - FRESH CODE LOADED 🔴🔴🔴');
              // T033: Use debounced handler to prevent duplicate clicks
              debouncedHandleContinueChat();
            }}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Weiter im Chat 💬
          </button>

          {/* Button 2: In Library öffnen (SECONDARY) - T013: Updated styles */}
          <button
            onClick={handleOpenInLibrary}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            In Library öffnen 📚
          </button>

          {/* Button 3: Neu generieren (TERTIARY) - T013: Updated styles */}
          <button
            onClick={handleRegenerate}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Neu generieren 🔄
          </button>
        </div>
      </div>
    </div>
  );
};