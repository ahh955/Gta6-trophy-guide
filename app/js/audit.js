// audit.js — the audit strip: every number on the cover is computed from the
// loaded data at startup, never hardcoded, so it cannot drift from the guide.

export function computeAudit(trophies, sources) {
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let steps = 0;
  let cited = 0;
  let multi = 0;
  let single = 0;
  let hidden = 0;
  let missable = 0;
  let timeSensitive = 0;
  let watch = 0;
  let unconfirmed = 0;
  let disputes = 0;
  let gates = 0;
  for (const t of trophies) {
    grades[t.grade] = (grades[t.grade] || 0) + 1;
    if (t.hidden) hidden += 1;
    if (t.missable === 'missable') missable += 1;
    if (t.missable === 'time-sensitive') timeSensitive += 1;
    if (t.missable === 'watch') watch += 1;
    if (t.unconfirmed) unconfirmed += 1;
    if (t.dispute) disputes += 1;
    if (t.gate) gates += 1;
    for (const step of t.steps || []) {
      steps += 1;
      if (step.cites && step.cites.length > 0) cited += 1;
      if (step.cites && step.cites.length >= 2) multi += 1;
      else if (step.cites && step.cites.length === 1) single += 1;
    }
  }
  const hosts = new Set();
  for (const s of sources) {
    try {
      hosts.add(new URL(s.url).hostname.replace(/^www\./, ''));
    } catch {
      // A source without a parseable URL still counts as a source.
    }
  }
  return {
    total: trophies.length,
    grades,
    claims: steps,
    citedClaims: cited,
    multiSource: multi,
    singleSource: single,
    unconfirmed,
    disputes,
    gates,
    distinctHosts: hosts.size,
    totalSteps: steps,
    sourceCount: sources.length,
    hidden,
    missable,
    timeSensitive,
    watch,
  };
}

export function renderAuditStrip(el, audit) {
  const cells = [
    ['Trophies', audit.total],
    ['Grades', `${audit.grades.platinum}P · ${audit.grades.gold}G · ${audit.grades.silver}S · ${audit.grades.bronze}B`],
    ['Steps', audit.totalSteps],
    ['Cited steps', `${audit.citedClaims} / ${audit.claims}`],
    ['Multi-source', audit.multiSource],
    ['Single-source', audit.singleSource],
    ['Disputes noted', audit.disputes],
    ['Unconfirmed', audit.unconfirmed],
    ['Sources', `${audit.sourceCount} · ${audit.distinctHosts} hosts`],
    ['Hidden', audit.hidden],
    ['Missable', `${audit.missable} + ${audit.timeSensitive} timed + ${audit.watch} watch`],
    ['Gates noted', audit.gates],
  ];
  el.innerHTML =
    '<div class="audit-title">Audit strip — every number below is counted from the data at load, not typed in.</div>' +
    '<div class="audit-grid">' +
    cells.map(([label, value]) => `<div class="audit-cell"><span class="audit-value">${value}</span><span class="audit-label">${label}</span></div>`).join('') +
    '</div>';
}
