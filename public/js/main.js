// Entry point: configure pdf.js, wire every module, and own upload/restore flow.

import { state, STORAGE_KEY, resetState } from './state.js';
import {
  uploadSection, editorSection, dropZone, fileInput,
  filenameEl, changeFileBtn,
} from './dom.js';
import {
  restoreSession, saveSync, clearSession, blobToBase64,
} from './storage.js';
import { loadPdfViewer, loadFields, initPageControls } from './pdf-viewer.js';
import { initOverlayDrag } from './overlays.js';
import { initToolbar, initFontPopup, hidePopups } from './toolbar.js';
import { initDatePicker } from './date-picker.js';
import { initSignature } from './signature.js';
import { initDownload } from './download.js';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── Upload ─────────────────────────────────────────────────────────────────
async function uploadFile(file) {
  const fData = new FormData();
  fData.append('pdf', file);
  dropZone.innerHTML = '<p style="color:var(--muted)">Uploading…</p>';
  const res = await fetch('/api/upload', { method: 'POST', body: fData });
  if (!res.ok) {
    dropZone.innerHTML = '<p style="color:var(--danger,#c0392b)">Upload failed — please try again.</p>';
    return;
  }
  const { fileId, originalName } = await res.json();
  state.fileId = fileId; state.originalName = originalName; state.pdfBase64 = null;
  // Await pdfBase64 before showing editor so saveSync never bails on beforeunload.
  try {
    const blob = await fetch(`/api/pdf/${fileId}`).then(r => r.blob());
    state.pdfBase64 = await blobToBase64(blob);
  } catch { /* base64 unavailable — persistSession will retry later */ }
  uploadSection.hidden = true;
  editorSection.hidden = false;
  filenameEl.textContent = originalName;
  await Promise.all([loadPdfViewer(1), loadFields(false)]);
}

function initUpload() {
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') uploadFile(f);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) uploadFile(fileInput.files[0]); });

  changeFileBtn.addEventListener('click', () => {
    clearSession();
    resetState();
    fileInput.value = '';
    hidePopups();
    editorSection.hidden = true;
    uploadSection.hidden = false;
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
initUpload();
initPageControls();
initToolbar();
initFontPopup();
initDatePicker();
initSignature();
initDownload();
initOverlayDrag();

window.addEventListener('beforeunload', saveSync);

// Module scripts are deferred, so the DOM is already parsed here — restore the
// previous session immediately rather than waiting on DOMContentLoaded (which
// may have already fired).
(async () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    await restoreSession(JSON.parse(raw));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
})();
