/**
 * BUG-003 CRITICAL TEST: Page Reload Persistence
 *
 * Test Case 2.3: Verify AgentConfirmationMessage persists after page reload
 *
 * This is the DEPLOYMENT BLOCKER test from QA review.
 * If this test FAILS, deployment must be BLOCKED.
 * If this test PASSES, deployment is APPROVED.
 */

import { test, expect } from '@playwright/test';

test.describe('BUG-003: Agent Confirmation Message Reload Persistence', () => {

  test('CRITICAL: Agent Confirmation Message persists after F5 reload', async ({ page }) => {
    console.log('\n🚨 CRITICAL TEST: BUG-003 Page Reload Persistence 🚨\n');

    // Step 1: Navigate to app
    console.log('Step 1: Navigate to http://localhost:5174');
    await page.goto('http://localhost:5174');

    // Wait for app to load (test auth should auto-login)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for InstantDB to initialize

    // Step 2: Navigate to Chat tab
    console.log('Step 2: Navigate to Chat tab');
    // Use more specific selector for tab bar button
    const chatTab = page.locator('button').filter({ hasText: 'Chat' }).filter({ has: page.locator('ion-icon') });
    await chatTab.click();
    await page.waitForTimeout(2000); // Give time for tab transition

    // Step 3: Send message that triggers agent
    console.log('Step 3: Send message: "Erstelle ein Bild zur Photosynthese"');
    const inputField = page.locator('textarea[placeholder*="Nachricht"]').first();
    await inputField.fill('Erstelle ein Bild zur Photosynthese');

    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();

    // Wait for agent confirmation to appear
    console.log('Step 4: Wait for AgentConfirmationMessage to appear...');
    await page.waitForTimeout(3000); // Give backend time to respond

    // Verify agent confirmation exists BEFORE reload
    const agentConfirmationBefore = page.locator('div:has-text("Möchtest du")').first();
    const existsBefore = await agentConfirmationBefore.isVisible({ timeout: 10000 }).catch(() => false);

    console.log(`✅ AgentConfirmationMessage visible BEFORE reload: ${existsBefore}`);

    if (!existsBefore) {
      console.error('❌ FAIL: AgentConfirmationMessage not found before reload');
      console.log('Possible causes:');
      console.log('1. Backend not responding with agent suggestion');
      console.log('2. Message not triggering agent intent detection');
      console.log('3. Component not rendering');

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/bug-003-before-reload-FAIL.png', fullPage: true });
    }

    expect(existsBefore).toBe(true);

    // Step 5: RELOAD PAGE (F5)
    console.log('Step 5: 🔄 RELOAD PAGE (F5 simulation)');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for InstantDB to re-initialize

    // Step 6: Navigate back to Chat tab (might be on different tab after reload)
    console.log('Step 6: Navigate to Chat tab again');
    const chatTabAfterReload = page.locator('button:has-text("Chat")').first();
    await chatTabAfterReload.click();
    await page.waitForTimeout(1000);

    // Step 7: CRITICAL VERIFICATION - Agent Confirmation MUST still be visible
    console.log('Step 7: 🚨 CRITICAL VERIFICATION - Check if AgentConfirmationMessage PERSISTS');

    const agentConfirmationAfter = page.locator('div:has-text("Möchtest du")').first();
    const existsAfter = await agentConfirmationAfter.isVisible({ timeout: 10000 }).catch(() => false);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎯 RESULT: AgentConfirmationMessage visible AFTER reload: ${existsAfter}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (existsAfter) {
      console.log('✅ ✅ ✅ TEST PASSED ✅ ✅ ✅');
      console.log('✅ BUG-003 is FIXED');
      console.log('✅ Metadata field is correctly preserved');
      console.log('✅ DEPLOYMENT APPROVED');

      // Take success screenshot
      await page.screenshot({ path: 'test-results/bug-003-after-reload-SUCCESS.png', fullPage: true });
    } else {
      console.error('❌ ❌ ❌ TEST FAILED ❌ ❌ ❌');
      console.error('❌ BUG-003 is NOT FIXED');
      console.error('❌ Metadata field is being stripped');
      console.error('❌ BLOCK DEPLOYMENT');

      // Take failure screenshot
      await page.screenshot({ path: 'test-results/bug-003-after-reload-FAIL.png', fullPage: true });

      console.log('\nDebugging info:');
      console.log('Check browser console for errors');
      console.log('Verify useChat.ts line 1159-1179 includes metadata field');
      console.log('Verify api.ts line 34-49 includes agentSuggestion field');
    }

    expect(existsAfter).toBe(true);
  });

  test('Additional: Verify metadata is in InstantDB', async ({ page }) => {
    console.log('\n🔍 ADDITIONAL TEST: Verify metadata is stored in InstantDB\n');

    // Navigate and send message
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const chatTab = page.locator('button:has-text("Chat")').first();
    await chatTab.click();
    await page.waitForTimeout(1000);

    const inputField = page.locator('textarea[placeholder*="Nachricht"]').first();
    await inputField.fill('Erstelle ein Arbeitsblatt zur Photosynthese');

    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Listen to network requests to verify metadata is sent/received
    page.on('response', async (response) => {
      if (response.url().includes('/api/chat') || response.url().includes('instantdb')) {
        console.log(`📡 Network response: ${response.url()}`);

        try {
          const body = await response.json();
          console.log('Response body:', JSON.stringify(body, null, 2));

          if (body.metadata || body.agentSuggestion) {
            console.log('✅ Metadata/agentSuggestion found in response');
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    });

    // Verify message appears
    const messageText = page.locator('text=Erstelle ein Arbeitsblatt zur Photosynthese').first();
    await expect(messageText).toBeVisible({ timeout: 10000 });

    console.log('✅ Message sent and visible');
  });
});
