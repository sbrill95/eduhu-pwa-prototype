/**
 * Metadata Validation Utility
 *
 * Validates metadata objects for library materials to ensure they meet
 * size and structure requirements before storage.
 *
 * Requirements (from FR-010):
 * - JSON size must be < 10KB
 * - Required fields must be present
 * - String values must be sanitized
 * - Malicious content must be rejected
 */

export interface ImageGenerationMetadata {
  prompt: string;
  originalParams: {
    style?: string;
    aspect_ratio?: string;
    quality?: string;
    [key: string]: any;
  };
  timestamp: string;
  model?: string;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: ImageGenerationMetadata;
}

const MAX_METADATA_SIZE_BYTES = 10 * 1024; // 10KB
const MAX_STRING_LENGTH = 5000; // Maximum length for any string field

/**
 * Validates that metadata meets all requirements
 */
export function validateMetadata(metadata: unknown): ValidationResult {
  // Check if metadata exists
  if (!metadata) {
    return {
      valid: false,
      error: 'Metadata is required'
    };
  }

  // Check if metadata is an object
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {
      valid: false,
      error: 'Metadata must be a valid object'
    };
  }

  // Check JSON size
  const jsonString = JSON.stringify(metadata);
  const sizeBytes = new Blob([jsonString]).size;

  if (sizeBytes > MAX_METADATA_SIZE_BYTES) {
    return {
      valid: false,
      error: `Metadata size (${sizeBytes} bytes) exceeds maximum allowed size (${MAX_METADATA_SIZE_BYTES} bytes)`
    };
  }

  // Type assertion for object operations
  const metadataObj = metadata as Record<string, any>;

  // Check required fields
  if (!metadataObj.prompt || typeof metadataObj.prompt !== 'string') {
    return {
      valid: false,
      error: 'Metadata must contain a valid "prompt" field'
    };
  }

  if (!metadataObj.originalParams || typeof metadataObj.originalParams !== 'object') {
    return {
      valid: false,
      error: 'Metadata must contain a valid "originalParams" object'
    };
  }

  if (!metadataObj.timestamp || typeof metadataObj.timestamp !== 'string') {
    return {
      valid: false,
      error: 'Metadata must contain a valid "timestamp" field'
    };
  }

  // Sanitize the metadata
  try {
    const sanitized = sanitizeMetadata(metadataObj);

    return {
      valid: true,
      sanitized: sanitized as ImageGenerationMetadata
    };
  } catch (error) {
    return {
      valid: false,
      error: `Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Sanitizes metadata by removing malicious content and enforcing limits
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Sanitize based on type
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else {
        sanitized[key] = sanitizeMetadata(value);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
    // Skip functions, undefined, symbols
  }

  return sanitized;
}

/**
 * Sanitizes a string value
 */
function sanitizeString(value: string): string {
  // Truncate if too long
  let sanitized = value.length > MAX_STRING_LENGTH
    ? value.substring(0, MAX_STRING_LENGTH)
    : value;

  // Remove potential script tags and event handlers
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized.trim();
}

/**
 * Validates and stringifies metadata for storage
 * Returns JSON string if valid, null if invalid
 */
export function stringifyMetadata(metadata: unknown): string | null {
  const result = validateMetadata(metadata);

  if (!result.valid || !result.sanitized) {
    console.error('[metadata-validator] Validation failed:', result.error);
    return null;
  }

  return JSON.stringify(result.sanitized);
}

/**
 * Parses and validates metadata from storage
 * Returns parsed metadata if valid, null if invalid
 */
export function parseMetadata(jsonString: string | null | undefined): ImageGenerationMetadata | null {
  if (!jsonString) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);
    const result = validateMetadata(parsed);

    if (!result.valid || !result.sanitized) {
      console.error('[metadata-validator] Invalid metadata from storage:', result.error);
      return null;
    }

    return result.sanitized;
  } catch (error) {
    console.error('[metadata-validator] Failed to parse metadata:', error);
    return null;
  }
}
