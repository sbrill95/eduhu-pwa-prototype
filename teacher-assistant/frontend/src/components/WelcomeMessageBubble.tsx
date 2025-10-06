import React from 'react';
import type { PromptSuggestion } from '../lib/types';

interface WelcomeMessageBubbleProps {
  suggestions: PromptSuggestion[];
  onPromptClick: (prompt: string) => void;
  loading?: boolean;
}

/**
 * Welcome Message Bubble Component - Gemini Style
 *
 * Displays a welcome message with personalized prompt suggestions
 * in the Gemini design style (gray background, text links with arrows).
 *
 * Based on Gemini prototype analysis (Screenshot 2025-10-01 134625.png)
 */
export const WelcomeMessageBubble: React.FC<WelcomeMessageBubbleProps> = ({
  suggestions,
  onPromptClick,
  loading = false
}) => {
  // Display only first 3 suggestions
  const displayedSuggestions = suggestions.slice(0, 3);

  return (
    <div style={{
      backgroundColor: '#F3F4F6',
      borderRadius: '16px',
      padding: '12px',
      marginBottom: '0'
    }} data-testid="welcome-message-bubble">
      {/* Welcome Message */}
      <p style={{
        fontSize: '15px',
        fontWeight: '400',
        color: '#1F2937',
        lineHeight: '1.5',
        marginBottom: '10px'
      }}>
        Ich habe einen Blick auf deinen Tag geworfen und ein paar
        Ideen vorbereitet. Wollen wir loslegen?
      </p>

      {/* Prompt Suggestions - WHITE CONTAINER BOX with dividers */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 bg-gray-200 rounded animate-pulse w-3/4"
            />
          ))}
        </div>
      ) : displayedSuggestions.length > 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '4px 0',
          marginTop: '12px'
        }} data-testid="prompt-suggestions-container">
          {displayedSuggestions.map((suggestion, index) => {
            const isLast = index === displayedSuggestions.length - 1;

            return (
              <button
                key={suggestion.id || index}
                onClick={() => onPromptClick(suggestion.prompt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1F2937',
                  background: 'none',
                  border: 'none',
                  borderBottom: isLast ? 'none' : '1px solid #E5E7EB',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'color 200ms'
                }}
                data-testid={`prompt-suggestion-${index}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FB6542';
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#1F2937';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ flex: 1 }}>{suggestion.title}</span>
                <span style={{ color: '#9CA3AF' }}>→</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '4px 0',
          marginTop: '12px'
        }} data-testid="prompt-suggestions-container">
          {/* Fallback default suggestions with white container */}
          <button
            onClick={() => onPromptClick('Planung Mathe starten')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1F2937',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #E5E7EB',
              padding: '10px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'color 200ms'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FB6542';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1F2937';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ flex: 1 }}>Planung Mathe starten →</span>
          </button>
          <button
            onClick={() => onPromptClick('Unterrichtseinheit erstellen')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1F2937',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #E5E7EB',
              padding: '10px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'color 200ms'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FB6542';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1F2937';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ flex: 1 }}>Unterrichtseinheit erstellen →</span>
          </button>
          <button
            onClick={() => onPromptClick('Material vorbereiten')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#1F2937',
              background: 'none',
              border: 'none',
              borderBottom: 'none',
              padding: '10px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'color 200ms'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FB6542';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1F2937';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ flex: 1 }}>Material vorbereiten →</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WelcomeMessageBubble;
