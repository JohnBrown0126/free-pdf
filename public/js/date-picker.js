// Date field popup: show/hide and write selected date back to the overlay.

import { state } from './state.js';
import { canvasWrapper, datePopup, dpDate, dpIncludeTime, dpTime } from './dom.js';
import { todayIso, formatDate } from './util.js';
import { applyStyleToTextarea } from './overlays.js';
import { positionPopup } from './toolbar.js';
import { scheduleSave } from './storage.js';

export function showDatePopup(overlayEl, ov) {
  dpDate.value          = ov.date || todayIso();
  dpIncludeTime.checked = ov.includeTime || false;
  dpTime.value          = ov.time || '';
  dpTime.hidden         = !dpIncludeTime.checked;
  datePopup.hidden = false;
  positionPopup(datePopup, overlayEl, 'below');
}

function applyDateToOverlay(ov) {
  ov.date        = dpDate.value;
  ov.includeTime = dpIncludeTime.checked;
  ov.time        = dpTime.value;
  ov.text        = formatDate(ov.date, ov.includeTime, ov.time);
  const el = canvasWrapper.querySelector(`[data-id="${ov.id}"] .overlay-date-display`);
  if (el) {
    el.textContent = ov.text || 'Click to set date';
    applyStyleToTextarea(el, ov.style);
  }
  scheduleSave();
}

export function initDatePicker() {
  dpDate.addEventListener('change', () => {
    const ov = state.overlays.find(o => o.id === state.activeOverlayId);
    if (ov?.type === 'date') applyDateToOverlay(ov);
  });
  dpIncludeTime.addEventListener('change', () => {
    dpTime.hidden = !dpIncludeTime.checked;
    const ov = state.overlays.find(o => o.id === state.activeOverlayId);
    if (ov?.type === 'date') applyDateToOverlay(ov);
  });
  dpTime.addEventListener('change', () => {
    const ov = state.overlays.find(o => o.id === state.activeOverlayId);
    if (ov?.type === 'date') applyDateToOverlay(ov);
  });
}
