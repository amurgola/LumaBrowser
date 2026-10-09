const fs = require('fs');
const path = require('path');
const ContainedPath = require('../../shared/fs/ContainedPath');

class ExtensionFolderResolver {
  constructor(extensionManager) {
    this._extensions = extensionManager;
  }

  resolve(extensionId) {
    if (typeof extensionId !== 'string' || !extensionId) return null;
    const dir = this._discoveredDir(extensionId) || this._createdDir(extensionId);
    return dir ? ExtensionFolderResolver._realDirectory(dir) : null;
  }

  _discoveredDir(extensionId) {
    const manifests = this._extensions && this._extensions.manifests;
    const manifest = manifests && manifests.get ? manifests.get(extensionId) : null;
    return manifest && typeof manifest._dir === 'string' ? manifest._dir : null;
  }

  _createdDir(extensionId) {
    for (const root of this._roots()) {
      const dir = path.join(root, extensionId);
      if (ContainedPath.isImmediateChild(root, dir) && ExtensionFolderResolver._hasManifest(dir)) return dir;
    }
    return null;
  }

  _roots() {
    const em = this._extensions || {};
    return [em.extensionsDir, em.userExtensionsDir].filter((dir) => typeof dir === 'string' && dir);
  }

  static _hasManifest(dir) {
    try {
      return fs.statSync(path.join(dir, 'manifest.js')).isFile();
    } catch (_) {
      return false;
    }
  }

  static _realDirectory(dir) {
    try {
      const real = fs.realpathSync(dir);
      return fs.statSync(real).isDirectory() ? real : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ExtensionFolderResolver;
