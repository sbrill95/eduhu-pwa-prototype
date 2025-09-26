import { useState, useCallback } from 'react';
import { apiClient, type ChatRequest, type ChatResponse, type HealthResponse } from '../lib/api';

// Generic API hook state
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Health check hook
export function useHealth() {
  const [state, setState] = useState<ApiState<HealthResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const health = await apiClient.getHealth();
      setState({ data: health, loading: false, error: null });
      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  return { ...state, checkHealth };
}

// Chat hook
export function useChat() {
  const [state, setState] = useState<ApiState<ChatResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const sendMessage = useCallback(async (request: ChatRequest) => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await apiClient.sendChatMessage(request);
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, sendMessage, resetState };
}

// Chat models hook
export function useChatModels() {
  const [state, setState] = useState<ApiState<{ models: any[]; default: string }>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchModels = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const models = await apiClient.getChatModels();
      setState({ data: models, loading: false, error: null });
      return models;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  return { ...state, fetchModels };
}

// Chat health hook
export function useChatHealth() {
  const [state, setState] = useState<ApiState<{ status: 'healthy' | 'unhealthy'; message?: string }>>({
    data: null,
    loading: false,
    error: null,
  });

  const checkChatHealth = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const health = await apiClient.getChatHealth();
      setState({ data: health, loading: false, error: null });
      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  return { ...state, checkChatHealth };
}

// Combined API status hook for dashboard/monitoring
export function useApiStatus() {
  const healthHook = useHealth();
  const chatHealthHook = useChatHealth();

  const checkAllServices = useCallback(async () => {
    const promises = [
      healthHook.checkHealth(),
      chatHealthHook.checkChatHealth(),
    ];

    const results = await Promise.allSettled(promises);

    return {
      health: results[0],
      chatHealth: results[1],
    };
  }, [healthHook.checkHealth, chatHealthHook.checkChatHealth]);

  return {
    health: healthHook,
    chatHealth: chatHealthHook,
    checkAllServices,
    isLoading: healthHook.loading || chatHealthHook.loading,
    hasErrors: !!healthHook.error || !!chatHealthHook.error,
  };
}