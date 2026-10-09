const KeyedSettings = require('./KeyedSettings');

class LlmServerSettings extends KeyedSettings {
  static KEYS = {
    enabled: 'core.llmServer.enabled',
    openTabOnLoad: 'core.llmServer.openTabOnLoad',
    modelsDir: 'core.llmServer.modelsDir',
    autoUnloadMs: 'core.llmServer.defaults.autoUnloadMs',
    unloadOnVramPressure: 'core.llm.unloadOnVramPressure',
  };

  static DEFAULT_AUTO_UNLOAD_MS = 15 * 60 * 1000;

  constructor(settingsDb, { defaultModelsDir }) {
    super(settingsDb);
    this._defaultModelsDir = defaultModelsDir;
  }

  isEnabled() {
    return !!this._db.get(LlmServerSettings.KEYS.enabled, false);
  }

  setEnabled(enabled) {
    this._db.set(LlmServerSettings.KEYS.enabled, !!enabled);
  }

  getOpenTabOnLoad() {
    return !!this._db.get(LlmServerSettings.KEYS.openTabOnLoad, false);
  }

  setOpenTabOnLoad(value) {
    this._db.set(LlmServerSettings.KEYS.openTabOnLoad, !!value);
    return this.getOpenTabOnLoad();
  }

  getModelsDirConfig() {
    const configured = this._db.get(LlmServerSettings.KEYS.modelsDir, '') || '';
    const defaultPath = this._defaultModelsDir();
    return {
      configured: configured || null,
      effectivePath: configured || defaultPath,
      defaultPath,
      isUsingDefault: !configured,
    };
  }

  setModelsDir(dir) {
    this._setOrDelete(LlmServerSettings.KEYS.modelsDir, dir ? String(dir) : null);
    return this.getModelsDirConfig();
  }

  getAutoUnloadMs() {
    const ms = Number(this._db.get(LlmServerSettings.KEYS.autoUnloadMs, 0));
    return Number.isFinite(ms) && ms > 0 ? Math.floor(ms) : 0;
  }

  setAutoUnloadMs(ms) {
    const value = Math.max(0, Math.floor(Number(ms) || 0));
    this._setOrDelete(LlmServerSettings.KEYS.autoUnloadMs, value > 0 ? value : null);
    return value;
  }

  getUnloadOnVramPressure() {
    return this._db.get(LlmServerSettings.KEYS.unloadOnVramPressure, false) === true;
  }

  setUnloadOnVramPressure(value) {
    const on = value === true;
    this._setOrDelete(LlmServerSettings.KEYS.unloadOnVramPressure, on ? true : null);
    return on;
  }
}

module.exports = LlmServerSettings;
