class ImageServerSettings {
  static KEYS = {
    enabled: 'core.imageServer.enabled',
    modelsDir: 'core.imageServer.modelsDir',
    runtimeId: 'core.imageServer.defaults.runtimeId',
    modelId: 'core.imageServer.defaults.modelId',
    editModelId: 'core.imageServer.defaults.editModelId',
    videoModelId: 'core.imageServer.defaults.videoModelId',
    pinModelRam: 'core.imageServer.defaults.pinModelRam',
    autoUnloadMs: 'core.imageServer.defaults.autoUnloadMs',
  };

  static DEFAULT_AUTO_UNLOAD_MS = 15 * 60 * 1000;
  static DEFAULT_ID_FIELDS = ['runtimeId', 'modelId', 'editModelId', 'videoModelId'];

  constructor(settingsDb, { defaultModelsDir }) {
    this._db = settingsDb;
    this._defaultModelsDir = defaultModelsDir;
  }

  isEnabled() {
    return !!this._db.get(ImageServerSettings.KEYS.enabled, false);
  }

  setEnabled(enabled) {
    this._db.set(ImageServerSettings.KEYS.enabled, !!enabled);
  }

  getModelsDirConfig() {
    const configured = this._db.get(ImageServerSettings.KEYS.modelsDir, '') || '';
    const defaultPath = this._defaultModelsDir();
    return {
      configured: configured || null,
      effectivePath: configured || defaultPath,
      defaultPath,
      isUsingDefault: !configured,
    };
  }

  setModelsDir(dir) {
    this._setOrDelete(ImageServerSettings.KEYS.modelsDir, dir ? String(dir) : null);
    return this.getModelsDirConfig();
  }

  getDefaults() {
    const keys = ImageServerSettings.KEYS;
    return {
      runtimeId: this._db.get(keys.runtimeId, null),
      modelId: this._db.get(keys.modelId, null),
      editModelId: this._db.get(keys.editModelId, null),
      videoModelId: this._db.get(keys.videoModelId, null),
      pinModelRam: !!this._db.get(keys.pinModelRam, false),
    };
  }

  setDefaults(patch = {}) {
    for (const field of ImageServerSettings.DEFAULT_ID_FIELDS) {
      if (patch[field] !== undefined) this._setOrDelete(ImageServerSettings.KEYS[field], patch[field] ? String(patch[field]) : null);
    }
    if (patch.pinModelRam !== undefined) this._setOrDelete(ImageServerSettings.KEYS.pinModelRam, patch.pinModelRam ? true : null);
    return this.getDefaults();
  }

  getAutoUnloadMs() {
    const raw = this._db.get(ImageServerSettings.KEYS.autoUnloadMs, null);
    if (raw === null || raw === undefined) return ImageServerSettings.DEFAULT_AUTO_UNLOAD_MS;
    const ms = Number(raw);
    return Number.isFinite(ms) && ms > 0 ? Math.floor(ms) : 0;
  }

  setAutoUnloadMs(ms) {
    const value = Math.max(0, Math.floor(Number(ms) || 0));
    this._db.set(ImageServerSettings.KEYS.autoUnloadMs, value);
    return value;
  }

  _setOrDelete(key, value) {
    if (value === null) this._db.delete(key);
    else this._db.set(key, value);
  }
}

module.exports = ImageServerSettings;
