'use strict';

const { rgb } = require('pdf-lib');

function hexToRgb(hex) {
  const h = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? '000000';
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

module.exports = { hexToRgb };
