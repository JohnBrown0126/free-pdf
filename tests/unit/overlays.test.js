import { describe, it, expect } from 'vitest';
import { OVERLAY_RENDERERS } from '../../server/pdf/overlays.js';

describe('OVERLAY_RENDERERS', () => {
  it('has exactly shape, signature, and text keys, each a function', () => {
    expect(Object.keys(OVERLAY_RENDERERS).sort()).toEqual(['shape', 'signature', 'text']);
    for (const fn of Object.values(OVERLAY_RENDERERS)) expect(typeof fn).toBe('function');
  });

  it.each(['date', undefined])('falls back to text renderer for unknown type %s', (type) => {
    expect(OVERLAY_RENDERERS[type] ?? OVERLAY_RENDERERS.text).toBe(OVERLAY_RENDERERS.text);
  });
});
