import { useMemo } from 'react';
import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';

export type MaterialSource = 'manual' | 'upload' | 'agent-generated';

export type MaterialType =
  | 'lesson-plan'
  | 'worksheet'
  | 'quiz'
  | 'document'
  | 'image'
  | 'upload-pdf'
  | 'upload-image'
  | 'upload-doc'
  | 'resource';

export interface UnifiedMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  source: MaterialSource;
  created_at: number;
  updated_at: number;
  metadata: {
    // For uploads
    filename?: string;
    file_url?: string;
    file_type?: string;
    image_data?: string;

    // For generated artifacts
    agent_id?: string;
    agent_name?: string;
    prompt?: string;
    model_used?: string;
    artifact_data?: Record<string, any>;

    // For manual materials
    tags?: string[];
    subject?: string;
    grade?: string;
    content?: string;
  };
  is_favorite: boolean;
  usage_count?: number;
}

/**
 * Custom hook to fetch and unify materials from 3 data sources:
 * - artifacts (manually created materials)
 * - generated_artifacts (AI-generated materials)
 * - messages (uploads extracted from message content)
 *
 * Returns unified materials sorted by updated_at descending
 */
export function useMaterials() {
  const { user } = useAuth();

  // Fetch all 3 data sources with error handling
  // Note: These queries may fail if the schema is not yet deployed to InstantDB cloud
  const { data: artifactsData, isLoading: artifactsLoading, error: artifactsError } = db.useQuery(
    user ? {
      artifacts: {
        $: {
          where: { owner_id: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  const { data: generatedData, isLoading: generatedLoading, error: generatedError } = db.useQuery(
    user ? {
      generated_artifacts: {
        $: {
          where: { creator_id: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = db.useQuery(
    user ? {
      messages: {
        $: {
          where: { user_id: user.id, role: 'user' },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  // Log errors for debugging
  if (artifactsError) {
    console.warn('Failed to fetch artifacts:', artifactsError);
  }
  if (generatedError) {
    console.warn('Failed to fetch generated_artifacts:', generatedError);
  }
  if (messagesError) {
    console.warn('Failed to fetch messages:', messagesError);
  }

  // Transform and combine data
  const materials = useMemo<UnifiedMaterial[]>(() => {
    const result: UnifiedMaterial[] = [];

    // 1. Transform manual artifacts
    if (artifactsData?.artifacts) {
      artifactsData.artifacts.forEach((artifact: any) => {
        // Parse tags if they're JSON string
        let parsedTags: string[] = [];
        if (artifact.tags) {
          try {
            parsedTags = typeof artifact.tags === 'string'
              ? JSON.parse(artifact.tags)
              : artifact.tags;
          } catch (e) {
            // If parsing fails, treat as empty array
            parsedTags = [];
          }
        }

        result.push({
          id: artifact.id,
          title: artifact.title || 'Ohne Titel',
          description: artifact.content?.substring(0, 200), // First 200 chars
          type: artifact.type as MaterialType,
          source: 'manual',
          created_at: artifact.created_at || Date.now(),
          updated_at: artifact.updated_at || artifact.created_at || Date.now(),
          metadata: {
            tags: parsedTags,
            subject: artifact.subject,
            grade: artifact.grade_level,
            content: artifact.content
          },
          is_favorite: artifact.is_favorite || false,
          usage_count: artifact.usage_count || 0
        });
      });
    }

    // 2. Transform generated artifacts
    if (generatedData?.generated_artifacts) {
      generatedData.generated_artifacts.forEach((generated: any) => {
        // Parse artifact_data if it's JSON string
        let artifactData: Record<string, any> = {};
        if (generated.artifact_data) {
          try {
            artifactData = typeof generated.artifact_data === 'string'
              ? JSON.parse(generated.artifact_data)
              : generated.artifact_data;
          } catch (e) {
            // If parsing fails, use empty object
            artifactData = {};
          }
        }

        // Extract tags from artifact_data for search purposes (invisible to UI)
        let searchTags: string[] = [];
        if (artifactData.tags && Array.isArray(artifactData.tags)) {
          searchTags = artifactData.tags;
        }

        result.push({
          id: generated.id,
          title: generated.title || 'Generiertes Material',
          description: generated.prompt?.substring(0, 200),
          type: generated.type as MaterialType,
          source: 'agent-generated',
          created_at: generated.created_at || Date.now(),
          updated_at: generated.updated_at || generated.created_at || Date.now(),
          metadata: {
            agent_id: generated.agent_id,
            agent_name: generated.agent?.name,
            prompt: generated.prompt,
            model_used: generated.model_used,
            artifact_data: artifactData,
            tags: searchTags // Extract tags to metadata.tags for unified search
          },
          is_favorite: generated.is_favorite || false,
          usage_count: generated.usage_count || 0
        });
      });
    }

    // 3. Transform uploads from messages
    if (messagesData?.messages) {
      messagesData.messages.forEach((message: any) => {
        try {
          const parsedContent = JSON.parse(message.content);

          // Handle image uploads
          if (parsedContent.image_data) {
            result.push({
              id: `upload-img-${message.id}`,
              title: `Bild vom ${new Date(message.timestamp).toLocaleDateString('de-DE')}`,
              type: 'upload-image',
              source: 'upload',
              created_at: message.timestamp || Date.now(),
              updated_at: message.timestamp || Date.now(),
              metadata: {
                filename: `image_${message.id}.jpg`,
                file_type: 'image/jpeg',
                image_data: parsedContent.image_data
              },
              is_favorite: false
            });
          }

          // Handle file uploads
          if (parsedContent.fileIds && parsedContent.filenames) {
            parsedContent.fileIds.forEach((fileId: string, index: number) => {
              const filename = parsedContent.filenames[index] || `file_${index + 1}`;
              const isPdf = filename.toLowerCase().endsWith('.pdf');
              const isDoc = filename.toLowerCase().match(/\.(doc|docx|txt)$/);

              result.push({
                id: `upload-file-${fileId}`,
                title: filename,
                type: isPdf ? 'upload-pdf' : isDoc ? 'upload-doc' : 'document',
                source: 'upload',
                created_at: message.timestamp || Date.now(),
                updated_at: message.timestamp || Date.now(),
                metadata: {
                  filename,
                  file_url: fileId, // InstantDB file ID
                  file_type: isPdf ? 'application/pdf' : 'application/octet-stream'
                },
                is_favorite: false
              });
            });
          }
        } catch (e) {
          // Not JSON or parsing error, skip
        }
      });
    }

    // Sort by updated_at descending
    return result.sort((a, b) => b.updated_at - a.updated_at);
  }, [artifactsData, generatedData, messagesData]);

  // Combine errors
  const error = artifactsError || generatedError || messagesError;

  return {
    materials,
    loading: artifactsLoading || generatedLoading || messagesLoading,
    error: error ? String(error) : undefined,
  };
}

export default useMaterials;