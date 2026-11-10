const HelperModelSettings = require('./HelperModelSettings');
const HelperRuntimeServer = require('./HelperRuntimeServer');
const HelperLaunchPlan = require('./HelperLaunchPlan');
const ChatModelRef = require('../chat/router/ChatModelRef');

class HelperModelService {
  static RUNTIME_ID_FALLBACK = 'llama-cpp-luma';

  constructor({ settingsDb, llmServerService, runtimeServer } = {}) {
    this._settings = new HelperModelSettings({ settingsDb });
    this._llmServerService = llmServerService;
    this.runtimeServer = runtimeServer || HelperModelService._residentServer();
    this.lastError = null;
    this.runtimeId = null;
    this._inFlight = 0;
    this._chain = Promise.resolve();
  }

  get settings() { return this._settings; }

  isEnabled() { return this._settings.isEnabled(); }

  isReady() { return this.isEnabled() && this.runtimeServer.getStatus().state === 'ready'; }

  contextSize() { return this._settings.contextSize(); }

  ref() {
    const stem = this._settings.modelStem();
    return this.isEnabled() && stem ? ChatModelRef.HELPER_PREFIX + stem : null;
  }

  readyRef() {
    return this.isReady() ? this.ref() : null;
  }

  getStatus() {
    const st = this.runtimeServer.getStatus();
    const s = this._settings.snapshot();
    return {
      enabled: s.enabled,
      modelPath: s.modelPath,
      modelInstalled: this._settings.isModelInstalled(),
      ref: this.ref(),
      contextSize: s.contextSize,
      cudaDevice: s.cudaDevice,
      device: st.plan ? st.plan.cudaDevice : null,
      state: st.state,
      port: st.port,
      runtimeId: this.runtimeId,
      error: this.lastError || st.lastError || null,
    };
  }

  apply() {
    this._chain = this._chain.then(() => this._applyOnce()).catch((err) => {
      this.lastError = (err && err.message) || String(err);
      console.warn('[helper-model] apply failed:', this.lastError);
    });
    return this._chain;
  }

  async stop() {
    try { await this.runtimeServer.stop(); } catch (_) {}
  }

  releaseRuntime(runtimeId) {
    this._chain = this._chain.then(() => this._releaseOnce(runtimeId)).catch((err) => {
      this.lastError = (err && err.message) || String(err);
      return false;
    });
    return this._chain;
  }

  facade() {
    const self = this;
    return {
      runtimeServer: {
        get plan() { return self.runtimeServer.plan ? { apiModelName: null } : null; },
        get authKey() { return null; },
        getStatus: () => {
          const st = self.runtimeServer.getStatus();
          return { state: self.isEnabled() ? st.state : 'idle', port: st.port, host: '127.0.0.1', plan: null };
        },
        markActive: () => {},
      },
      getDefaults: () => ({ runtimeId: self.runtimeId || HelperModelService.RUNTIME_ID_FALLBACK }),
      getRunningThinking: () => null,
      getLocalSlotCount: () => HelperLaunchPlan.SLOTS,
      getLocalInFlight: () => self._inFlight,
      noteLocalRequestStart: () => { self._inFlight += 1; },
      noteLocalRequestEnd: () => { self._inFlight = Math.max(0, self._inFlight - 1); },
    };
  }

  async _releaseOnce(runtimeId) {
    if (!runtimeId || this.runtimeId !== runtimeId) return false;
    if (this.runtimeServer.getStatus().state === 'idle') return false;
    await this.runtimeServer.stop();
    return true;
  }

  async _applyOnce() {
    const st = this.runtimeServer.getStatus();
    if (!this.isEnabled()) {
      if (st.state !== 'idle') await this.runtimeServer.stop();
      this.lastError = null;
      return undefined;
    }
    if (!this._settings.isModelInstalled()) {
      if (st.state !== 'idle') await this.runtimeServer.stop();
      this.lastError = this._settings.modelPath() ? `Helper model not found at ${this._settings.modelPath()}.` : 'Pick a helper model file first.';
      return undefined;
    }
    if (st.state === 'ready' || st.state === 'starting') {
      if (this._sameLaunch(st.plan)) return undefined;
      await this.runtimeServer.stop();
    }
    return this._start();
  }

  _sameLaunch(plan) {
    if (!plan) return false;
    const device = HelperLaunchPlan.pickDevice(this._settings.cudaDevice(), this._diagnostics());
    return plan.modelPath === this._settings.modelPath() && plan.contextSize === this._settings.contextSize()
      && (plan.cudaDevice == null ? null : String(plan.cudaDevice)) === (device == null ? null : String(device));
  }

  async _start() {
    const runtime = await this._pickRuntime();
    const port = await HelperRuntimeServer.findFreePort();
    const cudaDevice = HelperLaunchPlan.pickDevice(this._settings.cudaDevice(), this._diagnostics());
    this.runtimeId = runtime.id;
    this.lastError = null;
    const t0 = Date.now();
    await this.runtimeServer.start(HelperLaunchPlan.build({
      runtime, modelPath: this._settings.modelPath(), port, contextSize: this._settings.contextSize(), cudaDevice,
    }));
    console.log(`[helper-model] ${this.ref()} ready on :${port} via ${runtime.id}${cudaDevice != null ? ' on CUDA ' + cudaDevice : ''} in ${Date.now() - t0} ms`);
  }

  async _pickRuntime() {
    const svc = this._llmServerService;
    if (!svc || typeof svc.ensureRuntimesView !== 'function') throw new Error('No runtime view available.');
    const view = await svc.ensureRuntimesView();
    const defaultId = svc.getDefaults ? svc.getDefaults().runtimeId : undefined;
    return HelperLaunchPlan.pickRuntime(view.runtimes, defaultId);
  }

  _diagnostics() {
    const svc = this._llmServerService;
    try { return svc && typeof svc.getCachedDiagnostics === 'function' ? svc.getCachedDiagnostics() : null; } catch (_) { return null; }
  }

  static _residentServer() {
    const server = new HelperRuntimeServer();
    server.setIdleTimeout(0);
    return server;
  }
}

module.exports = HelperModelService;
