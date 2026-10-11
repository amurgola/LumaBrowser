const ChatModelRef = require('./ChatModelRef');
const BackendContextProbe = require('./BackendContextProbe');

class ModelContextWindow {
  static FALLBACK_WINDOW = 4096;

  constructor({ llmServerService, db, probe = new BackendContextProbe() }) {
    this._service = llmServerService;
    this._db = db;
    this._probe = probe;
  }

  async resolve(modelRef, options = {}) {
    options.signal?.throwIfAborted();
    if (ChatModelRef.isLocal(modelRef)) return this._result(this.localPerSlot(), 'local');
    const parts = ChatModelRef.split(modelRef);
    const config = this._config(parts?.providerId);
    if (!config || !parts?.modelId) return this._result(null);
    const detected = await this._probe.detect(config, parts.modelId, options);
    options.signal?.throwIfAborted();
    const custom = this._custom(config, parts.modelId);
    if (detected) {
      // A manual budget may lower a detected allocation, never enlarge it.
      if (custom && custom < detected.tokens) return this._result(custom, 'custom');
      return this._result(detected.tokens, detected.source);
    }
    return this._result(custom, 'custom');
  }

  _result(tokens, source) {
    return Object.freeze(tokens ? { tokens, source, estimated: false } : {
      tokens: ModelContextWindow.FALLBACK_WINDOW, source: 'fallback', estimated: true,
      notice: 'Backend context is unknown. Using a 4,096-token safety budget; set this model\'s context budget in provider settings.',
    });
  }

  budgetFor(modelRef) {
    return this.forRef(modelRef) || ModelContextWindow.FALLBACK_WINDOW;
  }

  _config(id) {
    const configs = this._db?.get('llm.providerConfigs', []);
    return Array.isArray(configs) ? configs.find((c) => c?.id === id) : null;
  }

  _custom(config, id) {
    return config.contextWindows && Object.hasOwn(config.contextWindows, id)
      ? BackendContextProbe.tokens(config.contextWindows[id]) : null;
  }

  forRef(modelRef) {
    if (typeof modelRef !== 'string') return null;
    if (ChatModelRef.isLocal(modelRef)) return this.localPerSlot();
    try {
      return this._advertised(modelRef);
    } catch (_) {
      return null;
    }
  }

  localPerSlot() {
    try {
      const effective = this._service.getEffectiveContext();
      return ModelContextWindow._positive(effective && Number(effective.ctxPerSlot));
    } catch (_) {
      return null;
    }
  }

  _advertised(modelRef) {
    const parts = ChatModelRef.split(modelRef);
    if (!parts || !parts.providerId) return null;
    const config = this._config(parts.providerId);
    if (!config) return null;
    const custom = this._custom(config, parts.modelId);
    const entry = config && Array.isArray(config.models) ? config.models.find((m) => m && m.id === parts.modelId) : null;
    const n = ModelContextWindow._positive(entry && Number(entry.luma_context));
    const advertised = n == null ? null : Math.floor(n);
    return custom && advertised ? Math.min(custom, advertised) : custom || advertised;
  }

  static _positive(n) {
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}

module.exports = ModelContextWindow;
