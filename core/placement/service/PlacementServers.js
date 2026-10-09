const BestEffort = require('./BestEffort');

class PlacementServers {
  constructor({ llmServerService, imageServerService, musicServerService, groundingServerService } = {}) {
    this.llm = llmServerService || null;
    this.image = imageServerService || null;
    this.music = musicServerService || null;
    this.grounding = groundingServerService || null;
  }

  runtimeServer(itemKey) {
    return BestEffort.read(() => this._runtimeServerOf(itemKey)) || null;
  }

  status(itemKey) {
    return BestEffort.read(() => this.runtimeServer(itemKey).getStatus());
  }

  pid(itemKey) {
    return BestEffort.read(() => this.status(itemKey).pid);
  }

  modelKey(itemKey) {
    return BestEffort.read(() => this._modelKeyOf(itemKey));
  }

  llmModelLabel() {
    return BestEffort.read(() => {
      const defaults = this.llm.getDefaults();
      if (!defaults || !defaults.modelPath) return null;
      const base = String(defaults.modelPath).replace(/\\/g, '/').split('/').pop() || '';
      return base.replace(/\.(gguf|bin|safetensors)$/i, '') || base;
    });
  }

  imageDefaults() {
    return BestEffort.read(() => this.image.getDefaults()) || {};
  }

  musicDefaults() {
    return BestEffort.read(() => this.music.getDefaults()) || {};
  }

  musicEnabled() {
    return !!BestEffort.read(() => this.music && this.music.isEnabled());
  }

  isAvailable() {
    return !!BestEffort.read(() => {
      const llm = this.llm && this.llm.getDefaults ? this.llm.getDefaults() : null;
      const image = this.image && this.image.getDefaults ? this.image.getDefaults() : null;
      const llmReady = !!(llm && llm.runtimeId && llm.modelPath);
      const imageReady = !!(image && image.runtimeId && image.modelId);
      return llmReady && imageReady;
    });
  }

  applyAutoStop(ms) {
    for (const service of [this.llm, this.image, this.music]) {
      BestEffort.read(() => { if (service && service.setAutoUnloadMs) service.setAutoUnloadMs(ms); });
    }
  }

  _runtimeServerOf(itemKey) {
    switch (itemKey) {
      case 'llm': return this.llm.runtimeServer;
      case 'imageGenerate': return this.image.runtimeServer;
      case 'imageEdit': return this.image.editRuntimeServer;
      case 'imageVideo': return this.image.videoRuntimeServer;
      case 'music': return this.music.server;
      case 'grounding': return this.grounding.runtimeServer;
      default: return null;
    }
  }

  _modelKeyOf(itemKey) {
    if (itemKey === 'llm') return PlacementServers._stringOrNull(this.llm.getDefaults(), 'modelPath');
    if (itemKey === 'music') return this.music ? PlacementServers._stringOrNull(this.music.getDefaults(), 'modelId') : null;
    if (itemKey === 'grounding') {
      return this.grounding && this.grounding.isConfigured() ? String(this.grounding.getModelPath()) : null;
    }
    const defaults = this.image.getDefaults() || {};
    if (itemKey === 'imageGenerate') return PlacementServers._stringOrNull(defaults, 'modelId');
    if (itemKey === 'imageEdit') return PlacementServers._stringOrNull(defaults, 'editModelId');
    if (itemKey === 'imageVideo') return PlacementServers._stringOrNull(defaults, 'videoModelId');
    return null;
  }

  static _stringOrNull(obj, field) {
    return obj && obj[field] ? String(obj[field]) : null;
  }
}

module.exports = PlacementServers;
