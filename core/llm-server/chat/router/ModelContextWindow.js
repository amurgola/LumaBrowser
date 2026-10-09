const ChatModelRef = require('./ChatModelRef');

class ModelContextWindow {
  constructor({ llmServerService, db }) {
    this._service = llmServerService;
    this._db = db;
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
    const configs = (this._db && this._db.get('llm.providerConfigs', [])) || [];
    const config = configs.find((c) => c && c.id === parts.providerId);
    const entry = config && Array.isArray(config.models) ? config.models.find((m) => m && m.id === parts.modelId) : null;
    const n = ModelContextWindow._positive(entry && Number(entry.luma_context));
    return n == null ? null : Math.floor(n);
  }

  static _positive(n) {
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}

module.exports = ModelContextWindow;
