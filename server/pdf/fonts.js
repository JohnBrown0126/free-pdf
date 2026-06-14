'use strict';

const { StandardFonts } = require('pdf-lib');

const FONT_BY_STYLE = {
  'false,false': StandardFonts.Helvetica,
  'true,false':  StandardFonts.HelveticaBold,
  'false,true':  StandardFonts.HelveticaOblique,
  'true,true':   StandardFonts.HelveticaBoldOblique,
};

function selectFontKey({ bold = false, italic = false } = {}) {
  return FONT_BY_STYLE[`${!!bold},${!!italic}`];
}

function createFontLoader(pdfDoc) {
  const cache = new Map();
  return async (key) => {
    if (!cache.has(key)) cache.set(key, await pdfDoc.embedFont(key));
    return cache.get(key);
  };
}

module.exports = { selectFontKey, createFontLoader, FONT_BY_STYLE };
