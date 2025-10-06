import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { GermanState, TeachingSubject, TeachingPreference } from '../lib/types';

export interface UseDataSearchReturn {
  // States
  states: GermanState[];
  statesLoading: boolean;
  statesError: string | null;
  searchStates: (query: string) => Promise<void>;

  // Subjects
  subjects: TeachingSubject[];
  subjectsLoading: boolean;
  subjectsError: string | null;
  subjectCategories: string[];
  searchSubjects: (query: string, category?: string) => Promise<void>;

  // Preferences
  preferences: TeachingPreference[];
  preferencesLoading: boolean;
  preferencesError: string | null;
  preferenceCategories: string[];
  searchPreferences: (query: string, category?: string) => Promise<void>;
}

/**
 * Custom hook for searching onboarding data from backend
 * Provides search functionality for states, subjects, and preferences
 */
export const useDataSearch = (): UseDataSearchReturn => {
  // States
  const [states, setStates] = useState<GermanState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);

  // Subjects
  const [subjects, setSubjects] = useState<TeachingSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [subjectCategories, setSubjectCategories] = useState<string[]>([]);

  // Preferences
  const [preferences, setPreferences] = useState<TeachingPreference[]>([]);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferenceCategories, setPreferenceCategories] = useState<string[]>([]);

  const searchStates = useCallback(async (query: string): Promise<void> => {
    setStatesLoading(true);
    setStatesError(null);

    try {
      const result = await apiClient.getGermanStates(query);
      setStates(result.states);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search states';
      setStatesError(errorMessage);
      console.error('Error searching states:', err);
    } finally {
      setStatesLoading(false);
    }
  }, []);

  const searchSubjects = useCallback(async (query: string, category?: string): Promise<void> => {
    setSubjectsLoading(true);
    setSubjectsError(null);

    try {
      const result = await apiClient.getTeachingSubjects(query, category);
      setSubjects(result.subjects);
      setSubjectCategories(result.categories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search subjects';
      setSubjectsError(errorMessage);
      console.error('Error searching subjects:', err);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  const searchPreferences = useCallback(async (query: string, category?: string): Promise<void> => {
    setPreferencesLoading(true);
    setPreferencesError(null);

    try {
      const result = await apiClient.getTeachingPreferences(query, category);
      setPreferences(result.preferences);
      setPreferenceCategories(result.categories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search preferences';
      setPreferencesError(errorMessage);
      console.error('Error searching preferences:', err);
    } finally {
      setPreferencesLoading(false);
    }
  }, []);

  // Load initial data for each category
  useEffect(() => {
    // Load some initial states (top results)
    searchStates('').catch(console.error);
  }, [searchStates]);

  useEffect(() => {
    // Load some initial subjects
    searchSubjects('').catch(console.error);
  }, [searchSubjects]);

  useEffect(() => {
    // Load some initial preferences
    searchPreferences('').catch(console.error);
  }, [searchPreferences]);

  return {
    // States
    states,
    statesLoading,
    statesError,
    searchStates,

    // Subjects
    subjects,
    subjectsLoading,
    subjectsError,
    subjectCategories,
    searchSubjects,

    // Preferences
    preferences,
    preferencesLoading,
    preferencesError,
    preferenceCategories,
    searchPreferences,
  };
};

export default useDataSearch;