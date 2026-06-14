import { describe, it, expect } from 'vitest';

// Test the overlay type-normalisation logic isolated from the DOM.
// This mirrors the exact transform used in restoreSession().
const normaliseOverlays = overlays =>
  (overlays || []).map(o => ({ ...o, type: o.type || 'text' }));

describe('overlay type normalisation', () => {
  it('preserves type when already set', () => {
    const input = [{ id: 1, type: 'text', text: 'hello' }];
    expect(normaliseOverlays(input)[0].type).toBe('text');
  });

  it('defaults missing type to "text"', () => {
    const input = [{ id: 1, text: 'Ian Brown' }];
    expect(normaliseOverlays(input)[0].type).toBe('text');
  });

  it('preserves "date" type', () => {
    const input = [{ id: 2, type: 'date', text: '14 Jun 2026' }];
    expect(normaliseOverlays(input)[0].type).toBe('date');
  });

  it('preserves "shape" type', () => {
    const input = [{ id: 3, type: 'shape', shape: 'circle' }];
    expect(normaliseOverlays(input)[0].type).toBe('shape');
  });

  it('preserves "signature" type', () => {
    const input = [{ id: 4, type: 'signature', dataUrl: 'data:image/png;base64,abc' }];
    expect(normaliseOverlays(input)[0].type).toBe('signature');
  });

  it('handles an empty array', () => {
    expect(normaliseOverlays([])).toEqual([]);
  });

  it('handles null/undefined gracefully', () => {
    expect(normaliseOverlays(null)).toEqual([]);
    expect(normaliseOverlays(undefined)).toEqual([]);
  });

  it('does not mutate original objects', () => {
    const original = { id: 1, text: 'hello' };
    const result = normaliseOverlays([original]);
    expect(original).not.toHaveProperty('type');
    expect(result[0].type).toBe('text');
  });

  it('normalises a mixed array correctly', () => {
    const input = [
      { id: 1, text: 'Ian Brown' },          // no type → text
      { id: 2, type: 'date', text: '...' },  // already set
      { id: 3, type: 'shape', shape: 'rect' },
    ];
    const result = normaliseOverlays(input);
    expect(result.map(o => o.type)).toEqual(['text', 'date', 'shape']);
  });
});
