// Session persistence to localStorage and restore-from-storage.

import { state, STORAGE_KEY } from './state.js';
import { uploadSection, editorSection, filenameEl } from './dom.js';
import { loadPdfViewer, loadFields } from './pdf-viewer.js';

// Holds the debounce handle in a property so the binding itself stays const.
const saveState = { timer: null };

export function scheduleSave() {
  clearTimeout(saveState.timer);
  saveState.timer = setTimeout(persistSession, 600);
}

export function saveSync() {
  if (!state.fileId) return;
  if (!state.pdfBase64) return; // pdfBase64 not ready yet — skip rather than persist a broken session
  const payload = {
    originalName: state.originalName,
    mode:         state.mode,
    fieldValues:  state.fieldValues,
    overlays:     state.overlays,
    currentPage:  state.currentPage,
    pdfBase64:    state.pdfBase64,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch { console.warn('localStorage quota exceeded — session not saved'); }
}

export async function persistSession() {
  if (!state.fileId) return;
  if (!state.pdfBase64) {
    try {
      const blob = await fetch(`/api/pdf/${state.fileId}`).then(r => r.blob());
      state.pdfBase64 = await blobToBase64(blob);
    } catch { return; }
  }
  saveSync();
}

export function clearSession() { localStorage.removeItem(STORAGE_KEY); }

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function restoreSession(data) {
  const bytes = Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0));
  const file  = new File([bytes], data.originalName, { type: 'application/pdf' });
  const fData = new FormData();
  fData.append('pdf', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fData });
  if (!res.ok) throw new Error('Re-upload failed');
  const { fileId } = await res.json();
  state.fileId       = fileId;
  state.originalName = data.originalName;
  state.mode         = data.mode;
  state.fieldValues  = data.fieldValues  || {};
  // Normalise legacy overlays that predate the `type` field.
  state.overlays     = (data.overlays || []).map(o => ({ ...o, type: o.type || 'text' }));
  state.currentPage  = data.currentPage  || 1;
  state.pdfBase64    = data.pdfBase64;
  await loadPdfViewer(state.currentPage);
  await loadFields(true);
  uploadSection.hidden = true;
  editorSection.hidden = false;
  filenameEl.textContent = state.originalName;
}
