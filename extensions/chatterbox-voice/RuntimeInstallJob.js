const AudioCppRuntimeInstaller = require('./AudioCppRuntimeInstaller');

class RuntimeInstallJob {
  constructor({ id, runtimesRoot, stopEngine, onInstalled, installer = new AudioCppRuntimeInstaller() }) {
    this._id = id;
    this._runtimesRoot = runtimesRoot;
    this._stopEngine = stopEngine;
    this._onInstalled = onInstalled;
    this._installer = installer;
    this.state = { id, phase: 'starting', received: 0, total: null, kind: null, done: false, error: null, startedAt: Date.now() };
  }

  start() {
    this.finished = this._run();
    return this;
  }

  async _run() {
    const job = this.state;
    try {
      await this._stopEngine().catch(() => {});
      await this._installer.installRuntime(this._id, { runtimesRoot: this._runtimesRoot, onEvent: (type, payload) => this._onEvent(type, payload) });
      this._onInstalled(this._id);
      job.phase = 'done';
    } catch (err) {
      job.error = err.message + (err.detail && err.detail.releasesUrl ? ` (${err.detail.releasesUrl})` : '');
      job.phase = 'error';
    } finally {
      job.done = true;
    }
  }

  _onEvent(type, payload) {
    const job = this.state;
    if (type === 'download') {
      job.phase = 'download';
      job.received = payload.received || 0;
      job.total = payload.total || null;
      job.kind = payload.kind || null;
    } else if (type === 'extract') {
      job.phase = payload.phase === 'done' ? 'extracted' : 'extract';
    } else if (type === 'resolved' || type === 'finalize') {
      job.phase = type;
    }
  }
}

module.exports = RuntimeInstallJob;
