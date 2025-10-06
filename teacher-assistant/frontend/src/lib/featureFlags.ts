/**
 * Feature Flags Module
 *
 * Centralized feature flag management for enabling/disabling features
 * across the application. Uses Vite environment variables for configuration.
 *
 * @module featureFlags
 */

/**
 * Available feature flags in the application
 */
export interface FeatureFlags {
  /** Enable/disable the onboarding wizard for new users */
  ENABLE_ONBOARDING: boolean;
  /** Enable/disable the library/materials feature */
  ENABLE_LIBRARY: boolean;
  /** Enable/disable the profile/settings feature */
  ENABLE_PROFILE: boolean;
  /** Enable/disable the Agent UI Modal system */
  ENABLE_AGENT_UI: boolean;
}

/**
 * Default feature flag values
 * These are used when environment variables are not set
 */
const DEFAULT_FLAGS: FeatureFlags = {
  ENABLE_ONBOARDING: false,
  ENABLE_LIBRARY: true,
  ENABLE_PROFILE: true,
  ENABLE_AGENT_UI: true,
};

/**
 * Parse a string value to boolean
 * Handles various string representations of boolean values
 *
 * @param value - String value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed boolean value
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return defaultValue;
}

/**
 * Feature flags configuration object
 * Reads from Vite environment variables with fallback to defaults
 */
export const featureFlags: FeatureFlags = {
  ENABLE_ONBOARDING: parseBoolean(
    import.meta.env.VITE_ENABLE_ONBOARDING,
    DEFAULT_FLAGS.ENABLE_ONBOARDING
  ),
  ENABLE_LIBRARY: parseBoolean(
    import.meta.env.VITE_ENABLE_LIBRARY,
    DEFAULT_FLAGS.ENABLE_LIBRARY
  ),
  ENABLE_PROFILE: parseBoolean(
    import.meta.env.VITE_ENABLE_PROFILE,
    DEFAULT_FLAGS.ENABLE_PROFILE
  ),
  ENABLE_AGENT_UI: parseBoolean(
    import.meta.env.VITE_ENABLE_AGENT_UI,
    DEFAULT_FLAGS.ENABLE_AGENT_UI
  ),
};

/**
 * Check if a specific feature is enabled
 *
 * @param featureName - Name of the feature to check
 * @returns True if the feature is enabled, false otherwise
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('ENABLE_ONBOARDING')) {
 *   // Show onboarding wizard
 * }
 * ```
 */
export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  return featureFlags[featureName];
}

/**
 * Get all feature flags as a readonly object
 * Useful for debugging and displaying feature flag status
 *
 * @returns Readonly copy of all feature flags
 */
export function getAllFeatureFlags(): Readonly<FeatureFlags> {
  return Object.freeze({ ...featureFlags });
}