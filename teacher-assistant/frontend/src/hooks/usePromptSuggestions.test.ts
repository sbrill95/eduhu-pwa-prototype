import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePromptSuggestions } from './usePromptSuggestions';
import { apiClient } from '../lib/api';
import type { PromptSuggestion } from '../lib/types';

// Mock the API client
vi.mock('../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('usePromptSuggestions', () => {
  const mockSuggestions: PromptSuggestion[] = [
    {
      id: 'prompt-1',
      title: 'Erstelle ein Quiz',
      description: 'Mathematik für 7. Klasse',
      prompt: 'Erstelle ein Quiz für Mathematik, 7. Klasse zum Thema Bruchrechnung.',
      category: 'quiz',
      icon: 'helpCircleOutline',
      color: '#FB6542',
      estimatedTime: '2-3 Minuten',
      metadata: {
        templateId: 'quiz-basic',
        personalized: true,
      },
    },
    {
      id: 'prompt-2',
      title: 'Erstelle Arbeitsblatt',
      description: 'Übungsaufgaben für Mathematik',
      prompt: 'Erstelle ein Arbeitsblatt mit Übungsaufgaben für Mathematik, 7. Klasse.',
      category: 'worksheet',
      icon: 'documentTextOutline',
      color: '#FFBB00',
      estimatedTime: '3-4 Minuten',
      metadata: {
        templateId: 'worksheet-exercises',
        personalized: true,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should fetch suggestions on mount', async () => {
    // Mock successful API response
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestions: mockSuggestions,
      generatedAt: new Date().toISOString(),
      seed: '2025-10-01',
    });

    const { result } = renderHook(() => usePromptSuggestions());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBe(null);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify API was called
    expect(apiClient.post).toHaveBeenCalledWith('/prompts/generate-suggestions', {
      limit: 6,
    });

    // Verify suggestions are set
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.error).toBe(null);
  });

  it('should set loading state to true while fetching', async () => {
    // Mock API response with delay
    vi.mocked(apiClient.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              suggestions: mockSuggestions,
              generatedAt: new Date().toISOString(),
              seed: '2025-10-01',
            });
          }, 100);
        })
    );

    const { result } = renderHook(() => usePromptSuggestions());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.suggestions).toEqual(mockSuggestions);
  });

  it('should update suggestions state after successful fetch', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestions: mockSuggestions,
      generatedAt: new Date().toISOString(),
      seed: '2025-10-01',
    });

    const { result } = renderHook(() => usePromptSuggestions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.suggestions[0].title).toBe('Erstelle ein Quiz');
    expect(result.current.suggestions[1].title).toBe('Erstelle Arbeitsblatt');
  });

  it('should set error state on API error', async () => {
    const errorMessage = 'Fehler beim Laden der Vorschläge';
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => usePromptSuggestions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.suggestions).toEqual([]);
  });

  it('should refresh and re-fetch suggestions', async () => {
    // First fetch
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestions: mockSuggestions,
      generatedAt: new Date().toISOString(),
      seed: '2025-10-01',
    });

    const { result } = renderHook(() => usePromptSuggestions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(apiClient.post).toHaveBeenCalledTimes(1);

    // Mock new suggestions for refresh
    const newSuggestions: PromptSuggestion[] = [
      {
        id: 'prompt-3',
        title: 'Erstelle ein Bild',
        description: 'Visuelles Material',
        prompt: 'Erstelle ein Bild für Mathematik-Unterricht.',
        category: 'image',
        icon: 'imageOutline',
        color: '#4CAF50',
        estimatedTime: '1-2 Minuten',
        metadata: {
          templateId: 'image-generation',
          personalized: true,
        },
      },
    ];

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestions: newSuggestions,
      generatedAt: new Date().toISOString(),
      seed: '2025-10-01',
    });

    // Call refresh
    await result.current.refresh();

    // Wait for refresh to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify new suggestions
    expect(result.current.suggestions).toEqual(newSuggestions);
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  it('should handle nested data structure from backend', async () => {
    // Mock response with nested data structure
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        suggestions: mockSuggestions,
      },
      generatedAt: new Date().toISOString(),
      seed: '2025-10-01',
    });

    const { result } = renderHook(() => usePromptSuggestions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.suggestions).toEqual(mockSuggestions);
  });

  it('should handle empty suggestions array', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestions: [],
      generatedAt: new Date().toISOString(),
      seed: '2025-10-01',
    });

    const { result } = renderHook(() => usePromptSuggestions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBe(null);
  });
});
