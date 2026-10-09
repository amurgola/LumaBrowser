const fs = require('fs');
const path = require('path');
const BestEffort = require('./BestEffort');

const GB = 1024 * 1024 * 1024;

class PoolModels {
  static FALLBACK_BYTES = { imageGenerate: 8 * GB, imageEdit: 12 * GB, imageVideo: 16 * GB, music: 54 * GB };

  constructor({ servers, imageScanner, musicCatalog, statSize = PoolModels._statSize }) {
    this._servers = servers;
    this._imageScanner = imageScanner;
    this._musicCatalog = musicCatalog;
    this._statSize = statSize;
  }

  async sizes() {
    const out = { llm: 0, imageGenerate: 0, imageEdit: 0, imageVideo: 0, music: 0, grounding: 0, _estimated: false };
    this._sizeGrounding(out);
    this._sizeLlm(out);
    await this._sizeImages(out);
    this._sizeMusic(out);
    return out;
  }

  async files() {
    const files = [];
    this._llmFiles(files);
    await this._imageFiles(files);
    this._musicFiles(files);
    BestEffort.read(() => { if (this._servers.grounding) files.push(...this._servers.grounding.modelFiles()); });
    return files;
  }

  _sizeGrounding(out) {
    BestEffort.read(() => { if (this._servers.grounding) out.grounding = this._servers.grounding.modelFileBytes(); });
  }

  _sizeLlm(out) {
    const modelPath = this._llmModelPath();
    if (modelPath) out.llm = this._statSize(modelPath);
  }

  async _sizeImages(out) {
    try {
      const defaults = this._servers.image.getDefaults() || {};
      const byId = PoolModels._bytesById(await this._scanImageModels());
      out.imageGenerate = byId[defaults.modelId] || PoolModels.FALLBACK_BYTES.imageGenerate;
      out.imageEdit = defaults.editModelId ? (byId[defaults.editModelId] || PoolModels.FALLBACK_BYTES.imageEdit) : 0;
      out.imageVideo = defaults.videoModelId ? (byId[defaults.videoModelId] || PoolModels.FALLBACK_BYTES.imageVideo) : 0;
      if (PoolModels._anyUnsized(defaults, byId)) out._estimated = true;
    } catch (_) {
      out._estimated = true;
    }
  }

  _sizeMusic(out) {
    try {
      const modelId = this._selectedMusicModelId();
      if (!modelId) return;
      const row = this._musicCatalog.getById(modelId);
      out.music = Number(row && row.approxTotalBytes) || PoolModels.FALLBACK_BYTES.music;
      if (!row || !row.approxTotalBytes) out._estimated = true;
    } catch (_) {
      out._estimated = true;
    }
  }

  _llmFiles(files) {
    const modelPath = this._llmModelPath();
    if (modelPath) files.push(modelPath);
  }

  async _imageFiles(files) {
    try {
      const defaults = this._servers.image.getDefaults() || {};
      const wanted = new Set([defaults.modelId, defaults.editModelId, defaults.videoModelId].filter(Boolean));
      for (const model of await this._scanImageModels()) {
        if (wanted.has(model.id)) files.push(...PoolModels._filePaths(model));
      }
    } catch (_) {}
  }

  _musicFiles(files) {
    try {
      const modelId = this._selectedMusicModelId();
      const config = this._servers.music.getModelsDirConfig ? this._servers.music.getModelsDirConfig() : null;
      if (!modelId || !config || !config.effectivePath) return;
      const dir = path.join(config.effectivePath, modelId);
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile()) files.push(path.join(dir, entry.name));
      }
    } catch (_) {}
  }

  _llmModelPath() {
    return BestEffort.read(() => {
      const defaults = this._servers.llm.getDefaults();
      return defaults && defaults.modelPath ? defaults.modelPath : null;
    });
  }

  _selectedMusicModelId() {
    const music = this._servers.music;
    if (!music || !music.isEnabled()) return null;
    return (music.getDefaults() || {}).modelId || null;
  }

  async _scanImageModels() {
    const image = this._servers.image;
    const config = image.getModelsDirConfig ? image.getModelsDirConfig() : null;
    if (!config || !config.effectivePath) return [];
    const view = await this._imageScanner.scan(config.effectivePath);
    return view.models || [];
  }

  static _bytesById(models) {
    const byId = {};
    for (const model of models) {
      const files = model.files || {};
      byId[model.id] = Object.keys(files).reduce((sum, role) => sum + (Number(files[role] && files[role].bytes) || 0), 0)
        || (Number(model.minVramBytes) || 0);
    }
    return byId;
  }

  static _anyUnsized(defaults, byId) {
    return !byId[defaults.modelId]
      || (defaults.editModelId && !byId[defaults.editModelId])
      || (defaults.videoModelId && !byId[defaults.videoModelId]);
  }

  static _filePaths(model) {
    const files = model.files || {};
    return Object.keys(files).filter((role) => files[role] && files[role].path).map((role) => files[role].path);
  }

  static _statSize(filePath) {
    try { return fs.statSync(filePath).size; } catch (_) { return 0; }
  }
}

module.exports = PoolModels;
