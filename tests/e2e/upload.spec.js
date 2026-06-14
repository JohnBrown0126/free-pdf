const { test, expect } = require('@playwright/test');
const { uploadPdf } = require('./helpers.js');

test.describe('PDF upload', () => {
  test('shows the editor after uploading a PDF', async ({ page }) => {
    await uploadPdf(page);
    await expect(page.locator('#editor-section')).toBeVisible();
    await expect(page.locator('#upload-section')).toBeHidden();
  });

  test('displays the filename in the sidebar', async ({ page }) => {
    await uploadPdf(page);
    const filename = await page.locator('#filename').textContent();
    expect(filename).toContain('sample.pdf');
  });

  test('renders the PDF canvas with non-zero dimensions', async ({ page }) => {
    await uploadPdf(page);
    const dims = await page.locator('#pdf-canvas').evaluate(c => ({ w: c.width, h: c.height }));
    expect(dims.w).toBeGreaterThan(0);
    expect(dims.h).toBeGreaterThan(0);
  });

  test('shows the draw toolbar when the PDF has no form fields', async ({ page }) => {
    await uploadPdf(page);
    await expect(page.locator('#draw-toolbar')).toBeVisible();
  });

  test('"Change file" button returns to the upload screen', async ({ page }) => {
    await uploadPdf(page);
    await page.click('#change-file-btn');
    await expect(page.locator('#upload-section')).toBeVisible();
    await expect(page.locator('#editor-section')).toBeHidden();
  });
});
