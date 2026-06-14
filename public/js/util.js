// Pure helpers — no DOM deps.

export function todayIso() { return new Date().toISOString().slice(0, 10); }

export function formatDate(dateStr, includeTime, timeStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !d || m < 1 || m > 12) return dateStr;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const base = `${d} ${months[m - 1]} ${y}`;
  return (includeTime && timeStr) ? `${base} ${timeStr}` : base;
}

const SNAP_THRESHOLD = 6;

export function snapPosition(candX, candY, w, h, excludeId, overlays) {
  const others = overlays.filter(o => o.id !== excludeId);
  const fromX = [candX, candX + w / 2, candX + w];
  const fromY = [candY, candY + h / 2, candY + h];
  const offsetX = [0, w / 2, w];
  const offsetY = [0, h / 2, h];
  let snapX = null, snapY = null, minDX = SNAP_THRESHOLD, minDY = SNAP_THRESHOLD;

  for (const o of others) {
    const toX = [o.canvasX, o.canvasX + o.canvasW / 2, o.canvasX + o.canvasW];
    const toY = [o.canvasY, o.canvasY + o.canvasH / 2, o.canvasY + o.canvasH];
    for (let i = 0; i < 3; i++) {
      for (const tx of toX) {
        const d = Math.abs(fromX[i] - tx);
        if (d < minDX) { minDX = d; snapX = { x: tx - offsetX[i], guide: tx }; }
      }
      for (const ty of toY) {
        const d = Math.abs(fromY[i] - ty);
        if (d < minDY) { minDY = d; snapY = { y: ty - offsetY[i], guide: ty }; }
      }
    }
  }
  return {
    x: snapX ? snapX.x : candX, y: snapY ? snapY.y : candY,
    guideX: snapX?.guide ?? null, guideY: snapY?.guide ?? null,
  };
}
