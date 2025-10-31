import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright configuration for Teacher Assistant Chat-Integrated Agent Testing
 *
 * Features:
 * - Console debugging enabled
 * - Screenshot capture on failures
 * - Video recording for failed tests
 * - Mobile and desktop viewport testing
 * - Local development server setup
 * - Performance metrics collection
 */
export default defineConfig({
  // Test directory structure
  testDir: './e2e-tests',

  // Global test timeout (increased for DALL-E 3 image generation)
  timeout: 150000, // 150 seconds per test (allows 70s for image generation + 80s for other steps)
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  // Test execution configuration
  fullyParallel: false, // Sequential execution for better debugging
  forbidOnly: !!process.env.CI, // Prevent only() in CI
  retries: process.env.CI ? 2 : 1, // Retry failed tests
  workers: process.env.CI ? 1 : 1, // Single worker for better console debugging

  // Reporter configuration with detailed output
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list'], // Detailed console output
  ],

  // Environment variables for test mode
  env: {
    VITE_TEST_MODE: 'true', // Enable test auth bypass
  },

  // Global test configuration
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:5174', // FIXED: Match actual dev server port

    // Browser context options
    trace: 'retain-on-failure', // Capture trace on failure
    screenshot: 'only-on-failure', // Screenshots on failure
    video: 'retain-on-failure', // Video recording on failure

    // Console logging - CRITICAL for debugging
    // This captures all console messages from the browser
    launchOptions: {
      // Enable browser console logging
      logger: {
        isEnabled: () => true,
        log: (name, severity, message, args) => {
          console.log(`[${severity}] ${name}: ${message}`, args);
        }
      }
    },

    // Action timeouts
    actionTimeout: 15000, // 15 seconds for individual actions
    navigationTimeout: 30000, // 30 seconds for page navigation

    // Additional browser options for debugging
    headless: false, // Show browser during test for visual debugging
    slowMo: 500, // Slow down actions for better observation
  },

  // Test projects for different browsers and viewports
  projects: [
    // ============================================
    // MOCK TESTS (Fast - Default)
    // ============================================
    {
      name: 'Mock Tests (Fast)',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /.*-real-api\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          recordVideo: {
            dir: 'test-results/videos/mock',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },

    // ============================================
    // REAL API TESTS (Smoke/Integration)
    // ============================================
    {
      name: 'Real API Tests (Smoke)',
      testMatch: /.*-real-api\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          recordVideo: {
            dir: 'test-results/videos/real-api',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },

    // ============================================
    // LEGACY PROJECTS (Optional - Comment out if not needed)
    // ============================================
    // {
    //   name: 'Mobile Safari - Touch Interface Testing',
    //   use: {
    //     ...devices['iPhone 12'],
    //     viewport: { width: 390, height: 844 },
    //     contextOptions: {
    //       recordVideo: {
    //         dir: 'test-results/videos/mobile',
    //         size: { width: 390, height: 844 }
    //       }
    //     }
    //   },
    // },

    // {
    //   name: 'Desktop Firefox - Cross-browser Validation',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1280, height: 720 },
    //     contextOptions: {
    //       recordVideo: {
    //         dir: 'test-results/videos/firefox',
    //         size: { width: 1280, height: 720 }
    //       }
    //     }
    //   },
    // },

    // {
    //   name: 'Mobile Chrome - Android Testing',
    //   use: {
    //     ...devices['Pixel 5'],
    //     viewport: { width: 393, height: 851 },
    //     contextOptions: {
    //       recordVideo: {
    //         dir: 'test-results/videos/android',
    //         size: { width: 393, height: 851 }
    //       }
    //     }
    //   },
    // },
  ],

  // Development server configuration
  webServer: {
    // CRITICAL: Use --mode test to load .env.test automatically
    // This ensures VITE_TEST_MODE=true is properly injected into the browser
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI, // Reuse in dev, fresh in CI
    timeout: 120000, // 2 minutes to start dev server
  },

  // Output directories
  outputDir: 'test-results',

  // Global setup and teardown
  // Global setup initializes test environment and logs auth bypass info
  globalSetup: './e2e-tests/global-setup.ts',

  /**
   * 🔑 AUTH BYPASS IMPLEMENTATION (Option 2: Global Setup)
   *
   * All tests automatically inherit auth bypass via custom fixture.
   *
   * Usage in tests:
   * ```typescript
   * import { test, expect } from './fixtures';
   *
   * test('my test', async ({ page }) => {
   *   // Auth bypass already active - no manual injection needed!
   * });
   * ```
   *
   * Old pattern (NO LONGER NEEDED):
   * ```typescript
   * test.beforeEach(async ({ page }) => {
   *   await page.addInitScript(() => {
   *     (window as any).__VITE_TEST_MODE__ = true; // ❌ Not needed anymore!
   *   });
   * });
   * ```
   *
   * See: docs/testing/playwright-auth-bypass-pattern.md
   * Fixture: e2e-tests/fixtures.ts
   */
});