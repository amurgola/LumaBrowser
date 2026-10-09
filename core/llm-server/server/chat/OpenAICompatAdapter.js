const axios = require('axios');
const ChatAdapter = require('./ChatAdapter');
const RequestProfile = require('./RequestProfile');
const OpenAiChatStream = require('./OpenAiChatStream');
const OpenAiChatRequest = require('./OpenAiChatRequest');
const OpenAiChatBody = require('../../../shared/llm/OpenAiChatBody');

class OpenAICompatAdapter extends ChatAdapter {
  static HEALTH_TIMEOUT_MS = 1500;

  static get protocolId() {
    return 'openai-compat';
  }

  async healthCheck() {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, {
        timeout: OpenAICompatAdapter.HEALTH_TIMEOUT_MS,
        headers: this.authHeaders(),
      });
      return res.status === 200;
    } catch (_) {
      return false;
    }
  }

  chat(options) {
    OpenAICompatAdapter._requireMessages(options);
    const controller = new AbortController();
    const stream = new OpenAiChatStream(options, () => controller.abort());
    this._startRequest(this._buildBody(options), controller, stream);
    return { abort: () => stream.abort() };
  }

  _buildBody({ messages, temperature, maxTokens, tools, chatTemplateKwargs, reasoningBudget, samplerOverrides, familySamplerDefaults }) {
    const body = OpenAiChatBody.build({
      messages,
      stream: true,
      local: true,
      temperature,
      maxTokens,
      tools,
      familySamplerDefaults,
      samplerOverrides,
      chatTemplateKwargs,
      reasoningBudget,
    });
    if (this.model) body.model = this.model;
    return RequestProfile.apply(body, this.request);
  }

  _startRequest(body, controller, stream) {
    new OpenAiChatRequest({
      url: `${this.baseUrl}/v1/chat/completions`,
      body,
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...this.authHeaders() },
      signal: controller.signal,
      stream,
    }).start();
  }

  static _requireMessages(options) {
    const messages = options && options.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('chat: messages is required');
  }
}

module.exports = OpenAICompatAdapter;
