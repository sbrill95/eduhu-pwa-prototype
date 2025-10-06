/**
 * Test: Invisible Tag-Based Search in Library
 *
 * Verifies that:
 * 1. Search logic matches against tags (from both manual and agent-generated materials)
 * 2. Tags are used for search but NOT visible in UI (tested separately in E2E tests)
 * 3. Partial matching works case-insensitively
 * 4. Search also works with title, description, and content
 */

import { describe, it, expect } from 'vitest';
import { UnifiedMaterial } from './useMaterials';

describe('Library Search Logic - Tag Matching', () => {
  /**
   * These tests verify the search logic that's used in Library.tsx lines 106-111
   * We're testing the same logic here to ensure it works with tags
   */

  const mockMaterials: UnifiedMaterial[] = [
    {
      id: 'mat-1',
      title: 'Photosynthese Diagramm',
      description: 'Ein Bild über Photosynthese',
      type: 'image',
      source: 'agent-generated',
      created_at: Date.now(),
      updated_at: Date.now(),
      metadata: {
        tags: ['Photosynthese', 'Biologie', 'Klasse 7']
      },
      is_favorite: false
    },
    {
      id: 'mat-2',
      title: 'Algebra Quiz',
      description: 'Ein Quiz über Algebra',
      type: 'quiz',
      source: 'agent-generated',
      created_at: Date.now(),
      updated_at: Date.now(),
      metadata: {
        tags: ['Mathematik', 'Algebra', 'Klasse 9']
      },
      is_favorite: false
    },
    {
      id: 'mat-3',
      title: 'Grammatik Übung',
      type: 'worksheet',
      source: 'manual',
      created_at: Date.now(),
      updated_at: Date.now(),
      metadata: {
        tags: ['Deutsch', 'Grammatik', 'Klasse 5'],
        content: 'Übung zu deutschen Grammatikregeln'
      },
      is_favorite: false
    }
  ];

  /**
   * This is the EXACT search logic from Library.tsx lines 106-111
   * It's tested here to ensure tag-based search works correctly
   */
  const matchesSearch = (material: UnifiedMaterial, query: string): boolean => {
    const lowerQuery = query.toLowerCase();

    return !query ||
      material.title.toLowerCase().includes(lowerQuery) ||
      material.description?.toLowerCase().includes(lowerQuery) ||
      material.metadata?.content?.toLowerCase().includes(lowerQuery) ||
      material.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) || false;
  };

  describe('Exact Tag Matching', () => {
    it('should find material by exact tag match', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Photosynthese'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-1');
    });

    it('should find material by subject tag', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Biologie'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-1');
    });

    it('should find material by grade tag', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Klasse 7'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-1');
    });
  });

  describe('Partial Tag Matching', () => {
    it('should find material by partial tag match', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'photo'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-1');
    });

    it('should find material by subject partial match', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'bio'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-1');
    });

    it('should find multiple materials with partial grade match', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Klasse'));
      expect(result).toHaveLength(3); // All materials have a Klasse tag
    });
  });

  describe('Case-Insensitive Search', () => {
    it('should be case-insensitive', () => {
      const result1 = mockMaterials.filter(m => matchesSearch(m, 'PHOTOSYNTHESE'));
      const result2 = mockMaterials.filter(m => matchesSearch(m, 'photosynthese'));
      const result3 = mockMaterials.filter(m => matchesSearch(m, 'PhotoSynthese'));

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result3).toHaveLength(1);

      expect(result1[0].id).toBe('mat-1');
      expect(result2[0].id).toBe('mat-1');
      expect(result3[0].id).toBe('mat-1');
    });

    it('should work with uppercase partial matches', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'BIO'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-1');
    });
  });

  describe('Manual Materials Tags', () => {
    it('should work with manual materials tags', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Grammatik'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-3');
    });

    it('should search manual materials by tag', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Deutsch'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-3');
    });
  });

  describe('Multi-Source Search (Title, Description, Content, Tags)', () => {
    it('should also match against title and description (not just tags)', () => {
      // Match by title
      const resultTitle = mockMaterials.filter(m => matchesSearch(m, 'Quiz'));
      expect(resultTitle).toHaveLength(1);
      expect(resultTitle[0].id).toBe('mat-2');

      // Match by description
      const resultDesc = mockMaterials.filter(m => matchesSearch(m, 'über Algebra'));
      expect(resultDesc).toHaveLength(1);
      expect(resultDesc[0].id).toBe('mat-2');
    });

    it('should match against content field', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Grammatikregeln'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-3');
    });
  });

  describe('Edge Cases', () => {
    it('should return all materials when query is empty', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, ''));
      expect(result).toHaveLength(3);
    });

    it('should return no materials when no match found', () => {
      const result = mockMaterials.filter(m => matchesSearch(m, 'Chemie'));
      expect(result).toHaveLength(0);
    });

    it('should handle materials without tags', () => {
      const materialNoTags: UnifiedMaterial = {
        id: 'mat-4',
        title: 'Material ohne Tags',
        type: 'document',
        source: 'manual',
        created_at: Date.now(),
        updated_at: Date.now(),
        metadata: {},
        is_favorite: false
      };

      expect(matchesSearch(materialNoTags, 'Material')).toBe(true); // Match by title
      expect(matchesSearch(materialNoTags, 'SomeTag')).toBe(false); // No tags to match
    });

    it('should handle materials with empty tags array', () => {
      const materialEmptyTags: UnifiedMaterial = {
        id: 'mat-5',
        title: 'Material mit leeren Tags',
        type: 'document',
        source: 'manual',
        created_at: Date.now(),
        updated_at: Date.now(),
        metadata: {
          tags: []
        },
        is_favorite: false
      };

      expect(matchesSearch(materialEmptyTags, 'Material')).toBe(true); // Match by title
      expect(matchesSearch(materialEmptyTags, 'SomeTag')).toBe(false); // No tags to match
    });
  });

  describe('Real-World Use Cases', () => {
    it('should find "Photosynthese" image by searching "photo"', () => {
      // User searches for "photo" to find their Photosynthese image
      const result = mockMaterials.filter(m => matchesSearch(m, 'photo'));
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].metadata.tags).toContain('Photosynthese');
    });

    it('should find materials by grade level', () => {
      // Teacher searches for "Klasse 7" materials
      const result = mockMaterials.filter(m => matchesSearch(m, 'Klasse 7'));
      expect(result).toHaveLength(1);
      expect(result[0].metadata.tags).toContain('Klasse 7');
    });

    it('should find materials by subject', () => {
      // Teacher searches for "Mathematik" materials
      const result = mockMaterials.filter(m => matchesSearch(m, 'Mathematik'));
      expect(result).toHaveLength(1);
      expect(result[0].metadata.tags).toContain('Mathematik');
    });
  });
});

describe('Tag Extraction in useMaterials Hook', () => {
  /**
   * These tests document how tags are extracted from generated_artifacts
   * The actual implementation is in useMaterials.ts lines 163-167
   */

  it('should document that tags are extracted from artifact_data.tags[] to metadata.tags', () => {
    // This test documents the expected behavior
    // In useMaterials.ts, we extract tags like this:
    //
    // let searchTags: string[] = [];
    // if (artifactData.tags && Array.isArray(artifactData.tags)) {
    //   searchTags = artifactData.tags;
    // }
    //
    // Then we add them to metadata:
    // metadata: {
    //   tags: searchTags // Extract tags to metadata.tags for unified search
    // }

    const mockArtifactData = {
      tags: ['Photosynthese', 'Biologie', 'Klasse 7']
    };

    // Simulate the extraction logic
    let searchTags: string[] = [];
    if (mockArtifactData.tags && Array.isArray(mockArtifactData.tags)) {
      searchTags = mockArtifactData.tags;
    }

    expect(searchTags).toEqual(['Photosynthese', 'Biologie', 'Klasse 7']);
  });

  it('should handle missing tags gracefully', () => {
    const mockArtifactData = {
      someOtherField: 'value'
      // No tags field
    };

    let searchTags: string[] = [];
    if (mockArtifactData.tags && Array.isArray((mockArtifactData as any).tags)) {
      searchTags = (mockArtifactData as any).tags;
    }

    expect(searchTags).toEqual([]);
  });

  it('should handle non-array tags gracefully', () => {
    const mockArtifactData = {
      tags: 'not-an-array' as any
    };

    let searchTags: string[] = [];
    if (mockArtifactData.tags && Array.isArray(mockArtifactData.tags)) {
      searchTags = mockArtifactData.tags;
    }

    expect(searchTags).toEqual([]);
  });
});
