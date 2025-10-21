// TODO: Complete LangGraph agent service - see SKIP_TESTS.md
/**
 * LangGraph Agent Service Tests
 * Comprehensive test suite for the LangGraph agent execution system
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from '@jest/globals';
import { langGraphAgentService } from '../services/langGraphAgentService';
import { langGraphImageGenerationAgent } from '../agents/langGraphImageGenerationAgent';
import { agentRegistry } from '../services/agentService';
import { initializeRedis, closeRedis } from '../config/redis';
import { progressStreamingService } from '../services/progressStreamingService';
import { ProgressLevel } from '../services/progressStreamingService';

// Mock OpenAI to avoid API calls during testing
jest.mock('../config/openai', () => ({
  openaiClient: {
    images: {
      generate: jest.fn<() => Promise<any>>().mockResolvedValue({
        data: [
          {
            url: 'https://example.com/test-image.png',
            revised_prompt: 'A test image for educational purposes',
          },
        ],
      }),
    },
    chat: {
      completions: {
        create: jest.fn<() => Promise<any>>().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Enhanced educational prompt for DALL-E 3',
              },
            },
          ],
        }),
      },
    },
  },
}));

// Mock InstantDB to avoid database operations during testing
jest.mock('../services/instantdbService', () => ({
  InstantDBService: {
    getDB: jest.fn<() => any>().mockReturnValue({
      query: jest.fn<() => Promise<any>>().mockResolvedValue({}),
      transact: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    }),
  },
}));

describe.skip('LangGraph Agent Service', () => {
  const testUserId = 'test-user-123';
  const testSessionId = 'test-session-456';

  beforeAll(async () => {
    // Initialize test environment
    try {
      await initializeRedis();
      await langGraphAgentService.initialize();

      // Register test agent
      agentRegistry.register(langGraphImageGenerationAgent);
    } catch (error) {
      console.warn('Redis not available in test environment, using mocks');
    }
  });

  afterAll(async () => {
    try {
      progressStreamingService.shutdown();
      await closeRedis();
    } catch (error) {
      // Ignore cleanup errors in test environment
    }
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize LangGraph service successfully', async () => {
      expect(langGraphAgentService).toBeDefined();
      // The service should be initialized in beforeAll
    });

    it('should register LangGraph agents', () => {
      const agents = agentRegistry.getEnabledAgents();
      const langGraphAgents = agents.filter(
        (agent) => 'createWorkflow' in agent
      );

      expect(langGraphAgents.length).toBeGreaterThan(0);
      expect(langGraphAgents[0]?.id).toBe('langgraph-image-generation');
    });
  });

  describe('Agent Workflow Execution', () => {
    it('should execute image generation agent with workflow', async () => {
      const params = {
        prompt: 'Ein Bild von einem roten Apfel für den Mathematikunterricht',
        size: '1024x1024' as const,
        quality: 'standard' as const,
        educationalContext: 'Mathematics lesson about shapes',
      };

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.image_url).toBe(
          'https://example.com/test-image.png'
        );
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.langgraph_enabled).toBe(true);
      }
    });

    it('should handle validation errors properly', async () => {
      const invalidParams = {
        prompt: '', // Empty prompt should fail validation
        size: '1024x1024' as const,
      };

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        invalidParams,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameters');
    });

    it('should handle non-existent agent gracefully', async () => {
      const params = {
        prompt: 'Test prompt',
      };

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'non-existent-agent',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent not found');
    });

    it('should support different progress levels', async () => {
      const params = {
        prompt: 'Test image for debug level',
        enhancePrompt: true,
      };

      const progressLevels: ProgressLevel[] = [
        ProgressLevel.USER_FRIENDLY,
        ProgressLevel.DETAILED,
        ProgressLevel.DEBUG,
      ];

      for (const level of progressLevels) {
        const result = await langGraphAgentService.executeAgentWithWorkflow(
          'langgraph-image-generation',
          params,
          testUserId,
          testSessionId
        );

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle OpenAI API errors with recovery', async () => {
      // Mock OpenAI to throw an error
      const { openaiClient } = require('../config/openai');
      openaiClient.images.generate.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      const params = {
        prompt: 'Test prompt that should trigger error',
      };

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Rate limit');
    });

    it('should preserve credits on failure', async () => {
      // Mock OpenAI to throw a rate limit error
      const { openaiClient } = require('../config/openai');
      openaiClient.images.generate.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      const params = {
        prompt: 'Test prompt for credit preservation',
      };

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      // Credits should be preserved (no cost charged)
      expect(result.cost).toBeUndefined();
    });
  });

  describe('Execution Status Tracking', () => {
    it('should track execution status', async () => {
      const params = {
        prompt: 'Test prompt for status tracking',
      };

      // Start execution (this will create an execution record)
      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();

      // Note: In a real environment, we would get the execution ID from the result
      // and then test status retrieval. For now, we test that the method exists.
      expect(typeof langGraphAgentService.getExecutionStatus).toBe('function');
    });

    it('should support execution cancellation', async () => {
      const executionId = 'test-execution-123';

      const cancelled =
        await langGraphAgentService.cancelExecution(executionId);

      // The method should exist and return a boolean
      expect(typeof cancelled).toBe('boolean');
    });
  });

  describe('Agent Parameter Validation', () => {
    it('should validate image generation parameters correctly', () => {
      const agent = agentRegistry.getAgent('langgraph-image-generation');
      expect(agent).toBeDefined();

      if (agent) {
        // Valid parameters
        expect(
          agent.validateParams({
            prompt: 'Valid prompt',
            size: '1024x1024',
            quality: 'standard',
            style: 'natural',
          })
        ).toBe(true);

        // Invalid parameters
        expect(
          agent.validateParams({
            prompt: '', // Empty prompt
          })
        ).toBe(false);

        expect(
          agent.validateParams({
            prompt: 'Valid prompt',
            size: 'invalid-size', // Invalid size
          })
        ).toBe(false);

        expect(
          agent.validateParams({
            prompt: 'Valid prompt',
            quality: 'invalid-quality', // Invalid quality
          })
        ).toBe(false);
      }
    });

    it('should estimate costs correctly', () => {
      const agent = agentRegistry.getAgent('langgraph-image-generation');
      expect(agent).toBeDefined();

      if (agent) {
        const standardCost = agent.estimateCost({
          prompt: 'Test prompt',
          size: '1024x1024',
          quality: 'standard',
        });

        const hdCost = agent.estimateCost({
          prompt: 'Test prompt',
          size: '1024x1024',
          quality: 'hd',
        });

        expect(standardCost).toBe(4); // $0.04 in cents
        expect(hdCost).toBe(8); // $0.08 in cents
        expect(hdCost).toBeGreaterThan(standardCost);
      }
    });
  });

  describe('Educational Enhancement Features', () => {
    it('should enhance German prompts for educational context', async () => {
      const params = {
        prompt: 'Ein rotes Auto für den Verkehrsunterricht',
        educationalContext: 'Traffic safety education',
        targetAgeGroup: '6-8 years',
        subject: 'Safety Education',
        enhancePrompt: true,
      };

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.enhanced_prompt).toBeDefined();
        expect(result.data.educational_optimized).toBe(true);
      }
    });

    it('should handle English prompts without unnecessary enhancement', async () => {
      const params = {
        prompt: 'A red car for traffic education',
        enhancePrompt: true,
      };

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Progress Streaming Integration', () => {
    it('should create progress tracker for executions', async () => {
      const params = {
        prompt: 'Test prompt for progress tracking',
      };

      // The progress streaming service should be initialized
      expect(progressStreamingService).toBeDefined();

      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        testUserId,
        testSessionId
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle different progress levels correctly', () => {
      const levels = [
        ProgressLevel.USER_FRIENDLY,
        ProgressLevel.DETAILED,
        ProgressLevel.DEBUG,
      ];

      levels.forEach((level) => {
        expect(Object.values(ProgressLevel)).toContain(level);
      });
    });
  });
});

describe('LangGraph Image Generation Agent', () => {
  it('should create workflow successfully', () => {
    const workflow = langGraphImageGenerationAgent.createWorkflow();
    expect(workflow).toBeDefined();
  });

  it('should have correct workflow configuration', () => {
    const config = langGraphImageGenerationAgent.getWorkflowConfig();
    expect(config).toBeDefined();
    expect(config.checkpointer).toBe(true);
  });

  it('should have all required agent properties', () => {
    expect(langGraphImageGenerationAgent.id).toBe('langgraph-image-generation');
    expect(langGraphImageGenerationAgent.name).toBeDefined();
    expect(langGraphImageGenerationAgent.description).toBeDefined();
    expect(langGraphImageGenerationAgent.type).toBe('image-generation');
    expect(langGraphImageGenerationAgent.triggers).toBeDefined();
    expect(langGraphImageGenerationAgent.triggers.length).toBeGreaterThan(0);
    expect(langGraphImageGenerationAgent.enabled).toBe(true);
  });

  it('should support educational context parameters', () => {
    const params = {
      prompt: 'Test prompt',
      educationalContext: 'Mathematics',
      targetAgeGroup: '10-12 years',
      subject: 'Geometry',
    };

    expect(langGraphImageGenerationAgent.validateParams(params)).toBe(true);
  });
});
