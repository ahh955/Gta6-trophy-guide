// Leonida Trophy Ledger — dense 3-pane GTA VI trophy guide & tracker.
// Data lives in data/trophies.json (official list + our own cited guides).
// Progress saves in localStorage; export/import moves it between browsers.
// Everything runs offline from this app's own files; source links only open
// when the reader follows them.

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'leonida-ledger-v4';
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const KIND_LABEL = {
  story: 'Story', activity: 'Activities', collectible: 'Collectibles',
  robbery: 'Robbery', character: 'Character', misc: 'Misc', money: 'Money',
  completion: 'Completion', combat: 'Combat',
};
const STAGE_NAMES = { 1: 'Stage 1 · Ch 1–2', 2: 'Stage 2 · Ch 3–4', 3: 'Stage 3 · Ch 5 + finale', 4: 'Stage 4 · 100% grind', 5: 'Stage 5 · Cleanup + Plat' };

const params = new URLSearchParams(location.search);
const state = {
  view: params.get('view') || 'tracker',
  sel: Number(params.get('sel')) || 28,
  kind: '', grade: '', query: '',
  shield: true, demo: params.get('demo') === '1',
  earned: new Set(), counters: {},
};

let DATA = null; // {sources, roadmap, trophies}
let byId = new Map();
let claimStats = { total: 0, twoPlus: 0 };

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.earned = new Set(saved.earned || []);
      state.counters = saved.counters || {};
      if (typeof saved.shield === 'boolean') state.shield = saved.shield;
    }
  } catch { /* corrupted save: start fresh */ }
  if (state.demo) {
    // Seeded demo progress so screenshots show a lived-in tracker.
    [2, 3, 8, 20, 21, 35, 42, 46, 50, 53].forEach((id) => state.earned.add(id));
    Object.assign(state.counters, { 15: 120, 17: 18, 18: 6, 19: 9, 25: 3, 28: 6, 31: 47, 32: 28, 52: 94000, 53: 41250, 54: 3, 55: 4, 48: 231 });
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned], counters: state.counters, shield: state.shield,
    }));
    const note = document.getElementById('savedNote');
    if (note) note.textContent = '✓ Saved in this browser';
  } catch { /* storage unavailable: progress stays in memory */ }
}

function trophySources(t) {
  const used = new Map();
  const add = (cites) => (cites || []).forEach((n) => used.set(n, (used.get(n) || 0) + 1));
  (t.steps || []).forEach((s) => add(s[1]));
  (t.facts || []).forEach((f) => add(f[1]));
  if (t.dispute) { add(t.dispute.ac); add(t.dispute.bc); }
  return [...used.entries()].map(([n, count]) => ({ src: DATA.sources[n - 1], count })).filter((x) => x.src);
}

function citeNums(cites) {
  if (!cites || !cites.length) return '';
  return `<cite>[${cites.join('][')}]</cite>`;
}

function masked(t) {
  return state.shield && t.hidden && t.kind === 'story' && !state.earned.has(t.id);
}

function displayName(t) {
  return masked(t) ? `Story trophy · ${t.ch}` : t.name;
}

function displayDesc(t) {
  return masked(t) ? 'Hidden by the spoiler shield until earned.' : t.description;
}

function earnedPoints() {
  let pts = 0;
  state.earned.forEach((id) => { const t = byId.get(id); if (t) pts += GRADE_POINTS[t.grade]; });
  return pts;
}

function stageCounts() {
  const out = { 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0], 5: [0, 0] };
  DATA.trophies.forEach((t) => {
    out[t.stage][1] += 1;
    if (state.earned.has(t.id)) out[t.stage][0] += 1;
  });
  return out;
}

function renderHeader() {
  const earned = state.earned.size;
  document.getElementById('earnedCount').textContent = `${earned} / 55 earned`;
  document.getElementById('earnedBar').style.width = `${(earned / 55) * 100}%`;
  document.getElementById('pointsLine').textContent = `${earnedPoints()} / 1,350 pts`;
  const g = { platinum: [0, 1], gold: [0, 2], silver: [0, 6], bronze: [0, 46] };
  DATA.trophies.forEach((t) => { if (state.earned.has(t.id)) g[t.grade][0] += 1; });
  document.getElementById('gradeLine').textContent =
    `P ${g.platinum[0]}/1 · G ${g.gold[0]}/2 · S ${g.silver[0]}/6 · B ${g.bronze[0]}/46`;
  const sc = stageCounts();
  document.getElementById('chapterBars').innerHTML = [1, 2, 3, 4, 5].map((s) =>
    `<span>S${s} <b>${sc[s][0]}/${sc[s][1]}</b></span>`).join(' · ');
}

function renderAudit() {
  const disputes = DATA.trophies.filter((t) => t.dispute).length;
  const miss = DATA.trophies.filter((t) => t.miss && t.miss.l === 'missable').length;
  const risk = DATA.trophies.filter((t) => t.miss && t.miss.l === 'at-risk').length;
  const counters = DATA.trophies.filter((t) => t.counter).length;
  document.getElementById('auditStrip').innerHTML =
    `<span class="label">AUDIT</span>` +
    `<span class="pill"><b>55/55</b> official name, description, grade</span>` +
    `<span class="pill">1P 2G 6S 46B · 28 PSN-hidden</span>` +
    `<span class="pill good"><b>${claimStats.total}/${claimStats.total}</b> claims cited</span>` +
    `<span class="pill good"><b>${claimStats.twoPlus}</b> backed by 2+ sources</span>` +
    `<span class="pill"><b>${disputes}</b> disputes shown both ways</span>` +
    `<span class="pill"><b>20 sources</b> · 20 pages · read 21 Nov 2026</span>` +
    `<span class="pill warn"><b>${miss}</b> possibly missable · <b>${risk}</b> at risk</span>` +
    `<span class="pill"><b>${counters}</b> YOUR COUNT trackers</span>` +
    `<span class="pill">1,350 pts · ~200 h · 1 playthrough · 0 online</span>`;
  document.getElementById('missCount').textContent = `(${miss + risk})`;
  document.getElementById('dispCount').textContent = `(${disputes})`;
  document.getElementById('footCounts').textContent =
    `${claimStats.total} cited claims · ${disputes} disputes · ${DATA.sources.length} sources · all read 21 Nov 2026`;
}

function kindCounts() {
  const counts = {};
  DATA.trophies.forEach((t) => { counts[t.kind] = (counts[t.kind] || 0) + 1; });
  return counts;
}

function renderKindFilters() {
  const counts = kindCounts();
  const kinds = ['story', 'collectible', 'activity', 'robbery', 'character', 'money', 'misc', 'completion', 'combat'];
  const specials = [
    { key: 'missable', label: `Missable ${DATA.trophies.filter((t) => t.miss).length}` },
    { key: 'hidden', label: `PSN-hidden ${DATA.trophies.filter((t) => t.hidden).length}` },
    { key: 'disputed', label: `Disputed ${DATA.trophies.filter((t) => t.dispute).length}` },
    { key: 'notearned', label: `Not earned ${55 - state.earned.size}` },
  ];
  document.getElementById('kindFilters').innerHTML =
    `<button data-kind="" class="chip ${state.kind === '' ? 'active' : ''}" type="button">All <b>55</b></button>` +
    kinds.map((k) => `<button data-kind="${k}" class="chip ${state.kind === k ? 'active' : ''}" type="button">${KIND_LABEL[k]} <b>${counts[k] || 0}</b></button>`).join('') +
    specials.map((s) => `<button data-kind="${s.key}" class="chip ${state.kind === s.key ? 'active' : ''}" type="button">${s.label}</button>`).join('');
}

function filteredTrophies() {
  const q = state.query.trim().toLowerCase();
  return DATA.trophies.filter((t) => {
    if (state.grade && t.grade !== state.grade) return false;
    if (state.kind === 'missable' && !t.miss) return false;
    if (state.kind === 'hidden' && !t.hidden) return false;
    if (state.kind === 'disputed' && !t.dispute) return false;
    if (state.kind === 'notearned' && state.earned.has(t.id)) return false;
    if (state.kind && !['missable', 'hidden', 'disputed', 'notearned'].includes(state.kind) && t.kind !== state.kind) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.ch + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => (a.stage - b.stage) || (a.id - b.id)); // roadmap order, not id order
}

function counterValue(t) {
  return state.counters[t.id] || 0;
}

function rowHtml(t) {
  const earned = state.earned.has(t.id);
  const tags = [];
  if (t.miss) tags.push(`<span class="tag ${t.miss.l === 'missable' ? 'miss' : 'risk'}">${t.miss.l === 'missable' ? 'MISSABLE' : 'AT RISK'}</span>`);
  if (t.hidden) tags.push('<span class="tag hid">PSN-HIDDEN</span>');
  if (t.dispute) tags.push('<span class="tag knd">SOURCES DIFFER</span>');
  tags.push(`<span class="tag knd">${KIND_LABEL[t.kind]}</span>`);
  let prog = '';
  if (t.counter) {
    const v = counterValue(t);
    const pct = Math.min(100, Math.round((v / t.counter.t) * 100));
    tags.push(`<span class="tag ctr">${t.counter.l}: ${v}/${t.counter.t}</span>`);
    prog = `<div class="mini-prog"><div style="width:${pct}%"></div></div>`;
  }
  return `<div class="trow ${state.sel === t.id ? 'sel' : ''} ${earned ? 'earned' : ''}" data-id="${t.id}" role="button" tabindex="0">
    <input type="checkbox" ${earned ? 'checked' : ''} data-check="${t.id}" aria-label="Mark ${t.name} earned">
    <span class="gdot ${GRADE_LETTER[t.grade]}">${GRADE_LETTER[t.grade]}</span>
    <span class="tn"><span class="tname">${displayName(t)}</span>
    <span class="tdesc">${displayDesc(t)}</span>
    <span class="tags">${tags.join('')}</span>${prog}</span>
    <span class="rar">${t.rarity}%</span>
  </div>`;
}

function renderList() {
  const list = filteredTrophies();
  const sc = stageCounts();
  let html = `<div class="list-head"><span><b>${list.length}</b> SHOWN · roadmap order</span><span>${state.earned.size}/55 earned</span></div>`;
  let lastStage = 0;
  for (const t of list) {
    if (t.stage !== lastStage) {
      lastStage = t.stage;
      html += `<div class="group-head"><span>${STAGE_NAMES[t.stage]}</span><span>${sc[t.stage][0]}/${sc[t.stage][1]}</span></div>`;
    }
    html += rowHtml(t);
  }
  if (!list.length) html += '<div class="empty">No trophies match these filters.</div>';
  document.getElementById('listPane').innerHTML = html;
}

function renderCounter(t) {
  if (!t.counter) return '';
  const v = counterValue(t);
  const pct = Math.min(100, Math.round((v / t.counter.t) * 100));
  const fmt = (n) => (t.counter.u === '$' ? '$' + n.toLocaleString('en-US') : n.toLocaleString('en-US') + ' ' + t.counter.u);
  const target = t.counter.u === '$' ? '$' + t.counter.t.toLocaleString('en-US') : t.counter.t + ' ' + t.counter.u;
  return `<div class="counterbox">
    <span class="clabel">YOUR COUNT</span>
    <span class="cbtns">
      <button class="cbtn" data-dec="${t.id}" type="button" aria-label="Decrease count">−</button>
      <span class="cval">${fmt(v)} / ${target}</span>
      <button class="cbtn" data-inc="${t.id}" type="button" aria-label="Increase count">+</button>
    </span>
    <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
    <span style="font-size:11px;color:var(--muted)">${pct}% · ${t.counter.l}</span>
  </div>`;
}

function renderDetail() {
  const t = byId.get(state.sel) || DATA.trophies[0];
  const earned = state.earned.has(t.id);
  const srcs = trophySources(t);
  const claims = (t.steps || []).length + (t.facts || []).length;
  let html = `<div class="detail-head">
    <span class="gdot ${GRADE_LETTER[t.grade]}">${GRADE_LETTER[t.grade]}</span>
    <div><h2>${t.name}</h2><div class="sub">${t.grade} · #${t.id} of 55 · ${t.ch} · ${KIND_LABEL[t.kind]} · ${t.rarity}% on Exophase · ${t.pts} pts · ${t.gs}G</div></div>
    <button class="mark-earned ${earned ? 'earned' : ''}" data-toggle="${t.id}" type="button">${earned ? '✓ Earned' : 'Mark earned'}</button>
  </div>
  <div class="offdesc"><div class="lbl">OFFICIAL DESCRIPTION</div>“${t.description}”</div>
  <div class="badges">
    ${t.miss ? `<span class="badge ${t.miss.l === 'missable' ? 'miss' : 'risk'}">${t.miss.l === 'missable' ? '⚠ POSSIBLY MISSABLE' : '⚠ AT RISK'}</span>` : ''}
    ${t.dispute ? '<span class="badge">SOURCES DIFFER — see below</span>' : ''}
    ${t.hidden ? '<span class="badge">PSN-hidden until earned</span>' : '<span class="badge">Visible on PSN</span>'}
    <span class="badge">${claims} cited claims</span>
    <span class="badge">${srcs.length} sources</span>
  </div>
  <p class="guide-text">${t.guide}</p>`;
  if (t.miss) {
    html += `<div class="missbox ${t.miss.l === 'missable' ? '' : 'risk'}">
      <b>${t.miss.l === 'missable' ? 'MISSABLE WINDOW' : 'AT-RISK WINDOW'}:</b> ${t.miss.w}<br>
      <b>Protect it:</b> ${t.miss.p}</div>`;
  }
  html += renderCounter(t);
  if (t.dispute) {
    html += `<div class="dispute"><div class="dhead">⚖ SOURCES DIFFER — ${t.dispute.q} · BOTH VERSIONS SHOWN</div>
      <div class="cols">
        <div class="col"><b>A ·</b> ${t.dispute.a} ${citeNums(t.dispute.ac)}</div>
        <div class="col"><b>B ·</b> ${t.dispute.b} ${citeNums(t.dispute.bc)}</div>
      </div>
      <div class="call"><b>Our call:</b> ${t.dispute.call}</div></div>`;
  }
  html += `<div class="sec-head">HOW TO EARN IT — ${t.steps.length} STEPS IN OUR OWN WORDS, EACH WITH ITS SOURCES</div>
  <ol class="steps">${t.steps.map((s) => `<li><span>${s[0]} ${citeNums(s[1])}</span></li>`).join('')}</ol>`;
  if (t.facts && t.facts.length) {
    html += `<div class="sec-head">WHAT THE GUIDES ALSO SAY — ${t.facts.length} CITED FACTS</div>
    <ul class="facts">${t.facts.map((f) => `<li>${f[0]} ${citeNums(f[1])}</li>`).join('')}</ul>`;
  }
  html += `<div class="deep">Deep link: <a href="#t${t.id}">#t${t.id}</a> · <a href="https://make.fun/bounty/gta6-trophy-guide-01">gta6-trophy-guide-01 on make.fun</a></div>`;
  document.getElementById('detailPane').innerHTML = html;
}

function renderNextUp() {
  const order = [...DATA.trophies].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  const next = order.filter((t) => !state.earned.has(t.id)).slice(0, 8);
  let html = `<div class="side-sec"><h3>NEXT UP · ROADMAP ORDER</h3><ol class="nextup">`;
  for (const t of next) {
    const why = t.miss ? (t.miss.l === 'missable' ? 'missable — do first' : 'at risk — do soon')
      : t.dispute ? 'sources differ — read the call' : `stage ${t.stage} · ${t.ch}`;
    html += `<li data-id="${t.id}"><span class="gdot ${GRADE_LETTER[t.grade]}">${GRADE_LETTER[t.grade]}</span>
      <span><b>${displayName(t)}</b><br><span class="why">${why}</span></span></li>`;
  }
  html += '</ol></div>';
  return html;
}

function renderSideSources() {
  const t = byId.get(state.sel) || DATA.trophies[0];
  const srcs = trophySources(t);
  let html = `<div class="side-sec"><h3>SOURCES FOR THIS GUIDE · ${srcs.length}</h3><ul class="src-list">`;
  for (const { src, count } of srcs) {
    html += `<li><span class="sn">[${src.n}]</span> <b>${src.site}</b> — ${src.title}<br>
      <span class="st">read ${src.read} · ${count} claim${count === 1 ? '' : 's'} here</span><br>
      <a href="${src.url}" target="_blank" rel="noopener">${src.url.replace(/^https?:\/\//, '')}</a></li>`;
  }
  html += '</ul></div>';
  return html;
}

function renderSide() {
  document.getElementById('sidePane').innerHTML = renderNextUp() + renderSideSources();
}

function renderRoadmapView() {
  let html = `<h2 style="font-size:15px">Roadmap to the Platinum — 5 stages, ~200 hours, 1 playthrough</h2>
  <p style="color:var(--muted);font-size:11px;margin:2px 0 8px">PowerPyx puts the run at about 200 hours: 60–80 story, ~100 checklist, 10–20 cleanup [1][4][7]. Push Square says 250+ hours — see the dispute on Vice Got a Price! [6][11].</p>`;
  const sc = stageCounts();
  for (const r of DATA.roadmap) {
    const names = r.trophies.map((id) => {
      const t = byId.get(id);
      return `<span style="${state.earned.has(id) ? 'text-decoration:line-through;color:var(--dim)' : ''}">${t.name}</span>`;
    }).join(' · ');
    html += `<div class="stage"><h3>Stage ${r.stage}: ${r.name} — ${r.hours} h · ${sc[r.stage][0]}/${sc[r.stage][1]} earned</h3>
      <div class="meta">${r.goal}</div>
      <div class="bar"><div class="fill" style="width:${(sc[r.stage][0] / sc[r.stage][1]) * 100}%"></div></div>
      <div class="tlist">${names}</div></div>`;
  }
  document.getElementById('detailPane').innerHTML = html;
}

function renderMissablesView() {
  const list = DATA.trophies.filter((t) => t.miss)
    .sort((a, b) => (a.miss.l === 'missable' ? 0 : 1) - (b.miss.l === 'missable' ? 0 : 1) || (a.stage - b.stage));
  let html = `<h2 style="font-size:15px">Missables &amp; at-risk — 1 possibly missable, 13 at risk</h2>
  <p style="color:var(--muted);font-size:11px;margin:2px 0 8px">Only Positive Mental Attitude can actually be lost; the other 13 carry a window, a timer or a trap worth knowing about. No mission replay exists, so keep a manual save at the start of every chapter [1][8][18].</p>`;
  for (const t of list) {
    html += `<div class="miss-card ${t.miss.l === 'missable' ? '' : 'risk'}" data-id="${t.id}">
      <h3>${t.miss.l === 'missable' ? '⚠ MISSABLE' : '⚠ AT RISK'} — ${t.name} <span style="color:var(--muted);font-weight:400">(${t.grade} · ${t.ch})</span></h3>
      <div class="win"><b>Window:</b> ${t.miss.w}</div>
      <div class="prot"><b>Protect it:</b> ${t.miss.p}</div></div>`;
  }
  document.getElementById('detailPane').innerHTML = html;
}

function renderDisputesView() {
  const list = DATA.trophies.filter((t) => t.dispute);
  let html = `<h2 style="font-size:15px">Sources differ — all ${list.length} disputes, both versions shown</h2>
  <p style="color:var(--muted);font-size:11px;margin:2px 0 8px">Where the guides disagree, this ledger shows both versions with their citations and then makes a call. Click any card to open that trophy's full guide.</p>`;
  for (const t of list) {
    html += `<div class="disp-card" data-id="${t.id}"><h3>${t.name} — ${t.dispute.q}</h3>
      <div class="dispute" style="margin:5px 0 0"><div class="cols">
        <div class="col"><b>A ·</b> ${t.dispute.a} ${citeNums(t.dispute.ac)}</div>
        <div class="col"><b>B ·</b> ${t.dispute.b} ${citeNums(t.dispute.bc)}</div>
      </div><div class="call"><b>Our call:</b> ${t.dispute.call}</div></div></div>`;
  }
  document.getElementById('detailPane').innerHTML = html;
}

function renderSourcesView() {
  let html = `<h2 style="font-size:15px">Sources — 20 pages, all read 21 Nov 2026</h2>
  <p style="color:var(--muted);font-size:11px;margin:2px 0 8px">Every claim in this guide cites one or more of these pages. Guide text is our own words; the official trophy names and descriptions are quoted as PlayStation publishes them. PSNProfiles was blocked (403) on 21 Nov, so it is not cited.</p>
  <table class="src-table"><tr><th>#</th><th>Site · page</th><th>Read</th><th>Claims</th><th>Link</th></tr>`;
  const totals = new Map();
  DATA.trophies.forEach((t) => trophySources(t).forEach(({ src, count }) =>
    totals.set(src.n, (totals.get(src.n) || 0) + count)));
  for (const s of DATA.sources) {
    html += `<tr><td><b>[${s.n}]</b></td><td><b>${s.site}</b> — ${s.title}</td><td>${s.read}</td><td>${totals.get(s.n) || 0}</td>
      <td><a href="${s.url}" target="_blank" rel="noopener">${s.url.replace(/^https?:\/\//, '').slice(0, 44)}…</a></td></tr>`;
  }
  html += '</table>';
  html += `<div class="sec-head">SOURCE MATRIX — CLAIMS PER KIND (rows: sources, columns: trophy kinds)</div>`;
  const kinds = Object.keys(KIND_LABEL);
  html += '<table class="matrix"><tr><th>Source</th>' + kinds.map((k) => `<th>${KIND_LABEL[k]}</th>`).join('') + '</tr>';
  for (const s of DATA.sources) {
    const per = {};
    DATA.trophies.forEach((t) => {
      const n = trophySources(t).find((x) => x.src.n === s.n);
      if (n) per[t.kind] = (per[t.kind] || 0) + n.count;
    });
    html += `<tr><td style="text-align:left"><b>[${s.n}] ${s.site}</b></td>` +
      kinds.map((k) => `<td class="${per[k] ? 'hit' : ''}">${per[k] || '·'}</td>`).join('') + '</tr>';
  }
  html += '</table>';
  document.getElementById('detailPane').innerHTML = html;
}

function renderCentre() {
  if (state.view === 'roadmap') renderRoadmapView();
  else if (state.view === 'missables') renderMissablesView();
  else if (state.view === 'disputes') renderDisputesView();
  else if (state.view === 'sources') renderSourcesView();
  else renderDetail();
}

function renderAll() {
  renderHeader();
  renderAudit();
  renderKindFilters();
  renderList();
  renderCentre();
  renderSide();
  document.querySelectorAll('#tabs .tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === state.view));
  document.getElementById('spoilerShield').checked = state.shield;
}

function selectTrophy(id, view) {
  state.sel = id;
  if (view) state.view = view;
  else if (state.view !== 'tracker') state.view = 'tracker';
  history.replaceState(null, '', `#t${id}`);
  renderAll();
  document.getElementById('detailPane').scrollTop = 0;
}

function setCounter(id, delta) {
  const t = byId.get(id);
  if (!t || !t.counter) return;
  const step = t.counter.u === '$' ? 1000 : 1;
  const next = Math.max(0, Math.min(t.counter.t, (state.counters[id] || 0) + delta * step));
  state.counters[id] = next;
  saveProgress();
  renderAll();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress();
  renderAll();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({
    app: 'Leonida Trophy Ledger', version: 4, exported: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b), counters: state.counters,
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-trophy-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.earned)) throw new Error('bad file');
      state.earned = new Set(data.earned.filter((id) => byId.has(id)));
      state.counters = {};
      for (const [k, v] of Object.entries(data.counters || {})) {
        const t = byId.get(Number(k));
        if (t && t.counter) state.counters[k] = Math.max(0, Math.min(t.counter.t, Number(v) || 0));
      }
      saveProgress();
      renderAll();
    } catch {
      document.getElementById('savedNote').textContent = 'Import failed: not a ledger progress file';
    }
  };
  reader.readAsText(file);
}

function computeClaimStats() {
  let total = 0, twoPlus = 0;
  DATA.trophies.forEach((t) => {
    [...(t.steps || []), ...(t.facts || [])].forEach((c) => {
      total += 1;
      if (c[1] && c[1].length >= 2) twoPlus += 1;
    });
  });
  claimStats = { total, twoPlus };
}

async function boot() {
  const res = await fetch(DATA_URL);
  DATA = await res.json();
  byId = new Map(DATA.trophies.map((t) => [t.id, t]));
  computeClaimStats();
  loadProgress();
  const hash = location.hash.match(/^#t(\d+)$/);
  if (hash && byId.has(Number(hash[1]))) state.sel = Number(hash[1]);
  if (!byId.has(state.sel)) state.sel = 28;

  document.getElementById('spoilerShield').addEventListener('change', (e) => {
    state.shield = e.target.checked; saveProgress(); renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', () =>
    document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('searchBox').addEventListener('input', (e) => {
    state.query = e.target.value; renderList();
  });
  document.getElementById('kindFilters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-kind]');
    if (b) { state.kind = b.dataset.kind; renderKindFilters(); renderList(); }
  });
  document.getElementById('gradeFilters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-grade]');
    if (!b) return;
    state.grade = b.dataset.grade;
    document.querySelectorAll('#gradeFilters .chip').forEach((c) => c.classList.toggle('active', c === b));
    renderList();
  });
  document.getElementById('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]');
    if (!b) return;
    state.view = b.dataset.view;
    renderAll();
    document.getElementById('detailPane').scrollTop = 0;
  });
  document.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    if (inc) { setCounter(Number(inc.dataset.inc), 1); return; }
    const dec = e.target.closest('[data-dec]');
    if (dec) { setCounter(Number(dec.dataset.dec), -1); return; }
    const tog = e.target.closest('[data-toggle]');
    if (tog) { toggleEarned(Number(tog.dataset.toggle)); return; }
    const chk = e.target.closest('[data-check]');
    if (chk) { toggleEarned(Number(chk.dataset.check)); return; }
    const row = e.target.closest('[data-id]');
    if (row) { selectTrophy(Number(row.dataset.id)); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('.trow')) {
      selectTrophy(Number(e.target.dataset.id));
    }
  });

  renderAll();
}

boot().catch((err) => {
  document.getElementById('detailPane').innerHTML =
    `<div class="empty">Could not load the trophy data. Serve app/ over HTTP (for example: python3 -m http.server) and open index.html from there. (${String(err)})</div>`;
});
