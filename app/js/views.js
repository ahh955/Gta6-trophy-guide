// Leonida Trophy Atlas — views: the checklist and its detail pane, the
// roadmap, the missables page and the sources page. Each render function
// returns HTML; main.js wires the events by delegation.
import { GRADE_LABELS, KINDS, SOURCE_URLS, STAGES } from './config.js';
import { rarityBand, trophyById } from './data.js';

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// A trophy is spoiler-hidden when the spoiler setting is on, the trophy is
// hidden on PlayStation, it is not earned yet and the reader has not
// revealed it this session.
export function isSpoilerHidden(trophy, ctx) {
  return (
    ctx.ui.spoilers &&
    trophy.hidden &&
    !ctx.progress.earned?.[trophy.id] &&
    !ctx.ui.revealed.has(trophy.id)
  );
}

function medalHtml(grade) {
  return `<span class="medal ${grade}" title="${GRADE_LABELS[grade]}" aria-hidden="true"></span>`;
}

function chipsHtml(trophy) {
  const chips = [];
  chips.push(`<span class="chip kind">${KINDS[trophy.kind] ?? trophy.kind}</span>`);
  chips.push(
    `<span class="chip grade-${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>`,
  );
  chips.push(
    `<span class="chip">${trophy.rarity}% · ${rarityBand(trophy.rarity)}</span>`,
  );
  if (trophy.target) chips.push(`<span class="chip">Target ${trophy.target}</span>`);
  if (trophy.hidden) chips.push('<span class="chip hidden">Hidden</span>');
  if (trophy.missable) chips.push('<span class="chip missable">Missable</span>');
  if (trophy.unconfirmed) chips.push('<span class="chip unconfirmed">Unconfirmed</span>');
  return chips.join('');
}

function rowHtml(trophy, ctx) {
  const earned = Boolean(ctx.progress.earned?.[trophy.id]);
  const selected = ctx.ui.selected === trophy.id;
  const hidden = isSpoilerHidden(trophy, ctx);
  const classes = ['row'];
  if (earned) classes.push('earned');
  if (selected) classes.push('selected');
  if (hidden) classes.push('blurred');
  const name = hidden ? 'Hidden trophy' : escapeHtml(trophy.name);
  const desc = hidden ? 'Hidden until earned' : escapeHtml(trophy.description);
  return `<article class="${classes.join(' ')}" data-row="${trophy.id}" tabindex="0" role="button" aria-label="${escapeHtml(trophy.name)}">
    <input class="check" type="checkbox" data-check="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Earned: ${escapeHtml(trophy.name)}">
    ${medalHtml(trophy.grade)}
    <div class="row-body">
      <div class="row-name">${name}</div>
      <div class="row-desc">${desc}</div>
      ${hidden ? '<div class="reveal-hint">Spoiler hidden — use Reveal to peek.</div>' : ''}
      <div class="row-chips">${chipsHtml(trophy)}</div>
    </div>
    ${hidden ? `<button class="reveal-btn" type="button" data-reveal="${trophy.id}">Reveal</button>` : ''}
  </article>`;
}

export function checklistHtml(ctx, visible) {
  const { ui } = ctx;
  const kindOptions = ['all', ...Object.keys(KINDS)]
    .map(
      (k) =>
        `<option value="${k}" ${ui.kind === k ? 'selected' : ''}>${k === 'all' ? 'All kinds' : KINDS[k]}</option>`,
    )
    .join('');
  const gradeOptions = ['all', 'platinum', 'gold', 'silver', 'bronze']
    .map(
      (g) =>
        `<option value="${g}" ${ui.grade === g ? 'selected' : ''}>${g === 'all' ? 'All grades' : GRADE_LABELS[g]}</option>`,
    )
    .join('');
  const statusOptions = [
    ['all', 'All trophies'],
    ['earned', 'Earned'],
    ['remaining', 'Remaining'],
    ['missable', 'Missable'],
    ['unconfirmed', 'Unconfirmed'],
  ]
    .map(
      ([v, label]) =>
        `<option value="${v}" ${ui.status === v ? 'selected' : ''}>${label}</option>`,
    )
    .join('');
  const sortOptions = [
    ['roadmap', 'Roadmap order'],
    ['az', 'A–Z'],
    ['rarest', 'Rarest first'],
    ['grade', 'Grade'],
  ]
    .map(
      ([v, label]) =>
        `<option value="${v}" ${ui.sort === v ? 'selected' : ''}>${label}</option>`,
    )
    .join('');
  const rows =
    visible.length > 0
      ? visible.map((t) => rowHtml(t, ctx)).join('')
      : `<div class="empty">No trophies match these filters. <button class="reveal-btn" type="button" data-clear-filters>Clear filters</button></div>`;
  return `<div class="toolbar" role="search">
      <input class="search" id="searchBox" type="search" placeholder="Search name, description or guide…" value="${escapeHtml(ui.query)}" aria-label="Search trophies">
      <select class="select" id="kindFilter" aria-label="Filter by kind">${kindOptions}</select>
      <select class="select" id="gradeFilter" aria-label="Filter by grade">${gradeOptions}</select>
      <select class="select" id="statusFilter" aria-label="Filter by status">${statusOptions}</select>
      <select class="select" id="sortSelect" aria-label="Sort order">${sortOptions}</select>
      <label class="switch"><input type="checkbox" id="spoilerToggle" ${ui.spoilers ? 'checked' : ''}> Hide spoilers</label>
      <span class="result-count">${visible.length} of ${ctx.trophies.length} trophies</span>
    </div>
    <div class="split">
      <section class="list" id="trophyList" aria-label="Trophy checklist">${rows}</section>
      <aside class="detail" id="detailPane" aria-label="Trophy guide">${detailHtml(ctx)}</aside>
    </div>`;
}

export function detailHtml(ctx) {
  const trophy = trophyById(ctx.trophies, ctx.ui.selected);
  if (!trophy) {
    return `<div class="detail-empty">
      <div class="big-mark">✦</div>
      <p><strong>Pick a trophy</strong> to read its guide, sources and notes.</p>
      <p>Check a trophy off when you earn it — your progress saves in this browser.</p>
    </div>`;
  }
  const earned = Boolean(ctx.progress.earned?.[trophy.id]);
  const hidden = isSpoilerHidden(trophy, ctx);
  const note = ctx.progress.notes?.[trophy.id] ?? '';
  const name = hidden ? 'Hidden trophy' : escapeHtml(trophy.name);
  const desc = hidden ? 'Hidden until earned' : escapeHtml(trophy.description);
  const guide = hidden
    ? 'This guide is hidden while the spoiler setting is on. Reveal it to read the method, or earn the trophy to unhide it for good.'
    : escapeHtml(trophy.guide);
  const sources = (trophy.sources ?? [])
    .map((s) => {
      const url = SOURCE_URLS[s];
      return url
        ? `<a href="${url}" target="_blank" rel="noopener">${s}</a>`
        : escapeHtml(s);
    })
    .join('');
  return `<div class="${hidden ? 'blurred' : ''}">
      <div class="row-chips">${chipsHtml(trophy)}</div>
      <h2>${name}</h2>
      <p class="detail-desc">${desc}</p>
      <div class="meta-grid">
        <div class="meta-cell"><div class="k">Rarity</div><div class="v">${trophy.rarity}% · ${rarityBand(trophy.rarity)}</div></div>
        <div class="meta-cell"><div class="k">Roadmap</div><div class="v">Stage ${trophy.stage} · ${escapeHtml(STAGES[trophy.stage - 1]?.title ?? '')}</div></div>
        ${trophy.target ? `<div class="meta-cell"><div class="k">PSN target</div><div class="v">${trophy.target}</div></div>` : ''}
        <div class="meta-cell"><div class="k">Status</div><div class="v">${earned ? 'Earned ✓' : 'Not earned yet'}</div></div>
      </div>
      <div class="guide-label">Guide</div>
      <div class="guide-text"><p>${guide}</p></div>
    </div>
    ${hidden ? '<p class="reveal-hint">Spoiler blur is on for this hidden trophy. The guide above is blurred until you reveal it.</p><button class="reveal-btn" type="button" data-reveal="' + trophy.id + '">Reveal this trophy</button>' : ''}
    <div class="sources"><strong>Sources:</strong> ${sources}</div>
    <label class="note-label" for="noteBox">Your note</label>
    <textarea class="note-box" id="noteBox" placeholder="Where you are with this one, a spot that worked…" data-note="${trophy.id}">${escapeHtml(note)}</textarea>
    <div class="detail-actions">
      <button class="btn primary" type="button" data-toggle-earned="${trophy.id}">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>
    </div>`;
}

export function roadmapHtml(ctx) {
  const stages = STAGES.map((stage) => {
    const members = ctx.trophies.filter((t) => t.stage === stage.n);
    const done = members.filter((t) => ctx.progress.earned?.[t.id]).length;
    const pct = members.length ? Math.round((100 * done) / members.length) : 0;
    const chips = members
      .map((t) => {
        const earned = Boolean(ctx.progress.earned?.[t.id]);
        return `<button class="trophy-chip ${earned ? 'done' : ''}" type="button" data-goto="${t.id}">${escapeHtml(t.name)}</button>`;
      })
      .join('');
    return `<section class="card stage ${done === members.length ? 'done' : ''}">
      <div class="stage-num">${stage.n}</div>
      <div class="stage-head"><h3>${escapeHtml(stage.title)}</h3><span class="time-badge">${escapeHtml(stage.time)}</span></div>
      <p>${escapeHtml(stage.blurb)}</p>
      <div class="mini-bar"><div class="fill" style="width:${pct}%"></div></div>
      <p><strong>${done} of ${members.length} earned</strong> · ${members.length - done} to go</p>
      <div class="trophy-chips">${chips}</div>
    </section>`;
  }).join('');
  return `<div class="page">
    <h2>Roadmap to the platinum</h2>
    <p class="lede">About 200 hours at a 4/10 difficulty (PowerPyx), in one playthrough — no online trophies, no DLC, no mission replay. Play the story first, then grind the 100% checklist, then clean up the strangers and feats.</p>
    ${stages}
  </div>`;
}

export function missablesHtml(ctx) {
  const pma = trophyById(ctx.trophies, 28);
  const earned = Boolean(ctx.progress.earned?.[28]);
  return `<div class="page">
    <h2>Missables</h2>
    <p class="lede">Good news: of all 55 trophies, only one can be missed at all — and it only takes a minute to secure.</p>
    <section class="card alert-card">
      <h3>⚠ ${escapeHtml(pma.name)} — the only missable trophy</h3>
      <p><strong>${escapeHtml(pma.description)}</strong> — meditate at all 18 spots across Leonida (10 locations; each spot counts +2 if you meditate there with both Jason and Lucia).</p>
      <p>The very first meditation happens at Jason's house in <strong>Chapter 1</strong> and is gone after that chapter. PowerPyx is not sure yet whether it is required for the trophy — it raises the counter but isn't marked as a spot — but their author earned the trophy after doing it. Do it to be safe:</p>
      <ol class="steps">
        <li>Play through Chapter 1 until after the mission <strong>Down to Earth</strong>.</li>
        <li>In the morning, talk to Lucia in the kitchen — she says “You know what I'm gonna do? Meditate”.</li>
        <li>Follow her to the balcony and choose <strong>Accept</strong> when prompted.</li>
        <li>She shows you how to meditate. Done — the counter goes up by 1.</li>
      </ol>
      <p>The final meditation needs Jason and Lucia playable together, which unlocks after Chapter 2's <strong>Coffee Break</strong>. And the 100% checklist only asks for 15 of 18 spots, so the missable one can never cost you A Long Road.</p>
      <p><button class="btn primary" type="button" data-goto="28">Open its guide${earned ? ' (earned ✓)' : ''}</button></p>
    </section>
    <section class="card">
      <h3>Everything else is safe</h3>
      <ul class="safe-list">
        <li><strong>Story trophies</strong> are unmissable — they pop as you play the missions.</li>
        <li><strong>Nothing on the 100% checklist is missable</strong> — free-roam continues after the story and everything stays accessible.</li>
        <li><strong>Optional missions</strong> that disappear don't matter for trophies — there are far more than the 100 the checklist wants.</li>
        <li><strong>Kenton</strong> goes quiet after Chapter 1 but comes back in Chapters 2–3, so his trophy is safe.</li>
        <li><strong>Cheats disable trophies and saving</strong> (PowerPyx) — keep them off for a trophy run. The 61 cheats only unlock after the story anyway.</li>
        <li>Keep a save at the start and end of each chapter (PowerPyx's advice) — there is no mission replay.</li>
      </ul>
    </section>
  </div>`;
}

export function sourcesHtml(ctx) {
  const cards = (ctx.data.sources ?? [])
    .map(
      (s) => `<section class="card source-card">
        <h3>${escapeHtml(s.name)}</h3>
        <p>${escapeHtml(s.what)}</p>
        <p><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">Open ${escapeHtml(s.name)} ↗</a></p>
      </section>`,
    )
    .join('');
  return `<div class="page">
    <h2>Sources &amp; tools</h2>
    <p class="lede">Every trophy's name, description and grade come from the official list as Exophase and PSNProfiles publish it; the methods come from PowerPyx's guide, reworded here in our own words. Nothing is copied.</p>
    <div class="source-grid">${cards}</div>
    <section class="card">
      <h3>About the data</h3>
      <p>Checked 19 November 2026, launch day — so the Exophase earn rates are launch-day rates: almost everything reads Ultra Rare because the game has been out for hours. They will climb fast; the bands here are a snapshot, not a verdict on difficulty.</p>
      <p>Three trophies are still unconfirmed (PowerPyx, 19 November): <strong>In The Beginning…</strong>, <strong>Bad Luck, I Guess</strong> and <strong>Ten Pin</strong>. Their guides say so plainly instead of guessing. One more, <strong>The Truth Is Out There</strong>, was cracked by PowerPyx on launch day — its guide carries the UFO method.</p>
      <p>Hidden flags follow GTA Zone's split: 28 hidden (27 bronze, 1 gold), 27 visible. PSN progress targets (such as 42 Shooting Range challenges) come from PSNProfiles.</p>
    </section>
    <section class="card">
      <h3>Your progress</h3>
      <p>Progress and notes live in this browser's localStorage — nothing is uploaded anywhere. Export a backup, import it on another machine, or reset and start over.</p>
      <div class="tools-row">
        <button class="btn" type="button" data-export>Export progress</button>
        <button class="btn" type="button" data-import>Import progress</button>
        <button class="btn danger" type="button" data-reset>Reset progress</button>
      </div>
      <input type="file" id="importFile" accept="application/json,.json" hidden>
    </section>
  </div>`;
}
