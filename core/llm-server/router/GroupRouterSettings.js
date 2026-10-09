const fs = require('fs');
const path = require('path');
const AppPaths = require('../../shared/AppPaths');

class GroupRouterSettings {
  static ENABLED_KEY = 'core.llmServer.defaults.groupRouter';
  static PIN_KEY = 'core.llmServer.defaults.groupRouterPinRam';
  static MODEL_PATH_KEY = 'core.llmServer.groupRouter.modelPath';
  static MODEL_FILE = 'luma-router-qwen3-0.6b-q8_0.gguf';

  constructor({ settingsDb, modelDir = () => path.join(AppPaths.appBaseDir(), 'router') }) {
    this._db = settingsDb;
    this._modelDir = modelDir;
  }

  isEnabled() { return !!this._db.get(GroupRouterSettings.ENABLED_KEY, false); }

  isPinEnabled() { return !!this._db.get(GroupRouterSettings.PIN_KEY, false); }

  setEnabled(value) { this._setFlag(GroupRouterSettings.ENABLED_KEY, value); }

  setPinEnabled(value) { this._setFlag(GroupRouterSettings.PIN_KEY, value); }

  modelDir() { return this._modelDir(); }

  bundledModelPath() { return path.join(this.modelDir(), GroupRouterSettings.MODEL_FILE); }

  modelPath() { return this.pathOverride() || this.bundledModelPath(); }

  pathOverride() {
    const value = this._db.get(GroupRouterSettings.MODEL_PATH_KEY, null);
    return typeof value === 'string' && value ? value : null;
  }

  isModelInstalled() {
    try { return fs.statSync(this.modelPath()).isFile(); } catch (_) { return false; }
  }

  _setFlag(key, value) {
    if (value) this._db.set(key, true);
    else this._db.delete(key);
  }
}

module.exports = GroupRouterSettings;
