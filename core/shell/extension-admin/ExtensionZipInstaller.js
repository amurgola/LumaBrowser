const fs = require('fs');
const os = require('os');
const path = require('path');

class ExtensionZipInstaller {
  static MANIFEST = 'manifest.js';

  constructor({ extensionManager, rootDir, extractZip = null, tmpDir = os.tmpdir(), log = console }) {
    this._extensions = extensionManager;
    this._rootDir = rootDir;
    this._extractZip = extractZip || require('extract-zip');
    this._tmpDir = tmpDir;
    this._log = log;
  }

  async install(zipPath) {
    const tempDir = path.join(this._tmpDir, `luma-ext-${Date.now()}`);
    try {
      const found = await this._extract(zipPath, tempDir);
      if (found.error) return ExtensionZipInstaller._failClean(tempDir, found.error);
      const targetDir = this._moveIntoPlace(found.manifestDir, found.manifest.id);
      ExtensionZipInstaller._remove(tempDir);
      const activation = await this._activate(targetDir, found.manifest.id);
      return { success: true, extensionId: found.manifest.id, name: found.manifest.name, dir: targetDir, ...activation };
    } catch (error) {
      return ExtensionZipInstaller._failClean(tempDir, error.message);
    }
  }

  async _extract(zipPath, tempDir) {
    fs.mkdirSync(tempDir, { recursive: true });
    await this._extractZip(zipPath, { dir: tempDir });
    const manifestDir = ExtensionZipInstaller._manifestDir(tempDir);
    if (!manifestDir) return { error: 'No manifest.js found in archive' };
    const manifest = ExtensionZipInstaller._readManifest(manifestDir);
    if (!manifest.id || !manifest.name) return { error: 'Invalid manifest: missing id or name' };
    return { manifestDir, manifest };
  }

  _moveIntoPlace(manifestDir, id) {
    const installRoot = this._extensions.userExtensionsDir || path.join(this._rootDir, 'extensions');
    fs.mkdirSync(installRoot, { recursive: true });
    const targetDir = path.join(installRoot, id);
    if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
    ExtensionZipInstaller._move(manifestDir, targetDir);
    return targetDir;
  }

  async _activate(targetDir, id) {
    let activationError = null;
    try {
      const hot = await this._extensions.hotInstallExtension(targetDir);
      if (!(hot && hot.success)) activationError = (hot && hot.error) || 'activation failed';
    } catch (err) {
      activationError = err.message;
    }
    if (activationError) this._log.warn(`installExtensionFromZip: "${id}" installed but not activated: ${activationError}`);
    return { activated: !activationError, activationError };
  }

  static _manifestDir(tempDir) {
    const entries = fs.readdirSync(tempDir);
    if (entries.includes(ExtensionZipInstaller.MANIFEST)) return tempDir;
    const subDir = entries.find((e) => fs.statSync(path.join(tempDir, e)).isDirectory());
    if (subDir && fs.existsSync(path.join(tempDir, subDir, ExtensionZipInstaller.MANIFEST))) return path.join(tempDir, subDir);
    return null;
  }

  static _move(from, to) {
    try {
      fs.renameSync(from, to);
    } catch (err) {
      if (err.code !== 'EXDEV') throw err;
      fs.cpSync(from, to, { recursive: true });
    }
  }

  static _readManifest(manifestDir) {
    const file = require.resolve(path.join(manifestDir, ExtensionZipInstaller.MANIFEST));
    try {
      return require(file);
    } finally {
      delete require.cache[file];
    }
  }

  static _failClean(tempDir, error) {
    ExtensionZipInstaller._remove(tempDir);
    return { success: false, error };
  }

  static _remove(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = ExtensionZipInstaller;
