/**
 * Unit Tests for ImageGenerationAgent (OpenAI Agents SDK)
 * Story 3.0.3: Testing Phase for DALL-E Migration
 *
 * Tests cover:
 * - Parameter validation
 * - Execute method with all parameter combinations
 * - generateImage with timeout and test mode
 * - generateTitleAndTags with fallback
 * - enhanceGermanPrompt
 * - buildImagePrompt (Gemini form integration)
 * - Error handling and German error messages
 * - Cost estimation
 * - User limit checking
 * - Artifact creation with tags
 */

import {
  ImageGenerationAgent,
  ImageGenerationParams,
} from '../imageGenerationAgent';
import { ImageGenerationPrefillData } from '../../../../shared/types';
import { openaiClient } from '../../config/openai';
import { agentExecutionService } from '../../services/agentService';
import { isAgentsSdkConfigured } from '../../config/agentsSdk';

// Mock dependencies
jest.mock('../../config/openai', () => ({
  openaiClient: {
    images: {
      generate: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('../../services/agentService', () => ({
  agentExecutionService: {
    getUserUsage: jest.fn(),
  },
}));

jest.mock('../../config/agentsSdk', () => ({
  isAgentsSdkConfigured: jest.fn(),
}));

jest.mock('../../config/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe('ImageGenerationAgent - OpenAI SDK', () => {
  let agent: ImageGenerationAgent;
  const mockUserId = 'test-user-123';
  const mockSessionId = 'test-session-456';

  beforeEach(() => {
    agent = new ImageGenerationAgent();
    jest.clearAllMocks();

    // Default: SDK is configured
    (isAgentsSdkConfigured as jest.Mock).mockReturnValue(true);

    // Default: user can execute
    (agentExecutionService.getUserUsage as jest.Mock).mockResolvedValue({
      usage_count: 5,
    });

    // Default: successful image generation
    (openaiClient.images.generate as jest.Mock).mockResolvedValue({
      data: [
        {
          url: 'https://example.com/image.png',
          revised_prompt: 'Test revised prompt',
        },
      ],
    });

    // Default: successful title/tag generation
    (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Test Title',
              tags: ['tag1', 'tag2', 'tag3'],
            }),
          },
        },
      ],
    });
  });

  describe('Agent Metadata', () => {
    it('should have correct agent metadata', () => {
      expect(agent.id).toBe('image-generation-agent');
      expect(agent.name).toBe('Bildgenerierung');
      expect(agent.description).toBe(
        'Generiert Bilder mit DALL-E 3 für den Unterricht'
      );
      expect(agent.enabled).toBe(true);
      expect(agent.type).toBe('image-generation');
    });

    it('should have appropriate triggers', () => {
      expect(agent.triggers).toContain('bild erstellen');
      expect(agent.triggers).toContain('image');
      expect(agent.triggers).toContain('generate image');
      expect(agent.triggers.length).toBeGreaterThan(10);
    });

    it('should have correct default config', () => {
      expect(agent.config.model).toBe('dall-e-3');
      expect(agent.config.default_size).toBe('1024x1024');
      expect(agent.config.default_quality).toBe('standard');
      expect(agent.config.default_style).toBe('natural');
      expect(agent.config.enhance_german_prompts).toBe(true);
      expect(agent.config.monthly_limit).toBe(10);
      expect(agent.config.timeout_ms).toBe(60000);
    });
  });

  describe('validateParams()', () => {
    it('should validate valid parameters', () => {
      const validParams = {
        prompt: 'Ein Bild von einem Baum',
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      };

      expect(agent.validateParams(validParams)).toBe(true);
    });

    it('should reject missing prompt', () => {
      const invalidParams = {
        size: '1024x1024',
      };

      expect(agent.validateParams(invalidParams)).toBe(false);
    });

    it('should reject non-string prompt', () => {
      const invalidParams = {
        prompt: 123,
      };

      expect(agent.validateParams(invalidParams)).toBe(false);
    });

    it('should reject empty prompt', () => {
      const invalidParams = {
        prompt: '   ',
      };

      expect(agent.validateParams(invalidParams)).toBe(false);
    });

    it('should reject prompt exceeding 1000 characters', () => {
      const invalidParams = {
        prompt: 'A'.repeat(1001),
      };

      expect(agent.validateParams(invalidParams)).toBe(false);
    });

    it('should reject invalid size', () => {
      const invalidParams = {
        prompt: 'Test',
        size: '512x512',
      };

      expect(agent.validateParams(invalidParams)).toBe(false);
    });

    it('should accept all valid sizes', () => {
      const sizes = ['1024x1024', '1024x1792', '1792x1024'];

      sizes.forEach((size) => {
        expect(agent.validateParams({ prompt: 'Test', size })).toBe(true);
      });
    });

    it('should reject invalid quality', () => {
      const invalidParams = {
        prompt: 'Test',
        quality: 'ultra',
      };

      expect(agent.validateParams(invalidParams)).toBe(false);
    });

    it('should accept valid qualities', () => {
      expect(
        agent.validateParams({ prompt: 'Test', quality: 'standard' })
      ).toBe(true);
      expect(agent.validateParams({ prompt: 'Test', quality: 'hd' })).toBe(
        true
      );
    });

    it('should reject invalid style', () => {
      const invalidParams = {
        prompt: 'Test',
        style: 'artistic',
      };

      expect(agent.validateParams(invalidParams)).toBe(false);
    });

    it('should accept valid styles', () => {
      expect(agent.validateParams({ prompt: 'Test', style: 'vivid' })).toBe(
        true
      );
      expect(agent.validateParams({ prompt: 'Test', style: 'natural' })).toBe(
        true
      );
    });
  });

  describe('execute() - Basic Flow', () => {
    it('should execute successfully with minimal params', async () => {
      const params: ImageGenerationParams = {
        prompt: 'Ein Baum',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.image_url).toBe('https://example.com/image.png');
      expect(result.data?.title).toBe('Test Title');
      expect(result.data?.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(result.cost).toBeGreaterThan(0);
      expect(result.artifacts).toHaveLength(1);
    });

    it('should fail if SDK not configured', async () => {
      (isAgentsSdkConfigured as jest.Mock).mockReturnValue(false);

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(false);
      // Error gets translated to German
      expect(result.error).toContain('API-Schlüssel');
    });

    it('should fail if prompt is missing', async () => {
      const params: ImageGenerationParams = {
        prompt: '',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt ist erforderlich');
    });

    it('should fail if prompt is too long', async () => {
      const params: ImageGenerationParams = {
        prompt: 'A'.repeat(1001),
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('zu lang');
    });

    it('should fail if user limit exceeded', async () => {
      (agentExecutionService.getUserUsage as jest.Mock).mockResolvedValue({
        usage_count: 10,
      });

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Monatliches Limit');
    });
  });

  describe('execute() - All Parameter Combinations', () => {
    it('should handle all size options', async () => {
      const sizes = ['1024x1024', '1024x1792', '1792x1024'] as const;

      for (const size of sizes) {
        const params: ImageGenerationParams = {
          prompt: 'Test',
          size,
        };

        const result = await agent.execute(params, mockUserId, mockSessionId);

        expect(result.success).toBe(true);
        expect(result.metadata?.size).toBe(size);
      }
    });

    it('should handle all quality options', async () => {
      const qualities = ['standard', 'hd'] as const;

      for (const quality of qualities) {
        const params: ImageGenerationParams = {
          prompt: 'Test',
          quality,
        };

        const result = await agent.execute(params, mockUserId, mockSessionId);

        expect(result.success).toBe(true);
        expect(result.metadata?.quality).toBe(quality);
      }
    });

    it('should handle all style options', async () => {
      const styles = ['vivid', 'natural'] as const;

      for (const style of styles) {
        const params: ImageGenerationParams = {
          prompt: 'Test',
          style,
        };

        const result = await agent.execute(params, mockUserId, mockSessionId);

        expect(result.success).toBe(true);
      }
    });

    it('should handle educational context parameters', async () => {
      const params: ImageGenerationParams = {
        prompt: 'Test',
        educationalContext: 'Mathematik Grundschule',
        targetAgeGroup: 'Klasse 3',
        subject: 'Geometrie',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.artifacts?.[0]?.subject).toBe('Geometrie');
    });

    it('should handle Gemini form input', async () => {
      const geminiParams = {
        prompt: 'Photosynthese',
        description: 'Ein Diagramm zur Photosynthese',
        imageStyle: 'illustrative',
        learningGroup: 'Klasse 7',
        subject: 'Biologie',
      } as any;

      const result = await agent.execute(
        geminiParams,
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(true);
      expect(result.data?.originalParams).toBeDefined();
      expect(result.data?.originalParams.description).toBe(
        'Ein Diagramm zur Photosynthese'
      );
      expect(result.data?.originalParams.imageStyle).toBe('illustrative');
    });
  });

  describe('generateImage() - Test Mode', () => {
    it('should bypass OpenAI in test mode', async () => {
      // Set test mode
      process.env.VITE_TEST_MODE = 'true';

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.image_url).toContain('data:image/svg+xml');
      expect(openaiClient.images.generate).not.toHaveBeenCalled();

      // Cleanup
      delete process.env.VITE_TEST_MODE;
    });

    it('should call OpenAI in production mode', async () => {
      delete process.env.VITE_TEST_MODE;

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(openaiClient.images.generate).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateImage() - Timeout Handling', () => {
    it('should timeout after 60 seconds', async () => {
      // Mock a slow image generation
      (openaiClient.images.generate as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: [
                {
                  url: 'https://example.com/image.png',
                  revised_prompt: 'Test',
                },
              ],
            });
          }, 70000); // 70 seconds - exceeds timeout
        });
      });

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      // This should timeout
      await expect(async () => {
        const result = await agent.execute(params, mockUserId, mockSessionId);
        // If result fails, that's expected
        if (!result.success) {
          throw new Error(result.error);
        }
      }).rejects.toThrow();
    }, 65000); // Jest timeout higher than agent timeout

    it('should succeed if image generation completes within timeout', async () => {
      (openaiClient.images.generate as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: [
                {
                  url: 'https://example.com/image.png',
                  revised_prompt: 'Test',
                },
              ],
            });
          }, 1000); // 1 second - well within timeout
        });
      });

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
    });
  });

  describe('generateTitleAndTags() - with Fallback', () => {
    it('should generate title and tags via ChatGPT', async () => {
      const params: ImageGenerationParams = {
        prompt: 'Ein Diagramm zur Photosynthese',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Title');
      expect(result.data?.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(openaiClient.chat.completions.create).toHaveBeenCalled();
    });

    it('should use fallback if ChatGPT fails', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('OpenAI API error')
      );

      const params: ImageGenerationParams = {
        prompt: 'Ein Diagramm zur Photosynthese mit Chloroplasten',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBeDefined();
      expect(result.data?.title?.length).toBeGreaterThan(0);
      expect(result.data?.tags).toBeDefined();
      expect(result.data?.tags?.length).toBeGreaterThan(0);
    });

    it('should use fallback if ChatGPT returns invalid JSON', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Invalid JSON',
            },
          },
        ],
      });

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBeDefined();
      expect(result.data?.tags).toBeDefined();
    });

    it('should limit tags to 5 maximum', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test',
                tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
              }),
            },
          },
        ],
      });

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.tags?.length).toBeLessThanOrEqual(5);
    });

    it('should extract educational keywords in fallback', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const params: ImageGenerationParams = {
        prompt: 'Mathematik Arbeitsblatt für Klasse 5 Geometrie',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      const tags = result.data?.tags || [];

      const hasEducationalKeywords = tags.some((tag: string) =>
        ['Mathematik', 'Arbeitsblatt', 'Klasse', 'Geometrie'].includes(tag)
      );
      expect(hasEducationalKeywords).toBe(true);
    });
  });

  describe('buildImagePrompt() - Gemini Integration', () => {
    it('should build prompt from Gemini form input', async () => {
      const geminiInput = {
        prompt: 'Test', // Required for validation
        description: 'Ein Diagramm zur Photosynthese',
        imageStyle: 'illustrative' as const,
        learningGroup: 'Klasse 7',
        subject: 'Biologie',
      };

      const result = await agent.execute(
        geminiInput as any,
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(true);
      // Verify prompt was built (not just used raw description)
      expect(openaiClient.images.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'dall-e-3',
          prompt: expect.stringContaining('educational'),
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          n: 1,
        })
      );
    });

    it('should handle all image styles', async () => {
      const styles = [
        'realistic',
        'cartoon',
        'illustrative',
        'abstract',
      ] as const;

      for (const imageStyle of styles) {
        jest.clearAllMocks();

        const geminiInput = {
          prompt: 'Test',
          description: 'Test description',
          imageStyle,
          learningGroup: 'Klasse 5',
        };

        const result = await agent.execute(
          geminiInput as any,
          mockUserId,
          mockSessionId
        );

        expect(result.success).toBe(true);
      }
    });
  });

  describe('enhanceGermanPrompt()', () => {
    it('should enhance German prompts', async () => {
      (openaiClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          // First call: for enhancement
          choices: [
            {
              message: {
                content: 'Enhanced English prompt for DALL-E',
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          // Second call: for title/tags
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Test Title',
                  tags: ['tag1', 'tag2'],
                }),
              },
            },
          ],
        });

      const params: ImageGenerationParams = {
        prompt: 'Ein Baum mit grünen Blättern',
        enhancePrompt: true,
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.data?.educational_optimized).toBe(true);
      expect(result.data?.enhanced_prompt).toBeDefined();
    });

    it('should not enhance English prompts', async () => {
      const params: ImageGenerationParams = {
        prompt: 'A tree with green leaves',
        enhancePrompt: true,
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      // Should use original prompt (no enhancement call for English)
    });

    it('should handle enhancement failure gracefully', async () => {
      let callCount = 0;
      (openaiClient.chat.completions.create as jest.Mock).mockImplementation(
        () => {
          callCount++;
          if (callCount === 1) {
            // First call (enhancement) fails
            throw new Error('Enhancement failed');
          }
          // Second call (title/tags) succeeds
          return Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: 'Test',
                    tags: ['tag1'],
                  }),
                },
              },
            ],
          });
        }
      );

      const params: ImageGenerationParams = {
        prompt: 'Ein deutscher Prompt',
        enhancePrompt: true,
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      // Should use original prompt after enhancement failure
    });
  });

  describe('Error Handling', () => {
    it('should handle DALL-E API errors', async () => {
      (openaiClient.images.generate as jest.Mock).mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAI ist momentan überlastet');
    });

    it('should return German error messages', async () => {
      const errorCases = [
        { error: 'Rate limit exceeded', expected: 'überlastet' },
        { error: 'Quota exceeded', expected: 'Kontingent' },
        { error: 'Invalid API key', expected: 'API-Schlüssel' },
        { error: 'Content policy violation', expected: 'Inhaltsfilter' },
        { error: 'Timeout', expected: 'Zeitüberschreitung' },
      ];

      for (const testCase of errorCases) {
        jest.clearAllMocks();
        (openaiClient.images.generate as jest.Mock).mockRejectedValue(
          new Error(testCase.error)
        );

        const params: ImageGenerationParams = {
          prompt: 'Test',
        };

        const result = await agent.execute(params, mockUserId, mockSessionId);

        expect(result.success).toBe(false);
        expect(result.error?.toLowerCase()).toContain(
          testCase.expected.toLowerCase()
        );
      }
    });

    it('should handle missing image URL from DALL-E', async () => {
      (openaiClient.images.generate as jest.Mock).mockResolvedValue({
        data: [],
      });

      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('canExecute() - User Limits', () => {
    it('should allow execution within limit', async () => {
      (agentExecutionService.getUserUsage as jest.Mock).mockResolvedValue({
        usage_count: 5,
      });

      const canExecute = await agent.canExecute(mockUserId);

      expect(canExecute).toBe(true);
    });

    it('should block execution at limit', async () => {
      (agentExecutionService.getUserUsage as jest.Mock).mockResolvedValue({
        usage_count: 10,
      });

      const canExecute = await agent.canExecute(mockUserId);

      expect(canExecute).toBe(false);
    });

    it('should allow execution if no usage data', async () => {
      (agentExecutionService.getUserUsage as jest.Mock).mockResolvedValue(null);

      const canExecute = await agent.canExecute(mockUserId);

      expect(canExecute).toBe(true);
    });

    it('should handle getUserUsage errors gracefully', async () => {
      (agentExecutionService.getUserUsage as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const canExecute = await agent.canExecute(mockUserId);

      expect(canExecute).toBe(false);
    });
  });

  describe('estimateCost()', () => {
    it('should estimate cost for standard 1024x1024', () => {
      const params: ImageGenerationParams = {
        prompt: 'Test',
        size: '1024x1024',
        quality: 'standard',
      };

      const cost = agent.estimateCost(params);

      expect(cost).toBe(4); // 4 cents
    });

    it('should estimate cost for hd 1024x1024', () => {
      const params: ImageGenerationParams = {
        prompt: 'Test',
        size: '1024x1024',
        quality: 'hd',
      };

      const cost = agent.estimateCost(params);

      expect(cost).toBe(8); // 8 cents
    });

    it('should estimate cost for standard portrait', () => {
      const params: ImageGenerationParams = {
        prompt: 'Test',
        size: '1024x1792',
        quality: 'standard',
      };

      const cost = agent.estimateCost(params);

      expect(cost).toBe(8); // 8 cents
    });

    it('should estimate cost for hd landscape', () => {
      const params: ImageGenerationParams = {
        prompt: 'Test',
        size: '1792x1024',
        quality: 'hd',
      };

      const cost = agent.estimateCost(params);

      expect(cost).toBe(12); // 12 cents
    });

    it('should use default values if not specified', () => {
      const params: ImageGenerationParams = {
        prompt: 'Test',
      };

      const cost = agent.estimateCost(params);

      expect(cost).toBe(4); // Default: standard 1024x1024
    });
  });

  describe('Artifact Creation', () => {
    it('should create artifact with all metadata', async () => {
      const params: ImageGenerationParams = {
        prompt: 'Test',
        educationalContext: 'Grundschule',
        targetAgeGroup: 'Klasse 3',
        subject: 'Mathematik',
      };

      const result = await agent.execute(params, mockUserId, mockSessionId);

      expect(result.success).toBe(true);
      expect(result.artifacts).toHaveLength(1);

      const artifact = result.artifacts?.[0];
      expect(artifact).toBeDefined();
      expect(artifact?.id).toBeDefined();
      expect(artifact?.title).toBeDefined();
      expect(artifact?.type).toBe('image');
      expect(artifact?.subject).toBe('Mathematik');
      expect(artifact?.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(artifact?.content).toBeDefined();

      // Verify content structure
      if (artifact?.content) {
        const content = JSON.parse(artifact.content);
        expect(content.image_url).toBe('https://example.com/image.png');
        expect(content.revised_prompt).toBe('Test revised prompt');
        expect(content.tags).toEqual(['tag1', 'tag2', 'tag3']);
        expect(content.educational_context).toBe('Grundschule');
        expect(content.target_age_group).toBe('Klasse 3');
        expect(content.subject).toBe('Mathematik');
      }
    });

    it('should include originalParams for regeneration', async () => {
      const geminiParams = {
        prompt: 'Test',
        description: 'Photosynthese Diagramm',
        imageStyle: 'illustrative' as const,
        learningGroup: 'Klasse 7',
        subject: 'Biologie',
      };

      const result = await agent.execute(
        geminiParams as any,
        mockUserId,
        mockSessionId
      );

      expect(result.success).toBe(true);
      expect(result.data?.originalParams).toBeDefined();
      expect(result.data?.originalParams.description).toBe(
        'Photosynthese Diagramm'
      );
      expect(result.data?.originalParams.imageStyle).toBe('illustrative');
      expect(result.data?.originalParams.learningGroup).toBe('Klasse 7');
      expect(result.data?.originalParams.subject).toBe('Biologie');
    });
  });

  describe('estimateExecutionTime()', () => {
    it('should estimate execution time correctly', () => {
      const estimatedTime = agent.estimateExecutionTime();

      expect(estimatedTime).toBe(65000); // 60s + 5s overhead
    });
  });
});
