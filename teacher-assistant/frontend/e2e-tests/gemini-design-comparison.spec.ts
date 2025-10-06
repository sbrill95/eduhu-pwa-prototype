import { test, expect } from '@playwright/test';

test.describe('Gemini Design Language - Visual Comparison', () => {
  test('Screenshot Gemini Prototype for reference', async ({ page }) => {
    console.log('📸 Taking screenshot of Gemini prototype...');

    await page.goto('https://gemini.google.com/share/bacf93adef3e', {
      timeout: 30000,
      waitUntil: 'networkidle'
    });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Take full page screenshot
    await page.screenshot({
      path: 'gemini-prototype-reference.png',
      fullPage: true
    });

    console.log('✅ Gemini prototype screenshot saved');
  });

  test('Screenshot Teacher Assistant - Home View', async ({ page }) => {
    console.log('📸 Taking screenshot of Teacher Assistant Home...');

    await page.goto('http://localhost:5173/', {
      timeout: 20000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'teacher-assistant-home.png',
      fullPage: true
    });

    console.log('✅ Home view screenshot saved');
  });

  test('Screenshot Teacher Assistant - Chat View', async ({ page }) => {
    console.log('📸 Taking screenshot of Teacher Assistant Chat...');

    await page.goto('http://localhost:5173/', {
      timeout: 20000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(2000);

    // Click chat tab (try multiple selectors)
    try {
      await page.click('text=Chat', { timeout: 5000 });
    } catch {
      try {
        await page.click('[tab="chat"]', { timeout: 5000 });
      } catch {
        console.log('⚠️ Could not click Chat tab, using URL navigation');
        await page.goto('http://localhost:5173/#/chat');
      }
    }

    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'teacher-assistant-chat.png',
      fullPage: true
    });

    console.log('✅ Chat view screenshot saved');
  });

  test('Screenshot Teacher Assistant - Chat Bubbles Detail', async ({ page }) => {
    console.log('📸 Taking detailed screenshot of Chat bubbles...');

    await page.goto('http://localhost:5173/', {
      timeout: 20000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(1000);

    // Navigate to chat
    try {
      await page.click('text=Chat', { timeout: 5000 });
    } catch {
      await page.goto('http://localhost:5173/#/chat');
    }

    await page.waitForTimeout(2000);

    // Take screenshot of chat area
    await page.screenshot({
      path: 'teacher-assistant-chat-detail.png',
      fullPage: false
    });

    console.log('✅ Chat detail screenshot saved');
  });

  test('Screenshot Teacher Assistant - Library View', async ({ page }) => {
    console.log('📸 Taking screenshot of Teacher Assistant Library...');

    await page.goto('http://localhost:5173/', {
      timeout: 20000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(1000);

    // Navigate to library
    try {
      await page.click('text=Library', { timeout: 5000 });
    } catch {
      await page.goto('http://localhost:5173/#/library');
    }

    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'teacher-assistant-library.png',
      fullPage: true
    });

    console.log('✅ Library view screenshot saved');
  });

  test('Extract design elements from screenshots', async ({ page }) => {
    console.log('🔍 Analyzing design elements...');

    await page.goto('http://localhost:5173/', {
      timeout: 20000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(2000);

    // Get color information from elements
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyles = window.getComputedStyle(body);

      return {
        fontFamily: computedStyles.fontFamily,
        backgroundColor: computedStyles.backgroundColor,
      };
    });

    console.log('📝 Body Styles:', bodyStyles);

    // Try to find prompt tiles and get their colors
    const tileColors = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll('[class*="tile"], [class*="card"]'));

      if (tiles.length === 0) return null;

      return tiles.slice(0, 3).map(tile => {
        const styles = window.getComputedStyle(tile as Element);
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          borderLeftColor: styles.borderLeftColor,
        };
      });
    });

    console.log('🎨 Tile Colors:', tileColors);

    // Check tab bar colors
    const tabBarColors = await page.evaluate(() => {
      const tabBar = document.querySelector('ion-tab-bar');
      if (!tabBar) return null;

      const styles = window.getComputedStyle(tabBar);
      const activeTab = tabBar.querySelector('.tab-selected, [aria-selected="true"]');

      return {
        tabBarBackground: styles.backgroundColor,
        activeTabColor: activeTab ? window.getComputedStyle(activeTab).color : null,
      };
    });

    console.log('📱 Tab Bar Colors:', tabBarColors);

    console.log('✅ Design element analysis complete');
  });
});
