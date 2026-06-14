// Tool selection, draw hint, and the font-style popup.

import { state, currentStyle, TOOL_HINTS } from './state.js';
import {
  drawToolbar, drawHint, canvasWrapper,
  fontPopup, fpBold, fpItalic, fpSize, fpColor,
  datePopup,
} from './dom.js';
import { refreshShapeSvg, applyStyleToTextarea } from './overlays.js';
import { scheduleSave } from './storage.js';

// ── Popup positioning (shared by font + date popups) ─────────────────────────
export function positionPopup(popupEl, overlayEl, placement) {
  const r      = overlayEl.getBoundingClientRect();
  const margin = 6;
  if (placement === 'below') {
    const ph  = popupEl.offsetHeight || 80;
    const top = Math.min(r.bottom + margin, window.innerHeight - ph - 8);
    popupEl.style.left = `${Math.max(8, r.left)}px`;
    popupEl.style.top  = `${Math.max(8, top)}px`;
  } else {
    const ph  = popupEl.offsetHeight || 40;
    const top = r.top - ph - margin < 8 ? r.bottom + margin : r.top - ph - margin;
    popupEl.style.left = `${Math.max(8, r.left)}px`;
    popupEl.style.top  = `${top}px`;
  }
}

// ── Font popup ───────────────────────────────────────────────────────────────
export function showFontPopup(overlayEl, overlay) {
  const isShape = overlay.type === 'shape';
  fontPopup.classList.toggle('shape-mode', isShape);
  fpBold.classList.toggle('active',   !isShape && overlay.style.bold);
  fpItalic.classList.toggle('active', !isShape && overlay.style.italic);
  fpSize.value  = overlay.style.fontSize || 11;
  fpColor.value = overlay.style.color    || '#000000';
  fontPopup.hidden = false;
  positionPopup(fontPopup, overlayEl, 'above');
}

export function hideFontPopup() { fontPopup.hidden = true; }
export function hideDatePopup() { datePopup.hidden = true; }

export function hidePopups() {
  hideFontPopup();
  hideDatePopup();
  state.activeOverlayId = null;
  canvasWrapper.querySelectorAll('.overlay-field.is-selected').forEach(el => el.classList.remove('is-selected'));
}

function updateActiveStyle(patch) {
  const ov = state.overlays.find(o => o.id === state.activeOverlayId);
  if (!ov) return;
  Object.assign(ov.style, patch);
  Object.assign(currentStyle, patch);
  const el = canvasWrapper.querySelector(`[data-id="${ov.id}"]`);
  if (ov.type === 'shape') {
    refreshShapeSvg(el, ov);
  } else if (ov.type === 'date') {
    applyStyleToTextarea(el?.querySelector('.overlay-date-display'), ov.style);
  } else {
    applyStyleToTextarea(el?.querySelector('.overlay-input'), ov.style);
  }
  scheduleSave();
}

export function initToolbar() {
  drawToolbar.addEventListener('click', e => {
    const btn = e.target.closest('.tool-btn');
    if (!btn) return;
    const tool = btn.dataset.tool;
    if (state.activeTool === tool) {
      state.activeTool = null;
      btn.classList.remove('active');
      canvasWrapper.classList.remove('draw-mode');
      drawHint.classList.remove('visible');
    } else {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      state.activeTool = tool;
      btn.classList.add('active');
      canvasWrapper.classList.add('draw-mode');
      drawHint.textContent = TOOL_HINTS[tool];
      drawHint.classList.add('visible');
    }
  });
}

export function initFontPopup() {
  document.addEventListener('mousedown', e => {
    const inOverlay   = e.target.closest('.overlay-field');
    const inFontPopup = e.target.closest('#font-popup');
    const inDatePopup = e.target.closest('#date-popup');
    if (!inOverlay && !inFontPopup && !inDatePopup) {
      hidePopups();
    } else if (inOverlay && !inFontPopup && !inDatePopup) {
      const ov = state.overlays.find(o => String(o.id) === inOverlay.dataset.id);
      if (ov?.type !== 'date') hideDatePopup();
    }
  });
  fontPopup.addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON') e.preventDefault(); });

  fpBold.addEventListener('click', () => {
    const ov = state.overlays.find(o => o.id === state.activeOverlayId);
    if (!ov || ov.type === 'shape') return;
    updateActiveStyle({ bold: !ov.style.bold });
    fpBold.classList.toggle('active', ov.style.bold);
  });
  fpItalic.addEventListener('click', () => {
    const ov = state.overlays.find(o => o.id === state.activeOverlayId);
    if (!ov || ov.type === 'shape') return;
    updateActiveStyle({ italic: !ov.style.italic });
    fpItalic.classList.toggle('active', ov.style.italic);
  });
  fpSize.addEventListener('change', () => {
    const ov = state.overlays.find(o => o.id === state.activeOverlayId);
    if (!ov || ov.type === 'shape') return;
    const size = Math.min(96, Math.max(6, parseInt(fpSize.value) || 11));
    fpSize.value = size;
    updateActiveStyle({ fontSize: size });
  });
  fpColor.addEventListener('input', () => updateActiveStyle({ color: fpColor.value }));
}
