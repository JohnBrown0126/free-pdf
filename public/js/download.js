// Generate and download the filled/annotated PDF.

import { state } from './state.js';
import { downloadBtn } from './dom.js';

export function initDownload() {
  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Generating…';

    const reset = () => {
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download filled PDF';
    };

    try {
      const isOverlay = state.mode === 'overlay';
      const res = await fetch(isOverlay ? `/api/overlay/${state.fileId}` : `/api/fill/${state.fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isOverlay ? { overlays: state.overlays } : { fields: state.fieldValues }),
      });

      if (!res.ok) {
        downloadBtn.textContent = 'Download failed — try again';
        setTimeout(reset, 3000);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = (state.originalName || 'document.pdf').replace(/\.pdf$/i, '-filled.pdf');
      a.click();
      URL.revokeObjectURL(url);
      reset();
    } catch {
      downloadBtn.textContent = 'Download failed — try again';
      setTimeout(reset, 3000);
    }
  });
}
