import { describe, it, expect } from 'vitest';
import { OVERLAY_RENDERERS } from '../../server/pdf/overlays.js';

describe('OVERLAY_RENDERERS', () => {
  it('has a shape renderer', () => {
    expect(typeof OVERLAY_RENDERERS.shape).toBe('function');
  });

  it('has a signature renderer', () => {
    expect(typeof OVERLAY_RENDERERS.signature).toBe('function');
  });

  it('has a text renderer', () => {
    expect(typeof OVERLAY_RENDERERS.text).toBe('function');
  });

  it('has exactly the three expected renderer types', () => {
    expect(Object.keys(OVERLAY_RENDERERS).sort()).toEqual(['shape', 'signature', 'text']);
  });

  it('unknown ov.type falls back to text renderer via ?? operator', () => {
    const renderer = OVERLAY_RENDERERS['date'] ?? OVERLAY_RENDERERS.text;
    expect(renderer).toBe(OVERLAY_RENDERERS.text);
  });

  it('absent ov.type falls back to text renderer via ?? operator', () => {
    const renderer = OVERLAY_RENDERERS[undefined] ?? OVERLAY_RENDERERS.text;
    expect(renderer).toBe(OVERLAY_RENDERERS.text);
  });
});
