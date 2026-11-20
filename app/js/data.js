// data.js — loads the guide's data files (all local, no network) and offers
// small lookups the views share: sources by number, trophies by id, and the
// citation chips each step renders.

export async function loadGuideData() {
  const [trophiesDoc, sourcesDoc, roadmapDoc] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/sources.json').then((r) => r.json()),
    fetch('data/roadmap.json').then((r) => r.json()),
  ]);
  const trophies = trophiesDoc.trophies;
  const sources = sourcesDoc.sources;
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  return { trophies, sources, roadmap: roadmapDoc, unread: sourcesDoc.unread || [], byId, sourceById };
}

// The sources a trophy's steps cite, in first-use order.
export function trophySources(trophy) {
  const seen = [];
  for (const step of trophy.steps || []) {
    for (const n of step.cites || []) {
      if (!seen.includes(n)) seen.push(n);
    }
  }
  return seen;
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function missableLabel(status) {
  if (status === 'missable') return 'Missable';
  if (status === 'time-sensitive') return 'Time-sensitive';
  if (status === 'watch') return 'Watch';
  return 'Not missable';
}

export function kindLabel(kind) {
  const labels = {
    platinum: 'Platinum',
    story: 'Story',
    stranger: 'Stranger',
    activity: 'Activity',
    collectible: 'Collectible',
    crime: 'Crime',
    feat: 'Feat',
    money: 'Money',
    completion: '100%',
  };
  return labels[kind] || kind;
}

// Escape text for insertion into HTML. Trophy names and descriptions come
// from the data files, but escaping keeps the renderer honest regardless.
export function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
