// Leonida Trophy Atlas — saved progress: localStorage only, with export to
// a file, import back from one, and reset. Nothing ever leaves the browser.
import { DEMO_EARNED, STORAGE_KEY } from './config.js';

export function blankProgress() {
  return { earned: {}, notes: {} };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blankProgress();
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch {
    return blankProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: the in-memory copy still works for the session.
  }
}

export function demoProgress() {
  const earned = {};
  for (const id of DEMO_EARNED) earned[id] = true;
  return { earned, notes: {} };
}

export function exportProgress(progress) {
  const blob = new Blob(
    [JSON.stringify({ app: 'leonida-trophy-atlas', version: 1, ...progress }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-trophy-atlas-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importProgress(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not a progress file');
  const earned = parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {};
  const notes = parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};
  const clean = { earned: {}, notes: {} };
  for (const [id, value] of Object.entries(earned)) {
    if (value) clean.earned[Number(id)] = true;
  }
  for (const [id, value] of Object.entries(notes)) {
    if (typeof value === 'string' && value.trim()) clean.notes[Number(id)] = value;
  }
  return clean;
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored, nothing to remove.
  }
  return blankProgress();
}
