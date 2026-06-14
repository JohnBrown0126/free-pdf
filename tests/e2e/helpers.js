const path = require('path');

const SAMPLE_PDF = path.join(__dirname, '../fixtures/sample.pdf');

/** Upload the sample PDF and wait for the editor to appear. */
async function uploadPdf(page) {
  await page.goto('/');
  await page.setInputFiles('#file-input', SAMPLE_PDF);
  await page.waitForSelector('#editor-section:not([hidden])');
  // Wait for draw-toolbar — confirms loadFields() finished (uploadFile fully complete)
  await page.waitForSelector('#draw-toolbar:not([hidden])');
  await page.waitForFunction(() => {
    const c = document.querySelector('#pdf-canvas');
    return c && c.width > 0;
  });
}

/** Click a toolbar tool button. */
async function selectTool(page, tool) {
  await page.click(`[data-tool="${tool}"]`);
}

/** Click the canvas at (x, y) relative to the canvas wrapper. */
async function clickCanvas(page, x, y) {
  await page.locator('#canvas-wrapper').click({ position: { x, y } });
}

module.exports = { SAMPLE_PDF, uploadPdf, selectTool, clickCanvas };
