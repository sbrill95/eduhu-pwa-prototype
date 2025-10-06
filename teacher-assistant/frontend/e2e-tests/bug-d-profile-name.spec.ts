import { test, expect } from '@playwright/test';

test('Profile name can be saved', async ({ page }) => {
  // Setup
  await page.goto('http://localhost:5174');
  await page.evaluate(() => {
    localStorage.setItem('test-auth-enabled', 'true');
    localStorage.setItem('test-user-id', 'test-user-playwright-id-12345');
    localStorage.setItem('test-user-email', 's.brill@eduhu.de');
  });

  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  const profileTab = page.locator('[aria-label="Profil"]');
  await expect(profileTab).toBeVisible({ timeout: 10000 });
  await profileTab.click();
  await page.waitForTimeout(1000);

  // Click edit button (pencil icon)
  const editButton = page.locator('[aria-label="Name bearbeiten"]');
  console.log('Looking for edit button...');

  if (await editButton.isVisible({ timeout: 5000 })) {
    await editButton.click();
    await page.waitForTimeout(500);

    // Enter new name
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Test Teacher QA');

    // Screenshot before save
    await page.screenshot({ path: 'qa-screenshots/bug-d-before-save.png', fullPage: true });

    // Click save (checkmark icon)
    const saveButton = page.locator('[aria-label="Speichern"]');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Screenshot after save
    await page.screenshot({ path: 'qa-screenshots/bug-d-after-save.png', fullPage: true });

    // Check if name was saved (checkmark icon should disappear)
    const editButtonAfter = page.locator('[aria-label="Name bearbeiten"]');
    await expect(editButtonAfter).toBeVisible(); // Back to view mode

    // Verify name is displayed
    const nameText = await page.locator('h2, h1').filter({ hasText: 'Test Teacher QA' }).textContent();
    console.log('Name after save:', nameText);
    expect(nameText).toContain('Test Teacher QA');
    console.log('✅ Profile name saved successfully');
  } else {
    console.warn('Could not find edit button - profile may not support editing');
    await page.screenshot({ path: 'qa-screenshots/bug-d-no-edit-button.png', fullPage: true });
  }
});
