const fs = require('fs');
const path = require('path');
const ExtensionManifests = require('../bytecode/ExtensionManifests');
const AddonObfuscator = require('./AddonObfuscator');
const AddonZipper = require('./AddonZipper');

class AddonPackager {
  constructor({ rootDir, outDir, obfuscator, zipper, log = console.log }) {
    this._rootDir = rootDir;
    this._outDir = outDir || path.join(rootDir, 'dist', 'extensions');
    this._obfuscator = obfuscator || new AddonObfuscator({ log });
    this._zipper = zipper || new AddonZipper();
    this._log = log;
  }

  async run() {
    const catalog = [];
    for (const entry of this._distributables()) catalog.push(await this._packageOne(entry));
    this._writeIndex(catalog);
    return catalog;
  }

  _distributables() {
    return new ExtensionManifests(this._rootDir, { log: this._log }).list().filter((e) => e.manifest.distributable);
  }

  async _packageOne({ dir, manifest }) {
    const meta = AddonPackager.metadata(manifest, dir);
    this._log(`[build-extensions] packaging "${meta.id}"${meta.private ? ' (private, obfuscated)' : ''}`);
    fs.mkdirSync(this._outDir, { recursive: true });
    const stageRoot = fs.mkdtempSync(path.join(path.dirname(this._outDir), 'lumab-addon-'));
    try {
      const stageDir = this._stage(dir, stageRoot, meta.id);
      if (meta.private) this._obfuscator.obfuscateTree(stageDir, manifest);
      fs.writeFileSync(path.join(stageDir, 'meta.json'), JSON.stringify(meta, null, 2));
      const zip = `${meta.id}.zip`;
      const bytes = await this._zipper.zip(stageDir, meta.id, path.join(this._outDir, zip));
      this._log(`  -> dist/extensions/${zip} (${(bytes / 1024).toFixed(1)} KB)`);
      return { ...meta, zip, bytes };
    } finally {
      fs.rmSync(stageRoot, { recursive: true, force: true });
    }
  }

  static metadata(manifest, dir) {
    return {
      id: manifest.id || dir,
      name: manifest.name || manifest.id || dir,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      private: Boolean(manifest.private),
    };
  }

  _stage(dir, stageRoot, id) {
    const stageDir = path.join(stageRoot, id);
    fs.cpSync(path.join(this._rootDir, 'extensions', dir), stageDir, { recursive: true });
    return stageDir;
  }

  _writeIndex(catalog) {
    if (catalog.length === 0) {
      this._log('[build-extensions] no distributable extensions found; nothing to package');
      return;
    }
    fs.writeFileSync(path.join(this._outDir, 'index.json'), JSON.stringify({ extensions: catalog }, null, 2));
    this._log(`[build-extensions] ${catalog.length} add-on(s) written to dist/extensions/`);
  }
}

module.exports = AddonPackager;
