import { useEffect, useRef } from 'react';
import { apiClient } from '../lib/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseChatSummaryOptions {
  chatId: string;
  messages: Message[];
  enabled: boolean;
}

/**
 * Custom hook to auto-generate chat summaries
 *
 * Triggers summary generation:
 * - After 3 messages have been sent
 * - When user navigates away from chat (component unmount)
 *
 * Prevents duplicate summary generation using useRef flag
 */
export const useChatSummary = ({ chatId, messages, enabled }: UseChatSummaryOptions): void => {
  const hasGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    // Don't generate if disabled
    if (!enabled) return;

    // Reset generation flag when chatId changes (new chat loaded)
    hasGeneratedRef.current = false;

    // Trigger summary generation after 3 messages
    if (messages.length >= 3 && !hasGeneratedRef.current) {
      generateSummary();
    }

    // Cleanup: generate summary when component unmounts (user leaves chat)
    return () => {
      if (!hasGeneratedRef.current && messages.length > 0 && !isGeneratingRef.current) {
        generateSummary();
      }
    };
  }, [messages.length, enabled, chatId]);

  const generateSummary = async () => {
    // Prevent concurrent generation attempts
    if (hasGeneratedRef.current || isGeneratingRef.current) return;

    isGeneratingRef.current = true;

    try {
      console.log('[useChatSummary] Generating summary for chatId:', chatId, 'with', messages.length, 'messages');

      // Take first 4 messages for summary context
      const relevantMessages = messages.slice(0, 4).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await apiClient.post('/chat/summary', {
        chatId,
        messages: relevantMessages
      });

      console.log('[useChatSummary] Summary generated successfully:', response);

      // Mark as successfully generated
      hasGeneratedRef.current = true;

    } catch (error) {
      console.error('[useChatSummary] Failed to generate summary:', error);
      // Allow retry on next trigger by not setting hasGeneratedRef
    } finally {
      isGeneratingRef.current = false;
    }
  };
};
