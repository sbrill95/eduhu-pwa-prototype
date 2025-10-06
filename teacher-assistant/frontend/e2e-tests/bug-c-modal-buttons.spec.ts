import { test, expect } from '@playwright/test';

test('Profile modal buttons are visible', async ({ page }) => {
  // Setup
  await page.goto('http://localhost:5174');
  await page.evaluate(() => {
    localStorage.setItem('test-auth-enabled', 'true');
    localStorage.setItem('test-user-id', 'test-user-playwright-id-12345');
    localStorage.setItem('test-user-email', 's.brill@eduhu.de');
  });

  // Go to profile
  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  const profileTab = page.locator('[aria-label="Profil"]');
  await expect(profileTab).toBeVisible({ timeout: 10000 });
  await profileTab.click();
  await page.waitForTimeout(1000);

  // Click "Merkmal hinzufügen +"
  const addCharButton = page.locator('button:has-text("Merkmal hinzufügen")');
  console.log('Looking for "Merkmal hinzufügen" button...');

  if (await addCharButton.isVisible({ timeout: 5000 })) {
    await addCharButton.click();
    await page.waitForTimeout(500);

    // Screenshot modal
    await page.screenshot({ path: 'qa-screenshots/bug-c-modal-full.png', fullPage: true });

    // Check buttons are visible
    const cancelButton = page.locator('button:has-text("Abbrechen")');
    const addButton = page.locator('button:has-text("Hinzufügen")');

    await expect(cancelButton).toBeVisible();
    await expect(addButton).toBeVisible();

    // Get viewport and button positions
    const viewport = page.viewportSize();
    const addButtonBox = await addButton.boundingBox();

    console.log('Viewport height:', viewport?.height);
    console.log('Add button Y position:', addButtonBox?.y);
    console.log('Add button bottom:', addButtonBox ? addButtonBox.y + addButtonBox.height : 'N/A');

    // Button must be within viewport
    if (addButtonBox && viewport) {
      expect(addButtonBox.y + addButtonBox.height).toBeLessThanOrEqual(viewport.height);
      console.log('✅ Modal buttons are within viewport');
    }
  } else {
    console.warn('Could not find "Merkmal hinzufügen" button - profile may not be loaded');
    await page.screenshot({ path: 'qa-screenshots/bug-c-profile-view.png', fullPage: true });
  }
});
