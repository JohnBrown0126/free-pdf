import { describe, it, expect } from 'vitest';
import { roundedRectPath, SHAPE_DRAWERS, drawShape } from '../../server/pdf/shapes.js';

describe('roundedRectPath', () => {
  it('returns a closed SVG path string', () => {
    const result = roundedRectPath(10, 10, 100, 50);
    expect(result).toMatch(/^M .* Z$/);
  });

  it('clamps radius to 8 for large shapes', () => {
    const result = roundedRectPath(0, 0, 200, 200);
    // r = min(8, 200*0.15=30, 200*0.15=30) = 8
    expect(result).toContain('M 8 0');
  });

  it('clamps radius based on width for narrow shapes', () => {
    const result = roundedRectPath(0, 0, 20, 200);
    // r = min(8, 20*0.15=3, 200*0.15=30) = 3
    expect(result).toContain('M 3 0');
  });

  it('clamps radius based on height for short shapes', () => {
    const result = roundedRectPath(0, 0, 200, 20);
    // r = min(8, 200*0.15=30, 20*0.15=3) = 3
    expect(result).toContain('M 3 0');
  });

  it('accounts for x/y offset in the path', () => {
    const result = roundedRectPath(10, 20, 200, 200);
    // r = 8; first point is x+r, y → '18 20'
    expect(result).toContain('M 18 20');
  });
});

describe('SHAPE_DRAWERS', () => {
  it('has exactly the 5 expected shape types', () => {
    expect(Object.keys(SHAPE_DRAWERS).sort()).toEqual(['check', 'circle', 'cross', 'rect', 'rect-round']);
  });

  it('every entry is a function', () => {
    for (const fn of Object.values(SHAPE_DRAWERS)) {
      expect(typeof fn).toBe('function');
    }
  });
});

describe('drawShape', () => {
  it('returns undefined for an unknown shape type', () => {
    expect(drawShape({}, 'triangle', {})).toBeUndefined();
  });

  it('calls the correct draw method for rect', () => {
    const calls = [];
    const mockPage = { drawRectangle: (opts) => calls.push(opts) };
    drawShape(mockPage, 'rect', { x: 0, y: 0, w: 100, h: 50, color: 'red' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ width: 100, height: 50 });
  });

  it('calls drawLine twice for cross', () => {
    const calls = [];
    const mockPage = { drawLine: (opts) => calls.push(opts) };
    drawShape(mockPage, 'cross', { x: 0, y: 0, w: 40, h: 40, color: 'black' });
    expect(calls).toHaveLength(2);
  });

  it('calls drawLine twice for check', () => {
    const calls = [];
    const mockPage = { drawLine: (opts) => calls.push(opts) };
    drawShape(mockPage, 'check', { x: 0, y: 0, w: 40, h: 40, color: 'black' });
    expect(calls).toHaveLength(2);
  });
});
