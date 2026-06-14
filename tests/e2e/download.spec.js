const { test, expect } = require('@playwright/test');
const { uploadPdf, selectTool, clickCanvas } = require('./helpers.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

test.describe('PDF download', () => {
  test('download button is present after upload', async ({ page }) => {
    await uploadPdf(page);
    await expect(page.locator('#download-btn')).toBeVisible();
  });

  test('download produces a PDF file', async ({ page }) => {
    await uploadPdf(page);
    await selectTool(page, 'text');
    await clickCanvas(page, 150, 150);
    await page.locator('.overlay-input').fill('Test Name');
    await page.waitForTimeout(300);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#download-btn'),
    ]);

    const tmpPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(tmpPath);

    const buf = fs.readFileSync(tmpPath);
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
    fs.unlinkSync(tmpPath);
  });

  test('downloaded file has a .pdf extension', async ({ page }) => {
    await uploadPdf(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#download-btn'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});
