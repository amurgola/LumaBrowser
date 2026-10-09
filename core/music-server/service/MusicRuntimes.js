const ManagedRuntimeSettings = require('../../shared/runtime/ManagedRuntimeSettings');
const MusicRuntimeCatalog = require('../runtimes/MusicRuntimeCatalog');
const MusicRuntimeDetector = require('../runtimes/MusicRuntimeDetector');
const MusicRuntimeInstaller = require('../runtimes/MusicRuntimeInstaller');
const MusicRuntimeUpdates = require('../runtimes/MusicRuntimeUpdates');

class MusicRuntimes {
  static CACHE_KEY = 'core.musicServer.runtimesCache';
  static MANUAL_BINARY_PREFIX = 'core.musicServer.runtimes.';
  static RUNTIME_KIND = 'music-inference';
  static FALLBACK_IDS = ['sglang-omni'];
  static USER_AGENT = 'LumaBrowser';
  static BUSY_MESSAGE = 'A runtime install is already running.';

  constructor({
    settingsDb,
    runtimesDir,
    getDiagnostics,
    catalog = new MusicRuntimeCatalog(),
    detector = new MusicRuntimeDetector({ catalog }),
    installer = new MusicRuntimeInstaller({ catalog }),
    updates = new MusicRuntimeUpdates({ catalog }),
  }) {
    this._runtimesDir = runtimesDir;
    this._installer = installer;
    this._updates = updates;
    this._settings = MusicRuntimes._managedSettings({ settingsDb, runtimesDir, getDiagnostics, catalog, detector });
    this._installInFlight = false;
    this._installCanceled = false;
  }

  ensureView({ force = false } = {}) {
    return this._settings.ensureRuntimesView({ force });
  }

  invalidateCache() {
    this._settings.invalidateRuntimesCache();
  }

  getManualBinary(id) {
    return this._settings.getManualRuntimeBinary(id);
  }

  setManualBinary(id, binaryPath) {
    this._settings.setManualRuntimeBinary(id, binaryPath);
  }

  async install(id, { onEvent } = {}) {
    if (this._installInFlight) throw new Error(MusicRuntimes.BUSY_MESSAGE);
    this._installInFlight = true;
    this._installCanceled = false;
    try {
      return await this._installer.installRuntime(id, {
        runtimesRoot: this._runtimesDir(),
        onEvent,
        isCanceled: () => this._installCanceled,
      });
    } finally {
      this._installInFlight = false;
      this.invalidateCache();
    }
  }

  cancelInstall() {
    this._installCanceled = true;
  }

  async uninstall(id) {
    const result = await this._installer.uninstallRuntime(id, { runtimesRoot: this._runtimesDir() });
    this.invalidateCache();
    return result;
  }

  async checkUpdates({ force = false } = {}) {
    const view = await this.ensureView({ force });
    return this._updates.check({ view, userAgent: MusicRuntimes.USER_AGENT });
  }

  static _managedSettings({ settingsDb, runtimesDir, getDiagnostics, catalog, detector }) {
    return new ManagedRuntimeSettings({
      settingsDb,
      cacheKey: MusicRuntimes.CACHE_KEY,
      manualBinaryPrefix: MusicRuntimes.MANUAL_BINARY_PREFIX,
      catalog,
      runtimeKind: MusicRuntimes.RUNTIME_KIND,
      fallbackIds: MusicRuntimes.FALLBACK_IDS,
      detectRuntimes: (inputs) => detector.detectRuntimes(inputs),
      getRuntimesDir: runtimesDir,
      getDiagnostics,
    });
  }
}

module.exports = MusicRuntimes;
