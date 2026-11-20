// main.js — wires the guide together: loads the data, renders the audit
// strip, routes between the four views, and owns the filters, the progress
// meter, the spoiler toggle, export/import and the shared-progress links.

import { loadGuideData } from './data.js';
import {
  DEMO_EARNED,
  buildHash,
  downloadText,
  exportProgress,
  importProgress,
  loadEarned,
  loadSpoilersHidden,
  parseHash,
  saveEarned,
  saveSpoilersHidden,
  shareLink,
} from './store.js';
import { computeAudit, renderAuditStrip } from './audit.js';
import { computeMatrix, renderMatrix } from './matrix.js';
import { renderRoadmap } from './roadmap.js';
import { renderDetail, renderMissables, renderTrackerList } from './views.js';

const VIEWS = ['tracker', 'roadmap', 'missables', 'sources'];

const state = {
  trophies: [],
  sources: [],
  roadmap: null,
  unread: [],
  byId: new Map(),
  sourceById: new Map(),
  earned: loadEarned(),
  spoilersHidden: loadSpoilersHidden(),
  view: 'tracker',
  selectedId: null,
  filters: { grade: 'all', kind: 'all', stage: 'all', missable: 'all', status: 'all', query: '', sort: 'roadmap' },
};

const $ = (id) => document.getElementById(id);

function applyDeepLink() {
  const link = parseHash();
  if (VIEWS.includes(link.view)) state.view = link.view;
  if (link.trophy) state.selectedId = link.trophy;
  if (link.filter === 'missable') state.filters.missable = 'missable';
  if (link.filter === 'hidden') state.filters.missable = 'hidden';
  if (link.filter === 'unconfirmed') state.filters.missable = 'unconfirmed';
  if (link.earned) {
    // A shared-progress link loads its ticks like an import.
    state.earned = link.earned;
    saveEarned(state.earned);
  }
  // ?seed=demo pre-earns a spread of trophies, for screenshots and a quick look.
  const query = new URLSearchParams(window.location.search);
  if (query.get('seed') === 'demo' && state.earned.size === 0) {
    state.earned = new Set(DEMO_EARNED);
    saveEarned(state.earned);
  }
  if (query.get('view') && VIEWS.includes(query.get('view'))) state.view = query.get('view');
  const qt = query.get('trophy');
  if (qt && state.byId.has(Number(qt))) state.selectedId = Number(qt);
}

function syncHash() {
  const hash = buildHash(state.view, state.selectedId, state.filters.missable !== 'all' ? state.filters.missable : null);
  if (window.location.hash !== hash) history.replaceState(null, '', hash || window.location.pathname + window.location.search);
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('progress-count').textContent = `${done} / ${total} earned`;
  $('progress-bar').style.width = `${pct}%`;
  $('progress-bar').setAttribute('aria-valuenow', String(pct));
  $('progress-pct').textContent = `${pct}%`;
}

function renderNav() {
  document.querySelectorAll('[data-view-tab]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.viewTab === state.view);
    btn.setAttribute('aria-current', btn.dataset.viewTab === state.view ? 'page' : 'false');
  });
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.dataset.view === state.view);
  });
}

function renderTracker() {
  renderTrackerList($('tracker-list'), state.trophies, state, {
    onOpen: (id) => {
      state.selectedId = id;
      renderDetail($('detail-pane'), state.byId.get(id), state.sourceById, state);
      renderTracker();
      syncHash();
      $('detail-pane').scrollIntoView({ block: 'nearest' });
    },
    onToggle: (id, checked) => {
      if (checked) state.earned.add(id);
      else state.earned.delete(id);
      saveEarned(state.earned);
      renderProgress();
      renderDetail($('detail-pane'), state.selectedId ? state.byId.get(state.selectedId) : null, state.sourceById, state);
      renderTracker();
    },
  });
  renderDetail($('detail-pane'), state.selectedId ? state.byId.get(state.selectedId) : null, state.sourceById, state);
}

function renderCurrentView() {
  renderNav();
  renderProgress();
  if (state.view === 'tracker') renderTracker();
  if (state.view === 'roadmap') {
    renderRoadmap($('roadmap-view'), state.trophies, state.roadmap, state.earned, (id) => {
      state.view = 'tracker';
      state.selectedId = id;
      renderCurrentView();
      syncHash();
    });
  }
  if (state.view === 'missables') {
    renderMissables($('missables-view'), state.trophies, (id) => {
      state.view = 'tracker';
      state.selectedId = id;
      renderCurrentView();
      syncHash();
    });
  }
  if (state.view === 'sources') {
    renderMatrix($('sources-view'), computeMatrix(state.trophies, state.sources), state.trophies.length, state.unread);
  }
}

function bindControls() {
  document.querySelectorAll('[data-view-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.viewTab;
      renderCurrentView();
      syncHash();
    });
  });
  $('search').addEventListener('input', (e) => {
    state.filters.query = e.target.value.trim();
    renderTracker();
  });
  for (const key of ['grade', 'kind', 'stage', 'missable', 'status', 'sort']) {
    $(`filter-${key}`).addEventListener('change', (e) => {
      state.filters[key] = e.target.value;
      renderTracker();
      syncHash();
    });
  }
  $('spoiler-toggle').addEventListener('change', (e) => {
    state.spoilersHidden = e.target.checked;
    saveSpoilersHidden(state.spoilersHidden);
    renderTracker();
  });
  $('export-btn').addEventListener('click', () => {
    downloadText('gta6-trophy-progress.json', exportProgress(state.earned));
  });
  $('import-btn').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      state.earned = importProgress(await file.text());
      saveEarned(state.earned);
      renderCurrentView();
      $('import-note').textContent = `Imported ${state.earned.size} earned trophies.`;
    } catch (err) {
      $('import-note').textContent = `Import failed: ${err.message}`;
    }
    e.target.value = '';
  });
  $('share-btn').addEventListener('click', async () => {
    const link = shareLink(state.earned);
    try {
      await navigator.clipboard.writeText(link);
      $('share-note').textContent = 'Shared-progress link copied.';
    } catch {
      $('share-note').textContent = link;
    }
  });
  $('reset-btn').addEventListener('click', () => {
    state.earned = new Set();
    saveEarned(state.earned);
    renderCurrentView();
  });
  $('detail-pane').addEventListener('detail-close', () => {
    state.selectedId = null;
    renderTracker();
    syncHash();
  });
  window.addEventListener('hashchange', () => {
    applyDeepLink();
    renderCurrentView();
  });
}

async function init() {
  const data = await loadGuideData();
  Object.assign(state, data);
  applyDeepLink();
  renderAuditStrip($('audit-strip'), computeAudit(state.trophies, state.sources));
  $('spoiler-toggle').checked = state.spoilersHidden;
  $('filter-missable').value = state.filters.missable;
  bindControls();
  renderCurrentView();
  syncHash();
}

init().catch((err) => {
  $('tracker-list').innerHTML = `<p class="empty">The guide data failed to load: ${err.message}. Serve the app/ folder over HTTP (node serve.ts) and reload.</p>`;
});
