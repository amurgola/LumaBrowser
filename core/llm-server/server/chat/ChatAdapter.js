class ChatAdapter {
  constructor({ baseUrl, apiKey, model, request } = {}) {
    this._assertConcrete(new.target);
    if (!baseUrl) throw new Error('ChatAdapter: baseUrl is required');
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = ChatAdapter._nonEmptyStringOrNull(apiKey);
    this.model = ChatAdapter._nonEmptyStringOrNull(model);
    this.request = (request && typeof request === 'object') ? request : null;
  }

  static get protocolId() {
    return 'abstract';
  }

  authHeaders() {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }

  async healthCheck() {
    throw new Error(`${this.constructor.name} must implement healthCheck()`);
  }

  chat(options) {
    throw new Error(`${this.constructor.name} must implement chat(options)`);
  }

  _assertConcrete(target) {
    if (target === ChatAdapter) throw new Error('ChatAdapter is abstract; subclass it.');
  }

  static _nonEmptyStringOrNull(value) {
    return (typeof value === 'string' && value.length > 0) ? value : null;
  }
}

module.exports = ChatAdapter;
