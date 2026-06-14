import { describe, it, expect } from 'vitest';
import { hexToRgb } from '../../server/pdf/color.js';

describe('hexToRgb', () => {
  it.each([
    ['#ff0000', 1,           0,           0],
    ['ffffff',  1,           1,           1],
    ['#00FF00', 0,           1,           0],
    ['#ff8000', 1,           0x80 / 255,  0],
  ])('parses %s', (hex, r, g, b) => {
    const c = hexToRgb(hex);
    expect(c.red).toBeCloseTo(r, 5);
    expect(c.green).toBeCloseTo(g, 5);
    expect(c.blue).toBeCloseTo(b, 5);
  });

  it.each(['xyz', '', '#fff'])('falls back to black for invalid input "%s"', (hex) => {
    const c = hexToRgb(hex);
    expect(c.red).toBe(0);
    expect(c.green).toBe(0);
    expect(c.blue).toBe(0);
  });
});
