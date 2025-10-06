/**
 * LangGraph Agent Routes - Validation Tests
 * Tests for Gemini form validation and backward compatibility
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

/**
 * Zod Validation Schemas (copied from langGraphAgents.ts for testing)
 */

// Gemini Image Generation Form Data Schema
const ImageGenerationFormSchema = z.object({
  theme: z.string().min(3, 'Theme must be at least 3 characters').max(500, 'Theme too long'),
  learningGroup: z.string().min(1, 'Learning group is required'),
  dazSupport: z.boolean().optional().default(false),
  learningDifficulties: z.boolean().optional().default(false),
  prompt: z.string().optional(),
});

// Legacy params format
const LegacyParamsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
  enhancePrompt: z.boolean().optional(),
  educationalContext: z.string().max(200).optional(),
  targetAgeGroup: z.string().max(50).optional(),
  subject: z.string().max(100).optional(),
});

// Agent Execution Request Schema
const AgentExecutionRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  input: z.union([
    z.string(),
    ImageGenerationFormSchema,
    LegacyParamsSchema
  ]).optional(),
  params: LegacyParamsSchema.optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  progressLevel: z.enum(['user_friendly', 'detailed', 'debug']).optional().default('user_friendly'),
  confirmExecution: z.boolean().optional().default(false),
});

describe('LangGraph Agent Validation', () => {
  describe('Gemini Form Format', () => {
    it('should accept valid Gemini form data', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: {
          theme: 'Photosynthese Prozess mit Pflanze',
          learningGroup: 'Klasse 7',
          dazSupport: false,
          learningDifficulties: false
        },
        userId: 'user123'
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input).toMatchObject({
          theme: 'Photosynthese Prozess mit Pflanze',
          learningGroup: 'Klasse 7',
          dazSupport: false,
          learningDifficulties: false
        });
      }
    });

    it('should reject Gemini form with missing theme', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: {
          learningGroup: 'Klasse 7'
          // theme is missing
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      // This should fail because it doesn't match any of the union types:
      // - Not a string
      // - Not a valid ImageGenerationFormSchema (missing theme)
      // - Not a valid LegacyParamsSchema (missing prompt)
      expect(result.success).toBe(false);
    });

    it('should reject Gemini form with short theme', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: {
          theme: 'ab', // Too short
          learningGroup: 'Klasse 7'
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors.some(e => e.message.includes('at least 3 characters'))).toBe(true);
      }
    });

    it('should accept Gemini form with optional fields defaulted', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: {
          theme: 'Photosynthese',
          learningGroup: 'Klasse 7'
          // dazSupport and learningDifficulties omitted
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        const inputData = result.data.input as any;
        expect(inputData.dazSupport).toBe(false);
        expect(inputData.learningDifficulties).toBe(false);
      }
    });
  });

  describe('Legacy Params Format', () => {
    it('should accept valid legacy params', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        params: {
          prompt: 'Create an image of photosynthesis',
          size: '1024x1024' as const,
          quality: 'hd' as const
        },
        userId: 'user123'
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.params).toMatchObject({
          prompt: 'Create an image of photosynthesis',
          size: '1024x1024',
          quality: 'hd'
        });
      }
    });

    it('should reject legacy params with invalid size', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        params: {
          prompt: 'Create an image',
          size: '512x512' // Invalid size
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject legacy params without prompt', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        params: {
          size: '1024x1024'
          // prompt missing
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('Simple String Input', () => {
    it('should accept string input', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: 'Create an educational image about photosynthesis'
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input).toBe('Create an educational image about photosynthesis');
      }
    });

    it('should accept input in legacy params format', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: {
          prompt: 'Create an image',
          size: '1024x1024' as const
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject request without agentId', () => {
      const request = {
        input: 'Create an image'
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('agentId'))).toBe(true);
      }
    });

    it('should accept request without userId (optional)', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: 'Create an image'
        // userId omitted
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should default progressLevel to user_friendly', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: 'Create an image'
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.progressLevel).toBe('user_friendly');
      }
    });

    it('should default confirmExecution to false', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: 'Create an image'
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confirmExecution).toBe(false);
      }
    });
  });

  describe('Multiple Input Formats (Union)', () => {
    it('should correctly identify string input', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: 'Simple string'
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.input).toBe('string');
      }
    });

    it('should correctly identify Gemini form input', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: {
          theme: 'Photosynthese',
          learningGroup: 'Klasse 7'
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success && typeof result.data.input === 'object') {
        expect('theme' in result.data.input).toBe(true);
        expect('learningGroup' in result.data.input).toBe(true);
      }
    });

    it('should correctly identify legacy params input', () => {
      const request = {
        agentId: 'langgraph-image-generation',
        input: {
          prompt: 'Create image',
          size: '1024x1024' as const,
          quality: 'hd' as const
        }
      };

      const result = AgentExecutionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success && typeof result.data.input === 'object') {
        expect('prompt' in result.data.input).toBe(true);
        expect('size' in result.data.input).toBe(true);
      }
    });
  });
});

describe('ImageGenerationFormSchema', () => {
  it('should validate theme length', () => {
    const valid = ImageGenerationFormSchema.safeParse({
      theme: 'Valid theme',
      learningGroup: 'Klasse 7'
    });
    expect(valid.success).toBe(true);

    const tooShort = ImageGenerationFormSchema.safeParse({
      theme: 'ab',
      learningGroup: 'Klasse 7'
    });
    expect(tooShort.success).toBe(false);

    const tooLong = ImageGenerationFormSchema.safeParse({
      theme: 'a'.repeat(501),
      learningGroup: 'Klasse 7'
    });
    expect(tooLong.success).toBe(false);
  });

  it('should require learningGroup', () => {
    const missing = ImageGenerationFormSchema.safeParse({
      theme: 'Valid theme'
    });
    expect(missing.success).toBe(false);
  });

  it('should accept optional boolean fields', () => {
    const withBooleans = ImageGenerationFormSchema.safeParse({
      theme: 'Valid theme',
      learningGroup: 'Klasse 7',
      dazSupport: true,
      learningDifficulties: true
    });
    expect(withBooleans.success).toBe(true);
  });
});

describe('LegacyParamsSchema', () => {
  it('should require prompt', () => {
    const missing = LegacyParamsSchema.safeParse({
      size: '1024x1024'
    });
    expect(missing.success).toBe(false);
  });

  it('should validate size enum', () => {
    const valid = LegacyParamsSchema.safeParse({
      prompt: 'Test',
      size: '1024x1024'
    });
    expect(valid.success).toBe(true);

    const invalid = LegacyParamsSchema.safeParse({
      prompt: 'Test',
      size: '2048x2048'
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate quality enum', () => {
    const valid = LegacyParamsSchema.safeParse({
      prompt: 'Test',
      quality: 'hd'
    });
    expect(valid.success).toBe(true);

    const invalid = LegacyParamsSchema.safeParse({
      prompt: 'Test',
      quality: 'ultra'
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate style enum', () => {
    const valid = LegacyParamsSchema.safeParse({
      prompt: 'Test',
      style: 'vivid'
    });
    expect(valid.success).toBe(true);

    const invalid = LegacyParamsSchema.safeParse({
      prompt: 'Test',
      style: 'artistic'
    });
    expect(invalid.success).toBe(false);
  });
});
