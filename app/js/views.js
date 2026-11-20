// views.js — the tracker list, the trophy detail pane, and the missables
// view. Spoiler masking hides hidden trophies' names and descriptions until
// they are earned (or the reader reveals one), and the detail pane shows the
// numbered, cited steps plus gate, dispute and missable notes.

import { esc, gradeLabel, kindLabel, missableLabel, trophySources } from './data.js';

function gradeBadge(t) {
  return `<span class="grade-badge grade-${t.grade}" title="${gradeLabel(t.grade)}">${t.grade === 'platinum' ? 'P' : t.grade === 'gold' ? 'G' : t.grade === 'silver' ? 'S' : 'B'}</span>`;
}

function flagsFor(t) {
  const flags = [];
  if (t.missable === 'missable') flags.push('<span class="flag flag-missable">Missable</span>');
  if (t.missable === 'time-sensitive') flags.push('<span class="flag flag-timed">Time-sensitive</span>');
  if (t.missable === 'watch') flags.push('<span class="flag flag-watch">Watch</span>');
  if (t.unconfirmed) flags.push('<span class="flag flag-unconfirmed">Unconfirmed</span>');
  if (t.dispute) flags.push('<span class="flag flag-dispute">Sources disagree</span>');
  return flags.join('');
}

function hiddenName(t, spoilersHidden, earned) {
  if (!t.hidden || !spoilersHidden || earned) return esc(t.name);
  return '<span class="spoiler-hidden">Hidden trophy — click to reveal</span>';
}

function hiddenDescription(t, spoilersHidden, earned) {
  if (!t.hidden || !spoilersHidden || earned) return esc(t.description);
  return '<span class="spoiler-hidden">Hidden until earned</span>';
}

export function renderTrackerList(el, trophies, state, callbacks) {
  const { earned, spoilersHidden, filters, selectedId } = state;
  const list = trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.stage !== 'all' && t.stage !== Number(filters.stage)) return false;
    if (filters.missable === 'missable' && t.missable === 'no') return false;
    if (filters.missable === 'hidden' && !t.hidden) return false;
    if (filters.missable === 'unconfirmed' && !t.unconfirmed) return false;
    if (filters.missable === 'dispute' && !t.dispute) return false;
    if (filters.status === 'earned' && !earned.has(t.id)) return false;
    if (filters.status === 'remaining' && earned.has(t.id)) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const sorted = list.slice().sort((a, b) => {
    if (filters.sort === 'az') return a.name.localeCompare(b.name);
    if (filters.sort === 'rarest') return (a.rarity ?? 99) - (b.rarity ?? 99);
    if (filters.sort === 'grade') {
      const order = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
      return order[a.grade] - order[b.grade] || a.id - b.id;
    }
    return a.stage - b.stage || a.id - b.id;
  });
  if (sorted.length === 0) {
    el.innerHTML = '<p class="empty">No trophies match these filters. Clear the search or pick another filter.</p>';
    return;
  }
  el.innerHTML = sorted
    .map(
      (t) => `<article class="trophy-row ${earned.has(t.id) ? 'earned' : ''} ${selectedId === t.id ? 'selected' : ''}" data-id="${t.id}">
        <label class="trophy-check"><input type="checkbox" data-earn="${t.id}" ${earned.has(t.id) ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned"><span class="check-box"></span></label>
        <button type="button" class="trophy-main" data-open="${t.id}">
          <span class="trophy-top">${gradeBadge(t)}<span class="trophy-name">${hiddenName(t, spoilersHidden, earned.has(t.id))}</span><span class="trophy-kind">${kindLabel(t.kind)}</span><span class="trophy-rarity" title="Earn rate on Exophase, read 20 Nov 2026">${t.rarity}%</span></span>
          <span class="trophy-desc">${hiddenDescription(t, spoilersHidden, earned.has(t.id))}</span>
          <span class="trophy-flags">${flagsFor(t)}</span>
        </button>
      </article>`,
    )
    .join('');
  el.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => callbacks.onOpen(Number(btn.closest('.trophy-row').dataset.id)));
  });
  el.querySelectorAll('[data-earn]').forEach((box) => {
    box.addEventListener('change', () => callbacks.onToggle(Number(box.dataset.earn), box.checked));
  });
}

export function renderDetail(el, trophy, sourceById, state) {
  if (!trophy) {
    el.innerHTML = '<div class="detail-empty"><h3>Pick a trophy</h3><p>Choose any trophy on the left to read its cited guide: numbered steps, prerequisites, and — where the sources disagree — the disagreement itself.</p></div>';
    return;
  }
  const { earned, spoilersHidden } = state;
  const isEarned = earned.has(trophy.id);
  const masked = trophy.hidden && spoilersHidden && !isEarned;
  const steps = (trophy.steps || [])
    .map((step, i) => {
      const cites = (step.cites || [])
        .map((n) => {
          const s = sourceById.get(n);
          return s
            ? `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.site)} — ${esc(s.title)} (read ${esc(s.read)})">[${n}]</a>`
            : `<span class="cite">[${n}]</span>`;
        })
        .join(' ');
      return `<li><span class="step-num">${i + 1}</span><span class="step-text">${esc(step.text)}</span> <span class="step-cites">${cites}</span></li>`;
    })
    .join('');
  const sourceList = trophySources(trophy)
    .map((n) => {
      const s = sourceById.get(n);
      return s ? `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">[${n}] ${esc(s.site)}</a> — ${esc(s.title)} (read ${esc(s.read)})</li>` : '';
    })
    .join('');
  el.innerHTML = `<div class="detail-head">
      <div>${gradeBadge(trophy)}<h3>${masked ? 'Hidden trophy' : esc(trophy.name)}</h3></div>
      <button type="button" class="detail-close" data-close aria-label="Close guide">×</button>
    </div>
    <p class="detail-desc">${masked ? 'Hidden until earned — reveal it with the spoiler toggle, or earn it to see the guide.' : esc(trophy.description)}</p>
    <div class="detail-meta">
      <span>${gradeLabel(trophy.grade)}</span><span>${kindLabel(trophy.kind)}</span><span>Stage ${trophy.stage}</span>
      <span title="Earn rate on Exophase, read 20 Nov 2026">${trophy.rarity}% earned</span><span>${trophy.gamerscore}G on Xbox</span>
      ${trophy.target != null ? `<span>Target: ${trophy.target}</span>` : ''}
    </div>
    ${trophy.gate && !masked ? `<div class="detail-gate"><strong>Prerequisite:</strong> ${esc(trophy.gate)}</div>` : ''}
    ${trophy.missable !== 'no' && !masked ? `<div class="detail-missable flag-${trophy.missable}"><strong>${missableLabel(trophy.missable)}:</strong> ${esc(trophy.missable_note || '')}</div>` : trophy.missable !== 'no' ? `<div class="detail-missable flag-${trophy.missable}"><strong>${missableLabel(trophy.missable)}</strong> — details hidden until revealed.</div>` : '<div class="detail-safe">Not missable — it stays available after the story.</div>'}
    ${trophy.unconfirmed && !masked ? `<div class="detail-unconfirmed"><strong>Unconfirmed.</strong> ${esc(trophy.unconfirmed_note || '')}</div>` : ''}
    ${trophy.dispute && !masked ? `<div class="detail-dispute"><strong>Sources disagree.</strong> ${esc(trophy.dispute)}</div>` : ''}
    <p class="detail-guide">${masked ? '' : esc(trophy.guide)}</p>
    ${masked ? '' : `<ol class="steps">${steps}</ol>
    <h4>Sources for this trophy</h4>
    <ul class="detail-sources">${sourceList}</ul>
    <p class="detail-note">Guide text is written for this entry in its own words. The trophy name and description are PlayStation's, shown as published.</p>`}`;
  const close = el.querySelector('[data-close]');
  if (close) close.addEventListener('click', () => el.dispatchEvent(new CustomEvent('detail-close', { bubbles: true })));
}

export function renderMissables(el, trophies, onOpen) {
  const watch = trophies.filter((t) => t.missable !== 'no').sort((a, b) => {
    const order = { missable: 0, 'time-sensitive': 1, watch: 2 };
    return order[a.missable] - order[b.missable] || a.id - b.id;
  });
  const safe = trophies.length - watch.length;
  const cards = watch
    .map(
      (t) => `<article class="miss-card flag-${t.missable}">
        <header><h3><button type="button" data-open="${t.id}">${esc(t.name)}</button></h3><span class="flag flag-${t.missable}">${missableLabel(t.missable)}</span></header>
        <p class="miss-desc">${esc(t.description)}</p>
        <p>${esc(t.missable_note || '')}</p>
        ${t.dispute ? `<p class="miss-dispute"><strong>Sources disagree.</strong> ${esc(t.dispute)}</p>` : ''}
        ${t.gate ? `<p><strong>Prerequisite:</strong> ${esc(t.gate)}</p>` : ''}
      </article>`,
    )
    .join('');
  el.innerHTML = `<p class="view-intro">Only one trophy is truly missable. One strand is time-sensitive, and five stranger chains carry a single-source warning worth heeding. The other ${safe} trophies are safe: everything stays available after the story in free roam.</p>
    <div class="miss-list">${cards}</div>
    <section class="miss-safe">
      <h3>Why everything else is safe</h3>
      <p>PowerPyx, GTABase and OutputLag all agree: after the credits you return to free roam, every trophy-related quest giver is still there, and nothing on the 100% checklist is missable. Optional missions with hourglass icons can expire, but PowerPyx and GTASpotter say those do not count for trophies — except that OutputLag flags Yago's timed race as the one hourglass quest that does matter, so do it promptly. Some fences disappear permanently and a few magazine collectibles sit in story buildings that close, but neither affects any trophy. Keep a manual save at the start and end of each chapter anyway: there is no mission replay.</p>
    </section>`;
  el.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => onOpen(Number(btn.dataset.open)));
  });
}
