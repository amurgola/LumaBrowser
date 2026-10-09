const axios = require('axios');
const http = require('http');
const https = require('https');
const BaseLlmProvider = require('./BaseLlmProvider');
const PinnedTls = require('../../network-sharing/tls/PinnedTls');
const OpenAiRequestBody = require('./openai/OpenAiRequestBody');
const OpenAiStreamReader = require('./openai/OpenAiStreamReader');
const SessionAffinity = require('./openai/SessionAffinity');

class OpenAICompatibleProvider extends BaseLlmProvider {
  static KEY_PREFIX = 'lmStudio';
  static COMPLETIONS_PATH = '/v1/chat/completions';
  static MODELS_PATH = '/v1/models';
  static SEND_TIMEOUT_MS = 30000;
  static STREAM_TIMEOUT_MS = 120000;
  static KEEPALIVE_HTTP_AGENT = new http.Agent({ keepAlive: true, keepAliveMsecs: 30000 });
  static KEEPALIVE_HTTPS_AGENT = new https.Agent({ keepAlive: true, keepAliveMsecs: 30000 });

  constructor(db) {
    super(db, { keyPrefix: OpenAICompatibleProvider.KEY_PREFIX, defaultEndpoint: '' });
    this.managedLocal = false;
  }

  static get capabilities() {
    return {
      supportsTools: true,
      supportsCachePrefix: true,
      supportsReasoningStream: true,
      defaultMaxTokens: null,
    };
  }

  setManagedLocal(isLocal) {
    this.managedLocal = !!isLocal;
  }

  _buildHeaders(extra = {}) {
    const headers = { Accept: 'application/json', ...extra };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    return headers;
  }

  async postJson(path, body, { timeout = 5000 } = {}) {
    if (!this.endpoint) throw new Error('No endpoint configured');
    const res = await axios.post(this._buildUrl(path), body || {}, {
      timeout,
      headers: this._buildHeaders({ 'Content-Type': 'application/json' }),
      ...this._httpAgents(),
    });
    return res.data;
  }

  _httpAgents() {
    const pinned = OpenAICompatibleProvider._pinnedAgent(this.endpoint);
    return {
      httpAgent: OpenAICompatibleProvider.KEEPALIVE_HTTP_AGENT,
      httpsAgent: pinned || OpenAICompatibleProvider.KEEPALIVE_HTTPS_AGENT,
    };
  }

  static _pinnedAgent(endpoint) {
    try {
      return PinnedTls.agentFor(endpoint);
    } catch (_) {
      return null;
    }
  }

  async testConnection() {
    const configError = this._configError();
    if (configError) return { success: false, error: configError };
    return this._getJson(OpenAICompatibleProvider.MODELS_PATH, { timeout: 5000, fallbackError: 'Failed to connect to endpoint' });
  }

  async fetchModels() {
    const configError = this._configError();
    if (configError) return { success: false, error: configError };
    const res = await this._getJson(OpenAICompatibleProvider.MODELS_PATH, { fallbackError: 'Failed to fetch models' });
    if (!res.success) return res;
    if (!Array.isArray(res.data?.data)) return { success: false, error: 'Invalid response format from endpoint' };
    this.models = res.data.data.map(OpenAICompatibleProvider._toModelEntry);
    this.saveConfig();
    return { success: true, models: this.models };
  }

  async sendChatCompletion(messages, options = {}) {
    if (!this.endpoint) return { success: false, error: 'No endpoint configured' };
    const body = this._buildBody(messages, options, false);
    if (!body) return { success: false, error: 'No model selected' };
    try {
      const response = await axios.post(this._buildUrl(OpenAICompatibleProvider.COMPLETIONS_PATH), body, this._postConfig(options, false));
      return { success: true, response: response.data };
    } catch (error) {
      return { success: false, error: BaseLlmProvider.apiErrorMessage(error, 'Failed to send chat completion request') };
    }
  }

  createChatCompletionStreamSession(messages, options = {}, handlers = {}) {
    return this._streamSession(async ({ signal }) => {
      if (!this.endpoint) return { success: false, error: 'No endpoint configured' };
      const body = this._buildBody(messages, options, true);
      if (!body) return { success: false, error: 'No model selected' };
      const response = await axios.post(this._buildUrl(OpenAICompatibleProvider.COMPLETIONS_PATH), body, {
        ...this._postConfig(options, true),
        signal,
      });
      const reader = new OpenAiStreamReader(handlers, { model: body.model, repetitionGuard: options.repetitionGuard !== false });
      await reader.read(response.data);
      return { success: true, response: this._completionFromStream(reader, reader.finalizeToolCalls()) };
    }, { onError: handlers.onError, fallbackError: 'Failed to stream chat completion request' });
  }

  _buildBody(messages, options, streaming) {
    return OpenAiRequestBody.build(messages, options, {
      streaming,
      endpoint: this.endpoint,
      managedLocal: this.managedLocal,
      selectedModel: this.selectedModel,
    });
  }

  _postConfig(options, streaming) {
    const accept = streaming ? { Accept: 'text/event-stream, application/json' } : {};
    return {
      timeout: options.timeout || (streaming ? OpenAICompatibleProvider.STREAM_TIMEOUT_MS : OpenAICompatibleProvider.SEND_TIMEOUT_MS),
      ...(streaming ? { responseType: 'stream' } : {}),
      headers: this._buildHeaders({ 'Content-Type': 'application/json', ...accept, ...SessionAffinity.headers(options.sessionId) }),
      ...this._httpAgents(),
    };
  }

  _completionFromStream(reader, toolCalls) {
    return this._openAiResponse({
      id: reader.id,
      model: reader.model,
      message: OpenAICompatibleProvider._assistantMessage(reader, toolCalls),
      finishReason: reader.finishReason,
      usage: reader.usage,
      extra: { toolCalls, stopReason: reader.stopReason },
    });
  }

  static _assistantMessage(reader, toolCalls) {
    const message = { role: reader.role, content: reader.content };
    if (toolCalls.length > 0) message.tool_calls = toolCalls.map(({ id, type, function: fn }) => ({ id, type, function: fn }));
    return message;
  }

  static _toModelEntry(model) {
    return { id: model.id, object: model.object, created: model.created, owned_by: model.owned_by };
  }
}

module.exports = OpenAICompatibleProvider;
