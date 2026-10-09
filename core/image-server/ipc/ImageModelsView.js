const ImageModelsScanner = require('../ImageModelsScanner');
const ImageModelCatalog = require('../models/ImageModelCatalog');
const ImageModelManifest = require('./ImageModelManifest');
const ModelDescriptor = require('../../shared/ModelDescriptor');

class ImageModelsView {
  static KINDS = ['edit', 'generate', 'video'];

  constructor({ imageServerService, scanner = new ImageModelsScanner(), catalog = new ImageModelCatalog() }) {
    this._svc = imageServerService;
    this._scanner = scanner;
    this._catalog = catalog;
  }

  async view() {
    return this._viewOf(this._svc.getModelsDirConfig());
  }

  async setModelsDir(dir) {
    return this._viewOf(this._svc.setModelsDir(dir || null));
  }

  async setKind(modelId, kind) {
    ImageModelsView._assertKindRequest(modelId, kind);
    const config = this._svc.getModelsDirConfig();
    const model = await this._findModel(config.effectivePath, modelId);
    const manifest = ImageModelManifest.readOrEmpty(model.dir);
    manifest.kind = kind;
    if (!manifest.id) manifest.id = model.id;
    ImageModelManifest.write(model.dir, manifest);
    return this._viewOf(config);
  }

  catalogView() {
    const models = this._catalog.list();
    return { models, descriptors: models.map((m) => ModelDescriptor.toImageCatalogDescriptor(m)) };
  }

  async _viewOf(config) {
    const scan = await this._scanner.scan(config.effectivePath);
    for (const model of (scan.models || [])) model.displayName = this._svc.resolveModelDisplayName(model.id);
    return { config, scan, descriptors: ImageModelsView.descriptors(scan) };
  }

  async _findModel(modelsDir, modelId) {
    const scan = await this._scanner.scan(modelsDir);
    const model = (scan.models || []).find((m) => m.id === modelId);
    if (!model || !model.dir) throw new Error(`Model "${modelId}" not found.`);
    return model;
  }

  static descriptors(scan) {
    return (scan && Array.isArray(scan.models)) ? scan.models.map((m) => ModelDescriptor.toImageInstalledDescriptor(m)) : [];
  }

  static _assertKindRequest(modelId, kind) {
    if (!modelId) throw new Error('modelId is required.');
    if (!ImageModelsView.KINDS.includes(kind)) throw new Error('kind must be "edit", "generate", or "video".');
  }
}

module.exports = ImageModelsView;
