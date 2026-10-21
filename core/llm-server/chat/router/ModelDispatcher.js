const LlmTrace = require('../LlmTrace');
const ChatModelRef = require('./ChatModelRef');
const MessageImages = require('./MessageImages');
const RequestSettings = require('./RequestSettings');

class ModelDispatcher {
  static UNTAGGED = { conversationId: null, turnId: null, callType: 'side' };

  constructor({ db, localStream, remoteStream, modelSettings = null }) {
    this._db = db;
    this._local = localStream;
    this._remote = remoteStream;
    this._settings = modelSettings;
  }

  async dispatch(modelRef, messages, temperature, hooks, images = [], tools = null, extra = null) {
    const { tag, rest } = ModelDispatcher._splitTrace(extra);
    const target = this._target(modelRef, rest);
    const applied = RequestSettings.apply({ settings: target.settings, temperature, extra: target.extra, callType: tag && tag.callType });
    const runHooks = this._traced(hooks, tag, modelRef, { messages, temperature: applied.temperature, tools, extra: applied.extra, images });
    return this._route(target.ref, messages, applied.temperature, runHooks, images, tools, applied.extra);
  }

  _target(modelRef, extra) {
    const { settingsRef, ...rest } = extra || {};
    const clean = settingsRef === undefined ? extra : (Object.keys(rest).length ? rest : null);
    if (!this._settings) return { ref: modelRef, settings: null, extra: clean };
    const routed = this._settings.resolve(modelRef);
    const settings = settingsRef && settingsRef !== modelRef ? this._settings.resolve(settingsRef).settings : routed.settings;
    return { ref: routed.ref, settings, extra: clean };
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
    return this._remote.stream(config, ChatModelRef.split(modelRef).modelId, sendMessages, temperature, hooks, extra, tools);
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
