import { useState, useCallback } from 'react';
import { id } from '@instantdb/react';
import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';

export interface LibraryMaterial {
  id: string;
  user_id: string;
  title: string;
  type: 'lesson_plan' | 'quiz' | 'worksheet' | 'resource' | 'document' | 'image';
  content: string;
  description?: string;
  tags: string[];
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
  source_session_id?: string;
  metadata?: any; // JSON metadata field for originalParams, imageStyle, etc. (stored as JSON in InstantDB)
}

export interface CreateMaterialData {
  title: string;
  type: LibraryMaterial['type'];
  content: string;
  description?: string;
  tags?: string[];
  source_session_id?: string;
}

export interface UpdateMaterialData {
  title?: string;
  type?: LibraryMaterial['type'];
  content?: string;
  description?: string;
  tags?: string[];
  is_favorite?: boolean;
}

/**
 * Custom hook for managing library materials with InstantDB persistence
 */
export const useLibraryMaterials = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query all user materials
  const { data: materialsData, error: queryError } = db.useQuery(
    user ? {
      library_materials: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  const materials: LibraryMaterial[] = materialsData?.library_materials?.map(material => {
    // T041: Parse metadata JSON string from InstantDB for MaterialPreviewModal
    let parsedMetadata = undefined;
    if (material.metadata) {
      try {
        parsedMetadata = typeof material.metadata === 'string' ? JSON.parse(material.metadata) : material.metadata;
      } catch (err) {
        console.error('Error parsing material metadata:', err, { materialId: material.id });
        parsedMetadata = undefined;
      }
    }

    return {
      id: material.id,
      user_id: material.user_id,
      title: material.title,
      type: material.type as LibraryMaterial['type'],
      content: material.content,
      description: material.description,
      tags: typeof material.tags === 'string' ? JSON.parse(material.tags) : material.tags || [],
      created_at: material.created_at,
      updated_at: material.updated_at,
      is_favorite: material.is_favorite,
      source_session_id: material.source_session_id,
      metadata: parsedMetadata,
    };
  }) || [];

  // Create a new material
  const createMaterial = useCallback(async (data: CreateMaterialData): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated to create materials');
    }

    setLoading(true);
    setError(null);

    const materialId = id();
    const now = Date.now();

    try {
      await db.transact([
        db.tx.library_materials[materialId].update({
          user_id: user.id,
          title: data.title,
          type: data.type,
          content: data.content,
          description: data.description || '',
          tags: JSON.stringify(data.tags || []),
          created_at: now,
          updated_at: now,
          is_favorite: false,
          source_session_id: data.source_session_id,
        })
      ]);

      return materialId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create material';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update an existing material
  const updateMaterial = useCallback(async (
    materialId: string,
    data: UpdateMaterialData
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update materials');
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        updated_at: Date.now(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
      if (data.is_favorite !== undefined) updateData.is_favorite = data.is_favorite;

      await db.transact([
        db.tx.library_materials[materialId].update(updateData)
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update material';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete a material
  const deleteMaterial = useCallback(async (materialId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete materials');
    }

    setLoading(true);
    setError(null);

    try {
      await db.transact([
        db.tx.library_materials[materialId].delete()
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete material';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (materialId: string): Promise<void> => {
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      throw new Error('Material not found');
    }

    await updateMaterial(materialId, { is_favorite: !material.is_favorite });
  }, [materials, updateMaterial]);

  // Get materials by type
  const getMaterialsByType = useCallback((type: LibraryMaterial['type']) => {
    return materials.filter(material => material.type === type);
  }, [materials]);

  // Get materials by tag
  const getMaterialsByTag = useCallback((tag: string) => {
    return materials.filter(material => material.tags.includes(tag));
  }, [materials]);

  // Search materials
  const searchMaterials = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return materials.filter(material =>
      material.title.toLowerCase().includes(lowercaseQuery) ||
      material.description?.toLowerCase().includes(lowercaseQuery) ||
      material.content.toLowerCase().includes(lowercaseQuery) ||
      material.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [materials]);

  // Get all unique tags
  const getAllTags = useCallback(() => {
    const tagSet = new Set<string>();
    materials.forEach(material => {
      material.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [materials]);

  // Get statistics
  const getStats = useCallback(() => {
    return {
      total: materials.length,
      byType: {
        lesson_plan: getMaterialsByType('lesson_plan').length,
        quiz: getMaterialsByType('quiz').length,
        worksheet: getMaterialsByType('worksheet').length,
        resource: getMaterialsByType('resource').length,
        document: getMaterialsByType('document').length,
        image: getMaterialsByType('image').length,
      },
      favorites: materials.filter(m => m.is_favorite).length,
      tags: getAllTags().length,
    };
  }, [materials, getMaterialsByType, getAllTags]);

  return {
    materials,
    loading,
    error: error || queryError,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleFavorite,
    getMaterialsByType,
    getMaterialsByTag,
    searchMaterials,
    getAllTags,
    getStats,
  };
};

export default useLibraryMaterials;