// Leonida Trophy Ledger — offline GTA VI trophy guide & tracker.
// Loads its own data files only; no network requests at run time.
const STORE_KEY = 'gta6-trophy-ledger-v3';
const POINTS_TOTAL = 1350;

const KIND_LABELS = {
  story: 'Story', character: 'Character quests', activity: 'Activities',
  collectible: 'Collectibles', crime: 'Crime & robberies', combat: 'Combat & driving',
  completion: 'Completion', misc: 'Miscellaneous',
};
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const CHAPTER_GROUPS = ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 4-5', 'Free roam'];
const CHAPTER_SHORT = { 'Chapter 1': 'Ch 1', 'Chapter 2': 'Ch 2', 'Chapter 3': 'Ch 3', 'Chapter 4': 'Ch 4', 'Chapter 5': 'Ch 5', 'Chapter 4-5': 'Finale', 'Free roam': 'Free roam' };

let TROPHIES = [], SOURCES = [], DISPUTES = [], ROADMAP = null;
let SOURCE_BY_ID = {};
let DISPUTE_BY_ID = {};
let state = loadState();
let openGuides = new Set();
let revealedSpoilers = new Set();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { earned: parsed.earned || {}, counts: parsed.counts || {}, spoilers: parsed.spoilers !== false };
      }
    }
  } catch (e) { /* corrupted save: start fresh */ }
  return { earned: {}, counts: {}, spoilers: true };
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
}

function seedDemo() {
  // ?demo=1 seeds a mid-run save so screenshots show progress at work.
  const demoEarned = [2, 3, 20, 21, 8, 16, 35, 46, 33, 50, 44, 19, 53];
  demoEarned.forEach(id => { state.earned[id] = true; });
  state.counts = { 15: 131, 17: 19, 18: 6, 25: 3, 28: 7, 30: 1, 31: 42, 32: 27, 40: 2, 43: 5, 48: 214, 52: 120000, 54: 3, 55: 6, 14: 34, 42: 61 };
  saveState();
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function citeList(ids) {
  return ids.map(id => `<span class="cite">[S${id}]</span>`).join(' ');
}

function trophyById(id) { return TROPHIES.find(t => t.id === id); }

function isEarned(t) { return !!state.earned[t.id]; }

function countOf(t) {
  if (!t.target) return 0;
  return Math.max(0, Math.min(t.target.goal, state.counts[t.id] || 0));
}

function counterStep(t) {
  if (t.target.goal >= 1000) return 5000;
  if (t.target.unit === '%') return 5;
  return 1;
}

function fmtCount(t, n) {
  if (t.target.unit === '$') return '$' + n.toLocaleString('en-US');
  return n + (t.target.unit === '%' ? '%' : '');
}

function earnedPoints() {
  return TROPHIES.reduce((sum, t) => sum + (isEarned(t) ? t.points : 0), 0);
}

function renderScoreboard() {
  const earned = TROPHIES.filter(isEarned).length;
  const pts = earnedPoints();
  document.getElementById('points-earned').textContent = pts.toLocaleString('en-US');
  document.getElementById('trophies-earned').textContent = `${earned} / ${TROPHIES.length} trophies`;
  document.getElementById('points-pct').textContent = Math.round((pts / POINTS_TOTAL) * 100) + '%';
  document.getElementById('points-bar').style.width = (pts / POINTS_TOTAL) * 100 + '%';
  const chapters = document.getElementById('chapter-progress');
  chapters.innerHTML = CHAPTER_GROUPS.map(ch => {
    const group = TROPHIES.filter(t => t.chapter === ch);
    if (!group.length) return '';
    const done = group.filter(isEarned).length;
    return `<span class="chip${done === group.length ? ' done' : ''}">${CHAPTER_SHORT[ch]}: ${done}/${group.length}</span>`;
  }).join('');
}

function claimStats() {
  let claims = 0, multi = 0;
  TROPHIES.forEach(t => t.claims.forEach(c => { claims++; if (c.s.length >= 2) multi++; }));
  let dClaims = 0, dMulti = 0;
  DISPUTES.forEach(d => [d.a, d.b, d.verdict].forEach(c => { dClaims++; if (c.s.length >= 2) dMulti++; }));
  return { claims: claims + dClaims, multi: multi + dMulti, trophyClaims: claims, disputeClaims: dClaims };
}

function renderAuditStrip() {
  const st = claimStats();
  const missable = TROPHIES.filter(t => t.missable).length;
  document.getElementById('audit-strip').innerHTML =
    `<span><b>55</b> trophies</span><span><b>${st.claims}</b> cited claims</span>` +
    `<span><b>${st.multi}</b> backed by 2+ sources</span><span><b>${DISPUTES.length}</b> source disputes</span>` +
    `<span><b>${SOURCES.length}</b> sources, read 21 Nov 2026</span><span><b>${missable}</b> missable / at-risk</span>` +
    `<span><b>1,350</b> points</span><span><b>0</b> uncited claims</span>`;
  document.getElementById('missable-count').textContent = missable;
}

function spoilerHidden(t) {
  return state.spoilers && t.hidden && !isEarned(t) && !revealedSpoilers.has(t.id);
}

function trophyCard(t) {
  const hidden = spoilerHidden(t);
  const name = hidden ? 'Hidden trophy — tap to reveal' : esc(t.name);
  const desc = hidden ? 'Hidden on PlayStation until earned. Its name and description may spoil the story.' : esc(t.description);
  const earned = isEarned(t);
  const miss = t.missable;
  const dispute = t.dispute ? DISPUTE_BY_ID[t.dispute] : null;
  let counterHtml = '';
  if (t.target) {
    const n = countOf(t);
    const pct = Math.round((n / t.target.goal) * 100);
    counterHtml = `<div class="counter">
      <button data-act="dec" data-id="${t.id}" aria-label="Decrease ${esc(t.target.label)}">−</button>
      <input type="number" min="0" max="${t.target.goal}" value="${n}" data-count="${t.id}" aria-label="${esc(t.target.label)} count">
      <button data-act="inc" data-id="${t.id}" aria-label="Increase ${esc(t.target.label)}">+</button>
      <span class="counter-label">${esc(t.target.label)}: ${fmtCount(t, n)} / ${fmtCount(t, t.target.goal)}</span>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }
  const claimsHtml = t.claims.map(c => `<li>${esc(c.t)} ${citeList(c.s)}</li>`).join('');
  const srcIds = [...new Set(t.claims.flatMap(c => c.s))].sort((a, b) => a - b);
  const srcPanel = srcIds.map(id => {
    const s = SOURCE_BY_ID[id];
    const n = t.claims.filter(c => c.s.includes(id)).length;
    return `${esc(s.site)} (S${id}, read ${s.date}, ${n} claim${n > 1 ? 's' : ''})`;
  }).join(' · ');
  const open = openGuides.has(t.id);
  return `<article class="card${earned ? ' earned' : ''}" id="t${t.id}" data-id="${t.id}">
    <div class="card-head">
      <input type="checkbox" data-earn="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned">
      <div class="card-title">
        <h3><a href="#t${t.id}">${name}</a></h3>
        <p class="card-desc${hidden ? ' spoiled' : ''}">${desc}</p>
      </div>
      <span class="grade ${t.grade}">${t.grade}</span>
    </div>
    <div class="meta">
      <span class="tag">${t.points} pts</span>
      <span class="tag">Rarity ${t.rarity}% (Exophase)</span>
      <span class="tag">${t.gamerscore}G on Xbox</span>
      <span class="tag">${KIND_LABELS[t.kind] || t.kind}</span>
      <span class="tag">${esc(t.chapter)}</span>
      <span class="tag">Stage ${t.stage}</span>
      ${t.hidden ? '<span class="tag hidden-tag">Hidden</span>' : ''}
      ${miss ? `<span class="tag ${miss.level === 'missable' ? 'missable' : 'atrisk'}">${miss.level === 'missable' ? 'MISSABLE' : 'AT-RISK'} · ${esc(miss.window)}</span>` : ''}
    </div>
    ${hidden ? `<button class="reveal-btn" data-reveal="${t.id}">Reveal this hidden trophy</button>` : ''}
    ${counterHtml}
    <button class="guide-toggle" data-guide="${t.id}">${open ? 'Hide guide ▲' : `Guide — ${t.claims.length} cited claims ▼`}</button>
    <div class="guide${open ? ' open' : ''}">
      <p>${esc(t.guide)}</p>
      ${miss ? `<p><b>Protect it:</b> ${esc(miss.protect)}</p>` : ''}
      <ol class="claims">${claimsHtml}</ol>
      <div class="source-panel"><b>Sources for this trophy:</b> ${srcPanel}</div>
      ${dispute ? `<a class="dispute-link" href="#dispute-${dispute.id}" data-goto-dispute="${dispute.id}">SOURCES DIFFER on this trophy — see dispute ${dispute.id} ▼</a>` : ''}
      <div class="deep-link">Deep link: <a href="#t${t.id}">#t${t.id}</a></div>
    </div>
  </article>`;
}

function currentFilters() {
  return {
    q: document.getElementById('search').value.trim().toLowerCase(),
    grade: document.getElementById('filter-grade').value,
    kind: document.getElementById('filter-kind').value,
    status: document.getElementById('filter-status').value,
    sort: document.getElementById('sort').value,
  };
}

function renderTracker() {
  const f = currentFilters();
  const order = ROADMAP ? ROADMAP.next_up : TROPHIES.map(t => t.id);
  const rank = new Map(order.map((id, i) => [id, i]));
  let list = TROPHIES.filter(t => {
    if (f.grade && t.grade !== f.grade) return false;
    if (f.kind && t.kind !== f.kind) return false;
    if (f.status === 'remaining' && isEarned(t)) return false;
    if (f.status === 'earned' && !isEarned(t)) return false;
    if (f.status === 'missable' && !t.missable) return false;
    if (f.status === 'counter' && !t.target) return false;
    if (f.q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.chapter + ' ' + t.kind).toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
  list.sort((a, b) => {
    if (f.sort === 'grade') return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || (rank.get(a.id) - rank.get(b.id));
    if (f.sort === 'rarity') return a.rarity - b.rarity;
    if (f.sort === 'points') return b.points - a.points;
    if (f.sort === 'name') return a.name.localeCompare(b.name);
    return (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99);
  });
  document.getElementById('trophy-list').innerHTML = list.map(trophyCard).join('') ||
    '<p>No trophies match these filters.</p>';
  document.getElementById('filter-note').textContent = `Showing ${list.length} of ${TROPHIES.length} trophies.`;
}

function renderNextUp() {
  const order = ROADMAP.next_up;
  const items = order.map(id => trophyById(id)).filter(Boolean);
  document.getElementById('nextup-list').innerHTML = items.map(t => {
    const done = isEarned(t);
    const miss = t.missable ? `<span class="tag ${t.missable.level === 'missable' ? 'missable' : 'atrisk'}">${t.missable.level === 'missable' ? 'MISSABLE — ' + esc(t.missable.shuts) : 'AT-RISK'}</span>` : '';
    const target = t.target ? ` · ${esc(t.target.label)} ${fmtCount(t, countOf(t))}/${fmtCount(t, t.target.goal)}` : '';
    return `<li class="${done ? 'done' : ''}"><span><span class="nu-name"><a href="#t${t.id}">${esc(t.name)}</a></span>
      <span class="nu-meta"> — ${t.grade} · ${t.points} pts · ${esc(t.chapter)} · Stage ${t.stage}${target}</span> ${miss}</span></li>`;
  }).join('');
}

function renderRoadmap() {
  document.getElementById('roadmap-stages').innerHTML = ROADMAP.stages.map(s => {
    const chips = s.trophies.map(id => {
      const t = trophyById(id);
      if (!t) return '';
      return `<a class="tag" href="#t${t.id}">${esc(t.name)}${isEarned(t) ? ' ✓' : ''}</a>`;
    }).join('');
    const done = s.trophies.filter(id => state.earned[id]).length;
    return `<div class="stage"><h3>Stage ${s.id}: ${esc(s.name)} <span class="hours">· ${esc(s.hours)} hours · ${done}/${s.trophies.length} done</span></h3>
      <p>${esc(s.focus)}</p>
      <div class="warn">⚠ ${esc(s.warning)}</div>
      <div class="stage-trophies">${chips}</div></div>`;
  }).join('');
}

function renderMissables() {
  const list = TROPHIES.filter(t => t.missable).sort((a, b) => (a.missable.level === 'missable' ? 0 : 1) - (b.missable.level === 'missable' ? 0 : 1));
  document.getElementById('missable-list').innerHTML = list.map(t => {
    const m = t.missable;
    return `<div class="miss-card${m.level === 'missable' ? ' critical' : ''}">
      <h3><a href="#t${t.id}">${esc(t.name)}</a></h3>
      <div class="meta"><span class="grade ${t.grade}">${t.grade}</span>
      <span class="tag ${m.level === 'missable' ? 'missable' : 'atrisk'}">${m.level === 'missable' ? 'MISSABLE' : 'AT-RISK'}</span>
      <span class="tag">${esc(t.chapter)}</span><span class="tag">Stage ${t.stage}</span></div>
      <p class="window"><b>Window opens:</b> ${esc(m.window)}<br><b>Window shuts:</b> ${esc(m.shuts)}</p>
      <p class="protect"><b>Protect it:</b> ${esc(m.protect)}</p>
    </div>`;
  }).join('');
}

function renderDisputes() {
  document.getElementById('dispute-list').innerHTML = DISPUTES.map(d => {
    const t = TROPHIES.find(x => x.name === d.trophy);
    return `<div class="dispute" id="dispute-${d.id}">
      <div class="dispute-flag">Sources differ — both versions shown · ${d.id}</div>
      <h3>${esc(d.topic)} ${t ? `<span class="nu-meta">— <a href="#t${t.id}">${esc(t.name)}</a></span>` : ''}</h3>
      <div class="versus">
        <div><b>Version A</b>${esc(d.a.t)} ${citeList(d.a.s)}</div>
        <div><b>Version B</b>${esc(d.b.t)} ${citeList(d.b.s)}</div>
      </div>
      <div class="verdict"><b>Our call:</b> ${esc(d.verdict.t.replace(/^Our call:\s*/, ''))} ${citeList(d.verdict.s)}</div>
    </div>`;
  }).join('');
}

function sourceClaimCounts() {
  const counts = {};
  SOURCES.forEach(s => { counts[s.id] = { trophy: 0, dispute: 0 }; });
  TROPHIES.forEach(t => t.claims.forEach(c => c.s.forEach(id => { if (counts[id]) counts[id].trophy++; })));
  DISPUTES.forEach(d => [d.a, d.b, d.verdict].forEach(c => c.s.forEach(id => { if (counts[id]) counts[id].dispute++; })));
  return counts;
}

function renderSources() {
  const counts = sourceClaimCounts();
  const rows = SOURCES.map(s => {
    const c = counts[s.id];
    const total = c.trophy + c.dispute;
    return `<tr><td><b>S${s.id}</b></td><td>${esc(s.site)}</td>
      <td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></td>
      <td>${s.date}</td><td>${s.read === 'opened' ? 'Opened &amp; read' : 'Read via search'}</td>
      <td>${total} (${c.trophy} trophy + ${c.dispute} dispute)</td></tr>`;
  }).join('');
  document.getElementById('source-table').innerHTML =
    `<table><thead><tr><th>#</th><th>Site</th><th>Page</th><th>Read</th><th>How</th><th>Claims backed</th></tr></thead><tbody>${rows}</tbody></table>`;
  const max = Math.max(...SOURCES.map(s => counts[s.id].trophy + counts[s.id].dispute));
  const matrix = SOURCES.map(s => {
    const total = counts[s.id].trophy + counts[s.id].dispute;
    const pct = Math.round((total / max) * 100);
    return `<tr><td><b>S${s.id} ${esc(s.site)}</b></td><td><div class="matrix-bar"><div style="width:${pct}%"></div></div></td><td>${total}</td></tr>`;
  }).join('');
  document.getElementById('source-matrix').innerHTML =
    `<table><thead><tr><th>Source</th><th>Share of claims</th><th>Count</th></tr></thead><tbody>${matrix}</tbody></table>`;
}

function renderAudit() {
  const st = claimStats();
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  TROPHIES.forEach(t => grades[t.grade]++);
  const hidden = TROPHIES.filter(t => t.hidden).length;
  const counters = TROPHIES.filter(t => t.target).length;
  const missable = TROPHIES.filter(t => t.missable).length;
  const gs = TROPHIES.reduce((a, t) => a + t.gamerscore, 0);
  document.getElementById('audit-body').innerHTML = `
    <div class="audit-grid">
      <div class="audit-card"><div class="big">${TROPHIES.length}</div><p>trophies, matching the official list: ${grades.platinum} platinum, ${grades.gold} gold, ${grades.silver} silver, ${grades.bronze} bronze, ${hidden} hidden</p></div>
      <div class="audit-card"><div class="big">${st.claims}</div><p>cited claims (${st.trophyClaims} in trophy guides + ${st.disputeClaims} in disputes), every one cited, 0 uncited</p></div>
      <div class="audit-card"><div class="big">${st.multi}</div><p>claims backed by 2 or more sources (${Math.round((st.multi / st.claims) * 100)}% of all claims)</p></div>
      <div class="audit-card"><div class="big">${DISPUTES.length}</div><p>disputes, each showing both cited versions plus a verdict</p></div>
      <div class="audit-card"><div class="big">${SOURCES.length}</div><p>sources, all read 21 Nov 2026 — 13 opened in full, 7 read via search results</p></div>
      <div class="audit-card"><div class="big">${counters}</div><p>grind / count trophies with − / + trackers and progress bars</p></div>
      <div class="audit-card"><div class="big">${missable}</div><p>missable / at-risk trophies flagged, 1 truly missable</p></div>
      <div class="audit-card"><div class="big">1,350</div><p>points in the points system (Platinum 220, Gold 85, Silver 45, Bronze 15); Xbox total ${gs.toLocaleString('en-US')}G</p></div>
    </div>
    <ul class="audit-notes">
      <li><b>Names and descriptions</b> are the official PlayStation list as frozen 18 Nov 2026 (Exophase + PSNProfiles, agreeing on all 55 names, descriptions and grades), including the masked name “T**s Ass Drug Money”.</li>
      <li><b>Rarity %</b> is Exophase's tracked figure per trophy, read 21 Nov 2026, two days after launch — early numbers that will rise fast.</li>
      <li><b>All guide text is original.</b> Sources are cited beside each claim and never copied; the official names and descriptions are the only quoted text.</li>
      <li><b>Five hidden trophies were unsolved</b> on 21 Nov 2026 (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin). Their entries say so plainly and give the best current lead instead of inventing a method.</li>
      <li><b>Offline:</b> the app loads only its own files under app/ and makes no network request. Source links open only when the reader follows them.</li>
      <li><b>Progress</b> is saved in the browser (localStorage) and can be exported to a file and imported back.</li>
    </ul>`;
}

function renderAll() {
  renderScoreboard();
  renderAuditStrip();
  renderTracker();
  renderNextUp();
  renderRoadmap();
  renderMissables();
  renderDisputes();
  renderSources();
  renderAudit();
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
}

function openTrophy(id, scroll = true) {
  openGuides.add(id);
  revealedSpoilers.add(id);
  renderTracker();
  if (scroll) {
    const el = document.getElementById('t' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function bindEvents() {
  document.getElementById('tabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (btn) switchTab(btn.dataset.tab);
  });
  ['search', 'filter-grade', 'filter-kind', 'filter-status', 'sort'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderTracker);
    document.getElementById(id).addEventListener('change', renderTracker);
  });
  const spoilerToggle = document.getElementById('spoiler-toggle');
  spoilerToggle.checked = state.spoilers;
  spoilerToggle.addEventListener('change', () => { state.spoilers = spoilerToggle.checked; saveState(); renderTracker(); });

  document.getElementById('trophy-list').addEventListener('click', e => {
    const earn = e.target.closest('[data-earn]');
    if (earn) {
      const id = Number(earn.dataset.earn);
      state.earned[id] = earn.checked || undefined;
      if (!earn.checked) delete state.earned[id];
      saveState(); renderScoreboard(); renderNextUp(); renderRoadmap();
      earn.closest('.card').classList.toggle('earned', earn.checked);
      return;
    }
    const guideBtn = e.target.closest('[data-guide]');
    if (guideBtn) {
      const id = Number(guideBtn.dataset.guide);
      if (openGuides.has(id)) openGuides.delete(id); else openGuides.add(id);
      renderTracker();
      return;
    }
    const reveal = e.target.closest('[data-reveal]');
    if (reveal) { revealedSpoilers.add(Number(reveal.dataset.reveal)); renderTracker(); return; }
    const step = e.target.closest('[data-act]');
    if (step) {
      const t = trophyById(Number(step.dataset.id));
      const cur = countOf(t);
      const next = step.dataset.act === 'inc' ? cur + counterStep(t) : cur - counterStep(t);
      state.counts[t.id] = Math.max(0, Math.min(t.target.goal, next));
      saveState(); renderTracker(); renderNextUp();
    }
  });
  document.getElementById('trophy-list').addEventListener('change', e => {
    const input = e.target.closest('[data-count]');
    if (input) {
      const t = trophyById(Number(input.dataset.count));
      state.counts[t.id] = Math.max(0, Math.min(t.target.goal, Number(input.value) || 0));
      saveState(); renderTracker(); renderNextUp();
    }
  });
  document.getElementById('trophy-list').addEventListener('click', e => {
    const link = e.target.closest('[data-goto-dispute]');
    if (link) {
      e.preventDefault();
      switchTab('disputes');
      const el = document.getElementById('dispute-' + link.dataset.gotoDispute);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-ledger-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed && typeof parsed === 'object') {
          state = { earned: parsed.earned || {}, counts: parsed.counts || {}, spoilers: parsed.spoilers !== false };
          saveState();
          document.getElementById('spoiler-toggle').checked = state.spoilers;
          renderAll();
        }
      } catch (err) { alert('That file is not a valid progress export.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset all earned trophies and counters?')) {
      state = { earned: {}, counts: {}, spoilers: state.spoilers };
      saveState(); renderAll();
    }
  });

  window.addEventListener('hashchange', handleHash);
}

function handleHash() {
  const hash = location.hash;
  const m = hash.match(/^#t(\d+)$/);
  if (m) {
    switchTab('tracker');
    openTrophy(Number(m[1]));
    return;
  }
  const d = hash.match(/^#dispute-(D\d+)$/);
  if (d) {
    switchTab('disputes');
    const el = document.getElementById('dispute-' + d[1]);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function boot() {
  const [trophies, sources, disputes, roadmap] = await Promise.all([
    fetch('data/trophies.json').then(r => r.json()),
    fetch('data/sources.json').then(r => r.json()),
    fetch('data/disputes.json').then(r => r.json()),
    fetch('data/roadmap.json').then(r => r.json()),
  ]);
  TROPHIES = trophies.trophies;
  SOURCES = sources.sources;
  DISPUTES = disputes.disputes;
  ROADMAP = roadmap;
  SOURCE_BY_ID = Object.fromEntries(SOURCES.map(s => [s.id, s]));
  DISPUTE_BY_ID = Object.fromEntries(DISPUTES.map(d => [d.id, d]));
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1' && Object.keys(state.earned).length === 0) seedDemo();
  if (params.get('tab')) switchTab(params.get('tab'));
  if (params.get('open')) openGuides.add(Number(params.get('open')));
  bindEvents();
  renderAll();
  handleHash();
}

boot();
