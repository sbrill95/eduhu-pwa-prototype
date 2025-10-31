/**
 * Test Data Manager for E2E Tests
 *
 * Manages creation and cleanup of test data via Test Helper API.
 * Eliminates frontend/backend state mismatch issues (saved 8-15 hours in past incidents).
 *
 * Usage:
 *   const testData = new TestDataManager(request);
 *
 *   const imageId = await testData.createTestImage('user-123');
 *   // ... use in test ...
 *   await testData.cleanup(); // Automatic cleanup
 */

import { APIRequestContext } from '@playwright/test';

export interface TestImage {
  id: string;
  url: string;
  userId: string;
  name: string;
}

export interface TestChat {
  id: string;
  userId: string;
  title: string;
}

export class TestDataManager {
  private request: APIRequestContext;
  private createdResources: Array<{ type: string; id: string }> = [];
  private baseUrl: string;

  constructor(request: APIRequestContext, baseUrl: string = 'http://localhost:3006') {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  /**
   * Create test image via backend API (NOT frontend mock)
   * Ensures backend can find the image during tests
   */
  async createTestImage(userId: string, name?: string): Promise<TestImage> {
    const response = await this.request.post(`${this.baseUrl}/api/test-helpers/create-test-image`, {
      data: {
        userId,
        name: name || `Test Image ${Date.now()}`,
      },
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(
        `Failed to create test image: ${response.status()} ${response.statusText()}\n${body}`
      );
    }

    const data = await response.json();

    // Track for cleanup
    this.createdResources.push({ type: 'image', id: data.id });

    return {
      id: data.id,
      url: data.url,
      userId: data.userId || userId,
      name: data.name || name || `Test Image ${Date.now()}`,
    };
  }

  /**
   * Create test chat via backend API
   */
  async createTestChat(userId: string, title?: string): Promise<TestChat> {
    const response = await this.request.post(`${this.baseUrl}/api/test-helpers/create-test-chat`, {
      data: {
        userId,
        title: title || `Test Chat ${Date.now()}`,
      },
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(
        `Failed to create test chat: ${response.status()} ${response.statusText()}\n${body}`
      );
    }

    const data = await response.json();

    // Track for cleanup
    this.createdResources.push({ type: 'chat', id: data.id });

    return {
      id: data.id,
      userId: data.userId || userId,
      title: data.title || title || `Test Chat ${Date.now()}`,
    };
  }

  /**
   * Verify test image exists in backend
   * Use BEFORE testing to ensure data setup worked
   */
  async verifyImageExists(imageId: string): Promise<boolean> {
    const response = await this.request.get(
      `${this.baseUrl}/api/test-helpers/verify-test-data?type=image&id=${imageId}`
    );

    if (!response.ok()) {
      return false;
    }

    const data = await response.json();
    return data.exists === true;
  }

  /**
   * Cleanup ALL created resources
   * Call in test.afterEach to prevent data pollution
   */
  async cleanup(): Promise<void> {
    const errors: string[] = [];

    for (const resource of this.createdResources) {
      try {
        const response = await this.request.delete(
          `${this.baseUrl}/api/test-helpers/cleanup/${resource.type}/${resource.id}`
        );

        if (!response.ok()) {
          const body = await response.text().catch(() => '');
          errors.push(
            `Failed to delete ${resource.type} ${resource.id}: ${response.status()} ${body}`
          );
        }
      } catch (error) {
        errors.push(`Error deleting ${resource.type} ${resource.id}: ${error}`);
      }
    }

    // Clear tracked resources
    this.createdResources = [];

    // Log errors but don't throw (cleanup should be best-effort)
    if (errors.length > 0) {
      console.warn('⚠️  Test cleanup had errors:');
      errors.forEach((err) => console.warn(`  - ${err}`));
    }
  }

  /**
   * Get list of created resources (for debugging)
   */
  getCreatedResources(): Array<{ type: string; id: string }> {
    return [...this.createdResources];
  }
}

/**
 * Example usage in test file:
 *
 * import { test } from './fixtures/authBypass';
 * import { TestDataManager } from './fixtures/testData';
 *
 * test.describe('Image Editing', () => {
 *   let testData: TestDataManager;
 *
 *   test.beforeEach(async ({ request }) => {
 *     testData = new TestDataManager(request);
 *
 *     // Create test images
 *     await testData.createTestImage('test-user-123', 'Image 1');
 *     await testData.createTestImage('test-user-123', 'Image 2');
 *   });
 *
 *   test.afterEach(async () => {
 *     await testData.cleanup();
 *   });
 *
 *   test('Edit image', async ({ page }) => {
 *     // Images exist in backend ✅
 *     await page.goto('/library');
 *     // ... test editing ...
 *   });
 * });
 */
