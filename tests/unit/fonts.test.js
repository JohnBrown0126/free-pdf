import { describe, it, expect } from 'vitest';
import { selectFontKey } from '../../server/pdf/fonts.js';
import { StandardFonts } from 'pdf-lib';

describe('selectFontKey', () => {
  it('returns Helvetica when called with no arguments', () => {
    expect(selectFontKey()).toBe(StandardFonts.Helvetica);
  });

  it('returns Helvetica for plain (not bold, not italic)', () => {
    expect(selectFontKey({ bold: false, italic: false })).toBe(StandardFonts.Helvetica);
  });

  it('returns HelveticaBold for bold only', () => {
    expect(selectFontKey({ bold: true, italic: false })).toBe(StandardFonts.HelveticaBold);
  });

  it('returns HelveticaOblique for italic only', () => {
    expect(selectFontKey({ bold: false, italic: true })).toBe(StandardFonts.HelveticaOblique);
  });

  it('returns HelveticaBoldOblique for bold and italic', () => {
    expect(selectFontKey({ bold: true, italic: true })).toBe(StandardFonts.HelveticaBoldOblique);
  });

  it('coerces truthy values for bold and italic', () => {
    expect(selectFontKey({ bold: 1, italic: 0 })).toBe(StandardFonts.HelveticaBold);
    expect(selectFontKey({ bold: 0, italic: 1 })).toBe(StandardFonts.HelveticaOblique);
  });
});
