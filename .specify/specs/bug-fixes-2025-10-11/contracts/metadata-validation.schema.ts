/**
 * Metadata Validation Schemas for Bug Fixes 2025-10-11
 *
 * This file defines Zod schemas for validating metadata JSON structures
 * stored in InstantDB messages and library_materials tables.
 *
 * Related Requirements:
 * - FR-010: Metadata validation (required fields, sanitization, size limits)
 * - FR-010a: Error handling for validation failures
 * - BUG-019: Library materials metadata field
 */

import { z } from 'zod';

/**
 * Schema for originalParams object used in image generation
 * Contains the parameters needed to regenerate an image
 */
export const OriginalParamsSchema = z.object({
  description: z.string().min(1).max(1000),
  imageStyle: z.enum(['realistic', 'cartoon', 'abstract', 'sketch', 'watercolor']),
  learningGroup: z.enum(['elementary', 'middle', 'high', 'university']).optional(),
  subject: z.string().max(100).optional(),
}).strict();

/**
 * Schema for image metadata stored in messages and library_materials
 * Used when an agent generates an image result
 */
export const ImageMetadataSchema = z.object({
  type: z.literal('image'),
  image_url: z.string().url().max(2048),
  title: z.string().min(1).max(200),
  originalParams: OriginalParamsSchema,
}).strict();

/**
 * Schema for generic message metadata
 * Allows additional fields for future agent types
 */
export const MessageMetadataSchema = z.object({
  type: z.string().max(50),
  image_url: z.string().url().max(2048).optional(),
  title: z.string().max(200).optional(),
  originalParams: z.record(z.unknown()).optional(),
}).passthrough(); // Allow additional fields for extensibility

/**
 * Schema for library material metadata
 * Stricter validation since this is used for regeneration
 */
export const LibraryMaterialMetadataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    image_url: z.string().url().max(2048),
    title: z.string().min(1).max(200),
    originalParams: OriginalParamsSchema,
  }).strict(),
  z.object({
    type: z.literal('document'),
    url: z.string().url().max(2048),
    title: z.string().min(1).max(200),
    documentType: z.string().max(50).optional(),
  }).strict(),
  z.object({
    type: z.literal('resource'),
    url: z.string().url().max(2048).optional(),
    title: z.string().min(1).max(200),
    resourceType: z.string().max(50).optional(),
  }).strict(),
]);

/**
 * Validates metadata size constraint (FR-010: <10KB limit)
 *
 * @param metadata - Metadata object to validate
 * @returns true if size is within limit, false otherwise
 */
export const validateMetadataSize = (metadata: unknown): boolean => {
  try {
    const jsonString = JSON.stringify(metadata);
    const sizeInBytes = new Blob([jsonString]).size;
    const maxSizeBytes = 10 * 1024; // 10KB

    return sizeInBytes < maxSizeBytes;
  } catch (error) {
    console.error('[Metadata Validation] Failed to calculate size:', error);
    return false;
  }
};

/**
 * Sanitizes string values to prevent script injection (FR-010)
 * Removes potentially dangerous characters and HTML tags
 *
 * @param value - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Recursively sanitizes all string values in metadata object
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export const sanitizeMetadata = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeMetadata(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeMetadata(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  issues?: z.ZodIssue[];
}

/**
 * Validates and sanitizes image metadata (FR-010, FR-010a)
 *
 * @param metadata - Raw metadata object from user input
 * @returns Validation result with sanitized data or error details
 */
export const validateImageMetadata = (metadata: unknown): ValidationResult<z.infer<typeof ImageMetadataSchema>> => {
  // Step 1: Sanitize all string values
  const sanitized = sanitizeMetadata(metadata);

  // Step 2: Validate size constraint
  if (!validateMetadataSize(sanitized)) {
    return {
      success: false,
      error: 'Metadata size exceeds 10KB limit',
    };
  }

  // Step 3: Validate schema
  const result = ImageMetadataSchema.safeParse(sanitized);

  if (!result.success) {
    return {
      success: false,
      error: 'Invalid metadata structure',
      issues: result.error.issues,
    };
  }

  return {
    success: true,
    data: result.data,
  };
};

/**
 * Validates and sanitizes library material metadata (FR-010, FR-010a)
 *
 * @param metadata - Raw metadata object
 * @returns Validation result with sanitized data or error details
 */
export const validateLibraryMaterialMetadata = (metadata: unknown): ValidationResult<z.infer<typeof LibraryMaterialMetadataSchema>> => {
  // Step 1: Sanitize all string values
  const sanitized = sanitizeMetadata(metadata);

  // Step 2: Validate size constraint
  if (!validateMetadataSize(sanitized)) {
    return {
      success: false,
      error: 'Metadata size exceeds 10KB limit',
    };
  }

  // Step 3: Validate schema
  const result = LibraryMaterialMetadataSchema.safeParse(sanitized);

  if (!result.success) {
    return {
      success: false,
      error: 'Invalid metadata structure',
      issues: result.error.issues,
    };
  }

  return {
    success: true,
    data: result.data,
  };
};

/**
 * Type exports for use in application code
 */
export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;
export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;
export type LibraryMaterialMetadata = z.infer<typeof LibraryMaterialMetadataSchema>;
export type OriginalParams = z.infer<typeof OriginalParamsSchema>;

/**
 * Usage Examples:
 *
 * // Validate image metadata before saving to database
 * const result = validateImageMetadata({
 *   type: 'image',
 *   image_url: 'https://example.com/image.png',
 *   title: 'My Generated Image',
 *   originalParams: {
 *     description: 'A red apple',
 *     imageStyle: 'realistic',
 *     learningGroup: 'elementary',
 *     subject: 'biology'
 *   }
 * });
 *
 * if (result.success) {
 *   // Save result.data to database
 *   await db.messages.create({
 *     content: 'Generated image',
 *     metadata: JSON.stringify(result.data)
 *   });
 * } else {
 *   // Handle validation failure (FR-010a)
 *   console.error('Metadata validation failed:', result.error);
 *   toast.error('Image saved without regeneration parameters');
 *   await db.messages.create({
 *     content: 'Generated image',
 *     // Save without metadata
 *   });
 * }
 */
