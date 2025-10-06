/**
 * Manual Verification Script - BUG-006 & BUG-007
 * Takes screenshots for documentation
 */

import { test } from '@playwright/test';

test('Manual verification - Take screenshots', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5178');
  await page.waitForTimeout(2000);

  // Navigate to Profile
  await page.click('button:has-text("Profil")');
  await page.waitForTimeout(2000);

  // Screenshot 1: Profile overview
  await page.screenshot({
    path: '.specify/specs/bug-fix-critical-oct-05/screenshots/00-profile-overview.png',
    fullPage: true
  });

  console.log('Screenshot 1: Profile overview');

  // Screenshot 2: Open add characteristic modal
  await page.click('button:has-text("Merkmal hinzufügen")');
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-006-modal-empty.png',
    fullPage: true
  });

  console.log('Screenshot 2: Empty modal');

  // Screenshot 3: Type in modal
  const inputField = await page.locator('input[placeholder*="Projektbasiertes"]');
  await inputField.fill('Gruppenarbeit');
  await page.waitForTimeout(500);

  await page.screenshot({
    path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-006-modal-filled.png',
    fullPage: true
  });

  console.log('Screenshot 3: Filled modal');

  // Close modal
  await page.click('button:has-text("Abbrechen")').first();
  await page.waitForTimeout(1000);

  // Screenshot 4: Click edit name
  await page.click('[aria-label="Name bearbeiten"]');
  await page.waitForTimeout(500);

  await page.screenshot({
    path: '.specify/specs/bug-fix-critical-oct-05/screenshots/bug-007-edit-mode.png',
    fullPage: true
  });

  console.log('Screenshot 4: Name edit mode');

  console.log('✅ All screenshots captured successfully');
});
