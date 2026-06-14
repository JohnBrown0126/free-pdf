'use strict';

const BORDER_WIDTH = 1.5;

function roundedRectPath(x, y, w, h) {
  const r = Math.min(8, w * 0.15, h * 0.15);
  return `M ${x+r} ${y} L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r} L ${x+w} ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h} L ${x+r} ${y+h} Q ${x} ${y+h} ${x} ${y+h-r} L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
}

const SHAPE_DRAWERS = {
  rect: (page, { x, y, w, h, color }) =>
    page.drawRectangle({ x, y, width: w, height: h, borderColor: color, borderWidth: BORDER_WIDTH }),

  'rect-round': (page, { x, y, w, h, color }) =>
    page.drawSvgPath(roundedRectPath(x, y, w, h), { borderColor: color, borderWidth: BORDER_WIDTH }),

  circle: (page, { x, y, w, h, color }) =>
    page.drawEllipse({
      x: x + w / 2, y: y + h / 2,
      xScale: w / 2 - BORDER_WIDTH / 2, yScale: h / 2 - BORDER_WIDTH / 2,
      borderColor: color, borderWidth: BORDER_WIDTH,
    }),

  cross: (page, { x, y, w, h, color }) => {
    page.drawLine({ start: { x, y: y + h }, end: { x: x + w, y }, color, thickness: BORDER_WIDTH });
    page.drawLine({ start: { x: x + w, y: y + h }, end: { x, y }, color, thickness: BORDER_WIDTH });
  },

  check: (page, { x, y, w, h, color }) => {
    page.drawLine({ start: { x, y: y + h * 0.45 }, end: { x: x + w * 0.35, y: y + h * 0.05 }, color, thickness: BORDER_WIDTH });
    page.drawLine({ start: { x: x + w * 0.35, y: y + h * 0.05 }, end: { x: x + w, y: y + h * 0.9 }, color, thickness: BORDER_WIDTH });
  },
};

function drawShape(page, shape, geometry) {
  return SHAPE_DRAWERS[shape]?.(page, geometry);
}

module.exports = { roundedRectPath, SHAPE_DRAWERS, drawShape, BORDER_WIDTH };
