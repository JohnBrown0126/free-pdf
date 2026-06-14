const { test, expect } = require('@playwright/test');
const { uploadPdf, selectTool, clickCanvas } = require('./helpers.js');

test.describe('session persistence', () => {
  test('text survives a page reload', async ({ page }) => {
    await uploadPdf(page);
    await selectTool(page, 'text');
    await clickCanvas(page, 150, 150);
    await page.locator('.overlay-input').fill('Ian Brown');

    await page.waitForTimeout(800);
    await page.reload();

    await page.waitForSelector('.overlay-input');
    await expect(page.locator('.overlay-input').first()).toHaveValue('Ian Brown');
  });

  test('multiple overlays survive a reload', async ({ page }) => {
    await uploadPdf(page);
    await selectTool(page, 'text');
    await clickCanvas(page, 100, 100);
    await page.locator('.overlay-input').last().fill('First');
    await clickCanvas(page, 300, 200);
    await page.locator('.overlay-input').last().fill('Second');

    await page.waitForTimeout(800);
    await page.reload();

    await page.waitForSelector('.overlay-input');
    const values = await page.locator('.overlay-input').evaluateAll(
      els => els.map(el => el.value)
    );
    expect(values).toContain('First');
    expect(values).toContain('Second');
  });

  test('overlay position survives a reload', async ({ page }) => {
    await uploadPdf(page);
    await selectTool(page, 'text');
    await clickCanvas(page, 200, 180);

    await page.waitForTimeout(800);
    const beforeLeft = await page.locator('.overlay-field').evaluate(el => el.style.left);

    await page.reload();
    await page.waitForSelector('.overlay-field');
    const afterLeft = await page.locator('.overlay-field').evaluate(el => el.style.left);
    expect(afterLeft).toBe(beforeLeft);
  });

  test('"Change file" clears the saved session', async ({ page }) => {
    await uploadPdf(page);
    await selectTool(page, 'text');
    await clickCanvas(page, 150, 150);
    await page.waitForTimeout(800);

    await page.click('#change-file-btn');
    await page.reload();

    await expect(page.locator('#upload-section')).toBeVisible();
  });
});
