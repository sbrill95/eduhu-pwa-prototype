/**
 * MSW Mock Handlers for E2E Tests
 *
 * These handlers intercept API calls during testing and return instant mock responses.
 * This allows tests to run quickly without real API calls.
 *
 * Mocked Endpoints:
 * - POST /api/chat - Returns mock agent suggestion
 * - POST /api/langgraph-agents/execute - Returns instant mock image (no OpenAI)
 * - GET /api/langgraph/agents/available - Returns mock agent list
 * - POST /api/chat/summary - Returns mock summary
 */

import { http, HttpResponse } from 'msw';

// Mock SVG image encoded as base64 (blue square with "TEST IMAGE" text)
const MOCK_IMAGE_SVG = 'PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIGZpbGw9IiM0Mjg1RjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRFU1QgSU1BR0U8L3RleHQ+PC9zdmc+';

export const handlers = [
  // Mock chat endpoint - returns agent suggestion for image generation
  http.post('/api/chat', async ({ request }) => {
    const body = await request.json() as { message: string; conversationId?: string };
    const message = body.message;

    console.log('[MSW MOCK] /api/chat called with message:', message);

    // Simulate delay (minimal - 100ms)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if message is requesting image generation
    const isImageRequest = message.toLowerCase().includes('bild') ||
                          message.toLowerCase().includes('erstelle') ||
                          message.toLowerCase().includes('generiere');

    if (isImageRequest) {
      return HttpResponse.json({
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
      });
    }

    // Default text response
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Das ist eine Mock-Antwort für Testzwecke.'
      },
      timestamp: new Date().toISOString()
    });
  }),

  // Mock agent execution endpoint - returns instant mock image
  http.post('/api/langgraph-agents/execute', async ({ request }) => {
    const body = await request.json() as { agentId: string; params: Record<string, unknown> };

    console.log('[MSW MOCK] /api/langgraph-agents/execute called:', body);

    // Simulate minimal delay (500ms instead of 60-90s for real DALL-E)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock IDs
    const mockLibraryId = `mock-library-${Date.now()}`;
    const mockMessageId = `mock-message-${Date.now()}`;

    return HttpResponse.json({
      success: true,
      data: {
        imageUrl: `data:image/svg+xml;base64,${MOCK_IMAGE_SVG}`,
        title: 'Test Generated Image',
        library_id: mockLibraryId,
        message_id: mockMessageId,
        metadata: {
          originalParams: body.params,
          timestamp: new Date().toISOString(),
          mockGenerated: true
        }
      }
    });
  }),

  // Mock available agents endpoint
  http.get('/api/langgraph/agents/available', () => {
    console.log('[MSW MOCK] /api/langgraph/agents/available called');

    return HttpResponse.json({
      agents: [
        {
          id: 'image-generator',
          name: 'Bild-Generator',
          description: 'Generiert Bilder mit DALL-E 3',
          category: 'creative',
          parameters: [
            {
              name: 'description',
              type: 'string',
              required: true,
              description: 'Beschreibung des zu generierenden Bildes'
            },
            {
              name: 'imageStyle',
              type: 'select',
              required: false,
              options: ['illustrative', 'realistic', 'abstract'],
              default: 'illustrative'
            }
          ]
        },
        {
          id: 'lesson-planner',
          name: 'Unterrichtsplaner',
          description: 'Erstellt strukturierte Unterrichtspläne',
          category: 'planning',
          parameters: []
        }
      ]
    });
  }),

  // Mock chat summary endpoint
  http.post('/api/chat/summary', async ({ request }) => {
    const body = await request.json() as { conversationId: string };

    console.log('[MSW MOCK] /api/chat/summary called for:', body.conversationId);

    await new Promise(resolve => setTimeout(resolve, 100));

    return HttpResponse.json({
      success: true,
      data: {
        summary: 'Mock-Zusammenfassung: Benutzer hat nach Bildgenerierung gefragt.',
        keyTopics: ['Bildgenerierung', 'Unterrichtsmaterial'],
        messageCount: 5
      },
      timestamp: new Date().toISOString()
    });
  }),
];
