// Signature modal: free-hand drawing on a canvas, confirm/cancel/clear.

import { state } from './state.js';
import { sigModal, sigCanvas, sigClearBtn, sigCancelBtn, sigConfirmBtn, sigBackdrop } from './dom.js';
import { renderOverlays } from './overlays.js';
import { scheduleSave } from './storage.js';

const sigCtx = sigCanvas.getContext('2d');

// Mutable modal/drawing state kept on a const object (no rebinding).
const sig = { drawing: false, lastX: 0, lastY: 0, pendingId: null, prevUrl: null };

export function openSigModal(overlayId) {
  sig.pendingId = overlayId;
  sig.prevUrl   = state.overlays.find(o => o.id === overlayId)?.dataUrl || null;
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  sigModal.hidden = false;
}

function sigCoords(src) {
  const r = sigCanvas.getBoundingClientRect();
  return {
    x: (src.clientX - r.left) * (sigCanvas.width  / r.width),
    y: (src.clientY - r.top)  * (sigCanvas.height / r.height),
  };
}

function strokeTo(point) {
  sigCtx.beginPath();
  sigCtx.moveTo(sig.lastX, sig.lastY);
  sigCtx.lineTo(point.x, point.y);
  sigCtx.stroke();
  sig.lastX = point.x;
  sig.lastY = point.y;
}

export function initSignature() {
  sigCtx.lineCap     = 'round';
  sigCtx.lineJoin    = 'round';
  sigCtx.strokeStyle = '#000';
  sigCtx.lineWidth   = 2;

  sigClearBtn.addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  });

  sigCancelBtn.addEventListener('click', () => {
    if (!sig.prevUrl) {
      state.overlays = state.overlays.filter(o => o.id !== sig.pendingId);
      renderOverlays();
    }
    sig.pendingId = sig.prevUrl = null;
    sigModal.hidden = true;
  });

  sigConfirmBtn.addEventListener('click', () => {
    const ov = state.overlays.find(o => o.id === sig.pendingId);
    if (ov) {
      ov.dataUrl = sigCanvas.toDataURL('image/png');
      renderOverlays();
      scheduleSave();
    }
    sig.pendingId = sig.prevUrl = null;
    sigModal.hidden = true;
  });

  sigBackdrop.addEventListener('click', () => sigCancelBtn.click());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !sigModal.hidden) sigCancelBtn.click();
  });

  sigCanvas.addEventListener('mousedown', e => {
    e.preventDefault();
    sig.drawing = true;
    ({ x: sig.lastX, y: sig.lastY } = sigCoords(e));
  });
  sigCanvas.addEventListener('mousemove', e => {
    if (!sig.drawing) return;
    strokeTo(sigCoords(e));
  });
  sigCanvas.addEventListener('mouseup',    () => { sig.drawing = false; });
  sigCanvas.addEventListener('mouseleave', () => { sig.drawing = false; });

  sigCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    sig.drawing = true;
    ({ x: sig.lastX, y: sig.lastY } = sigCoords(e.touches[0]));
  }, { passive: false });
  sigCanvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!sig.drawing) return;
    strokeTo(sigCoords(e.touches[0]));
  }, { passive: false });
  sigCanvas.addEventListener('touchend', () => { sig.drawing = false; }, { passive: false });
}
