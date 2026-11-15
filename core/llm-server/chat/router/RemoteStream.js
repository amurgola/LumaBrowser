const crypto = require('crypto');
const OpenAICompatibleProvider = require('../../../llm-service/providers/OpenAICompatibleProvider');
const AnthropicProvider = require('../../../llm-service/providers/AnthropicProvider');
const NonPersistingDb = require('../../../llm-service/service/NonPersistingDb');
const RequestSettings = require('./RequestSettings');

class RemoteStream {
  static PROVIDERS = { openai: OpenAICompatibleProvider, anthropic: AnthropicProvider };
  static PEER_ABORT_PATH = '/v1/chat/abort';
  static PEER_ABORT_TIMEOUT_MS = 5000;
  static PEER_PIN_TEMPERATURE = 'luma_pin_temperature';
  static PEER_AGENT_TURN = 'luma_agent_turn';
  static PEER_COMPLEXITY = 'luma_complexity';
  static PEER_CALL_TYPE = 'luma_call_type';

  constructor({ db }) {
    this._db = db;
  }

  stream(config, modelId, messages, temperature, hooks, extra = null, tools = null) {
    const provider = this._providerFor(config, modelId);
    const peerTurnId = config.peerManaged ? `turn_${crypto.randomBytes(8).toString('hex')}` : null;
    const session = provider.createChatCompletionStreamSession(
      messages,
      RemoteStream._options(modelId, temperature, extra, peerTurnId, tools, !!config.peerManaged, RemoteStream._hostWindowKnown(config, modelId)),
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

  static _options(modelId, temperature, extra, peerTurnId, tools = null, peer = false, hostWindowKnown = false) {
    const options = {
      temperature,
      model: modelId,
      chatTemplateKwargs: (extra && extra.chatTemplateKwargs) || undefined,
      reasoningBudget: (extra && typeof extra.reasoningBudget === 'number') ? extra.reasoningBudget : undefined,
      response_format: (extra && extra.responseFormat && typeof extra.responseFormat === 'object') ? extra.responseFormat : undefined,
      sessionId: peerTurnId || undefined,
      max_tokens: RemoteStream._replyCap(extra, peer && hostWindowKnown),
    };
    if (peer) Object.assign(options, RemoteStream._peerOptions(extra));
    if (Array.isArray(tools) && tools.length) options.tools = tools;
    return options;
  }

  static _replyCap(extra, withLoopCap = false) {
    const mode = extra && extra.samplerOverrides && extra.samplerOverrides.max_tokens;
    const loop = withLoopCap ? (extra && extra.maxTokens) : undefined;
    const caps = [extra && extra.maxReplyTokens, mode, loop].filter((n) => typeof n === 'number' && n > 0);
    return caps.length ? Math.min(...caps) : undefined;
  }

  static _hostWindowKnown(config, modelId) {
    if (!config || !config.peerManaged || !Array.isArray(config.models)) return false;
    const model = config.models.find((m) => m && m.id === modelId);
    return !!(model && Number(model.luma_context) > 0);
  }

  static _peerOptions(extra) {
    const out = {};
    const samplers = extra && extra.samplerOverrides && typeof extra.samplerOverrides === 'object' ? { ...extra.samplerOverrides } : null;
    if (samplers) {
      delete samplers.max_tokens;
      if (Object.keys(samplers).length) out.samplerOverrides = samplers;
    }
    if (extra && extra.pinTemperature === true) out[RemoteStream.PEER_PIN_TEMPERATURE] = true;
    if (extra && extra.agentTurn === true) out[RemoteStream.PEER_AGENT_TURN] = true;
    if (extra && (extra.complexity === 'heavy' || extra.complexity === 'light')) out[RemoteStream.PEER_COMPLEXITY] = extra.complexity;
    if (extra && RequestSettings.HOUSEKEEPING.has(extra.callType)) out[RemoteStream.PEER_CALL_TYPE] = extra.callType;
    return out;
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
