const LlmModelsScanner = require('../LlmModelsScanner');
const DrafterCatalog = require('../models/DrafterCatalog');
const ModelGrouping = require('../models/ModelGrouping');
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
      model.drafterOffer = DrafterCatalog.offerFor(model);
    }
    ModelGrouping.attach(scan.models, LlmModelsView._overrides(this._svc));
    return scan;
  }

  static _overrides(svc) {
    try { return (svc && typeof svc.getModelDisplayNames === 'function' && svc.getModelDisplayNames()) || {}; } catch (_) { return {}; }
  }

  async setDrafter(args) {
    const { key, choice } = args || {};
    const config = this._svc.getModelsDirConfig();
    const scan = await this._scanner.scan(config.effectivePath);
    const models = (scan && scan.models) || [];
    const model = models.find((m) => m.kind === 'weights' && m.role === 'main' && LlmModelsView.nameKeyOf(m) === key);
    if (!key || !model) return { success: false, error: 'That model is not in the models folder.' };
    const clean = LlmModelsView._drafterChoice(choice);
    if (clean === undefined) return { success: false, error: 'Unknown drafter choice.' };
    if (clean && clean.mode === 'mtp' && !model.mtpCapable) return { success: false, error: 'This model has no MTP head.' };
    if (clean && clean.mode === 'file' && !((scan.drafters || []).some((d) => d.path === clean.path))) {
      return { success: false, error: 'That drafter file is not in the models folder.' };
    }
    this._svc.setModelDrafterChoice(key, clean);
    return { success: true, ...(await this._viewOf(config)) };
  }

  static _drafterChoice(choice) {
    if (choice == null || choice === 'auto') return null;
    if (choice === 'off') return { mode: 'off' };
    if (choice === 'mtp') return { mode: 'mtp' };
    if (typeof choice === 'object' && typeof choice.path === 'string' && choice.path) return { mode: 'file', path: choice.path };
    return undefined;
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
