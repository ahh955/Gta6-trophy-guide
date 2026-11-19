// Leonida Trophy Atlas — data access: loads app/data/trophies.json (the only
// file the app fetches, and it is local) and the small helpers every view
// needs: PSN rarity bands, PSN points and lookup by id.
import { GRADE_POINTS } from './config.js';

export async function loadTrophies() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('trophies.json did not load');
  const data = await res.json();
  return data;
}

// PSN's rarity bands, from the Exophase earn rate.
export function rarityBand(rarity) {
  if (rarity >= 50) return 'Common';
  if (rarity >= 20) return 'Uncommon';
  if (rarity >= 5) return 'Rare';
  if (rarity >= 1) return 'Very Rare';
  return 'Ultra Rare';
}

export function trophyPoints(trophy) {
  return GRADE_POINTS[trophy.grade] ?? 0;
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id) ?? null;
}

export function earnedCount(progress) {
  return Object.keys(progress.earned ?? {}).filter((id) => progress.earned[id]).length;
}

export function earnedPoints(trophies, progress) {
  return trophies.reduce(
    (sum, t) => sum + (progress.earned?.[t.id] ? trophyPoints(t) : 0),
    0,
  );
}
