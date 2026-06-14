// PDF rendering, page navigation, form-field detection, and overlay coordinate sync.

import { state, RENDER_SCALE } from './state.js';
import {
  canvas, pageInfo, prevBtn, nextBtn,
  fieldsContainer, drawToolbar,
} from './dom.js';
import { renderOverlays } from './overlays.js';
import { scheduleSave } from './storage.js';

export async function loadPdfViewer(initialPage = 1) {
  state.pdfDoc      = await pdfjsLib.getDocument(`/api/pdf/${state.fileId}`).promise;
  state.totalPages  = state.pdfDoc.numPages;
  state.currentPage = Math.min(initialPage, state.pdfDoc.numPages);
  await renderPage(state.currentPage);
}

export async function renderPage(num) {
  const page     = await state.pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  pageInfo.textContent = `Page ${num} of ${state.totalPages}`;
  prevBtn.disabled = num <= 1;
  nextBtn.disabled = num >= state.totalPages;
  renderOverlays();
}

// Convert an overlay's canvas-space rect into PDF-space coordinates.
export async function syncPdfCoords(overlayId) {
  const ov = state.overlays.find(o => o.id === overlayId);
  if (!ov) return;
  const viewport = (await state.pdfDoc.getPage(ov.page)).getViewport({ scale: 1 });
  ov.pdfX        = ov.canvasX / RENDER_SCALE;
  ov.pdfY        = viewport.height - (ov.canvasY + ov.canvasH) / RENDER_SCALE;
  ov.pdfW        = ov.canvasW / RENDER_SCALE;
  ov.pdfH        = ov.canvasH / RENDER_SCALE;
  ov.pdfFontSize = (ov.style?.fontSize || 11) / RENDER_SCALE;
}

export async function loadFields(restoring = false) {
  fieldsContainer.innerHTML = '<p class="loading">Detecting form fields…</p>';
  const res = await fetch(`/api/fields/${state.fileId}`);
  const { fields = [] } = res.ok ? await res.json() : {};

  if (!fields.length) {
    state.mode = 'overlay';
    fieldsContainer.innerHTML = '<p class="no-fields">No interactive form fields. Use the tools on the left to annotate the document.</p>';
    drawToolbar.hidden = false;
    return;
  }

  state.mode = 'form';
  drawToolbar.hidden = true;
  fieldsContainer.innerHTML = '';
  fields.forEach(({ name }) => {
    const group = document.createElement('div');
    group.className = 'field-group';
    const label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = name;
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'field-input'; input.dataset.name = name;
    input.placeholder = 'Enter text…';
    if (restoring && state.fieldValues[name]) input.value = state.fieldValues[name];
    input.addEventListener('input', () => { state.fieldValues[name] = input.value; scheduleSave(); });
    group.append(label, input);
    fieldsContainer.appendChild(group);
  });
}

export function initPageControls() {
  prevBtn.addEventListener('click', async () => {
    if (state.currentPage > 1) { state.currentPage--; await renderPage(state.currentPage); scheduleSave(); }
  });
  nextBtn.addEventListener('click', async () => {
    if (state.currentPage < state.totalPages) { state.currentPage++; await renderPage(state.currentPage); scheduleSave(); }
  });
}
