/**
 * E2E Test: BUG-017 - Library Chat Continuation with Context
 *
 * Tests that when a user opens an existing chat from the Library and sends
 * a follow-up message, the AI has the full context from previous messages.
 *
 * Bug: Previously, only safeLocalMessages was sent to API, which was empty
 * when loading from Library, causing AI to lose all context.
 *
 * Fix: Now uses `messages` array which combines DB + Local messages.
 */

import { test, expect } from '@playwright/test';

test.describe('BUG-017: Library Chat Continuation Context', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should maintain chat context when continuing from Library', async ({ page }) => {
    // Step 1: Navigate to Chat tab and start a new chat about a specific topic
    await page.click('[data-testid="tab-chat"]');
    await page.waitForSelector('[data-testid="chat-view"]');

    // Send first message about Photosynthesis
    const chatInput = page.locator('ion-textarea[placeholder*="Nachricht"]');
    await chatInput.fill('Erkläre mir Photosynthese in einfachen Worten.');

    const sendButton = page.locator('ion-button:has-text("Senden")');
    await sendButton.click();

    // Wait for AI response
    await page.waitForSelector('.message-assistant', { timeout: 30000 });

    // Wait a bit for the message to be saved to DB
    await page.waitForTimeout(2000);

    // Step 2: Navigate to Library
    await page.click('[data-testid="tab-library"]');
    await page.waitForSelector('[data-testid="library-view"]');

    // Wait for library to load chats
    await page.waitForTimeout(1000);

    // Step 3: Find and click on the chat we just created
    // It should be at the top (most recent)
    const chatCards = page.locator('.chat-card, [data-testid="chat-item"]').first();
    await chatCards.click();

    // Should navigate back to Chat view with the loaded session
    await page.waitForSelector('[data-testid="chat-view"]');

    // Verify previous messages are visible
    const messages = await page.locator('.message-user, .message-assistant').count();
    expect(messages).toBeGreaterThanOrEqual(2); // At least user message + AI response

    // Step 4: Send a contextual follow-up question
    await chatInput.fill('Kannst du das noch erweitern?');
    await sendButton.click();

    // Wait for AI response
    await page.waitForSelector('.message-assistant:nth-of-type(2)', { timeout: 30000 });

    // Step 5: Verify the AI response is contextual
    // The AI should understand "das" refers to Photosynthesis
    const lastResponse = page.locator('.message-assistant').last();
    const responseText = await lastResponse.textContent();

    console.log('AI Response:', responseText);

    // The response should mention Photosynthesis or related terms
    // indicating it has context from the previous conversation
    const hasContext =
      responseText?.toLowerCase().includes('photosynthese') ||
      responseText?.toLowerCase().includes('pflanze') ||
      responseText?.toLowerCase().includes('licht') ||
      responseText?.toLowerCase().includes('chlorophyll') ||
      responseText?.toLowerCase().includes('blatt');

    expect(hasContext).toBeTruthy();

    // Step 6: Check console logs for verification
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[BUG-017 FIX]')) {
        logs.push(msg.text());
      }
    });

    // Send another message to trigger the log
    await chatInput.fill('Danke!');
    await sendButton.click();

    // Wait for the log
    await page.waitForTimeout(1000);

    // Verify the log shows DB messages were included
    const contextLog = logs.find(log => log.includes('dbMessages'));
    console.log('Context Log:', contextLog);

    // Should show at least 2 DB messages (user + assistant from first exchange)
    expect(contextLog).toBeTruthy();
  });

  test('should work correctly with new chats (regression test)', async ({ page }) => {
    // Navigate to Chat tab
    await page.click('[data-testid="tab-chat"]');
    await page.waitForSelector('[data-testid="chat-view"]');

    // Send a message in a new chat
    const chatInput = page.locator('ion-textarea[placeholder*="Nachricht"]');
    await chatInput.fill('Hallo, wie geht es dir?');

    const sendButton = page.locator('ion-button:has-text("Senden")');
    await sendButton.click();

    // Wait for AI response
    await page.waitForSelector('.message-assistant', { timeout: 30000 });

    // Verify the message was sent and response received
    const messages = await page.locator('.message-user, .message-assistant').count();
    expect(messages).toBeGreaterThanOrEqual(2);

    // Send a follow-up
    await chatInput.fill('Was ist deine Aufgabe?');
    await sendButton.click();

    // Wait for second AI response
    await page.waitForSelector('.message-assistant:nth-of-type(2)', { timeout: 30000 });

    // Verify second response is contextual
    const lastResponse = page.locator('.message-assistant').last();
    const responseText = await lastResponse.textContent();

    console.log('AI Response (New Chat):', responseText);

    // Should mention being a teacher assistant or similar
    const hasContext =
      responseText?.toLowerCase().includes('lehrer') ||
      responseText?.toLowerCase().includes('assistent') ||
      responseText?.toLowerCase().includes('helfen');

    expect(hasContext).toBeTruthy();
  });

  test('should handle long chat history correctly', async ({ page }) => {
    // Navigate to Chat tab
    await page.click('[data-testid="tab-chat"]');
    await page.waitForSelector('[data-testid="chat-view"]');

    const chatInput = page.locator('ion-textarea[placeholder*="Nachricht"]');
    const sendButton = page.locator('ion-button:has-text("Senden")');

    // Send multiple messages to create a longer history
    const messages = [
      'Was ist Mathematik?',
      'Erkläre Addition',
      'Was ist 5 + 3?',
      'Warum ist das so?',
    ];

    for (const msg of messages) {
      await chatInput.fill(msg);
      await sendButton.click();

      // Wait for AI response
      await page.waitForTimeout(3000);
    }

    // Wait for DB save
    await page.waitForTimeout(2000);

    // Navigate to Library
    await page.click('[data-testid="tab-library"]');
    await page.waitForTimeout(1000);

    // Load the chat
    await page.locator('.chat-card, [data-testid="chat-item"]').first().click();
    await page.waitForSelector('[data-testid="chat-view"]');

    // Send contextual follow-up
    await chatInput.fill('Kannst du das Beispiel erweitern?');
    await sendButton.click();

    // Wait for response
    await page.waitForSelector('.message-assistant:last-child', { timeout: 30000 });

    // Verify the response is contextual (mentions addition, numbers, or math)
    const lastResponse = page.locator('.message-assistant').last();
    const responseText = await lastResponse.textContent();

    console.log('AI Response (Long History):', responseText);

    const hasContext =
      responseText?.toLowerCase().includes('addition') ||
      responseText?.toLowerCase().includes('mathematik') ||
      /\d+\s*\+\s*\d+/.test(responseText || '') || // matches "X + Y"
      responseText?.toLowerCase().includes('rechnen');

    expect(hasContext).toBeTruthy();
  });
});
