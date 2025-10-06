/**
 * Unit Tests for LangGraph Image Generation Agent
 * Focus: Gemini Prompt Builder (Phase 3.2) + Auto-Tagging (TASK-018)
 */

import { LangGraphImageGenerationAgent } from './langGraphImageGenerationAgent';
import { ImageGenerationPrefillData } from '../../../shared/types';
import { openaiClient } from '../config/openai';
import { agentExecutionService } from '../services/agentService';

// Mock dependencies for auto-tagging tests
jest.mock('../config/openai', () => ({
  openaiClient: {
    images: {
      generate: jest.fn()
    },
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
}));

jest.mock('../services/agentService', () => ({
  agentExecutionService: {
    getUserUsage: jest.fn()
  }
}));

jest.mock('../config/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn()
}));

describe('LangGraphImageGenerationAgent - buildPrompt', () => {
  let agent: LangGraphImageGenerationAgent;

  beforeEach(() => {
    agent = new LangGraphImageGenerationAgent();
  });

  describe('buildPrompt()', () => {
    it('should create basic prompt without DaZ or learning difficulties', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Satz des Pythagoras',
        imageStyle: 'illustrative'
      };

      // Access private method via type casting
      const prompt = (agent as any).buildPrompt(input);

      expect(prompt).toContain('Satz des Pythagoras');
      expect(prompt).toContain('Klasse 8a');
      expect(prompt).toContain('pädagogisch wertvolles Bild');
      expect(prompt).toContain('Zielgruppe:');

      // Should NOT contain DaZ or learning difficulties
      expect(prompt).not.toContain('DaZ-Lernende');
      expect(prompt).not.toContain('Lernschwierigkeiten');
    });

    it('should include DaZ considerations when enabled', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Bruchrechnen',
        imageStyle: 'illustrative'
      };

      const prompt = (agent as any).buildPrompt(input);

      expect(prompt).toContain('DaZ-Lernende');
      expect(prompt).toContain('Deutsch als Zweitsprache');
      expect(prompt).toContain('Einfache, klare visuelle Elemente');
      expect(prompt).toContain('Universell verständliche Symbole');
      expect(prompt).toContain('Fokus auf visuelle Vermittlung');
      expect(prompt).toContain('Kulturell neutrale Darstellung');

      // Should NOT contain learning difficulties
      expect(prompt).not.toContain('Lernschwierigkeiten');
    });

    it('should include learning difficulties considerations when enabled', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Photosynthese',
        imageStyle: 'illustrative'
      };

      const prompt = (agent as any).buildPrompt(input);

      expect(prompt).toContain('Lernschwierigkeiten');
      expect(prompt).toContain('Klare, strukturierte Darstellung');
      expect(prompt).toContain('Reduzierte Komplexität');
      expect(prompt).toContain('Fokus auf Kernkonzept');
      expect(prompt).toContain('Wenig ablenkende Details');
      expect(prompt).toContain('Hoher Kontrast');

      // Should NOT contain DaZ
      expect(prompt).not.toContain('DaZ-Lernende');
    });

    it('should include both DaZ and learning difficulties when both enabled', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Wasserkreislauf',
        imageStyle: 'illustrative',
        learningGroup: 'Klasse 5c'
      };

      const prompt = (agent as any).buildPrompt(input);

      // Should contain both
      expect(prompt).toContain('DaZ-Lernende');
      expect(prompt).toContain('Deutsch als Zweitsprache');
      expect(prompt).toContain('Lernschwierigkeiten');
      expect(prompt).toContain('Klare, strukturierte Darstellung');
      expect(prompt).toContain('Reduzierte Komplexität');
    });

    it('should always include style guidelines', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Test',
        imageStyle: 'realistic',
        learningGroup: 'Klasse 10a'
      };

      const prompt = (agent as any).buildPrompt(input);

      expect(prompt).toContain('Stil: Pädagogisch wertvoll');
      expect(prompt).toContain('altersgerecht');
      expect(prompt).toContain('Unterricht direkt einsetzbar');
      expect(prompt).toContain('Format: Klar, professionell, lernförderlich');
    });

    it('should handle special characters in description correctly', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Das "Goldene Zeitalter" & die Renaissance',
        imageStyle: 'illustrative',
        learningGroup: 'Klasse 9a'
      };

      const prompt = (agent as any).buildPrompt(input);

      expect(prompt).toContain('Das "Goldene Zeitalter" & die Renaissance');
    });

    it('should handle different learning groups correctly', () => {
      const inputs = [
        { learningGroup: 'Klasse 5a' },
        { learningGroup: 'Klasse 13 LK' },
        { learningGroup: 'Grundschule' },
        { learningGroup: 'Oberstufe' }
      ];

      inputs.forEach((partial) => {
        const input: ImageGenerationPrefillData = {
          description: 'Test',
          imageStyle: 'realistic',
          learningGroup: partial.learningGroup
        };

        const prompt = (agent as any).buildPrompt(input);

        expect(prompt).toContain(partial.learningGroup);
        expect(prompt).toContain(`Zielgruppe: ${partial.learningGroup}`);
        expect(prompt).toContain(`altersgerecht für ${partial.learningGroup}`);
      });
    });
  });

  describe('execute() - Gemini Integration', () => {
    it('should detect Gemini input and use buildPrompt', async () => {
      const geminiParams = {
        theme: 'Satz des Pythagoras',
        learningGroup: 'Klasse 8a',
        dazSupport: true,
        learningDifficulties: false,
        prompt: 'Satz des Pythagoras' // Required for validation
      };

      // Spy on buildPrompt
      const buildPromptSpy = jest.spyOn(agent as any, 'buildPrompt');

      // Mock canExecute to return true
      jest.spyOn(agent, 'canExecute').mockResolvedValue(true);

      // Mock generateImage to return success
      jest.spyOn(agent as any, 'generateImage').mockResolvedValue({
        success: true,
        data: {
          url: 'https://example.com/image.png',
          revised_prompt: 'Test prompt'
        }
      });

      await agent.execute(geminiParams as any, 'test-user-123', 'test-session-456');

      expect(buildPromptSpy).toHaveBeenCalledWith(geminiParams);
    });

    it('should use old enhancement method when Gemini params not present', async () => {
      const oldParams = {
        prompt: 'Erstelle ein Bild',
        enhancePrompt: true
      };

      // Spy on enhanceGermanPrompt
      const enhanceSpy = jest.spyOn(agent as any, 'enhanceGermanPrompt');

      // Mock canExecute to return true
      jest.spyOn(agent, 'canExecute').mockResolvedValue(true);

      // Mock generateImage to return success
      jest.spyOn(agent as any, 'generateImage').mockResolvedValue({
        success: true,
        data: {
          url: 'https://example.com/image.png',
          revised_prompt: 'Test prompt'
        }
      });

      await agent.execute(oldParams as any, 'test-user-123', 'test-session-456');

      expect(enhanceSpy).toHaveBeenCalled();
    });
  });

  describe('Prompt Output Validation', () => {
    it('should produce prompt with correct structure', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Die Französische Revolution',
        imageStyle: 'illustrative',
        learningGroup: 'Klasse 9a'
      };

      const prompt = (agent as any).buildPrompt(input);

      // Verify structure
      const lines = prompt.split('\n').filter((line: string) => line.trim().length > 0);

      expect(lines.length).toBeGreaterThan(5); // Should have multiple lines
      expect(prompt.startsWith('Erstelle ein pädagogisch wertvolles Bild')).toBe(true);
      expect(prompt).toContain('Zielgruppe:');
    });

    it('should produce prompt that is not too long for DALL-E', () => {
      const input: ImageGenerationPrefillData = {
        description: 'Ein sehr langes Thema mit vielen Details über Quantenphysik und ihre Auswirkungen auf die moderne Wissenschaft',
        imageStyle: 'realistic',
        learningGroup: 'Klasse 12 Leistungskurs Physik'
      };

      const prompt = (agent as any).buildPrompt(input);

      // DALL-E has a 4000 character limit, but we should stay well below that
      expect(prompt.length).toBeLessThan(2000);
    });
  });
});

/**
 * Auto-Tagging Tests (TASK-018)
 * Tests for automatic title and tag generation for library search
 */
describe('LangGraphImageGenerationAgent - Auto-Tagging (TASK-018)', () => {
  let agent: LangGraphImageGenerationAgent;
  const mockUserId = 'test-user-123';
  const mockSessionId = 'test-session-456';

  beforeEach(() => {
    agent = new LangGraphImageGenerationAgent();
    jest.clearAllMocks();

    // Default mock: user can execute
    (agentExecutionService.getUserUsage as jest.Mock).mockResolvedValue({
      usage_count: 5
    });
  });

  describe('generateTitleAndTags', () => {
    it('should generate title and tags using ChatGPT', async () => {
      const description = 'Ein Diagramm zur Photosynthese mit beschrifteten Chloroplasten für Klasse 7';

      // Mock ChatGPT response
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Photosynthese Diagramm',
              tags: ['Photosynthese', 'Biologie', 'Klasse 7', 'Chloroplasten']
            })
          }
        }]
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational diagram of photosynthesis'
        }]
      });

      const result = await agent.execute({
        prompt: description
      }, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Photosynthese Diagramm');
      expect(result.data?.tags).toEqual(['Photosynthese', 'Biologie', 'Klasse 7', 'Chloroplasten']);
    });

    it('should work with Gemini form input', async () => {
      const geminiInput: ImageGenerationPrefillData = {
        description: 'Eine Zeitleiste des Mittelalters mit wichtigen Ereignissen',
        imageStyle: 'illustrative'
      };

      // Mock ChatGPT response
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Mittelalter Zeitleiste',
              tags: ['Mittelalter', 'Geschichte', 'Zeitleiste', 'Ereignisse']
            })
          }
        }]
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational timeline of medieval history'
        }]
      });

      const result = await agent.execute(
        geminiInput as any,
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Mittelalter Zeitleiste');
      expect(result.data?.tags).toContain('Mittelalter');
      expect(result.data?.tags).toContain('Geschichte');
    });

    it('should limit tags to 5 maximum', async () => {
      const description = 'Bruchrechnung Übung für Grundschule Mathematik';

      // Mock ChatGPT response with 7 tags
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Bruchrechnung Übung',
              tags: ['Bruchrechnung', 'Mathematik', 'Grundschule', 'Addition', 'Subtraktion', 'Multiplikation', 'Division']
            })
          }
        }]
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational fraction exercise'
        }]
      });

      const result = await agent.execute({
        prompt: description
      }, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.tags?.length).toBeLessThanOrEqual(5);
    });

    it('should use fallback if ChatGPT fails', async () => {
      const description = 'Ein Diagramm zur Photosynthese mit Chloroplasten';

      // Mock ChatGPT failure (only for title/tag generation, not for image)
      let callCount = 0;
      (openaiClient.chat.completions.create as jest.Mock).mockImplementation(() => {
        callCount++;
        throw new Error('OpenAI API error');
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational diagram'
        }]
      });

      const result = await agent.execute({
        prompt: description,
        enhancePrompt: false // Disable prompt enhancement to avoid additional ChatGPT calls
      }, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      // Fallback title should be first 50 chars of description
      expect(result.data?.title).toBeDefined();
      expect(result.data?.title?.length).toBeGreaterThan(0);
      // Fallback tags should extract capitalized words
      expect(result.data?.tags?.length).toBeGreaterThan(0);
    });

    it('should extract educational keywords in fallback', async () => {
      const description = 'Mathematik Arbeitsblatt für Klasse 5 zum Thema Geometrie';

      // Mock ChatGPT failure
      (openaiClient.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('OpenAI API error')
      );

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational worksheet'
        }]
      });

      const result = await agent.execute({
        prompt: description,
        enhancePrompt: false
      }, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      // Fallback should extract educational keywords
      expect(result.data?.tags).toBeDefined();
      const tags = result.data?.tags || [];

      // Check if at least some educational keywords are present
      const hasEducationalKeywords = tags.some((tag: string) =>
        ['Mathematik', 'Arbeitsblatt', 'Klasse', 'Geometrie'].includes(tag)
      );
      expect(hasEducationalKeywords).toBe(true);
    });
  });

  describe('Artifact creation with tags', () => {
    it('should include tags in artifact_data', async () => {
      const description = 'Ein Quiz zur Bruchrechnung für Klasse 6';

      // Mock ChatGPT response
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Bruchrechnung Quiz',
              tags: ['Bruchrechnung', 'Mathematik', 'Klasse 6', 'Quiz']
            })
          }
        }]
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational quiz about fractions'
        }]
      });

      const result = await agent.execute({
        prompt: description
      }, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.artifacts?.length).toBe(1);

      const artifact = result.artifacts![0];
      expect(artifact).toBeDefined();
      expect(artifact.title).toBe('Bruchrechnung Quiz');
      expect(artifact.artifact_data.tags).toEqual(['Bruchrechnung', 'Mathematik', 'Klasse 6', 'Quiz']);
      expect(artifact.metadata.search_tags).toEqual(['Bruchrechnung', 'Mathematik', 'Klasse 6', 'Quiz']);
    });

    it('should include tags in metadata for searchability', async () => {
      const description = 'Physik Experiment zur Elektrizität';

      // Mock ChatGPT response
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Elektrizität Experiment',
              tags: ['Physik', 'Elektrizität', 'Experiment']
            })
          }
        }]
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational physics experiment'
        }]
      });

      const result = await agent.execute({
        prompt: description
      }, mockUserId, mockSessionId);

      expect(result.success).toBe(true);

      const artifact = result.artifacts![0];
      expect(artifact).toBeDefined();
      expect(artifact.metadata.search_tags).toContain('Physik');
      expect(artifact.metadata.search_tags).toContain('Elektrizität');
      expect(artifact.metadata.search_tags).toContain('Experiment');
    });
  });

  describe('Title generation', () => {
    it('should generate concise German titles', async () => {
      const description = 'Ein Diagramm zur Photosynthese mit beschrifteten Chloroplasten für Biologie Klasse 7';

      // Mock ChatGPT response with concise title
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Photosynthese Diagramm',
              tags: ['Photosynthese', 'Biologie', 'Klasse 7']
            })
          }
        }]
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational diagram'
        }]
      });

      const result = await agent.execute({
        prompt: description
      }, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Photosynthese Diagramm');

      // Should be concise (max ~5 words)
      const wordCount = result.data?.title?.split(' ').length || 0;
      expect(wordCount).toBeLessThanOrEqual(5);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON response from ChatGPT', async () => {
      const description = 'Test image description';

      // Mock ChatGPT with invalid JSON
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational image'
        }]
      });

      const result = await agent.execute({
        prompt: description,
        enhancePrompt: false
      }, mockUserId, mockSessionId);

      // Should succeed with fallback
      expect(result.success).toBe(true);
      expect(result.data?.title).toBeDefined();
      expect(result.data?.tags).toBeDefined();
    });

    it('should handle empty ChatGPT response', async () => {
      const description = 'Test image description';

      // Mock ChatGPT with empty response
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: []
      });

      // Mock image generation
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [{
          url: 'https://example.com/image.png',
          revised_prompt: 'Educational image'
        }]
      });

      const result = await agent.execute({
        prompt: description,
        enhancePrompt: false
      }, mockUserId, mockSessionId);

      // Should succeed with fallback
      expect(result.success).toBe(true);
      expect(result.data?.title).toBeDefined();
      expect(result.data?.tags).toBeDefined();
    });
  });
});
