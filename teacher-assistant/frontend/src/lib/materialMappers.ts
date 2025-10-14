/**
 * Material Type Mappers - T001
 * Converts between ArtifactItem (Library format) and UnifiedMaterial (MaterialPreviewModal format)
 *
 * Purpose: Enable Library.tsx to pass materials to MaterialPreviewModal component
 * Created: 2025-10-12 for specs/002-library-ux-fixes
 */

import { MaterialType, MaterialSource, UnifiedMaterial } from '../components/MaterialPreviewModal';

/**
 * ArtifactItem - Library data format
 * Represents materials as displayed in the Library grid
 * T007: Updated to include metadata field for regeneration support
 */
export interface ArtifactItem {
  id: string;
  title: string;
  type: 'document' | 'image' | 'worksheet' | 'quiz' | 'lesson_plan';
  description: string;       // For images: InstantDB storage URL
  dateCreated: Date;
  source: 'chat_generated' | 'uploaded' | 'manual';
  chatId?: string;
  metadata?: any;            // T007: Parsed metadata from InstantDB (includes originalParams for regeneration)
  is_favorite?: boolean;     // T007: Favorite status from InstantDB
}

/**
 * Re-export UnifiedMaterial for convenience
 * (Already defined in MaterialPreviewModal.tsx)
 */
export type { UnifiedMaterial, MaterialType, MaterialSource };

/**
 * Maps ArtifactItem source to MaterialSource
 * Handles different source naming conventions between Library and MaterialPreviewModal
 */
function mapSource(artifactSource: ArtifactItem['source']): MaterialSource {
  switch (artifactSource) {
    case 'chat_generated':
      return 'agent-generated';
    case 'uploaded':
      return 'upload';
    case 'manual':
      return 'manual';
    default:
      return 'manual'; // Fallback to manual for unknown sources
  }
}

/**
 * Converts ArtifactItem to UnifiedMaterial
 *
 * This enables Library.tsx to pass materials to MaterialPreviewModal.
 *
 * Features:
 * - Maps dateCreated (Date) to created_at/updated_at (timestamp number)
 * - Converts source naming conventions (chat_generated → agent-generated)
 * - Handles metadata parsing for image URLs
 * - Supports backward compatibility with old metadata structure
 * - T007: Preserves parsed metadata from InstantDB for regeneration support
 *
 * @param artifact - Material from Library data source
 * @returns UnifiedMaterial suitable for MaterialPreviewModal
 */
export function convertArtifactToUnifiedMaterial(artifact: ArtifactItem): UnifiedMaterial {
  const timestamp = artifact.dateCreated.getTime();

  // T007: Start with existing metadata from InstantDB (includes originalParams)
  const metadata: UnifiedMaterial['metadata'] = artifact.metadata ? { ...artifact.metadata } : {};

  // For images: Store URL in artifact_data (matches MaterialPreviewModal expectation)
  // ALWAYS use the current description field as source of truth for image URLs
  if (artifact.type === 'image' && artifact.description) {
    metadata.artifact_data = {
      ...(metadata.artifact_data || {}),  // Preserve other artifact_data fields
      url: artifact.description           // Always update URL to current value
    };
  }

  return {
    id: artifact.id,
    title: artifact.title,
    type: artifact.type as MaterialType,
    source: mapSource(artifact.source),
    created_at: timestamp,
    updated_at: timestamp,
    metadata,
    is_favorite: artifact.is_favorite || false, // T007: Use actual favorite status from InstantDB
  };
}
