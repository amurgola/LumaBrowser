const fs = require('fs');
const path = require('path');
const AudioCppInstallation = require('./AudioCppInstallation');
const AudioCppRuntimeCatalog = require('./AudioCppRuntimeCatalog');
const ChatterboxEngine = require('./ChatterboxEngine');
const ChatterboxModels = require('./ChatterboxModels');
const VoiceStore = require('./VoiceStore');

class ChatterboxStatus {
  constructor({ voice, extensionId, engine, store, settings, jobs, runtimesDir, modelsDir }) {
    Object.assign(this, { _voice: voice, _extensionId: extensionId, _engine: engine, _store: store, _settings: settings, _jobs: jobs, _runtimesDir: runtimesDir, _modelsDir: modelsDir });
  }

  static build(options) {
    return new ChatterboxStatus(options).execute();
  }

  async execute() {
    const installed = AudioCppInstallation.findInstalledRuntime(this._runtimesDir, this._settings.preferredRuntimeId);
    return {
      runtimes: this._runtimeRows(),
      sttReady: await this._sttReady(),
      activeRuntime: installed ? { id: installed.id, backend: installed.backend } : null,
      preferredRuntimeId: this._settings.preferredRuntimeId,
      models: this._modelRows(),
      voices: this._store.list().map((v) => ({ ...v, languageName: ChatterboxModels.LANGUAGE_NAMES[v.language] || v.language })),
      turboAvailable: this._engine.listVoices().some((v) => v.id === ChatterboxEngine.TURBO_VOICE_ID),
      activeVoiceId: this._activeVoiceId(),
      languages: Object.entries(ChatterboxModels.LANGUAGE_NAMES).map(([code, name]) => ({ code, name })),
      limits: { minRefSec: VoiceStore.MIN_REF_SEC, maxRefSec: VoiceStore.MAX_REF_SEC },
      server: this._engine.getStatus(),
      jobs: {
        runtime: this._jobs.runtime ? { ...this._jobs.runtime.state } : null,
        model: this._jobs.model ? { ...this._jobs.model.state } : null,
      },
    };
  }

  _runtimeRows() {
    const catalog = AudioCppRuntimeCatalog.shared;
    const hostIds = catalog.availableForHost();
    return AudioCppRuntimeCatalog.RUNTIMES.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      backend: r.backend,
      sizeNote: r.sizeNote || null,
      requirementNote: r.requirementNote || null,
      available: hostIds.includes(r.id),
      installed: !!AudioCppInstallation.findRuntimeBinary(this._runtimesDir, r.id),
      recommended: hostIds[0] === r.id,
    }));
  }

  _modelRows() {
    return ChatterboxModels.getModels().map((m) => {
      const bytes = ChatterboxStatus._sizeOnDisk(path.join(this._modelsDir, m.file));
      return {
        id: m.id, name: m.name, description: m.description, sizeBytes: m.sizeBytes, license: m.license,
        task: m.task, languages: m.languages, installed: bytes > 0, bytesOnDisk: bytes,
      };
    });
  }

  async _sttReady() {
    if (typeof this._voice.sttReady !== 'function') return false;
    return !!(await this._voice.sttReady());
  }

  _activeVoiceId() {
    const defaultId = this._voice.getDefaultTtsModelId();
    const prefix = `ext:${this._extensionId}:`;
    return defaultId && defaultId.startsWith(prefix) ? defaultId.slice(prefix.length) : null;
  }

  static _sizeOnDisk(p) {
    try { return fs.statSync(p).size; } catch (_) { return 0; }
  }
}

module.exports = ChatterboxStatus;
