import React from 'react';
import { IonIcon, IonCard, IonCardContent } from '@ionic/react';
import * as icons from 'ionicons/icons';
import type { PromptSuggestion } from '../lib/types';

interface PromptTileProps {
  suggestion: PromptSuggestion;
  onClick: (prompt: string) => void;
}

/**
 * PromptTile Component - Single prompt suggestion card with Gemini-inspired design.
 *
 * Displays a clickable prompt suggestion with:
 * - Icon in colored circle
 * - Category badge
 * - Title and description
 * - Estimated time
 *
 * @param {PromptSuggestion} suggestion - The prompt suggestion data
 * @param {Function} onClick - Callback when tile is clicked, receives the full prompt text
 *
 * @example
 * ```tsx
 * <PromptTile
 *   suggestion={promptSuggestion}
 *   onClick={(prompt) => navigateToChat(prompt)}
 * />
 * ```
 */
export const PromptTile: React.FC<PromptTileProps> = ({ suggestion, onClick }) => {
  // Get the icon from ionicons, fallback to helpCircleOutline
  const iconName = (icons as any)[suggestion.icon] || icons.helpCircleOutline;

  // Handle click event
  const handleClick = () => {
    onClick(suggestion.prompt);
  };

  return (
    <IonCard
      className="prompt-tile cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg m-0 rounded-2xl border-l-4 border-primary bg-white"
      onClick={handleClick}
      button
      data-testid={`prompt-tile-${suggestion.id}`}
    >
      <IonCardContent className="p-4 min-h-[120px]">
        {/* Header with Icon and Category */}
        <div className="flex justify-between items-start mb-3">
          {/* Icon with colored background - Gemini Orange */}
          <div
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10"
            data-testid="prompt-icon-container"
          >
            <IonIcon
              icon={iconName}
              className="text-2xl text-primary"
              data-testid="prompt-icon"
            />
          </div>

          {/* Category Badge - Orange/Yellow styling */}
          <span
            className="text-xs uppercase font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary"
            data-testid="prompt-category"
          >
            {suggestion.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 text-gray-900" data-testid="prompt-title">
          {suggestion.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3" data-testid="prompt-description">
          {suggestion.description}
        </p>

        {/* Estimated Time */}
        <div className="flex items-center text-xs text-gray-500" data-testid="prompt-time">
          <IonIcon icon={icons.timeOutline} className="mr-1" />
          {suggestion.estimatedTime}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default PromptTile;
