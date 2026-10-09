const LlmModelsScanner = require('../LlmModelsScanner');
const ModelName = require('../models/ModelName');
const ModelDescriptor = require('../../shared/ModelDescriptor');
const ModelsDirStorage = require('./ModelsDirStorage');

class LlmModelsView {
  constructor({ llmServerService, scanner = LlmModelsScanner.shared, freeSpace = ModelsDirStorage.freeSpace }) {
    this._svc = llmServerService;
    this._scanner = scanner;
    this._freeSpace = freeSpace;
  }

  async view() {
    return this._viewOf(this._svc.getModelsDirConfig());
  }

  async setModelsDir(dir) {
    return this._viewOf(this._svc.setModelsDir(dir || null));
  }

  async scan(dir) {
    return this.decorate(await this._scanner.scan(dir));
  }

  decorate(scan) {
    if (!scan || !Array.isArray(scan.models)) return scan;
    for (const model of scan.models) {
      model.nameKey = LlmModelsView.nameKeyOf(model);
      model.displayName = this._svc.resolveModelDisplayName(model.nameKey);
    }
    return scan;
  }

  async storageInfo() {
    const config = this._svc.getModelsDirConfig();
    return { config, ...(await this._freeSpace(config.effectivePath)) };
  }

  async _viewOf(config) {
    const scan = await this.scan(config.effectivePath);
    return { config, scan, descriptors: LlmModelsView.descriptors(scan) };
  }

  static nameKeyOf(model) {
    const weightsPath = model && model.weights && model.weights[0] && model.weights[0].path;
    return weightsPath ? ModelName.key(weightsPath) : ((model && model.name) || '');
  }

  static descriptors(scan) {
    return (scan && Array.isArray(scan.models)) ? scan.models.map((m) => ModelDescriptor.toLlmDescriptor(m)) : [];
  }
}

module.exports = LlmModelsView;
