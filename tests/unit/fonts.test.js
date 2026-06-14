import { describe, it, expect } from 'vitest';
import { selectFontKey } from '../../server/pdf/fonts.js';
import { StandardFonts } from 'pdf-lib';

describe('selectFontKey', () => {
  it.each([
    [undefined,                      StandardFonts.Helvetica],
    [{ bold: false, italic: false }, StandardFonts.Helvetica],
    [{ bold: true,  italic: false }, StandardFonts.HelveticaBold],
    [{ bold: false, italic: true  }, StandardFonts.HelveticaOblique],
    [{ bold: true,  italic: true  }, StandardFonts.HelveticaBoldOblique],
    [{ bold: 1,     italic: 0     }, StandardFonts.HelveticaBold],
    [{ bold: 0,     italic: 1     }, StandardFonts.HelveticaOblique],
  ])('selectFontKey(%o) → %s', (style, expected) => {
    expect(selectFontKey(style)).toBe(expected);
  });
});
