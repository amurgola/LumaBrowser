const axios = require('axios');

class BaseLlmProvider {
  static DEFAULT_CAPABILITIES = Object.freeze({
    supportsTools: false,
    supportsCachePrefix: false,
    supportsReasoningStream: false,
    defaultMaxTokens: null,
  });
  static ABSTRACT_METHODS = ['_buildHeaders', 'testConnection', 'fetchModels', 'sendChatCompletion', 'createChatCompletionStreamSession'];
  static CANCELLED_MESSAGE = 'Streaming request cancelled';

  static get capabilities() {
    return BaseLlmProvider.DEFAULT_CAPABILITIES;
  }

  get capabilities() {
    return this.constructor.capabilities;
  }

  constructor(db, { keyPrefix, defaultEndpoint = '' } = {}) {
    if (!keyPrefix) throw new Error('BaseLlmProvider requires a keyPrefix');
    this.db = db;
    this._keyPrefix = keyPrefix;
    this._defaultEndpoint = defaultEndpoint;
    this._configWrites = 0;
    this.loadConfig();
  }

  _buildHeaders(extra = {}) { throw this._notImplemented('_buildHeaders'); }
  async testConnection() { throw this._notImplemented('testConnection'); }
  async fetchModels() { throw this._notImplemented('fetchModels'); }
  async sendChatCompletion(messages, options = {}) { throw this._notImplemented('sendChatCompletion'); }
  createChatCompletionStreamSession(messages, options = {}, handlers = {}) { throw this._notImplemented('createChatCompletionStreamSession'); }

  static apiErrorMessage(error, fallback) {
    return error?.response?.data?.error?.message || error?.message || fallback;
  }

  loadConfig() {
    this.endpoint = this.db.get(this._key('endpoint'), this._defaultEndpoint);
    this.selectedModel = this.db.get(this._key('selectedModel'), null);
    this.models = this.db.get(this._key('models'), []);
    this.apiKey = this.db.get(this._key('apiKey'), null);
  }

  saveConfig() {
    for (const [field, value] of Object.entries(this.getConfig())) this.db.set(this._key(field), value);
    this._configWrites++;
  }

  async withTemporaryConfig(overrides, fn) {
    const snapshot = this.getConfig();
    const writesBefore = this._configWrites;
    this._applyOverrides(overrides || {});
    try {
      return await fn();
    } finally {
      Object.assign(this, snapshot);
      if (this._configWrites !== writesBefore) this.saveConfig();
    }
  }

  setEndpoint(endpoint) { this.endpoint = endpoint; this.saveConfig(); }
  getEndpoint() { return this.endpoint; }
  setSelectedModel(modelId) { this.selectedModel = modelId; this.saveConfig(); }
  getSelectedModel() { return this.selectedModel; }
  setApiKey(apiKey) { this.apiKey = apiKey || null; this.saveConfig(); }
  getApiKey() { return this.apiKey; }
  setModels(models) { this.models = Array.isArray(models) ? models : []; this.saveConfig(); }
  getModels() { return this.models; }

  getConfig() {
    return { endpoint: this.endpoint, selectedModel: this.selectedModel, models: this.models, apiKey: this.apiKey };
  }

  _key(field) {
    return `${this._keyPrefix}.${field}`;
  }

  _applyOverrides({ endpoint, apiKey }) {
    if (endpoint !== undefined) this.endpoint = endpoint;
    if (apiKey) this.apiKey = apiKey;
  }

  _buildUrl(path) {
    return `${(this.endpoint || '').replace(/\/$/, '')}${path}`;
  }

  _httpAgents() {
    return {};
  }

  _configError({ apiKey = false } = {}) {
    if (!this.endpoint) return 'No endpoint configured';
    if (apiKey && !this.apiKey) return 'No API key configured';
    return null;
  }

  async _getJson(path, { timeout = 10000, fallbackError = 'Request failed' } = {}) {
    try {
      const response = await axios.get(this._buildUrl(path), { timeout, headers: this._buildHeaders(), ...this._httpAgents() });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: BaseLlmProvider.apiErrorMessage(error, fallbackError) };
    }
  }

  _streamSession(runner, { onError, fallbackError = 'Failed to stream chat completion' } = {}) {
    const controller = new AbortController();
    let aborted = false;
    const done = (async () => {
      try {
        return await runner({ signal: controller.signal, isAborted: () => aborted });
      } catch (error) {
        return BaseLlmProvider._streamFailure(error, aborted, fallbackError, onError);
      }
    })();
    return { abort: () => { aborted = true; controller.abort(); }, done };
  }

  static _streamFailure(error, aborted, fallbackError, onError) {
    const isCanceled = aborted || error?.code === 'ERR_CANCELED';
    const message = isCanceled ? BaseLlmProvider.CANCELLED_MESSAGE : BaseLlmProvider.apiErrorMessage(error, fallbackError);
    if (typeof onError === 'function') {
      try { onError(message); } catch (_) {}
    }
    return { success: false, error: message, aborted: isCanceled };
  }

  _openAiResponse({
    id = null,
    idPrefix = 'chatcmpl',
    model = null,
    role = 'assistant',
    content = '',
    finishReason = 'stop',
    usage = null,
    message = null,
    extra = null,
  } = {}) {
    return {
      id: id || `${idPrefix}-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || this.selectedModel,
      choices: [{ index: 0, message: message || { role, content }, finish_reason: finishReason }],
      usage: usage || undefined,
      ...(extra && typeof extra === 'object' ? extra : null),
    };
  }

  _notImplemented(method) {
    return new Error(`${this.constructor.name} must implement ${method}()`);
  }
}

module.exports = BaseLlmProvider;
