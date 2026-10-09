const fs = require('fs');
const path = require('path');
const ImageModelCatalog = require('./models/ImageModelCatalog');
const ImageModelFiles = require('./ImageModelFiles');
const ImageModelRecord = require('./ImageModelRecord');

class ImageModelsScanner {
  static SKIPPED_DIRS = new Set(['loras']);

  constructor({ catalog = new ImageModelCatalog() } = {}) {
    this._catalog = catalog;
  }

  async scan(modelsDir) {
    if (!modelsDir) return { modelsDir: null, models: [] };
    if (!(await ImageModelsScanner._exists(modelsDir))) return { modelsDir, models: [], missing: true };
    let entries;
    try {
      entries = await fs.promises.readdir(modelsDir, { withFileTypes: true });
    } catch (err) {
      return { modelsDir, models: [], error: err.message };
    }
    return { modelsDir, models: await this._readModels(modelsDir, entries) };
  }

  async readModelDir(dir, name, catalogList = this._catalog.list()) {
    const manifest = await ImageModelsScanner._readJson(path.join(dir, 'manifest.json'));
    const files = await this._resolveFiles(dir, manifest);
    if (!files.diffusion || !files.diffusion.path) return null;
    const id = (manifest && manifest.id) || name;
    const catalogEntry = this._catalog.getById(id);
    return ImageModelRecord.build({ id, dir, manifest, files, catalogEntry, catalogList });
  }

  async _readModels(modelsDir, entries) {
    const catalogList = this._catalog.list();
    const models = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || ImageModelsScanner.SKIPPED_DIRS.has(entry.name.toLowerCase())) continue;
      const record = await this.readModelDir(path.join(modelsDir, entry.name), entry.name, catalogList);
      if (record) models.push(record);
    }
    return models;
  }

  async _resolveFiles(dir, manifest) {
    if (manifest && manifest.files) return ImageModelFiles.fromManifest(dir, manifest.files);
    return ImageModelFiles.infer(dir);
  }

  static async _readJson(filePath) {
    try {
      return JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
    } catch (_) {
      return null;
    }
  }

  static async _exists(filePath) {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = ImageModelsScanner;
