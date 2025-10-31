/**
 * Simple Visual Capture Test
 * Date: 2025-10-12
 * Purpose: Basic screenshot capture of app state
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = 'C:/Users/steff/Desktop/eduhu-pwa-prototype/docs/testing/screenshots/2025-10-12/bugs';

test.describe('Simple Visual Capture', () => {

  test('Capture initial app state', async ({ page }) => {
    console.log('📸 Capturing initial app state');

    // Navigate to app
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/app-01-initial-load.png`,
      fullPage: true
    });

    // Get page HTML structure
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('📋 Page structure captured');

    // Look for tab buttons
    const tabButtons = await page.locator('ion-tab-button').count();
    console.log(`🔍 Found ${tabButtons} ion-tab-buttons`);

    // Alternative selectors
    const tabs = await page.locator('[role="tab"]').count();
    console.log(`🔍 Found ${tabs} [role="tab"] elements`);

    // Check for any buttons
    const allButtons = await page.locator('button').count();
    console.log(`🔘 Found ${allButtons} button elements`);

    // Check for Ionic components
    const ionApp = await page.locator('ion-app').count();
    console.log(`📱 Found ${ionApp} ion-app elements`);

    // Take screenshot with console open
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/app-02-with-structure.png`,
      fullPage: true
    });
  });

  test('Capture chat tab if accessible', async ({ page }) => {
    console.log('📸 Attempting to capture chat view');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Try multiple methods to access chat
    try {
      // Method 1: Direct URL navigation
      await page.goto(`${FRONTEND_URL}/chat`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/chat-01-direct-url.png`,
        fullPage: true
      });

    } catch (error) {
      console.log('⚠️ Could not navigate to chat via URL');
    }

    // Try to find chat elements
    const chatElements = await page.locator('[id*="chat"], [class*="chat"]').count();
    console.log(`💬 Found ${chatElements} chat-related elements`);
  });

  test('Capture library tab if accessible', async ({ page }) => {
    console.log('📸 Attempting to capture library view');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Try direct URL navigation
    try {
      await page.goto(`${FRONTEND_URL}/library`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/library-01-direct-url.png`,
        fullPage: true
      });

      // Look for images
      const images = await page.locator('img').count();
      console.log(`🖼️ Found ${images} img elements in library`);

      const ionImages = await page.locator('ion-img').count();
      console.log(`🖼️ Found ${ionImages} ion-img elements in library`);

    } catch (error) {
      console.log('⚠️ Could not navigate to library via URL');
    }
  });

  test('Capture all available views', async ({ page }) => {
    console.log('📸 Capturing all views systematically');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Get all navigation items
    const navItems = await page.locator('a, button, ion-tab-button, [role="tab"]').all();
    console.log(`🔍 Found ${navItems.length} potential navigation items`);

    // Try common routes
    const routes = ['/', '/chat', '/library', '/settings'];

    for (const route of routes) {
      try {
        await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle', timeout: 5000 });
        await page.waitForTimeout(2000);

        const routeName = route === '/' ? 'home' : route.substring(1);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/route-${routeName}.png`,
          fullPage: true
        });

        console.log(`✅ Captured route: ${route}`);

      } catch (error) {
        console.log(`❌ Could not capture route: ${route}`);
      }
    }
  });

  test('Inspect DOM for modal and button selectors', async ({ page }) => {
    console.log('🔍 Inspecting DOM structure for debugging');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Get comprehensive DOM info
    const domInfo = await page.evaluate(() => {
      const info = {
        ionComponents: [] as string[],
        buttons: [] as string[],
        links: [] as string[],
        modals: [] as string[],
        images: [] as string[]
      };

      // Find all Ionic components
      document.querySelectorAll('[class*="ion-"]').forEach(el => {
        info.ionComponents.push(el.tagName.toLowerCase());
      });

      // Find all buttons
      document.querySelectorAll('button, ion-button').forEach(el => {
        const text = el.textContent?.trim() || '';
        const classes = el.className || '';
        info.buttons.push(`${el.tagName}: "${text}" [${classes}]`);
      });

      // Find all links
      document.querySelectorAll('a').forEach(el => {
        const href = el.getAttribute('href') || '';
        const text = el.textContent?.trim() || '';
        info.links.push(`${href}: "${text}"`);
      });

      // Find modals
      document.querySelectorAll('ion-modal, [role="dialog"]').forEach(el => {
        info.modals.push(el.outerHTML.substring(0, 200));
      });

      // Find images
      document.querySelectorAll('img, ion-img').forEach(el => {
        const src = el.getAttribute('src') || '';
        info.images.push(src);
      });

      return info;
    });

    console.log('📊 DOM Analysis:');
    console.log(`  Ionic Components: ${domInfo.ionComponents.length}`);
    console.log(`  Buttons: ${domInfo.buttons.length}`);
    console.log(`  Links: ${domInfo.links.length}`);
    console.log(`  Modals: ${domInfo.modals.length}`);
    console.log(`  Images: ${domInfo.images.length}`);

    console.log('\n🔘 Button Details:');
    domInfo.buttons.slice(0, 10).forEach(btn => console.log(`  ${btn}`));

    console.log('\n🔗 Link Details:');
    domInfo.links.slice(0, 10).forEach(link => console.log(`  ${link}`));
  });
});
