(function () {
  if (!window.LumaSetupExt) {
    console.error('[model-testing] LumaSetupExt not present');
    return;
  }

  const TAB_ID = 'model-testing';
  const POLL_MS = 1000;
  const RAW_URL_TTL_MS = 5000;
  const DEFAULT_MODEL_NOTE = 'A model other than your default is loaded for the run, and your default is put back when the run ends.';

  function injectCss() {
    if (document.getElementById('mt-css')) return;
    const link = document.createElement('link');
    link.id = 'mt-css';
    link.rel = 'stylesheet';
    link.href = '/llm-ui/ext/' + TAB_ID + '/setup-ui.css';
    document.head.appendChild(link);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const percent = (fraction) => Math.round((Number(fraction) || 0) * 100) + '%';

  const scoreClass = (fraction) => (fraction >= 0.7 ? 'ok' : 'bad');

  function headHtml() {
    return '<div class="luma-head"><p class="luma-sub">Test what a downloaded model can do. Pick a model and the tests to run; each test keeps its latest result per model.</p></div>';
  }

  function modelName(model) {
    return model.label === model.stem ? model.label : model.label + ' · ' + model.stem;
  }

  function modelFieldHtml(models, selectedPath, locked) {
    const options = models.map((model) => '<option value="' + esc(model.path) + '"' + (model.path === selectedPath ? ' selected' : '') + '>'
      + esc(modelName(model)) + (model.current ? ' (default)' : '') + '</option>').join('');
    return '<label class="luma-field"><span>Model</span>'
      + '<select data-mt-model' + (locked ? ' disabled' : '') + '>' + options + '</select></label>';
  }

  function suiteBadgeHtml(stored) {
    if (!stored || !stored.report) return '<span class="luma-badge muted">not run yet</span>';
    return '<span class="luma-badge ' + scoreClass(stored.report.overall) + '">' + percent(stored.report.overall) + ' ' + esc(stored.report.band || '') + '</span>';
  }

  function suiteRowHtml(suite, isChecked, stored, locked) {
    return '<label class="luma-check mt-suite">'
      + '<input type="checkbox" data-mt-suite="' + esc(suite.id) + '"' + (isChecked ? ' checked' : '') + (locked ? ' disabled' : '') + '>'
      + '<span class="mt-suite-main"><span class="mt-suite-name">' + esc(suite.label) + '</span>'
      + '<span class="mt-suite-desc">' + esc(suite.description) + '</span>'
      + '<span class="mt-suite-meta">' + esc(suite.taskCount) + ' tasks, takes ' + esc(suite.duration) + '</span></span>'
      + suiteBadgeHtml(stored) + '</label>';
  }

  function progressHtml(live, suites) {
    const fraction = live.total ? live.done / live.total : 0;
    const suite = suites.find((s) => s.id === live.suiteId);
    const steps = [];
    if (suite && live.suiteIds && live.suiteIds.length > 1) steps.push(suite.label);
    if (live.total) steps.push(live.done + '/' + live.total);
    steps.push(whereText(live));
    return '<button type="button" class="luma-btn danger" data-mt-cancel>Cancel</button>'
      + '<div class="luma-progress' + (live.total ? '' : ' indeterminate') + '"><div class="luma-progress-fill" style="width:' + Math.round(fraction * 100) + '%"></div></div>'
      + '<span class="mt-run-where">' + esc(steps.join(' · ')) + '</span>';
  }

  function whereText(live) {
    if (live.server === 'starting') return 'loading the model';
    if (!live.taskId) return 'warming up';
    return (live.group ? live.group + ' · ' : '') + live.taskId;
  }

  function startHtml(view) {
    const blocked = view.fitTestRunning ? 'A fit test is running' : (!view.anyChecked ? 'Pick at least one test' : '');
    return '<button type="button" class="luma-btn primary" data-mt-start' + (blocked ? ' disabled title="' + esc(blocked) + '"' : '') + '>Run tests</button>'
      + '<span class="mt-note">' + DEFAULT_MODEL_NOTE + '</span>';
  }

  function reportHtml(suite, stored, hasRaw) {
    const report = stored.report;
    const rows = (report.groups || []).map((group) => '<tr><td>' + esc(group.label || group.key) + '</td>'
      + '<td><span class="luma-badge ' + scoreClass(group.score) + '">' + percent(group.score) + '</span></td>'
      + '<td>' + (group.derived ? esc(group.detail || '') : esc(group.passed) + '/' + esc(group.n) + ' passed') + '</td></tr>').join('');
    return '<section class="mt-result"><h3 class="mt-result-title">' + esc(suite.label) + '</h3>'
      + '<div class="mt-headline"><span class="luma-badge ' + scoreClass(report.overall) + ' mt-score">' + percent(report.overall) + '</span>'
      + '<span class="mt-band">' + esc(report.band || '') + (stored.canceled ? ', canceled early' : '') + '</span>'
      + '<span class="mt-worst">worst decile ' + percent(report.worstDecile) + '</span></div>'
      + '<table class="luma-table mt-table"><thead><tr><th>Capability</th><th>Score</th><th>Detail</th></tr></thead><tbody>' + rows + '</tbody></table>'
      + '<div class="mt-note">' + esc(coverageText(report, stored.ranAt)) + '</div>'
      + rawHtml(suite, hasRaw) + '</section>';
  }

  function coverageText(report, ranAt) {
    const coverage = report.coverage || { ran: 0, total: 0, skipped: 0 };
    let text = coverage.ran + ' of ' + coverage.total + ' tasks ran';
    if (coverage.skipped) {
      const reasons = Object.keys(coverage.reasons || {}).join('; ');
      text += ', ' + coverage.skipped + ' skipped' + (reasons ? ' (' + reasons + ')' : '');
    }
    const when = ranAt ? new Date(ranAt) : null;
    return when && !isNaN(when) ? text + ' · ' + when.toLocaleString() : text;
  }

  function rawHtml(suite, hasRaw) {
    if (hasRaw) return '<button type="button" class="luma-btn luma-btn--sm" data-mt-download="' + esc(suite.id) + '">Download raw results</button>';
    return '<div class="mt-note">Raw transcripts are kept for the most recent run in this session only. Run the test again to download them.</div>';
  }

  function rawFileName(raw) {
    const stamp = String(raw.ranAt || '').replace(/[:.]/g, '-') || 'run';
    return raw.suiteId + '-' + stamp + '.json';
  }

  function saveJson(raw) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = rawFileName(raw);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), RAW_URL_TTL_MS);
  }

  function mount(el, api) {
    injectCss();
    el.classList.add('luma-setup');

    let state = null;
    let live = null;
    let selectedPath = null;
    let checked = null;
    let notice = null;
    let pollTimer = null;

    async function inv(action, payload) {
      const r = await api.invoke(action, payload);
      if (!r || !r.success) throw new Error((r && r.error) || (action + ' failed'));
      return r.result;
    }

    async function refresh() {
      try { state = await inv('state'); }
      catch (e) {
        el.innerHTML = '<div class="luma-error">Failed to load model testing: ' + esc(e.message) + '</div>';
        return;
      }
      live = state.run.running ? state.run.live : null;
      settleSelection();
      render();
      schedulePoll();
    }

    function settleSelection() {
      if (live && live.modelPath) selectedPath = live.modelPath;
      if (!state.models.some((model) => model.path === selectedPath)) {
        const fallback = state.models.find((model) => model.current) || state.models[0];
        selectedPath = fallback ? fallback.path : null;
      }
      if (!checked) checked = new Set(state.suites.map((suite) => suite.id));
    }

    function storedFor(suiteId) {
      const bySuite = state.results[suiteId] || {};
      return bySuite[selectedPath] || null;
    }

    function hasRaw(suiteId) {
      const raw = state.raw;
      return !!raw && raw.modelPath === selectedPath && raw.suiteIds.includes(suiteId);
    }

    function render() {
      if (!state.models.length) {
        el.innerHTML = headHtml() + '<div class="luma-empty">No downloaded chat models yet. Download one from the LLM tab in Setup, then come back.</div>';
        return;
      }
      el.innerHTML = headHtml()
        + '<div class="mt-panel">' + modelFieldHtml(state.models, selectedPath, !!live)
        + '<div class="mt-suites"><div class="luma-field-label">Tests</div>'
        + state.suites.map((suite) => suiteRowHtml(suite, checked.has(suite.id), storedFor(suite.id), !!live)).join('') + '</div>'
        + '<div class="mt-run" data-mt-run></div><div data-mt-notice></div></div>'
        + '<div class="mt-results">' + resultsHtml() + '</div>';
      renderRun();
    }

    function renderRun() {
      const row = el.querySelector('[data-mt-run]');
      if (!row) return;
      row.innerHTML = live ? progressHtml(live, state.suites) : startHtml({ fitTestRunning: state.fitTestRunning, anyChecked: checked.size > 0 });
      el.querySelector('[data-mt-notice]').innerHTML = notice ? '<div class="luma-error">' + esc(notice) + '</div>' : '';
    }

    function resultsHtml() {
      return state.suites
        .filter((suite) => storedFor(suite.id))
        .map((suite) => reportHtml(suite, storedFor(suite.id), hasRaw(suite.id)))
        .join('');
    }

    function schedulePoll() {
      clearTimeout(pollTimer);
      if (!live || !el.isConnected) return;
      pollTimer = setTimeout(poll, POLL_MS);
    }

    async function poll() {
      let status;
      try { status = await inv('status'); } catch (_) { schedulePoll(); return; }
      if (!status.running) { await refresh(); return; }
      live = status.live;
      renderRun();
      schedulePoll();
    }

    async function startRun() {
      if (live || !selectedPath || !checked.size) return;
      const suiteIds = state.suites.filter((suite) => checked.has(suite.id)).map((suite) => suite.id);
      notice = null;
      live = { modelPath: selectedPath, suiteIds, suiteId: null, server: null, total: 0, done: 0, taskId: null, group: null };
      render();
      schedulePoll();
      let result;
      try { result = await inv('run', { modelPath: selectedPath, suiteIds }); }
      catch (e) { result = { success: false, error: e.message }; }
      if (!result.success) notice = result.error || 'The run failed.';
      await refresh();
    }

    async function cancelRun() {
      try { await inv('cancel'); } catch (_) {}
    }

    async function downloadRaw(suiteId) {
      try {
        const res = await inv('raw', { suiteId });
        if (!res.success) throw new Error(res.error || 'Raw results are no longer available.');
        saveJson(res.raw);
      } catch (e) {
        notice = e.message;
        await refresh();
      }
    }

    el.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || !target.closest) return;
      if (target.closest('[data-mt-start]')) startRun();
      else if (target.closest('[data-mt-cancel]')) cancelRun();
      else {
        const download = target.closest('[data-mt-download]');
        if (download) downloadRaw(download.dataset.mtDownload);
      }
    });

    el.addEventListener('change', (event) => {
      const target = event.target;
      if (target.matches('[data-mt-model]')) {
        selectedPath = target.value;
        notice = null;
        render();
      } else if (target.matches('[data-mt-suite]')) {
        if (target.checked) checked.add(target.dataset.mtSuite); else checked.delete(target.dataset.mtSuite);
        renderRun();
      }
    });

    refresh();
    return refresh;
  }

  let reload = null;
  let justMounted = false;
  window.LumaSetupExt.registerTab({
    id: TAB_ID,
    label: 'Model testing',
    mount: (el, api) => { reload = mount(el, api); justMounted = true; },
    onShow: () => {
      if (justMounted) { justMounted = false; return; }
      if (reload) reload();
    },
  });
})();
