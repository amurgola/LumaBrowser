const axios = require('axios');
const BaseLlmProvider = require('./BaseLlmProvider');
const StreamedErrorBody = require('./StreamedErrorBody');
const AnthropicModelLimits = require('./anthropic/AnthropicModelLimits');
const AnthropicRequestBody = require('./anthropic/AnthropicRequestBody');
const AnthropicResponseMapper = require('./anthropic/AnthropicResponseMapper');
const AnthropicStreamReader = require('./anthropic/AnthropicStreamReader');

class AnthropicProvider extends BaseLlmProvider {
  static KEY_PREFIX = 'anthropic';
  static DEFAULT_ENDPOINT = 'https://api.anthropic.com';
  static API_VERSION = '2023-06-01';
  static MESSAGES_PATH = '/v1/messages';
  static MODELS_PATH = '/v1/models';
  static SEND_TIMEOUT_MS = 30000;
  static STREAM_TIMEOUT_MS = 120000;

  constructor(db) {
    super(db, { keyPrefix: AnthropicProvider.KEY_PREFIX, defaultEndpoint: AnthropicProvider.DEFAULT_ENDPOINT });
  }

  static get capabilities() {
    return {
      supportsTools: false,
      supportsCachePrefix: true,
      supportsReasoningStream: true,
      defaultMaxTokens: AnthropicModelLimits.DEFAULT_MAX_TOKENS,
    };
  }

  _buildHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', 'anthropic-version': AnthropicProvider.API_VERSION, ...extra };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    return headers;
  }

  async testConnection() {
    const configError = this._configError({ apiKey: true });
    if (configError) return { success: false, error: configError };
    return this._getJson(AnthropicProvider.MODELS_PATH, { timeout: 5000, fallbackError: 'Failed to connect to Anthropic' });
  }

  async fetchModels() {
    const configError = this._configError({ apiKey: true });
    if (configError) return { success: false, error: configError };
    const res = await this._getJson(AnthropicProvider.MODELS_PATH, { fallbackError: 'Failed to fetch models' });
    if (!res.success) return res;
    if (!Array.isArray(res.data?.data)) return { success: false, error: 'Invalid response format from Anthropic' };
    this.models = res.data.data.map(AnthropicProvider._toModelEntry);
    this.saveConfig();
    return { success: true, models: this.models };
  }

  async sendChatCompletion(messages, options = {}) {
    const refusal = this._requestRefusal(options);
    if (refusal) return refusal;
    try {
      const response = await this._post(messages, options, { stream: false });
      return { success: true, response: this._completionFromMessage(response.data) };
    } catch (error) {
      return { success: false, error: BaseLlmProvider.apiErrorMessage(error, 'Failed to send chat completion') };
    }
  }

  createChatCompletionStreamSession(messages, options = {}, handlers = {}) {
    return this._streamSession(async ({ signal }) => {
      const refusal = this._requestRefusal(options);
      if (refusal) return refusal;
      const response = await this._post(messages, options, { stream: true, signal });
      const reader = new AnthropicStreamReader(handlers, this._modelFor(options));
      await reader.read(response.data);
      if (reader.error) throw new Error(reader.error);
      return { success: true, response: this._completionFromStream(reader) };
    }, { onError: handlers.onError, fallbackError: 'Failed to stream chat completion' });
  }

  _requestRefusal(options) {
    if (!this.endpoint) return { success: false, error: 'No endpoint configured' };
    if (!this._modelFor(options)) return { success: false, error: 'No model selected' };
    return null;
  }

  _modelFor(options) {
    return options.model || this.selectedModel;
  }

  _post(messages, options, { stream, signal }) {
    const body = AnthropicRequestBody.build(messages, options, this._modelFor(options), stream);
    return AnthropicProvider._postWithCeilingRetry(this._buildUrl(AnthropicProvider.MESSAGES_PATH), body, this._axiosConfig(options, { stream, signal }));
  }

  _axiosConfig(options, { stream, signal }) {
    if (!stream) return { timeout: options.timeout || AnthropicProvider.SEND_TIMEOUT_MS, headers: this._buildHeaders() };
    return {
      timeout: options.timeout || AnthropicProvider.STREAM_TIMEOUT_MS,
      responseType: 'stream',
      signal,
      headers: this._buildHeaders({ Accept: 'text/event-stream' }),
    };
  }

  static async _postWithCeilingRetry(url, body, config) {
    try {
      return await axios.post(url, body, config);
    } catch (error) {
      await StreamedErrorBody.materialize(error);
      const ceiling = AnthropicProvider._ceilingFromError(error);
      if (!ceiling || ceiling >= body.max_tokens) throw error;
      AnthropicModelLimits.learnCeiling(body.model, ceiling);
      return axios.post(url, { ...body, max_tokens: ceiling }, config);
    }
  }

  static _ceilingFromError(error) {
    if (error.response?.status !== 400) return null;
    return AnthropicModelLimits.ceilingFromRejection(error.response.data?.error?.message);
  }

  _completionFromMessage(message) {
    const content = AnthropicResponseMapper.textOf(message.content);
    return this._openAiResponse({
      id: message.id,
      idPrefix: 'msg',
      model: message.model,
      content,
      message: AnthropicResponseMapper.messageWithReasoning(content, AnthropicResponseMapper.thinkingOf(message.content)),
      finishReason: AnthropicResponseMapper.mapStopReason(message.stop_reason),
      usage: message.usage ? AnthropicResponseMapper.usageFrom(message.usage, message.usage) : null,
    });
  }

  _completionFromStream(reader) {
    return this._openAiResponse({
      id: reader.id,
      idPrefix: 'msg',
      model: reader.model,
      content: reader.content,
      message: AnthropicResponseMapper.messageWithReasoning(reader.content, reader.reasoning),
      finishReason: reader.finishReason,
      usage: reader.usage,
    });
  }

  static _toModelEntry(model) {
    return { id: model.id, object: model.type || 'model', created: model.created_at || null, owned_by: 'anthropic' };
  }
}

module.exports = AnthropicProvider;
