import { useCallback } from 'react';
import { id } from '@instantdb/react';
import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';
import type { LibraryMaterial, MaterialSummary } from '../lib/types';

/**
 * Custom hook for managing library materials with InstantDB
 */
export const useLibrary = () => {
  const { user } = useAuth();

  // Query user's library materials
  const { data: materialsData, error: materialsError } = db.useQuery(
    user ? {
      library_materials: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  // Get formatted materials for UI
  const materials: MaterialSummary[] = materialsData?.library_materials
    ? materialsData.library_materials.map((material: any) => ({
        id: material.id,
        title: material.title,
        type: material.type as LibraryMaterial['type'],
        description: material.description || '',
        tags: material.tags ? JSON.parse(material.tags) : [],
        createdAt: new Date(material.created_at),
        isFavorite: material.is_favorite,
        sourceChat: undefined, // Would need to populate from session data
      }))
    : [];

  // Create a new library material
  const createMaterial = useCallback(async (
    title: string,
    type: LibraryMaterial['type'],
    content: string,
    options?: {
      description?: string;
      tags?: string[];
      sourceSessionId?: string;
    }
  ) => {
    if (!user) {
      throw new Error('User must be authenticated to create materials');
    }

    const materialId = id();
    const now = Date.now();

    try {
      await db.transact([
        db.tx.library_materials[materialId].update({
          user_id: user.id,
          title,
          type,
          content,
          description: options?.description || '',
          tags: JSON.stringify(options?.tags || []),
          created_at: now,
          updated_at: now,
          is_favorite: false,
          source_session_id: options?.sourceSessionId,
        })
      ]);

      return materialId;
    } catch (error) {
      console.error('Failed to create material:', error);
      throw error;
    }
  }, [user]);

  // Update an existing material
  const updateMaterial = useCallback(async (
    materialId: string,
    updates: Partial<{
      title: string;
      type: LibraryMaterial['type'];
      content: string;
      description: string;
      tags: string[];
      is_favorite: boolean;
    }>
  ) => {
    if (!user) {
      throw new Error('User must be authenticated to update materials');
    }

    try {
      const updateData: any = { updated_at: Date.now() };

      if (updates.title) updateData.title = updates.title;
      if (updates.type) updateData.type = updates.type;
      if (updates.content) updateData.content = updates.content;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.tags) updateData.tags = JSON.stringify(updates.tags);
      if (updates.is_favorite !== undefined) updateData.is_favorite = updates.is_favorite;

      await db.transact([
        db.tx.library_materials[materialId].update(updateData)
      ]);
    } catch (error) {
      console.error('Failed to update material:', error);
      throw error;
    }
  }, [user]);

  // Delete a material
  const deleteMaterial = useCallback(async (materialId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete materials');
    }

    try {
      await db.transact([
        db.tx.library_materials[materialId].delete()
      ]);
    } catch (error) {
      console.error('Failed to delete material:', error);
      throw error;
    }
  }, [user]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (materialId: string, isFavorite: boolean) => {
    return updateMaterial(materialId, { is_favorite: !isFavorite });
  }, [updateMaterial]);

  // Search materials
  const searchMaterials = useCallback((
    query: string,
    filters?: {
      type?: LibraryMaterial['type'];
      tags?: string[];
      favorites?: boolean;
    }
  ) => {
    return materials.filter(material => {
      // Text search
      const matchesQuery = !query ||
        material.title.toLowerCase().includes(query.toLowerCase()) ||
        material.description.toLowerCase().includes(query.toLowerCase()) ||
        material.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      // Type filter
      const matchesType = !filters?.type || material.type === filters.type;

      // Tags filter
      const matchesTags = !filters?.tags?.length ||
        filters.tags.some(tag => material.tags.includes(tag));

      // Favorites filter
      const matchesFavorites = filters?.favorites === undefined ||
        material.isFavorite === filters.favorites;

      return matchesQuery && matchesType && matchesTags && matchesFavorites;
    });
  }, [materials]);

  // Get materials by type
  const getMaterialsByType = useCallback((type: LibraryMaterial['type']) => {
    return materials.filter(material => material.type === type);
  }, [materials]);

  // Get favorite materials
  const getFavoriteMaterials = useCallback(() => {
    return materials.filter(material => material.isFavorite);
  }, [materials]);

  // Get materials created from specific chat session
  const getMaterialsFromSession = useCallback((sessionId: string) => {
    return materialsData?.library_materials?.filter(
      (material: any) => material.source_session_id === sessionId
    ) || [];
  }, [materialsData]);

  return {
    materials,
    loading: !user || (user && !materialsData && !materialsError),
    error: materialsError,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleFavorite,
    searchMaterials,
    getMaterialsByType,
    getFavoriteMaterials,
    getMaterialsFromSession,
  };
};

export default useLibrary;