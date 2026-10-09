const fs = require('fs');
const path = require('path');
const CoreRequire = require('../CoreRequire');
const PhaserDist = require('./PhaserDist');

const ContainedPath = CoreRequire.load('shared/fs/ContainedPath');

class GameFlattener {
  static ASSET_MIME = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.json': 'application/json',
  };

  static PHASER_TAG = /<script[^>]*\bsrc=["'][^"']*phaser[^"']*["'][^>]*>\s*<\/script>/i;
  static SCRIPT_TAG = /<script[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi;

  static escInline(js) {
    return String(js).replace(/<\/script/gi, '<\\/script');
  }

  static flatten(gameDir, opts = {}) {
    return new GameFlattener(gameDir, opts).execute();
  }

  constructor(gameDir, { sourceUrls = false } = {}) {
    this._gameDir = gameDir;
    this._sourceUrls = !!sourceUrls;
    this._inlinedScripts = 0;
    this._inlinedAssets = 0;
  }

  execute() {
    this._html = fs.readFileSync(path.join(this._gameDir, 'index.html'), 'utf8');
    this._inlinePhaser();
    this._inlineLocalScripts();
    this._inlineAssets();
    return {
      html: this._html,
      bytes: Buffer.byteLength(this._html, 'utf8'),
      inlinedScripts: this._inlinedScripts,
      inlinedAssets: this._inlinedAssets,
    };
  }

  _stamp(name) {
    return this._sourceUrls ? `\n//# sourceURL=${String(name).replace(/[\s'"<>]/g, '')}` : '';
  }

  _inlinePhaser() {
    const phaserPath = PhaserDist.path();
    if (!phaserPath) throw new Error('phaser dist not found, cannot flatten');
    const phaserJs = fs.readFileSync(phaserPath, 'utf8');
    this._html = this._html.replace(GameFlattener.PHASER_TAG, () => `<script>${GameFlattener.escInline(phaserJs)}${this._stamp('phaser.min.js')}</script>`);
  }

  _inlineLocalScripts() {
    this._html = this._html.replace(new RegExp(GameFlattener.SCRIPT_TAG.source, 'gi'), (tag, src) => {
      if (/^(?:https?:)?\/\//i.test(src) || src.startsWith('/')) return tag;
      const code = this._readWithin(src);
      if (code == null) return tag;
      this._inlinedScripts++;
      return `<script>${GameFlattener.escInline(code)}${this._stamp(src)}</script>`;
    });
  }

  _readWithin(src) {
    try {
      return fs.readFileSync(ContainedPath.resolveWithin(this._gameDir, src), 'utf8');
    } catch (_) { return null; }
  }

  _inlineAssets() {
    for (const asset of this._listAssets()) {
      const mime = GameFlattener.ASSET_MIME[path.extname(asset.rel).toLowerCase()];
      if (!mime || !this._html.includes(asset.rel)) continue;
      const uri = this._dataUri(asset.abs, mime);
      if (!uri) continue;
      this._html = this._html.split(asset.rel).join(uri);
      this._inlinedAssets++;
    }
  }

  _dataUri(abs, mime) {
    try { return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`; } catch (_) { return null; }
  }

  _listAssets() {
    const out = [];
    const walk = (dir, relBase) => {
      let entries = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
      for (const e of entries) {
        const abs = path.join(dir, e.name);
        const rel = `${relBase}/${e.name}`;
        if (e.isDirectory()) walk(abs, rel);
        else out.push({ abs, rel });
      }
    };
    walk(path.join(this._gameDir, 'assets'), 'assets');
    return out;
  }
}

module.exports = GameFlattener;
