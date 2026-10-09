class TtsEngineRegistry {
  static EXT_PREFIX = 'ext:';
  static REQUIRED_METHODS = ['listVoices', 'synthesize', 'cancel'];

  static DEFAULT_QUALITY = 'clone';

  constructor() {
    this._engines = new Map();
  }

  register(engine, extensionId = null) {
    const id = TtsEngineRegistry._validEngineId(engine);
    TtsEngineRegistry._assertContract(engine);
    this._engines.set(id, { engine, extensionId: extensionId || null });
    return engine;
  }

  unregister(engineId) {
    return this._engines.delete(String(engineId));
  }

  unregisterByExtension(extensionId) {
    let removed = 0;
    for (const [id, record] of this._engines) {
      if (record.extensionId !== extensionId) continue;
      this._engines.delete(id);
      removed++;
    }
    return removed;
  }

  list() {
    return Array.from(this._engines.values()).map((record) => record.engine);
  }

  get(engineId) {
    const record = this._engines.get(String(engineId));
    return record ? record.engine : null;
  }

  resolve(modelId) {
    const parsed = TtsEngineRegistry.parseId(modelId);
    if (!parsed) return null;
    const engine = this.get(parsed.engineId);
    if (!engine) return null;
    const voice = TtsEngineRegistry._voicesOf(engine).find((v) => v && String(v.id) === parsed.voiceId);
    if (!voice) return null;
    return { engine, engineId: parsed.engineId, voiceId: parsed.voiceId, voice };
  }

  listVoiceEntries() {
    const rows = [];
    for (const engine of this.list()) {
      for (const voice of TtsEngineRegistry._voicesOf(engine)) {
        if (voice && voice.id != null) rows.push(TtsEngineRegistry._pickerRow(engine, voice));
      }
    }
    return rows;
  }

  static parseId(modelId) {
    const text = String(modelId || '');
    if (!text.startsWith(TtsEngineRegistry.EXT_PREFIX)) return null;
    const rest = text.slice(TtsEngineRegistry.EXT_PREFIX.length);
    const split = rest.indexOf(':');
    if (split <= 0) return null;
    return { engineId: rest.slice(0, split), voiceId: rest.slice(split + 1) };
  }

  static makeId(engineId, voiceId) {
    return `${TtsEngineRegistry.EXT_PREFIX}${engineId}:${voiceId}`;
  }

  static _validEngineId(engine) {
    if (!engine || typeof engine !== 'object') throw new Error('registerTtsEngine: engine object is required');
    const id = engine.id && String(engine.id).trim();
    if (!id) throw new Error('registerTtsEngine: engine.id is required');
    if (id.includes(':')) throw new Error('registerTtsEngine: engine.id must not contain ":"');
    return id;
  }

  static _assertContract(engine) {
    for (const method of TtsEngineRegistry.REQUIRED_METHODS) {
      if (typeof engine[method] !== 'function') throw new Error(`registerTtsEngine: engine.${method}() is required`);
    }
  }

  static _voicesOf(engine) {
    try {
      return engine.listVoices() || [];
    } catch (_) {
      return [];
    }
  }

  static _pickerRow(engine, voice) {
    return {
      id: TtsEngineRegistry.makeId(engine.id, voice.id),
      name: voice.name || String(voice.id),
      description: voice.description || '',
      quality: voice.quality || TtsEngineRegistry.DEFAULT_QUALITY,
      sizeBytes: 0,
      external: true,
      engineId: engine.id,
      engineName: engine.name || engine.id,
      language: voice.language || null,
    };
  }

  static shared = new TtsEngineRegistry();
}

module.exports = TtsEngineRegistry;
