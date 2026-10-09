const LlmModelsScanner = require('../LlmModelsScanner');

class LlmPinTarget {
  static FILE_GROUPS = Object.freeze(['weights', 'mmproj', 'drafter', 'mtp']);

  constructor({ scanner = LlmModelsScanner.shared } = {}) {
    this._scanner = scanner;
  }

  async resolve(llmServerService) {
    const modelPath = llmServerService.getDefaults().modelPath;
    if (!modelPath) return { error: 'No default model is selected.' };
    const found = await this._findModel(llmServerService, modelPath);
    if (found.error) return found;
    const { model } = found;
    if (model.kind !== 'weights') return { error: `${model.name} is not a GGUF model, so it cannot be pinned.` };
    const files = LlmPinTarget._files(model);
    if (!files.length) return { error: 'The default model has no weight files on disk.' };
    return LlmPinTarget._target(modelPath, model, files);
  }

  async _findModel(llmServerService, modelPath) {
    let model = null;
    try {
      const view = await this._scanner.scan(llmServerService.getModelsDirConfig().effectivePath);
      model = ((view && view.models) || []).find((m) => m.weights && m.weights[0] && m.weights[0].path === modelPath) || null;
    } catch (err) {
      return { error: `Model scan failed: ${(err && err.message) || err}` };
    }
    return model ? { model } : { error: 'The default model path no longer matches a scanned model.' };
  }

  static _files(model) {
    return LlmPinTarget.FILE_GROUPS
      .flatMap((group) => model[group] || [])
      .filter((f) => f && f.path)
      .map((f) => ({ path: f.path, sizeBytes: f.sizeBytes || 0 }));
  }

  static _target(modelPath, model, files) {
    return {
      key: modelPath,
      modelName: model.displayName || model.name,
      totalBytes: model.totalBytes || files.reduce((sum, f) => sum + f.sizeBytes, 0),
      files,
    };
  }
}

module.exports = LlmPinTarget;
