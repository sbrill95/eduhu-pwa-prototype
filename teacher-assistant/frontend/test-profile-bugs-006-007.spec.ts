/**
 * BUG-006 & BUG-007: Profile Features Tests
 *
 * BUG-006: Merkmal hinzufügen - Modal with confirmation button
 * BUG-007: Name ändern - Save/Cancel icon buttons
 */

import { test, expect } from '@playwright/test';

test.describe('Profile Bug Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5178');

    // Wait for app to load
    await page.waitForSelector('[data-testid="tab-bar"]', { timeout: 10000 });

    // Navigate to Profile tab
    await page.click('button:has-text("Profil")');
    await page.waitForURL('**/profil');
    await page.waitForLoadState('networkidle');
  });

  test('BUG-006: Add characteristic modal has confirmation button', async ({ page }) => {
    // Click "Merkmal hinzufügen" button
    await page.click('button:has-text("Merkmal hinzufügen")');

    // Wait for modal to appear
    await page.waitForSelector('text=Merkmal hinzufügen', { timeout: 3000 });

    // Verify modal elements exist
    const modalTitle = await page.locator('h3:has-text("Merkmal hinzufügen")');
    await expect(modalTitle).toBeVisible();

    // Verify input field exists
    const inputField = await page.locator('input[placeholder*="Projektbasiertes"]');
    await expect(inputField).toBeVisible();
    await expect(inputField).toBeFocused();

    // Verify "Abbrechen" button exists (gray, left)
    const cancelButton = await page.locator('button:has-text("Abbrechen")').first();
    await expect(cancelButton).toBeVisible();

    // Verify "Hinzufügen" button exists (orange, right)
    const addButton = await page.locator('button:has-text("Hinzufügen")');
    await expect(addButton).toBeVisible();

    // Verify "Hinzufügen" button is disabled when empty
    await expect(addButton).toBeDisabled();

    // Type a characteristic
    await inputField.fill('Gruppenarbeit');

    // Verify "Hinzufügen" button is now enabled
    await expect(addButton).toBeEnabled();

    // Take screenshot
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-006-add-tag-modal.png',
      fullPage: true
    });

    console.log('✅ BUG-006: Modal buttons verified');
  });

  test('BUG-006: Add characteristic works end-to-end', async ({ page }) => {
    // Click "Merkmal hinzufügen" button
    await page.click('button:has-text("Merkmal hinzufügen")');

    // Wait for modal
    await page.waitForSelector('text=Merkmal hinzufügen', { timeout: 3000 });

    // Type a characteristic
    const inputField = await page.locator('input[placeholder*="Projektbasiertes"]');
    await inputField.fill('Test Gruppenarbeit');

    // Click "Hinzufügen"
    await page.click('button:has-text("Hinzufügen")');

    // Wait for modal to close
    await page.waitForSelector('h3:has-text("Merkmal hinzufügen")', { state: 'hidden', timeout: 3000 });

    // Verify characteristic appears in list
    const newTag = await page.locator('text=Test Gruppenarbeit');
    await expect(newTag).toBeVisible({ timeout: 5000 });

    console.log('✅ BUG-006: Add characteristic works end-to-end');
  });

  test('BUG-006: Cancel button closes modal', async ({ page }) => {
    // Click "Merkmal hinzufügen" button
    await page.click('button:has-text("Merkmal hinzufügen")');

    // Wait for modal
    await page.waitForSelector('text=Merkmal hinzufügen', { timeout: 3000 });

    // Type something
    const inputField = await page.locator('input[placeholder*="Projektbasiertes"]');
    await inputField.fill('Test');

    // Click "Abbrechen"
    await page.click('button:has-text("Abbrechen")').first();

    // Wait for modal to close
    await page.waitForSelector('h3:has-text("Merkmal hinzufügen")', { state: 'hidden', timeout: 3000 });

    console.log('✅ BUG-006: Cancel button works');
  });

  test('BUG-007: Name edit mode has save and cancel icon buttons', async ({ page }) => {
    // Find the name field with pencil icon
    const nameSection = await page.locator('label:has-text("Name")').locator('..');

    // Click the pencil icon to enter edit mode
    await nameSection.locator('[aria-label="Name bearbeiten"]').click();

    // Wait for edit mode
    await page.waitForTimeout(500);

    // Verify input field is visible and focused
    const nameInput = await nameSection.locator('input[type="text"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeFocused();

    // Verify checkmark button (save) exists
    const saveButton = await nameSection.locator('[aria-label="Speichern"]');
    await expect(saveButton).toBeVisible();

    // Verify X button (cancel) exists
    const cancelButton = await nameSection.locator('[aria-label="Abbrechen"]');
    await expect(cancelButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-007-edit-name.png',
      fullPage: true
    });

    console.log('✅ BUG-007: Edit mode icon buttons verified');
  });

  test('BUG-007: Name editing saves correctly', async ({ page }) => {
    // Enter edit mode
    const nameSection = await page.locator('label:has-text("Name")').locator('..');
    await nameSection.locator('[aria-label="Name bearbeiten"]').click();

    // Wait for edit mode
    await page.waitForTimeout(500);

    // Change name
    const nameInput = await nameSection.locator('input[type="text"]');
    await nameInput.fill('Frau Müller Test');

    // Click save (checkmark)
    await nameSection.locator('[aria-label="Speichern"]').click();

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Verify edit mode closed
    await expect(nameInput).not.toBeVisible();

    // Verify new name is displayed
    const displayedName = await nameSection.locator('h2');
    await expect(displayedName).toContainText('Frau Müller Test');

    console.log('✅ BUG-007: Name save works correctly');
  });

  test('BUG-007: Name editing cancel reverts changes', async ({ page }) => {
    // Get original name
    const nameSection = await page.locator('label:has-text("Name")').locator('..');
    const originalName = await nameSection.locator('h2').textContent();

    // Enter edit mode
    await nameSection.locator('[aria-label="Name bearbeiten"]').click();
    await page.waitForTimeout(500);

    // Change name
    const nameInput = await nameSection.locator('input[type="text"]');
    await nameInput.fill('Changed Name');

    // Click cancel (X)
    await nameSection.locator('[aria-label="Abbrechen"]').click();

    // Wait for cancel
    await page.waitForTimeout(500);

    // Verify edit mode closed
    await expect(nameInput).not.toBeVisible();

    // Verify original name is still displayed
    const displayedName = await nameSection.locator('h2');
    await expect(displayedName).toHaveText(originalName || '');

    console.log('✅ BUG-007: Name cancel works correctly');
  });

  test('BUG-007: Empty name cannot be saved', async ({ page }) => {
    // Enter edit mode
    const nameSection = await page.locator('label:has-text("Name")').locator('..');
    await nameSection.locator('[aria-label="Name bearbeiten"]').click();

    // Wait for edit mode
    await page.waitForTimeout(500);

    // Clear name
    const nameInput = await nameSection.locator('input[type="text"]');
    await nameInput.fill('');

    // Verify save button is disabled
    const saveButton = await nameSection.locator('[aria-label="Speichern"]');
    await expect(saveButton).toBeDisabled();

    console.log('✅ BUG-007: Empty name validation works');
  });
});
