const fs = require('fs');
const path = require('path');
const ContainedPath = require('../../shared/fs/ContainedPath');
const RendererBroadcast = require('./RendererBroadcast');
const RequireCacheBuster = require('./RequireCacheBuster');

class ExtensionRemover {
  constructor({ ledger, disabled, userExtensionsDir, disable, fsOps = fs }) {
    this._ledger = ledger;
    this._disabled = disabled;
    this._root = userExtensionsDir ? path.resolve(userExtensionsDir) : null;
    this._disable = disable;
    this._fs = fsOps;
  }

  async remove(id) {
    const manifest = this._ledger.manifests.get(id);
    const refusal = this._refusal(id, manifest);
    if (refusal) return { success: false, error: refusal };
    const target = path.resolve(manifest._dir);
    await this._tearDown(id);
    this._forget(id, target);
    const removeError = this._removeFiles(target);
    if (removeError) return { success: false, error: removeError };
    RendererBroadcast.send(RendererBroadcast.DELETED, { id });
    console.log(`ExtensionManager: deleted "${id}" from ${target}`);
    return { success: true, id };
  }

  _refusal(id, manifest) {
    if (!manifest) return `Extension "${id}" not found`;
    if (!manifest._userInstalled) return `"${id}" is a built-in extension and cannot be deleted - you can disable it instead.`;
    const dependent = this._ledger.activeDependentOf(id);
    if (dependent) return `Cannot delete "${id}" - required by "${dependent.name}". Remove it first.`;
    return this._containmentRefusal(id, manifest);
  }

  _containmentRefusal(id, manifest) {
    const target = manifest._dir ? path.resolve(manifest._dir) : null;
    if (ContainedPath.isWithin(this._root, target)) return null;
    return `Refusing to delete "${id}" - its files are not inside the user extensions directory.`;
  }

  async _tearDown(id) {
    if (this._ledger.isActive(id)) await this._disable(id);
  }

  _forget(id, target) {
    this._ledger.manifests.delete(id);
    this._disabled.remove(id);
    this._ledger.removeFromLoadOrder(id);
    RequireCacheBuster.bust(target);
  }

  _removeFiles(target) {
    try {
      this._fs.rmSync(target, { recursive: true, force: true });
      return null;
    } catch (err) {
      return `Failed to remove files: ${err.message}`;
    }
  }
}

module.exports = ExtensionRemover;
