// Leonida Trophy Atlas — boot and wiring: loads the data, reads the deep
// links (?view=, ?trophy=, ?spoilers=, ?seed=demo), renders the current view
// and answers every click from one delegated listener.
import { TOTAL_TROPHIES } from './config.js';
import { earnedCount, earnedPoints, loadTrophies } from './data.js';
import {
  demoProgress,
  exportProgress,
  importProgress,
  loadProgress,
  resetProgress,
  saveProgress,
} from './store.js';
import { applyFilters, sortTrophies } from './filters.js';
import {
  checklistHtml,
  missablesHtml,
  roadmapHtml,
  sourcesHtml,
} from './views.js';

const PREFS_KEY = 'leonida-trophy-atlas-prefs';

const ctx = {
  data: null,
  trophies: [],
  progress: loadProgress(),
  ui: {
    view: 'checklist',
    kind: 'all',
    grade: 'all',
    status: 'all',
    sort: 'roadmap',
    query: '',
    spoilers: true,
    selected: null,
    revealed: new Set(),
    theme: 'paper',
    demo: false,
  },
};

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

function savePrefs() {
  try {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ theme: ctx.ui.theme, spoilers: ctx.ui.spoilers }),
    );
  } catch {
    // Preferences are a nicety; the app works without them.
  }
}

function readDeepLinks() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (['checklist', 'roadmap', 'missables', 'sources'].includes(view)) {
    ctx.ui.view = view;
  }
  const trophy = Number(params.get('trophy'));
  if (Number.isInteger(trophy) && trophy >= 1 && trophy <= TOTAL_TROPHIES) {
    ctx.ui.selected = trophy;
  }
  const spoilers = params.get('spoilers');
  if (spoilers === 'on') ctx.ui.spoilers = true;
  if (spoilers === 'off') ctx.ui.spoilers = false;
  if (params.get('seed') === 'demo') {
    ctx.progress = demoProgress();
    ctx.ui.demo = true;
  }
}

function syncUrl() {
  try {
    const params = new URLSearchParams();
    if (ctx.ui.view !== 'checklist') params.set('view', ctx.ui.view);
    if (ctx.ui.selected) params.set('trophy', String(ctx.ui.selected));
    if (!ctx.ui.spoilers) params.set('spoilers', 'off');
    if (ctx.ui.demo) params.set('seed', 'demo');
    const query = params.toString();
    history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  } catch {
    // file:// and sandboxed frames may refuse replaceState; the app is fine.
  }
}

function visibleTrophies() {
  const filtered = applyFilters(ctx.trophies, ctx.ui, ctx.progress);
  return sortTrophies(filtered, ctx.ui.sort);
}

function updateHeader() {
  const earned = earnedCount(ctx.progress);
  const points = earnedPoints(ctx.trophies, ctx.progress);
  const pct = Math.round((100 * earned) / TOTAL_TROPHIES);
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressMeta').textContent =
    `${pct}% complete · ${points.toLocaleString()} PSN points · ${TOTAL_TROPHIES - earned} to go`;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === ctx.ui.view);
  });
}

function render() {
  const app = document.getElementById('app');
  if (ctx.ui.view === 'roadmap') app.innerHTML = roadmapHtml(ctx);
  else if (ctx.ui.view === 'missables') app.innerHTML = missablesHtml(ctx);
  else if (ctx.ui.view === 'sources') app.innerHTML = sourcesHtml(ctx);
  else app.innerHTML = checklistHtml(ctx, visibleTrophies());
  updateHeader();
  syncUrl();
}

function applyTheme() {
  document.documentElement.dataset.theme = ctx.ui.theme;
  document.getElementById('themeToggle').textContent =
    ctx.ui.theme === 'night' ? 'Paper mode' : 'Night mode';
}

function toggleEarned(id) {
  if (ctx.progress.earned[id]) delete ctx.progress.earned[id];
  else ctx.progress.earned[id] = true;
  if (!ctx.ui.demo) saveProgress(ctx.progress);
  render();
}

function selectTrophy(id, { scroll = false } = {}) {
  ctx.ui.selected = id;
  ctx.ui.view = 'checklist';
  render();
  if (scroll) {
    document.querySelector(`[data-row="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  }
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const tab = event.target.closest('.tab');
    if (tab) {
      ctx.ui.view = tab.dataset.view;
      render();
      return;
    }
    const reveal = event.target.closest('[data-reveal]');
    if (reveal) {
      ctx.ui.revealed.add(Number(reveal.dataset.reveal));
      ctx.ui.selected = Number(reveal.dataset.reveal);
      render();
      return;
    }
    const toggle = event.target.closest('[data-toggle-earned]');
    if (toggle) {
      toggleEarned(Number(toggle.dataset.toggleEarned));
      return;
    }
    const goto = event.target.closest('[data-goto]');
    if (goto) {
      selectTrophy(Number(goto.dataset.goto), { scroll: true });
      return;
    }
    if (event.target.closest('[data-export]')) {
      exportProgress(ctx.progress);
      return;
    }
    if (event.target.closest('[data-import]')) {
      document.getElementById('importFile')?.click();
      return;
    }
    if (event.target.closest('[data-reset]')) {
      if (window.confirm('Reset all earned trophies and notes?')) {
        ctx.progress = resetProgress();
        ctx.ui.demo = false;
        render();
      }
      return;
    }
    if (event.target.closest('[data-clear-filters]')) {
      Object.assign(ctx.ui, { kind: 'all', grade: 'all', status: 'all', query: '' });
      render();
      return;
    }
    if (event.target.closest('#themeToggle')) {
      ctx.ui.theme = ctx.ui.theme === 'night' ? 'paper' : 'night';
      applyTheme();
      savePrefs();
      return;
    }
    const row = event.target.closest('[data-row]');
    if (row && !event.target.closest('input, button, a, select, textarea')) {
      ctx.ui.selected = Number(row.dataset.row);
      render();
    }
  });

  document.addEventListener('keydown', (event) => {
    const row = event.target.closest?.('[data-row]');
    if (row && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      ctx.ui.selected = Number(row.dataset.row);
      render();
    }
  });

  document.addEventListener('change', (event) => {
    const check = event.target.closest('[data-check]');
    if (check) {
      toggleEarned(Number(check.dataset.check));
      return;
    }
    const { id, value } = event.target;
    if (id === 'kindFilter') ctx.ui.kind = value;
    else if (id === 'gradeFilter') ctx.ui.grade = value;
    else if (id === 'statusFilter') ctx.ui.status = value;
    else if (id === 'sortSelect') ctx.ui.sort = value;
    else if (id === 'spoilerToggle') {
      ctx.ui.spoilers = event.target.checked;
      savePrefs();
    } else if (id === 'importFile') {
      const file = event.target.files?.[0];
      if (file) {
        importProgress(file)
          .then((clean) => {
            ctx.progress = clean;
            saveProgress(clean);
            render();
          })
          .catch(() => window.alert('That file is not a Leonida Trophy Atlas export.'));
      }
      return;
    } else {
      return;
    }
    render();
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'searchBox') {
      ctx.ui.query = event.target.value;
      render();
      const box = document.getElementById('searchBox');
      box?.focus();
      box?.setSelectionRange(box.value.length, box.value.length);
      return;
    }
    if (event.target.id === 'noteBox') {
      const id = Number(event.target.dataset.note);
      const value = event.target.value.trim();
      if (value) ctx.progress.notes[id] = event.target.value;
      else delete ctx.progress.notes[id];
      if (!ctx.ui.demo) saveProgress(ctx.progress);
    }
  });
}

async function boot() {
  const prefs = loadPrefs();
  if (prefs.theme === 'night' || prefs.theme === 'paper') ctx.ui.theme = prefs.theme;
  if (typeof prefs.spoilers === 'boolean') ctx.ui.spoilers = prefs.spoilers;
  readDeepLinks();
  applyTheme();
  ctx.data = await loadTrophies();
  ctx.trophies = ctx.data.trophies ?? [];
  bindEvents();
  render();
}

boot().catch((error) => {
  document.getElementById('app').innerHTML =
    `<div class="empty">The trophy list did not load. ${error.message} — serve app/ with a static server (node serve.ts) and reload.</div>`;
});
