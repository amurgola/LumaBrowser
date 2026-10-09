const path = require('path');
const AppPaths = require('../../shared/AppPaths');

class MusicServerSettings {
  static ENABLED_KEY = 'core.musicServer.enabled';
  static DEFAULTS_KEY = 'core.musicServer.defaults';
  static EXTRA_SERVE_ARGS_KEY = 'core.musicServer.extraServeArgs';
  static MODELS_DIR_KEY = 'core.musicServer.modelsDir';
  static DEFAULT_AUTO_UNLOAD_MS = 10 * 60 * 1000;
  static DEFAULT_MAX_DURATION_SEC = 300;

  constructor(settingsDb, { baseDir = () => AppPaths.appBaseDir() } = {}) {
    this._db = settingsDb;
    this._baseDir = baseDir;
  }

  isEnabled() {
    return !!this._db.get(MusicServerSettings.ENABLED_KEY, false);
  }

  setEnabled(value) {
    this._db.set(MusicServerSettings.ENABLED_KEY, !!value);
  }

  getDefaults() {
    const stored = this._storedDefaults();
    return {
      modelId: stored.modelId || null,
      seed: Number.isFinite(stored.seed) ? stored.seed : null,
      maxDurationSec: Number(stored.maxDurationSec) > 0 ? Number(stored.maxDurationSec) : MusicServerSettings.DEFAULT_MAX_DURATION_SEC,
      autoUnloadMs: Number(stored.autoUnloadMs) >= 0 ? Number(stored.autoUnloadMs) : MusicServerSettings.DEFAULT_AUTO_UNLOAD_MS,
    };
  }

  setDefaults(patch) {
    this._db.set(MusicServerSettings.DEFAULTS_KEY, { ...this._storedDefaults(), ...(patch || {}) });
    return this.getDefaults();
  }

  getExtraServeArgs() {
    const value = this._db.get(MusicServerSettings.EXTRA_SERVE_ARGS_KEY, []);
    return Array.isArray(value) ? value.map(String) : [];
  }

  getRuntimesDir() {
    return path.join(this._baseDir(), 'runtimes');
  }

  getModelsDirConfig() {
    const configuredPath = this._db.get(MusicServerSettings.MODELS_DIR_KEY, null);
    return { configuredPath, effectivePath: configuredPath || path.join(this._baseDir(), 'models', 'music') };
  }

  _storedDefaults() {
    return this._db.get(MusicServerSettings.DEFAULTS_KEY, {}) || {};
  }
}

module.exports = MusicServerSettings;
