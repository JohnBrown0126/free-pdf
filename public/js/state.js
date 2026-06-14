// Shared application state and constants.
// `state` and `currentStyle` are const objects whose properties are mutated in
// place — this keeps a single shared instance across modules without rebinding.

export const RENDER_SCALE = 1.5;
export const STORAGE_KEY  = 'free-pdf-session';
export const SHAPE_TOOLS  = new Set(['circle', 'cross', 'check', 'rect', 'rect-round']);

export const TOOL_HINTS = {
  text:         'Drag to place a text field',
  date:         'Drag to place a date field',
  signature:    'Drag to place a signature',
  circle:       'Drag to draw a circle',
  cross:        'Drag to draw a cross',
  check:        'Drag to draw a checkmark',
  rect:         'Drag to draw a rectangle',
  'rect-round': 'Drag to draw a rounded rectangle',
};

export const currentStyle = { fontSize: 11, bold: false, italic: false, color: '#000000' };

export const state = {
  fileId:          null,
  originalName:    null,
  pdfDoc:          null,
  currentPage:     1,
  totalPages:      0,
  mode:            'form',
  fieldValues:     {},
  overlays:        [],
  activeOverlayId: null,
  activeTool:      null,
  pdfBase64:       null,
};

// Reset state back to its initial shape (used when switching files).
export function resetState() {
  Object.assign(state, {
    fileId: null, originalName: null, pdfDoc: null, currentPage: 1,
    totalPages: 0, mode: 'form', fieldValues: {}, overlays: [],
    activeOverlayId: null, activeTool: null, pdfBase64: null,
  });
}
