/**
 * MSW Setup for Playwright E2E Tests
 *
 * This module provides a function to start MSW (Mock Service Worker) in the browser context
 * during Playwright tests. This allows us to intercept and mock API calls for fast testing.
 *
 * Usage in tests:
 * ```typescript
 * import { setupMockServer } from './mocks/setup';
 *
 * test.beforeEach(async ({ page }) => {
 *   await setupMockServer(page);
 * });
 * ```
 */

import { Page } from '@playwright/test';
import { handlers } from './handlers';

/**
 * Sets up MSW mock server in the browser context
 *
 * This function:
 * 1. Injects MSW into the browser page
 * 2. Registers our mock handlers
 * 3. Starts the service worker to intercept requests
 *
 * @param page - Playwright page instance
 */
export async function setupMockServer(page: Page): Promise<void> {
  console.log('[MSW SETUP] Initializing mock server in browser context...');

  // Inject MSW into the page context before any navigation
  await page.addInitScript(() => {
    // MSW will be available globally in the browser
    console.log('[MSW] Browser context initialized');
  });

  // Navigate to the page first so we have a context
  // This is typically done in beforeEach, but we ensure it here
  if (!page.url() || page.url() === 'about:blank') {
    await page.goto('/');
  }

  // Wait for page to be ready
  await page.waitForLoadState('domcontentloaded');

  // Inject MSW library and handlers into the browser context
  await page.addScriptTag({
    content: `
      // MSW handlers will be set up via route interception instead
      window.__MSW_ENABLED__ = true;
      console.log('[MSW] Mock mode enabled in browser');
    `
  });

  // Instead of using MSW's service worker (which has compatibility issues with Playwright),
  // we'll use Playwright's built-in route interception
  console.log('[MSW SETUP] Setting up Playwright route interception...');

  // Mock: POST /api/chat
  await page.route('**/api/chat', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      return route.continue();
    }

    const postData = request.postDataJSON();
    // Extract the last user message from the messages array
    const messages = postData?.messages || [];
    const lastMessage = messages[messages.length - 1];
    const message = lastMessage?.content || '';

    console.log('[MOCK] POST /api/chat ->', { messageCount: messages.length, lastMessage: message });

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const isImageRequest = message.toLowerCase().includes('bild') ||
                          message.toLowerCase().includes('erstelle') ||
                          message.toLowerCase().includes('generiere');

    if (isImageRequest) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            message: 'Ich kann ein Bild für Sie erstellen.',
            agentSuggestion: {
              agentType: 'image-generation',
              reasoning: 'Du hast nach einem Bild gefragt. Ich kann dir helfen, eines zu erstellen!',
              prefillData: {
                description: message.replace(/erstelle ein bild (zur?|vom?|von)/i, '').trim(),
                imageStyle: 'illustrative'
              }
            }
          },
          timestamp: new Date().toISOString()
        })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            message: 'Das ist eine Mock-Antwort für Testzwecke.'
          },
          timestamp: new Date().toISOString()
        })
      });
    }
  });

  // Mock: POST /api/langgraph/agents/execute
  await page.route('**/api/langgraph/agents/execute', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      return route.continue();
    }

    const postData = request.postDataJSON();
    console.log('[MOCK] POST /api/langgraph/agents/execute ->', postData);

    // Simulate minimal delay (500ms instead of 60-90s)
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockExecutionId = `mock-exec-${Date.now()}`;
    const mockLibraryId = `mock-library-${Date.now()}`;
    const mockMessageId = `mock-message-${Date.now()}`;
    const MOCK_IMAGE_SVG = 'PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIGZpbGw9IiM0Mjg1RjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRFU1QgSU1BR0U8L3RleHQ+PC9zdmc+';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          executionId: mockExecutionId,
          agentId: postData?.agentId || 'langgraph-image-generation',
          status: 'completed',
          message: 'Bild wurde erfolgreich erstellt',
          image_url: `data:image/svg+xml;base64,${MOCK_IMAGE_SVG}`,
          title: 'Test Generated Image - Photosynthese Klasse 7',
          revised_prompt: 'Educational illustration of photosynthesis for grade 7',
          library_id: mockLibraryId,
          message_id: mockMessageId
        }
      })
    });
  });

  // Mock: GET /api/langgraph/agents/available
  await page.route('**/api/langgraph/agents/available', async (route) => {
    const request = route.request();
    if (request.method() !== 'GET') {
      return route.continue();
    }

    console.log('[MOCK] GET /api/langgraph/agents/available');

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          agents: [
            {
              id: 'langgraph-image-generation',
              name: 'Erweiterte Bildgenerierung',
              description: 'Erstellt hochwertige Bilder für den Unterricht mit KI-basierter Bildgenerierung',
              keywords: ['bild', 'erstellen', 'generieren', 'zeichnen', 'illustration', 'grafik', 'visualisierung', 'poster', 'arbeitsblatt'],
              capabilities: ['image_generation', 'educational_content'],
              isAvailable: true,
              usageLimit: {
                monthly: 10,
                current: 0
              }
            }
          ],
          count: 1
        },
        timestamp: new Date().toISOString()
      })
    });
  });

  // Mock: POST /api/chat/summary
  await page.route('**/api/chat/summary', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      return route.continue();
    }

    const postData = request.postDataJSON();
    console.log('[MOCK] POST /api/chat/summary ->', postData);

    await new Promise(resolve => setTimeout(resolve, 100));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          summary: 'Mock-Zusammenfassung: Benutzer hat nach Bildgenerierung gefragt.',
          keyTopics: ['Bildgenerierung', 'Unterrichtsmaterial'],
          messageCount: 5
        },
        timestamp: new Date().toISOString()
      })
    });
  });

  console.log('[MSW SETUP] Mock server ready! All API calls will be intercepted.');
}
