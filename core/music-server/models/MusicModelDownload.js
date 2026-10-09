const fs = require('fs');
const path = require('path');
const HfMlxRepo = require('../../llm-server/models/HfMlxRepo');
const MlxRepoDownload = require('../../llm-server/models/MlxRepoDownload');
const MusicModelCatalog = require('./MusicModelCatalog');

class MusicModelDownload {
  static MARKER = 'luma-model.json';

  static start({ modelId, modelsDir, onEvent, catalog = new MusicModelCatalog() }) {
    const row = catalog.getById(modelId);
    if (!row) throw new Error(`Unknown music model: ${modelId}`);
    const download = new MusicModelDownload(row, path.join(modelsDir, row.id), onEvent);
    return { promise: download.run(), cancel: () => download.cancel() };
  }

  static async isInstalled(modelsDir, modelId) {
    try {
      await fs.promises.access(MusicModelDownload._markerPath(modelsDir, modelId));
      return true;
    } catch (_) {
      return false;
    }
  }

  static async readMarker(modelsDir, modelId) {
    try {
      return JSON.parse(await fs.promises.readFile(MusicModelDownload._markerPath(modelsDir, modelId), 'utf8'));
    } catch (_) {
      return null;
    }
  }

  constructor(row, destDir, onEvent) {
    this._row = row;
    this._destDir = destDir;
    this._onEvent = onEvent;
    this._inner = null;
    this._canceled = false;
  }

  async run() {
    const info = await HfMlxRepo.fetchInfo(this._row.hfRepo);
    if (this._canceled) return { success: false, canceled: true };
    this._inner = MlxRepoDownload.start({ repoId: this._row.hfRepo, files: info.files, destDir: this._destDir, onEvent: this._onEvent });
    const result = await this._inner.promise;
    if (result && result.success) await this._writeMarker(result, info);
    return result;
  }

  cancel() {
    this._canceled = true;
    if (this._inner) this._inner.cancel();
  }

  async _writeMarker(result, info) {
    const marker = {
      id: this._row.id,
      hfRepo: this._row.hfRepo,
      bytes: result.bytes,
      files: info.files.length,
      completedAt: new Date().toISOString(),
    };
    await fs.promises.writeFile(path.join(this._destDir, MusicModelDownload.MARKER), JSON.stringify(marker, null, 2), 'utf8');
  }

  static _markerPath(modelsDir, modelId) {
    return path.join(modelsDir, modelId, MusicModelDownload.MARKER);
  }
}

module.exports = MusicModelDownload;
