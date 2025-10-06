import { useState, useCallback, useEffect } from 'react';
import { id } from '@instantdb/react';
import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import type {
  TeacherProfile,
  TeacherKnowledge,
  ChatMessage,
  ExtractionEvent,
  ProfileExtractionResponse
} from '../lib/types';

export interface UseTeacherProfileReturn {
  profile: TeacherProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (knowledgeData: TeacherKnowledge) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  extractFromConversation: (messages: ChatMessage[]) => Promise<void>;
  createProfile: (initialData?: Partial<TeacherProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook for managing teacher profiles and knowledge extraction
 * Integrates with InstantDB for persistence and backend for AI extraction
 */
export const useTeacherProfile = (): UseTeacherProfileReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileCreationAttempted, setProfileCreationAttempted] = useState(false);

  // Query current user's teacher profile
  const { data: profileData, error: profileError } = db.useQuery(
    user ? {
      teacher_profiles: {
        $: {
          where: { user_id: user.id }
        }
      }
    } : null
  );

  // Get the profile from query data
  const profile = profileData?.teacher_profiles?.[0] ? {
    ...profileData.teacher_profiles[0],
    // display_name: profileData.teacher_profiles[0].display_name || undefined,
    subjects: JSON.parse(profileData.teacher_profiles[0].subjects || '[]'),
    grades: JSON.parse(profileData.teacher_profiles[0].grades || '[]'),
    teaching_methods: JSON.parse(profileData.teacher_profiles[0].teaching_methods || '[]'),
    topics: JSON.parse(profileData.teacher_profiles[0].topics || '[]'),
    challenges: JSON.parse(profileData.teacher_profiles[0].challenges || '[]'),
    extraction_history: JSON.parse(profileData.teacher_profiles[0].extraction_history || '[]'),
  } as TeacherProfile : null;

  // Create a new teacher profile
  const createProfile = useCallback(async (initialData?: Partial<TeacherProfile>) => {
    if (!user) {
      throw new Error('User must be authenticated to create a profile');
    }

    // Prevent duplicate creation attempts
    if (profileCreationAttempted) {
      console.log('Profile creation already attempted, skipping...');
      return;
    }

    setLoading(true);
    setError(null);
    setProfileCreationAttempted(true);

    try {
      const profileId = id();
      const now = Date.now();

      const newProfile = {
        user_id: user.id,
        // display_name: initialData?.display_name || null,
        subjects: JSON.stringify(initialData?.subjects || []),
        grades: JSON.stringify(initialData?.grades || []),
        school_type: initialData?.school_type || null,
        teaching_methods: JSON.stringify(initialData?.teaching_methods || []),
        topics: JSON.stringify(initialData?.topics || []),
        challenges: JSON.stringify(initialData?.challenges || []),
        created_at: now,
        last_updated: now,
        conversation_count: 0,
        extraction_history: JSON.stringify([]),
      };

      await db.transact([
        db.tx.teacher_profiles[profileId].update(newProfile)
      ]);

      console.log('Teacher profile created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';

      // If it's a duplicate error, don't treat it as a real error
      if (errorMessage.includes('unique attribute') || errorMessage.includes('already exists')) {
        console.log('Profile already exists, this is expected');
        setError(null);
      } else {
        setError(errorMessage);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [user, profileCreationAttempted]);

  // Update profile with new knowledge data
  const updateProfile = useCallback(async (knowledgeData: TeacherKnowledge) => {
    if (!user || !profile) {
      throw new Error('Profile must exist to update');
    }

    // Safety check: ensure knowledgeData is valid
    if (!knowledgeData || typeof knowledgeData !== 'object') {
      console.warn('Invalid knowledgeData provided to updateProfile:', knowledgeData);
      return; // Skip update if data is invalid
    }

    setLoading(true);
    setError(null);

    try {
      const now = Date.now();

      // Ensure profile data exists with safe defaults
      const safeProfile = {
        subjects: profile.subjects || [],
        grades: profile.grades || [],
        school_type: profile.school_type || null,
        teaching_methods: profile.teaching_methods || [],
        topics: profile.topics || [],
        challenges: profile.challenges || [],
        extraction_history: profile.extraction_history || []
      };

      // Merge new knowledge with existing profile data - with safe defaults for knowledgeData
      const mergedData = {
        subjects: mergeArrays(safeProfile.subjects, knowledgeData?.subjects || []),
        grades: mergeArrays(safeProfile.grades, knowledgeData?.grades || []),
        school_type: knowledgeData?.school_type || safeProfile.school_type,
        teaching_methods: mergeArrays(safeProfile.teaching_methods, knowledgeData?.teaching_methods || []),
        topics: mergeArrays(safeProfile.topics, knowledgeData?.topics || []),
        challenges: mergeArrays(safeProfile.challenges, knowledgeData?.challenges || []),
      };

      // Create extraction event
      const extractionEvent: ExtractionEvent = {
        id: id(),
        timestamp: now,
        conversation_length: 0, // Will be set by caller
        extracted_data: knowledgeData,
        confidence_score: 0.85, // Default confidence
      };

      const updatedHistory = [...safeProfile.extraction_history, extractionEvent];

      await db.transact([
        db.tx.teacher_profiles[profile.id].update({
          subjects: JSON.stringify(mergedData.subjects),
          grades: JSON.stringify(mergedData.grades),
          school_type: mergedData.school_type,
          teaching_methods: JSON.stringify(mergedData.teaching_methods),
          topics: JSON.stringify(mergedData.topics),
          challenges: JSON.stringify(mergedData.challenges),
          last_updated: now,
          conversation_count: profile.conversation_count + 1,
          extraction_history: JSON.stringify(updatedHistory),
        })
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Update display name
  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!user || !profile) {
      throw new Error('Profile must exist to update display name');
    }

    setLoading(true);
    setError(null);

    try {
      const now = Date.now();

      await db.transact([
        db.tx.teacher_profiles[profile.id].update({
          // display_name: displayName,
          last_updated: now,
        })
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update display name';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Extract knowledge from conversation messages
  const extractFromConversation = useCallback(async (messages: ChatMessage[]) => {
    if (!user) {
      throw new Error('User must be authenticated to extract knowledge');
    }

    // Ensure profile exists, create if needed
    if (!profile) {
      await createProfile();
    }

    setLoading(true);
    setError(null);

    try {
      // Convert messages to API format
      const apiMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Call backend extraction API
      const extractionResponse = await apiClient.extractTeacherProfile({
        messages: apiMessages,
        existing_profile: profile,
      });

      // Update profile with extracted knowledge
      await updateProfile(extractionResponse.extracted_knowledge);

      console.log('Knowledge extracted successfully:', {
        reasoning: extractionResponse.reasoning,
        confidence: extractionResponse.confidence_scores,
        knowledge: extractionResponse.extracted_knowledge,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract knowledge';
      setError(errorMessage);
      console.error('Knowledge extraction failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, profile, createProfile, updateProfile]);

  // Refresh profile data from database
  const refreshProfile = useCallback(async () => {
    // InstantDB will automatically refresh the query data
    // This is a no-op but kept for API consistency
    console.log('Profile refreshed via InstantDB reactivity');
  }, []);

  // Reset profile creation attempt flag when user changes
  useEffect(() => {
    setProfileCreationAttempted(false);
  }, [user?.id]);

  // Auto-create profile for new users
  useEffect(() => {
    if (user && !profile && !profileError && !loading && !profileCreationAttempted) {
      // Add a small delay to ensure InstantDB query has had time to complete
      const timer = setTimeout(() => {
        // Double-check that profile is still null after delay
        if (!profile && !profileCreationAttempted) {
          createProfile().catch(err => {
            console.error('Failed to auto-create profile:', err);
          });
        }
      }, 500); // 500ms delay

      return () => clearTimeout(timer);
    }
  }, [user, profile, profileError, loading, profileCreationAttempted, createProfile]);

  return {
    profile,
    loading,
    error: error || (profileError ? 'Failed to load profile' : null),
    updateProfile,
    updateDisplayName,
    extractFromConversation,
    createProfile,
    refreshProfile,
  };
};

// Helper function to merge arrays while removing duplicates
function mergeArrays(existing: string[] = [], newItems: string[] = []): string[] {
  const combined = [...existing, ...newItems];
  return Array.from(new Set(combined.filter(Boolean))); // Remove duplicates and empty strings
}

export default useTeacherProfile;