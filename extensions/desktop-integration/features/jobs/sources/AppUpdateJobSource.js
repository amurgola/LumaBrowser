class AppUpdateJobSource {
  static KIND = 'app-update';

  constructor({ registry, getUpdater }) {
    this._registry = registry;
    this._getUpdater = getUpdater;
    this._updater = null;
    this._jobId = null;
    this._handlers = {
      'download-progress': (p) => this._onProgress(p || {}),
      'update-downloaded': (info) => this._end('done', info && info.version ? { detail: `Version ${info.version} ready` } : {}),
      error: (err) => this._end('failed', { error: (err && err.message) || String(err || 'Update failed') }),
    };
  }

  start() {
    if (this._updater) return;
    let updater = null;
    try { updater = this._getUpdater(); } catch (_) { updater = null; }
    if (!updater || typeof updater.on !== 'function') return;
    this._updater = updater;
    for (const [event, fn] of Object.entries(this._handlers)) updater.on(event, fn);
  }

  stop() {
    if (this._updater) {
      for (const [event, fn] of Object.entries(this._handlers)) {
        try { (this._updater.removeListener || this._updater.off).call(this._updater, event, fn); } catch (_) {}
      }
    }
    this._updater = null;
    this._jobId = null;
  }

  _onProgress(p) {
    const percent = Number(p.percent);
    const progress = Number.isFinite(percent) ? percent / 100 : null;
    const remaining = Number(p.total) - Number(p.transferred);
    const speed = Number(p.bytesPerSecond);
    const eta = Number.isFinite(remaining) && speed > 0 ? remaining / speed : null;
    if (!this._jobId || !this._registry.isActive(this._jobId)) {
      this._jobId = this._registry.newId(AppUpdateJobSource.KIND);
      this._registry.start(this._jobId, { kind: AppUpdateJobSource.KIND, title: 'Downloading LumaBrowser update', progress, eta, source: 'app-update' });
      return;
    }
    this._registry.update(this._jobId, { progress, eta });
  }

  _end(state, extra) {
    if (!this._jobId) return;
    this._registry.finish(this._jobId, state, extra);
    this._jobId = null;
  }
}

module.exports = AppUpdateJobSource;
