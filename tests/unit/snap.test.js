import { describe, it, expect } from 'vitest';
import { snapPosition } from '../../public/js/util.js';

// snapPosition(candX, candY, w, h, excludeId, overlays) → { x, y, guideX, guideY }

const box = (id, x, y, w = 100, h = 30, page = 1) =>
  ({ id, canvasX: x, canvasY: y, canvasW: w, canvasH: h, page });

describe('snapPosition', () => {
  it('returns unmodified position when no other overlays exist', () => {
    const result = snapPosition(50, 80, 100, 30, 'a', []);
    expect(result).toEqual({ x: 50, y: 80, guideX: null, guideY: null });
  });

  it('snaps left edge to left edge of another overlay', () => {
    const others = [box('b', 200, 100)];
    const { x, guideX } = snapPosition(203, 50, 100, 30, 'a', others);
    expect(x).toBe(200);
    expect(guideX).toBe(200);
  });

  it('snaps right edge to right edge of another overlay', () => {
    // box 'b' right edge at 200; use a wider candidate (w=150) so only its right edge aligns
    const others = [box('b', 100, 100, 100, 30)]; // right edge at 200
    const { x, guideX } = snapPosition(50, 50, 150, 30, 'a', others); // right edge at 200
    expect(x).toBe(50);   // right 200 → left = 200 - 150 = 50
    expect(guideX).toBe(200);
  });

  it('snaps top edge to top edge of another overlay', () => {
    const others = [box('b', 100, 150)];
    const { y, guideY } = snapPosition(50, 153, 100, 30, 'a', others);
    expect(y).toBe(150);
    expect(guideY).toBe(150);
  });

  it('snaps horizontal center to center of another overlay', () => {
    // Wide box (w=200) so its edges are far from the narrow candidate's edges
    const others = [{ id: 'b', canvasX: 50, canvasY: 100, canvasW: 200, canvasH: 30 }]; // centerX=150
    const { x, guideX } = snapPosition(108, 50, 80, 30, 'a', others); // centerX=148, only center aligns
    expect(x).toBe(110); // centerX snaps to 150 → left = 150 - 40 = 110
    expect(guideX).toBe(150);
  });

  it('snaps Y and X independently', () => {
    const others = [box('b', 200, 150)];
    const { x, y, guideX, guideY } = snapPosition(202, 153, 100, 30, 'a', others);
    expect(x).toBe(200);
    expect(y).toBe(150);
    expect(guideX).toBe(200);
    expect(guideY).toBe(150);
  });

  it('does not snap when distance exceeds threshold', () => {
    const others = [box('b', 200, 200)];
    const { x, y, guideX, guideY } = snapPosition(50, 50, 100, 30, 'a', others);
    expect(x).toBe(50);
    expect(y).toBe(50);
    expect(guideX).toBeNull();
    expect(guideY).toBeNull();
  });

  it('excludes the overlay being dragged from snap targets', () => {
    const self = box('a', 200, 200);
    const { x, guideX } = snapPosition(202, 50, 100, 30, 'a', [self]);
    expect(x).toBe(202); // self is excluded, nothing to snap to
    expect(guideX).toBeNull();
  });

  it('snaps to the closest target when multiple candidates exist', () => {
    const others = [box('b', 100, 100), box('c', 104, 200)];
    // candX=102 is 2px from b.left(100) and 2px from c.left(104) — both within threshold
    // should snap to whichever is closer
    const { x } = snapPosition(102, 50, 100, 30, 'a', others);
    expect([100, 104]).toContain(x);
  });
});
