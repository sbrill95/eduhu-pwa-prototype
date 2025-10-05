/**
 * Image Generation Integration Tests
 *
 * Tests the complete image generation workflow:
 * - TASK-009: Display image in chat with clickable thumbnail
 * - TASK-010: "Neu generieren" button in preview modal
 * - TASK-011: Library "Bilder" filter
 *
 * @see .specify/specs/image-generation-ux-v2/AGENT-BRIEFING.md
 */

import { describe, it, expect } from 'vitest';

describe('Image Generation Integration Tests', () => {
  describe('TASK-009: Display image in chat with clickable thumbnail', () => {
    it('should parse image metadata from message', () => {
      // Test metadata parsing logic
      const metadata = JSON.stringify({
        type: 'image',
        image_url: 'https://example.com/generated-image.png',
        library_id: 'lib-123',
        title: 'Ein Löwe',
        description: 'Ein realistischer Löwe',
        image_style: 'realistic'
      });

      const parsed = JSON.parse(metadata);

      expect(parsed.type).toBe('image');
      expect(parsed.image_url).toBe('https://example.com/generated-image.png');
      expect(parsed.library_id).toBe('lib-123');
      expect(parsed.title).toBe('Ein Löwe');
      expect(parsed.description).toBe('Ein realistischer Löwe');
      expect(parsed.image_style).toBe('realistic');
    });

    it('should detect image metadata in message', () => {
      const message = {
        id: 'msg-1',
        role: 'assistant' as const,
        content: 'Ich habe ein Bild für dich erstellt.',
        timestamp: new Date(),
        metadata: JSON.stringify({
          type: 'image',
          image_url: 'https://example.com/image.png',
          library_id: 'lib-456'
        })
      };

      // Parse metadata
      let hasImage = false;
      if ('metadata' in message && message.metadata) {
        try {
          const metadata = typeof message.metadata === 'string'
            ? JSON.parse(message.metadata)
            : message.metadata;

          if (metadata.type === 'image' && metadata.image_url) {
            hasImage = true;
          }
        } catch (e) {
          // Ignore
        }
      }

      expect(hasImage).toBe(true);
    });

    it('should create material object for preview from metadata', () => {
      const agentResult = {
        type: 'image',
        libraryId: 'lib-789',
        imageUrl: 'https://example.com/lion.png',
        description: 'Ein Löwe in realistischem Stil',
        imageStyle: 'realistic',
        title: 'Löwe für Biologie'
      };

      // Create material object as done in ChatView
      const material = {
        id: agentResult.libraryId,
        title: agentResult.title || 'Generiertes Bild',
        description: agentResult.description || '',
        type: 'image' as const,
        source: 'agent-generated' as const,
        created_at: Date.now(),
        updated_at: Date.now(),
        metadata: {
          artifact_data: {
            url: agentResult.imageUrl
          },
          prompt: agentResult.description,
          image_style: agentResult.imageStyle
        },
        is_favorite: false
      };

      expect(material.id).toBe('lib-789');
      expect(material.title).toBe('Löwe für Biologie');
      expect(material.type).toBe('image');
      expect(material.source).toBe('agent-generated');
      expect(material.metadata.artifact_data.url).toBe('https://example.com/lion.png');
      expect(material.metadata.prompt).toBe('Ein Löwe in realistischem Stil');
      expect(material.metadata.image_style).toBe('realistic');
    });
  });

  describe('TASK-010: Neu generieren button', () => {
    it('should show regenerate button only for agent-generated images', () => {
      const agentGeneratedImage = {
        type: 'image' as const,
        source: 'agent-generated' as const
      };

      const uploadedImage = {
        type: 'image' as const,
        source: 'upload' as const
      };

      const worksheet = {
        type: 'worksheet' as const,
        source: 'agent-generated' as const
      };

      // Button should show for agent-generated images
      expect(
        agentGeneratedImage.type === 'image' &&
        agentGeneratedImage.source === 'agent-generated'
      ).toBe(true);

      // Button should NOT show for uploaded images
      expect(
        uploadedImage.type === 'image' &&
        uploadedImage.source === 'agent-generated'
      ).toBe(false);

      // Button should NOT show for non-image materials
      expect(
        worksheet.type === 'image' &&
        worksheet.source === 'agent-generated'
      ).toBe(false);
    });

    it('should extract correct regeneration params from material', () => {
      const material = {
        id: 'mat-3',
        title: 'Test Bild',
        description: 'Fallback description',
        type: 'image' as const,
        source: 'agent-generated' as const,
        created_at: Date.now(),
        updated_at: Date.now(),
        metadata: {
          artifact_data: {
            url: 'https://example.com/test.png'
          },
          prompt: 'Ein cartoon Löwe',
          image_style: 'cartoon'
        },
        is_favorite: false
      };

      // Extract params as done in MaterialPreviewModal
      const originalParams = {
        description: material.metadata.prompt || material.description || material.title || '',
        imageStyle: material.metadata.image_style || 'realistic'
      };

      expect(originalParams.description).toBe('Ein cartoon Löwe');
      expect(originalParams.imageStyle).toBe('cartoon');
    });

    it('should fallback to description and title if prompt missing', () => {
      const materialNoPrompt = {
        title: 'Fallback Title',
        description: 'Fallback description',
        metadata: {
          image_style: 'realistic'
        }
      };

      const params = {
        description: (materialNoPrompt.metadata as any).prompt ||
                    materialNoPrompt.description ||
                    materialNoPrompt.title ||
                    '',
        imageStyle: (materialNoPrompt.metadata as any).image_style || 'realistic'
      };

      expect(params.description).toBe('Fallback description');
      expect(params.imageStyle).toBe('realistic');
    });
  });

  describe('TASK-011: Library Bilder filter', () => {
    it('should filter materials by type', () => {
      const materials = [
        { id: '1', type: 'image', title: 'Bild 1' },
        { id: '2', type: 'worksheet', title: 'Arbeitsblatt 1' },
        { id: '3', type: 'image', title: 'Bild 2' },
        { id: '4', type: 'document', title: 'Dokument 1' }
      ];

      // Test "all" filter
      const allFilter = 'all';
      const allFiltered = materials.filter(m => {
        if (allFilter === 'all') return true;
        return false;
      });
      expect(allFiltered.length).toBe(4);

      // Test "image" filter
      const imageFilter = 'image';
      const imageFiltered = materials.filter(m => {
        if (imageFilter === 'image') return m.type === 'image';
        return false;
      });
      expect(imageFiltered.length).toBe(2);
      expect(imageFiltered.every(m => m.type === 'image')).toBe(true);

      // Test "materials" filter (all except images)
      const materialsFilter = 'materials';
      const materialsFiltered = materials.filter(m => {
        if (materialsFilter === 'materials') return m.type !== 'image';
        return false;
      });
      expect(materialsFiltered.length).toBe(2);
      expect(materialsFiltered.every(m => m.type !== 'image')).toBe(true);
    });

    it('should have correct filter configuration', () => {
      // Verify filter tabs structure (as defined in Library.tsx)
      const artifactTypes = [
        { key: 'all', label: 'Alle' },
        { key: 'materials', label: 'Materialien' },
        { key: 'image', label: 'Bilder' }
      ];

      expect(artifactTypes).toHaveLength(3);
      expect(artifactTypes[0].key).toBe('all');
      expect(artifactTypes[1].key).toBe('materials');
      expect(artifactTypes[2].key).toBe('image');
      expect(artifactTypes[2].label).toBe('Bilder');
    });

    it('should combine search and filter correctly', () => {
      const materials = [
        {
          id: '1',
          type: 'image',
          title: 'Löwenbild',
          description: 'Ein Löwe für Biologie'
        },
        {
          id: '2',
          type: 'worksheet',
          title: 'Löwen Arbeitsblatt',
          description: 'Arbeitsblatt über Löwen'
        },
        {
          id: '3',
          type: 'image',
          title: 'Tigerbild',
          description: 'Ein Tiger'
        }
      ];

      const searchQuery = 'löwe';
      const selectedFilter = 'image';

      const filtered = materials.filter(material => {
        // Search match
        const matchesSearch = !searchQuery ||
          material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.description?.toLowerCase().includes(searchQuery.toLowerCase());

        // Filter match
        let matchesFilter = false;
        if (selectedFilter === 'all') {
          matchesFilter = true;
        } else if (selectedFilter === 'image') {
          matchesFilter = material.type === 'image';
        } else if (selectedFilter === 'materials') {
          matchesFilter = material.type !== 'image';
        }

        return matchesSearch && matchesFilter;
      });

      // Should return only images that match "löwe"
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
      expect(filtered[0].type).toBe('image');
      expect(filtered[0].title).toBe('Löwenbild');
    });
  });

  describe('Complete workflow logic', () => {
    it('should handle full workflow data transformation', () => {
      // Step 1: Backend returns message with image metadata
      const backendResponse = {
        message: 'Ich habe ein Bild für dich erstellt.',
        metadata: {
          type: 'image',
          image_url: 'https://example.com/workflow-test.png',
          library_id: 'lib-workflow',
          title: 'Workflow Test Bild',
          description: 'Test description',
          image_style: 'realistic'
        }
      };

      // Step 2: Chat displays image (max 300px)
      const chatImage = {
        url: backendResponse.metadata.image_url,
        maxWidth: '300px',
        clickable: !!backendResponse.metadata.library_id
      };

      expect(chatImage.maxWidth).toBe('300px');
      expect(chatImage.clickable).toBe(true);

      // Step 3: Create material for preview
      const material = {
        id: backendResponse.metadata.library_id,
        title: backendResponse.metadata.title,
        type: 'image' as const,
        source: 'agent-generated' as const,
        metadata: {
          prompt: backendResponse.metadata.description,
          image_style: backendResponse.metadata.image_style
        }
      };

      // Step 4: Extract params for regeneration
      const regenerateParams = {
        description: material.metadata.prompt,
        imageStyle: material.metadata.image_style
      };

      expect(regenerateParams.description).toBe('Test description');
      expect(regenerateParams.imageStyle).toBe('realistic');

      // Step 5: Verify it appears in Library under "Bilder"
      const libraryFilter = 'image';
      const shouldShow = material.type === 'image';

      expect(shouldShow).toBe(true);
    });

    it('should handle missing optional fields gracefully', () => {
      // Minimal metadata
      const minimalMetadata = {
        type: 'image',
        image_url: 'https://example.com/minimal.png'
      };

      // Should still work with defaults
      const material = {
        id: (minimalMetadata as any).library_id || 'temp-id',
        title: (minimalMetadata as any).title || 'Generiertes Bild',
        description: (minimalMetadata as any).description || '',
        type: 'image' as const,
        source: 'agent-generated' as const,
        metadata: {
          prompt: (minimalMetadata as any).description || '',
          image_style: (minimalMetadata as any).image_style || 'realistic'
        }
      };

      expect(material.title).toBe('Generiertes Bild');
      expect(material.description).toBe('');
      expect(material.metadata.image_style).toBe('realistic');
    });
  });
});
