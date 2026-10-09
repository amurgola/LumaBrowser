const fs = require('fs');
const path = require('path');

class ExtensionExporter {
  static ZLIB_LEVEL = 9;

  constructor({ archiver = null } = {}) {
    this._archiver = archiver || require('archiver');
  }

  async export(extensionId, extDir, chooseSavePath) {
    try {
      const manifest = ExtensionExporter._exportableManifest(extDir);
      if (manifest.error) return { success: false, error: manifest.error };
      const filePath = await chooseSavePath(manifest);
      if (!filePath) return { canceled: true };
      await this._zip(extDir, extensionId, filePath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _zip(extDir, extensionId, filePath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(filePath);
      const archive = this._archiver('zip', { zlib: { level: ExtensionExporter.ZLIB_LEVEL } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(extDir, extensionId);
      archive.finalize();
    });
  }

  static _exportableManifest(extDir) {
    const manifestPath = path.join(extDir, 'manifest.js');
    if (!fs.existsSync(manifestPath)) return { error: 'Extension manifest not found' };
    const manifest = require(manifestPath);
    if (manifest.private) return { error: 'Cannot export a private extension' };
    return manifest;
  }
}

module.exports = ExtensionExporter;
