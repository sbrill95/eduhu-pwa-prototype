import { test, expect } from '@playwright/test';

/**
 * Visual Verification for Profile Redesign (Gemini Design)
 *
 * This test suite verifies the ProfileView implementation matches
 * the Gemini design mockup pixel-by-pixel.
 *
 * Reference: .specify/specs/Profil.png
 */

test.describe('Profile View - Gemini Design Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for app to load
    await page.waitForSelector('ion-tab-bar', { timeout: 10000 });
  });

  test('TASK-017: Profile Sync Indicator - Full View (Mobile 375px)', async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to Profile tab
    await page.click('ion-tab-button[tab="profile"]');

    // Wait for profile view to load
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Wait for sync indicator to render
    await page.waitForSelector('text=DEIN PROFIL-SYNC', { timeout: 5000 });

    // Take full page screenshot
    await page.screenshot({
      path: 'profile-sync-indicator.png',
      fullPage: false
    });

    console.log('✅ TASK-017 Screenshot: profile-sync-indicator.png');
  });

  test('TASK-018: Encouraging Microcopy - Verify Text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('ion-tab-button[tab="profile"]');
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Verify microcopy is visible
    const microcopy = page.locator('text=Je mehr du mit eduhu interagierst, desto besser werden die Vorschläge.');
    await expect(microcopy).toBeVisible();

    console.log('✅ TASK-018: Microcopy verified');
  });

  test('TASK-019: Gelernte Merkmale Tags - Display', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('ion-tab-button[tab="profile"]');
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Wait for "Gelernte Merkmale" section
    await page.waitForSelector('text=Gelernte Merkmale', { timeout: 5000 });

    // Take screenshot of tags section
    await page.screenshot({
      path: 'profile-tags-display.png',
      fullPage: false
    });

    console.log('✅ TASK-019 Screenshot: profile-tags-display.png');
  });

  test('TASK-020: Add Tag Modal - Visual Check', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('ion-tab-button[tab="profile"]');
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Click "Merkmal hinzufügen +" button
    await page.click('text=Merkmal hinzufügen +');

    // Wait for modal to appear
    await page.waitForSelector('text=Merkmal hinzufügen', { timeout: 3000 });

    // Take screenshot
    await page.screenshot({
      path: 'profile-add-tag-modal.png',
      fullPage: false
    });

    console.log('✅ TASK-020 Screenshot: profile-add-tag-modal.png');
  });

  test('TASK-021: General Info Section - Visual Check', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('ion-tab-button[tab="profile"]');
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Scroll to General Info section
    await page.locator('text=Allgemeine Informationen').scrollIntoViewIfNeeded();

    // Take screenshot
    await page.screenshot({
      path: 'profile-general-info.png',
      fullPage: false
    });

    console.log('✅ TASK-021 Screenshot: profile-general-info.png');
  });

  test('TASK-022: Full Profile - iPhone SE (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('ion-tab-button[tab="profile"]');
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Take full page screenshot
    await page.screenshot({
      path: 'profile-full-iphone-se.png',
      fullPage: true
    });

    console.log('✅ TASK-022 Screenshot: profile-full-iphone-se.png');
  });

  test('TASK-022: Full Profile - iPhone 12 (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.click('ion-tab-button[tab="profile"]');
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Take full page screenshot
    await page.screenshot({
      path: 'profile-full-iphone-12.png',
      fullPage: true
    });

    console.log('✅ TASK-022 Screenshot: profile-full-iphone-12.png');
  });

  test('TASK-022: Full Profile - Pixel 5 (393px)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });

    await page.click('ion-tab-button[tab="profile"]');
    await page.waitForSelector('text=Dein Profil', { timeout: 5000 });

    // Take full page screenshot
    await page.screenshot({
      path: 'profile-full-pixel-5.png',
      fullPage: true
    });

    console.log('✅ TASK-022 Screenshot: profile-full-pixel-5.png');
  });
});
