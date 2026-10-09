const RuntimeManifest = require('../RuntimeManifest');

class ExtensionRuntimeProbe {
  constructor({ entry, runtimesRoot, managedDir, hooks }) {
    this._entry = entry;
    this._runtimesRoot = runtimesRoot;
    this._managedDir = managedDir;
    this._hooks = hooks;
  }

  async detect({ cuda, gpu } = {}) {
    try {
      const res = await this._hooks.detect({ entry: this._entry, runtimesRoot: this._runtimesRoot, managedDir: this._managedDir, cuda, gpu });
      return res && res.installed ? this._installed(res) : this._notInstalled(res);
    } catch (err) {
      return { ...this._base(), detectError: (err && err.message) || String(err) };
    }
  }

  async _installed(res) {
    return {
      installed: true,
      source: res.source || 'managed',
      managedDir: res.managedDir || this._managedDir,
      binaryPath: res.binaryPath || null,
      version: res.version || null,
      manifest: res.manifest || (await RuntimeManifest.read(this._managedDir)),
    };
  }

  _notInstalled(res) {
    const manifest = res && res.manifest ? { manifest: res.manifest } : {};
    return { ...this._base(), ...manifest, detectError: (res && res.error) || null };
  }

  _base() {
    return { installed: false, source: null, managedDir: this._managedDir, binaryPath: null, version: null, manifest: null };
  }
}

module.exports = ExtensionRuntimeProbe;
