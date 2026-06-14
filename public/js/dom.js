// Centralised DOM references, shared across modules.

const $ = id => document.getElementById(id);

export const uploadSection   = $('upload-section');
export const editorSection   = $('editor-section');
export const dropZone        = $('drop-zone');
export const fileInput       = $('file-input');
export const fieldsContainer = $('fields-container');
export const drawToolbar     = $('draw-toolbar');
export const drawHint        = $('draw-hint-text');
export const filenameEl      = $('filename');
export const downloadBtn     = $('download-btn');
export const prevBtn         = $('prev-page');
export const nextBtn         = $('next-page');
export const pageInfo        = $('page-info');
export const canvas          = $('pdf-canvas');
export const canvasWrapper   = $('canvas-wrapper');
export const changeFileBtn   = $('change-file-btn');

export const fontPopup       = $('font-popup');
export const fpBold          = $('fp-bold');
export const fpItalic        = $('fp-italic');
export const fpSize          = $('fp-size');
export const fpColor         = $('fp-color');

export const datePopup       = $('date-popup');
export const dpDate          = $('dp-date');
export const dpIncludeTime   = $('dp-include-time');
export const dpTime          = $('dp-time');

export const sigModal        = $('sig-modal');
export const sigCanvas       = $('sig-canvas');
export const sigClearBtn     = $('sig-clear');
export const sigCancelBtn    = $('sig-cancel');
export const sigConfirmBtn   = $('sig-confirm');
export const sigBackdrop     = $('sig-backdrop');
