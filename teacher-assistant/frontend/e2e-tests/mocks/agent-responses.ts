/**
 * Mock Agent Responses for E2E Testing
 *
 * Provides mock backend responses for testing agent modal workflows
 * without requiring a live backend server.
 */

export const mockAgentSuggestion = {
  role: 'assistant',
  content: 'Ich kann dir dabei helfen, ein maßgeschneidertes Arbeitsmaterial zu erstellen. Möchtest du die Bildgenerierung starten?',
  agentSuggestion: {
    agentType: 'image-generation',
    reasoning: 'Basierend auf deiner Anfrage scheint ein visuelles Material am besten geeignet.',
    prefillData: {
      theme: 'Photosynthese für Klasse 7',
      learningGroup: 'Klasse 7a'
    }
  }
};

export const mockImageGenerationProgress = [
  {
    type: 'progress',
    step: 'analyzing',
    message: 'Analysiere deine Anfrage...',
    progress: 25
  },
  {
    type: 'progress',
    step: 'generating',
    message: 'Generiere pädagogisch wertvolles Bild...',
    progress: 50
  },
  {
    type: 'progress',
    step: 'optimizing',
    message: 'Optimiere für Lerngruppe...',
    progress: 75
  },
  {
    type: 'progress',
    step: 'complete',
    message: 'Fertig!',
    progress: 100
  }
];

export const mockImageGenerationResult = {
  type: 'result',
  data: {
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0QzRTRFNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNGQjY1NDIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QaG90b3N5bnRoZXNlPC90ZXh0Pjwvc3ZnPg==',
    title: 'Photosynthese Schaubild'
  },
  metadata: {
    theme: 'Photosynthese für Klasse 7',
    learningGroup: 'Klasse 7a',
    dazSupport: false,
    learningDifficulties: true,
    generatedAt: new Date().toISOString()
  }
};

/**
 * Setup mock API interceptor for Playwright tests
 */
export async function setupMockAgentAPI(page: any) {
  // Intercept chat API calls
  await page.route('**/api/chat', async (route: any) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Check if message contains trigger word for agent suggestion
    if (postData.message?.toLowerCase().includes('bild') ||
        postData.message?.toLowerCase().includes('material')) {

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: mockAgentSuggestion
        })
      });
    } else {
      // Normal chat response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: {
            role: 'assistant',
            content: 'Wie kann ich dir helfen?'
          }
        })
      });
    }
  });

  // Intercept agent execution API
  await page.route('**/api/agents/execute', async (route: any) => {
    const request = route.request();

    // Simulate SSE stream with delays
    const events = [
      ...mockImageGenerationProgress,
      mockImageGenerationResult
    ];

    // For E2E tests, return final result immediately
    // (SSE streaming is hard to test in Playwright)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockImageGenerationResult)
    });
  });

  console.log('[E2E Mock] Agent API interceptors configured');
}

/**
 * Trigger agent suggestion in chat
 */
export async function triggerAgentSuggestion(page: any) {
  // Navigate to chat
  await page.click('ion-tab-button[tab="chat"]');
  await page.waitForTimeout(500);

  // Type message that triggers agent suggestion
  const chatInput = page.locator('textarea[placeholder*="Nachricht"]');
  await chatInput.fill('Ich brauche ein Bild zur Photosynthese für meine 7. Klasse');

  // Send message
  const sendButton = page.locator('ion-button:has(ion-icon)').last();
  await sendButton.click();

  // Wait for agent suggestion to appear
  await page.waitForTimeout(1000);
}

/**
 * Fill Gemini form with test data
 */
export async function fillGeminiForm(page: any, options = {}) {
  const {
    theme = 'Photosynthese für Klasse 7',
    learningGroup = 'Klasse 7a',
    dazSupport = false,
    learningDifficulties = true
  } = options;

  // Wait for modal to be visible
  const modal = page.locator('ion-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  // Fill theme (should be pre-filled, but we can change it)
  const themeInput = page.locator('textarea[placeholder*="Thema"]');
  await themeInput.fill(theme);

  // Select learning group
  if (learningGroup !== 'Klasse 8a') {
    const learningGroupSelect = page.locator('select, ion-select').first();
    await learningGroupSelect.click();
    await page.click(`text="${learningGroup}"`);
  }

  // Toggle DaZ support
  if (dazSupport) {
    const dazToggle = page.locator('ion-toggle').first();
    await dazToggle.click();
  }

  // Toggle learning difficulties
  if (learningDifficulties) {
    const learningDiffToggle = page.locator('ion-toggle').last();
    const isChecked = await learningDiffToggle.getAttribute('aria-checked');
    if (isChecked === 'false') {
      await learningDiffToggle.click();
    }
  }

  // Submit form
  const submitButton = page.locator('button:has-text("Idee entfalten")');
  await submitButton.click();
}

/**
 * Wait for result view and verify buttons
 */
export async function verifyResultView(page: any) {
  // Wait for result view
  await page.waitForSelector('text=In Bibliothek gespeichert', { timeout: 10000 });

  // Verify buttons exist
  const shareButton = page.locator('button:has-text("Teilen")');
  await shareButton.waitFor({ state: 'visible' });

  const continueButton = page.locator('button:has-text("Weiter im Chat")');
  await continueButton.waitFor({ state: 'visible' });

  return { shareButton, continueButton };
}

/**
 * Trigger and verify animation
 */
export async function verifyAnimation(page: any) {
  const { continueButton } = await verifyResultView(page);

  // Click continue button to trigger animation
  await continueButton.click();

  // Wait for animation to start
  await page.waitForTimeout(100);

  // Check if flying-image element was created
  const flyingImage = page.locator('.flying-image');
  const exists = await flyingImage.count() > 0;

  // Wait for animation to complete (600ms + buffer)
  await page.waitForTimeout(800);

  // Modal should be closed
  const modal = page.locator('ion-modal[is-open="true"]');
  const modalVisible = await modal.count() > 0;

  return { animationTriggered: exists, modalClosed: !modalVisible };
}
