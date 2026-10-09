const LlmTrace = require('../LlmTrace');
const ChatModelRef = require('./ChatModelRef');
const MessageImages = require('./MessageImages');

class ModelDispatcher {
  static UNTAGGED = { conversationId: null, turnId: null, callType: 'side' };

  constructor({ db, localStream, remoteStream }) {
    this._db = db;
    this._local = localStream;
    this._remote = remoteStream;
  }

  async dispatch(modelRef, messages, temperature, hooks, images = [], tools = null, extra = null) {
    const { tag, rest } = ModelDispatcher._splitTrace(extra);
    const runHooks = this._traced(hooks, tag, modelRef, { messages, temperature, tools, extra: rest, images });
    return this._route(modelRef, messages, temperature, runHooks, images, tools, rest);
  }

  static _splitTrace(extra) {
    const { trace: tag, ...rest } = extra || {};
    const clean = extra && Object.keys(rest).length ? rest : (extra && !tag ? extra : null);
    return { tag, rest: clean };
  }

  _traced(hooks, tag, modelRef, request) {
    if (!LlmTrace.enabled(this._db)) return hooks;
    try {
      return LlmTrace.instrument({
        hooks,
        tag: tag || ModelDispatcher.UNTAGGED,
        model: modelRef,
        requestBody: {
          messages: request.messages,
          temperature: request.temperature,
          tools: request.tools || undefined,
          extra: request.extra || undefined,
          images: request.images.length || undefined,
        },
      });
    } catch (_) {
      return hooks;
    }
  }

  _route(modelRef, messages, temperature, hooks, images, tools, extra) {
    if (ChatModelRef.isLocal(modelRef)) {
      return this._local.stream(ChatModelRef.localName(modelRef), messages, temperature, hooks, images, tools, extra);
    }
    const config = this._remoteConfig(modelRef);
    const sendMessages = images.length ? MessageImages.inject(messages, images) : messages;
    return this._remote.stream(config, ChatModelRef.split(modelRef).modelId, sendMessages, temperature, hooks, extra);
  }

  _remoteConfig(modelRef) {
    const parts = ChatModelRef.split(modelRef);
    if (!parts) throw new Error(`Malformed modelRef "${modelRef}"`);
    const configs = this._db.get('llm.providerConfigs', []) || [];
    const config = configs.find((c) => c && c.id === parts.providerId && !c.managedByCore);
    if (!config) throw new Error(`Provider "${parts.providerId}" is no longer configured in settings.`);
    return config;
  }
}

module.exports = ModelDispatcher;
