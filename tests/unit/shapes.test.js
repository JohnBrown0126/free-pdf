import { describe, it, expect } from 'vitest';
import { roundedRectPath, SHAPE_DRAWERS, drawShape } from '../../server/pdf/shapes.js';

describe('roundedRectPath', () => {
  it('returns a closed SVG path string', () => {
    expect(roundedRectPath(10, 10, 100, 50)).toMatch(/^M .* Z$/);
  });

  it.each([
    [200, 200, 'M 8 0'],  // r = min(8, 30, 30) = 8
    [20,  200, 'M 3 0'],  // r = min(8,  3, 30) = 3
    [200, 20,  'M 3 0'],  // r = min(8, 30,  3) = 3
  ])('clamps radius for %dx%d shape', (w, h, expected) => {
    expect(roundedRectPath(0, 0, w, h)).toContain(expected);
  });

  it('accounts for x/y offset', () => {
    expect(roundedRectPath(10, 20, 200, 200)).toContain('M 18 20'); // r=8, start = x+r, y
  });
});

describe('SHAPE_DRAWERS', () => {
  it('has exactly the 5 expected shape types, each a function', () => {
    expect(Object.keys(SHAPE_DRAWERS).sort()).toEqual(['check', 'circle', 'cross', 'rect', 'rect-round']);
    for (const fn of Object.values(SHAPE_DRAWERS)) expect(typeof fn).toBe('function');
  });
});

describe('drawShape', () => {
  it('returns undefined for an unknown shape type', () => {
    expect(drawShape({}, 'triangle', {})).toBeUndefined();
  });

  it('calls drawRectangle once for rect', () => {
    const calls = [];
    drawShape({ drawRectangle: (o) => calls.push(o) }, 'rect', { x: 0, y: 0, w: 100, h: 50, color: 'red' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ width: 100, height: 50 });
  });

  it.each(['cross', 'check'])('calls drawLine twice for %s', (shape) => {
    const calls = [];
    drawShape({ drawLine: (o) => calls.push(o) }, shape, { x: 0, y: 0, w: 40, h: 40, color: 'black' });
    expect(calls).toHaveLength(2);
  });
});
