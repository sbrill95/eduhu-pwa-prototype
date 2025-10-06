/**
 * Common Shared Types - Teacher Assistant
 *
 * This file contains common TypeScript types used across the application
 *
 * @see /docs/guides/PERFECT-WORKFLOW.md
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  timestamp: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  timestamp?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// SEARCH
// ============================================================================

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
}

// ============================================================================
// LOADING STATES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: LoadingState;
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

export interface FileUploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'de' | 'en';
  notifications?: boolean;
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Make all properties in T required (opposite of Partial<T>)
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Pick only properties of T that are assignable to U
 */
export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

/**
 * Remove null and undefined from T
 */
export type NonNullable<T> = T extends null | undefined ? never : T;
