const ExistingLibraryScanner = require('../models/libraries/ExistingLibraryScanner');
const ExistingModelImporter = require('../models/libraries/ExistingModelImporter');

class ExistingLlmModels {
  constructor({ llmServerService, modelsView, scanner = ExistingLibraryScanner, importer = ExistingModelImporter }) {
    this._svc = llmServerService;
    this._modelsView = modelsView;
    this._scanner = scanner;
    this._importer = importer;
  }

  scan() {
    return { ...this._scanner.scan({ modelsDir: this._modelsDir() }) };
  }

  async adopt(args) {
    const { sourcePath, fileName } = args || {};
    const modelsDir = this._modelsDir();
    const result = this._importer.importModel({ sourcePath, fileName, modelsDir });
    if (!result.success) return result;
    return { ...result, scan: await this._modelsView.scan(modelsDir) };
  }

  _modelsDir() {
    return this._svc.getModelsDirConfig().effectivePath;
  }
}

module.exports = ExistingLlmModels;
