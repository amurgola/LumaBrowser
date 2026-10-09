const fs = require('fs');
const os = require('os');
const path = require('path');

class AddonCatalog {
  constructor({ client, installer, extensionManager, tmpDir = os.tmpdir() }) {
    this._client = client;
    this._installer = installer;
    this._extensions = extensionManager;
    this._tmpDir = tmpDir;
  }

  async list() {
    const res = await this._client.listAddons();
    const extensions = (res.extensions || []).map((a) => ({ ...a, installed: this._isInstalled(a.id) }));
    return { ...res, extensions };
  }

  async downloadAndInstall(addonId) {
    const dl = await this._client.downloadAddon(addonId);
    if (!dl.ok) return { success: false, error: dl.error || 'Download failed' };
    const tempZip = path.join(this._tmpDir, `luma-addon-${String(addonId).replace(/[^a-z0-9_-]/gi, '')}-${Date.now()}.zip`);
    try {
      fs.writeFileSync(tempZip, dl.data);
      return await this._installer.install(tempZip);
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      try { fs.rmSync(tempZip, { force: true }); } catch (_) {}
    }
  }

  _isInstalled(id) {
    if (this._extensions.manifests && this._extensions.manifests.has(id)) return true;
    const userDir = this._extensions.userExtensionsDir;
    if (!userDir) return false;
    try { return fs.existsSync(path.join(userDir, id, 'manifest.js')); } catch (_) { return false; }
  }
}

module.exports = AddonCatalog;
