class RendererRecovery {
  static ERR_ABORTED = -3;
  static IGNORED_EXIT_REASONS = new Set(['clean-exit', 'killed']);

  constructor({ maxRetries = 3, backoffMs = 400, log = console, setTimeoutFn = setTimeout } = {}) {
    this.maxRetries = maxRetries;
    this.backoffMs = backoffMs;
    this.log = log;
    this._setTimeout = setTimeoutFn;
    this.state = { tag: 'operational', retries: 0 };
    this._hooks = {};
    this._win = null;
  }

  get suspended() {
    return this.state.tag === 'suspended';
  }

  attach(win, hooks = {}) {
    this._hooks = hooks;
    this._win = win;
    win.webContents.on('render-process-gone', (_event, details) => this._onRenderProcessGone(details));
    win.webContents.on('did-fail-load', (_event, code, description, _url, isMainFrame) => this._onDidFailLoad(code, description, isMainFrame));
    return this;
  }

  crashed() {
    if (this.suspended) return false;
    if (this.state.retries >= this.maxRetries) {
      this._suspend('retry budget exhausted');
      return false;
    }
    this.state = { tag: 'operational', retries: this.state.retries + 1 };
    this.log.warn(`[renderer] crash ${this.state.retries}/${this.maxRetries}, reloading`);
    return true;
  }

  loadFailed(reason) {
    if (this.suspended) return;
    this._suspend(`load failed${reason ? ` (${reason})` : ''}`);
  }

  open() {
    if (!this.suspended) return false;
    this.state = { tag: 'operational', retries: 0 };
    this.log.warn('[renderer] explicit open, retry budget renewed');
    return true;
  }

  renew() {
    if (!this.open()) return false;
    if (!this._tryReload()) return false;
    this._callHook('onRenewed');
    return true;
  }

  _onRenderProcessGone(details) {
    const reason = details && details.reason;
    if (this._isExiting() || RendererRecovery.IGNORED_EXIT_REASONS.has(reason)) return;
    this.log.warn(`[renderer] render process gone: ${reason || 'unknown'} (exit ${details && details.exitCode})`);
    if (this.crashed()) this._scheduleReload();
    else this._hide();
  }

  _onDidFailLoad(code, description, isMainFrame) {
    if (!isMainFrame || code === RendererRecovery.ERR_ABORTED || this._isExiting()) return;
    this.loadFailed(`${code} ${description || ''}`.trim());
    this._hide();
  }

  _scheduleReload() {
    const delay = this.backoffMs * this.state.retries;
    this._setTimeout(() => {
      if (this._isExiting() || this.state.tag !== 'operational') return;
      if (!this._tryReload()) this._hide();
    }, delay);
  }

  _tryReload() {
    try {
      if (this._hooks.reload) this._hooks.reload();
      return true;
    } catch (err) {
      this.loadFailed(err && err.message);
      return false;
    }
  }

  _suspend(reason) {
    this.state = { tag: 'suspended' };
    this.log.error(`[renderer] suspended: ${reason}. Window hidden until an explicit open.`);
    this._callHook('onSuspended', reason);
  }

  _isExiting() {
    return this._hooks.isExiting ? this._hooks.isExiting() : false;
  }

  _callHook(name, ...args) {
    try { if (this._hooks[name]) this._hooks[name](...args); } catch (_) {}
  }

  _hide() {
    const win = this._win;
    try { if (win && !win.isDestroyed() && win.isVisible()) win.hide(); } catch (_) {}
  }
}

module.exports = RendererRecovery;
