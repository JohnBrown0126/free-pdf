import { describe, it, expect } from 'vitest';
import { hexToRgb } from '../../server/pdf/color.js';

describe('hexToRgb', () => {
  it('parses #rrggbb', () => {
    const c = hexToRgb('#ff0000');
    expect(c.red).toBeCloseTo(1, 5);
    expect(c.green).toBe(0);
    expect(c.blue).toBe(0);
  });

  it('parses without leading #', () => {
    const c = hexToRgb('ffffff');
    expect(c.red).toBe(1);
    expect(c.green).toBe(1);
    expect(c.blue).toBe(1);
  });

  it('parses uppercase hex', () => {
    const c = hexToRgb('#00FF00');
    expect(c.green).toBeCloseTo(1, 5);
    expect(c.red).toBe(0);
    expect(c.blue).toBe(0);
  });

  it('falls back to black for an invalid string', () => {
    const c = hexToRgb('xyz');
    expect(c.red).toBe(0);
    expect(c.green).toBe(0);
    expect(c.blue).toBe(0);
  });

  it('falls back to black for an empty string', () => {
    const c = hexToRgb('');
    expect(c.red).toBe(0);
    expect(c.green).toBe(0);
    expect(c.blue).toBe(0);
  });

  it('falls back to black for a short hex', () => {
    const c = hexToRgb('#fff');
    expect(c.red).toBe(0);
    expect(c.green).toBe(0);
    expect(c.blue).toBe(0);
  });

  it('correctly scales channel values to 0–1', () => {
    const c = hexToRgb('#ff8000');
    expect(c.red).toBeCloseTo(1, 5);
    expect(c.green).toBeCloseTo(0x80 / 255, 5);
    expect(c.blue).toBe(0);
  });
});
