import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { OnboardingData, OnboardingStatus } from '../lib/types';

export interface UseOnboardingReturn {
  onboardingStatus: OnboardingStatus | null;
  loading: boolean;
  error: string | null;
  saveOnboardingData: (data: Omit<OnboardingData, 'userId'>) => Promise<void>;
  checkOnboardingStatus: () => Promise<OnboardingStatus | null>;
  updateOnboardingData: (data: Partial<Omit<OnboardingData, 'userId'>>) => Promise<void>;
  isOnboardingComplete: boolean;
  clearCache: () => void;
  refreshStatus: () => Promise<OnboardingStatus | null>;
}

/**
 * Custom hook for managing user onboarding process
 * Handles saving, updating, and checking onboarding status
 */
export const useOnboarding = (): UseOnboardingReturn => {
  const { user } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Cache key for localStorage
  const getCacheKey = useCallback((userId: string) => `onboarding_status_${userId}`, []);

  // Load cached status on mount
  useEffect(() => {
    if (user?.id && !cacheLoaded) {
      try {
        const cached = localStorage.getItem(getCacheKey(user.id));
        if (cached) {
          const parsed = JSON.parse(cached);
          const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000; // 24 hours

          if (isRecent && parsed.userId === user.id) {
            setOnboardingStatus({
              userId: user.id,
              onboardingCompleted: parsed.completed,
              name: parsed.name,
              germanState: parsed.germanState,
              subjects: parsed.subjects,
              gradeLevel: parsed.gradeLevel,
              teachingPreferences: parsed.teachingPreferences,
              school: parsed.school,
              role: parsed.role,
              onboardingCompletedAt: parsed.completedAt
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load cached onboarding status:', e);
      } finally {
        setCacheLoaded(true);
      }
    }
  }, [user?.id, cacheLoaded, getCacheKey]);

  // Cache status helper
  const cacheStatus = useCallback((status: OnboardingStatus | null) => {
    if (user?.id && status) {
      try {
        localStorage.setItem(getCacheKey(user.id), JSON.stringify({
          completed: status.onboardingCompleted,
          timestamp: Date.now(),
          userId: user.id,
          name: status.name,
          germanState: status.germanState,
          subjects: status.subjects,
          gradeLevel: status.gradeLevel,
          teachingPreferences: status.teachingPreferences,
          school: status.school,
          role: status.role,
          completedAt: status.onboardingCompletedAt
        }));
      } catch (e) {
        console.warn('Failed to cache onboarding status:', e);
      }
    }
  }, [user?.id, getCacheKey]);

  const checkOnboardingStatus = useCallback(async (): Promise<OnboardingStatus | null> => {
    if (!user?.id) {
      setError('User must be authenticated');
      return null;
    }

    // Return cached status if available and recent
    if (onboardingStatus && cacheLoaded) {
      return onboardingStatus;
    }

    setLoading(true);
    setError(null);

    try {
      const status = await apiClient.getOnboardingStatus(user.id);
      setOnboardingStatus(status);
      cacheStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check onboarding status';

      // If user not found, create empty status
      if (errorMessage.includes('User not found') || errorMessage.includes('404')) {
        const emptyStatus: OnboardingStatus = {
          userId: user.id,
          onboardingCompleted: false,
        };
        setOnboardingStatus(emptyStatus);
        cacheStatus(emptyStatus);
        return emptyStatus;
      }

      setError(errorMessage);
      console.error('Error checking onboarding status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, onboardingStatus, cacheLoaded, cacheStatus]);

  // Force refresh status (bypass cache)
  const refreshStatus = useCallback(async (): Promise<OnboardingStatus | null> => {
    if (!user?.id) {
      setError('User must be authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const status = await apiClient.getOnboardingStatus(user.id);
      setOnboardingStatus(status);
      cacheStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh onboarding status';
      setError(errorMessage);
      console.error('Error refreshing onboarding status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, cacheStatus]);

  const saveOnboardingData = useCallback(async (data: Omit<OnboardingData, 'userId'>): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const fullData: OnboardingData = {
        ...data,
        userId: user.id,
      };

      await apiClient.saveOnboardingData(fullData);

      // Update local status
      const updatedStatus: OnboardingStatus = {
        userId: user.id,
        name: data.name,
        germanState: data.germanState,
        subjects: data.subjects,
        gradeLevel: data.gradeLevel,
        teachingPreferences: data.teachingPreferences,
        school: data.school,
        role: data.role,
        onboardingCompleted: true,
        onboardingCompletedAt: Date.now(),
      };

      setOnboardingStatus(updatedStatus);
      cacheStatus(updatedStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save onboarding data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateOnboardingData = useCallback(async (data: Partial<Omit<OnboardingData, 'userId'>>): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.updateOnboardingData(user.id, data);

      // Update local status
      if (onboardingStatus) {
        const updatedStatus = {
          ...onboardingStatus,
          ...data,
        };
        setOnboardingStatus(updatedStatus);
        cacheStatus(updatedStatus);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update onboarding data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, onboardingStatus]);

  // Clear cache helper
  const clearCache = useCallback(() => {
    if (user?.id) {
      try {
        localStorage.removeItem(getCacheKey(user.id));
        setOnboardingStatus(null);
        setCacheLoaded(false);
      } catch (e) {
        console.warn('Failed to clear onboarding cache:', e);
      }
    }
  }, [user?.id, getCacheKey]);

  const isOnboardingComplete = onboardingStatus?.onboardingCompleted ?? false;

  return {
    onboardingStatus,
    loading,
    error,
    saveOnboardingData,
    checkOnboardingStatus,
    updateOnboardingData,
    isOnboardingComplete,
    clearCache,
    refreshStatus,
  };
};

export default useOnboarding;