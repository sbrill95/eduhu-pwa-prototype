import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';

/**
 * Profile Characteristic Interface
 * Matches backend schema from plan.md
 */
export interface ProfileCharacteristic {
  id: string;
  user_id: string;
  characteristic: string;
  category: 'subjects' | 'gradeLevel' | 'teachingStyle' | 'schoolType' | 'topics' | 'uncategorized';
  count: number;
  first_seen: string; // ISO date
  last_seen: string; // ISO date
  manually_added: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Grouped characteristics by category
 */
export type GroupedCharacteristics = Record<string, ProfileCharacteristic[]>;

/**
 * Custom hook for managing profile characteristics
 * Features:
 * - Fetch user's profile characteristics (count >= 3)
 * - Group characteristics by category for display
 * - Add manual characteristics
 * - Refetch capability
 *
 * @returns Profile characteristics data and mutation functions
 */
export const useProfileCharacteristics = () => {
  const { user } = useAuth();
  const [characteristics, setCharacteristics] = useState<ProfileCharacteristic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch user's profile characteristics from API
   */
  const fetchCharacteristics = useCallback(async () => {
    if (!user?.id) {
      setCharacteristics([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          characteristics: ProfileCharacteristic[];
        };
      }>(`/profile/characteristics?userId=${user.id}`);

      setCharacteristics(response.data.characteristics || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch profile characteristics');
      setError(error);
      console.error('Error fetching profile characteristics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Group characteristics by category for display
   * Computed property - updates when characteristics change
   */
  const groupedCharacteristics = useMemo(() => {
    if (!characteristics || characteristics.length === 0) {
      return {} as GroupedCharacteristics;
    }

    return characteristics.reduce((acc, char) => {
      const category = char.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(char);
      return acc;
    }, {} as GroupedCharacteristics);
  }, [characteristics]);

  /**
   * Add a characteristic manually
   * @param text - The characteristic text (e.g., "Mathematik", "Gruppenarbeit")
   */
  const addCharacteristic = useCallback(async (text: string) => {
    if (!user?.id || !text.trim()) {
      throw new Error('User ID and characteristic text are required');
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/profile/characteristics/add', {
        userId: user.id,
        characteristic: text.trim()
      });

      // Refetch characteristics after successful add
      await fetchCharacteristics();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add characteristic');
      setError(error);
      console.error('Error adding characteristic:', error);
      throw error; // Re-throw so caller can handle
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchCharacteristics]);

  /**
   * Refetch characteristics manually
   */
  const refetch = useCallback(() => {
    return fetchCharacteristics();
  }, [fetchCharacteristics]);

  // Initial fetch when user changes
  useEffect(() => {
    fetchCharacteristics();
  }, [fetchCharacteristics]);

  return {
    characteristics,
    groupedCharacteristics,
    isLoading,
    error,
    addCharacteristic,
    refetch
  };
};
