const fs = require('fs');
const path = require('path');
const ModelDownload = require('../../llm-server/models/ModelDownload');
const TarBz2Archive = require('../../tts-server/runtimes/TarBz2Archive');
const SttModelCatalog = require('../models/SttModelCatalog');

class SttModelInstaller {
  static BUSY_MESSAGE = 'A voice model download is already in progress.';

  constructor({
    whisperModelsDir,
    sherpaModelsDir,
    catalog = new SttModelCatalog(),
    startDownload = (options) => ModelDownload.start(options),
    extract = (archivePath, destDir) => TarBz2Archive.extract(archivePath, destDir),
  }) {
    this._whisperModelsDir = whisperModelsDir;
    this._sherpaModelsDir = sherpaModelsDir;
    this._catalog = catalog;
    this._startDownload = startDownload;
    this._extract = extract;
    this._busy = false;
    this._active = null;
  }

  async install(catalogId, onEvent) {
    const entry = this._entryOrThrow(catalogId);
    this._busy = true;
    try {
      if (entry.engine === 'sherpa') return await this._installArchive(entry, onEvent);
      return await this._installFile(entry, onEvent);
    } finally {
      this._busy = false;
      this._active = null;
    }
  }

  cancel() {
    if (!this._active) return false;
    this._active.cancel();
    return true;
  }

  _entryOrThrow(catalogId) {
    if (this._busy) throw new Error(SttModelInstaller.BUSY_MESSAGE);
    const entry = this._catalog.getById(catalogId);
    if (!entry) throw new Error(`Unknown STT model: ${catalogId}`);
    return entry;
  }

  async _installFile(entry, onEvent) {
    const dir = this._whisperModelsDir();
    await fs.promises.mkdir(dir, { recursive: true });
    return this._download(entry, path.join(dir, entry.file), onEvent);
  }

  async _installArchive(entry, onEvent) {
    const dir = this._sherpaModelsDir();
    await fs.promises.mkdir(dir, { recursive: true });
    const archivePath = path.join(dir, entry.archive);
    const destDir = path.join(dir, entry.id);
    const result = await this._download(entry, archivePath, onEvent);
    if (!result || !result.success) return result;
    await this._unpack(archivePath, destDir, onEvent);
    return { success: true, modelId: entry.id, destPath: destDir, dir: destDir };
  }

  _download(entry, destPath, onEvent) {
    this._active = this._startDownload({ url: this._catalog.downloadUrl(entry), destPath, onEvent });
    return this._active.promise;
  }

  async _unpack(archivePath, destDir, onEvent) {
    SttModelInstaller._emit(onEvent, 'extract', { phase: 'start' });
    await fs.promises.rm(destDir, { recursive: true, force: true });
    await fs.promises.mkdir(destDir, { recursive: true });
    await this._extract(archivePath, destDir);
    SttModelInstaller._emit(onEvent, 'extract', { phase: 'done' });
    try { await fs.promises.unlink(archivePath); } catch (_) {}
  }

  static _emit(onEvent, type, payload) {
    if (onEvent) onEvent(type, payload);
  }
}

module.exports = SttModelInstaller;
