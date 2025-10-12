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
    baseURL: 'http://localhost:5173', // Updated port

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
    {
      name: 'Desktop Chrome - Chat Agent Testing',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Enhanced console monitoring for desktop
        contextOptions: {
          recordVideo: {
            dir: 'test-results/videos/desktop',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },

    {
      name: 'Mobile Safari - Touch Interface Testing',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
        // Mobile-specific debugging
        contextOptions: {
          recordVideo: {
            dir: 'test-results/videos/mobile',
            size: { width: 390, height: 844 }
          }
        }
      },
    },

    {
      name: 'Desktop Firefox - Cross-browser Validation',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          recordVideo: {
            dir: 'test-results/videos/firefox',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },

    {
      name: 'Mobile Chrome - Android Testing',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
        contextOptions: {
          recordVideo: {
            dir: 'test-results/videos/android',
            size: { width: 393, height: 851 }
          }
        }
      },
    },
  ],

  // Development server configuration
  webServer: {
    // CRITICAL: Use --mode test to load .env.test automatically
    // This ensures VITE_TEST_MODE=true is properly injected into the browser
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI, // Reuse in dev, fresh in CI
    timeout: 120000, // 2 minutes to start dev server
  },

  // Output directories
  outputDir: 'test-results',

  // Global setup and teardown (commented out - files don't exist)
  // globalSetup: './e2e-tests/global-setup.ts',
  // globalTeardown: './e2e-tests/global-teardown.ts',
});