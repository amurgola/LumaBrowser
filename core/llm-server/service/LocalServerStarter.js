class LocalServerStarter {
  static SETTLE_TIMEOUT_MS = 5 * 60 * 1000;
  static SETTLED_STATES = Object.freeze(['ready', 'idle', 'error']);
  static NO_MODEL_ERROR = 'No local model selected. Choose a default runtime + model in the LLM tab.';
  static BUSY_ERROR = 'The local model is answering another request; its vision projector can load once that finishes. Try again in a moment.';

  constructor({ service, runtimeServer, launcher, tracker, settleTimeoutMs = LocalServerStarter.SETTLE_TIMEOUT_MS }) {
    this._service = service;
    this._rs = runtimeServer;
    this._launcher = launcher;
    this._tracker = tracker;
    this._settleTimeoutMs = settleTimeoutMs;
    this._starting = null;
    this._visionRestart = null;
  }

  static needsVisionLoad(status) {
    const plan = status && status.plan;
    return !!(plan && plan.mmprojAvailable && !plan.mmprojPath);
  }

  whenVisionSettled() {
    return this._visionRestart ? this._visionRestart.then(() => {}, () => {}) : Promise.resolve();
  }

  async ensureRunning({ withVision = false } = {}) {
    if (this._visionRestart) await this.whenVisionSettled();
    const status = this._rs.getStatus();
    if (status.state === 'ready') return this._useReady(status, withVision);
    const result = await this._sharedStart(withVision);
    return this._afterStart(result, withVision);
  }

  _useReady(status, withVision) {
    if (withVision && LocalServerStarter.needsVisionLoad(status)) return this._loadVisionProjector();
    this._rs.markActive();
    return { success: true, status: this._rs.getStatus() };
  }

  _sharedStart(withVision) {
    if (!this._starting) this._starting = this._start(withVision).finally(() => { this._starting = null; });
    return this._starting;
  }

  async _start(withVision) {
    let state = this._rs.getStatus().state;
    if (state === 'starting' || state === 'stopping') {
      await this._waitForSettle();
      state = this._rs.getStatus().state;
    }
    if (state === 'ready') return { success: true, status: this._rs.getStatus() };
    const defaults = this._service.getDefaults();
    if (!defaults.runtimeId || !defaults.modelPath) return { success: false, error: LocalServerStarter.NO_MODEL_ERROR };
    return this._launch(withVision);
  }

  _afterStart(result, withVision) {
    if (!result || !result.success) return result;
    this._rs.markActive();
    if (withVision && LocalServerStarter.needsVisionLoad(this._rs.getStatus())) return this._loadVisionProjector();
    return result;
  }

  async _loadVisionProjector() {
    if (this._visionRestart) return this._visionRestart;
    if (this._tracker.isBusy()) return { success: false, code: 'LOCAL_BUSY', error: LocalServerStarter.BUSY_ERROR };
    this._visionRestart = this._restartWithVision().finally(() => { this._visionRestart = null; });
    const result = await this._visionRestart;
    if (result && result.success) this._rs.markActive();
    return result;
  }

  async _restartWithVision() {
    try { await this._rs.ensureStopped(); } catch (_) {}
    return this._launch(true);
  }

  async _launch(withVision) {
    try {
      return await this._launcher.resolveAndStart(this._service, { withVision });
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  _waitForSettle() {
    const rs = this._rs;
    const settled = () => LocalServerStarter.SETTLED_STATES.includes(rs.getStatus().state);
    return new Promise((resolve) => {
      if (settled()) return resolve(rs.getStatus());
      const finish = () => { rs.removeListener('state-change', onChange); clearTimeout(timer); resolve(rs.getStatus()); };
      const onChange = () => { if (settled()) finish(); };
      const timer = setTimeout(finish, this._settleTimeoutMs);
      rs.on('state-change', onChange);
    });
  }
}

module.exports = LocalServerStarter;
