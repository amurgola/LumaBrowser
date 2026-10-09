const path = require('path');
const ConfinedFile = require('./ConfinedFile');
const DashboardContribution = require('../../core/shell/extensions/DashboardContribution');

class ExtensionAssetGate {
  static PREFIX_RE = /^\/llm-ui\/ext\/?/;

  constructor(extensionManager) {
    this._extensions = extensionManager;
  }

  resolve(reqPath) {
    let rel;
    try {
      rel = decodeURIComponent(String(reqPath).replace(ExtensionAssetGate.PREFIX_RE, ''));
    } catch (_) {
      return { status: 400 };
    }
    if (!rel || rel.includes('\0')) return { status: 400 };
    return this._resolveAsset(rel);
  }

  handler() {
    return (req, res) => {
      const target = this.resolve(req.path);
      if (target.status) return res.status(target.status).end();
      return ConfinedFile.send(res, target.dir, target.path);
    };
  }

  _resolveAsset(rel) {
    const slash = rel.indexOf('/');
    if (slash <= 0) return { status: 404 };
    const assetRel = rel.slice(slash + 1);
    if (!assetRel) return { status: 404 };
    const manifest = this._manifestOf(rel.slice(0, slash));
    if (!manifest || !ExtensionAssetGate._publishesUi(manifest)) return { status: 404 };
    const dir = manifest._dir;
    const resolved = path.resolve(dir, assetRel);
    if (!ExtensionAssetGate.publishedFiles(manifest).includes(resolved)) return { status: 403 };
    return { dir, path: resolved };
  }

  _manifestOf(extensionId) {
    const ext = this._extensions.getExtension(extensionId);
    return ext && ext.manifest ? ext.manifest : null;
  }

  static _publishesUi(manifest) {
    return !!(manifest.chatUi || manifest.setupTab || manifest.dashboard);
  }

  static publishedFiles(manifest) {
    const files = [];
    for (const def of [manifest.chatUi, manifest.setupTab]) {
      if (!def) continue;
      const file = typeof def === 'string' ? def : def.file;
      if (file) files.push(file);
      if (typeof def === 'object' && Array.isArray(def.assets)) files.push(...def.assets);
    }
    const chatFiles = files.filter(Boolean).map((p) => path.resolve(manifest._dir, p));
    return [...chatFiles, ...DashboardContribution.publishedFiles(manifest)];
  }
}

module.exports = ExtensionAssetGate;
