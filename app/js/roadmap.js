// roadmap.js — the platinum roadmap view. Stage metadata comes from
// roadmap.json; each stage's trophy list is derived from the trophies'
// stage field, so the roadmap can never drift from the tracker data.

import { esc, gradeLabel, kindLabel } from './data.js';

export function renderRoadmap(el, trophies, roadmap, earned, onOpen) {
  const byStage = new Map();
  for (const t of trophies) {
    if (!byStage.has(t.stage)) byStage.set(t.stage, []);
    byStage.get(t.stage).push(t);
  }
  const head = `<p class="view-intro">Difficulty <strong>${esc(roadmap.difficulty)}</strong> · about <strong>${esc(roadmap.hours_total)}</strong> · <strong>${roadmap.playthroughs} playthrough</strong> · <strong>${roadmap.online} online trophies</strong>. ${esc(roadmap.missable_summary)}</p>
    <div class="roadmap-notes">
      <div><strong>Manual saves.</strong> ${esc(roadmap.saves)}</div>
      <div><strong>Cheats.</strong> ${esc(roadmap.cheats)}</div>
    </div>`;
  const stages = roadmap.stages
    .map((stage) => {
      const list = (byStage.get(stage.id) || []).slice().sort((a, b) => a.id - b.id);
      const done = list.filter((t) => earned.has(t.id)).length;
      const chips = list
        .map(
          (t) => `<button type="button" class="stage-chip ${earned.has(t.id) ? 'earned' : ''}" data-open="${t.id}" title="${esc(t.name)} — ${gradeLabel(t.grade)} · ${kindLabel(t.kind)}">
            <span class="chip-grade grade-${t.grade}">${t.grade.slice(0, 1).toUpperCase()}</span>
            <span class="chip-name">${esc(t.name)}</span>
            ${t.missable !== 'no' ? '<span class="chip-flag">!</span>' : ''}
            ${t.unconfirmed ? '<span class="chip-flag" title="Unconfirmed">?</span>' : ''}
          </button>`,
        )
        .join('');
      const tips = (stage.tips || []).map((tip) => `<li>${esc(tip)}</li>`).join('');
      return `<section class="stage">
        <header class="stage-head">
          <h3>Stage ${stage.id}: ${esc(stage.title)}</h3>
          <span class="stage-hours">${esc(stage.hours)}</span>
          <span class="stage-progress">${done} / ${list.length} earned</span>
        </header>
        <p class="stage-blurb">${esc(stage.blurb)}</p>
        <div class="stage-chips">${chips}</div>
        <ul class="stage-tips">${tips}</ul>
      </section>`;
    })
    .join('');
  el.innerHTML = head + stages;
  el.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => onOpen(Number(btn.dataset.open)));
  });
}
