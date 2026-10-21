const crypto = require('crypto');
const OpenAICompatibleProvider = require('../../../llm-service/providers/OpenAICompatibleProvider');
const AnthropicProvider = require('../../../llm-service/providers/AnthropicProvider');
const NonPersistingDb = require('../../../llm-service/service/NonPersistingDb');

class RemoteStream {
  static PROVIDERS = { openai: OpenAICompatibleProvider, anthropic: AnthropicProvider };
  static PEER_ABORT_PATH = '/v1/chat/abort';
  static PEER_ABORT_TIMEOUT_MS = 5000;

  constructor({ db }) {
    this._db = db;
  }

  stream(config, modelId, messages, temperature, hooks, extra = null, tools = null) {
    const provider = this._providerFor(config, modelId);
    const peerTurnId = config.peerManaged ? `turn_${crypto.randomBytes(8).toString('hex')}` : null;
    const session = provider.createChatCompletionStreamSession(
      messages,
      RemoteStream._options(modelId, temperature, extra, peerTurnId, tools),
      RemoteStream._handlers(hooks),
    );
    RemoteStream._settle(session, hooks);
    return {
      abort: () => {
        try { session.abort(); } catch (_) {}
        if (peerTurnId) RemoteStream._abortPeerTurn(provider, peerTurnId);
      },
    };
  }

  _providerFor(config, modelId) {
    const Provider = Object.hasOwn(RemoteStream.PROVIDERS, config.type) ? RemoteStream.PROVIDERS[config.type] : null;
    if (!Provider) throw new Error(`Provider type "${config.type}" is not supported from the LLM tab yet.`);
    const provider = new Provider(NonPersistingDb.wrap(this._db));
    provider.setEndpoint(config.endpoint);
    provider.setApiKey(config.apiKey || null);
    provider.setSelectedModel(modelId);
    return provider;
  }

  static _options(modelId, temperature, extra, peerTurnId, tools = null) {
    const options = {
      temperature,
      model: modelId,
      chatTemplateKwargs: (extra && extra.chatTemplateKwargs) || undefined,
      reasoningBudget: (extra && typeof extra.reasoningBudget === 'number') ? extra.reasoningBudget : undefined,
      sessionId: peerTurnId || undefined,
      max_tokens: (extra && typeof extra.maxReplyTokens === 'number') ? extra.maxReplyTokens : undefined,
    };
    if (Array.isArray(tools) && tools.length) options.tools = tools;
    return options;
  }

  static _handlers(hooks) {
    return {
      onDelta: (text) => hooks.onDelta(text),
      onReasoning: (text) => { if (hooks.onReasoningDelta) hooks.onReasoningDelta(text); },
      onToolCallDelta: (delta) => { if (hooks.onToolCallDelta) hooks.onToolCallDelta(delta); },
      onStatus: (payload) => { if (hooks.onStatus) hooks.onStatus(payload); },
      onUsage: (usage) => hooks.onUsage(usage),
      onError: (msg) => hooks.onError(new Error(typeof msg === 'string' ? msg : (msg && msg.message) || 'stream failed')),
    };
  }

  static _settle(session, hooks) {
    Promise.resolve(session.done).then(
      (res) => {
        if (res && res.success === false) {
          if (res.aborted) return;
          hooks.onError(new Error(res.error || 'stream failed'));
        } else {
          hooks.onDone(RemoteStream._summary(res));
        }
      },
      (err) => hooks.onError(err),
    );
  }

  static _summary(res) {
    const response = (res && res.response) || {};
    const choice = (response.choices && response.choices[0]) || {};
    const summary = { finishReason: choice.finish_reason || 'stop' };
    const calls = RemoteStream._toolCalls(response.toolCalls);
    if (calls.length) summary.toolCalls = calls;
    return summary;
  }

  static _toolCalls(toolCalls) {
    if (!Array.isArray(toolCalls)) return [];
    return toolCalls
      .filter((call) => call && call.function && call.function.name)
      .map((call) => ({ id: call.id || null, name: call.function.name, args: call.function.arguments || '' }));
  }

  static _abortPeerTurn(provider, turnId) {
    if (!provider || typeof provider.postJson !== 'function') return;
    Promise.resolve()
      .then(() => provider.postJson(RemoteStream.PEER_ABORT_PATH, { id: turnId }, { timeout: RemoteStream.PEER_ABORT_TIMEOUT_MS }))
      .catch((e) => console.warn(`[llm-chat] peer abort for ${turnId} failed: ${(e && e.message) || e}`));
  }
}

module.exports = RemoteStream;
