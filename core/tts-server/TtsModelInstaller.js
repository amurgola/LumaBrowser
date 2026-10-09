const fs = require('fs');
const path = require('path');
const ModelDownload = require('../llm-server/models/ModelDownload');
const TarBz2Archive = require('./runtimes/TarBz2Archive');
const TarballDownloader = require('./runtimes/TarballDownloader');

class TtsModelInstaller {
  constructor({ catalog, modelsDir }) {
    this._catalog = catalog;
    this._modelsDir = modelsDir;
    this._busy = false;
    this._active = null;
  }

  async install(catalogId, onEvent) {
    const entry = this._entryOrThrow(catalogId);
    this._busy = true;
    try {
      return await this._downloadAndExtract(entry, onEvent);
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

  async _downloadAndExtract(entry, onEvent) {
    const dir = this._modelsDir();
    await fs.promises.mkdir(dir, { recursive: true });
    const archivePath = path.join(dir, entry.archive);
    const destDir = path.join(dir, entry.id);
    this._active = ModelDownload.start({ url: this._catalog.downloadUrl(entry), destPath: archivePath, onEvent });
    const result = await this._active.promise;
    if (!result || !result.success) return result;
    await TtsModelInstaller._extract(archivePath, destDir, onEvent);
    if (entry.voices && entry.voices.length) await this._fetchVoiceClips(entry, destDir, onEvent);
    return { success: true, modelId: entry.id, dir: destDir };
  }

  _entryOrThrow(catalogId) {
    if (this._busy) throw new Error('A voice download is already in progress.');
    const entry = this._catalog.getById(catalogId);
    if (!entry) throw new Error(`Unknown TTS model: ${catalogId}`);
    return entry;
  }

  static async _extract(archivePath, destDir, onEvent) {
    TtsModelInstaller._emit(onEvent, 'extract', { phase: 'start' });
    await fs.promises.rm(destDir, { recursive: true, force: true });
    await fs.promises.mkdir(destDir, { recursive: true });
    await TarBz2Archive.extract(archivePath, destDir);
    TtsModelInstaller._emit(onEvent, 'extract', { phase: 'done' });
    try { await fs.promises.unlink(archivePath); } catch (_) {}
  }

  async _fetchVoiceClips(entry, destDir, onEvent) {
    const voicesDir = path.join(destDir, 'voices');
    await fs.promises.mkdir(voicesDir, { recursive: true });
    for (const voice of entry.voices) {
      const dest = path.join(voicesDir, voice.file);
      if (fs.existsSync(dest)) continue;
      await this._fetchVoiceClip(voice, dest, onEvent);
    }
  }

  async _fetchVoiceClip(voice, dest, onEvent) {
    try {
      await TarballDownloader.download(this._catalog.pocketVoiceUrl(voice), dest, (received, total) => {
        TtsModelInstaller._emit(onEvent, 'download', { pkg: `voice ${voice.name}`, received, total });
      });
    } catch (err) {
      console.warn(`[tts] voice clip ${voice.file} failed: ${err.message}`);
    }
  }

  static _emit(onEvent, type, payload) {
    if (onEvent) onEvent(type, payload);
  }
}

module.exports = TtsModelInstaller;
