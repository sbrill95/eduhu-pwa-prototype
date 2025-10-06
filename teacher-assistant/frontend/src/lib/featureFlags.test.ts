/**
 * Feature Flags Module Tests
 *
 * Comprehensive tests for feature flag functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('featureFlags', () => {
  // Reset modules before each test to ensure clean state
  beforeEach(() => {
    vi.resetModules();
  });

  describe('Default Values', () => {
    it('should have ENABLE_ONBOARDING set to false by default', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', undefined);
      const { featureFlags } = await import('./featureFlags');
      expect(featureFlags.ENABLE_ONBOARDING).toBe(false);
    });

    it('should have ENABLE_LIBRARY set to true by default', async () => {
      vi.stubEnv('VITE_ENABLE_LIBRARY', undefined);
      const { featureFlags } = await import('./featureFlags');
      expect(featureFlags.ENABLE_LIBRARY).toBe(true);
    });

    it('should have ENABLE_PROFILE set to true by default', async () => {
      vi.stubEnv('VITE_ENABLE_PROFILE', undefined);
      const { featureFlags } = await import('./featureFlags');
      expect(featureFlags.ENABLE_PROFILE).toBe(true);
    });
  });

  describe('Environment Variable Parsing', () => {
    describe('ENABLE_ONBOARDING', () => {
      it('should parse "true" string as true', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', 'true');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(true);
      });

      it('should parse "false" string as false', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', 'false');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(false);
      });

      it('should parse "1" as true', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', '1');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(true);
      });

      it('should parse "0" as false', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', '0');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(false);
      });

      it('should parse "yes" as true', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', 'yes');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(true);
      });

      it('should parse "no" as false', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', 'no');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(false);
      });

      it('should be case-insensitive', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', 'TRUE');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(true);
      });

      it('should handle whitespace', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', '  true  ');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(true);
      });

      it('should use default value for invalid strings', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', 'invalid');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(false); // default is false
      });

      it('should use default value for empty string', async () => {
        vi.stubEnv('VITE_ENABLE_ONBOARDING', '');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_ONBOARDING).toBe(false); // default is false
      });
    });

    describe('ENABLE_LIBRARY', () => {
      it('should parse "false" string as false', async () => {
        vi.stubEnv('VITE_ENABLE_LIBRARY', 'false');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_LIBRARY).toBe(false);
      });

      it('should parse "true" string as true', async () => {
        vi.stubEnv('VITE_ENABLE_LIBRARY', 'true');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_LIBRARY).toBe(true);
      });
    });

    describe('ENABLE_PROFILE', () => {
      it('should parse "false" string as false', async () => {
        vi.stubEnv('VITE_ENABLE_PROFILE', 'false');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_PROFILE).toBe(false);
      });

      it('should parse "true" string as true', async () => {
        vi.stubEnv('VITE_ENABLE_PROFILE', 'true');
        const { featureFlags } = await import('./featureFlags');
        expect(featureFlags.ENABLE_PROFILE).toBe(true);
      });
    });
  });

  describe('isFeatureEnabled()', () => {
    it('should return true when feature is enabled', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', 'true');
      const { isFeatureEnabled } = await import('./featureFlags');
      expect(isFeatureEnabled('ENABLE_ONBOARDING')).toBe(true);
    });

    it('should return false when feature is disabled', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', 'false');
      const { isFeatureEnabled } = await import('./featureFlags');
      expect(isFeatureEnabled('ENABLE_ONBOARDING')).toBe(false);
    });

    it('should work with all feature flags', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', 'true');
      vi.stubEnv('VITE_ENABLE_LIBRARY', 'false');
      vi.stubEnv('VITE_ENABLE_PROFILE', 'true');
      const { isFeatureEnabled } = await import('./featureFlags');

      expect(isFeatureEnabled('ENABLE_ONBOARDING')).toBe(true);
      expect(isFeatureEnabled('ENABLE_LIBRARY')).toBe(false);
      expect(isFeatureEnabled('ENABLE_PROFILE')).toBe(true);
    });
  });

  describe('getAllFeatureFlags()', () => {
    it('should return all feature flags', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', 'true');
      vi.stubEnv('VITE_ENABLE_LIBRARY', 'false');
      vi.stubEnv('VITE_ENABLE_PROFILE', 'true');
      const { getAllFeatureFlags } = await import('./featureFlags');

      const flags = getAllFeatureFlags();

      expect(flags).toEqual({
        ENABLE_ONBOARDING: true,
        ENABLE_LIBRARY: false,
        ENABLE_PROFILE: true,
      });
    });

    it('should return a frozen object', async () => {
      const { getAllFeatureFlags } = await import('./featureFlags');
      const flags = getAllFeatureFlags();

      expect(Object.isFrozen(flags)).toBe(true);
    });

    it('should not allow modification of returned object', async () => {
      const { getAllFeatureFlags } = await import('./featureFlags');
      const flags = getAllFeatureFlags() as any;

      // Attempting to modify should not change the value
      expect(() => {
        flags.ENABLE_ONBOARDING = false;
      }).toThrow();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should have correct TypeScript types', async () => {
      const { featureFlags, isFeatureEnabled } = await import('./featureFlags');

      // This test verifies that TypeScript compilation succeeds
      // If types are wrong, TypeScript will fail at compile time

      const onboardingEnabled: boolean = featureFlags.ENABLE_ONBOARDING;
      const libraryEnabled: boolean = featureFlags.ENABLE_LIBRARY;
      const profileEnabled: boolean = featureFlags.ENABLE_PROFILE;

      expect(typeof onboardingEnabled).toBe('boolean');
      expect(typeof libraryEnabled).toBe('boolean');
      expect(typeof profileEnabled).toBe('boolean');

      // Test isFeatureEnabled with type-safe keys
      const result1: boolean = isFeatureEnabled('ENABLE_ONBOARDING');
      const result2: boolean = isFeatureEnabled('ENABLE_LIBRARY');
      const result3: boolean = isFeatureEnabled('ENABLE_PROFILE');

      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
      expect(typeof result3).toBe('boolean');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle production configuration (all flags off)', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', 'false');
      vi.stubEnv('VITE_ENABLE_LIBRARY', 'true');
      vi.stubEnv('VITE_ENABLE_PROFILE', 'true');
      const { featureFlags } = await import('./featureFlags');

      expect(featureFlags.ENABLE_ONBOARDING).toBe(false);
      expect(featureFlags.ENABLE_LIBRARY).toBe(true);
      expect(featureFlags.ENABLE_PROFILE).toBe(true);
    });

    it('should handle development configuration (onboarding on for testing)', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', 'true');
      vi.stubEnv('VITE_ENABLE_LIBRARY', 'true');
      vi.stubEnv('VITE_ENABLE_PROFILE', 'true');
      const { featureFlags } = await import('./featureFlags');

      expect(featureFlags.ENABLE_ONBOARDING).toBe(true);
      expect(featureFlags.ENABLE_LIBRARY).toBe(true);
      expect(featureFlags.ENABLE_PROFILE).toBe(true);
    });

    it('should handle minimal feature set', async () => {
      vi.stubEnv('VITE_ENABLE_ONBOARDING', 'false');
      vi.stubEnv('VITE_ENABLE_LIBRARY', 'false');
      vi.stubEnv('VITE_ENABLE_PROFILE', 'false');
      const { featureFlags } = await import('./featureFlags');

      expect(featureFlags.ENABLE_ONBOARDING).toBe(false);
      expect(featureFlags.ENABLE_LIBRARY).toBe(false);
      expect(featureFlags.ENABLE_PROFILE).toBe(false);
    });
  });
});