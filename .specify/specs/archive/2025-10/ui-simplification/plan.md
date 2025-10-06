# UI Simplification - Technical Implementation Plan

**Status**: Ready for Implementation
**Created**: 2025-09-30
**Related**: [spec.md](spec.md) | [tasks.md](tasks.md)

---

## Overview

This plan details the technical implementation for deactivating the Onboarding Wizard via Feature Flags, enabling users to access the app immediately after login.

**Estimated Time**: 3 hours
**Complexity**: Low
**Risk Level**: Low

---

## Architecture

### Feature Flag System

```
lib/
├── featureFlags.ts          # NEW - Feature flag definitions
└── types.ts                 # Update - Add FeatureFlagConfig type
```

**Implementation**:

```typescript
// teacher-assistant/frontend/src/lib/featureFlags.ts

/**
 * Feature Flags Configuration
 * Controls which features are enabled/disabled in the application
 */

export interface FeatureFlagConfig {
  ENABLE_ONBOARDING: boolean;
  ENABLE_PROFILE_MODAL: boolean;
  ENABLE_CHAT: boolean;
  ENABLE_LIBRARY: boolean;
}

/**
 * Feature flags with environment variable support
 *
 * Environment Variables:
 * - VITE_ENABLE_ONBOARDING: 'true' | 'false' (default: false)
 * - VITE_ENABLE_PROFILE_MODAL: 'true' | 'false' (default: true)
 * - VITE_ENABLE_CHAT: 'true' | 'false' (default: true)
 * - VITE_ENABLE_LIBRARY: 'true' | 'false' (default: true)
 */
export const FEATURE_FLAGS: FeatureFlagConfig = {
  ENABLE_ONBOARDING: import.meta.env.VITE_ENABLE_ONBOARDING === 'true',
  ENABLE_PROFILE_MODAL: import.meta.env.VITE_ENABLE_PROFILE_MODAL !== 'false',
  ENABLE_CHAT: import.meta.env.VITE_ENABLE_CHAT !== 'false',
  ENABLE_LIBRARY: import.meta.env.VITE_ENABLE_LIBRARY !== 'false',
};

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlagConfig): boolean => {
  return FEATURE_FLAGS[feature];
};

/**
 * Development helper: Log feature flag status
 */
if (import.meta.env.DEV) {
  console.log('[Feature Flags]', FEATURE_FLAGS);
}
```

---

## Component Changes

### 1. App.tsx Modifications

**File**: `teacher-assistant/frontend/src/App.tsx`

**Current Code** (Lines 47-60):
```typescript
const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useTeacherProfile();
  const { onboardingStatus, checkOnboardingStatus, isOnboardingComplete, loading: onboardingLoading } = useOnboarding();
  // ... rest of component
```

**Updated Code**:
```typescript
import { FEATURE_FLAGS, isFeatureEnabled } from './lib/featureFlags';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useTeacherProfile();

  // Conditional onboarding hook usage based on feature flag
  const onboardingHook = isFeatureEnabled('ENABLE_ONBOARDING')
    ? useOnboarding()
    : {
        onboardingStatus: null,
        checkOnboardingStatus: () => {},
        isOnboardingComplete: true,  // Always true when disabled
        loading: false
      };

  const { onboardingStatus, checkOnboardingStatus, isOnboardingComplete, loading: onboardingLoading } = onboardingHook;

  // ... rest of component
```

**Onboarding Render Logic** (Around Line 150):
```typescript
// OLD:
{!isOnboardingComplete && (
  <OnboardingWizard
    onComplete={handleOnboardingComplete}
    onSkip={handleOnboardingSkip}
    allowSkip={true}
  />
)}

// NEW:
{isFeatureEnabled('ENABLE_ONBOARDING') && !isOnboardingComplete && (
  <OnboardingWizard
    onComplete={handleOnboardingComplete}
    onSkip={handleOnboardingSkip}
    allowSkip={true}
  />
)}
```

**Benefits**:
- ✅ No code deletion (OnboardingWizard stays intact)
- ✅ Reversible (change env variable)
- ✅ No breaking changes
- ✅ TypeScript safe

---

### 2. Environment Configuration

**File**: `teacher-assistant/frontend/.env` (NEW)

```bash
# Feature Flags
VITE_ENABLE_ONBOARDING=false
VITE_ENABLE_PROFILE_MODAL=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_LIBRARY=true
```

**File**: `teacher-assistant/frontend/.env.example` (UPDATE)

```bash
# Feature Flags Configuration
# Set to 'true' to enable, 'false' to disable

# Onboarding Wizard (disabled by default for quick access)
VITE_ENABLE_ONBOARDING=false

# Core Features (enabled by default)
VITE_ENABLE_PROFILE_MODAL=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_LIBRARY=true
```

**File**: `teacher-assistant/frontend/.env.development` (NEW)

```bash
# Development Feature Flags
VITE_ENABLE_ONBOARDING=false  # Skip onboarding in dev
```

**File**: `teacher-assistant/frontend/.env.production` (NEW)

```bash
# Production Feature Flags
VITE_ENABLE_ONBOARDING=false  # Skip onboarding in production (Phase 1)
```

---

## Testing Strategy

### Unit Tests

**File**: `teacher-assistant/frontend/src/lib/featureFlags.test.ts` (NEW)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from './featureFlags';

describe('Feature Flags', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('FEATURE_FLAGS', () => {
    it('should have correct default values', () => {
      expect(FEATURE_FLAGS).toHaveProperty('ENABLE_ONBOARDING');
      expect(FEATURE_FLAGS).toHaveProperty('ENABLE_PROFILE_MODAL');
      expect(FEATURE_FLAGS).toHaveProperty('ENABLE_CHAT');
      expect(FEATURE_FLAGS).toHaveProperty('ENABLE_LIBRARY');
    });

    it('should read from environment variables', () => {
      // Test ENABLE_ONBOARDING defaults to false
      expect(FEATURE_FLAGS.ENABLE_ONBOARDING).toBe(false);
    });

    it('should enable features that are not explicitly disabled', () => {
      expect(FEATURE_FLAGS.ENABLE_PROFILE_MODAL).toBe(true);
      expect(FEATURE_FLAGS.ENABLE_CHAT).toBe(true);
      expect(FEATURE_FLAGS.ENABLE_LIBRARY).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return correct boolean for each feature', () => {
      expect(isFeatureEnabled('ENABLE_ONBOARDING')).toBe(false);
      expect(isFeatureEnabled('ENABLE_PROFILE_MODAL')).toBe(true);
      expect(isFeatureEnabled('ENABLE_CHAT')).toBe(true);
      expect(isFeatureEnabled('ENABLE_LIBRARY')).toBe(true);
    });

    it('should handle invalid feature names gracefully', () => {
      // @ts-expect-error Testing invalid input
      const result = isFeatureEnabled('INVALID_FEATURE');
      expect(result).toBeUndefined();
    });
  });
});
```

### Integration Tests

**File**: `teacher-assistant/frontend/src/App.onboarding.test.tsx` (NEW)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as featureFlags from './lib/featureFlags';

vi.mock('./lib/auth-context', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({ user: { id: 'test-user' }, isLoading: false })
}));

vi.mock('./lib/instantdb', () => ({
  default: {
    useQuery: vi.fn(() => ({ data: null }))
  }
}));

describe('App - Onboarding Feature Flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should NOT show onboarding when ENABLE_ONBOARDING is false', async () => {
    vi.spyOn(featureFlags, 'isFeatureEnabled').mockImplementation((flag) => {
      if (flag === 'ENABLE_ONBOARDING') return false;
      return true;
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Willkommen/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Onboarding/i)).not.toBeInTheDocument();
    });

    // Should show main app instead
    expect(screen.getByText(/Home|Chat|Library/i)).toBeInTheDocument();
  });

  it('should show onboarding when ENABLE_ONBOARDING is true and not completed', async () => {
    vi.spyOn(featureFlags, 'isFeatureEnabled').mockImplementation((flag) => {
      if (flag === 'ENABLE_ONBOARDING') return true;
      return true;
    });

    // Mock onboarding not completed
    vi.mock('./hooks/useOnboarding', () => ({
      useOnboarding: () => ({
        isOnboardingComplete: false,
        onboardingStatus: null,
        checkOnboardingStatus: vi.fn(),
        loading: false
      })
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Onboarding/i)).toBeInTheDocument();
    });
  });

  it('should skip onboarding and show home when flag is false', async () => {
    vi.spyOn(featureFlags, 'FEATURE_FLAGS', 'get').mockReturnValue({
      ENABLE_ONBOARDING: false,
      ENABLE_PROFILE_MODAL: true,
      ENABLE_CHAT: true,
      ENABLE_LIBRARY: true
    });

    render(<App />);

    await waitFor(() => {
      // Should see home tab or main navigation
      const homeTab = screen.queryByRole('button', { name: /home/i });
      expect(homeTab).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Optional)

**File**: `teacher-assistant/frontend/e2e-tests/feature-flags.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Flags - Onboarding', () => {
  test('should skip onboarding and show home screen directly', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');

    // Wait for auth (or mock login)
    await page.waitForLoadState('networkidle');

    // Should NOT see onboarding wizard
    const onboardingTitle = page.locator('text=/Willkommen bei eduhu|Onboarding/i');
    await expect(onboardingTitle).not.toBeVisible({ timeout: 3000 });

    // Should see main app navigation
    const homeTab = page.locator('ion-tab-button[tab="home"]');
    await expect(homeTab).toBeVisible();

    const chatTab = page.locator('ion-tab-button[tab="chat"]');
    await expect(chatTab).toBeVisible();

    const libraryTab = page.locator('ion-tab-button[tab="library"]');
    await expect(libraryTab).toBeVisible();
  });

  test('home screen should be default tab after login', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Check that home tab is active
    const homeTab = page.locator('ion-tab-button[tab="home"]');
    await expect(homeTab).toHaveClass(/tab-selected|active/);
  });
});
```

---

## Migration Strategy

### Phase 1: Add Feature Flags (No Behavior Change)
**Duration**: 30 min

1. Create `lib/featureFlags.ts`
2. Add `.env` files
3. Write unit tests for feature flags
4. **Deploy & Verify**: No behavior change yet

### Phase 2: Integrate Feature Flags (Disable Onboarding)
**Duration**: 1 hour

1. Update `App.tsx` with feature flag checks
2. Update onboarding render logic
3. Write integration tests
4. **Deploy & Verify**: Onboarding is now skipped

### Phase 3: Testing & Documentation
**Duration**: 1.5 hours

1. Run all existing tests (ensure no breaks)
2. Write E2E tests (optional)
3. Update README with feature flag documentation
4. Create session log

---

## Rollback Plan

### If Issues Arise

**Quick Rollback** (< 5 minutes):
```bash
# Change environment variable
VITE_ENABLE_ONBOARDING=true

# Rebuild and deploy
npm run build
# deploy
```

**Code Rollback**:
```bash
git revert <commit-hash>
git push
```

**Data Integrity**:
- ✅ No database changes
- ✅ No data migrations
- ✅ User profiles unaffected

---

## Performance Impact

### Bundle Size
- ✅ +0.1 KB (featureFlags.ts only)
- ✅ No additional dependencies

### Runtime Performance
- ✅ O(1) feature flag lookups
- ✅ No async operations
- ✅ Evaluated at import time

### Memory
- ✅ Negligible (~100 bytes for config object)

---

## Security Considerations

### Feature Flag Exposure
- ✅ Client-side flags are visible (acceptable for UI features)
- ✅ No sensitive data in feature flags
- ✅ Backend doesn't rely on client feature flags

### Access Control
- ✅ Onboarding bypass doesn't affect auth
- ✅ Profile data still protected by InstantDB rules

---

## Documentation Updates

### README.md

Add section:

```markdown
## Feature Flags

This project uses feature flags to control which features are enabled.

### Configuration

Feature flags are configured via environment variables in `.env` files:

```bash
# .env
VITE_ENABLE_ONBOARDING=false  # Skip onboarding wizard
VITE_ENABLE_PROFILE_MODAL=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_LIBRARY=true
```

### Available Flags

| Flag | Default | Description |
|------|---------|-------------|
| `VITE_ENABLE_ONBOARDING` | `false` | Enable/disable onboarding wizard |
| `VITE_ENABLE_PROFILE_MODAL` | `true` | Enable/disable profile modal |
| `VITE_ENABLE_CHAT` | `true` | Enable/disable chat feature |
| `VITE_ENABLE_LIBRARY` | `true` | Enable/disable library feature |

### Enabling Onboarding

To re-enable the onboarding wizard:

1. Set environment variable: `VITE_ENABLE_ONBOARDING=true`
2. Rebuild: `npm run build`
3. Restart dev server: `npm run dev`
```

---

## Success Metrics

### Functional Metrics
- ✅ Feature flag system works as expected
- ✅ Onboarding is skipped when flag = false
- ✅ Onboarding still works when flag = true
- ✅ All tests passing

### User Experience Metrics
- ✅ Time to first interaction < 5 seconds (down from ~30s with onboarding)
- ✅ No user confusion (clear home screen)
- ✅ Profile modal still accessible

### Technical Metrics
- ✅ Zero breaking changes
- ✅ Zero bundle size increase (negligible)
- ✅ Zero performance degradation

---

## Future Enhancements

### Phase 2 (Later)

1. **Remote Feature Flags**:
   - LaunchDarkly or similar
   - A/B testing support
   - User segmentation

2. **Feature Flag Dashboard**:
   - Admin UI to toggle flags
   - Usage analytics

3. **Progressive Onboarding**:
   - In-app tooltips
   - Contextual help
   - Progressive profiling

---

## Related Files

### Code
- `teacher-assistant/frontend/src/lib/featureFlags.ts`
- `teacher-assistant/frontend/src/App.tsx`
- `teacher-assistant/frontend/.env`

### Tests
- `teacher-assistant/frontend/src/lib/featureFlags.test.ts`
- `teacher-assistant/frontend/src/App.onboarding.test.tsx`
- `teacher-assistant/frontend/e2e-tests/feature-flags.spec.ts`

### Documentation
- `teacher-assistant/frontend/README.md`
- `docs/development-logs/sessions/2025-09-30/session-XX-ui-simplification.md`

---

**Maintained by**: Frontend-Agent
**Status**: Ready for `/implement`