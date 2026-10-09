const fs = require('fs');
const path = require('path');
const AudioCppRuntimeCatalog = require('./AudioCppRuntimeCatalog');
const ChatterboxModels = require('./ChatterboxModels');
const ChatterboxStatus = require('./ChatterboxStatus');
const ChatterboxVoiceActions = require('./ChatterboxVoiceActions');
const ModelDownloadJob = require('./ModelDownloadJob');
const RuntimeInstallJob = require('./RuntimeInstallJob');

class ChatterboxSetupActions {
  constructor(host) {
    this._host = host;
    this._voices = new ChatterboxVoiceActions(host);
    this._routes = {
      status: () => this.status(),
      'runtime.install': (p) => this._installRuntime(p.id),
      'runtime.prefer': (p) => this._preferRuntime(p.id),
      'runtime.uninstall': (p) => this._uninstallRuntime(p.id),
      'model.download': (p) => this._downloadModel(p.id),
      'model.cancel': () => this._cancelModel(),
      'model.delete': (p) => this._deleteModel(p.id),
      'server.stop': () => this._stopServer(),
    };
  }

  async handle(action, payload = {}) {
    const route = this._routes[action];
    if (route) return route(payload || {});
    if (this._voices.handles(action)) return this._voices.handle(action, payload || {});
    throw new Error(`Unknown action: ${action}`);
  }

  status() {
    const h = this._host;
    return ChatterboxStatus.build({
      voice: h.voice, extensionId: h.extensionId, engine: h.engine, store: h.store, settings: h.settings,
      jobs: h.jobs, runtimesDir: h.runtimesDir(), modelsDir: h.modelsDir(),
    });
  }

  _installRuntime(id) {
    const h = this._host;
    if (h.jobs.runtime && !h.jobs.runtime.state.done) throw new Error('An engine install is already running.');
    ChatterboxSetupActions._runtimeEntry(id);
    h.jobs.runtime = new RuntimeInstallJob({
      id,
      runtimesRoot: h.runtimesDir(),
      stopEngine: () => h.stopEngine(),
      onInstalled: (installedId) => h.settings.setPreferredRuntime(installedId),
    }).start();
    return { started: true };
  }

  async _preferRuntime(id) {
    if (id && !AudioCppRuntimeCatalog.shared.getById(id)) throw new Error(`Unknown engine: ${id}`);
    this._host.settings.setPreferredRuntime(id);
    await this._host.stopEngine();
    return { preferredRuntimeId: this._host.settings.preferredRuntimeId };
  }

  async _uninstallRuntime(id) {
    const h = this._host;
    const entry = ChatterboxSetupActions._runtimeEntry(id);
    await h.stopEngine();
    await fs.promises.rm(path.join(h.runtimesDir(), entry.id), { recursive: true, force: true });
    if (h.settings.preferredRuntimeId === entry.id) h.settings.setPreferredRuntime(null);
    return { removed: true };
  }

  _downloadModel(id) {
    const h = this._host;
    if (h.jobs.model && !h.jobs.model.state.done) throw new Error('A model download is already running.');
    const entry = ChatterboxSetupActions._modelEntry(id);
    fs.mkdirSync(h.modelsDir(), { recursive: true });
    h.jobs.model = new ModelDownloadJob({ entry, modelsDir: h.modelsDir(), stopEngine: () => h.stopEngine() }).start();
    return { started: true };
  }

  _cancelModel() {
    const job = this._host.jobs.model;
    return { canceled: !!job && job.cancel() };
  }

  async _deleteModel(id) {
    const entry = ChatterboxSetupActions._modelEntry(id);
    await this._host.stopEngine();
    await fs.promises.rm(path.join(this._host.modelsDir(), entry.file), { force: true });
    return { removed: true };
  }

  async _stopServer() {
    await this._host.engine.stop();
    return { stopped: true };
  }

  static _runtimeEntry(id) {
    const entry = AudioCppRuntimeCatalog.shared.getById(id);
    if (!entry) throw new Error(`Unknown engine: ${id}`);
    return entry;
  }

  static _modelEntry(id) {
    const entry = ChatterboxModels.getModelById(id);
    if (!entry) throw new Error(`Unknown model: ${id}`);
    return entry;
  }
}

module.exports = ChatterboxSetupActions;
