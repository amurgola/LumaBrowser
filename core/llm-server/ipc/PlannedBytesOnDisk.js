const fs = require('fs');
const path = require('path');
const ImageModelsScanner = require('../../image-server/ImageModelsScanner');

class PlannedBytesOnDisk {
  constructor({ llmServerService, imageServerService = () => null, imageScanner = null }) {
    this._svc = llmServerService;
    this._imageService = imageServerService;
    this._imageScanner = imageScanner;
  }

  async measure(plan) {
    const llmBytes = this._llmBytes(plan);
    const imageBytes = await this._imageBytes(plan);
    return { llmBytes, imageBytes, totalBytes: llmBytes + imageBytes };
  }

  _llmBytes(plan) {
    if (!plan.llm || !plan.llm.file) return 0;
    const full = path.join(this._svc.getModelsDirConfig().effectivePath, plan.llm.file);
    const bytes = PlannedBytesOnDisk._sizeOf(full) || PlannedBytesOnDisk._sizeOf(full + '.partial');
    return Math.min(bytes, Number(plan.llm.approxBytes) || bytes);
  }

  async _imageBytes(plan) {
    const service = this._imageService();
    if (!plan.image || !plan.image.modelId || !service || typeof service.getModelsDirConfig !== 'function') return 0;
    const bytes = await this._installedImageBytes(service, plan.image.modelId);
    return Math.min(bytes, Number(plan.image.approxTotalBytes) || bytes);
  }

  async _installedImageBytes(service, modelId) {
    try {
      const scan = await this._scanner().scan(service.getModelsDirConfig().effectivePath);
      const model = ((scan && scan.models) || []).find((m) => m && m.id === modelId);
      if (!model || !model.files) return 0;
      return Object.values(model.files).reduce((sum, file) => sum + (Number(file && file.bytes) || 0), 0);
    } catch (_) {
      return 0;
    }
  }

  _scanner() {
    if (!this._imageScanner) this._imageScanner = new ImageModelsScanner();
    return this._imageScanner;
  }

  static _sizeOf(p) {
    try {
      return fs.statSync(p).size;
    } catch (_) {
      return 0;
    }
  }
}

module.exports = PlannedBytesOnDisk;
