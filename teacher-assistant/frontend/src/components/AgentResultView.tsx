import React, { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { useAgent } from '../lib/AgentContext';

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
  const { state, closeModal, saveToLibrary } = useAgent();
  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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

  const handleContinueChat = () => {
    // Trigger animation before closing
    console.log('[AgentResultView] Triggering fly-to-library animation');
    animateToLibrary();
    // Modal closes in animation's onfinish callback
  };


  if (!state.result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  const imageUrl = state.result.data?.imageUrl;

  return (
    <div className="relative min-h-screen bg-background-teal flex flex-col">
      {/* Main Content - Fullscreen Image */}
      <div className="flex-1 flex items-center justify-center p-4 pt-6">
        <div className="max-w-4xl w-full">
          {/* Image Display */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
            {imageUrl ? (
              <img
                src={imageUrl}
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

        {/* 2-Button Grid - Gemini Design per TASK-017 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Button 1: Teilen */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="mr-2">🔗</span>
            {isSharing ? 'Teilen...' : 'Teilen'}
          </button>

          {/* Button 2: Weiter im Chat - Triggers fly-to-library animation */}
          <button
            onClick={handleContinueChat}
            className="flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
            style={{ backgroundColor: '#FB6542' }}
          >
            <span className="mr-2">💬</span>
            Weiter im Chat
          </button>
        </div>
      </div>
    </div>
  );
};