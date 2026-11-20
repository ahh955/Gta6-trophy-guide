// store.js — progress state: the earned set lives in localStorage, can be
// exported to a JSON file and imported back, and can arrive through a shared
// link (#earned=t02,t03 loads ticks like an import).

export const STORAGE_KEY = 'leonida-ledger-r2-earned-v1';
export const SPOILER_KEY = 'leonida-ledger-r2-spoilers-v1';

// Demo seed for screenshots: 13 trophies pre-earned, spread across the list.
export const DEMO_EARNED = [2, 3, 8, 16, 20, 21, 28, 32, 35, 42, 44, 53, 55];

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or blocked: progress still works for this session.
  }
}

export function loadSpoilersHidden() {
  try {
    return localStorage.getItem(SPOILER_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveSpoilersHidden(hidden) {
  try {
    localStorage.setItem(SPOILER_KEY, hidden ? 'on' : 'off');
  } catch {
    // Ignore: the toggle still works for this session.
  }
}

export function exportProgress(earned) {
  return JSON.stringify(
    {
      app: 'leonida-ledger-r2',
      exported: new Date().toISOString().slice(0, 10),
      earned: [...earned].sort((a, b) => a - b),
    },
    null,
    2,
  );
}

// Accepts our own export shape, or a bare array of trophy ids.
export function importProgress(text) {
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) throw new Error('No earned list found in that file.');
  const ids = list.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
  if (ids.length === 0 && list.length > 0) throw new Error('No valid trophy ids in that file.');
  return new Set(ids);
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Deep links live in the hash: #view=roadmap&t=t28&filter=missable and
// #earned=t02,t03 (a shared-progress link that loads ticks like an import).
export function parseHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const out = { view: params.get('view') || 'tracker', trophy: null, filter: params.get('filter') || null, earned: null };
  const t = params.get('t');
  if (t) {
    const n = Number(t.replace(/^t0*/, ''));
    if (Number.isInteger(n) && n >= 1 && n <= 55) out.trophy = n;
  }
  const e = params.get('earned');
  if (e) {
    const ids = e.split(',').map((x) => Number(x.replace(/^t0*/, ''))).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
    if (ids.length) out.earned = new Set(ids);
  }
  return out;
}

export function buildHash(view, trophyId, filter) {
  const params = new URLSearchParams();
  if (view && view !== 'tracker') params.set('view', view);
  if (trophyId) params.set('t', `t${String(trophyId).padStart(2, '0')}`);
  if (filter) params.set('filter', filter);
  const s = params.toString();
  return s ? `#${s}` : '#';
}

export function shareLink(earned) {
  const ids = [...earned].sort((a, b) => a - b).map((n) => `t${String(n).padStart(2, '0')}`).join(',');
  const base = `${window.location.origin}${window.location.pathname}`;
  return ids ? `${base}#earned=${ids}` : base;
}
