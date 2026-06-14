'use strict';

const { hexToRgb } = require('./color');
const { selectFontKey } = require('./fonts');
const { drawShape } = require('./shapes');

const OVERLAY_RENDERERS = {
  shape: ({ page, ov, color }) => {
    drawShape(page, ov.shape, { x: ov.pdfX, y: ov.pdfY, w: ov.pdfW, h: ov.pdfH, color });
  },

  signature: async ({ page, pdfDoc, ov }) => {
    if (!ov.dataUrl) return;
    const base64 = ov.dataUrl.split(',')[1];
    if (!base64) return;
    const pngBytes = Buffer.from(base64, 'base64');
    const image = await pdfDoc.embedPng(pngBytes);
    page.drawImage(image, { x: ov.pdfX, y: ov.pdfY, width: ov.pdfW, height: ov.pdfH });
  },

  text: async ({ page, ov, color, fontLoader }) => {
    if (!ov.text?.trim()) return;
    const s = ov.style || {};
    const fontSize = ov.pdfFontSize || (s.fontSize || 11) / 1.5;
    const fontKey = selectFontKey(s);
    const font = await fontLoader(fontKey);
    page.drawText(ov.text, {
      x: ov.pdfX + 2,
      y: ov.pdfY + ov.pdfH - fontSize - 2,
      size: fontSize,
      font,
      color,
      maxWidth: ov.pdfW - 4,
      lineHeight: fontSize * 1.3,
    });
  },
};

async function applyOverlays(pdfDoc, overlays, fontLoader) {
  const pages = pdfDoc.getPages();
  for (const ov of overlays || []) {
    const page = pages[ov.page - 1];
    if (!page) continue;
    const color = hexToRgb((ov.style || {}).color || '#000000');
    const renderer = OVERLAY_RENDERERS[ov.type] ?? OVERLAY_RENDERERS.text;
    await renderer({ page, pdfDoc, ov, color, fontLoader });
  }
}

module.exports = { applyOverlays, OVERLAY_RENDERERS };
