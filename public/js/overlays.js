// Overlay lifecycle: creating, rendering, drawing/resizing, and shape SVGs.

import { state, currentStyle, SHAPE_TOOLS } from './state.js';
import { canvasWrapper } from './dom.js';
import { todayIso, formatDate, snapPosition } from './util.js';
import { syncPdfCoords } from './pdf-viewer.js';
import { scheduleSave, saveSync } from './storage.js';
import { showFontPopup, hideDatePopup, hidePopups } from './toolbar.js';
import { showDatePopup } from './date-picker.js';
import { openSigModal } from './signature.js';

// Shared drawing/resizing/moving state.
const drag = { drawing: false, drawStart: null, selEl: null, resizing: null, moving: null };

// ── Snap guides ──────────────────────────────────────────────────────────────
let guideH = null, guideV = null;

function ensureGuides() {
  if (!guideH) {
    guideH = document.createElement('div');
    guideH.className = 'snap-guide snap-guide-h';
    guideH.hidden = true;
    canvasWrapper.appendChild(guideH);
  }
  if (!guideV) {
    guideV = document.createElement('div');
    guideV.className = 'snap-guide snap-guide-v';
    guideV.hidden = true;
    canvasWrapper.appendChild(guideV);
  }
}

function showGuide(axis, pos) {
  ensureGuides();
  if (axis === 'h') { guideH.style.top  = pos + 'px'; guideH.hidden = false; }
  else              { guideV.style.left = pos + 'px'; guideV.hidden = false; }
}

function hideGuides() {
  if (guideH) guideH.hidden = true;
  if (guideV) guideV.hidden = true;
}

export async function createOverlay(canvasX, canvasY, canvasW, canvasH, tool) {
  const isShape = SHAPE_TOOLS.has(tool);
  const type = isShape ? 'shape' : tool; // 'text' | 'date' | 'signature' | 'shape'
  const id = Date.now() + Math.random();

  const overlay = {
    id, page: state.currentPage, type,
    shape:       isShape ? tool : undefined,
    canvasX, canvasY, canvasW, canvasH,
    pdfX: 0, pdfY: 0, pdfW: 0, pdfH: 0,
    text:        type === 'text' ? '' : type === 'date' ? formatDate(todayIso(), false, '') : undefined,
    date:        type === 'date' ? todayIso() : undefined,
    includeTime: type === 'date' ? false : undefined,
    time:        type === 'date' ? '' : undefined,
    dataUrl:     type === 'signature' ? null : undefined,
    style: { ...currentStyle },
  };

  state.overlays.push(overlay);
  await syncPdfCoords(id);
  renderOverlays();

  if (type === 'text') {
    requestAnimationFrame(() =>
      canvasWrapper.querySelector(`[data-id="${id}"] .overlay-input`)?.focus()
    );
  } else if (type === 'date') {
    requestAnimationFrame(() => {
      const el = canvasWrapper.querySelector(`[data-id="${id}"]`);
      if (el) { state.activeOverlayId = id; showDatePopup(el, overlay); }
    });
  } else if (type === 'signature') {
    openSigModal(id);
  }
  scheduleSave();
}

export function renderOverlays() {
  canvasWrapper.querySelectorAll('.overlay-field').forEach(el => el.remove());
  state.overlays.filter(o => o.page === state.currentPage).forEach(ov => {
    const div = document.createElement('div');
    div.className = 'overlay-field';
    div.dataset.id = ov.id;
    div.style.cssText = `left:${ov.canvasX}px;top:${ov.canvasY}px;width:${ov.canvasW}px;height:${ov.canvasH}px`;

    if (ov.type === 'shape') {
      div.appendChild(buildShapeSvg(ov.canvasW, ov.canvasH, ov.shape, ov.style));
      div.addEventListener('click', e => {
        if (e.target.closest('.overlay-delete, .overlay-handle')) return;
        canvasWrapper.querySelectorAll('.overlay-field.is-selected').forEach(el => el.classList.remove('is-selected'));
        div.classList.add('is-selected');
        state.activeOverlayId = ov.id;
        hideDatePopup();
        showFontPopup(div, ov);
      });

    } else if (ov.type === 'text') {
      const ta = document.createElement('textarea');
      ta.className = 'overlay-input';
      ta.value = ov.text;
      ta.style.overflow = 'hidden';
      applyStyleToTextarea(ta, ov.style);

      const autoGrow = () => {
        ta.style.height = 'auto';
        const newH = Math.max(28, ta.scrollHeight);
        if (newH !== ov.canvasH) {
          ov.canvasH = newH;
          div.style.height = newH + 'px';
          syncPdfCoords(ov.id);
        }
        ta.style.height = newH + 'px';
      };
      requestAnimationFrame(autoGrow);

      ta.addEventListener('focus', () => {
        state.activeOverlayId = ov.id;
        hideDatePopup();
        showFontPopup(div, ov);
      });
      ta.addEventListener('input', () => { ov.text = ta.value; autoGrow(); scheduleSave(); });
      ta.addEventListener('blur',  () => { ov.text = ta.value; saveSync(); });
      div.appendChild(ta);

    } else if (ov.type === 'date') {
      const display = document.createElement('div');
      display.className = 'overlay-date-display';
      display.textContent = ov.text || 'Click to set date';
      applyStyleToTextarea(display, ov.style);
      display.addEventListener('click', e => {
        if (e.target.closest('.overlay-delete, .overlay-handle')) return;
        canvasWrapper.querySelectorAll('.overlay-field.is-selected').forEach(el => el.classList.remove('is-selected'));
        div.classList.add('is-selected');
        state.activeOverlayId = ov.id;
        showFontPopup(div, ov);
        showDatePopup(div, ov);
      });
      div.appendChild(display);

    } else if (ov.type === 'signature') {
      if (ov.dataUrl) {
        const img = document.createElement('img');
        img.src = ov.dataUrl;
        img.className = 'overlay-sig-img';
        div.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'overlay-sig-placeholder';
        ph.textContent = 'Signing…';
        div.appendChild(ph);
      }
      div.addEventListener('click', e => {
        if (e.target.closest('.overlay-delete, .overlay-handle')) return;
        openSigModal(ov.id);
      });
    }

    // Move drag — anywhere on the overlay body.
    // Capture phase so we intercept before the textarea's own mousedown handler.
    div.addEventListener('mousedown', e => {
      if (e.target.closest('.overlay-delete, .overlay-handle')) return;
      if (e.target.tagName === 'TEXTAREA' && document.activeElement === e.target) {
        // Textarea already focused — let the browser handle mousedown normally
        // so the user can position the caret and select text.
        e.stopPropagation();
        return;
      }
      // Prevent browser cursor-positioning on first click; we focus manually on mouseup.
      if (e.target.tagName === 'TEXTAREA') e.preventDefault();
      e.stopPropagation();
      drag.moving = { overlayId: ov.id, startX: e.clientX, startY: e.clientY,
                      origX: ov.canvasX, origY: ov.canvasY,
                      active: false, wasTextarea: e.target.tagName === 'TEXTAREA' };
    }, true); // capture

    // Resize handles
    ['nw','ne','se','sw'].forEach(dir => {
      const h = document.createElement('div');
      h.className = 'overlay-handle';
      h.dataset.dir = dir;
      h.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        drag.resizing = { overlayId: ov.id, dir, startX: e.clientX, startY: e.clientY,
                          origX: ov.canvasX, origY: ov.canvasY, origW: ov.canvasW, origH: ov.canvasH };
        div.classList.add('is-resizing');
      });
      div.appendChild(h);
    });

    // Delete button
    const del = document.createElement('button');
    del.className = 'overlay-delete';
    del.innerHTML = '&times;';
    del.addEventListener('click', () => {
      state.overlays = state.overlays.filter(o => o.id !== ov.id);
      div.remove();
      if (state.activeOverlayId === ov.id) hidePopups();
      scheduleSave();
    });
    div.appendChild(del);
    canvasWrapper.appendChild(div);
  });
}

// ── Shape SVG ──────────────────────────────────────────────────────────────
function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function buildShapeSvg(w, h, shape, style) {
  const color = style?.color || '#000000';
  const sw    = 2;
  const svg   = svgEl('svg', { width: w, height: h, style: 'position:absolute;inset:0;pointer-events:none;overflow:visible' });

  if (shape === 'circle') {
    svg.appendChild(svgEl('ellipse', { cx: w/2, cy: h/2, rx: Math.max(1, w/2-sw), ry: Math.max(1, h/2-sw), fill: 'none', stroke: color, 'stroke-width': sw }));
  } else if (shape === 'rect') {
    svg.appendChild(svgEl('rect', { x: sw/2, y: sw/2, width: Math.max(1, w-sw), height: Math.max(1, h-sw), fill: 'none', stroke: color, 'stroke-width': sw }));
  } else if (shape === 'rect-round') {
    const rx = Math.min(10, w * 0.15, h * 0.15);
    svg.appendChild(svgEl('rect', { x: sw/2, y: sw/2, width: Math.max(1, w-sw), height: Math.max(1, h-sw), rx, ry: rx, fill: 'none', stroke: color, 'stroke-width': sw }));
  } else if (shape === 'cross') {
    const base = { stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' };
    svg.appendChild(svgEl('line', { ...base, x1: sw, y1: sw,   x2: w-sw, y2: h-sw }));
    svg.appendChild(svgEl('line', { ...base, x1: w-sw, y1: sw, x2: sw,   y2: h-sw }));
  } else if (shape === 'check') {
    svg.appendChild(svgEl('polyline', {
      points: `${sw},${h*0.55} ${w*0.35},${h-sw} ${w-sw},${sw}`,
      fill: 'none', stroke: color, 'stroke-width': sw,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }));
  }
  return svg;
}

export function refreshShapeSvg(el, ov) {
  el.querySelector('svg')?.replaceWith(buildShapeSvg(ov.canvasW, ov.canvasH, ov.shape, ov.style));
}

export function applyStyleToTextarea(ta, style) {
  ta.style.fontSize   = (style.fontSize || 11) + 'px';
  ta.style.color      = style.color  || '#000000';
  ta.style.fontWeight = style.bold   ? 'bold'   : 'normal';
  ta.style.fontStyle  = style.italic ? 'italic' : 'normal';
}

// Default dimensions for point-and-click tools
const CLICK_SIZE = { text: [180, 28], date: [150, 28], signature: [200, 72] };

// ── Drawing & resizing ───────────────────────────────────────────────────────
export function initOverlayDrag() {
  canvasWrapper.addEventListener('mousedown', async e => {
    if (!state.activeTool) return;
    if (e.target.closest('.overlay-field')) return;
    e.preventDefault();
    const r = canvasWrapper.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    // Text, date, signature: place immediately on click — no drag needed
    if (!SHAPE_TOOLS.has(state.activeTool)) {
      const [w, h] = CLICK_SIZE[state.activeTool] || [180, 28];
      await createOverlay(x, y, w, h, state.activeTool);
      return;
    }

    // Shapes: drag to define size
    drag.drawing   = true;
    drag.drawStart = { x, y };
    drag.selEl = document.createElement('div');
    drag.selEl.className = 'draw-selection';
    drag.selEl.style.cssText = `left:${x}px;top:${y}px;width:0;height:0`;
    canvasWrapper.appendChild(drag.selEl);
  });

  window.addEventListener('mousemove', e => {
    if (drag.moving) {
      const dx = e.clientX - drag.moving.startX;
      const dy = e.clientY - drag.moving.startY;
      // Only commit to a move once the pointer has travelled 4px — short of that, treat as click
      if (!drag.moving.active) {
        if (Math.hypot(dx, dy) < 4) return;
        drag.moving.active = true;
      }
      e.preventDefault(); // prevent text selection while dragging
      const ov = state.overlays.find(o => o.id === drag.moving.overlayId);
      if (!ov) return;
      const { x, y, guideX, guideY } = snapPosition(
        drag.moving.origX + dx, drag.moving.origY + dy, ov.canvasW, ov.canvasH, ov.id,
        state.overlays.filter(o => o.page === state.currentPage)
      );
      ov.canvasX = x; ov.canvasY = y;
      const el = canvasWrapper.querySelector(`[data-id="${drag.moving.overlayId}"]`);
      if (el) el.style.cssText = `left:${x}px;top:${y}px;width:${ov.canvasW}px;height:${ov.canvasH}px`;
      guideX !== null ? showGuide('v', guideX) : (guideV && (guideV.hidden = true));
      guideY !== null ? showGuide('h', guideY) : (guideH && (guideH.hidden = true));
      return;
    }
    if (drag.resizing) {
      const dx = e.clientX - drag.resizing.startX;
      const dy = e.clientY - drag.resizing.startY;
      const { origX, origY, origW, origH, dir } = drag.resizing;
      let x = origX, y = origY, w = origW, h = origH;
      if (dir.includes('e')) w = Math.max(20, origW + dx);
      if (dir.includes('s')) h = Math.max(20, origH + dy);
      if (dir.includes('w')) { x = origX + dx; w = Math.max(20, origW - dx); }
      if (dir.includes('n')) { y = origY + dy; h = Math.max(20, origH - dy); }
      const ov = state.overlays.find(o => o.id === drag.resizing.overlayId);
      if (ov) { ov.canvasX = x; ov.canvasY = y; ov.canvasW = w; ov.canvasH = h; }
      const el = canvasWrapper.querySelector(`[data-id="${drag.resizing.overlayId}"]`);
      if (el) {
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
        if (ov?.type === 'shape') refreshShapeSvg(el, ov);
      }
      return;
    }
    if (!drag.drawing || !drag.selEl) return;
    const r    = canvasWrapper.getBoundingClientRect();
    const cx   = e.clientX - r.left;
    const cy   = e.clientY - r.top;
    drag.selEl.style.cssText = `left:${Math.min(cx,drag.drawStart.x)}px;top:${Math.min(cy,drag.drawStart.y)}px;width:${Math.abs(cx-drag.drawStart.x)}px;height:${Math.abs(cy-drag.drawStart.y)}px`;
  });

  window.addEventListener('mouseup', async () => {
    if (drag.moving) {
      if (drag.moving.active) {
        await syncPdfCoords(drag.moving.overlayId);
        hideGuides();
        scheduleSave();
      } else if (drag.moving.wasTextarea) {
        // Plain click on a text overlay — focus the textarea so the user can type
        canvasWrapper.querySelector(`[data-id="${drag.moving.overlayId}"] .overlay-input`)?.focus();
      }
      drag.moving = null;
      return;
    }
    if (drag.resizing) {
      const el = canvasWrapper.querySelector(`[data-id="${drag.resizing.overlayId}"]`);
      if (el) el.classList.remove('is-resizing');
      await syncPdfCoords(drag.resizing.overlayId);
      drag.resizing = null;
      scheduleSave();
      return;
    }
    if (!drag.drawing) return;
    drag.drawing = false;
    const left = parseFloat(drag.selEl.style.left);
    const top  = parseFloat(drag.selEl.style.top);
    const w    = parseFloat(drag.selEl.style.width)  || 0;
    const h    = parseFloat(drag.selEl.style.height) || 0;
    drag.selEl.remove(); drag.selEl = null;
    if (w < 10 || h < 10) return;
    await createOverlay(left, top, w, h, state.activeTool || 'text');
  });
}
