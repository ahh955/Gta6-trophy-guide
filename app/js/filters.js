// Leonida Trophy Atlas — filtering, searching and sorting the trophy list.
import { GRADES } from './config.js';

// Every filter is optional: 'all' means no constraint on that axis.
export function applyFilters(trophies, filters, progress) {
  const query = (filters.query ?? '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind && filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade && filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !progress.earned?.[t.id]) return false;
    if (filters.status === 'remaining' && progress.earned?.[t.id]) return false;
    if (filters.status === 'missable' && !t.missable) return false;
    if (filters.status === 'unconfirmed' && !t.unconfirmed) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

const GRADE_RANK = Object.fromEntries(GRADES.map((g, i) => [g, i]));

// Four sort orders: roadmap (stage, then list order), A–Z, rarest first
// (lowest Exophase earn rate first), and grade (platinum down to bronze).
export function sortTrophies(list, sort) {
  const copy = [...list];
  if (sort === 'az') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'rarest') {
    copy.sort((a, b) => a.rarity - b.rarity || a.id - b.id);
  } else if (sort === 'grade') {
    copy.sort(
      (a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.rarity - b.rarity,
    );
  } else {
    copy.sort((a, b) => a.stage - b.stage || a.id - b.id);
  }
  return copy;
}
