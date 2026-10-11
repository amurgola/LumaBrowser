const fs = require('fs');
const path = require('path');

class ExtensionManifests {
  constructor(rootDir, { log = () => {} } = {}) {
    this._rootDir = rootDir;
    this._log = log;
    this._entries = null;
  }

  list() {
    if (!this._entries) this._entries = this._load();
    return this._entries;
  }

  distributableDirs() {
    return new Set(this.list().filter((e) => e.manifest.distributable).map((e) => e.dir));
  }

  _load() {
    const extDir = path.join(this._rootDir, 'extensions');
    if (!fs.existsSync(extDir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(extDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = this._readManifest(path.join(extDir, entry.name, 'manifest.js'), entry.name);
      if (manifest) out.push({ dir: entry.name, manifest });
    }
    return out;
  }

  _readManifest(manifestPath, dir) {
    if (!fs.existsSync(manifestPath)) return null;
    try {
      delete require.cache[require.resolve(manifestPath)];
      return require(manifestPath);
    } catch (err) {
      this._log(`[build] could not read the manifest of "${dir}": ${err.message}`);
      return null;
    }
  }
}

module.exports = ExtensionManifests;
