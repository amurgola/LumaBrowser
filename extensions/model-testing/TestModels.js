const path = require('path');
const CoreRequire = require('./CoreRequire');

const LlmModelsScanner = CoreRequire.load('llm-server/LlmModelsScanner');

class TestModels {
  constructor({ llmServerService, scanner = LlmModelsScanner.shared }) {
    this._svc = llmServerService;
    this._scanner = scanner;
  }

  async list() {
    const installed = await this._svc.listInstalledChatModels();
    const pathByStem = await this._pathByStem();
    return installed
      .filter((model) => pathByStem.has(model.stem))
      .map((model) => ({ path: pathByStem.get(model.stem), stem: model.stem, label: model.display || model.stem, current: !!model.current }));
  }

  async _pathByStem() {
    const scan = await this._scanner.scan(this._svc.getModelsDirConfig().effectivePath);
    const pathByStem = new Map();
    for (const model of scan.models || []) {
      const weightsPath = model.weights && model.weights[0] && model.weights[0].path;
      if (!weightsPath) continue;
      const stem = path.basename(weightsPath, path.extname(weightsPath));
      if (!pathByStem.has(stem)) pathByStem.set(stem, weightsPath);
    }
    return pathByStem;
  }
}

module.exports = TestModels;
