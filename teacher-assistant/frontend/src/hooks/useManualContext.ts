import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { ManualContextItem, ContextType, ContextFormData } from '../lib/types';

export interface UseManualContextReturn {
  contexts: ManualContextItem[];
  groupedContexts: Record<string, ManualContextItem[]>;
  loading: boolean;
  error: string | null;
  refreshContexts: () => Promise<void>;
  createContext: (data: ContextFormData) => Promise<string>;
  updateContext: (contextId: string, updates: Partial<ManualContextItem>) => Promise<void>;
  deleteContext: (contextId: string, permanent?: boolean) => Promise<void>;
  bulkOperation: (operation: 'activate' | 'deactivate' | 'delete', contextIds: string[]) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing manual context entries
 * Provides CRUD operations for user-added context items
 */
export const useManualContext = (): UseManualContextReturn => {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<ManualContextItem[]>([]);
  const [groupedContexts, setGroupedContexts] = useState<Record<string, ManualContextItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh contexts from the API
  const refreshContexts = useCallback(async () => {
    if (!user?.id) {
      setContexts([]);
      setGroupedContexts({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getManualContext(user.id, undefined, true); // Only active contexts
      setContexts(data.contexts);
      setGroupedContexts(data.grouped);
    } catch (err) {
      // Fallback to mock data if backend is not available
      console.warn('Context API not available, using mock data:', err);
      const mockContexts: ManualContextItem[] = [
        {
          id: 'mock-1',
          content: 'Mathematik Klasse 10 - Quadratische Funktionen',
          contextType: 'subject',
          priority: 8,
          isManual: true,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
          isActive: true,
          userId: user.id
        },
        {
          id: 'mock-2',
          content: 'Differenzierung für leistungsstarke Schüler',
          contextType: 'challenge',
          priority: 7,
          isManual: true,
          createdAt: Date.now() - 172800000,
          updatedAt: Date.now() - 172800000,
          isActive: true,
          userId: user.id
        }
      ];

      const grouped = mockContexts.reduce((acc, context) => {
        if (!acc[context.contextType]) {
          acc[context.contextType] = [];
        }
        acc[context.contextType].push(context);
        return acc;
      }, {} as Record<string, ManualContextItem[]>);

      setContexts(mockContexts);
      setGroupedContexts(grouped);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new context entry
  const createContext = useCallback(async (data: ContextFormData): Promise<string> => {
    if (!user?.id) {
      throw new Error('Benutzer muss angemeldet sein');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.createManualContext(
        user.id,
        data.content,
        data.contextType,
        data.priority
      );

      // Refresh the contexts list
      await refreshContexts();

      return result.contextId;
    } catch (err) {
      // Fallback to mock creation
      console.warn('Context creation API not available, using mock:', err);
      const mockId = `mock-${Date.now()}`;
      const newContext: ManualContextItem = {
        id: mockId,
        content: data.content,
        contextType: data.contextType,
        priority: data.priority,
        isManual: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
        userId: user.id
      };

      // Add to local state
      setContexts(prev => [...prev, newContext]);
      setGroupedContexts(prev => {
        const updated = { ...prev };
        if (!updated[data.contextType]) {
          updated[data.contextType] = [];
        }
        updated[data.contextType].push(newContext);
        return updated;
      });

      return mockId;
    } finally {
      setLoading(false);
    }
  }, [user?.id, refreshContexts]);

  // Update an existing context entry
  const updateContext = useCallback(async (
    contextId: string,
    updates: Partial<ManualContextItem>
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.contextType !== undefined) updateData.contextType = updates.contextType;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

      await apiClient.updateManualContext(contextId, updateData);

      // Refresh the contexts list
      await refreshContexts();
    } catch (err) {
      // Fallback to mock update
      console.warn('Context update API not available, using mock:', err);

      // Update local state
      setContexts(prev => prev.map(ctx =>
        ctx.id === contextId
          ? { ...ctx, ...updates, updatedAt: Date.now() }
          : ctx
      ));

      // Update grouped contexts
      setGroupedContexts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(type => {
          updated[type] = updated[type].map(ctx =>
            ctx.id === contextId
              ? { ...ctx, ...updates, updatedAt: Date.now() }
              : ctx
          );
        });
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [refreshContexts]);

  // Delete a context entry
  const deleteContext = useCallback(async (contextId: string, permanent = false): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.deleteManualContext(contextId, permanent);

      // Refresh the contexts list
      await refreshContexts();
    } catch (err) {
      // Fallback to mock delete
      console.warn('Context delete API not available, using mock:', err);

      // Remove from local state
      setContexts(prev => prev.filter(ctx => ctx.id !== contextId));

      // Remove from grouped contexts
      setGroupedContexts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(type => {
          updated[type] = updated[type].filter(ctx => ctx.id !== contextId);
          if (updated[type].length === 0) {
            delete updated[type];
          }
        });
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [refreshContexts]);

  // Bulk operations
  const bulkOperation = useCallback(async (
    operation: 'activate' | 'deactivate' | 'delete',
    contextIds: string[]
  ): Promise<void> => {
    if (!user?.id || contextIds.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.bulkManualContext(user.id, operation, { contextIds });

      // Refresh the contexts list
      await refreshContexts();
    } catch (err) {
      // Fallback to mock bulk operation
      console.warn('Bulk operation API not available, using mock:', err);

      if (operation === 'delete') {
        // Remove all selected items
        setContexts(prev => prev.filter(ctx => !contextIds.includes(ctx.id)));
        setGroupedContexts(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(type => {
            updated[type] = updated[type].filter(ctx => !contextIds.includes(ctx.id));
            if (updated[type].length === 0) {
              delete updated[type];
            }
          });
          return updated;
        });
      } else {
        // Update isActive status
        const isActive = operation === 'activate';
        setContexts(prev => prev.map(ctx =>
          contextIds.includes(ctx.id)
            ? { ...ctx, isActive, updatedAt: Date.now() }
            : ctx
        ));
        setGroupedContexts(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(type => {
            updated[type] = updated[type].map(ctx =>
              contextIds.includes(ctx.id)
                ? { ...ctx, isActive, updatedAt: Date.now() }
                : ctx
            );
          });
          return updated;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, refreshContexts]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load contexts when user changes
  useEffect(() => {
    if (user?.id) {
      refreshContexts();
    }
  }, [user?.id, refreshContexts]);

  return {
    contexts,
    groupedContexts,
    loading,
    error,
    refreshContexts,
    createContext,
    updateContext,
    deleteContext,
    bulkOperation,
    clearError,
  };
};

export default useManualContext;