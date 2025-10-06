import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChatSummary } from './useChatSummary';
import { apiClient } from '../lib/api';

// Mock API client
vi.mock('../lib/api', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

describe('useChatSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger summary generation after 3 messages', async () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
      { role: 'user' as const, content: 'How are you?' }
    ];

    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValueOnce({ summary: 'Test Chat' });

    renderHook(() =>
      useChatSummary({
        chatId: 'chat-123',
        messages,
        enabled: true
      })
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/chat/summary', {
        chatId: 'chat-123',
        messages: messages.slice(0, 4)
      });
    });
  });

  it('should NOT trigger if less than 3 messages', async () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' }
    ];

    const mockPost = vi.mocked(apiClient.post);

    renderHook(() =>
      useChatSummary({
        chatId: 'chat-123',
        messages,
        enabled: true
      })
    );

    // Wait a bit to ensure no call is made
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('should trigger on component unmount if messages exist', async () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' }
    ];

    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValueOnce({ summary: 'Test Chat' });

    const { unmount } = renderHook(() =>
      useChatSummary({
        chatId: 'chat-123',
        messages,
        enabled: true
      })
    );

    // Should not have been called yet (only 2 messages)
    expect(mockPost).not.toHaveBeenCalled();

    // Unmount triggers summary generation
    unmount();

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/chat/summary', {
        chatId: 'chat-123',
        messages: messages.slice(0, 4)
      });
    });
  });

  it('should NOT generate duplicate summaries', async () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
      { role: 'user' as const, content: 'How are you?' }
    ];

    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValueOnce({ summary: 'Test Chat' });

    const { rerender } = renderHook(
      ({ msgs }) =>
        useChatSummary({
          chatId: 'chat-123',
          messages: msgs,
          enabled: true
        }),
      { initialProps: { msgs: messages } }
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    // Add more messages and rerender
    const moreMessages = [
      ...messages,
      { role: 'assistant' as const, content: 'I am fine!' }
    ];

    rerender({ msgs: moreMessages });

    // Wait to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should still be called only once
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('should NOT trigger if enabled is false', async () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
      { role: 'user' as const, content: 'How are you?' }
    ];

    const mockPost = vi.mocked(apiClient.post);

    renderHook(() =>
      useChatSummary({
        chatId: 'chat-123',
        messages,
        enabled: false
      })
    );

    // Wait to ensure no call is made
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const messages = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
      { role: 'user' as const, content: 'How are you?' }
    ];

    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockRejectedValueOnce(new Error('API Error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() =>
      useChatSummary({
        chatId: 'chat-123',
        messages,
        enabled: true
      })
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to generate summary:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should only take first 4 messages for summary', async () => {
    const messages = [
      { role: 'user' as const, content: 'Message 1' },
      { role: 'assistant' as const, content: 'Message 2' },
      { role: 'user' as const, content: 'Message 3' },
      { role: 'assistant' as const, content: 'Message 4' },
      { role: 'user' as const, content: 'Message 5' },
      { role: 'assistant' as const, content: 'Message 6' }
    ];

    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValueOnce({ summary: 'Test Chat' });

    renderHook(() =>
      useChatSummary({
        chatId: 'chat-123',
        messages,
        enabled: true
      })
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/chat/summary', {
        chatId: 'chat-123',
        messages: messages.slice(0, 4) // Only first 4 messages
      });
    });
  });
});
