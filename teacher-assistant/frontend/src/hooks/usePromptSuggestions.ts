import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import type { PromptSuggestion } from '../lib/types';

export interface UsePromptSuggestionsResult {
  suggestions: PromptSuggestion[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom React hook for fetching and managing prompt suggestions.
 * Fetches personalized prompt suggestions from the backend on mount.
 *
 * @returns {UsePromptSuggestionsResult} Hook result with suggestions, loading state, error, and refresh function
 *
 * @example
 * ```tsx
 * const { suggestions, loading, error, refresh } = usePromptSuggestions();
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * return (
 *   <div>
 *     {suggestions.map(s => <PromptTile key={s.id} suggestion={s} />)}
 *     <button onClick={refresh}>Neu laden</button>
 *   </div>
 * );
 * ```
 */
export function usePromptSuggestions(): UsePromptSuggestionsResult {
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false - feature disabled
  const [error, setError] = useState<string | null>(null);

  // Feature flag - Disable until backend /prompts endpoint is fixed
  const ENABLE_PROMPT_SUGGESTIONS = false;

  const fetchSuggestions = useCallback(async () => {
    if (!ENABLE_PROMPT_SUGGESTIONS) {
      console.log('[usePromptSuggestions] Feature disabled - backend endpoint not available');
      setLoading(false);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<any>('/prompts/generate-suggestions', {
        limit: 6
      });

      // Backend can return suggestions directly or nested in data
      const suggestions = response?.data?.suggestions || response?.suggestions || [];
      setSuggestions(suggestions);
    } catch (err) {
      console.error('Error fetching prompt suggestions:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Vorschläge');
    } finally {
      setLoading(false);
    }
  }, [ENABLE_PROMPT_SUGGESTIONS]); // ✅ Add dependency

  useEffect(() => {
    // Only fetch if feature is enabled
    if (ENABLE_PROMPT_SUGGESTIONS) {
      fetchSuggestions();
    }
  }, [fetchSuggestions, ENABLE_PROMPT_SUGGESTIONS]); // ✅ Add both dependencies

  return {
    suggestions,
    loading,
    error,
    refresh: fetchSuggestions
  };
}

export default usePromptSuggestions;
