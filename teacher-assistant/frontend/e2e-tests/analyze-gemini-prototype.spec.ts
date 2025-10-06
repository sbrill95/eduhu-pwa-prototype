import { test } from '@playwright/test';

test('Analyze Gemini Prototype in detail', async ({ page, context }) => {
  console.log('🔍 Analyzing Gemini prototype in detail...');

  // Accept cookies/consent if needed
  try {
    await page.goto('https://gemini.google.com/share/bacf93adef3e', {
      timeout: 30000,
      waitUntil: 'networkidle'
    });

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Try to accept consent if present
    const consentButton = page.locator('button:has-text("Accept"), button:has-text("Akzeptieren"), button:has-text("I agree")');
    if (await consentButton.count() > 0) {
      console.log('📝 Accepting consent...');
      await consentButton.first().click();
      await page.waitForTimeout(3000);
    }

    // Take full page screenshot
    await page.screenshot({
      path: 'gemini-prototype-full.png',
      fullPage: true
    });

    console.log('✅ Full page screenshot saved');

    // Take viewport screenshot (above the fold)
    await page.screenshot({
      path: 'gemini-prototype-viewport.png',
      fullPage: false
    });

    console.log('✅ Viewport screenshot saved');

    // Analyze structure
    const pageStructure = await page.evaluate(() => {
      // Find greeting
      const possibleGreeting = Array.from(document.querySelectorAll('h1, h2, h3, [class*="greeting"], [class*="hello"]'))
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0 && text.length < 100);

      // Find prompt suggestions
      const promptElements = Array.from(document.querySelectorAll('[class*="prompt"], [class*="suggestion"], button, [role="button"]'))
        .map(el => ({
          text: el.textContent?.trim(),
          classes: el.className,
          tag: el.tagName
        }))
        .filter(item => item.text && item.text.length > 10 && item.text.length < 200)
        .slice(0, 10);

      // Find calendar elements
      const calendarElements = Array.from(document.querySelectorAll('[class*="calendar"], [class*="event"], [class*="schedule"]'))
        .map(el => ({
          text: el.textContent?.trim(),
          classes: el.className,
          tag: el.tagName
        }))
        .slice(0, 5);

      // Get colors
      const body = document.body;
      const header = document.querySelector('header, [role="banner"], nav');

      return {
        greeting: possibleGreeting,
        prompts: promptElements,
        calendar: calendarElements,
        bodyBg: window.getComputedStyle(body).backgroundColor,
        headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
      };
    });

    console.log('📊 Page Structure:', JSON.stringify(pageStructure, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  }
});
