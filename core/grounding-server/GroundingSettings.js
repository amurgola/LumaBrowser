const GroundingModelFiles = require('./GroundingModelFiles');

class GroundingSettings {
  static KEYS = {
    modelPath: 'core.groundingServer.modelPath',
    mmprojPath: 'core.groundingServer.mmprojPath',
    autoUnloadMs: 'core.groundingServer.autoUnloadMs',
  };
  static DEFAULT_AUTO_UNLOAD_MS = 10 * 60 * 1000;

  constructor(settingsDb) {
    this._db = settingsDb;
  }

  getModelPath() {
    return this._db.get(GroundingSettings.KEYS.modelPath, '') || '';
  }

  getMmprojPath() {
    const explicit = this._db.get(GroundingSettings.KEYS.mmprojPath, '') || '';
    if (explicit) return explicit;
    const model = this.getModelPath();
    return model ? GroundingModelFiles.pairMmproj(model) : null;
  }

  getAutoUnloadMs() {
    const value = Number(this._db.get(GroundingSettings.KEYS.autoUnloadMs, GroundingSettings.DEFAULT_AUTO_UNLOAD_MS));
    return Number.isFinite(value) && value >= 0 ? value : GroundingSettings.DEFAULT_AUTO_UNLOAD_MS;
  }

  setAutoUnloadMs(ms) {
    const value = Math.max(0, Number(ms) || 0);
    this._db.set(GroundingSettings.KEYS.autoUnloadMs, value);
    return value;
  }

  isConfigured() {
    return GroundingModelFiles.exists(this.getModelPath()) && GroundingModelFiles.exists(this.getMmprojPath());
  }

  select(modelPath, mmprojPath) {
    this._db.set(GroundingSettings.KEYS.modelPath, modelPath);
    if (mmprojPath) this._db.set(GroundingSettings.KEYS.mmprojPath, mmprojPath);
    else this._db.delete(GroundingSettings.KEYS.mmprojPath);
  }

  clear() {
    this._db.delete(GroundingSettings.KEYS.modelPath);
    this._db.delete(GroundingSettings.KEYS.mmprojPath);
  }
}

module.exports = GroundingSettings;
