const ModelCatalogRegistry = require('../models/ModelCatalogRegistry');
const AddonModelSetup = require('../models/AddonModelSetup');
const LlmRuntimeInstaller = require('../runtimes/LlmRuntimeInstaller');
const LlmDownloadSlot = require('./LlmDownloadSlot');

class AddonModelInstaller {
  constructor({
    llmServerService, slot, registry = ModelCatalogRegistry.shared, createSetup = () => new AddonModelSetup(),
    installer = LlmRuntimeInstaller.shared,
  }) {
    this._svc = llmServerService;
    this._slot = slot;
    this._registry = registry;
    this._createSetup = createSetup;
    this._installer = installer;
    this._handle = null;
  }

  async catalog() {
    const modelsDir = this._modelsDir();
    const runtimesById = await this._runtimesById();
    const models = this._registry.list().map((entry) => ({
      ...entry,
      installed: AddonModelSetup.isInstalled(entry, modelsDir),
      destPath: AddonModelSetup.destPathFor(entry, modelsDir),
      runtime: AddonModelInstaller.runtimeRow(entry, runtimesById),
    }));
    return { models, modelsDir };
  }

  cancel() {
    if (!this._handle) return;
    this._handle.canceled = true;
    try { this._handle.cancel(); } catch (_) {}
  }

  async setup(id, send) {
    if (this._handle || this._slot.busy) return { success: false, error: LlmDownloadSlot.BUSY };
    const stream = this._invalidatingStream(send);
    const handle = this._begin();
    try {
      const result = await this._run(id, handle, stream);
      this._svc.invalidateRuntimesCache();
      return { success: true, result };
    } catch (err) {
      return AddonModelInstaller._failure(err, handle, stream);
    } finally {
      this._handle = null;
      this._slot.release();
    }
  }

  static runtimeRow(entry, runtimesById) {
    if (!entry.requiresRuntime) return null;
    const rt = runtimesById.get(entry.requiresRuntime) || null;
    if (!rt) return { id: entry.requiresRuntime, name: entry.requiresRuntime, installed: false, installable: false, missing: true };
    return {
      id: rt.id, name: rt.name, installed: !!rt.installed, installable: !!rt.installable,
      hardware: rt.hardware || null, platforms: rt.platforms || null, version: rt.version || null,
    };
  }

  _begin() {
    const handle = { canceled: false, cancel: () => {} };
    this._handle = handle;
    this._slot.hold({ cancel: () => { handle.canceled = true; try { handle.cancel(); } catch (_) {} } });
    return handle;
  }

  _run(id, handle, stream) {
    return this._createSetup().execute(id, {
      modelsDir: this._modelsDir(),
      runtimesRoot: this._svc.getRuntimesDir(),
      isCanceled: () => handle.canceled,
      handle,
      onEvent: stream,
      detectRuntime: (runtimeId) => this._detectRuntime(runtimeId),
      installRuntime: (runtimeId, opts) => this._installer.installRuntime(runtimeId, opts),
    });
  }

  async _detectRuntime(runtimeId) {
    const view = await this._svc.ensureRuntimesView({ force: true });
    return ((view && view.runtimes) || []).find((r) => r.id === runtimeId) || null;
  }

  _invalidatingStream(send) {
    return (type, payload) => {
      if (type === 'runtime' && payload && payload.type === 'finalize') this._svc.invalidateRuntimesCache();
      send(type, payload);
    };
  }

  async _runtimesById() {
    let view = null;
    try { view = await this._svc.ensureRuntimesView(); } catch (_) { view = null; }
    return new Map(((view && view.runtimes) || []).map((r) => [r.id, r]));
  }

  _modelsDir() {
    return this._svc.getModelsDirConfig().effectivePath;
  }

  static _failure(err, handle, stream) {
    const code = err && err.code ? err.code : null;
    if (code === 'CANCELED' || handle.canceled) {
      stream('canceled', {});
      return { success: false, canceled: true };
    }
    const detail = (err && err.detail) || null;
    stream('error', { message: err.message, code, detail });
    return { success: false, error: err.message, code, detail };
  }
}

module.exports = AddonModelInstaller;
