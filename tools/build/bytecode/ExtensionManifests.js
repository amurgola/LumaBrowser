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

  privateDirs() {
    return new Set(this.list().filter((e) => e.manifest.private).map((e) => e.dir));
  }

  distributableDirs() {
    return new Set(this.list().filter((e) => e.manifest.distributable).map((e) => e.dir));
  }

  browserFiles() {
    const out = [];
    for (const { dir, manifest } of this.list()) {
      for (const ref of ExtensionManifests.browserScripts(manifest)) out.push(`extensions/${dir}/${ref}`);
    }
    return out;
  }

  static browserScripts(manifest) {
    const refs = [
      manifest.renderer,
      manifest.chatUi && manifest.chatUi.file,
      ...((manifest.chatUi && manifest.chatUi.assets) || []),
      manifest.setupTab && manifest.setupTab.file,
      ...((manifest.setupTab && manifest.setupTab.assets) || []),
      ...(Array.isArray(manifest.chatModes) ? manifest.chatModes.map((m) => m && m.chatUi) : []),
      ...(manifest.browserScripts || []),
    ];
    return refs.filter((r) => typeof r === 'string' && r.toLowerCase().endsWith('.js')).map(ExtensionManifests._normalize);
  }

  static _normalize(ref) {
    return path.posix.normalize(ref.replace(/\\/g, '/')).replace(/^\.\//, '');
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
