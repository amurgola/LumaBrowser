import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import Clipboard from '../../../core/llm-server/ui/js/dom/Clipboard.js';
import RunListView from './RunListView.js';
import RunMarkdown from './RunMarkdown.js';
import RunnerModelPicker from './RunnerModelPicker.js';
import TestListView from './TestListView.js';

export default class TestHarnessRenderer {
  static EXTENSION_ID = 'ext-test-harness';

  static POLL_MS = 3000;

  static BUTTON_RESET_MS = 2000;

  static COPY_RESET_MS = 1500;

  static RUN_PAGE_SIZE = 20;

  static CLEAR_PROMPT = 'Delete all test run history?';

  constructor() {
    this._ipc = null;
    this._bar = null;
    this._settings = null;
    this._els = {};
    this._picker = null;
    this._pollTimer = null;
    this._resetState();
  }

  async activate(context) {
    if (this._pollTimer) this.deactivate();
    this._takeContext(context);
    this._bindBottomBar();
    this._bindSettings();
    context.slotManager.setCallback('settings-tab', TestHarnessRenderer.EXTENSION_ID, 'onActivate', () => this._picker.populate());
    this._loadTests();
    this._loadRuns();
    this._startPolling();
  }

  deactivate() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    this._bar = null;
    this._settings = null;
    this._tests = [];
    this._runs = [];
  }

  _resetState() {
    this._tests = [];
    this._runs = [];
    this._expanded = false;
    this._openRun = null;
  }

  _takeContext(context) {
    this._ipc = context.ipcBridge;
    this._bar = context.containers.panelContainer;
    this._settings = context.containers.settingsContainer;
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${TestHarnessRenderer.EXTENSION_ID}.${channel}`, ...args);
  }

  _startPolling() {
    this._pollTimer = setInterval(() => {
      if (this._runs.some((r) => r.status === 'running')) this._loadRuns();
    }, TestHarnessRenderer.POLL_MS);
  }

  _bindBottomBar() {
    if (!this._bar) return;
    this._findBarElements();
    const { summary, refreshBtn, clearBtn } = this._els;
    if (summary) {
      summary.addEventListener('click', (e) => {
        if (e.target.closest('#th-bar-refresh-btn')) return;
        this._toggleExpanded();
      });
    }
    if (refreshBtn) refreshBtn.addEventListener('click', () => { this._loadTests(); this._loadRuns(); });
    if (clearBtn) clearBtn.addEventListener('click', () => this._clearAllRuns());
  }

  _findBarElements() {
    const q = (id) => this._bar.querySelector(`#${id}`);
    this._els = {
      count: q('ext-th-barCount'),
      status: q('ext-th-barStatus'),
      toggle: q('ext-th-barToggle'),
      expanded: q('ext-th-barExpanded'),
      summary: q('ext-th-barSummary'),
      testItems: q('ext-th-testItems'),
      runItems: q('ext-th-runItems'),
      refreshBtn: q('th-bar-refresh-btn'),
      clearBtn: q('th-bar-clear-btn'),
    };
  }

  _bindSettings() {
    this._picker = new RunnerModelPicker(this._settings ? this._settings.querySelector('#ext-th-modelSelect') : null);
    if (!this._settings) return;
    const clearBtn = this._settings.querySelector('#ext-th-clearAllBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => this._clearAllRuns());
    this._picker.bind();
  }

  async _clearAllRuns() {
    if (!(await Dialogs.confirm(TestHarnessRenderer.CLEAR_PROMPT))) return;
    try {
      await this._invoke('clearAllRuns');
      this._runs = [];
      this._renderRuns();
    } catch (err) {
      console.error('test-harness: clear failed:', err);
    }
  }

  _toggleExpanded() {
    this._expanded = !this._expanded;
    if (this._els.expanded) this._els.expanded.classList.toggle('ext-hidden', !this._expanded);
    if (this._els.toggle) this._els.toggle.classList.toggle('expanded', this._expanded);
    if (this._expanded) {
      this._loadTests();
      this._loadRuns();
    }
  }

  async _loadTests() {
    try {
      this._tests = await this._invoke('discoverTests') || [];
      this._renderTests();
      if (this._els.count) this._els.count.textContent = `${this._tests.length} test${this._tests.length !== 1 ? 's' : ''}`;
    } catch (err) {
      console.error('test-harness: failed to load tests:', err);
    }
  }

  async _loadRuns() {
    try {
      this._runs = await this._invoke('getTestRuns', TestHarnessRenderer.RUN_PAGE_SIZE, 0) || [];
      this._renderRuns();
      const running = this._runs.filter((r) => r.status === 'running').length;
      if (this._els.status) this._els.status.textContent = running > 0 ? `${running} running...` : '';
    } catch (err) {
      console.error('test-harness: failed to load runs:', err);
    }
  }

  _renderTests() {
    const host = this._els.testItems;
    if (!host) return;
    host.innerHTML = TestListView.render(this._tests);
    host.querySelectorAll('.th-run-test-btn').forEach((btn) => {
      btn.addEventListener('click', () => this._runTest(btn));
    });
  }

  async _runTest(btn) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Starting...';
    try {
      const result = await this._invoke('runTest', btn.dataset.testId, btn.dataset.variantId || undefined);
      if (result.success) {
        btn.textContent = 'Running...';
        await this._loadRuns();
      } else {
        Dialogs.alert(`Failed to start test: ${result.error}`);
        btn.textContent = original;
      }
    } catch (err) {
      console.error('test-harness: run test failed:', err);
      Dialogs.alert('Failed to start test.');
      btn.textContent = original;
    } finally {
      btn.disabled = false;
      setTimeout(() => { btn.textContent = original; }, TestHarnessRenderer.BUTTON_RESET_MS);
    }
  }

  _renderRuns() {
    const host = this._els.runItems;
    if (!host) return;
    host.innerHTML = RunListView.render(this._runs, this._openRun);
    this._bindRunRows(host);
  }

  _bindRunRows(host) {
    host.querySelectorAll('.th-run-item').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.th-run-detail')) return;
        this._toggleRunDetail(row.dataset.runId);
      });
    });
    host.querySelectorAll('.th-copy-md-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._copyRunAsMarkdown(btn.dataset.runId, btn);
      });
    });
  }

  async _toggleRunDetail(runId) {
    if (this._openRun && this._openRun.runId === runId) {
      this._openRun = null;
      this._renderRuns();
      return;
    }
    try {
      const detail = await this._invoke('getTestRunDetail', runId);
      this._openRun = { runId, detail };
      this._renderRuns();
    } catch (err) {
      console.error('test-harness: failed to load run detail:', err);
    }
  }

  async _copyRunAsMarkdown(runId, btn) {
    const original = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;
    btn.textContent = await this._copyRun(runId);
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, TestHarnessRenderer.COPY_RESET_MS);
  }

  async _copyRun(runId) {
    try {
      const detail = await this._invoke('getTestRunDetail', runId);
      const run = this._runs.find((r) => r.id === runId);
      if (!detail || !run) return 'No data';
      await TestHarnessRenderer._copyText(RunMarkdown.format(run, detail));
      return 'Copied!';
    } catch (err) {
      console.error('test-harness: copy md failed:', err);
      return 'Error';
    }
  }

  static _copyText(text) {
    if (window.electronAPI?.copyToClipboard) return window.electronAPI.copyToClipboard(text);
    return Clipboard.copyText(text);
  }
}
