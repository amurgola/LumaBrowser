class AndroidSettings {
  static KEY = 'settings';
  static GPU_MODES = ['host', 'swiftshader_indirect'];
  static DEFAULTS = Object.freeze({
    sdkPath: '',
    gpuMode: 'host',
    fitToFrame: true,
    relayNotifications: true,
    agentAccess: true,
    stopOnQuit: true,
  });

  constructor(db) {
    this._db = db;
  }

  read() {
    const stored = this._db ? this._db.get(AndroidSettings.KEY, {}) : {};
    return { ...AndroidSettings.DEFAULTS, ...AndroidSettings._clean(stored) };
  }

  save(patch) {
    const next = { ...this.read(), ...AndroidSettings._clean(patch) };
    if (this._db) this._db.set(AndroidSettings.KEY, next);
    return next;
  }

  static _clean(values) {
    const clean = {};
    const source = values && typeof values === 'object' ? values : {};
    for (const [key, fallback] of Object.entries(AndroidSettings.DEFAULTS)) {
      if (!(key in source) || typeof source[key] !== typeof fallback) continue;
      if (key === 'gpuMode' && !AndroidSettings.GPU_MODES.includes(source[key])) continue;
      clean[key] = typeof fallback === 'string' ? source[key].trim() : source[key];
    }
    return clean;
  }
}

module.exports = AndroidSettings;
