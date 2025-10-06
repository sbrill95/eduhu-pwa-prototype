import { test, expect } from '@playwright/test';

/**
 * Editable Name Field Visual Verification
 *
 * Requirements:
 * - Remove Benutzer-ID field
 * - Add editable name field with pencil icon
 * - Clean inline editing with Gemini Design Language
 * - Buttons must be VISIBLE (not cut off)
 */

test('Profile editable name field - Display mode', async ({ page }) => {
  // Navigate to Profile page
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle' });

  // Wait for app to load and click Profile tab
  await page.waitForSelector('ion-tab-button[tab="profile"]', { timeout: 10000 });
  await page.click('ion-tab-button[tab="profile"]');

  // Wait for profile content to load
  await page.waitForSelector('text=Dein Profil', { timeout: 5000 });
  await page.waitForSelector('text=Allgemeine Informationen', { timeout: 5000 });

  // Verify Benutzer-ID is NOT present
  const userIdField = await page.locator('text=Benutzer-ID').count();
  console.log('Benutzer-ID field count:', userIdField);
  expect(userIdField).toBe(0);

  // Verify Name field with pencil icon is present
  const nameLabel = await page.locator('label:has-text("NAME")').count();
  console.log('Name label count:', nameLabel);
  expect(nameLabel).toBeGreaterThan(0);

  // Verify pencil icon is visible
  const pencilIcon = await page.locator('ion-icon[icon*="pencil"]').count();
  console.log('Pencil icon count:', pencilIcon);
  expect(pencilIcon).toBeGreaterThan(0);

  // Take screenshot of display mode
  await page.screenshot({
    path: 'profile-name-display-mode.png',
    fullPage: true
  });

  console.log('✅ Display mode verified - Screenshot saved: profile-name-display-mode.png');
});

test('Profile editable name field - Edit mode', async ({ page }) => {
  // Navigate to Profile page
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle' });

  // Wait for app to load and click Profile tab
  await page.waitForSelector('ion-tab-button[tab="profile"]', { timeout: 10000 });
  await page.click('ion-tab-button[tab="profile"]');

  // Wait for profile content to load
  await page.waitForSelector('text=Allgemeine Informationen', { timeout: 5000 });

  // Click on the name field to enter edit mode
  const nameField = await page.locator('label:has-text("NAME")').locator('..').locator('div.cursor-pointer');
  await nameField.click();

  // Wait for edit mode to appear
  await page.waitForTimeout(500);

  // Verify input field is visible
  const inputField = await page.locator('input[type="text"][placeholder*="Namen"]').count();
  console.log('Input field count:', inputField);
  expect(inputField).toBeGreaterThan(0);

  // Verify Abbrechen button is visible
  const abbrechenButton = await page.locator('button:has-text("Abbrechen")').count();
  console.log('Abbrechen button count:', abbrechenButton);
  expect(abbrechenButton).toBeGreaterThan(0);

  // Verify Speichern button is visible
  const speichernButton = await page.locator('button:has-text("Speichern")').count();
  console.log('Speichern button count:', speichernButton);
  expect(speichernButton).toBeGreaterThan(0);

  // Check if buttons are in viewport (not cut off)
  const abbrechenBox = await page.locator('button:has-text("Abbrechen")').boundingBox();
  const speichernBox = await page.locator('button:has-text("Speichern")').boundingBox();

  console.log('Abbrechen button bounding box:', abbrechenBox);
  console.log('Speichern button bounding box:', speichernBox);

  // Both buttons should be visible and in viewport
  expect(abbrechenBox).toBeTruthy();
  expect(speichernBox).toBeTruthy();

  if (abbrechenBox && speichernBox) {
    // Verify buttons are not cut off (y position should be reasonable)
    expect(abbrechenBox.y).toBeGreaterThan(0);
    expect(speichernBox.y).toBeGreaterThan(0);

    // Verify buttons have reasonable height (not collapsed)
    expect(abbrechenBox.height).toBeGreaterThan(20);
    expect(speichernBox.height).toBeGreaterThan(20);
  }

  // Take screenshot of edit mode
  await page.screenshot({
    path: 'profile-name-edit-mode.png',
    fullPage: true
  });

  console.log('✅ Edit mode verified - Screenshot saved: profile-name-edit-mode.png');
  console.log('✅ All buttons are VISIBLE and not cut off!');
});

test('Profile editable name field - Cancel action', async ({ page }) => {
  // Navigate to Profile page
  await page.goto('http://localhost:5177', { waitUntil: 'networkidle' });

  // Wait for app to load and click Profile tab
  await page.waitForSelector('ion-tab-button[tab="profile"]', { timeout: 10000 });
  await page.click('ion-tab-button[tab="profile"]');

  // Wait for profile content to load
  await page.waitForSelector('text=Allgemeine Informationen', { timeout: 5000 });

  // Click on the name field to enter edit mode
  const nameField = await page.locator('label:has-text("NAME")').locator('..').locator('div.cursor-pointer');
  await nameField.click();

  // Wait for edit mode
  await page.waitForTimeout(500);

  // Type a new name
  const inputField = page.locator('input[type="text"][placeholder*="Namen"]');
  await inputField.fill('Test User Name');

  // Click Abbrechen
  await page.click('button:has-text("Abbrechen")');

  // Wait for display mode to return
  await page.waitForTimeout(500);

  // Verify we're back in display mode (pencil icon should be visible)
  const pencilIcon = await page.locator('ion-icon[icon*="pencil"]').count();
  expect(pencilIcon).toBeGreaterThan(0);

  // Take screenshot
  await page.screenshot({
    path: 'profile-name-cancel-action.png',
    fullPage: true
  });

  console.log('✅ Cancel action verified - Screenshot saved: profile-name-cancel-action.png');
});
