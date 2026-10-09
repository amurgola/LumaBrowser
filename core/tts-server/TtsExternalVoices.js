class TtsExternalVoices {
  constructor(registry) {
    this._registry = registry;
    this._handles = new Map();
  }

  describe(modelId) {
    const resolved = modelId ? this._registry.resolve(modelId) : null;
    if (!resolved) return null;
    return {
      id: modelId, external: true, engine: 'ext', engineId: resolved.engineId,
      voiceId: resolved.voiceId, name: resolved.voice.name || resolved.voiceId, dir: null,
    };
  }

  catalogRows() {
    return this._registry.listVoiceEntries();
  }

  static modelRow(entry) {
    return { id: entry.id, name: entry.name, dir: null, engine: 'ext', external: true, sizeBytes: 0 };
  }

  async prewarm(model) {
    const engine = this._registry.get(model.engineId);
    if (engine && typeof engine.prewarm === 'function') await engine.prewarm(model.voiceId);
    return { modelId: model.id, engine: 'ext', engineId: model.engineId, external: true };
  }

  async synthesize(id, modelId, { text, speed }, onChunk) {
    const resolved = this._resolveOrThrow(modelId);
    const handle = resolved.engine.synthesize({ voiceId: resolved.voiceId, text, speed }, onChunk);
    this._handles.set(id, { engine: resolved.engine, id: handle.id });
    try {
      const result = await handle.done;
      return { canceled: !!(result && result.canceled) };
    } finally {
      this._handles.delete(id);
    }
  }

  cancel(id) {
    const handle = this._handles.get(id);
    if (!handle) return false;
    this._handles.delete(id);
    try { handle.engine.cancel(handle.id); } catch (_) {}
    return true;
  }

  async stopAll() {
    for (const engine of this._registry.list()) {
      if (typeof engine.stop !== 'function') continue;
      try { await engine.stop(); } catch (_) {}
    }
  }

  _resolveOrThrow(modelId) {
    const resolved = this._registry.resolve(modelId);
    if (resolved) return resolved;
    const err = new Error('The selected voice is no longer available.');
    err.code = 'NO_TTS_MODEL';
    throw err;
  }
}

module.exports = TtsExternalVoices;
