import React, { useState, useEffect } from 'react';
import { IonText } from '@ionic/react';
import ReactMarkdown from 'react-markdown';

interface ProgressiveMessageProps {
  content: string;
  isComplete: boolean;
  role: 'user' | 'assistant';
  onComplete?: () => void;
}

/**
 * Component that renders text progressively, simulating typing animation
 * Similar to ChatGPT's progressive rendering
 * Memoized to prevent unnecessary re-renders during chat conversations
 */
const ProgressiveMessage: React.FC<ProgressiveMessageProps> = React.memo(({
  content,
  isComplete,
  role,
  onComplete
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Don't animate user messages - show them immediately
  const shouldAnimate = role === 'assistant' && !isComplete;

  useEffect(() => {
    if (role === 'user') {
      // User messages appear immediately
      setDisplayedContent(content);
      setCurrentIndex(content.length);
      return;
    }

    if (!shouldAnimate || isComplete) {
      // Show complete message if animation disabled or already complete
      setDisplayedContent(content);
      setCurrentIndex(content.length);
      if (onComplete && currentIndex < content.length) {
        onComplete();
      }
      return;
    }

    // Reset if content changed
    if (currentIndex === 0) {
      setDisplayedContent('');
    }

    // Progressive typing animation for assistant messages
    const timer = setTimeout(() => {
      if (currentIndex < content.length) {
        // Determine chunk size based on character type for natural flow
        let chunkSize = 1;
        const char = content[currentIndex];

        // Faster for spaces and punctuation
        if (char === ' ') {
          chunkSize = 1;
        } else if (char.match(/[.,!?;:]/)) {
          chunkSize = 1;
        } else if (char.match(/[a-zA-ZäöüßÄÖÜ]/)) {
          // Sometimes add word chunks for smoother flow
          chunkSize = Math.random() > 0.7 ? Math.min(3, content.length - currentIndex) : 1;
        }

        const newIndex = Math.min(currentIndex + chunkSize, content.length);
        setDisplayedContent(content.slice(0, newIndex));
        setCurrentIndex(newIndex);

        // Call onComplete when finished
        if (newIndex >= content.length && onComplete) {
          setTimeout(() => onComplete(), 100);
        }
      }
    }, getTypingDelay(currentIndex, content));

    return () => clearTimeout(timer);
  }, [currentIndex, content, shouldAnimate, isComplete, role, onComplete]);

  // Variable typing speed for natural feel
  const getTypingDelay = (index: number, text: string): number => {
    const char = text[index];

    // Pause after punctuation
    if (char && char.match(/[.!?]/)) {
      return 200 + Math.random() * 150;
    }

    // Pause after commas and semicolons
    if (char && char.match(/[,;]/)) {
      return 100 + Math.random() * 80;
    }

    // Pause after colons
    if (char === ':') {
      return 120 + Math.random() * 60;
    }

    // Faster for spaces
    if (char === ' ') {
      return 30 + Math.random() * 20;
    }

    // Normal typing speed with slight randomness for more natural feel
    return 20 + Math.random() * 30;
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="markdown-content"
        style={{
          fontSize: '14px',
          color: role === 'user' ? '#FFFFFF' : '#111827',
          lineHeight: '1.6'
        }}
      >
        <ReactMarkdown
          components={{
            // Custom styling for markdown elements
            p: ({node, ...props}) => <p style={{ margin: '0 0 0.5em 0' }} {...props} />,
            h1: ({node, ...props}) => <h1 style={{ margin: '0.5em 0', fontSize: '1.5em', fontWeight: 600 }} {...props} />,
            h2: ({node, ...props}) => <h2 style={{ margin: '0.5em 0', fontSize: '1.3em', fontWeight: 600 }} {...props} />,
            h3: ({node, ...props}) => <h3 style={{ margin: '0.5em 0', fontSize: '1.1em', fontWeight: 600 }} {...props} />,
            ul: ({node, ...props}) => <ul style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} {...props} />,
            ol: ({node, ...props}) => <ol style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} {...props} />,
            li: ({node, ...props}) => <li style={{ margin: '0.25em 0' }} {...props} />,
            code: ({node, ...props}) => (
              !(props as any).className?.includes('language-')
                ? <code style={{
                    backgroundColor: role === 'user' ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                    padding: '0.2em 0.4em',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    fontFamily: 'monospace'
                  }} {...props} />
                : <code style={{
                    display: 'block',
                    backgroundColor: role === 'user' ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                    padding: '0.75em',
                    borderRadius: '6px',
                    fontSize: '0.9em',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    margin: '0.5em 0'
                  }} {...props} />
            ),
            strong: ({node, ...props}) => <strong style={{ fontWeight: 600 }} {...props} />,
            em: ({node, ...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
            blockquote: ({node, ...props}) => (
              <blockquote style={{
                borderLeft: `3px solid ${role === 'user' ? 'rgba(255,255,255,0.5)' : '#d1d5db'}`,
                paddingLeft: '1em',
                margin: '0.5em 0',
                fontStyle: 'italic',
                opacity: 0.9
              }} {...props} />
            ),
            a: ({node, ...props}) => (
              <a style={{
                color: role === 'user' ? '#FFFFFF' : '#FB6542',
                textDecoration: 'underline'
              }} {...props} />
            )
          }}
        >
          {displayedContent}
        </ReactMarkdown>
        {shouldAnimate && currentIndex < content.length && (
          <span
            style={{
              borderRight: '2px solid currentColor',
              animation: 'blink 1s infinite',
              marginLeft: '1px',
              display: 'inline-block'
            }}
          >
            &nbsp;
          </span>
        )}
      </div>
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          .markdown-content p:last-child {
            margin-bottom: 0;
          }
        `}
      </style>
    </div>
  );
});

export default ProgressiveMessage;