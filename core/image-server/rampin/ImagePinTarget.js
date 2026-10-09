const ImageModelsScanner = require('../ImageModelsScanner');

class ImagePinTarget {
  constructor({ scanner = new ImageModelsScanner() } = {}) {
    this._scanner = scanner;
  }

  async resolve(imageServerService) {
    const ids = ImagePinTarget._defaultIds(imageServerService.getDefaults());
    if (!ids.length) return { error: 'No default image model is selected.' };
    const scan = await this._scan(imageServerService);
    if (scan.error) return scan;
    const models = ImagePinTarget._findModels(scan.models, ids);
    if (models.error) return models;
    const files = ImagePinTarget._dedupedFiles(models);
    if (!files.length) return { error: 'The default image model has no files on disk.' };
    return ImagePinTarget._target(ids, models, files);
  }

  static _defaultIds(defaults) {
    return [...new Set([defaults.modelId, defaults.editModelId].filter(Boolean))];
  }

  async _scan(imageServerService) {
    try {
      const view = await this._scanner.scan(imageServerService.getModelsDirConfig().effectivePath);
      return { models: (view && view.models) || [] };
    } catch (err) {
      return { error: `Image model scan failed: ${(err && err.message) || err}` };
    }
  }

  static _findModels(scanned, ids) {
    const models = [];
    for (const id of ids) {
      const model = scanned.find((m) => m.id === id);
      if (!model) return { error: `Default image model "${id}" no longer matches a scanned model.` };
      models.push(model);
    }
    return models;
  }

  static _dedupedFiles(models) {
    const seen = new Set();
    const files = [];
    for (const model of models) {
      for (const f of Object.values(model.files || {})) {
        if (!f || !f.path || seen.has(f.path)) continue;
        seen.add(f.path);
        files.push({ path: f.path, sizeBytes: f.bytes || 0 });
      }
    }
    return files;
  }

  static _target(ids, models, files) {
    return {
      key: ids.slice().sort().join('+'),
      modelName: models.map((m) => m.label || m.name || m.id).join(' + '),
      totalBytes: files.reduce((sum, f) => sum + f.sizeBytes, 0),
      files,
    };
  }
}

module.exports = ImagePinTarget;
