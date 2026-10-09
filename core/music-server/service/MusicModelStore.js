const fs = require('fs');
const path = require('path');
const MusicModelCatalog = require('../models/MusicModelCatalog');
const MusicModelDownload = require('../models/MusicModelDownload');

class MusicModelStore {
  static BUSY_MESSAGE = 'A model download is already running.';

  constructor({ modelsDir, catalog = new MusicModelCatalog(), startDownload = (options) => MusicModelDownload.start(options) }) {
    this._modelsDir = modelsDir;
    this._catalog = catalog;
    this._startDownload = startDownload;
    this._active = null;
  }

  async view() {
    const modelsDir = this._modelsDir();
    const models = [];
    for (const row of this._catalog.list()) models.push(await this._rowView(modelsDir, row));
    return { modelsDir, models };
  }

  isInstalled(modelId) {
    return MusicModelDownload.isInstalled(this._modelsDir(), modelId);
  }

  modelPath(modelId) {
    return path.join(this._modelsDir(), modelId);
  }

  download(modelId, { onEvent } = {}) {
    if (this._active) throw new Error(MusicModelStore.BUSY_MESSAGE);
    const handle = this._startDownload({ modelId, modelsDir: this._modelsDir(), onEvent, catalog: this._catalog });
    this._active = { modelId, cancel: handle.cancel };
    return handle.promise.finally(() => { this._active = null; });
  }

  cancelDownload() {
    if (this._active) {
      try { this._active.cancel(); } catch (_) {}
    }
    return { success: true };
  }

  async delete(modelId) {
    if (!this._catalog.getById(modelId)) throw new Error(`Unknown music model: ${modelId}`);
    await fs.promises.rm(this.modelPath(modelId), { recursive: true, force: true });
    return { success: true };
  }

  async _rowView(modelsDir, row) {
    const installed = await MusicModelDownload.isInstalled(modelsDir, row.id);
    const marker = installed ? await MusicModelDownload.readMarker(modelsDir, row.id) : null;
    return {
      ...row,
      installed,
      sizeBytes: (marker && marker.bytes) || row.approxTotalBytes,
      downloading: !!(this._active && this._active.modelId === row.id),
      dirPath: path.join(modelsDir, row.id),
    };
  }
}

module.exports = MusicModelStore;
