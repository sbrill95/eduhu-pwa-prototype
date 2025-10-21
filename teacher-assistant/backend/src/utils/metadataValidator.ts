/**
 * Metadata Validation Utility for FR-010
 *
 * Validates and sanitizes metadata JSON before saving to InstantDB
 * Requirements:
 * - FR-010a: Required fields present (type, image_url for images; originalParams for regeneration)
 * - FR-010b: Sanitize all string values using DOMPurify (per CHK035)
 * - FR-010c: Validate object before JSON.stringify() (per CHK109)
 * - FR-010d: Enforce serialized JSON string size <10KB
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// DOMPurify configuration per CHK035 resolution
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [], // Strip all HTML tags
  ALLOWED_ATTR: [], // Strip all attributes
  KEEP_CONTENT: true, // Keep text content
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitize a string value to prevent XSS/injection
 * FR-010: Use DOMPurify with specific config
 */
function sanitizeString(input: string): string {
  // Remove template injection patterns (FR-010e)
  const withoutTemplates = input
    .replace(/\$\{[^}]*\}/g, '') // Remove ${...}
    .replace(/\{\{[^}]*\}\}/g, '') // Remove {{...}}
    .replace(/<%=?[^%]*%>/g, '') // Remove <%= ... %>
    .replace(/#\{[^}]*\}/g, ''); // Remove #{...}

  // Sanitize with DOMPurify
  return DOMPurify.sanitize(withoutTemplates, DOMPURIFY_CONFIG);
}

/**
 * String schema with sanitization transform
 */
const SanitizedString = z.string().transform(sanitizeString);

/**
 * Image metadata schema (for agent-generated images)
 */
export const ImageMetadataSchema = z
  .object({
    type: z.literal('image'),
    image_url: z.string().url('Invalid image URL'),
    title: SanitizedString.optional(),
    originalParams: z
      .object({
        description: SanitizedString.optional(),
        imageStyle: SanitizedString.optional(),
        learningGroup: SanitizedString.optional(),
        subject: SanitizedString.optional(),
      })
      .optional(),
  })
  .strict();

/**
 * Text message metadata schema
 */
export const TextMetadataSchema = z
  .object({
    type: z.literal('text'),
    content: SanitizedString.optional(),
  })
  .strict();

/**
 * Agent result metadata schema
 */
export const AgentResultMetadataSchema = z
  .object({
    type: z.literal('agent_result'),
    image_url: z.string().url('Invalid image URL').optional(),
    title: SanitizedString.optional(),
    originalParams: z
      .object({
        description: SanitizedString.optional(),
        imageStyle: SanitizedString.optional(),
        learningGroup: SanitizedString.optional(),
        subject: SanitizedString.optional(),
      })
      .optional(),
  })
  .strict();

/**
 * Union of all metadata types
 */
export const MetadataSchema = z.discriminatedUnion('type', [
  ImageMetadataSchema,
  TextMetadataSchema,
  AgentResultMetadataSchema,
]);

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: Array<{ field: string; message: string }>;
  };
}

/**
 * Validate metadata object before stringification (FR-010c)
 *
 * @param metadata - Metadata object to validate
 * @returns Validation result with sanitized data or error details
 */
export function validateMetadata(
  metadata: unknown
): ValidationResult<z.infer<typeof MetadataSchema>> {
  try {
    // Parse and validate with Zod
    const result = MetadataSchema.safeParse(metadata);

    if (!result.success) {
      return {
        success: false,
        error: {
          message: 'Metadata validation failed',
          details: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      };
    }

    // Check serialized size (FR-010d: <10KB)
    const serialized = JSON.stringify(result.data);
    if (serialized.length >= 10240) {
      // 10KB = 10240 bytes
      return {
        success: false,
        error: {
          message: 'Metadata too large',
          details: [
            {
              field: 'metadata',
              message: `Serialized JSON size ${serialized.length} bytes exceeds 10KB limit`,
            },
          ],
        },
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Metadata validation error',
        details: [
          {
            field: 'metadata',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      },
    };
  }
}

/**
 * Validate and stringify metadata for InstantDB storage (FR-004)
 *
 * @param metadata - Metadata object to validate and stringify
 * @returns JSON string if valid, null if validation fails
 */
export function validateAndStringifyMetadata(metadata: unknown): string | null {
  const result = validateMetadata(metadata);

  if (!result.success) {
    console.error('[MetadataValidator] Validation failed:', result.error);
    return null;
  }

  return JSON.stringify(result.data);
}
