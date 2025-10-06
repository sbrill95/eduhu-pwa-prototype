import React from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import { PromptTile } from './PromptTile';
import type { PromptSuggestion } from '../lib/types';

interface PromptTilesGridProps {
  suggestions: PromptSuggestion[];
  loading: boolean;
  error: string | null;
  onPromptClick: (prompt: string) => void;
  onRefresh: () => void;
}

/**
 * PromptTilesGrid Component - Grid container for displaying multiple prompt tiles.
 *
 * Displays a responsive grid of prompt suggestion cards with:
 * - Header with title and refresh button
 * - Loading state with spinner
 * - Error state with retry button
 * - Responsive grid layout (1/2/3 columns based on screen size)
 *
 * @param {PromptSuggestion[]} suggestions - Array of prompt suggestions to display
 * @param {boolean} loading - Loading state indicator
 * @param {string | null} error - Error message if fetch failed
 * @param {Function} onPromptClick - Callback when a prompt tile is clicked
 * @param {Function} onRefresh - Callback to refresh prompt suggestions
 *
 * @example
 * ```tsx
 * <PromptTilesGrid
 *   suggestions={suggestions}
 *   loading={loading}
 *   error={error}
 *   onPromptClick={(prompt) => navigateToChat(prompt)}
 *   onRefresh={refresh}
 * />
 * ```
 */
export const PromptTilesGrid: React.FC<PromptTilesGridProps> = ({
  suggestions,
  loading,
  error,
  onPromptClick,
  onRefresh,
}) => {
  // Loading state
  if (loading) {
    return (
      <div
        className="flex justify-center items-center py-12"
        data-testid="prompt-grid-loading"
      >
        <IonSpinner name="crescent" />
        <span className="ml-3 text-gray-600">Lade Vorschläge...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12" data-testid="prompt-grid-error">
        <p className="text-red-600 mb-4">{error}</p>
        <IonButton onClick={onRefresh} fill="outline" data-testid="retry-button">
          <IonIcon slot="start" icon={refreshOutline} />
          Erneut versuchen
        </IonButton>
      </div>
    );
  }

  // Main grid content
  return (
    <div className="prompt-tiles-container" data-testid="prompt-grid">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900" data-testid="grid-title">
          Vorschläge für dich
        </h2>
        <IonButton
          onClick={onRefresh}
          fill="clear"
          size="small"
          data-testid="refresh-button"
        >
          <IonIcon slot="icon-only" icon={refreshOutline} />
        </IonButton>
      </div>

      {/* Empty state */}
      {suggestions.length === 0 && (
        <div className="text-center py-12 text-gray-500" data-testid="prompt-grid-empty">
          <p>Keine Vorschläge verfügbar.</p>
          <IonButton onClick={onRefresh} fill="outline" className="mt-4">
            <IonIcon slot="start" icon={refreshOutline} />
            Neu laden
          </IonButton>
        </div>
      )}

      {/* Grid */}
      {suggestions.length > 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-testid="prompt-tiles-grid"
        >
          {suggestions.map((suggestion) => (
            <PromptTile
              key={suggestion.id}
              suggestion={suggestion}
              onClick={onPromptClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptTilesGrid;
