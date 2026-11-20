// matrix.js — the source matrix: for each numbered source, how many of the
// 55 trophy guides cite it. Coverage is counted from the trophy data itself,
// so adding a citation anywhere updates the matrix automatically.

import { esc } from './data.js';

export function computeMatrix(trophies, sources) {
  return sources.map((source) => {
    let citedBy = 0;
    let stepCites = 0;
    for (const t of trophies) {
      let trophyHits = 0;
      for (const step of t.steps || []) {
        if ((step.cites || []).includes(source.id)) {
          stepCites += 1;
          trophyHits += 1;
        }
      }
      if (trophyHits > 0) citedBy += 1;
    }
    return { ...source, citedBy, stepCites };
  });
}

export function renderMatrix(el, matrix, totalTrophies, unread) {
  const rows = matrix
    .map(
      (s) => `<tr>
        <td class="src-num">[${s.id}]</td>
        <td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.site)}</a><div class="src-title">${esc(s.title)}</div></td>
        <td>${esc(s.read)}</td>
        <td class="src-cover"><strong>${s.citedBy} / ${totalTrophies}</strong><div class="src-bar"><span style="width:${Math.round((s.citedBy / totalTrophies) * 100)}%"></span></div><span class="src-steps">${s.stepCites} step citations</span></td>
        <td>${esc(s.used_for)}</td>
        <td>${esc(s.depth)}</td>
      </tr>`,
    )
    .join('');
  const unreadRows = (unread || [])
    .map(
      (u) => `<tr class="unread-row"><td>—</td><td><a href="${esc(u.url)}" target="_blank" rel="noopener">${esc(u.site)}</a><div class="src-title">${esc(u.title)}</div></td><td>${esc(u.attempted)}</td><td colspan="3">${esc(u.reason)}</td></tr>`,
    )
    .join('');
  el.innerHTML = `<p class="view-intro">Every guide step in this entry cites numbered sources. The coverage counts below are counted from the trophy data at load — they are not typed in. A page that refused to load is listed as unread and is never cited.</p>
    <table class="matrix-table">
      <thead><tr><th>#</th><th>Source</th><th>Read</th><th>Cited by how many of the ${totalTrophies} guides</th><th>Used for</th><th>Depth</th></tr></thead>
      <tbody>${rows}${unreadRows}</tbody>
    </table>
    <p class="method-note"><strong>Method.</strong> Where the sources disagree, the trophy says so instead of picking a winner — see the dispute notes on ${matrix.length ? 'the trophies flagged in the tracker' : 'the trophies'}. Where no source has confirmed a method, the trophy is marked unconfirmed and the best lead is labelled a guess.</p>`;
}
