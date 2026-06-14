const { test, expect } = require('@playwright/test');
const { uploadPdf, selectTool, clickCanvas } = require('./helpers.js');

test.describe('text overlay', () => {
  test.beforeEach(async ({ page }) => {
    await uploadPdf(page);
    await selectTool(page, 'text');
  });

  test('places a text overlay on click', async ({ page }) => {
    await clickCanvas(page, 150, 150);
    await expect(page.locator('.overlay-field')).toBeVisible();
    await expect(page.locator('.overlay-input')).toBeVisible();
  });

  test('focuses the textarea after placement', async ({ page }) => {
    await clickCanvas(page, 150, 150);
    await expect(page.locator('.overlay-input')).toBeFocused();
  });

  test('accepts typed text', async ({ page }) => {
    await clickCanvas(page, 150, 150);
    await page.locator('.overlay-input').fill('Ian Brown');
    await expect(page.locator('.overlay-input')).toHaveValue('Ian Brown');
  });

  test('auto-grows height as text is typed', async ({ page }) => {
    await clickCanvas(page, 150, 150);
    const ta = page.locator('.overlay-input');
    const before = await ta.evaluate(el => el.offsetHeight);
    await ta.fill('Line 1\nLine 2\nLine 3\nLine 4');
    const after = await ta.evaluate(el => el.offsetHeight);
    expect(after).toBeGreaterThan(before);
  });

  test('delete button removes the overlay', async ({ page }) => {
    await clickCanvas(page, 150, 150);
    await expect(page.locator('.overlay-field')).toBeVisible();
    await page.locator('.overlay-field').hover();
    await page.locator('.overlay-delete').click();
    await expect(page.locator('.overlay-field')).toBeHidden();
  });

  test('can place multiple text overlays', async ({ page }) => {
    await clickCanvas(page, 100, 100);
    await clickCanvas(page, 300, 200);
    expect(await page.locator('.overlay-field').count()).toBe(2);
  });
});
