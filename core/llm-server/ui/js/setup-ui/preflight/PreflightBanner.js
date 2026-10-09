import PreflightIssues from './PreflightIssues.js';
import PreflightRow from './PreflightRow.js';
import PreflightInstall from './PreflightInstall.js';

export default class PreflightBanner {
  static CHECK_DEBOUNCE_MS = 300;

  constructor({ api, doc = document, win = window }) {
    this._api = api;
    this._doc = doc;
    this._win = win;
    this._issues = new PreflightIssues();
    this._installer = api ? new PreflightInstall(api) : null;
    this._installing = new Set();
    this._host = null;
    this._dismissed = false;
    this._checkTimer = null;
    this._checking = false;
  }

  start() {
    if (!this._api || !this._api.getPreflight) return false;
    this._bindRecheckSignals();
    this._bindVramPressure();
    this.check();
    this._seedVram();
    return true;
  }

  async check() {
    if (this._checking) return;
    this._checking = true;
    try {
      const res = await this._api.getPreflight();
      if (res && res.success) {
        this._issues.setBoot(res.issues || []);
        this._render();
      }
    } catch (_) {} finally {
      this._checking = false;
    }
  }

  scheduleCheck() {
    if (this._checkTimer) return;
    this._checkTimer = setTimeout(() => { this._checkTimer = null; this.check(); }, PreflightBanner.CHECK_DEBOUNCE_MS);
  }

  onVramPressure(card) {
    if (this._issues.applyVramCard(card)) this._dismissed = false;
    if (!card || !Number.isInteger(card.card)) return;
    this._render();
  }

  _bindRecheckSignals() {
    const onFinalize = (evt) => { if (evt && evt.type === 'finalize') this.scheduleCheck(); };
    for (const surface of [this._api, this._api.image, this._api.music]) {
      if (surface && surface.onRuntimeEvent) surface.onRuntimeEvent(onFinalize);
    }
    this._win.addEventListener('luma-models-changed', () => this.scheduleCheck());
  }

  _bindVramPressure() {
    if (!this._api.onModelEvent) return;
    this._api.onModelEvent((evt) => {
      if (evt && evt.type === 'vram-pressure') this.onVramPressure(evt.payload);
    });
  }

  async _seedVram() {
    if (!this._api.getVramPressure) return;
    try {
      const r = await this._api.getVramPressure();
      const cards = r && r.success && r.state && Array.isArray(r.state.cards) ? r.state.cards : [];
      if (this._issues.seedVram(cards)) this._render();
    } catch (_) {}
  }

  _render() {
    if (this._dismissed) return;
    const issues = this._issues.all();
    if (!issues.length) { this._removeHost(); return; }
    const host = this._ensureHost();
    const busyRows = this._busyRows(host);
    host.innerHTML = '';
    host.appendChild(this._head(issues));
    for (const issue of issues) host.appendChild(this._rowFor(issue, busyRows));
  }

  _busyRows(host) {
    const keep = new Map();
    for (const row of host.querySelectorAll('[data-fix-key]')) {
      if (this._installing.has(row.dataset.fixKey)) keep.set(row.dataset.fixKey, row);
    }
    return keep;
  }

  _rowFor(issue, busyRows) {
    const key = PreflightRow.fixKey(issue);
    if (key && busyRows.has(key)) return busyRows.get(key);
    return PreflightRow.build(this._doc, issue, this._rowHandlers());
  }

  _rowHandlers() {
    return {
      onInstall: (issue, row, btn) => this._install(issue, row, btn),
      onOpen: (view) => this._openSetupView(view),
      onRecheck: () => this.check(),
      onDismissVram: (issue) => this._dismissVram(issue),
    };
  }

  _head(issues) {
    const head = this._doc.createElement('div');
    head.className = 'preflight-head';
    const onlyLive = issues.every((i) => i.live === 'vram');
    head.innerHTML = `
            <span class="preflight-head-title">${onlyLive ? 'GPU memory is running low' : 'Setup problems found'}</span>
            <button class="luma-icon-btn luma-icon-btn--sq preflight-x" type="button" aria-label="Dismiss" title="Hide until the tab reloads">×</button>
        `;
    head.querySelector('.preflight-x').addEventListener('click', () => {
      this._dismissed = true;
      this._removeHost();
    });
    return head;
  }

  _ensureHost() {
    if (this._host) return this._host;
    this._host = this._doc.createElement('div');
    this._host.className = 'preflight-banner';
    this._host.setAttribute('role', 'alert');
    this._doc.body.appendChild(this._host);
    return this._host;
  }

  _removeHost() {
    if (!this._host) return;
    this._host.remove();
    this._host = null;
  }

  _dismissVram(issue) {
    this._issues.dismissVram(issue.card);
    this._render();
    if (this._api.dismissVramPressure) this._api.dismissVramPressure(issue.card).catch(() => {});
  }

  async _install(issue, row, btn) {
    const key = PreflightRow.fixKey(issue);
    this._installing.add(key);
    const ok = await this._installer.run(issue, row, btn);
    this._installing.delete(key);
    if (ok) await this.check();
  }

  _openSetupView(view) {
    this._win.dispatchEvent(new this._win.CustomEvent('luma-switch-mode', { detail: 'setup' }));
    const target = (view === 'image' || view === 'music') ? view : 'settings';
    const btn = this._doc.querySelector(`#pageNav button[data-view="${target}"]`);
    if (btn) btn.click();
  }
}
