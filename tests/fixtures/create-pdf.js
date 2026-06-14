// Generates tests/fixtures/sample.pdf — run once before E2E tests.
// Used by Playwright globalSetup.
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { writeFileSync } = require('fs');
const { join } = require('path');

async function createSamplePdf() {
  const doc  = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]); // A4

  page.drawText('Test PDF', {
    x: 50, y: 780, size: 24, font, color: rgb(0, 0, 0),
  });
  page.drawText('This PDF is used for automated testing of free-pdf.', {
    x: 50, y: 740, size: 12, font, color: rgb(0.3, 0.3, 0.3),
  });

  const outPath = join(__dirname, 'sample.pdf');
  writeFileSync(outPath, await doc.save());
  return outPath;
}

module.exports = createSamplePdf;
