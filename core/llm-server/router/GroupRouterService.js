const fs = require('fs');
const os = require('os');
const RamPinService = require('../../shared/runtime/rampin/RamPinService');
const RouterRuntimeServer = require('./RouterRuntimeServer');
const GroupRouterSettings = require('./GroupRouterSettings');
const RouterModelDownloader = require('./RouterModelDownloader');
const RouterLaunchPlan = require('./RouterLaunchPlan');
const RouterClient = require('./RouterClient');

class GroupRouterService {
  static DEFAULT_TIMEOUT_MS = 1500;
  static PRIME_TIMEOUT_MS = 10000;

  constructor({ settingsDb, llmServerService, modelDir, runtimeServer, ramPin, client, downloader, cpuCount } = {}) {
    this._settings = new GroupRouterSettings({ settingsDb, ...(modelDir ? { modelDir } : {}) });
    this._llmServerService = llmServerService;
    this.runtimeServer = runtimeServer || GroupRouterService._residentServer();
    this.ramPin = ramPin || this._buildRamPin();
    this._client = client || new RouterClient();
    this._downloader = downloader || new RouterModelDownloader({ modelFile: GroupRouterSettings.MODEL_FILE });
    this._cpuCount = cpuCount != null ? cpuCount : (os.cpus() || []).length;
    this.lastError = null;
    this.runtimeId = null;
    this.lastLatencyMs = null;
    this._chain = Promise.resolve();
  }

  isEnabled() { return this._settings.isEnabled(); }

  isPinEnabled() { return this._settings.isPinEnabled(); }

  setEnabled(value) { this._settings.setEnabled(value); }

  setPinEnabled(value) { this._settings.setPinEnabled(value); }

  getModelDir() { return this._settings.modelDir(); }

  getModelPath() { return this._settings.modelPath(); }

  isModelInstalled() { return this._settings.isModelInstalled(); }

  isReady() { return this.runtimeServer.getStatus().state === 'ready'; }

  getStatus() {
    const st = this.runtimeServer.getStatus();
    return {
      enabled: this.isEnabled(),
      pinRam: this.isPinEnabled(),
      modelPath: this.getModelPath(),
      modelInstalled: this.isModelInstalled(),
      state: st.state,
      port: st.port,
      runtimeId: this.runtimeId,
      download: this._downloader.progress(),
      lastLatencyMs: this.lastLatencyMs,
      error: this.lastError || st.lastError || null,
      pin: this.ramPin.getStatus(),
    };
  }

  apply() {
    if (!this.isEnabled() && this._downloader.isActive()) this._downloader.cancel();
    this._chain = this._chain.then(() => this._applyOnce()).catch((err) => {
      this.lastError = (err && err.message) || String(err);
      console.warn('[group-router] apply failed:', this.lastError);
    });
    return this._chain;
  }

  async downloadModel({ indexUrl } = {}) {
    this.lastError = null;
    const result = await this._downloader.download({ destPath: this._settings.bundledModelPath(), indexUrl });
    if (result.error) this.lastError = `Router model download failed: ${result.error}`;
    return result.ok;
  }

  async stop() {
    try { await this.runtimeServer.stop(); } catch (_) {}
    try { await this.ramPin.stop(); } catch (_) {}
  }

  async classify(message, { timeoutMs = GroupRouterService.DEFAULT_TIMEOUT_MS } = {}) {
    if (!this.isEnabled() || !this.isReady()) return null;
    const t0 = Date.now();
    try {
      const keys = await this._client.classify({ port: this.runtimeServer.getStatus().port, message, timeoutMs });
      this.lastLatencyMs = Date.now() - t0;
      return keys;
    } catch (err) {
      console.warn(`[group-router] classify failed after ${Date.now() - t0} ms:`, err && err.message);
      return null;
    }
  }

  async _applyOnce() {
    const state = this.runtimeServer.getStatus().state;
    if (!this.isEnabled()) return this._applyDisabled(state);
    if (!this.isModelInstalled() && !this._settings.pathOverride()) {
      await this.downloadModel();
      if (!this.isEnabled()) return undefined;
    }
    if (!this.isModelInstalled()) return this._applyMissingModel(state);
    await this.ramPin.apply();
    if (state === 'ready' || state === 'starting') return undefined;
    return this._start();
  }

  async _applyDisabled(state) {
    if (state !== 'idle') await this.runtimeServer.stop();
    await this.ramPin.apply();
    this.lastError = null;
  }

  async _applyMissingModel(state) {
    if (state !== 'idle') await this.runtimeServer.stop();
    this.lastError = this.lastError || `Router model not installed (expected ${this.getModelPath()}).`;
    await this.ramPin.apply();
  }

  async _start() {
    const runtime = await this._pickRuntime();
    const port = await RouterRuntimeServer.findFreePort();
    this.runtimeId = runtime.id;
    this.lastError = null;
    const t0 = Date.now();
    await this.runtimeServer.start(RouterLaunchPlan.build({ runtime, modelPath: this.getModelPath(), port, cpuCount: this._cpuCount }));
    console.log(`[group-router] ready on :${port} via ${runtime.id} in ${Date.now() - t0} ms`);
    await this.classify('hello', { timeoutMs: GroupRouterService.PRIME_TIMEOUT_MS }).catch(() => {});
  }

  async _pickRuntime() {
    const svc = this._llmServerService;
    if (!svc || typeof svc.ensureRuntimesView !== 'function') throw new Error('No runtime view available.');
    const view = await svc.ensureRuntimesView();
    const defaultId = svc.getDefaults ? svc.getDefaults().runtimeId : undefined;
    return RouterLaunchPlan.pickRuntime(view.runtimes, defaultId);
  }

  static _residentServer() {
    const server = new RouterRuntimeServer();
    server.setIdleTimeout(0);
    return server;
  }

  _buildRamPin() {
    return new RamPinService({
      name: 'luma-router-ram-pin',
      isEnabled: () => this.isEnabled() && this.isPinEnabled(),
      resolveTarget: async () => this._pinTarget(),
    });
  }

  _pinTarget() {
    const modelPath = this.getModelPath();
    let size = 0;
    try { size = fs.statSync(modelPath).size; } catch (_) { return { error: `Router model not found at ${modelPath}.` }; }
    return { key: modelPath, modelName: 'Tool router', totalBytes: size, files: [{ path: modelPath, sizeBytes: size }] };
  }
}

module.exports = GroupRouterService;
