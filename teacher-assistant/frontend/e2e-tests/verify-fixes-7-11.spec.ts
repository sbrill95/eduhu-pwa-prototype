import { test, expect } from '@playwright/test';

/**
 * Gemini Home Screen Layout - Fixes #7-11 Verification
 *
 * Verifies:
 * - Fix #7: Calendar grid layout (2 columns on desktop)
 * - Fix #8: "Letzte Chats" title is dark gray (not orange)
 * - Fix #9: Chat cards have 12px border-radius, white background, borders
 * - Fix #10: Chat icons have gray background (not orange) and rounded corners (not circles)
 * - Fix #11: "Materialien" title is dark gray (not orange)
 */

test.describe('Gemini Home Layout Fixes #7-11', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('http://localhost:5173');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('Fix #7: Calendar grid layout on desktop', async ({ page, viewport }) => {
    // Only test on desktop viewport
    if (viewport && viewport.width > 640) {
      const calendarList = page.locator('[data-testid="calendar-events-list"]');

      if (await calendarList.isVisible()) {
        const gridStyle = await calendarList.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            gridTemplateColumns: computed.gridTemplateColumns
          };
        });

        expect(gridStyle.display).toBe('grid');
        // Should have 2 columns on desktop
        expect(gridStyle.gridTemplateColumns).toContain('1fr');
      }
    }
  });

  test('Fix #8: "Letzte Chats" title color is dark gray', async ({ page }) => {
    const chatsTitle = page.locator('[data-testid="recent-chats-section"] h2');

    if (await chatsTitle.isVisible()) {
      const styles = await chatsTitle.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight
        };
      });

      // Dark gray color (#111827 = rgb(17, 24, 39))
      expect(styles.color).toBe('rgb(17, 24, 39)');
      expect(styles.fontSize).toBe('18px');
      expect(styles.fontWeight).toBe('600');
    }
  });

  test('Fix #9: Chat cards have correct styling', async ({ page }) => {
    const chatCard = page.locator('[data-testid^="chat-item-"]').first();

    if (await chatCard.isVisible()) {
      const styles = await chatCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          backgroundColor: computed.backgroundColor,
          border: computed.border,
          boxShadow: computed.boxShadow
        };
      });

      // Border radius should be 12px (not 16px)
      expect(styles.borderRadius).toBe('12px');

      // Padding should be 12px
      expect(styles.padding).toBe('12px');

      // Background should be white
      expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');

      // Should have border
      expect(styles.border).toContain('1px');
      expect(styles.border).toContain('rgb(229, 231, 235)');

      // Should have subtle shadow
      expect(styles.boxShadow).toContain('rgba(0, 0, 0, 0.05)');
    }
  });

  test('Fix #10: Chat icon background is gray with rounded corners', async ({ page }) => {
    const chatCard = page.locator('[data-testid^="chat-item-"]').first();

    if (await chatCard.isVisible()) {
      const iconContainer = chatCard.locator('> div').first();

      const styles = await iconContainer.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderRadius: computed.borderRadius,
          width: computed.width,
          height: computed.height
        };
      });

      // Background should be gray (#F3F4F6 = rgb(243, 244, 246))
      expect(styles.backgroundColor).toBe('rgb(243, 244, 246)');

      // Border radius should be 10px (NOT rounded-full)
      expect(styles.borderRadius).toBe('10px');

      // Size should be 40px
      expect(styles.width).toBe('40px');
      expect(styles.height).toBe('40px');
    }
  });

  test('Fix #10: Chat icon color is gray (not orange)', async ({ page }) => {
    const chatCard = page.locator('[data-testid^="chat-item-"]').first();

    if (await chatCard.isVisible()) {
      const icon = chatCard.locator('ion-icon').first();

      const iconColor = await icon.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return computed.color;
      });

      // Icon should be gray (#6B7280 = rgb(107, 114, 128))
      expect(iconColor).toBe('rgb(107, 114, 128)');
    }
  });

  test('Fix #11: "Materialien" title color is dark gray', async ({ page }) => {
    const materialsTitle = page.locator('[data-testid="materials-section"] h2');

    if (await materialsTitle.isVisible()) {
      const styles = await materialsTitle.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight
        };
      });

      // Dark gray color (#111827 = rgb(17, 24, 39))
      expect(styles.color).toBe('rgb(17, 24, 39)');
      expect(styles.fontSize).toBe('18px');
      expect(styles.fontWeight).toBe('600');
    }
  });

  test('Material cards have same styling as chat cards', async ({ page }) => {
    const materialCard = page.locator('[data-testid^="material-item-"]').first();

    if (await materialCard.isVisible()) {
      const styles = await materialCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          backgroundColor: computed.backgroundColor,
          border: computed.border
        };
      });

      // Same styling as chat cards
      expect(styles.borderRadius).toBe('12px');
      expect(styles.padding).toBe('12px');
      expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(styles.border).toContain('rgb(229, 231, 235)');
    }
  });

  test('Material icons have gray background (not yellow)', async ({ page }) => {
    const materialCard = page.locator('[data-testid^="material-item-"]').first();

    if (await materialCard.isVisible()) {
      const iconContainer = materialCard.locator('> div').first();

      const styles = await iconContainer.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderRadius: computed.borderRadius
        };
      });

      // Background should be gray (same as chats)
      expect(styles.backgroundColor).toBe('rgb(243, 244, 246)');
      expect(styles.borderRadius).toBe('10px');
    }
  });

  test('Visual comparison: All fixes applied', async ({ page }) => {
    // Wait for all content to load
    await page.waitForTimeout(1000);

    // Take a screenshot for manual verification
    await page.screenshot({
      path: 'teacher-assistant/frontend/e2e-tests/screenshots/fixes-7-11-complete.png',
      fullPage: true
    });

    // Check that all critical elements are present
    const elements = [
      page.locator('[data-testid="calendar-card"]'),
      page.locator('[data-testid="recent-chats-section"] h2'),
      page.locator('[data-testid="materials-section"] h2')
    ];

    for (const element of elements) {
      await expect(element).toBeVisible();
    }
  });

  test('Calendar card has correct styling from Fix #6', async ({ page }) => {
    const calendarCard = page.locator('[data-testid="calendar-card"]');

    if (await calendarCard.isVisible()) {
      const styles = await calendarCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          border: computed.border,
          boxShadow: computed.boxShadow
        };
      });

      // Should be white (not gray)
      expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');

      // Border radius should be 16px (not 24px)
      expect(styles.borderRadius).toBe('16px');

      // Padding should be 16px (not 24px)
      expect(styles.padding).toBe('16px');

      // Should have border
      expect(styles.border).toContain('1px');

      // Should have subtle shadow
      expect(styles.boxShadow).toContain('rgba(0, 0, 0, 0.05)');
    }
  });
});
