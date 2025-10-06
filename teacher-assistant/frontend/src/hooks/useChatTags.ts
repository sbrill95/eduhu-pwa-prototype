/**
 * Custom hook for fetching and managing chat tags
 * Integrates with backend chatTagService for tag extraction and retrieval
 */

import { useState, useEffect, useCallback } from 'react';

export interface ChatTag {
  label: string;
  category: 'subject' | 'topic' | 'grade_level' | 'material_type' | 'general';
  confidence?: number;
}

interface UseChatTagsResult {
  tags: ChatTag[];
  tagLabels: string[]; // Simple string array of tag labels for display
  isLoading: boolean;
  error: string | null;
  extractTags: (forceRegenerate?: boolean) => Promise<void>;
}

/**
 * Hook to fetch tags for a specific chat session
 * Tags are stored in InstantDB chat_sessions.tags field
 */
export function useChatTags(chatId?: string): UseChatTagsResult {
  const [tags, setTags] = useState<ChatTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tags from backend API
  const fetchTags = useCallback(async () => {
    if (!chatId) {
      setTags([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/${chatId}/tags`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tags');
      }

      // Backend returns tags in data.tags
      const fetchedTags = data.data?.tags || [];
      setTags(Array.isArray(fetchedTags) ? fetchedTags : []);
    } catch (err) {
      console.error('Error fetching chat tags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Extract tags from chat (calls OpenAI tag extraction)
  const extractTags = useCallback(async (forceRegenerate = false) => {
    if (!chatId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/${chatId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceRegenerate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract tags');
      }

      const extractedTags = data.data?.tags || [];
      setTags(Array.isArray(extractedTags) ? extractedTags : []);
    } catch (err) {
      console.error('Error extracting chat tags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Fetch tags when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchTags();
    } else {
      setTags([]);
    }
  }, [chatId, fetchTags]);

  // Convert tags to simple string array for display
  const tagLabels = tags.map((tag) => tag.label);

  return {
    tags,
    tagLabels,
    isLoading,
    error,
    extractTags,
  };
}

/**
 * Hook to fetch tags for multiple chat sessions at once
 * Optimized for Library page with multiple chats
 */
export function useBatchChatTags(chatIds: string[]): Record<string, string[]> {
  const [tagsByChat, setTagsByChat] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!chatIds || chatIds.length === 0) {
      setTagsByChat({});
      return;
    }

    setIsLoading(true);

    // Fetch tags for all chats in parallel
    Promise.all(
      chatIds.map(async (chatId) => {
        try {
          const response = await fetch(`/api/chat/${chatId}/tags`);
          const data = await response.json();

          if (response.ok && data.data?.tags) {
            const tags = data.data.tags as ChatTag[];
            return { chatId, tagLabels: tags.map(t => t.label) };
          }
          return { chatId, tagLabels: [] };
        } catch (err) {
          console.error(`Error fetching tags for chat ${chatId}:`, err);
          return { chatId, tagLabels: [] };
        }
      })
    ).then((results) => {
      const tagsMap: Record<string, string[]> = {};
      results.forEach((result) => {
        tagsMap[result.chatId] = result.tagLabels;
      });
      setTagsByChat(tagsMap);
      setIsLoading(false);
    });
  }, [JSON.stringify(chatIds)]); // eslint-disable-line react-hooks/exhaustive-deps

  return tagsByChat;
}

export default useChatTags;
